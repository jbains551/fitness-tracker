import { verifyToken } from '@clerk/backend';

export async function getUserIdFromRequest(req) {
  const auth = req.headers.authorization || req.headers.Authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error('CLERK_SECRET_KEY not configured');
  }

  try {
    const payload = await verifyToken(token, { secretKey });
    return payload.sub || null;
  } catch (err) {
    console.error('clerk verify failed:', err?.message || err);
    return null;
  }
}
