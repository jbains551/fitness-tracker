import { useEffect, useState, useCallback } from 'react';

const KEY = 'ft_state_v1';

export const DEFAULT_MACRO_TARGETS = {
  training: { cal: 2500, p: 170, c: 220, f: 65 },
  rest: { cal: 2200, p: 170, c: 150, f: 70 },
  optional: { cal: 2400, p: 170, c: 180, f: 70 },
};

const DEFAULT_STATE = {
  foods: {},
  workouts: {},
  customFoods: [],
  macroTargets: DEFAULT_MACRO_TARGETS,
  body: {
    measurements: {},
    goals: { weight: '', bodyFat: '', water: '', visceral: '' },
    settings: { weightUnit: 'lb', trendDays: 30 },
  },
};

function ensureMacros(s) {
  const incoming = s.macroTargets || {};
  return {
    ...s,
    macroTargets: {
      training: { ...DEFAULT_MACRO_TARGETS.training, ...(incoming.training || {}) },
      rest: { ...DEFAULT_MACRO_TARGETS.rest, ...(incoming.rest || {}) },
      optional: { ...DEFAULT_MACRO_TARGETS.optional, ...(incoming.optional || {}) },
    },
  };
}

function ensureBody(s) {
  const incoming = s.body || {};
  return {
    ...s,
    body: {
      measurements: incoming.measurements || {},
      goals: { ...DEFAULT_STATE.body.goals, ...(incoming.goals || {}) },
      settings: { ...DEFAULT_STATE.body.settings, ...(incoming.settings || {}) },
    },
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    return ensureMacros(ensureBody({ ...DEFAULT_STATE, ...parsed }));
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

  const setTrendDays = useCallback((days) => {
    setState((s) => {
      const base = ensureBody(s);
      return { ...base, body: { ...base.body, settings: { ...base.body.settings, trendDays: days } } };
    });
  }, []);

  const replaceState = useCallback((next) => {
    setState(ensureMacros(ensureBody({ ...DEFAULT_STATE, ...(next || {}) })));
  }, []);

  const setMacroTargets = useCallback((next) => {
    setState((s) => ({
      ...s,
      macroTargets: {
        training: { ...DEFAULT_MACRO_TARGETS.training, ...(next.training || s.macroTargets?.training || {}) },
        rest: { ...DEFAULT_MACRO_TARGETS.rest, ...(next.rest || s.macroTargets?.rest || {}) },
        optional: { ...DEFAULT_MACRO_TARGETS.optional, ...(next.optional || s.macroTargets?.optional || {}) },
      },
    }));
  }, []);

  const resetMacroTargets = useCallback(() => {
    setState((s) => ({ ...s, macroTargets: { ...DEFAULT_MACRO_TARGETS } }));
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
    setTrendDays,
    setMacroTargets,
    resetMacroTargets,
    replaceState,
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
