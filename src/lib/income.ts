import { INCOME_SOURCE_META, type IncomeSource, type IncomeSourceType } from "./types";

let inc = 0;
export function newIncomeId(): string {
  inc += 1;
  return `inc_${inc}_${Math.random().toString(36).slice(2, 7)}`;
}

/** 레거시 소스에 id·position 부여 */
export function normalizeIncomeSources(list: IncomeSource[]): IncomeSource[] {
  return list.map((s, i) => ({
    ...s,
    id: s.id || `inc_${s.type}_${i}`,
    position: s.position ?? i,
    name: s.name || INCOME_SOURCE_META[s.type].label,
  }));
}

export function incomeSourceLabel(s: IncomeSource): string {
  return s.name?.trim() || INCOME_SOURCE_META[s.type].label;
}

export function sumMonthlyIncome(sources: IncomeSource[]): number {
  return sources.reduce((sum, s) => sum + (s.monthly || 0), 0);
}

export function createIncomeSource(
  type: IncomeSourceType,
  position: number,
  monthly = 0,
): IncomeSource {
  return {
    id: newIncomeId(),
    type,
    monthly,
    name: INCOME_SOURCE_META[type].label,
    position,
  };
}

export const INCOME_TYPE_ORDER: IncomeSourceType[] = [
  "labor",
  "capital",
  "platform",
  "freelance",
];
