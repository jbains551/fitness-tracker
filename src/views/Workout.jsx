import { useEffect, useState } from 'react';
import { WORKOUT_TYPES } from '../lib/data.js';
import { todayKey, lastNDays, DOW_SHORT } from '../lib/utils.js';

export default function Workout({ store, now }) {
  const key = todayKey(now);
  const existing = store.state.workouts[key];

  const [form, setForm] = useState(() => existing || { type: 'Strength', duration: '', effort: 7, notes: '' });

  useEffect(() => {
    setForm(existing || { type: 'Strength', duration: '', effort: 7, notes: '' });
  }, [key, existing]);

  const submit = (e) => {
    e.preventDefault();
    store.setWorkout(key, {
      type: form.type,
      duration: Number(form.duration) || 0,
      effort: Number(form.effort) || 0,
      notes: form.notes || '',
      ts: Date.now(),
    });
  };

  const history = lastNDays(7, now).map((d) => {
    const k = todayKey(d);
    return { date: d, key: k, workout: store.state.workouts[k] };
  });

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm space-y-4">
        <h2 className="font-semibold">Log today's workout</h2>

        <div>
          <label className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Type</label>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {WORKOUT_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm((s) => ({ ...s, type: t }))}
                className={
                  'py-2 rounded-lg text-xs font-medium transition active:scale-95 border ' +
                  (form.type === t
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200')
                }
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Duration (min)</span>
            <input
              type="number"
              inputMode="numeric"
              value={form.duration}
              onChange={(e) => setForm((s) => ({ ...s, duration: e.target.value }))}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 outline-none focus:ring-2 focus:ring-emerald-500/40"
              placeholder="45"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">RPE (1–10)</span>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="10"
                value={form.effort}
                onChange={(e) => setForm((s) => ({ ...s, effort: e.target.value }))}
                className="flex-1 accent-emerald-600"
              />
              <span className="w-7 text-center font-semibold">{form.effort}</span>
            </div>
          </label>
        </div>

        <label className="block">
          <span className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Notes</span>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
            rows={2}
            className="mt-1 w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none"
            placeholder="How did it feel?"
          />
        </label>

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium py-2.5 rounded-lg transition active:scale-[0.99]"
          >
            {existing ? 'Update' : 'Save'} workout
          </button>
          {existing && (
            <button
              type="button"
              onClick={() => store.removeWorkout(key)}
              className="px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
        <header className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="font-semibold">Last 7 days</h2>
        </header>
        <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {history.slice().reverse().map(({ date, key: k, workout }) => (
            <li key={k} className="px-4 py-3 flex items-center gap-3">
              <div className="w-12 shrink-0">
                <div className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{DOW_SHORT[date.getDay()]}</div>
                <div className="text-lg font-semibold leading-tight">{date.getDate()}</div>
              </div>
              {workout ? (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{workout.type} · {workout.duration} min</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    RPE {workout.effort}{workout.notes ? ` · ${workout.notes}` : ''}
                  </p>
                </div>
              ) : (
                <p className="flex-1 text-sm text-neutral-400 dark:text-neutral-500">Not logged</p>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
