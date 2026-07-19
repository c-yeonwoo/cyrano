"use client";

import { useState } from "react";
import type { GrassDay } from "@/lib/tracking";
import { rateLevel } from "@/lib/tracking";

const LEVEL_BG: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-ink-100",
  1: "bg-sage-100",
  2: "bg-sage-500/40",
  3: "bg-sage-500/70",
  4: "bg-sage-600",
};

const DOW = ["월", "화", "수", "목", "금", "토", "일"];

/** GitHub보다 큰 셀 — 합산 완료율 농도 */
export function HabitGrass({
  weeks,
  onSelectDay,
}: {
  weeks: GrassDay[][];
  onSelectDay?: (date: string) => void;
}) {
  const [tip, setTip] = useState<GrassDay | null>(null);

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex gap-1.5">
        <div className="flex flex-col gap-1.5 pr-1.5 text-[10px] font-medium text-ink-400">
          {DOW.map((d) => (
            <span key={d} className="flex h-[22px] items-center">
              {d}
            </span>
          ))}
        </div>
        <div className="flex gap-1.5">
          {weeks.map((col, wi) => (
            <div key={wi} className="flex flex-col gap-1.5">
              {col.map((day) => {
                const level = rateLevel(day.rate, day.total, day.future);
                return (
                  <button
                    key={day.date}
                    type="button"
                    title={`${day.date} · ${day.done}/${day.total}`}
                    disabled={day.future}
                    onMouseEnter={() => setTip(day)}
                    onMouseLeave={() => setTip(null)}
                    onClick={() => onSelectDay?.(day.date)}
                    className={`h-[22px] w-[22px] rounded-[5px] transition-opacity ${
                      LEVEL_BG[level]
                    } ${day.future ? "opacity-40" : "hover:ring-2 hover:ring-sage-500/40"}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-ink-400">
        <span>완료율 낮음</span>
        <div className="flex gap-1">
          {([0, 1, 2, 3, 4] as const).map((l) => (
            <span key={l} className={`h-[14px] w-[14px] rounded-[3px] ${LEVEL_BG[l]}`} />
          ))}
        </div>
        <span>완료율 높음</span>
        {tip && !tip.future && (
          <span className="tnum ml-auto font-semibold text-ink-600">
            {tip.date} · {tip.total === 0 ? "루틴 없음" : `${tip.done}/${tip.total} (${Math.round(tip.rate * 100)}%)`}
          </span>
        )}
      </div>
    </div>
  );
}
