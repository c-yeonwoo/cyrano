import { describe, it, expect } from "vitest";
import {
  addDays,
  buildGrass,
  computeDailyStreak,
  computeStreak,
  dateKey,
  dayCompletion,
  formatSchedule,
  hasCheckedInThisWeek,
  mondayOf,
  rateLevel,
  reorderRoutinesInDay,
  shouldShowNextStepNudge,
  weekIndex,
} from "./tracking";
import type { DayLog, RoutineItem } from "./types";

const routines: RoutineItem[] = [
  {
    id: "r1",
    title: "A",
    schedule: "daily",
    position: 0,
    createdAt: "2026-01-01",
  },
  {
    id: "r2",
    title: "B",
    schedule: "daily",
    position: 1,
    createdAt: "2026-01-01",
  },
];

describe("tracking streak (legacy weekly)", () => {
  const now = new Date("2026-07-15T10:00:00");
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();

  it("점검이 없으면 스트릭 0", () => {
    expect(computeStreak([], now)).toBe(0);
  });

  it("이번 주 점검 시 스트릭 1", () => {
    expect(computeStreak([daysAgo(0)], now)).toBe(1);
    expect(hasCheckedInThisWeek([daysAgo(0)], now)).toBe(true);
  });

  it("연속 3주 점검 시 스트릭 3", () => {
    expect(computeStreak([daysAgo(0), daysAgo(7), daysAgo(14)], now)).toBe(3);
  });

  it("weekIndex는 같은 주 내에서 동일", () => {
    expect(weekIndex("2026-07-13")).toBe(weekIndex("2026-07-19"));
  });
});

describe("day completion & daily streak", () => {
  const now = new Date("2026-07-15T12:00:00"); // 수
  const today = dateKey(now);

  it("완료율 계산", () => {
    const logs: DayLog[] = [{ date: today, done: { r1: true, r2: false } }];
    const c = dayCompletion(routines, logs, today);
    expect(c.done).toBe(1);
    expect(c.total).toBe(2);
    expect(c.rate).toBe(0.5);
  });

  it("전부 완료한 연속일 스트릭", () => {
    const d0 = today;
    const d1 = addDays(today, -1);
    const d2 = addDays(today, -2);
    const logs: DayLog[] = [
      { date: d0, done: { r1: true, r2: true } },
      { date: d1, done: { r1: true, r2: true } },
      { date: d2, done: { r1: true, r2: false } },
    ];
    expect(computeDailyStreak(routines, logs, now)).toBe(2);
  });

  it("오늘 미완이면 어제부터 스트릭", () => {
    const d1 = addDays(today, -1);
    const logs: DayLog[] = [
      { date: today, done: { r1: true } },
      { date: d1, done: { r1: true, r2: true } },
    ];
    expect(computeDailyStreak(routines, logs, now)).toBe(1);
  });

  it("rateLevel", () => {
    expect(rateLevel(0, 2, false)).toBe(0);
    expect(rateLevel(0.5, 2, false)).toBe(2);
    expect(rateLevel(1, 2, false)).toBe(4);
    expect(rateLevel(1, 2, true)).toBe(0);
  });

  it("잔디 주 수", () => {
    const grass = buildGrass(routines, [], 4, now);
    expect(grass).toHaveLength(4);
    expect(grass[0]).toHaveLength(7);
    expect(mondayOf(today)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("formatSchedule", () => {
    expect(formatSchedule("daily")).toBe("매일");
    expect(formatSchedule({ weekdays: [1, 4] })).toBe("월·목");
  });

  it("다음 한 걸음 넛지는 stage마다 1회", () => {
    expect(shouldShowNextStepNudge(1, null)).toBe(true);
    expect(shouldShowNextStepNudge(1, 1)).toBe(false);
    expect(shouldShowNextStepNudge(2, 1)).toBe(true);
  });

  it("요일 루틴 순서 변경", () => {
    const list: RoutineItem[] = [
      { id: "a", title: "A", schedule: "daily", position: 0, createdAt: "" },
      { id: "b", title: "B", schedule: { weekdays: [3] }, position: 1, createdAt: "" },
      { id: "c", title: "C", schedule: "daily", position: 2, createdAt: "" },
    ];
    // 2026-07-15 = 수 → a,b,c
    const next = reorderRoutinesInDay(list, "2026-07-15", ["c", "a", "b"]);
    expect(next.map((r) => r.id)).toEqual(["c", "a", "b"]);
    expect(next.map((r) => r.position)).toEqual([0, 1, 2]);
  });
});
