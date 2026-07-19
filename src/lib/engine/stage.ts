import type { FinancialSnapshot, IncomeSourceType } from "../types";

/**
 * B. 8단계 신호 게이트 판정 (§4 · §8).
 *
 * 절대 금액이 아니라 '신호 게이트'로 판정한다. 임계값은 모두 튜닝 가능·'가정' 라벨.
 * 게이트는 1→8 누적 충족. 단 8단계(경제적 자유: passive > 생활비)는 신호가 명확하므로 override.
 *
 * 임계값 기본값 (열린 결정 → README 기록):
 *  - 저축률 목표: 40%
 *  - 비상금 목표: 3개월
 *  - passive 정의: 실현 자본소득(배당·임대·이자). 연금·IRP 제외.
 */

export const STAGE_THRESHOLDS = {
  savingsRateTarget: 40, // %
  emergencyMonthsTarget: 3,
  portfolioGrowthMultiple: 3, // 투자자산 >= 월소득 × N → 성장 궤도 신호
  realEstateExpandNetworth: 30000, // 만원(3억) 이상 부동산 → 확장 신호
};

/** 짧고 읽기 쉬운 단계명 (홈·진단 공통) */
export const STAGE_NAMES: Record<number, string> = {
  1: "소득 안정",
  2: "종잣돈",
  3: "투자 시작",
  4: "포트폴리오",
  5: "레버리지",
  6: "현금흐름",
  7: "자산 확장",
  8: "경제적 자유",
};

export interface SnapshotMetrics {
  netWorth: number; // 만원
  totalMonthlyIncome: number; // 만원
  laborLikeMonthly: number; // 근로+부수입+프리랜서
  capitalMonthly: number; // 실현 자본소득(배당·임대·이자)
  monthlySavable: number; // 소득 - 지출
  savingsRatePct: number;
  laborSharePct: number; // 소득구조 근로 비중
  capitalSharePct: number;
  passiveToSpendingPct: number; // passive / 생활비
}

export function incomeByType(s: FinancialSnapshot, type: IncomeSourceType): number {
  return s.incomeSources
    .filter((i) => i.type === type)
    .reduce((sum, i) => sum + (i.monthly || 0), 0);
}

export function computeMetrics(s: FinancialSnapshot): SnapshotMetrics {
  const labor = incomeByType(s, "labor");
  const capital = incomeByType(s, "capital");
  const platform = incomeByType(s, "platform");
  const freelance = incomeByType(s, "freelance");
  const laborLikeMonthly = labor + platform + freelance;
  const totalMonthlyIncome = laborLikeMonthly + capital;
  const monthlySavable = totalMonthlyIncome - s.monthlySpending;
  const netWorth = s.cash + s.investAssets + s.realEstate - s.liabilities;

  const savingsRatePct =
    totalMonthlyIncome > 0 ? (monthlySavable / totalMonthlyIncome) * 100 : 0;
  const laborSharePct =
    totalMonthlyIncome > 0 ? (laborLikeMonthly / totalMonthlyIncome) * 100 : 0;
  const capitalSharePct = totalMonthlyIncome > 0 ? (capital / totalMonthlyIncome) * 100 : 0;
  const passiveToSpendingPct =
    s.monthlySpending > 0 ? (capital / s.monthlySpending) * 100 : 0;

  return {
    netWorth,
    totalMonthlyIncome,
    laborLikeMonthly,
    capitalMonthly: capital,
    monthlySavable,
    savingsRatePct,
    laborSharePct,
    capitalSharePct,
    passiveToSpendingPct,
  };
}

export interface Gate {
  stage: number;
  label: string;
  met: boolean;
}

export interface StageResult {
  stage: number; // 1~8
  name: string;
  metrics: SnapshotMetrics;
  gates: Gate[];
  /** 다음 단계로 가기 위한 '다음 한 걸음' */
  nextStep: string;
}

function evalGates(s: FinancialSnapshot, m: SnapshotMetrics): Gate[] {
  const t = STAGE_THRESHOLDS;
  const hasStableIncome = m.laborLikeMonthly > 0 || m.totalMonthlyIncome > 0;
  const hasEmergencyProgress = s.emergencyMonths >= 1;
  const savingsOk = m.savingsRatePct >= t.savingsRateTarget;
  const investStarted = s.investAssets > 0;
  const growthTrajectory =
    s.investAssets >= m.totalMonthlyIncome * t.portfolioGrowthMultiple &&
    m.totalMonthlyIncome > 0;
  const leverage = s.realEstate > 0;
  const pipeline = m.capitalMonthly > 0 || incomeByType(s, "platform") > 0 || incomeByType(s, "freelance") > 0;
  const realEstateExpand = s.realEstate >= t.realEstateExpandNetworth;
  const economicFreedom = m.capitalMonthly >= s.monthlySpending && s.monthlySpending > 0;

  return [
    { stage: 1, label: "안정 소득 있음", met: hasStableIncome },
    { stage: 2, label: `비상금 확보 진행 + 저축률 ${t.savingsRateTarget}%↑`, met: hasEmergencyProgress && savingsOk },
    { stage: 3, label: "적립 투자·투자자산 존재", met: investStarted },
    { stage: 4, label: "포트폴리오 성장 궤도", met: growthTrajectory },
    { stage: 5, label: "부동산 레버리지 진입", met: leverage },
    { stage: 6, label: "자본·파이프라인 소득 발생", met: pipeline },
    { stage: 7, label: "부동산 확장 보유", met: realEstateExpand },
    { stage: 8, label: "passive income > 생활비", met: economicFreedom },
  ];
}

const NEXT_STEP: Record<number, string> = {
  1: "매달 자동이체로 저축률을 40% 이상으로 끌어올려 보세요.",
  2: "비상금 3개월치를 확보하고 소액이라도 적립식 투자를 시작해요 → 3단계.",
  3: "절세계좌(연금·IRP)와 투자 비중을 늘려 포트폴리오를 키워요 → 4단계.",
  4: "부동산 등 레버리지 자산 진입을 검토해요 (무리 없는 범위) → 5단계.",
  5: "배당·임대·부수입 등 현금흐름 파이프라인을 만들어요 → 6단계.",
  6: "부동산·투자자산을 확장해 자산 규모를 키워요 → 7단계.",
  7: "실현 자본소득이 생활비를 넘도록 배분을 조정해요 → 8단계.",
  8: "경제적 자유 상태예요. 목표를 재조정하거나 다음 비전을 그려보세요.",
};

/**
 * 단계 판정: 1부터 연속으로 충족된 마지막 게이트가 현재 단계.
 * 단, 8단계(경제적 자유)는 신호가 명확하면 override.
 */
export function computeStage(s: FinancialSnapshot): StageResult {
  const metrics = computeMetrics(s);
  const gates = evalGates(s, metrics);

  // 1→8 연속으로 충족된 마지막 게이트가 현재 단계
  let stage = 0;
  for (const g of gates) {
    if (g.met) stage = g.stage;
    else break;
  }
  // 경제적 자유(8) 신호가 명확하면 override
  if (gates[7].met) stage = 8;
  // 최소 1단계 보장 (좌절 방지 — "1~2단계는 정상 출발점")
  if (stage < 1) stage = 1;

  return {
    stage,
    name: STAGE_NAMES[stage],
    metrics,
    gates,
    nextStep: NEXT_STEP[stage] ?? NEXT_STEP[1],
  };
}
