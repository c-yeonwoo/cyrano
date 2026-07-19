import { describe, it, expect } from "vitest";
import type { Bucket } from "../types";
import {
  flattenLeavesForProjection,
  monthlyManwon,
  ratioOfTotal,
  rootRatioSum,
  collectDescendantIds,
} from "./tree";

function b(over: Partial<Bucket> & { id: string }): Bucket {
  return {
    category: "invest",
    name: over.id,
    ratioPct: 0,
    expectedAnnualReturnPct: 0,
    realizedYieldPct: 0,
    isLocked: false,
    position: 0,
    parentId: null,
    ...over,
  };
}

describe("engine tree", () => {
  const tree: Bucket[] = [
    b({ id: "spend", category: "spend", ratioPct: 40, position: 0 }),
    b({ id: "fixed", category: "spend", parentId: "spend", ratioPct: 60, position: 0 }),
    b({ id: "var", category: "spend", parentId: "spend", ratioPct: 40, position: 1 }),
    b({ id: "invest", category: "invest", ratioPct: 60, position: 1 }),
    b({ id: "stock", category: "invest", parentId: "invest", ratioPct: 100, position: 0 }),
  ];

  it("ratioOfTotal = 경로 곱", () => {
    expect(ratioOfTotal(tree.find((x) => x.id === "fixed")!, tree)).toBe(24); // 40*60
    expect(ratioOfTotal(tree.find((x) => x.id === "stock")!, tree)).toBe(60);
  });

  it("monthlyManwon 소수 버림", () => {
    // 수입 333만 · 전체 24% → 79.92 → 79
    expect(monthlyManwon(tree.find((x) => x.id === "fixed")!, tree, 333)).toBe(79);
  });

  it("rootRatioSum은 루트만", () => {
    expect(rootRatioSum(tree)).toBe(100);
  });

  it("flattenLeavesForProjection은 리프만·수입 대비 %", () => {
    const leaves = flattenLeavesForProjection(tree);
    expect(leaves.map((x) => x.id).sort()).toEqual(["fixed", "stock", "var"]);
    expect(leaves.find((x) => x.id === "fixed")!.ratioPct).toBe(24);
    expect(leaves.find((x) => x.id === "var")!.ratioPct).toBe(16);
  });

  it("collectDescendantIds는 자손 포함", () => {
    expect(collectDescendantIds("spend", tree).sort()).toEqual(["fixed", "spend", "var"]);
  });
});
