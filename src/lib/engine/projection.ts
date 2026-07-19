import type {
  Bucket,
  FinancialSnapshot,
  ProjectionResult,
  YearPoint,
} from "../types";
import { incomeByType } from "./stage";
import { flattenLeavesForProjection, rootRatioSum } from "./tree";

/**
 * C. 하이브리드 복리 프로젝션 (§8 · 플로우 12).
 *
 * 핵심 모델:
 *  - 배분 대상 = 연 소득 총액 = (근로+부수입+프리랜서) + 자본소득.
 *  - 각 버킷 유입 = annualIncome × ratio%.
 *  - 투자 버킷: 미실현 수익(주가·시세) = 버킷 내 복리 / 실현 수익(배당·임대·이자)
 *    = 다음 해 '자본소득'으로 upstream 재유입 → 재배분. (하이브리드, 1년 지연)
 *  - 연금·IRP(locked): 실현분도 계좌 내부 복리로 잠김 → passive/재유입 제외, '잠긴 자산'.
 *  - 저축 버킷: 저(무)수익 누적. 지출 버킷: 소비(out), 자산 제외.
 *
 * 가정 (모두 '예시·가정', README 기록):
 *  - granularity = 연 단위. 급여 성장률·인플레이션 0. 부채 상수.
 *  - 기여는 연말 납입(당해 수익 미발생), 수익은 기초 잔액 기준.
 *  - 시작 잔액 seed: 투자자산+부동산 → open-invest 버킷에 비율 배분,
 *    현금 → 저축 버킷에 비율 배분(저축 버킷 없으면 정적 보유). locked 버킷은 0에서 시작.
 */

export interface ProjectionInput {
  snapshot: FinancialSnapshot;
  buckets: Bucket[];
  horizonYears: number;
  goalNetworth?: number;
  goalPassiveIncome?: number; // 월
}

interface RunState {
  balance: number;
  bucket: Bucket;
}

function seedBalances(snapshot: FinancialSnapshot, buckets: Bucket[]) {
  const invest = buckets.filter((b) => b.category === "invest");
  const save = buckets.filter((b) => b.category === "save");

  const investSeedTotal = snapshot.investAssets + snapshot.realEstate;
  const investRatioSum = invest.reduce((s, b) => s + b.ratioPct, 0);
  const saveRatioSum = save.reduce((s, b) => s + b.ratioPct, 0);

  const states: RunState[] = [];

  // 기존 투자자산+부동산 → 모든 투자 버킷(open+locked)에 비율 배분
  for (const b of invest) {
    const share =
      investRatioSum > 0 ? b.ratioPct / investRatioSum : 1 / Math.max(1, invest.length);
    states.push({ bucket: b, balance: investSeedTotal * share });
  }
  // 현금 → 저축 버킷에 비율 배분
  for (const b of save) {
    const share =
      saveRatioSum > 0 ? b.ratioPct / saveRatioSum : 1 / Math.max(1, save.length);
    states.push({ bucket: b, balance: snapshot.cash * share });
  }
  // spend 버킷은 잔액 없음 (소비)

  // 엣지케이스 정적 보유분 (버킷이 없어 흡수 못한 자산)
  const staticInvest = invest.length === 0 ? investSeedTotal : 0;
  const staticCash = save.length === 0 ? snapshot.cash : 0;

  return { states, staticInvest, staticCash };
}

