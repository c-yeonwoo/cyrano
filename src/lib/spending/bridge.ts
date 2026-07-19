import type { Bucket } from "../types";
import { bucketFromPreset, presetByKey } from "../catalog";
import { childrenOf, monthlyManwon, roots } from "../engine/tree";
import type { SpendingState } from "./types";
import { logsInMonth, sumFixed, sumLogs } from "./calc";

/**
 * 지출(원) ↔ 엔진/진단(만원) 단위 브리지.
 * 엔진 `snapshot.monthlySpending`, 배분 노드 `g_spend` 제안값에 사용.
 */

export function wonToManwon(won: number): number {
  return Math.floor(won / 10_000);
}

export function manwonToWon(manwon: number): number {
  return Math.max(0, Math.round(manwon) * 10_000);
}

/** Phase A / 엔진 sync용 — 당월 변동 + 고정 전체(결제일 무관) */
export function monthSpendingBreakdown(
  spending: SpendingState,
  year: number,
  monthIndex: number,
): {
  variableWon: number;
  fixedWon: number;
  totalWon: number;
  manwon: number;
} {
  const variableWon = sumLogs(logsInMonth(spending.logs, year, monthIndex));
  const fixedWon = sumFixed(spending.fixed);
  const totalWon = variableWon + fixedWon;
  return {
    variableWon,
    fixedWon,
    totalWon,
    manwon: wonToManwon(totalWon),
  };
}

/** 해당 월 변동합 + 고정합 → 엔진 monthlySpending(만원, 버림) */
export function monthTotalSpendingManwon(
  spending: SpendingState,
  year: number,
  monthIndex: number,
): number {
  return monthSpendingBreakdown(spending, year, monthIndex).manwon;
}

/**
 * 소득(만원) 대비 지출 비중 → 엔진 배분 ratio 제안(0–1).
 * 고정/변동 자식 비중도 같이 돌려준다.
 */
export function spendRatioSuggestion(
  spending: SpendingState,
  year: number,
  monthIndex: number,
  monthlyIncomeManwon: number,
): {
  totalRatio: number;
  fixedRatioOfSpend: number;
  variableRatioOfSpend: number;
  monthlySpendingManwon: number;
} | null {
  if (monthlyIncomeManwon <= 0) return null;
  const variableWon = sumLogs(logsInMonth(spending.logs, year, monthIndex));
  const fixedWon = sumFixed(spending.fixed);
  const totalWon = variableWon + fixedWon;
  const monthlySpendingManwon = wonToManwon(totalWon);
  const totalRatio = Math.min(0.95, monthlySpendingManwon / monthlyIncomeManwon);
  const spend = totalWon > 0 ? totalWon : 1;
  return {
    totalRatio,
    fixedRatioOfSpend: fixedWon / spend,
    variableRatioOfSpend: variableWon / spend,
    monthlySpendingManwon,
  };
}

/** 엔진 `ratioPct`(0–100)용 제안 */
export type SpendRatioPctSuggestion = {
  spendPct: number;
  fixedPct: number;
  variablePct: number;
  monthlySpendingManwon: number;
};

export function toSpendRatioPctSuggestion(
  raw: NonNullable<ReturnType<typeof spendRatioSuggestion>>,
): SpendRatioPctSuggestion {
  const spendPct = Math.min(95, Math.round(raw.totalRatio * 100));
  const fixedPct = Math.round(raw.fixedRatioOfSpend * 100);
  const variablePct = Math.max(0, 100 - fixedPct);
  return {
    spendPct,
    fixedPct,
    variablePct,
    monthlySpendingManwon: raw.monthlySpendingManwon,
  };
}

export function findSpendRoot(buckets: Bucket[]): Bucket | undefined {
  return roots(buckets).find((b) => b.category === "spend");
}

function matchSpendChild(kids: Bucket[], kind: "fixed" | "variable"): Bucket | undefined {
  if (kind === "fixed") {
    return kids.find((k) => k.name === "고정지출") ?? kids.find((k) => /고정/.test(k.name));
  }
  return kids.find((k) => k.name === "변동지출") ?? kids.find((k) => /변동/.test(k.name));
}

export function currentSpendRatios(buckets: Bucket[]): {
  spendPct: number | null;
  fixedPct: number | null;
  variablePct: number | null;
} {
  const spend = findSpendRoot(buckets);
  if (!spend) return { spendPct: null, fixedPct: null, variablePct: null };
  const kids = childrenOf(spend.id, buckets);
  const fixed = matchSpendChild(kids, "fixed");
  const variable = matchSpendChild(kids, "variable");
  return {
    spendPct: spend.ratioPct,
    fixedPct: fixed?.ratioPct ?? null,
    variablePct: variable?.ratioPct ?? null,
  };
}

