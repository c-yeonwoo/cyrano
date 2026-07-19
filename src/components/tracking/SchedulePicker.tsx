"use client";

import {
  WEEKDAY_LABEL,
  WEEKDAY_ORDER,
  type RoutineSchedule,
} from "@/lib/tracking";

export function SchedulePicker({
  value,
  onChange,
}: {
  value: RoutineSchedule;
  onChange: (next: RoutineSchedule) => void;
}) {
  const selected =
    value === "daily" ? new Set(WEEKDAY_ORDER) : new Set(value.weekdays);
  const all = selected.size === 7;

  const toggleDay = (day: number) => {
    if (all) {
      // 매일 → 해당 요일만
      onChange({ weekdays: [day] });
      return;
    }
    const next = new Set(selected);
    if (next.has(day)) next.delete(day);
    else next.add(day);
    if (next.size === 0) return;
    if (next.size === 7) onChange("daily");
    else onChange({ weekdays: [...next] });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onChange("daily")}
          className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${
            all
              ? "border-sage-500 bg-sage-500 text-white"
              : "border-ink-200 text-ink-500 hover:bg-ink-50"
          }`}
        >
          매일
        </button>
        {WEEKDAY_ORDER.map((d) => {
          const on = !all && selected.has(d);
          return (
            <button
              key={d}
              type="button"
              onClick={() => toggleDay(d)}
              className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${
                on
                  ? "border-sage-500 bg-sage-500 text-white"
                  : all
                    ? "border-sage-200 bg-sage-50 text-sage-600"
                    : "border-ink-200 text-ink-500 hover:bg-ink-50"
              }`}
            >
              {WEEKDAY_LABEL[d]}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-ink-400">
        {all
          ? "매일 반복"
          : `매주 ${[...selected]
              .sort(
                (a, b) =>
                  WEEKDAY_ORDER.indexOf(a as (typeof WEEKDAY_ORDER)[number]) -
                  WEEKDAY_ORDER.indexOf(b as (typeof WEEKDAY_ORDER)[number]),
              )
              .map((d) => WEEKDAY_LABEL[d])
              .join("·")} 반복`}
      </p>
    </div>
  );
}
