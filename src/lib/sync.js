import { useCallback, useEffect, useRef, useState } from 'react';

const TOKEN_KEY = 'ft_sync_token';

export function loadToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function saveToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

export function generateToken() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '');
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36) + Math.random().toString(36).slice(2);
}

const TOKEN_PATTERN = /^[a-zA-Z0-9_-]{16,128}$/;
export function isValidToken(t) {
  return typeof t === 'string' && TOKEN_PATTERN.test(t.trim());
}

export function useSync({ store }) {
  const [token, setTokenState] = useState(loadToken);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const lastPushedRef = useRef(null);
  const lastVersionRef = useRef(0);
  const debounceTimerRef = useRef(null);
  const initialPullDoneRef = useRef(false);
  const inFlightRef = useRef(0);

  const setToken = useCallback((next) => {
    saveToken(next);
    setTokenState(next);
    initialPullDoneRef.current = false;
    lastPushedRef.current = null;
    lastVersionRef.current = 0;
    setError(null);
    setStatus('idle');
  }, []);

  const pull = useCallback(async () => {
    if (!token || !isValidToken(token)) return;
    inFlightRef.current++;
    setStatus('syncing');
    try {
      const res = await fetch(`/api/state?token=${encodeURIComponent(token)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const body = await res.json();
      if (body.state) {
        store.replaceState(body.state);
        lastPushedRef.current = JSON.stringify(body.state);
        lastVersionRef.current = body.version || 0;
      }
      initialPullDoneRef.current = true;
      setError(null);
      setLastSyncedAt(Date.now());
      setStatus('ok');
    } catch (err) {
      setError(err.message || String(err));
      setStatus('error');
    } finally {
      inFlightRef.current--;
    }
  }, [token, store]);

  const pushNow = useCallback(async () => {
    if (!token || !isValidToken(token)) return;
    if (!initialPullDoneRef.current) return;
    const serialized = JSON.stringify(store.state);
    if (serialized === lastPushedRef.current) return;
    inFlightRef.current++;
    setStatus('syncing');
    try {
      const res = await fetch('/api/state', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, state: store.state }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const body = await res.json();
      lastPushedRef.current = serialized;
      lastVersionRef.current = body.version || Date.now();
      setError(null);
      setLastSyncedAt(Date.now());
      setStatus('ok');
    } catch (err) {
      setError(err.message || String(err));
      setStatus('error');
    } finally {
      inFlightRef.current--;
    }
  }, [token, store]);

  useEffect(() => {
    if (token) pull();
  }, [token, pull]);

  useEffect(() => {
    if (!token) return;
    const onFocus = () => pull();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') pull();
    });
    return () => {
      window.removeEventListener('focus', onFocus);
    };
  }, [token, pull]);

  useEffect(() => {
    if (!token || !initialPullDoneRef.current) return;
    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      pushNow();
    }, 1500);
    return () => clearTimeout(debounceTimerRef.current);
  }, [store.state, token, pushNow]);

  return {
    token,
    setToken,
    status,
    error,
    lastSyncedAt,
    pull,
    pushNow,
  };
}
