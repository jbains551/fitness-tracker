import { useMemo } from 'react';
import { lastNDays, sumMacros, todayKey, targetForState } from '../lib/utils.js';

export default function MacroChart({
  state,
  metric,
  days = 30,
  now = new Date(),
  height = 90,
  color = 'emerald',
  unit = '',
}) {
  const series = useMemo(() => {
    return lastNDays(days, now).map((d) => {
      const key = todayKey(d);
      const entries = state.foods?.[key] || [];
      const totals = sumMacros(entries);
      const target = targetForState(state, d.getDay());
      return {
        date: d,
        value: totals[metric] || 0,
        goal: target[metric],
        hasEntries: entries.length > 0,
      };
    });
  }, [state, metric, days, now]);

  const todayIdx = series.length - 1;
  const dataPoints = series.filter((p) => p.hasEntries);

  if (dataPoints.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-neutral-400 dark:text-neutral-500 bg-neutral-50 dark:bg-neutral-800/40 rounded-lg"
        style={{ height }}
      >
        Log food to see the trend
      </div>
    );
  }

  const all = series.flatMap((p) => [p.hasEntries ? p.value : null, p.goal]).filter((v) => v != null);
  const minRaw = Math.min(...all, 0);
  const maxRaw = Math.max(...all);
  const pad = Math.max((maxRaw - minRaw) * 0.12, 1);
  const min = Math.max(0, minRaw - pad);
  const max = maxRaw + pad;
  const range = max - min || 1;

  const W = 600;
  const H = height;
  const padL = 8;
  const padR = 8;
  const padT = 14;
  const padB = 12;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const xFor = (i) => padL + (i / (series.length - 1 || 1)) * innerW;
  const yFor = (v) => padT + (1 - (v - min) / range) * innerH;

  let valuePath = '';
  let prevHadValue = false;
  series.forEach((p, i) => {
    if (!p.hasEntries) {
      prevHadValue = false;
      return;
    }
    valuePath += `${prevHadValue ? 'L' : 'M'}${xFor(i).toFixed(1)},${yFor(p.value).toFixed(1)} `;
    prevHadValue = true;
  });

  let goalPath = '';
  series.forEach((p, i) => {
    goalPath += `${i === 0 ? 'M' : 'L'}${xFor(i).toFixed(1)},${yFor(p.goal).toFixed(1)} `;
  });

  const strokeMap = {
    emerald: 'stroke-emerald-500',
    sky: 'stroke-sky-500',
    amber: 'stroke-amber-500',
    rose: 'stroke-rose-500',
  };
  const fillMap = {
    emerald: 'fill-emerald-500',
    sky: 'fill-sky-500',
    amber: 'fill-amber-500',
    rose: 'fill-rose-500',
  };

  const latest = series[todayIdx];
  const showLatest = latest.hasEntries;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xl font-bold tabular-nums">
          {showLatest ? Math.round(latest.value) : '—'}
          <span className="ml-1 text-xs font-normal text-neutral-500 dark:text-neutral-400">{unit}</span>
        </span>
        <span className="text-[11px] text-neutral-500 dark:text-neutral-400 tabular-nums">
          today goal {latest.goal}{unit}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
        <path
          d={goalPath}
          fill="none"
          className="stroke-neutral-400 dark:stroke-neutral-500"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <path
          d={valuePath}
          fill="none"
          className={strokeMap[color] || strokeMap.emerald}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {series.map((p, i) =>
          p.hasEntries ? (
            <circle
              key={i}
              cx={xFor(i)}
              cy={yFor(p.value)}
              r={i === todayIdx || dataPoints.length <= 8 ? 3 : 2}
              className={fillMap[color] || fillMap.emerald}
            />
          ) : null
        )}
      </svg>
    </div>
  );
}
