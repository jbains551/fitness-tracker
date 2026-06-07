import { useEffect, useState } from 'react';
import BodyChart from '../components/BodyChart.jsx';
import { todayKey, DOW_SHORT } from '../lib/utils.js';

const METRICS = [
  { key: 'weight', label: 'Weight', color: 'emerald' },
  { key: 'bodyFat', label: 'Body Fat', color: 'rose', unit: '%' },
  { key: 'water', label: 'Water', color: 'sky', unit: '%' },
  { key: 'visceral', label: 'Visceral Fat', color: 'amber', unit: '%' },
];

export default function Body({ store, now }) {
  const body = store.state.body;
  const key = todayKey(now);
  const existing = body.measurements[key] || {};
  const unit = body.settings.weightUnit;

  const [form, setForm] = useState(() => ({
    weight: existing.weight ?? '',
    bodyFat: existing.bodyFat ?? '',
    water: existing.water ?? '',
    visceral: existing.visceral ?? '',
  }));
  const [chartMetric, setChartMetric] = useState('weight');
  const [editingGoals, setEditingGoals] = useState(false);
  const [goalForm, setGoalForm] = useState(body.goals);

  useEffect(() => {
    setForm({
      weight: existing.weight ?? '',
      bodyFat: existing.bodyFat ?? '',
      water: existing.water ?? '',
      visceral: existing.visceral ?? '',
    });
  }, [key, existing.weight, existing.bodyFat, existing.water, existing.visceral]);

  useEffect(() => {
    setGoalForm(body.goals);
  }, [body.goals]);

  const submit = (e) => {
    e.preventDefault();
    store.setMeasurement(key, form);
  };

  const saveGoals = (e) => {
    e.preventDefault();
    store.setGoals(goalForm);
    setEditingGoals(false);
  };

  const history = Object.entries(body.measurements)
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .slice(0, 14);

  const unitFor = (k) => (k === 'weight' ? unit : '%');

  return (
    <div className="space-y-4">
      <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Log today's measurement</h2>
          <UnitToggle unit={unit} onChange={store.setWeightUnit} />
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <NumField
              label={`Weight (${unit})`}
              value={form.weight}
              step="0.1"
              onChange={(v) => setForm((s) => ({ ...s, weight: v }))}
              placeholder="—"
            />
            <NumField
              label="Body Fat (%)"
              value={form.bodyFat}
              step="0.1"
              onChange={(v) => setForm((s) => ({ ...s, bodyFat: v }))}
              placeholder="—"
            />
            <NumField
              label="Water (%)"
              value={form.water}
              step="0.1"
              onChange={(v) => setForm((s) => ({ ...s, water: v }))}
              placeholder="—"
            />
            <NumField
              label="Visceral Fat (%)"
              value={form.visceral}
              step="0.1"
              onChange={(v) => setForm((s) => ({ ...s, visceral: v }))}
              placeholder="—"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium py-2.5 rounded-lg transition active:scale-[0.99]"
            >
              {existing.weight !== undefined || existing.bodyFat !== undefined || existing.water !== undefined || existing.visceral !== undefined
                ? 'Update today'
                : 'Save today'}
            </button>
            {(existing.weight !== undefined ||
              existing.bodyFat !== undefined ||
              existing.water !== undefined ||
              existing.visceral !== undefined) && (
              <button
                type="button"
                onClick={() => store.removeMeasurement(key)}
                className="px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Trend</h2>
          <div className="flex gap-1 flex-wrap">
            {METRICS.map((m) => (
              <button
                key={m.key}
                onClick={() => setChartMetric(m.key)}
                className={
                  'px-2.5 py-1 rounded-full text-[11px] font-medium transition ' +
                  (chartMetric === m.key
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300')
                }
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <BodyChart
          measurements={body.measurements}
          goal={numOrUndef(body.goals[chartMetric])}
          metric={chartMetric}
          color={METRICS.find((m) => m.key === chartMetric).color}
          unit={unitFor(chartMetric)}
          days={30}
          now={now}
          height={160}
        />
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-2">Last 30 days</p>
      </section>

      <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Goals</h2>
          <button
            onClick={() => setEditingGoals((v) => !v)}
            className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            {editingGoals ? 'Cancel' : 'Edit'}
          </button>
        </div>
        {editingGoals ? (
          <form onSubmit={saveGoals} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <NumField
                label={`Weight (${unit})`}
                value={goalForm.weight}
                step="0.1"
                onChange={(v) => setGoalForm((s) => ({ ...s, weight: v }))}
              />
              <NumField
                label="Body Fat (%)"
                value={goalForm.bodyFat}
                step="0.1"
                onChange={(v) => setGoalForm((s) => ({ ...s, bodyFat: v }))}
              />
              <NumField
                label="Water (%)"
                value={goalForm.water}
                step="0.1"
                onChange={(v) => setGoalForm((s) => ({ ...s, water: v }))}
              />
              <NumField
                label="Visceral Fat (%)"
                value={goalForm.visceral}
                step="0.1"
                onChange={(v) => setGoalForm((s) => ({ ...s, visceral: v }))}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium py-2.5 rounded-lg transition active:scale-[0.99]"
            >
              Save goals
            </button>
          </form>
        ) : (
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {METRICS.map((m) => {
              const g = numOrUndef(body.goals[m.key]);
              return (
                <li key={m.key} className="py-2 flex items-center justify-between text-sm">
                  <span>{m.label}</span>
                  <span className="font-medium tabular-nums">
                    {g != null ? `${g}${unitFor(m.key)}` : <span className="text-neutral-400">not set</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
        <header className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="font-semibold">History</h2>
        </header>
        {history.length === 0 ? (
          <p className="px-4 py-6 text-sm text-neutral-500 dark:text-neutral-400">No measurements yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {history.map(([dateKey, m]) => {
              const [y, mo, d] = dateKey.split('-').map(Number);
              const dt = new Date(y, mo - 1, d);
              return (
                <li key={dateKey} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-12 shrink-0">
                    <div className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      {DOW_SHORT[dt.getDay()]}
                    </div>
                    <div className="text-lg font-semibold leading-tight">{dt.getDate()}</div>
                  </div>
                  <div className="flex-1 min-w-0 grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
                    <MetricCell label="Wt" value={m.weight} unit={unit} />
                    <MetricCell label="BF" value={m.bodyFat} unit="%" />
                    <MetricCell label="H₂O" value={m.water} unit="%" />
                    <MetricCell label="Vis" value={m.visceral} unit="%" />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function numOrUndef(v) {
  if (v === '' || v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function NumField({ label, value, onChange, placeholder, step = '1' }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 tabular-nums"
      />
    </label>
  );
}

function UnitToggle({ unit, onChange }) {
  return (
    <div className="inline-flex rounded-full bg-neutral-100 dark:bg-neutral-800 p-0.5 text-xs font-medium">
      {['lb', 'kg'].map((u) => (
        <button
          key={u}
          onClick={() => onChange(u)}
          className={
            'px-3 py-1 rounded-full transition ' +
            (unit === u
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
              : 'text-neutral-500 dark:text-neutral-400')
          }
        >
          {u}
        </button>
      ))}
    </div>
  );
}

function MetricCell({ label, value, unit }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-neutral-500 dark:text-neutral-400">{label}</span>
      <span className="font-medium tabular-nums">
        {value != null ? `${value}${unit}` : <span className="text-neutral-300 dark:text-neutral-600">—</span>}
      </span>
    </div>
  );
}
