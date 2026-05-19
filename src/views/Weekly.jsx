import { useMemo } from 'react';
import { SUPPLEMENTS } from '../lib/data.js';
import {
  DOW_SHORT,
  isTrainingDay,
  lastNDays,
  sumMacros,
  targetFor,
  todayKey,
} from '../lib/utils.js';

export default function Weekly({ store, now }) {
  const days = useMemo(() => {
    return lastNDays(7, now).map((d) => {
      const key = todayKey(d);
      const dow = d.getDay();
      const target = targetFor(dow);
      const entries = store.state.foods[key] || [];
      const totals = sumMacros(entries);
      const proteinHit = totals.p >= target.p;

      const workout = store.state.workouts[key];
      const workoutDone = !!workout && workout.type !== 'Rest' && (workout.duration || 0) > 0;

      const groups = ['morning', isTrainingDay(dow) ? 'preworkout' : null, 'afternoon', 'bedtime'].filter(Boolean);
      const supps = store.state.supps[key] || {};
      const allSupps = groups.flatMap((g) => SUPPLEMENTS[g]);
      const suppDone = allSupps.filter((s) => supps[s.id]).length;
      const suppPct = allSupps.length ? Math.round((suppDone / allSupps.length) * 100) : 0;

      return {
        date: d,
        key,
        dow,
        target,
        totals,
        proteinHit,
        workout,
        workoutDone,
        suppPct,
        isToday: key === todayKey(now),
      };
    });
  }, [store.state, now]);

  const streak = useMemo(() => {
    let s = 0;
    const back = lastNDays(60, now);
    for (let i = back.length - 1; i >= 0; i--) {
      const d = back[i];
      const k = todayKey(d);
      const entries = store.state.foods[k];
      const target = targetFor(d.getDay());
      const totals = sumMacros(entries || []);
      if (totals.p >= target.p) s++;
      else if (k !== todayKey(now)) break;
      else continue;
    }
    return s;
  }, [store.state, now]);

  const weekProteinHits = days.filter((d) => d.proteinHit).length;
  const weekWorkouts = days.filter((d) => d.workoutDone).length;
  const avgSupp = Math.round(days.reduce((n, d) => n + d.suppPct, 0) / days.length);

  return (
    <div className="space-y-4">
      <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm">
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold">Protein streak</h2>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{streak}</span>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          {streak === 0 ? 'Hit your protein target today to start a streak.' : `Consecutive day${streak === 1 ? '' : 's'} hitting protein goal.`}
        </p>
      </section>

      <div className="grid grid-cols-3 gap-3">
        <Pill label="Protein hits" value={`${weekProteinHits}/7`} accent="sky" />
        <Pill label="Workouts" value={`${weekWorkouts}/7`} accent="emerald" />
        <Pill label="Avg supps" value={`${avgSupp}%`} accent="indigo" />
      </div>

      <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
        <header className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="font-semibold">7-day view</h2>
        </header>
        <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {days.slice().reverse().map((d) => (
            <li key={d.key} className="px-4 py-3 flex items-center gap-3">
              <div className="w-12 shrink-0">
                <div className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  {DOW_SHORT[d.dow]}
                </div>
                <div className={'text-lg font-semibold leading-tight ' + (d.isToday ? 'text-emerald-600 dark:text-emerald-400' : '')}>
                  {d.date.getDate()}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs">
                  <Status ok={d.proteinHit} label={`P ${Math.round(d.totals.p)}/${d.target.p}`} />
                  <Status ok={d.workoutDone} label={d.workout ? d.workout.type : 'No workout'} />
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-indigo-500/10 overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-[width] duration-500" style={{ width: `${d.suppPct}%` }} />
                  </div>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400 w-9 text-right">{d.suppPct}%</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Status({ ok, label }) {
  return (
    <span
      className={
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ' +
        (ok
          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300')
      }
    >
      <span className={'size-1.5 rounded-full ' + (ok ? 'bg-emerald-500' : 'bg-rose-500')} />
      {label}
    </span>
  );
}

const PILL_ACCENT = {
  sky: 'text-sky-600 dark:text-sky-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  indigo: 'text-indigo-600 dark:text-indigo-400',
};

function Pill({ label, value, accent }) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-3 shadow-sm">
      <p className="text-[11px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className={`text-xl font-bold mt-0.5 ${PILL_ACCENT[accent]}`}>{value}</p>
    </div>
  );
}
