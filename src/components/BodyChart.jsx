import { useMemo } from 'react';
import { lastNDays, todayKey } from '../lib/utils.js';

export default function BodyChart({
  measurements,
  goal,
  metric,
  days = 30,
  now = new Date(),
  height = 140,
  color = 'emerald',
  unit = '',
}) {
  const series = useMemo(() => {
    return lastNDays(days, now).map((d) => {
      const m = measurements[todayKey(d)];
      const v = m ? m[metric] : undefined;
      return { date: d, value: typeof v === 'number' ? v : null };
    });
  }, [measurements, metric, days, now]);

  const points = series.filter((p) => p.value != null);

  if (points.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-neutral-400 dark:text-neutral-500 bg-neutral-50 dark:bg-neutral-800/40 rounded-lg"
        style={{ height }}
      >
        No data yet — log a measurement to see the trend.
      </div>
    );
  }

  const values = points.map((p) => p.value);
  const hasGoal = typeof goal === 'number' && Number.isFinite(goal);
  const all = hasGoal ? [...values, goal] : values;
  const minRaw = Math.min(...all);
  const maxRaw = Math.max(...all);
  const pad = Math.max((maxRaw - minRaw) * 0.15, 0.5);
  const min = minRaw - pad;
  const max = maxRaw + pad;
  const range = max - min || 1;

  const W = 600;
  const H = height;
  const padL = 8;
  const padR = 8;
  const padT = 14;
  const padB = 18;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const xFor = (i) => padL + (i / (series.length - 1 || 1)) * innerW;
  const yFor = (v) => padT + (1 - (v - min) / range) * innerH;

  // Forward-fill: carry the last measurement forward to today so the
  // chart always looks like a continuous line, even with sparse data.
  let lastVal = null;
  const filled = series.map((p) => {
    if (p.value != null) lastVal = p.value;
    return { ...p, lineValue: lastVal };
  });

  let path = '';
  let started = false;
  filled.forEach((p, i) => {
    if (p.lineValue == null) return;
    path += `${started ? 'L' : 'M'}${xFor(i).toFixed(1)},${yFor(p.lineValue).toFixed(1)} `;
    started = true;
  });

  const stroke = {
    emerald: 'stroke-emerald-500',
    sky: 'stroke-sky-500',
    indigo: 'stroke-indigo-500',
    rose: 'stroke-rose-500',
    amber: 'stroke-amber-500',
  }[color] || 'stroke-emerald-500';

  const fill = {
    emerald: 'fill-emerald-500',
    sky: 'fill-sky-500',
    indigo: 'fill-indigo-500',
    rose: 'fill-rose-500',
    amber: 'fill-amber-500',
  }[color] || 'fill-emerald-500';

  const latest = points[points.length - 1];
  const first = points[0];
  const delta = latest.value - first.value;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <div>
          <span className="text-2xl font-bold tabular-nums">
            {latest.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
          </span>
          <span className="ml-1 text-xs text-neutral-500 dark:text-neutral-400">{unit}</span>
        </div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
          {hasGoal && (
            <>goal {goal}{unit} · </>
          )}
          {points.length > 1 && (
            <span className={delta === 0 ? '' : delta > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
              {delta > 0 ? '+' : ''}{delta.toFixed(1)} over {points.length} pts
            </span>
          )}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
      >
        {hasGoal && (
          <>
            <line
              x1={padL}
              x2={W - padR}
              y1={yFor(goal)}
              y2={yFor(goal)}
              className="stroke-neutral-400 dark:stroke-neutral-500"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <text
              x={W - padR - 2}
              y={yFor(goal) - 4}
              textAnchor="end"
              className="fill-neutral-500 dark:fill-neutral-400"
              fontSize="10"
            >
              goal {goal}{unit}
            </text>
          </>
        )}

        <path
          d={path}
          fill="none"
          className={stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {series.map((p, i) =>
          p.value != null ? (
            <circle
              key={i}
              cx={xFor(i)}
              cy={yFor(p.value)}
              r={i === series.length - 1 || (points.length <= 8) ? 3 : 2}
              className={fill}
            />
          ) : null
        )}
      </svg>
    </div>
  );
}
