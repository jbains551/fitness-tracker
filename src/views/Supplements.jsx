import { SUPPLEMENTS } from '../lib/data.js';
import { isTrainingDay, todayKey } from '../lib/utils.js';

const GROUP_META = {
  morning: { label: 'Morning', icon: '☀️', color: 'amber' },
  preworkout: { label: 'Pre-workout', icon: '⚡', color: 'emerald' },
  afternoon: { label: 'Afternoon', icon: '🌤', color: 'sky' },
  bedtime: { label: 'Before bed', icon: '🌙', color: 'indigo' },
};

const ACCENT = {
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  sky: 'bg-sky-500',
  indigo: 'bg-indigo-500',
};

export default function Supplements({ store, now }) {
  const key = todayKey(now);
  const day = store.state.supps[key] || {};
  const training = isTrainingDay(now.getDay());

  const groups = ['morning', training ? 'preworkout' : null, 'afternoon', 'bedtime'].filter(Boolean);
  const total = groups.reduce((n, g) => n + SUPPLEMENTS[g].length, 0);
  const done = groups.reduce((n, g) => n + SUPPLEMENTS[g].filter((s) => day[s.id]).length, 0);
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-4">
      <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="font-semibold">Today's stack</h2>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">{done} / {total} · {pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-emerald-500/10 overflow-hidden">
          <div className="h-full bg-emerald-500 transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>
        {!training && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
            Rest day — pre-workout supplements are hidden.
          </p>
        )}
      </section>

      {groups.map((g) => (
        <SuppGroup key={g} groupKey={g} day={day} onToggle={(id) => store.toggleSupp(key, id)} />
      ))}
    </div>
  );
}

function SuppGroup({ groupKey, day, onToggle }) {
  const meta = GROUP_META[groupKey];
  const list = SUPPLEMENTS[groupKey];
  const done = list.filter((s) => day[s.id]).length;

  return (
    <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
      <header className="px-4 py-3 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <span className="text-lg">{meta.icon}</span>
          <h3 className="font-semibold">{meta.label}</h3>
        </div>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">{done}/{list.length}</span>
      </header>
      <ul>
        {list.map((s) => {
          const checked = !!day[s.id];
          return (
            <li key={s.id}>
              <button
                onClick={() => onToggle(s.id)}
                className={
                  'w-full px-4 py-3 flex items-center gap-3 active:scale-[0.99] transition ' +
                  (checked
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/30'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40')
                }
              >
                <span
                  className={
                    'size-7 rounded-full flex items-center justify-center border-2 transition ' +
                    (checked
                      ? `${ACCENT[meta.color]} border-transparent text-white scale-100`
                      : 'border-neutral-300 dark:border-neutral-600 text-transparent')
                  }
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12l5 5L20 6" />
                  </svg>
                </span>
                <div className="flex-1 text-left min-w-0">
                  <p className={'text-sm font-medium ' + (checked ? 'line-through text-neutral-500 dark:text-neutral-400' : '')}>
                    {s.name}
                  </p>
                  {s.dose && <p className="text-xs text-neutral-500 dark:text-neutral-400">{s.dose}</p>}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
