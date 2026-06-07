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
  const pushingRef = useRef(false);
  const stateRef = useRef(store.state);

  useEffect(() => {
    stateRef.current = store.state;
  }, [store.state]);

  const getTokenRef = useRef(getToken);
  useEffect(() => { getTokenRef.current = getToken; }, [getToken]);

  const authedFetch = useCallback(async (url, init = {}) => {
    const token = await getTokenRef.current();
    return fetch(url, {
      ...init,
      headers: {
        ...(init.headers || {}),
        authorization: `Bearer ${token}`,
      },
    });
  }, []);

  const pushNow = useCallback(async (overrideState) => {
    if (!isSignedIn) return;
    const stateToPush = overrideState || stateRef.current;
    const serialized = JSON.stringify(stateToPush);
    if (serialized === lastPushedRef.current) return;
    pushingRef.current = true;
    setStatus('syncing');
    try {
      const res = await authedFetch('/api/state', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ state: stateToPush }),
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
      pushingRef.current = false;
    }
  }, [authedFetch, isSignedIn]);

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

    const localState = !isStateEmpty(stateRef.current) ? stateRef.current : null;
    const winner = pickRicherState(localState, legacyState);

    localStorage.setItem(migratedKey, String(Date.now()));
    if (legacyToken) localStorage.removeItem(LEGACY_TOKEN_KEY);

    return winner;
  }, [userId]);

  const pull = useCallback(async ({ skipIfDirty = true } = {}) => {
    if (!isSignedIn) return;
    if (pushingRef.current) return;

    if (skipIfDirty && initialPullDoneRef.current) {
      const currentSerialized = JSON.stringify(stateRef.current);
      if (lastPushedRef.current !== null && currentSerialized !== lastPushedRef.current) {
        return pushNow();
      }
    }

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
        await pushNow(migrated);
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
  }, [authedFetch, isSignedIn, runMigration, pushNow, store]);

  const pullRef = useRef(pull);
  useEffect(() => { pullRef.current = pull; }, [pull]);

  const pushRef = useRef(pushNow);
  useEffect(() => { pushRef.current = pushNow; }, [pushNow]);

  // Initial pull on sign-in (NOT on every state change)
  useEffect(() => {
    if (isLoaded && isSignedIn) pullRef.current({ skipIfDirty: false });
  }, [isLoaded, isSignedIn]);

  // Pull on focus (skip if dirty)
  useEffect(() => {
    if (!isSignedIn) return;
    const onFocus = () => pullRef.current();
    const onVisible = () => {
      if (document.visibilityState === 'visible') pullRef.current();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [isSignedIn]);

  // Debounced push on state change
  useEffect(() => {
    if (!isSignedIn || !initialPullDoneRef.current) return;
    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      pushRef.current();
    }, 1500);
    return () => clearTimeout(debounceTimerRef.current);
  }, [store.state, isSignedIn]);

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
