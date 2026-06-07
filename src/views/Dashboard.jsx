import { useMemo } from 'react';
import { dayKind, targetFor, todayKey, sumMacros, clampPct } from '../lib/utils.js';
import { SUPPLEMENTS } from '../lib/data.js';
import BodyChart from '../components/BodyChart.jsx';

export default function Dashboard({ store, now }) {
  const dow = now.getDay();
  const key = todayKey(now);
  const target = targetFor(dow);
  const kind = dayKind(dow);

  const entries = store.state.foods[key] || [];
  const totals = useMemo(() => sumMacros(entries), [entries]);
  const workout = store.state.workouts[key];

  const suppsToday = store.state.supps[key] || {};
  const suppGroups = ['morning', kind === 'training' ? 'preworkout' : null, 'afternoon', 'bedtime'].filter(Boolean);
  const allSupps = suppGroups.flatMap((g) => SUPPLEMENTS[g]);
  const suppDone = allSupps.filter((s) => suppsToday[s.id]).length;
  const suppPct = allSupps.length ? Math.round((suppDone / allSupps.length) * 100) : 0;

  const body = store.state.body;
  const weightUnit = body.settings.weightUnit;
  const latestEntry = useMemo(() => {
    const dates = Object.keys(body.measurements).sort();
    if (dates.length === 0) return null;
    const last = dates[dates.length - 1];
    return { date: last, m: body.measurements[last] };
  }, [body.measurements]);
  const goalNum = (v) => {
    if (v === '' || v == null) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  return (
    <div className="space-y-4">
      <DayBadge kind={kind} />

      <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-semibold">Macros</h2>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {Math.round(totals.cal)} / {target.cal} cal
          </span>
        </div>
        <div className="space-y-3">
          <MacroBar label="Calories" value={totals.cal} target={target.cal} unit="" color="emerald" />
          <MacroBar label="Protein" value={totals.p} target={target.p} unit="g" color="sky" />
          <MacroBar label="Carbs" value={totals.c} target={target.c} unit="g" color="amber" />
          <MacroBar label="Fat" value={totals.f} target={target.f} unit="g" color="rose" />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          title="Workout"
          value={workout ? workout.type : '—'}
          sub={workout ? `${workout.duration || 0} min · RPE ${workout.effort || '?'}` : 'Not logged'}
          good={!!workout}
        />
        <StatCard
          title="Supplements"
          value={`${suppDone}/${allSupps.length}`}
          sub={`${suppPct}% complete`}
          good={suppPct === 100}
        />
      </div>

      <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-semibold">Body</h2>
          {latestEntry && (
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              last logged {formatRelativeDate(latestEntry.date, key)}
            </span>
          )}
        </div>
        {latestEntry ? (
          <>
            <div className="grid grid-cols-4 gap-2 mb-3">
              <BodyMetricCell label="Weight" value={latestEntry.m.weight} goal={goalNum(body.goals.weight)} unit={weightUnit} />
              <BodyMetricCell label="Body Fat" value={latestEntry.m.bodyFat} goal={goalNum(body.goals.bodyFat)} unit="%" />
              <BodyMetricCell label="Water" value={latestEntry.m.water} goal={goalNum(body.goals.water)} unit="%" higherIsBetter />
              <BodyMetricCell label="Visceral" value={latestEntry.m.visceral} goal={goalNum(body.goals.visceral)} unit="%" />
            </div>
            <BodyChart
              measurements={body.measurements}
              goal={goalNum(body.goals.weight)}
              metric="weight"
              color="emerald"
              unit={weightUnit}
              days={30}
              now={now}
              height={120}
            />
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">Weight · last 30 days</p>
          </>
        ) : (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 py-2">
            No measurements yet — tap Body below to add your first.
          </p>
        )}
      </section>

      <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="font-semibold">Today's food</h2>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">{entries.length} entries</span>
        </div>
        {entries.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 py-2">Nothing logged yet — tap Food below to get started.</p>
        ) : (
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {entries.slice(-5).reverse().map((e) => (
              <li key={e.id} className="py-2 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{e.name}</p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 capitalize">{e.meal}</p>
                </div>
                <div className="text-right text-xs text-neutral-600 dark:text-neutral-300 shrink-0 ml-3">
                  <div className="font-medium text-neutral-900 dark:text-neutral-100">{e.cal} cal</div>
                  <div>{e.p}P · {e.c}C · {e.f}F</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function DayBadge({ kind }) {
  const styles = {
    training: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-900',
    rest: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 ring-sky-200 dark:ring-sky-900',
    optional: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 ring-amber-200 dark:ring-amber-900',
  };
  const labels = { training: 'Training day', rest: 'Rest day', optional: 'Optional day' };
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ring-1 ${styles[kind]}`}>
      <span className="size-2 rounded-full bg-current" />
      {labels[kind]}
    </div>
  );
}

const COLOR_MAP = {
  emerald: { bar: 'bg-emerald-500', track: 'bg-emerald-500/10' },
  sky: { bar: 'bg-sky-500', track: 'bg-sky-500/10' },
  amber: { bar: 'bg-amber-500', track: 'bg-amber-500/10' },
  rose: { bar: 'bg-rose-500', track: 'bg-rose-500/10' },
};

function MacroBar({ label, value, target, unit, color }) {
  const pct = clampPct((value / target) * 100);
  const remaining = target - value;
  const { bar, track } = COLOR_MAP[color];
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {Math.round(value)}{unit} / {target}{unit}
          <span className="ml-1.5 text-neutral-400 dark:text-neutral-500">
            {remaining > 0 ? `· ${Math.round(remaining)}${unit} left` : `· +${Math.abs(Math.round(remaining))}${unit} over`}
          </span>
        </span>
      </div>
      <div className={`h-2.5 rounded-full overflow-hidden ${track}`}>
        <div
          className={`h-full ${bar} transition-[width] duration-500 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, good }) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{title}</p>
      <p className={`mt-1 text-xl font-semibold ${good ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>{value}</p>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{sub}</p>
    </div>
  );
}

function BodyMetricCell({ label, value, goal, unit, higherIsBetter }) {
  let toneClass = '';
  if (value != null && goal != null) {
    const onTarget = higherIsBetter ? value >= goal : value <= goal;
    toneClass = onTarget
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-amber-600 dark:text-amber-400';
  }
  return (
    <div className="text-center">
      <p className="text-[10px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className={`mt-0.5 font-semibold tabular-nums ${toneClass}`}>
        {value != null ? <>{value}<span className="text-[10px] font-normal text-neutral-500 dark:text-neutral-400 ml-0.5">{unit}</span></> : <span className="text-neutral-300 dark:text-neutral-600">—</span>}
      </p>
      <p className="text-[10px] text-neutral-400 dark:text-neutral-500 tabular-nums">
        {goal != null ? `goal ${goal}${unit}` : 'no goal'}
      </p>
    </div>
  );
}

function formatRelativeDate(dateKey, todayK) {
  if (dateKey === todayK) return 'today';
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const [ty, tm, td] = todayK.split('-').map(Number);
  const today = new Date(ty, tm - 1, td);
  const days = Math.round((today - dt) / 86400000);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
