import { useMemo, useRef, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
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
        <TabBtn active={tab === 'quick'} onClick={() => setTab('quick')}>Quick</TabBtn>
        <TabBtn active={tab === 'photo'} onClick={() => setTab('photo')}>Photo</TabBtn>
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

      {tab === 'photo' && <PhotoEntry store={store} dateKey={key} meal={meal} />}

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

async function fileToResizedDataURL(file, maxDim = 1024, quality = 0.7) {
  const dataUrl = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error('read failed'));
    r.readAsDataURL(file);
  });
  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('decode failed'));
    i.src = dataUrl;
  });
  let { width, height } = img;
  if (width >= height && width > maxDim) {
    height = Math.round((height * maxDim) / width);
    width = maxDim;
  } else if (height > maxDim) {
    width = Math.round((width * maxDim) / height);
    height = maxDim;
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
}

const CONF_STYLES = {
  high: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400',
  medium: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400',
  low: 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400',
};

function PhotoEntry({ store, dateKey, meal }) {
  const { getToken } = useAuth();
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | analyzing | done | error
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [note, setNote] = useState('');
  const [added, setAdded] = useState(false);

  const totals = useMemo(() => {
    return items.reduce(
      (t, it) => ({
        cal: t.cal + (Number(it.cal) || 0),
        p: t.p + (Number(it.p) || 0),
        c: t.c + (Number(it.c) || 0),
        f: t.f + (Number(it.f) || 0),
      }),
      { cal: 0, p: 0, c: 0, f: 0 }
    );
  }, [items]);

  const analyze = async (dataUrl) => {
    setStatus('analyzing');
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch('/api/photo-macros', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ image: dataUrl }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setItems((data.items || []).map((it) => ({ ...it, id: uid() })));
      setNote(data.note || '');
      setStatus('done');
    } catch (err) {
      setError(err.message || String(err));
      setStatus('error');
    }
  };

  const pick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setItems([]);
    setNote('');
    setAdded(false);
    try {
      const dataUrl = await fileToResizedDataURL(file);
      setPreview(dataUrl);
      analyze(dataUrl);
    } catch {
      setError('Could not read that image. Try another photo.');
      setStatus('error');
    }
  };

  const editItem = (id, field, value) =>
    setItems((list) => list.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  const dropItem = (id) => setItems((list) => list.filter((it) => it.id !== id));

  const addAll = () => {
    for (const it of items) {
      store.addFood(dateKey, {
        id: uid(),
        name: (it.name || '').trim() || 'Food',
        cal: Math.round(Number(it.cal) || 0),
        p: Math.round(Number(it.p) || 0),
        c: Math.round(Number(it.c) || 0),
        f: Math.round(Number(it.f) || 0),
        meal,
        ts: Date.now(),
      });
    }
    setAdded(true);
  };

  const reset = () => {
    setPreview(null);
    setItems([]);
    setNote('');
    setStatus('idle');
    setError(null);
    setAdded(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm space-y-4">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={pick}
        className="hidden"
      />

      {!preview && (
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl py-8 flex flex-col items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:border-emerald-500 hover:text-emerald-600 transition active:scale-[0.99]"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
          <span className="text-sm font-medium">Snap or upload a meal photo</span>
          <span className="text-xs">We'll estimate the macros — you confirm before logging</span>
        </button>
      )}

      {preview && (
        <div className="flex items-start gap-3">
          <img src={preview} alt="Meal" className="size-20 rounded-xl object-cover border border-neutral-200 dark:border-neutral-800" />
          <div className="flex-1 min-w-0">
            {status === 'analyzing' && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                <span className="size-3 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                Analyzing photo…
              </p>
            )}
            {status !== 'analyzing' && (
              <button
                onClick={() => fileRef.current?.click()}
                className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Use a different photo
              </button>
            )}
            {note && status === 'done' && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{note}</p>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl p-3 text-sm text-rose-700 dark:text-rose-300">
          <p className="font-medium">Couldn't analyze that.</p>
          <p className="text-xs mt-1 opacity-80">{error}</p>
        </div>
      )}

      {status === 'done' && items.length === 0 && !error && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          No food detected in that photo. Try a clearer shot of the plate.
        </p>
      )}

      {items.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Estimates only — tap any number to correct it before adding.
          </p>
          <ul className="space-y-3">
            {items.map((it) => (
              <li key={it.id} className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3">
                <div className="flex items-center gap-2">
                  <input
                    value={it.name}
                    onChange={(e) => editItem(it.id, 'name', e.target.value)}
                    className="flex-1 min-w-0 text-sm font-medium bg-transparent outline-none border-b border-transparent focus:border-emerald-500"
                  />
                  <span className={'text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize ' + (CONF_STYLES[it.confidence] || CONF_STYLES.medium)}>
                    {it.confidence || 'medium'}
                  </span>
                  <button
                    onClick={() => dropItem(it.id)}
                    className="size-6 shrink-0 rounded-full text-neutral-400 hover:text-rose-500 flex items-center justify-center"
                    aria-label="Remove item"
                  >
                    ×
                  </button>
                </div>
                {it.portion && (
                  <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">{it.portion}</p>
                )}
                <div className="grid grid-cols-4 gap-2 mt-2">
                  <MacroInput label="Cal" value={it.cal} onChange={(v) => editItem(it.id, 'cal', v)} />
                  <MacroInput label="P" value={it.p} onChange={(v) => editItem(it.id, 'p', v)} />
                  <MacroInput label="C" value={it.c} onChange={(v) => editItem(it.id, 'c', v)} />
                  <MacroInput label="F" value={it.f} onChange={(v) => editItem(it.id, 'f', v)} />
                </div>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between text-sm px-1">
            <span className="text-neutral-500 dark:text-neutral-400">Total</span>
            <span className="font-medium">
              {Math.round(totals.cal)} cal · {Math.round(totals.p)}P · {Math.round(totals.c)}C · {Math.round(totals.f)}F
            </span>
          </div>

          {added ? (
            <div className="space-y-2">
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium text-center">
                Added to {meal}. ✓
              </p>
              <button
                onClick={reset}
                className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-medium py-2.5 rounded-lg transition active:scale-[0.99]"
              >
                Log another photo
              </button>
            </div>
          ) : (
            <button
              onClick={addAll}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium py-2.5 rounded-lg transition active:scale-[0.99]"
            >
              Add {items.length} {items.length === 1 ? 'item' : 'items'} to {meal}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function MacroInput({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 w-full px-2 py-1.5 text-sm rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
      />
    </label>
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
