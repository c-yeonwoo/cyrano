"use client";

import { SPEND_CATEGORY_META, type SpendCategory } from "@/lib/spending";
import { formatWon } from "@/lib/spending/format";

export function DonutChart({
  segments,
  totalWon,
  centerLabel = "합계",
  emptyLabel = "아직 기록이 없어요",
}: {
  segments: { category: SpendCategory; amountWon: number; pct: number }[];
  totalWon: number;
  centerLabel?: string;
  emptyLabel?: string;
}) {
  const size = 148;
  const stroke = 20;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  if (segments.length === 0) {
    return (
      <div className="flex h-36 items-center justify-center text-sm text-ink-400">{emptyLabel}</div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--color-ink-100)"
            strokeWidth={stroke}
          />
          {segments.map((s) => {
            const len = (s.pct / 100) * c;
            const dash = `${len} ${c - len}`;
            const el = (
              <circle
                key={s.category}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={SPEND_CATEGORY_META[s.category].color}
                strokeWidth={stroke}
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-[10px] text-ink-400">{centerLabel}</div>
          <div className="tnum text-base font-extrabold text-ink-900">{formatWon(totalWon)}</div>
        </div>
      </div>
      <ul className="w-full space-y-1.5 text-sm">
        {segments.slice(0, 6).map((s) => (
          <li key={s.category} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-ink-600">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: SPEND_CATEGORY_META[s.category].color }}
              />
              {SPEND_CATEGORY_META[s.category].label}
            </span>
            <span className="tnum text-ink-800">
              {s.pct.toFixed(0)}% · {formatWon(s.amountWon)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
