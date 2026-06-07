import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';

const LEGACY_TOKEN_KEY = 'ft_sync_token';
const MIGRATED_FLAG_KEY_PREFIX = 'ft_migrated_for_';

export function useSync({ store }) {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();

  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const lastPushedRef = useRef(null);
  const lastVersionRef = useRef(0);
  const debounceTimerRef = useRef(null);
  const initialPullDoneRef = useRef(false);

  const authedFetch = useCallback(
    async (url, init = {}) => {
      const token = await getToken();
      return fetch(url, {
        ...init,
        headers: {
          ...(init.headers || {}),
          authorization: `Bearer ${token}`,
        },
      });
    },
    [getToken]
  );

  const pushNow = useCallback(async () => {
    if (!isSignedIn) return;
    const serialized = JSON.stringify(store.state);
    if (serialized === lastPushedRef.current) return;
    setStatus('syncing');
    try {
      const res = await authedFetch('/api/state', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ state: store.state }),
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
    }
  }, [authedFetch, isSignedIn, store]);

  const runMigration = useCallback(async () => {
    if (!userId) return null;
    const migratedKey = MIGRATED_FLAG_KEY_PREFIX + userId;
    if (localStorage.getItem(migratedKey)) return null;

    const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEY);
    let legacyState = null;
    if (legacyToken) {
      try {
        const res = await fetch(`/api/state?token=${encodeURIComponent(legacyToken)}`);
        if (res.ok) {
          const body = await res.json();
          if (body.state) legacyState = body.state;
        }
      } catch {}
    }

    const localState = !isStateEmpty(store.state) ? store.state : null;
    const winner = pickRicherState(localState, legacyState);

    localStorage.setItem(migratedKey, String(Date.now()));
    if (legacyToken) localStorage.removeItem(LEGACY_TOKEN_KEY);

    return winner;
  }, [userId, store]);

  const pull = useCallback(async () => {
    if (!isSignedIn) return;
    setStatus('syncing');
    try {
      const res = await authedFetch('/api/state');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const body = await res.json();

      if (body.state) {
        store.replaceState(body.state);
        lastPushedRef.current = JSON.stringify(body.state);
        lastVersionRef.current = body.version || 0;
        initialPullDoneRef.current = true;
        setError(null);
        setLastSyncedAt(Date.now());
        setStatus('ok');
        return;
      }

      const migrated = await runMigration();
      if (migrated) {
        store.replaceState(migrated);
        initialPullDoneRef.current = true;
        await pushNow();
      } else {
        initialPullDoneRef.current = true;
        setError(null);
        setLastSyncedAt(Date.now());
        setStatus('ok');
      }
    } catch (err) {
      setError(err.message || String(err));
      setStatus('error');
    }
  }, [authedFetch, isSignedIn, store, runMigration, pushNow]);

  useEffect(() => {
    if (isLoaded && isSignedIn) pull();
  }, [isLoaded, isSignedIn, pull]);

  useEffect(() => {
    if (!isSignedIn) return;
    const onFocus = () => pull();
    const onVisible = () => {
      if (document.visibilityState === 'visible') pull();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [isSignedIn, pull]);

  useEffect(() => {
    if (!isSignedIn || !initialPullDoneRef.current) return;
    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      pushNow();
    }, 1500);
    return () => clearTimeout(debounceTimerRef.current);
  }, [store.state, isSignedIn, pushNow]);

  return {
    status,
    error,
    lastSyncedAt,
    isSignedIn: !!isSignedIn,
  };
}

function isStateEmpty(state) {
  if (!state) return true;
  if (Object.keys(state.foods || {}).length > 0) return false;
  if (Object.keys(state.workouts || {}).length > 0) return false;
  if ((state.customFoods || []).length > 0) return false;
  if (Object.keys(state.body?.measurements || {}).length > 0) return false;
  return true;
}

function scoreState(state) {
  if (!state) return -1;
  return (
    Object.keys(state.foods || {}).length +
    Object.keys(state.workouts || {}).length +
    (state.customFoods || []).length +
    Object.keys(state.body?.measurements || {}).length
  );
}

function pickRicherState(a, b) {
  if (!a && !b) return null;
  if (!a) return b;
  if (!b) return a;
  return scoreState(a) >= scoreState(b) ? a : b;
}
