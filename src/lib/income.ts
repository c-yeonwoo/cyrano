import { INCOME_SOURCE_META, type IncomeSource, type IncomeSourceType } from "./types";

/** 자산 실현 현금흐름 → 수입원으로 연결할 때 쓰는 고정 id */
export const ASSET_CASHFLOW_SOURCE_ID = "inc_asset_cashflow";

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
  monthly: number,
  name?: string,
): IncomeSource {
  return {
    id: newIncomeId(),
    type,
    monthly: Math.max(0, monthly),
    name: name?.trim() || INCOME_SOURCE_META[type].label,
    position,
  };
}

export const INCOME_TYPE_ORDER: IncomeSourceType[] = [
  "labor",
  "capital",
  "platform",
  "freelance",
];

/** 팔레트에 바로 보이는 샘플 프리셋 (나머지는 직접 만들기) */
export const INCOME_PALETTE_PRESETS: IncomeSourceType[] = ["labor"];
