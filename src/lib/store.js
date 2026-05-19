import { useEffect, useState, useCallback } from 'react';

const KEY = 'ft_state_v1';

const DEFAULT_STATE = {
  foods: {},
  supps: {},
  workouts: {},
  customFoods: [],
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed };
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

  const toggleSupp = useCallback((dateKey, suppId) => {
    setState((s) => {
      const day = s.supps[dateKey] || {};
      return {
        ...s,
        supps: {
          ...s.supps,
          [dateKey]: { ...day, [suppId]: !day[suppId] },
        },
      };
    });
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

  return {
    state,
    addFood,
    removeFood,
    toggleSupp,
    setWorkout,
    removeWorkout,
    addCustomFood,
    removeCustomFood,
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
