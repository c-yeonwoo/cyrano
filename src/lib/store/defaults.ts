import type { Bucket, EngineConfig, FinancialSnapshot, Profile, Vision } from "../types";
import { emptyTracking } from "../types";
import { seedSpending } from "../spending/seed";
import { GROUP_PRESETS, ITEM_PRESETS, bucketFromPreset } from "../catalog";

export const DEFAULT_SNAPSHOT: FinancialSnapshot = {
  cash: 0,
  investAssets: 0,
  realEstate: 0,
  liabilities: 0,
  incomeSources: [
    { id: "inc_labor", type: "labor", monthly: 0, position: 0, name: "근로소득" },
    { id: "inc_capital", type: "capital", monthly: 0, position: 1, name: "자본소득" },
    { id: "inc_platform", type: "platform", monthly: 0, position: 2, name: "플랫폼 부수입" },
    { id: "inc_freelance", type: "freelance", monthly: 0, position: 3, name: "프리랜서" },
  ],
  monthlySpending: 0,
  emergencyMonths: 0,
};

export const DEFAULT_VISION: Vision = {
  goalNetworth: 100000, // 10억
  goalPassiveIncome: 300, // 월 300만
  targetYears: 15,
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
    // 신규 프로필은 데모 시드로 시작 — 빈 화면보다 루프 이해에 도움
    spending: seedSpending(),
    onboardedAt: null,
    updatedAt: new Date(0).toISOString(),
  };
}

export function ensureSpending(p: Profile): Profile["spending"] {
  return p.spending ?? seedSpending();
}

function preset(key: string) {
  return [...GROUP_PRESETS, ...ITEM_PRESETS].find((p) => p.key === key)!;
}

/**
 * 진단 데이터로 추천 배분 초안 (계층).
 * 루트: 투자 / 저축 / 지출 = 수입 대비 %
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
