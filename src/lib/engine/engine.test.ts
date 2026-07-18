import { describe, it, expect } from "vitest";
import { computeStage, computeMetrics } from "./stage";
import { projectEngine, ratioSum, needsRealityNudge, adjustReturns, SENSITIVITY } from "./projection";
import type { Bucket, FinancialSnapshot } from "../types";

function snapshot(overrides: Partial<FinancialSnapshot> = {}): FinancialSnapshot {
  return {
    cash: 2000,
    investAssets: 1500,
    realEstate: 0,
    liabilities: 500,
    incomeSources: [
      { type: "labor", monthly: 300 },
      { type: "capital", monthly: 5 },
    ],
    monthlySpending: 160,
    emergencyMonths: 1,
    ...overrides,
  };
}

function bucket(over: Partial<Bucket>): Bucket {
  return {
    id: Math.random().toString(36).slice(2),
    category: "invest",
    name: "test",
    ratioPct: 0,
    expectedAnnualReturnPct: 0,
    realizedYieldPct: 0,
    isLocked: false,
    position: 0,
    ...over,
  };
}

describe("computeMetrics", () => {
  it("wireframe 예시(16번)와 일치: 순자산 3000만, 저축률 ~48%, 근로98:자본2, passive/생활비 3%", () => {
    const m = computeMetrics(snapshot());
    expect(m.netWorth).toBe(3000); // 2000+1500+0-500
    expect(Math.round(m.savingsRatePct)).toBe(48); // (305-160)/305
    expect(Math.round(m.laborSharePct)).toBe(98);
    expect(Math.round(m.passiveToSpendingPct)).toBe(3); // 5/160
  });
});

describe("computeStage", () => {
  it("소득만 있고 저축률 낮으면 1단계", () => {
    const r = computeStage(
      snapshot({ monthlySpending: 290, emergencyMonths: 0 }),
    );
    expect(r.stage).toBe(1);
  });

  it("비상금+저축률+투자자산 있으면 최소 3단계", () => {
    const r = computeStage(
      snapshot({ emergencyMonths: 3, monthlySpending: 160, investAssets: 1500 }),
    );
    expect(r.stage).toBeGreaterThanOrEqual(3);
  });

  it("passive(자본소득) > 생활비면 8단계 override", () => {
    const r = computeStage(
      snapshot({
        incomeSources: [{ type: "capital", monthly: 300 }],
        monthlySpending: 160,
      }),
    );
    expect(r.stage).toBe(8);
  });

  it("항상 다음 한 걸음을 제시한다", () => {
    expect(computeStage(snapshot()).nextStep).toBeTruthy();
  });
});

