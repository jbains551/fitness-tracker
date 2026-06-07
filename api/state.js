import { Redis } from '@upstash/redis';
import { getUserIdFromRequest } from './_clerk.js';

export const config = { runtime: 'nodejs' };

const MAX_BODY_BYTES = 256 * 1024;
const LEGACY_TOKEN_PATTERN = /^[a-zA-Z0-9_-]{16,128}$/;

function getRedis() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function send(res, status, body) {
  res.status(status).setHeader('content-type', 'application/json').end(JSON.stringify(body));
}

export default async function handler(req, res) {
  const redis = getRedis();
  if (!redis) {
    return send(res, 503, {
      error: 'sync not configured',
      hint: 'Install Upstash Redis from the Vercel Marketplace and redeploy.',
    });
  }

  let userId;
  try {
    userId = await getUserIdFromRequest(req);
  } catch (err) {
    return send(res, 500, { error: 'auth misconfigured', detail: String(err?.message || err) });
  }

  if (userId) {
    return handleAuthed(req, res, redis, userId);
  }

  if (req.method === 'GET') {
    const token = req.query.token?.toString();
    if (token && LEGACY_TOKEN_PATTERN.test(token)) {
      return handleLegacyGet(req, res, redis, token);
    }
  }

  return send(res, 401, { error: 'unauthorized' });
}

async function handleAuthed(req, res, redis, userId) {
  const key = `ft:state:user:${userId}`;

  if (req.method === 'GET') {
    try {
      const stored = await redis.get(key);
      if (!stored) return send(res, 200, { state: null, version: 0 });
      return send(res, 200, stored);
    } catch (err) {
      console.error('redis get error:', err);
      return send(res, 500, { error: 'redis error', detail: String(err?.message || err) });
    }
  }

  if (req.method === 'POST') {
    const state = req.body?.state;
    if (state == null || typeof state !== 'object') {
      return send(res, 400, { error: 'state required' });
    }

    const payload = JSON.stringify(state);
    if (payload.length > MAX_BODY_BYTES) {
      return send(res, 413, { error: 'state too large', bytes: payload.length, limit: MAX_BODY_BYTES });
    }

    const version = Date.now();
    try {
      await redis.set(key, { state, version });
      return send(res, 200, { ok: true, version });
    } catch (err) {
      console.error('redis set error:', err);
      return send(res, 500, { error: 'redis error', detail: String(err?.message || err) });
    }
  }

  return send(res, 405, { error: 'method not allowed' });
}

async function handleLegacyGet(req, res, redis, token) {
  const key = `ft:state:${token}`;
  try {
    const stored = await redis.get(key);
    if (!stored) return send(res, 200, { state: null, version: 0, legacy: true });
    return send(res, 200, { ...stored, legacy: true });
  } catch (err) {
    console.error('redis legacy get error:', err);
    return send(res, 500, { error: 'redis error', detail: String(err?.message || err) });
  }
}