/** 제안과 현재 비율이 다르면 true (배지·CTA 노출용) */
export function isSpendSuggestionDifferent(
  buckets: Bucket[],
  suggestion: SpendRatioPctSuggestion,
): boolean {
  const cur = currentSpendRatios(buckets);
  if (cur.spendPct == null) return true;
  if (cur.spendPct !== suggestion.spendPct) return true;
  if (cur.fixedPct != null && cur.fixedPct !== suggestion.fixedPct) return true;
  if (cur.variablePct != null && cur.variablePct !== suggestion.variablePct) return true;
  if (cur.fixedPct == null || cur.variablePct == null) return true;
  return false;
}

/**
 * Phase B — 지출 루트·고정/변동 ratioPct만 갱신 (canvasX/Y·다른 루트 유지).
 * 지출 묶음이 없으면 생성한다.
 */
export function applySpendRatioToBuckets(
  buckets: Bucket[],
  suggestion: SpendRatioPctSuggestion,
): { buckets: Bucket[]; createdSpend: boolean; createdChildren: boolean } {
  const spendPreset = presetByKey("g_spend");
  const fixedPreset = presetByKey("fixed");
  const variablePreset = presetByKey("variable");
  if (!spendPreset || !fixedPreset || !variablePreset) {
    return { buckets, createdSpend: false, createdChildren: false };
  }

  let next = [...buckets];
  let spend = findSpendRoot(next);
  let createdSpend = false;
  let createdChildren = false;

  if (!spend) {
    spend = bucketFromPreset(spendPreset, roots(next).length, null);
    spend.ratioPct = suggestion.spendPct;
    const fixed = bucketFromPreset(fixedPreset, 0, spend.id);
    fixed.ratioPct = suggestion.fixedPct;
    const variable = bucketFromPreset(variablePreset, 1, spend.id);
    variable.ratioPct = suggestion.variablePct;
    next = [...next, spend, fixed, variable];
    return { buckets: next, createdSpend: true, createdChildren: true };
  }

  const spendId = spend.id;
  next = next.map((b) =>
    b.id === spendId ? { ...b, ratioPct: suggestion.spendPct } : b,
  );

  const kids = childrenOf(spendId, next);
  let fixed = matchSpendChild(kids, "fixed");
  let variable = matchSpendChild(kids, "variable");

  if (!fixed) {
    fixed = bucketFromPreset(fixedPreset, kids.length, spendId);
    fixed.ratioPct = suggestion.fixedPct;
    next = [...next, fixed];
    createdChildren = true;
  } else {
    const fid = fixed.id;
    next = next.map((b) =>
      b.id === fid ? { ...b, ratioPct: suggestion.fixedPct } : b,
    );
  }

  if (!variable) {
    const pos = childrenOf(spendId, next).length;
    variable = bucketFromPreset(variablePreset, pos, spendId);
    variable.ratioPct = suggestion.variablePct;
    next = [...next, variable];
    createdChildren = true;
  } else {
    const vid = variable.id;
    next = next.map((b) =>
      b.id === vid ? { ...b, ratioPct: suggestion.variablePct } : b,
    );
  }

  return { buckets: next, createdSpend, createdChildren };
}

/** Phase C — 엔진 지출 한도 → 변동지출 예산(원) 제안 */
export type EngineVariableBudgetSuggestion = {
  suggestedWon: number;
  spendManwon: number;
  variableManwon: number;
  fixedManwon: number;
  /** variable 노드 월환산 vs 지출−고정 */
  source: "variable_node" | "spend_minus_fixed";
};

export function engineVariableBudgetSuggestion(
  buckets: Bucket[],
  monthlyIncomeManwon: number,
  /** 엔진에 고정 자식이 없을 때 쓰는 지출관리 고정합(원) */
  fixedExpenseWon = 0,
): EngineVariableBudgetSuggestion | null {
  if (monthlyIncomeManwon <= 0) return null;
  const spend = findSpendRoot(buckets);
  if (!spend) return null;

  const spendManwon = monthlyManwon(spend, buckets, monthlyIncomeManwon);
  if (spendManwon <= 0) return null;

  const kids = childrenOf(spend.id, buckets);
  const variable = matchSpendChild(kids, "variable");
  const fixed = matchSpendChild(kids, "fixed");
  const fixedManwon = fixed
    ? monthlyManwon(fixed, buckets, monthlyIncomeManwon)
    : wonToManwon(fixedExpenseWon);

  if (variable) {
    const variableManwon = monthlyManwon(variable, buckets, monthlyIncomeManwon);
    return {
      suggestedWon: manwonToWon(variableManwon),
      spendManwon,
      variableManwon,
      fixedManwon,
      source: "variable_node",
    };
  }

  const variableManwon = Math.max(0, spendManwon - fixedManwon);
  return {
    suggestedWon: manwonToWon(variableManwon),
    spendManwon,
    variableManwon,
    fixedManwon,
    source: "spend_minus_fixed",
  };
}

export function isEngineBudgetDifferent(
  currentBudgetWon: number,
  suggestion: EngineVariableBudgetSuggestion,
): boolean {
  return currentBudgetWon !== suggestion.suggestedWon;
}
