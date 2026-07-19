import { describe, it, expect } from "vitest";
import type { Bucket, IncomeSource } from "../types";
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

const sources: IncomeSource[] = [
  { id: "inc_labor", type: "labor", monthly: 300, position: 0 },
  { id: "inc_cap", type: "capital", monthly: 20, position: 1 },
];

describe("layoutEngineGraph", () => {
  it("하위 노드가 루트보다 작다", () => {
    expect(sizeForDepth(2).w).toBeLessThan(sizeForDepth(1).w);
    const { nodes } = layoutEngineGraph({
      buckets: [
        b({ id: "spend", category: "spend", ratioPct: 40 }),
        b({ id: "fixed", category: "spend", parentId: "spend", ratioPct: 100 }),
      ],
      incomeSources: sources,
    });
    const spend = nodes.find((n) => n.id === "spend")!;
    const fixed = nodes.find((n) => n.id === "fixed")!;
    expect(fixed.w).toBeLessThan(spend.w);
  });

  it("수입 항목이 월수입 왼쪽에 있고 연결된다", () => {
    const { nodes, edges, monthlyIncome } = layoutEngineGraph({
      buckets: [b({ id: "invest", ratioPct: 100 })],
      incomeSources: sources,
    });
    expect(monthlyIncome).toBe(320);
    const labor = nodes.find((n) => n.id === "inc_labor")!;
    const income = nodes.find((n) => n.id === "__income__")!;
    expect(labor.x).toBeLessThan(income.x);
    expect(edges.some((e) => e.fromId === "inc_labor" && e.toId === "__income__")).toBe(true);
  });

  it("showIncomeSources=false면 수입원 노드만 숨기고 합계는 유지", () => {
    const { nodes, edges, monthlyIncome } = layoutEngineGraph({
      buckets: [b({ id: "invest", ratioPct: 100 })],
      incomeSources: sources,
      showIncomeSources: false,
    });
    expect(monthlyIncome).toBe(320);
    expect(nodes.some((n) => n.kind === "source")).toBe(false);
    expect(nodes.some((n) => n.id === "__income__")).toBe(true);
    expect(edges.some((e) => e.toId === "__income__")).toBe(false);
  });

  it("지출 루트는 투자 루트보다 아래에 배치", () => {
    const { nodes } = layoutEngineGraph({
      buckets: [
        b({ id: "invest", category: "invest", ratioPct: 60, position: 0 }),
        b({ id: "spend", category: "spend", ratioPct: 40, position: 1 }),
      ],
      incomeSources: sources,
    });
    const invest = nodes.find((n) => n.id === "invest")!;
    const spend = nodes.find((n) => n.id === "spend")!;
    expect(spend.y).toBeGreaterThan(invest.y);
  });

  it("edgePath", () => {
    const { edges } = layoutEngineGraph({
      buckets: [b({ id: "a", ratioPct: 100 })],
      incomeSources: sources,
    });
    const link = edges.find((e) => e.toId === "a");
    expect(edgePath(link!)).toMatch(/^M/);
    expect(edgePath(link!, false, { x: 10, y: 20 })).toContain("Q10,20");
  });
});
