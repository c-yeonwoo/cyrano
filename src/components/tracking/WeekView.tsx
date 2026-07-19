"use client";

import type { GrassDay } from "@/lib/tracking";
import { rateLevel } from "@/lib/tracking";

const DOW = ["월", "화", "수", "목", "금", "토", "일"];

const LEVEL_RING: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "border-ink-200 bg-ink-50 text-ink-400",
  1: "border-sage-200 bg-sage-50 text-sage-600",
  2: "border-sage-300 bg-sage-100 text-sage-700",
  3: "border-sage-500/50 bg-sage-500/20 text-sage-700",
  4: "border-sage-600 bg-sage-500 text-white",
};

export function WeekView({
  days,
  selectedDate,
  onSelectDay,
  onPrev,
  onNext,
  weekLabel,
}: {
  days: GrassDay[];
  selectedDate: string;
  onSelectDay: (date: string) => void;
  onPrev: () => void;
  onNext: () => void;
  weekLabel: string;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onPrev}
          className="rounded-lg px-2 py-1 text-sm font-semibold text-ink-500 hover:bg-ink-100"
        >
          ←
        </button>
        <div className="text-sm font-bold text-ink-700">{weekLabel}</div>
        <button
          type="button"
          onClick={onNext}
          className="rounded-lg px-2 py-1 text-sm font-semibold text-ink-500 hover:bg-ink-100"
        >
          →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, i) => {
          const level = rateLevel(day.rate, day.total, day.future);
          const selected = day.date === selectedDate;
          const dayNum = day.date.slice(8);
          return (
            <button
              key={day.date}
              type="button"
              disabled={day.future}
              onClick={() => onSelectDay(day.date)}
              className={`flex flex-col items-center rounded-xl border px-1 py-2.5 transition-shadow ${
                LEVEL_RING[level]
              } ${selected ? "ring-2 ring-sage-500 ring-offset-1" : ""} ${
                day.future ? "opacity-40" : "hover:shadow-sm"
              }`}
            >
              <span className="text-[10px] font-semibold opacity-80">{DOW[i]}</span>
              <span className="tnum mt-0.5 text-base font-extrabold">{Number(dayNum)}</span>
              <span className="tnum mt-1 text-[10px] font-semibold opacity-90">
                {day.future || day.total === 0
                  ? "—"
                  : `${Math.round(day.rate * 100)}%`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
