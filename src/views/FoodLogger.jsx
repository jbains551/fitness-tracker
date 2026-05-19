import { useMemo, useState } from 'react';
import { QUICK_FOODS, MEALS } from '../lib/data.js';
import { todayKey, uid } from '../lib/utils.js';

export default function FoodLogger({ store, now }) {
  const key = todayKey(now);
  const entries = store.state.foods[key] || [];
  const [meal, setMeal] = useState('breakfast');
  const [tab, setTab] = useState('quick');

  const grouped = useMemo(() => {
    const g = {};
    for (const m of MEALS) g[m] = [];
    for (const e of entries) (g[e.meal] || (g[e.meal] = [])).push(e);
    return g;
  }, [entries]);

  const handleQuick = (food) => {
    store.addFood(key, {
      id: uid(),
      name: food.name,
      cal: food.cal,
      p: food.p,
      c: food.c,
      f: food.f,
      meal,
      ts: Date.now(),
    });
  };

  return (
    <div className="space-y-4">
      <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm">
        <label className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Meal</label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {MEALS.map((m) => (
            <button
              key={m}
              onClick={() => setMeal(m)}
              className={
                'py-2 rounded-lg text-xs font-medium capitalize border transition active:scale-95 ' +
                (meal === m
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200')
              }
            >
              {m}
            </button>
          ))}
        </div>
      </section>

      <div className="flex gap-2">
        <TabBtn active={tab === 'quick'} onClick={() => setTab('quick')}>Quick add</TabBtn>
        <TabBtn active={tab === 'custom'} onClick={() => setTab('custom')}>Custom</TabBtn>
        <TabBtn active={tab === 'saved'} onClick={() => setTab('saved')}>Saved</TabBtn>
      </div>

      {tab === 'quick' && (
        <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {QUICK_FOODS.map((f) => (
              <li key={f.id}>
                <button
                  onClick={() => handleQuick(f)}
                  className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/50 active:bg-neutral-100 dark:active:bg-neutral-800 transition"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{f.name}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {f.cal} cal · {f.p}P · {f.c}C · {f.f}F
                    </p>
                  </div>
                  <span className="ml-3 size-8 shrink-0 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg">+</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'custom' && <CustomEntry store={store} dateKey={key} meal={meal} />}

      {tab === 'saved' && <SavedFoods store={store} onAdd={handleQuick} />}

      <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm">
        <h2 className="font-semibold mb-2">Today's log</h2>
        {entries.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">No entries yet.</p>
        ) : (
          <div className="space-y-4">
            {MEALS.map((m) =>
              grouped[m] && grouped[m].length > 0 ? (
                <div key={m}>
                  <h3 className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400 capitalize mb-1">{m}</h3>
                  <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {grouped[m].map((e) => (
                      <li key={e.id} className="py-2 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm truncate">{e.name}</p>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                            {e.cal} cal · {e.p}P · {e.c}C · {e.f}F
                          </p>
                        </div>
                        <button
                          onClick={() => store.removeFood(key, e.id)}
                          className="size-8 shrink-0 rounded-full text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition"
                          aria-label="Delete entry"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-2 0v14M10 6v14M5 6l1 14a2 2 0 002 2h8a2 2 0 002-2l1-14" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function TabBtn({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={
        'flex-1 py-2 rounded-lg text-sm font-medium transition active:scale-95 ' +
        (active
          ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
          : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-800')
      }
    >
      {children}
    </button>
  );
}

function CustomEntry({ store, dateKey, meal }) {
  const [form, setForm] = useState({ name: '', cal: '', p: '', c: '', f: '' });
  const [save, setSave] = useState(false);

  const handle = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const entry = {
      id: uid(),
      name: form.name.trim(),
      cal: Number(form.cal) || 0,
      p: Number(form.p) || 0,
      c: Number(form.c) || 0,
      f: Number(form.f) || 0,
      meal,
      ts: Date.now(),
    };
    store.addFood(dateKey, entry);
    if (save) {
      store.addCustomFood({ id: uid(), name: entry.name, cal: entry.cal, p: entry.p, c: entry.c, f: entry.f });
    }
    setForm({ name: '', cal: '', p: '', c: '', f: '' });
  };

  return (
    <form onSubmit={submit} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm space-y-3">
      <Field label="Name" value={form.name} onChange={handle('name')} placeholder="e.g. Cottage cheese" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Calories" value={form.cal} onChange={handle('cal')} type="number" inputMode="numeric" />
        <Field label="Protein (g)" value={form.p} onChange={handle('p')} type="number" inputMode="numeric" />
        <Field label="Carbs (g)" value={form.c} onChange={handle('c')} type="number" inputMode="numeric" />
        <Field label="Fat (g)" value={form.f} onChange={handle('f')} type="number" inputMode="numeric" />
      </div>
      <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
        <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} className="size-4 accent-emerald-600" />
        Save for quick re-use
      </label>
      <button
        type="submit"
        className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium py-2.5 rounded-lg transition active:scale-[0.99]"
      >
        Add to log
      </button>
    </form>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{label}</span>
      <input
        {...props}
        className="mt-1 w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
      />
    </label>
  );
}

function SavedFoods({ store, onAdd }) {
  const { customFoods } = store.state;
  if (customFoods.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm text-sm text-neutral-500 dark:text-neutral-400">
        No saved foods yet. Add a custom food and check "Save for quick re-use".
      </div>
    );
  }
  return (
    <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
      <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {customFoods.map((f) => (
          <li key={f.id} className="flex items-stretch">
            <button
              onClick={() => onAdd(f)}
              className="flex-1 text-left px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 active:bg-neutral-100 dark:active:bg-neutral-800 transition"
            >
              <p className="text-sm font-medium truncate">{f.name}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {f.cal} cal · {f.p}P · {f.c}C · {f.f}F
              </p>
            </button>
            <button
              onClick={() => store.removeCustomFood(f.id)}
              className="px-4 text-neutral-400 hover:text-rose-500 transition"
              aria-label="Forget this food"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
