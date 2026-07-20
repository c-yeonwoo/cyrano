/**
 * 실천·루틴 트래킹 (일 완료율 · 잔디 · 스트릭).
 */

import type { DayLog, RoutineItem, Tracking } from "./types";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** 로컬 YYYY-MM-DD */
export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y!, m! - 1, d!, 12, 0, 0, 0);
}

export function addDays(key: string, n: number): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}

/** 월요일 기준 주 인덱스 (레거시 주간 점검) */
export function weekIndex(dateISO: string | number | Date): number {
  const d = new Date(dateISO);
  const day = (d.getDay() + 6) % 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - day);
  monday.setHours(0, 0, 0, 0);
  return Math.floor(monday.getTime() / WEEK_MS);
}

export function mondayOf(key: string): string {
  const d = parseDateKey(key);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return dateKey(d);
}

export function isRoutineScheduled(r: RoutineItem, key: string): boolean {
  if (r.schedule === "daily") return true;
  const dow = parseDateKey(key).getDay();
  return r.schedule.weekdays.includes(dow);
}

export function scheduledRoutines(routines: RoutineItem[], key: string): RoutineItem[] {
  return [...routines]
    .filter((r) => isRoutineScheduled(r, key))
    .sort((a, b) => a.position - b.position);
}

/** JS getDay: 0=일 … 6=토 — UI는 월→일 순 */
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
export const WEEKDAY_LABEL: Record<number, string> = {
  0: "일",
  1: "월",
  2: "화",
  3: "수",
  4: "목",
  5: "금",
  6: "토",
};

export type RoutineSchedule = RoutineItem["schedule"];

export function formatSchedule(schedule: RoutineSchedule): string {
  if (schedule === "daily") return "매일";
  const days = [...schedule.weekdays].sort(
    (a, b) => WEEKDAY_ORDER.indexOf(a as (typeof WEEKDAY_ORDER)[number]) -
      WEEKDAY_ORDER.indexOf(b as (typeof WEEKDAY_ORDER)[number]),
  );
  if (days.length === 0) return "요일 없음";
  if (days.length === 7) return "매일";
  return days.map((d) => WEEKDAY_LABEL[d]).join("·");
}

export function normalizeSchedule(schedule: RoutineSchedule): RoutineSchedule {
  if (schedule === "daily") return "daily";
  const uniq = [...new Set(schedule.weekdays)].filter((d) => d >= 0 && d <= 6);
  if (uniq.length === 0) return { weekdays: [1] }; // 기본 월요일
  if (uniq.length === 7) return "daily";
  return { weekdays: uniq };
}

/** 그날 보이는 루틴만 순서 변경 → 전역 position 재배치 */
export function reorderRoutinesInDay(
  routines: RoutineItem[],
  date: string,
  orderedIds: string[],
): RoutineItem[] {
  const scheduledSet = new Set(orderedIds);
  if (orderedIds.length === 0) return routines;
  const byId = new Map(routines.map((r) => [r.id, r]));
  for (const id of orderedIds) {
    if (!byId.has(id)) return routines;
  }
  const sorted = [...routines].sort((a, b) => a.position - b.position);
  let oi = 0;
  const merged = sorted.map((r) => {
    if (!scheduledSet.has(r.id)) return r;
    const id = orderedIds[oi++]!;
    return byId.get(id)!;
  });
  return merged.map((r, i) => ({ ...r, position: i }));
}

export function logForDate(logs: DayLog[], key: string): DayLog | undefined {
  return logs.find((l) => l.date === key);
}

export interface DayCompletion {
  date: string;
  done: number;
  total: number;
  /** 0~1, total=0이면 0 */
  rate: number;
}

export function dayCompletion(
  routines: RoutineItem[],
  logs: DayLog[],
  key: string,
): DayCompletion {
  const scheduled = scheduledRoutines(routines, key);
  const total = scheduled.length;
  if (total === 0) return { date: key, done: 0, total: 0, rate: 0 };
  const log = logForDate(logs, key);
  const done = scheduled.filter((r) => log?.done[r.id]).length;
  return { date: key, done, total, rate: done / total };
}