describe("projectEngine", () => {
  const invest100: Bucket[] = [
    bucket({ category: "invest", name: "주식", ratioPct: 100, expectedAnnualReturnPct: 8, realizedYieldPct: 2 }),
  ];

  it("year 0 순자산 = 현재 스냅샷 순자산", () => {
    const r = projectEngine({ snapshot: snapshot(), buckets: invest100, horizonYears: 15 });
    expect(r.curve[0].totalNetWorth).toBe(3000);
    expect(r.curve[0].year).toBe(0);
  });

  it("복리로 자산이 증가한다 (단조 증가)", () => {
    const r = projectEngine({ snapshot: snapshot(), buckets: invest100, horizonYears: 15 });
    for (let i = 1; i < r.curve.length; i++) {
      expect(r.curve[i].totalNetWorth).toBeGreaterThan(r.curve[i - 1].totalNetWorth);
    }
  });

  it("하이브리드: 실현 자본소득이 시간이 지나며 증가한다 (upstream 재유입)", () => {
    const r = projectEngine({ snapshot: snapshot(), buckets: invest100, horizonYears: 15 });
    const early = r.curve[2].monthlyPassiveIncome;
    const late = r.curve[14].monthlyPassiveIncome;
    expect(late).toBeGreaterThan(early);
  });

  it("locked(연금) 버킷은 잠긴 자산으로 분리되고 passive에 안 잡힌다", () => {
    const locked: Bucket[] = [
      bucket({ category: "invest", name: "연금", ratioPct: 100, expectedAnnualReturnPct: 7, realizedYieldPct: 5, isLocked: true }),
    ];
    // 자본소득 없는 스냅샷으로 격리 → locked 실현분이 passive로 새지 않음을 검증
    const noCapital = snapshot({ incomeSources: [{ type: "labor", monthly: 300 }] });
    const r = projectEngine({ snapshot: noCapital, buckets: locked, horizonYears: 10 });
    expect(r.curve[10].lockedAssets).toBeGreaterThan(0);
    expect(r.curve[10].monthlyPassiveIncome).toBe(0); // 실현분도 잠김
  });

  it("지출 버킷은 자산에 누적되지 않는다", () => {
    const withSpend: Bucket[] = [
      bucket({ category: "invest", name: "주식", ratioPct: 50, expectedAnnualReturnPct: 8, realizedYieldPct: 2 }),
      bucket({ category: "spend", name: "지출", ratioPct: 50 }),
    ];
    const onlyInvest: Bucket[] = [
      bucket({ category: "invest", name: "주식", ratioPct: 50, expectedAnnualReturnPct: 8, realizedYieldPct: 2 }),
    ];
    const a = projectEngine({ snapshot: snapshot(), buckets: withSpend, horizonYears: 10 });
    const b = projectEngine({ snapshot: snapshot(), buckets: onlyInvest, horizonYears: 10 });
    // 같은 투자 배분이면 지출 버킷 유무는 자산 결과에 영향 없음
    expect(a.curve[10].totalNetWorth).toBeCloseTo(b.curve[10].totalNetWorth, 5);
  });

  it("목표 순자산 도달 연차(ETA)와 달성률을 계산한다", () => {
    const r = projectEngine({
      snapshot: snapshot(),
      buckets: invest100,
      horizonYears: 40,
      goalNetworth: 50000, // 5억
    });
    expect(r.achievementPct).toBeCloseTo(6, 0); // 3000/50000
    expect(r.targetReachYear).not.toBeNull();
    expect(r.targetReachYear! > 0).toBe(true);
  });
});

describe("adjustReturns (민감도)", () => {
  const buckets: Bucket[] = [
    bucket({ category: "invest", name: "주식", ratioPct: 60, expectedAnnualReturnPct: 8, realizedYieldPct: 2 }),
    bucket({ category: "save", name: "비상금", ratioPct: 20, expectedAnnualReturnPct: 3 }),
    bucket({ category: "spend", name: "지출", ratioPct: 20 }),
  ];

  it("delta 0이면 변화 없음", () => {
    expect(adjustReturns(buckets, 0)).toBe(buckets);
  });

  it("보수(-3)는 기대수익률을 낮추고 0% 하한, 지출 버킷은 불변", () => {
    const c = adjustReturns(buckets, SENSITIVITY.conservative.deltaPp);
    expect(c[0].expectedAnnualReturnPct).toBe(5); // 8-3
    expect(c[1].expectedAnnualReturnPct).toBe(0); // 3-3
    expect(c[2].expectedAnnualReturnPct).toBe(0); // spend 불변
    expect(c[0].realizedYieldPct).toBeLessThanOrEqual(c[0].expectedAnnualReturnPct);
  });

  it("밴드 순서: 보수 ≤ 기본 ≤ 공격 (최종 순자산)", () => {
    const s = snapshot();
    const low = projectEngine({ snapshot: s, buckets: adjustReturns(buckets, -3), horizonYears: 20 });
    const base = projectEngine({ snapshot: s, buckets, horizonYears: 20 });
    const high = projectEngine({ snapshot: s, buckets: adjustReturns(buckets, 3), horizonYears: 20 });
    expect(low.finalNetWorth).toBeLessThanOrEqual(base.finalNetWorth);
    expect(base.finalNetWorth).toBeLessThanOrEqual(high.finalNetWorth);
  });
});

describe("helpers", () => {
  it("ratioSum", () => {
    expect(ratioSum([bucket({ ratioPct: 54 }), bucket({ ratioPct: 46 })])).toBe(100);
  });
  it("needsRealityNudge: 도달 못하면 true", () => {
    expect(needsRealityNudge(null, 15)).toBe(true);
    expect(needsRealityNudge(12, 15)).toBe(false);
    expect(needsRealityNudge(30, 15)).toBe(true);
  });
});
