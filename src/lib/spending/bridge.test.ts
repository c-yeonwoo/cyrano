import { describe, expect, it } from "vitest";
import { monthTotalSpendingManwon, spendRatioSuggestion, wonToManwon } from "./bridge";
import type { SpendingState } from "./types";

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
  });

  it("suggests ratios vs income", () => {
    const s = spendRatioSuggestion(spending, 2026, 6, 300);
    expect(s).not.toBeNull();
    expect(s!.monthlySpendingManwon).toBe(95);
    expect(s!.totalRatio).toBeCloseTo(95 / 300, 5);
    expect(s!.fixedRatioOfSpend).toBeCloseTo(700 / 950, 5);
  });
});
