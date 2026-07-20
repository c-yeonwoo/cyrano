import type { Bucket, EngineConfig, FinancialSnapshot, Profile, Vision } from "../types";
import { emptyTracking } from "../types";
import { emptySpending } from "../spending/types";
import { GROUP_PRESETS, ITEM_PRESETS, bucketFromPreset } from "../catalog";

export const DEFAULT_SNAPSHOT: FinancialSnapshot = {
  cash: 0,
  investAssets: 0,
  realEstate: 0,
  liabilities: 0,
  incomeSources: [],
  monthlySpending: 0,
  emergencyMonths: 0,
};

export const DEFAULT_VISION: Vision = {
  goalNetworth: 0,
  goalPassiveIncome: 0,
  targetYears: 10,
  currentAge: undefined,
  why: "",
  scenes: [
    { type: "place", text: "" },
    { type: "day", text: "" },
    { type: "work", text: "" },
    { type: "people", text: "" },
  ],
};

export function emptyProfile(): Profile {
  return {
    vision: null,
    snapshot: null,
    engine: { buckets: [] },
    scenarios: [],
    tracking: emptyTracking(),
    spending: emptySpending(),
    uiPrefs: { hiddenHomeMetrics: [] },
    onboardedAt: null,
    updatedAt: new Date(0).toISOString(),
  };
}

export function ensureSpending(p: Profile): Profile["spending"] {
  return p.spending ?? emptySpending();
}

function preset(key: string) {
  return [...GROUP_PRESETS, ...ITEM_PRESETS].find((p) => p.key === key)!;
}

/**
 * 진단 데이터로 추천 배분 초안 (계층).
 * 루트: 투자 / 저축 / 지출 = 월수입 대비 %
 * 하위: 각 묶음 안에서 상위 대비 %
 * 모두 '예시·가정' — 사용자가 자유롭게 수정.
 */
export function suggestEngineFromSnapshot(s: FinancialSnapshot): EngineConfig {
  const totalIncome = s.incomeSources.reduce((sum, i) => sum + i.monthly, 0);
  const spendPct =
    totalIncome > 0 ? Math.min(90, Math.round((s.monthlySpending / totalIncome) * 100)) : 40;
  const savablePct = 100 - spendPct;
  const savePct = Math.round(savablePct * 0.3);
  const investPct = savablePct - savePct;

  const invest = bucketFromPreset(preset("g_invest"), 0, null);
  invest.ratioPct = investPct;
  const save = bucketFromPreset(preset("g_save"), 1, null);
  save.ratioPct = savePct;
  const spend = bucketFromPreset(preset("g_spend"), 2, null);
  spend.ratioPct = spendPct;

  const stock = bucketFromPreset(preset("stock"), 0, invest.id);
  stock.ratioPct = 65;
  const pension = bucketFromPreset(preset("pension"), 1, invest.id);
  pension.ratioPct = 35;

  const emergency = bucketFromPreset(preset("emergency"), 0, save.id);
  emergency.ratioPct = 100;

  const fixed = bucketFromPreset(preset("fixed"), 0, spend.id);
  fixed.ratioPct = 60;
  const variable = bucketFromPreset(preset("variable"), 1, spend.id);
  variable.ratioPct = 40;

  const buckets: Bucket[] = [invest, save, spend, stock, pension, emergency, fixed, variable];
  return { buckets };
}
