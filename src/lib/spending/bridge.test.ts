import { describe, expect, it } from "vitest";
import {
  applySpendRatioToBuckets,
  engineVariableBudgetSuggestion,
  findSpendRoot,
  isEngineBudgetDifferent,
  isSpendSuggestionDifferent,
  manwonToWon,
  monthSpendingBreakdown,
  monthTotalSpendingManwon,
  spendRatioSuggestion,
  toSpendRatioPctSuggestion,
  wonToManwon,
} from "./bridge";
import type { SpendingState } from "./types";
import type { Bucket } from "../types";
import { childrenOf } from "../engine/tree";

const spending: SpendingState = {
  monthlyVariableBudgetWon: 1_500_000,
  favorites: [],
  fixed: [
    {
      id: "f1",
      name: "월세",
      category: "housing",
      amountWon: 700_000,
      billingDay: 1,
    },
  ],
  logs: [
    {
      id: "1",
      amountWon: 250_000,
      category: "food",
      date: "2026-07-10",
      memo: "",
      createdAt: "",
    },
  ],
};

describe("spending bridge", () => {
  it("floors won to manwon", () => {
    expect(wonToManwon(19_999)).toBe(1);
  });

  it("sums fixed + month variable into manwon", () => {
    // 700k + 250k = 950k → 95만
    expect(monthTotalSpendingManwon(spending, 2026, 6)).toBe(95);
    const b = monthSpendingBreakdown(spending, 2026, 6);
    expect(b.variableWon).toBe(250_000);
    expect(b.fixedWon).toBe(700_000);
    expect(b.manwon).toBe(95);
  });

  it("suggests ratios vs income", () => {
    const s = spendRatioSuggestion(spending, 2026, 6, 300);
    expect(s).not.toBeNull();
    expect(s!.monthlySpendingManwon).toBe(95);
    expect(s!.totalRatio).toBeCloseTo(95 / 300, 5);
    expect(s!.fixedRatioOfSpend).toBeCloseTo(700 / 950, 5);
  });

  it("applies pct suggestion to existing spend tree without moving canvas", () => {
    const raw = spendRatioSuggestion(spending, 2026, 6, 300)!;
    const sug = toSpendRatioPctSuggestion(raw);
    // 95/300 → 32%, fixed 700/950 → 74%, variable 26%
    expect(sug.spendPct).toBe(32);
    expect(sug.fixedPct).toBe(74);
    expect(sug.variablePct).toBe(26);

    const buckets: Bucket[] = [
      {
        id: "spend",
        category: "spend",
        name: "지출",
        ratioPct: 40,
        parentId: null,
        expectedAnnualReturnPct: 0,
        realizedYieldPct: 0,
        isLocked: false,
        position: 0,
        canvasX: 120,
        canvasY: 80,
      },
      {
        id: "fixed",
        category: "spend",
        name: "고정지출",
        ratioPct: 60,
        parentId: "spend",
        expectedAnnualReturnPct: 0,
        realizedYieldPct: 0,
        isLocked: false,
        position: 0,
        canvasX: 10,
        canvasY: 20,
      },
      {
        id: "var",
        category: "spend",
        name: "변동지출",
        ratioPct: 40,
        parentId: "spend",
        expectedAnnualReturnPct: 0,
        realizedYieldPct: 0,
        isLocked: false,
        position: 1,
      },
    ];

    expect(isSpendSuggestionDifferent(buckets, sug)).toBe(true);
    const { buckets: next, createdSpend, createdChildren } = applySpendRatioToBuckets(
      buckets,
      sug,
    );
    expect(createdSpend).toBe(false);
    expect(createdChildren).toBe(false);
    const root = findSpendRoot(next)!;
    expect(root.ratioPct).toBe(32);
    expect(root.canvasX).toBe(120);
    expect(root.canvasY).toBe(80);
    const kids = childrenOf(root.id, next);
    expect(kids.find((k) => k.name === "고정지출")!.ratioPct).toBe(74);
    expect(kids.find((k) => k.name === "고정지출")!.canvasX).toBe(10);
    expect(kids.find((k) => k.name === "변동지출")!.ratioPct).toBe(26);
    expect(isSpendSuggestionDifferent(next, sug)).toBe(false);
  });

  it("creates spend tree when missing", () => {
    const sug = toSpendRatioPctSuggestion(spendRatioSuggestion(spending, 2026, 6, 300)!);
    const { buckets, createdSpend, createdChildren } = applySpendRatioToBuckets([], sug);
    expect(createdSpend).toBe(true);
    expect(createdChildren).toBe(true);
    expect(findSpendRoot(buckets)?.ratioPct).toBe(sug.spendPct);
    expect(buckets).toHaveLength(3);
  });

  it("suggests variable budget from engine variable node", () => {
    expect(manwonToWon(38)).toBe(380_000);
    // income 300 · spend 40% = 120 · variable 40% of spend = 48만
    const buckets: Bucket[] = [
      {
        id: "spend",
        category: "spend",
        name: "지출",
        ratioPct: 40,
        parentId: null,
        expectedAnnualReturnPct: 0,
        realizedYieldPct: 0,
        isLocked: false,
        position: 0,
      },
      {
        id: "fixed",
        category: "spend",
        name: "고정지출",
        ratioPct: 60,
        parentId: "spend",
        expectedAnnualReturnPct: 0,
        realizedYieldPct: 0,
        isLocked: false,
        position: 0,
      },
      {
        id: "var",
        category: "spend",
        name: "변동지출",
        ratioPct: 40,
        parentId: "spend",
        expectedAnnualReturnPct: 0,
        realizedYieldPct: 0,
        isLocked: false,
        position: 1,
      },
    ];
    const s = engineVariableBudgetSuggestion(buckets, 300, 700_000);
    expect(s).not.toBeNull();
    expect(s!.source).toBe("variable_node");
    expect(s!.spendManwon).toBe(120);
    expect(s!.variableManwon).toBe(48);
    expect(s!.suggestedWon).toBe(480_000);
    expect(isEngineBudgetDifferent(800_000, s!)).toBe(true);
    expect(isEngineBudgetDifferent(480_000, s!)).toBe(false);
  });
});
