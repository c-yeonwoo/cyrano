import { describe, it, expect } from "vitest";
import type { Bucket } from "../types";
import { layoutEngineGraph, edgePath, sizeForDepth } from "./layout";

function b(over: Partial<Bucket> & { id: string }): Bucket {
  return {
    category: "invest",
    name: over.id,
    ratioPct: 50,
    expectedAnnualReturnPct: 0,
    realizedYieldPct: 0,
    isLocked: false,
    position: 0,
    parentId: null,
    ...over,
  };
}

describe("layoutEngineGraph", () => {
  it("하위 노드가 루트보다 작다", () => {
    expect(sizeForDepth(2).w).toBeLessThan(sizeForDepth(1).w);
    expect(sizeForDepth(2).h).toBeLessThan(sizeForDepth(1).h);
    const buckets = [
      b({ id: "spend", category: "spend", ratioPct: 40 }),
      b({ id: "fixed", category: "spend", parentId: "spend", ratioPct: 100 }),
    ];
    const { nodes } = layoutEngineGraph(buckets);
    const spend = nodes.find((n) => n.id === "spend")!;
    const fixed = nodes.find((n) => n.id === "fixed")!;
    expect(fixed.w).toBeLessThan(spend.w);
    expect(fixed.h).toBeLessThan(spend.h);
  });

  it("canvasX/Y 오버라이드 적용", () => {
    const buckets = [b({ id: "a", ratioPct: 100, canvasX: 400, canvasY: 200 })];
    const { nodes } = layoutEngineGraph(buckets);
    const a = nodes.find((n) => n.id === "a")!;
    expect(a.x).toBe(400);
    expect(a.y).toBe(200);
  });

  it("지출 루트도 수입과 연결", () => {
    const buckets = [
      b({ id: "invest", category: "invest", ratioPct: 60, position: 0 }),
      b({ id: "spend", category: "spend", ratioPct: 40, position: 1 }),
    ];
    const { edges } = layoutEngineGraph(buckets);
    const link = edges.find((e) => e.fromId === "__income__" && e.toId === "spend");
    expect(link).toBeTruthy();
    expect(edgePath(link!)).toMatch(/^M/);
  });
});
