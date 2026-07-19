import { SPEND_CATEGORY_META, type SpendCategory } from "./catalog";
import type { FixedExpense, VariableLog } from "./types";
import { toDateKey } from "./format";

export function sumLogs(logs: VariableLog[]): number {
  return logs.reduce((s, l) => s + l.amountWon, 0);
}

export function logsInMonth(logs: VariableLog[], year: number, monthIndex: number): VariableLog[] {
  const prefix = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
  return logs.filter((l) => l.date.startsWith(prefix));
}

export function logsOnDate(logs: VariableLog[], dateKey: string): VariableLog[] {
  return logs.filter((l) => l.date === dateKey);
}

export function dailyTotals(
  logs: VariableLog[],
  year: number,
  monthIndex: number,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const l of logsInMonth(logs, year, monthIndex)) {
    map.set(l.date, (map.get(l.date) ?? 0) + l.amountWon);
  }
  return map;
}

export type CategorySegment = {
  category: SpendCategory;
  amountWon: number;
  pct: number;
};

function breakdownByCategory(
  rows: { category: SpendCategory; amountWon: number }[],
): CategorySegment[] {
  const totals = new Map<SpendCategory, number>();
  let sum = 0;
  for (const r of rows) {
    totals.set(r.category, (totals.get(r.category) ?? 0) + r.amountWon);
    sum += r.amountWon;
  }
  if (sum === 0) return [];
  return [...totals.entries()]
    .map(([category, amountWon]) => ({
      category,
      amountWon,
      pct: (amountWon / sum) * 100,
    }))
    .sort((a, b) => b.amountWon - a.amountWon);
}

export function categoryBreakdown(logs: VariableLog[]): CategorySegment[] {
  return breakdownByCategory(logs);
}

export function fixedCategoryBreakdown(fixed: FixedExpense[]): CategorySegment[] {
  return breakdownByCategory(fixed);
}

export function sumFixed(fixed: FixedExpense[]): number {
  return fixed.reduce((s, f) => s + f.amountWon, 0);
}

/** 남은 일수(오늘 포함) 기준 일일 여유 · 페이스 투영 */
export function budgetPace(opts: {
  spentWon: number;
  budgetWon: number;
  year: number;
  monthIndex: number;
  today?: Date;
}): {
  remainingWon: number;
  usedPct: number;
  daysLeft: number;
  dailyRoomWon: number;
  projectedWon: number;
  projectedPct: number;
  overPace: boolean;
} {
  const today = opts.today ?? new Date();
  const lastDay = new Date(opts.year, opts.monthIndex + 1, 0).getDate();
  const day =
    today.getFullYear() === opts.year && today.getMonth() === opts.monthIndex
      ? today.getDate()
      : lastDay;
  const daysLeft = Math.max(1, lastDay - day + 1);
  const elapsed = Math.max(1, day);
  const remainingWon = opts.budgetWon - opts.spentWon;
  const usedPct = opts.budgetWon > 0 ? (opts.spentWon / opts.budgetWon) * 100 : 0;
  const dailyRoomWon = remainingWon > 0 ? remainingWon / daysLeft : 0;
  const projectedWon = (opts.spentWon / elapsed) * lastDay;
  const projectedPct = opts.budgetWon > 0 ? (projectedWon / opts.budgetWon) * 100 : 0;
  return {
    remainingWon,
    usedPct,
    daysLeft,
    dailyRoomWon,
    projectedWon,
    projectedPct,
    overPace: projectedPct > 100,
  };
}

/** 또래 비교 — 공개통계 추정 placeholder (가정) */
export function peerInsight(
  breakdown: { category: SpendCategory; amountWon: number; pct: number }[],
  age?: number,
): { title: string; body: string; tone: "warning" | "neutral" } | null {
  const food = breakdown.find((b) => b.category === "food");
  if (!food) return null;
  const band = age != null && age >= 30 ? "30대" : "20대";
  // 가정: 또래 식비 비중 기준선 28%
  const peerFoodPct = 28;
  const delta = food.pct - peerFoodPct;
  if (Math.abs(delta) < 5) {
    return {
      tone: "neutral",
      title: `${band} 평균과 식비 비중이 비슷해요`,
      body: `식비 ${food.pct.toFixed(0)}% · 또래 가정 ${peerFoodPct}%. 예시·가정 수치입니다.`,
    };
  }
  if (delta > 0) {
    return {
      tone: "warning",
      title: `${band} 평균보다 식비 ${delta.toFixed(0)}%p 높아요`,
      body: `이번 달 식비 비중 ${food.pct.toFixed(0)}%(가정 또래 ${peerFoodPct}%). 배달·외식을 한 끼만 줄여도 변동 예산에 여유가 생깁니다.`,
    };
  }
  return {
    tone: "neutral",
    title: `식비 비중이 ${band} 평균보다 낮아요`,
    body: `식비 ${food.pct.toFixed(0)}% · 가정 또래 ${peerFoodPct}%. 예시·가정입니다.`,
  };
}

/** 자기 패턴 — 주중 점심대(11–14시는 수기에 시간 없어 요일·메모 휴리스틱) */
export function patternInsight(logs: VariableLog[]): {
  title: string;
  body: string;
} | null {
  if (logs.length < 3) return null;
  const weekend = logs.filter((l) => {
    const d = new Date(l.date + "T12:00:00");
    const wd = d.getDay();
    return wd === 0 || wd === 6;
  });
  const weekday = logs.length - weekend.length;
  const wSum = sumLogs(weekend);
  const dSum = sumLogs(logs.filter((l) => !weekend.includes(l)));
  const wAvg = weekend.length ? wSum / Math.max(1, weekend.length) : 0;
  const dAvg = weekday ? dSum / Math.max(1, weekday) : 0;
  if (dAvg > 0 && wAvg >= dAvg * 1.5) {
    return {
      title: "주말 지출이 평일보다 커요",
      body: `주말 하루 평균 ${Math.round(wAvg / 1000) / 10}만 · 평일 ${Math.round(dAvg / 1000) / 10}만. 주말만 한도 캡을 두면 변동 레버가 잡힙니다.`,
    };
  }
  const cafe = logs.filter((l) => l.category === "cafe").length;
  if (cafe >= 4) {
    return {
      title: `카페 ${cafe}회 — 작은 습관 레버`,
      body: "즐겨찾기 금액만 유지해도 예산 페이스가 안정됩니다. 원하면 한도를 즐겨찾기에 맞춰 보세요.",
    };
  }
  const foodMemos = logs.filter(
    (l) => l.category === "food" && /점심|배달|외식/.test(l.memo),
  ).length;
  if (foodMemos >= 3) {
    return {
      title: "점심·배달 기록이 잦아요",
      body: `관련 기록 ${foodMemos}건. 평일 점심 상한을 정하면 변동지출 통제가 쉬워집니다.`,
    };
  }
  return {
    title: "기록 리듬이 쌓이고 있어요",
    body: "변동은 조절하는 레버입니다. 자주 쓰는 항목은 즐겨찾기로 남겨 두세요.",
  };
}

export function categoryLabel(c: SpendCategory): string {
  return SPEND_CATEGORY_META[c].label;
}

export function todayKey(): string {
  return toDateKey(new Date());
}
