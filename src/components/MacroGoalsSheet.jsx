import { useEffect, useState } from 'react';
import { DEFAULT_MACRO_TARGETS } from '../lib/store.js';

const KIND_META = {
  training: { label: 'Training', sub: 'Mon · Wed · Thu · Fri', color: 'emerald' },
  rest: { label: 'Rest', sub: 'Tue · Sun', color: 'sky' },
  optional: { label: 'Optional', sub: 'Sat', color: 'amber' },
};

const ACCENT_TEXT = {
  emerald: 'text-emerald-600 dark:text-emerald-400',
  sky: 'text-sky-600 dark:text-sky-400',
  amber: 'text-amber-600 dark:text-amber-400',
};

export default function MacroGoalsSheet({ open, onClose, store }) {
  const [draft, setDraft] = useState(() => store.state.macroTargets);

  useEffect(() => {
    if (open) setDraft(store.state.macroTargets);
  }, [open, store.state.macroTargets]);

  if (!open) return null;

  const update = (kind, key, value) => {
    setDraft((d) => ({ ...d, [kind]: { ...d[kind], [key]: value } }));
  };

  const save = (e) => {
    e?.preventDefault();
    const cleaned = {};
    for (const kind of ['training', 'rest', 'optional']) {
      const k = draft[kind] || {};
      cleaned[kind] = {
        cal: toNum(k.cal, DEFAULT_MACRO_TARGETS[kind].cal),
        p: toNum(k.p, DEFAULT_MACRO_TARGETS[kind].p),
        c: toNum(k.c, DEFAULT_MACRO_TARGETS[kind].c),
        f: toNum(k.f, DEFAULT_MACRO_TARGETS[kind].f),
      };
    }
    store.setMacroTargets(cleaned);
    onClose();
  };

  const reset = () => {
    if (!confirm('Reset all macro targets to defaults?')) return;
    setDraft(DEFAULT_MACRO_TARGETS);
  };

  return (
    <div
      className="fixed inset-0 z-30 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl shadow-xl border-t sm:border border-neutral-200 dark:border-neutral-800"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
      >
        <div className="sticky top-0 bg-white dark:bg-neutral-900 flex items-center justify-between px-4 pt-4 pb-2 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="font-semibold">Macro goals</h2>
          <button
            onClick={onClose}
            className="size-9 rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={save} className="p-4 space-y-5">
          {['training', 'rest', 'optional'].map((kind) => {
            const meta = KIND_META[kind];
            const vals = draft[kind] || DEFAULT_MACRO_TARGETS[kind];
            return (
              <section key={kind}>
                <div className="flex items-baseline justify-between mb-2">
                  <h3 className={`font-semibold ${ACCENT_TEXT[meta.color]}`}>{meta.label}</h3>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">{meta.sub}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <NumInput label="Cal" value={vals.cal} onChange={(v) => update(kind, 'cal', v)} />
                  <NumInput label="Protein" value={vals.p} onChange={(v) => update(kind, 'p', v)} />
                  <NumInput label="Carbs" value={vals.c} onChange={(v) => update(kind, 'c', v)} />
                  <NumInput label="Fat" value={vals.f} onChange={(v) => update(kind, 'f', v)} />
                </div>
              </section>
            );
          })}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium py-2.5 rounded-lg transition active:scale-[0.99]"
            >
              Save
            </button>
            <button
              type="button"
              onClick={reset}
              className="px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition text-sm"
            >
              Defaults
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function toNum(v, fallback) {
  if (v === '' || v == null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : fallback;
}

function NumInput({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-2 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 tabular-nums text-center"
      />
    </label>
  );
}
