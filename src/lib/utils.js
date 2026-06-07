export const TRAINING_DAYS = [1, 3, 4, 5];
export const REST_DAYS = [0, 2];
export const OPTIONAL_DAYS = [6];

export const TRAINING_TARGET = { cal: 2500, p: 170, c: 220, f: 65 };
export const REST_TARGET = { cal: 2200, p: 170, c: 150, f: 70 };
export const OPTIONAL_TARGET = { cal: 2400, p: 170, c: 180, f: 70 };

export function dayKind(dow) {
  if (TRAINING_DAYS.includes(dow)) return 'training';
  if (OPTIONAL_DAYS.includes(dow)) return 'optional';
  return 'rest';
}

export function targetFor(dow) {
  const kind = dayKind(dow);
  if (kind === 'training') return TRAINING_TARGET;
  if (kind === 'optional') return OPTIONAL_TARGET;
  return REST_TARGET;
}

export function targetForState(state, dow) {
  const kind = dayKind(dow);
  const t = state?.macroTargets?.[kind];
  if (t) return t;
  return targetFor(dow);
}

export function isTrainingDay(dow) {
  return TRAINING_DAYS.includes(dow);
}

export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function dateFromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function lastNDays(n, ref = new Date()) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(ref);
    d.setDate(d.getDate() - i);
    out.push(d);
  }
  return out;
}

export const DOW_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DOW_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function sumMacros(entries = []) {
  return entries.reduce(
    (acc, e) => ({
      cal: acc.cal + (Number(e.cal) || 0),
      p: acc.p + (Number(e.p) || 0),
      c: acc.c + (Number(e.c) || 0),
      f: acc.f + (Number(e.f) || 0),
    }),
    { cal: 0, p: 0, c: 0, f: 0 }
  );
}

export function clampPct(v) {
  if (!isFinite(v) || v < 0) return 0;
  if (v > 100) return 100;
  return v;
}
