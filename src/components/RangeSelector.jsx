const RANGES = [7, 30, 90];

export default function RangeSelector({ value, onChange }) {
  return (
    <div className="inline-flex rounded-full bg-neutral-100 dark:bg-neutral-800 p-0.5 text-xs font-medium">
      {RANGES.map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={
            'px-3 py-1 rounded-full transition ' +
            (value === n
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
              : 'text-neutral-500 dark:text-neutral-400')
          }
        >
          {n}d
        </button>
      ))}
    </div>
  );
}