/** 전부 완료한 날만 스트릭. 예정 항목 0인 날은 건너뜀(끊지 않음). */
export function computeDailyStreak(
  routines: RoutineItem[],
  logs: DayLog[],
  now: Date = new Date(),
): number {
  if (routines.length === 0) return 0;
  let key = dateKey(now);
  let streak = 0;
  // 오늘 미완이면 어제부터
  const today = dayCompletion(routines, logs, key);
  if (today.total > 0 && today.rate < 1) {
    key = addDays(key, -1);
  }
  for (let i = 0; i < 400; i++) {
    const c = dayCompletion(routines, logs, key);
    if (c.total === 0) {
      key = addDays(key, -1);
      continue;
    }
    if (c.rate < 1) break;
    streak += 1;
    key = addDays(key, -1);
  }
  return streak;
}

export function hasCheckedInThisWeek(checkIns: string[], now: Date = new Date()): boolean {
  const cur = weekIndex(now);
  return checkIns.some((c) => weekIndex(c) === cur);
}

/** @deprecated 주간 점검용 — 홈/레거시. 신규는 computeDailyStreak */
export function computeStreak(checkIns: string[], now: Date = new Date()): number {
  if (checkIns.length === 0) return 0;
  const weeks = new Set(checkIns.map((c) => weekIndex(c)));
  const cur = weekIndex(now);
  let start: number;
  if (weeks.has(cur)) start = cur;
  else if (weeks.has(cur - 1)) start = cur - 1;
  else return 0;
  let streak = 0;
  let w = start;
  while (weeks.has(w)) {
    streak += 1;
    w -= 1;
  }
  return streak;
}

export interface GrassDay {
  date: string;
  rate: number;
  done: number;
  total: number;
  /** 미래 날짜 */
  future: boolean;
}

/** 최근 `weekCount`주 잔디 (월→일 열, 주가 왼쪽→오른쪽) */
export function buildGrass(
  routines: RoutineItem[],
  logs: DayLog[],
  weekCount = 14,
  now: Date = new Date(),
): GrassDay[][] {
  const today = dateKey(now);
  const thisMonday = mondayOf(today);
  const startMonday = addDays(thisMonday, -(weekCount - 1) * 7);
  const weeks: GrassDay[][] = [];
  for (let w = 0; w < weekCount; w++) {
    const mon = addDays(startMonday, w * 7);
    const col: GrassDay[] = [];
    for (let d = 0; d < 7; d++) {
      const key = addDays(mon, d);
      const c = dayCompletion(routines, logs, key);
      col.push({
        date: key,
        rate: c.rate,
        done: c.done,
        total: c.total,
        future: key > today,
      });
    }
    weeks.push(col);
  }
  return weeks;
}

/** 한 주(월~일) 완료율 */
export function buildWeekDays(
  routines: RoutineItem[],
  logs: DayLog[],
  mondayKey: string,
  now: Date = new Date(),
): GrassDay[] {
  const today = dateKey(now);
  return Array.from({ length: 7 }, (_, d) => {
    const key = addDays(mondayKey, d);
    const c = dayCompletion(routines, logs, key);
    return {
      date: key,
      rate: c.rate,
      done: c.done,
      total: c.total,
      future: key > today,
    };
  });
}

/** 완료율 → 잔디 농도(0~4). 0=없음, 4=전부 */
export function rateLevel(rate: number, total: number, future: boolean): 0 | 1 | 2 | 3 | 4 {
  if (future || total === 0) return 0;
  if (rate <= 0) return 0;
  if (rate < 0.34) return 1;
  if (rate < 0.67) return 2;
  if (rate < 1) return 3;
  return 4;
}

export function normalizeTracking(raw: Tracking | null | undefined): Tracking {
  const t = raw ?? { actions: [], checkIns: [], routines: [], logs: [] };
  let routines = Array.isArray(t.routines) ? [...t.routines] : [];
  const logs = Array.isArray(t.logs) ? [...t.logs] : [];
  const actions = Array.isArray(t.actions) ? t.actions : [];
  const checkIns = Array.isArray(t.checkIns) ? t.checkIns : [];

  if (routines.length === 0 && actions.length > 0) {
    routines = actions.map((a, i) => ({
      id: a.id.startsWith("r_") ? a.id : `r_${a.id}`,
      title: a.text,
      schedule: "daily" as const,
      position: i,
      createdAt: a.createdAt,
    }));
  }

  return {
    actions,
    checkIns,
    routines,
    logs,
    dismissedNextStepStage: t.dismissedNextStepStage ?? null,
  };
}

/** 현재 stage 넛지를 아직 안 닫았으면 true */
export function shouldShowNextStepNudge(
  stage: number | null | undefined,
  dismissedStage: number | null | undefined,
): boolean {
  if (stage == null || stage < 1) return false;
  return dismissedStage !== stage;
}
