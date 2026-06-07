import { useEffect, useState, useCallback } from 'react';

const KEY = 'ft_state_v1';

const DEFAULT_STATE = {
  foods: {},
  workouts: {},
  customFoods: [],
  body: {
    measurements: {},
    goals: { weight: '', bodyFat: '', water: '', visceral: '' },
    settings: { weightUnit: 'lb' },
  },
};

function ensureBody(s) {
  if (s.body && s.body.measurements && s.body.goals && s.body.settings) return s;
  return { ...s, body: { ...DEFAULT_STATE.body, ...(s.body || {}) } };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    return ensureBody({ ...DEFAULT_STATE, ...parsed });
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

export function useStore() {
  const [state, setState] = useState(load);

  useEffect(() => {
    save(state);
  }, [state]);

  const addFood = useCallback((dateKey, entry) => {
    setState((s) => ({
      ...s,
      foods: {
        ...s.foods,
        [dateKey]: [...(s.foods[dateKey] || []), entry],
      },
    }));
  }, []);

  const removeFood = useCallback((dateKey, id) => {
    setState((s) => ({
      ...s,
      foods: {
        ...s.foods,
        [dateKey]: (s.foods[dateKey] || []).filter((e) => e.id !== id),
      },
    }));
  }, []);

  const setWorkout = useCallback((dateKey, workout) => {
    setState((s) => ({
      ...s,
      workouts: {
        ...s.workouts,
        [dateKey]: workout,
      },
    }));
  }, []);

  const removeWorkout = useCallback((dateKey) => {
    setState((s) => {
      const next = { ...s.workouts };
      delete next[dateKey];
      return { ...s, workouts: next };
    });
  }, []);

  const addCustomFood = useCallback((food) => {
    setState((s) => ({ ...s, customFoods: [food, ...s.customFoods] }));
  }, []);

  const removeCustomFood = useCallback((id) => {
    setState((s) => ({ ...s, customFoods: s.customFoods.filter((f) => f.id !== id) }));
  }, []);

  const setMeasurement = useCallback((dateKey, measurement) => {
    setState((s) => {
      const base = ensureBody(s);
      const cleaned = {};
      for (const k of ['weight', 'bodyFat', 'water', 'visceral']) {
        const v = measurement[k];
        if (v === '' || v === null || v === undefined) continue;
        const n = Number(v);
        if (Number.isFinite(n)) cleaned[k] = n;
      }
      return {
        ...base,
        body: {
          ...base.body,
          measurements: {
            ...base.body.measurements,
            [dateKey]: { ...cleaned, ts: Date.now() },
          },
        },
      };
    });
  }, []);

  const removeMeasurement = useCallback((dateKey) => {
    setState((s) => {
      const base = ensureBody(s);
      const next = { ...base.body.measurements };
      delete next[dateKey];
      return { ...base, body: { ...base.body, measurements: next } };
    });
  }, []);

  const setGoals = useCallback((goals) => {
    setState((s) => {
      const base = ensureBody(s);
      return { ...base, body: { ...base.body, goals: { ...base.body.goals, ...goals } } };
    });
  }, []);

  const setWeightUnit = useCallback((unit) => {
    setState((s) => {
      const base = ensureBody(s);
      return { ...base, body: { ...base.body, settings: { ...base.body.settings, weightUnit: unit } } };
    });
  }, []);

  return {
    state,
    addFood,
    removeFood,
    setWorkout,
    removeWorkout,
    addCustomFood,
    removeCustomFood,
    setMeasurement,
    removeMeasurement,
    setGoals,
    setWeightUnit,
  };
}

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('ft_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ft_theme', theme);
    } catch {}
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);

  return { theme, toggle };
}