export function projectEngine(input: ProjectionInput): ProjectionResult {
  const { snapshot, horizonYears } = input;
  // 계층 → 리프의 수입 대비 %로 평탄화 후 기존 로직 적용
  const buckets = flattenLeavesForProjection(input.buckets);
  const horizon = Math.max(1, Math.min(60, Math.round(horizonYears)));

  const laborLikeAnnual =
    (incomeByType(snapshot, "labor") +
      incomeByType(snapshot, "platform") +
      incomeByType(snapshot, "freelance")) *
    12;
  const capitalBaseAnnual = incomeByType(snapshot, "capital") * 12;

  const { states, staticInvest, staticCash } = seedBalances(snapshot, buckets);

  const curve: YearPoint[] = [];

  // year 0 (현재)
  const year0Liquid =
    states
      .filter((st) => !st.bucket.isLocked)
      .reduce((s, st) => s + st.balance, 0) +
    staticInvest +
    staticCash;
  const year0Locked = states
    .filter((st) => st.bucket.isLocked)
    .reduce((s, st) => s + st.balance, 0);
  curve.push({
    year: 0,
    totalNetWorth: year0Liquid + year0Locked - snapshot.liabilities,
    liquidAssets: year0Liquid,
    lockedAssets: year0Locked,
    monthlyPassiveIncome: capitalBaseAnnual / 12,
    annualIncome: laborLikeAnnual + capitalBaseAnnual,
    laborAnnual: laborLikeAnnual,
    capitalAnnual: capitalBaseAnnual,
  });

  let realizedPrev = 0; // 전년도 실현 자본소득 → 올해 재유입
  let staticInvestBal = staticInvest;

  for (let y = 1; y <= horizon; y++) {
    const capitalAnnual = capitalBaseAnnual + realizedPrev;
    const annualIncome = laborLikeAnnual + capitalAnnual;

    let realizedThisYear = 0;

    for (const st of states) {
      const b = st.bucket;
      const contribution = annualIncome * (b.ratioPct / 100);

      if (b.category === "spend") continue; // 소비 (out)

      if (b.category === "invest") {
        const realizedRate = Math.min(b.realizedYieldPct, b.expectedAnnualReturnPct) / 100;
        const unrealizedRate = Math.max(0, b.expectedAnnualReturnPct / 100 - realizedRate);
        const realized = st.balance * realizedRate;
        st.balance = st.balance * (1 + unrealizedRate) + contribution;
        if (b.isLocked) {
          // 실현분도 계좌 내부 복리로 잠김
          st.balance += realized;
        } else {
          realizedThisYear += realized;
        }
      } else {
        // save: 저수익 누적 (이자는 버킷 내 유지, passive 아님)
        st.balance = st.balance * (1 + b.expectedAnnualReturnPct / 100) + contribution;
      }
    }

    // 정적 투자분 (버킷 없을 때) — 기본 4% 성장, 2% 실현 가정
    if (staticInvestBal > 0) {
      const realized = staticInvestBal * 0.02;
      staticInvestBal = staticInvestBal * 1.02 + realized; // 미실현+실현 모두 유지(단순화)
      realizedThisYear += realized;
    }

    realizedPrev = realizedThisYear;

    const liquid =
      states
        .filter((st) => !st.bucket.isLocked)
        .reduce((s, st) => s + st.balance, 0) +
      staticInvestBal +
      staticCash;
    const locked = states
      .filter((st) => st.bucket.isLocked)
      .reduce((s, st) => s + st.balance, 0);

    curve.push({
      year: y,
      totalNetWorth: liquid + locked - snapshot.liabilities,
      liquidAssets: liquid,
      lockedAssets: locked,
      // passive = 기존 자본소득 + 버킷 실현분 (연금·IRP 실현분은 잠겨서 제외)
      monthlyPassiveIncome: (capitalBaseAnnual + realizedThisYear) / 12,
      annualIncome,
      laborAnnual: laborLikeAnnual,
      capitalAnnual,
    });
  }

  const goalNetworth = input.goalNetworth ?? 0;
  const goalPassive = input.goalPassiveIncome ?? 0;

  const targetReachYear =
    goalNetworth > 0
      ? curve.find((p) => p.totalNetWorth >= goalNetworth)?.year ?? null
      : null;
  const passiveReachYear =
    goalPassive > 0
      ? curve.find((p) => p.monthlyPassiveIncome >= goalPassive)?.year ?? null
      : null;
  const crossoverYear =
    curve.find((p) => p.year > 0 && p.capitalAnnual >= p.laborAnnual && p.laborAnnual > 0)
      ?.year ?? null;

  const current = curve[0].totalNetWorth;
  const achievementPct = goalNetworth > 0 ? (current / goalNetworth) * 100 : 0;
  const last = curve[curve.length - 1];

  return {
    curve,
    targetReachYear,
    passiveReachYear,
    achievementPct,
    crossoverYear,
    finalNetWorth: last.totalNetWorth,
    finalMonthlyPassive: last.monthlyPassiveIncome,
  };
}

/** 루트(수입 바로 아래) 비율 합계 — 100% 검증용 */
export function ratioSum(buckets: Bucket[]): number {
  return rootRatioSum(buckets);
}

/**
 * 수익률 가정 민감도.
 * 투자·저축 버킷의 기대 수익률에 ±delta(%p)를 적용해 '보수/기본/공격' 시나리오를 만든다.
 * 목적: 단일 수익률로 생기는 '거짓 확신'을 방지하고 결과의 폭(밴드)을 정직하게 보여준다.
 */
export type SensitivityKey = "conservative" | "base" | "aggressive";

export const SENSITIVITY: Record<SensitivityKey, { label: string; deltaPp: number }> = {
  conservative: { label: "보수", deltaPp: -3 },
  base: { label: "기본", deltaPp: 0 },
  aggressive: { label: "공격", deltaPp: 3 },
};

/** 투자/저축 버킷의 기대 수익률을 deltaPp 만큼 조정 (0% 하한, 실현≤기대). */
export function adjustReturns(buckets: Bucket[], deltaPp: number): Bucket[] {
  if (deltaPp === 0) return buckets;
  return buckets.map((b) => {
    if (b.category === "spend") return b;
    const exp = Math.max(0, b.expectedAnnualReturnPct + deltaPp);
    return {
      ...b,
      expectedAnnualReturnPct: exp,
      realizedYieldPct: Math.min(b.realizedYieldPct, exp),
    };
  });
}

/** ETA·달성률 넛지 판단 (§A 극단값) */
export function needsRealityNudge(
  targetReachYear: number | null,
  targetYears: number,
): boolean {
  if (targetYears <= 0) return false;
  if (targetReachYear === null) return true; // 목표 시점 내 도달 못함
  return targetReachYear > targetYears * 1.5;
}
