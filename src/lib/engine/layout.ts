import type { Bucket, EngineConfig, IncomeSource } from "../types";
import { normalizeIncomeSources, sumMonthlyIncome } from "../income";
import { childrenOf, roots } from "./tree";

export const NODE_W = 168;
export const NODE_H = 70;
export const COL_GAP = 44;
export const ROW_GAP = 12;
export const PAD_X = 16;
export const PAD_Y = 36;
export const SOURCE_W = 118;
export const SOURCE_H = 52;
export const INCOME_W = 140;
export const INCOME_H = 88;
export const POOL_W = 120;
export const POOL_H = 108;
/** 성장(투자·저축) 밴드와 지출 밴드 사이 간격 */
export const SPEND_BAND_GAP = 36;

/** depth 1=루트 묶음, 2+=하위(작아짐). depth -1 = 수입 항목 */
export function sizeForDepth(depth: number): { w: number; h: number } {
  if (depth === -1) return { w: SOURCE_W, h: SOURCE_H };
  if (depth <= 0) return { w: INCOME_W, h: INCOME_H };
  if (depth === 1) return { w: NODE_W, h: NODE_H };
  if (depth === 2) return { w: 138, h: 54 };
  return { w: 120, h: 48 };
}

export type GraphNodeKind = "source" | "income" | "bucket" | "pool";

export interface GraphNode {
  id: string;
  kind: GraphNodeKind;
  bucket?: Bucket;
  incomeSource?: IncomeSource;
  depth: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GraphEdge {
  id: string;
  fromId: string;
  toId: string;
  tone: "brand" | "spend" | "dashed" | "income";
  ratio: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface LayoutAnchors {
  incomeCanvasX?: number | null;
  incomeCanvasY?: number | null;
  poolCanvasX?: number | null;
  poolCanvasY?: number | null;
}

export interface LayoutInput {
  buckets: Bucket[];
  incomeSources: IncomeSource[];
  anchors?: LayoutAnchors;
  /** 드래그 중인 임시 위치 */
  drag?: { id: string; x: number; y: number } | null;
  /** false면 수입원 노드·엣지 생략 (기본 true) */
  showIncomeSources?: boolean;
}

interface TreeSlot {
  bucket: Bucket;
  children: TreeSlot[];
  weight: number;
  y: number;
  depth: number;
}

function buildSlot(bucket: Bucket, all: Bucket[], depth: number): TreeSlot {
  const kids = childrenOf(bucket.id, all).map((c) => buildSlot(c, all, depth + 1));
  const weight = kids.length === 0 ? 1 : kids.reduce((s, k) => s + k.weight, 0);
  return { bucket, children: kids, weight, y: 0, depth };
}

function placeY(slot: TreeSlot, top: number): number {
  const { h } = sizeForDepth(slot.depth);
  const rowH = h + ROW_GAP;
  if (slot.children.length === 0) {
    slot.y = top + rowH / 2;
    return top + rowH;
  }
  let cursor = top;
  for (const c of slot.children) {
    cursor = placeY(c, cursor);
  }
  const first = slot.children[0]!.y;
  const last = slot.children[slot.children.length - 1]!.y;
  slot.y = (first + last) / 2;
  return cursor;
}

/** 수입 항목 열 → 월수입 → 배분… */
function colX(depth: number): number {
  const sourceCol = PAD_X;
  const incomeCol = sourceCol + SOURCE_W + COL_GAP;
  if (depth === -1) return sourceCol;
  if (depth <= 0) return incomeCol;
  let x = incomeCol + INCOME_W + COL_GAP;
  for (let d = 1; d < depth; d++) {
    x += sizeForDepth(d).w + COL_GAP;
  }
  return x;
}

function safeEdgeId(fromId: string, toId: string): string {
  return `e_${fromId}_to_${toId}`.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function applyDrag(
  id: string,
  x: number,
  y: number,
  drag?: LayoutInput["drag"],
): { x: number; y: number } {
  if (drag && drag.id === id) return { x: drag.x, y: drag.y };
  return { x, y };
}

function collectNodes(slot: TreeSlot, out: GraphNode[], drag?: LayoutInput["drag"]) {
  const { w, h } = sizeForDepth(slot.depth);
  const autoX = colX(slot.depth);
  const autoY = slot.y - h / 2;
  const baseX = slot.bucket.canvasX ?? autoX;
  const baseY = slot.bucket.canvasY ?? autoY;
  const { x, y } = applyDrag(slot.bucket.id, baseX, baseY, drag);
  out.push({
    id: slot.bucket.id,
    kind: "bucket",
    bucket: slot.bucket,
    depth: slot.depth,
    x,
    y,
    w,
    h,
  });
  for (const c of slot.children) collectNodes(c, out, drag);
}

function linkEdge(
  from: GraphNode,
  to: GraphNode,
  siblingIndex: number,
  siblingCount: number,
  ratio: number,
  tone: GraphEdge["tone"],
): GraphEdge {
  const pTop = from.y + 8;
  const pUsable = Math.max(16, from.h - 16);
  const y1 =
    siblingCount <= 1
      ? from.y + from.h / 2
      : pTop + ((siblingIndex + 0.5) / siblingCount) * pUsable;
  return {
    id: safeEdgeId(from.id, to.id),
    fromId: from.id,
    toId: to.id,
    tone,
    ratio,
    x1: from.x + from.w,
    y1,
    x2: to.x,
    y2: to.y + to.h / 2,
  };
}

export function layoutEngineGraph(input: LayoutInput | Bucket[]): {
  nodes: GraphNode[];
  edges: GraphEdge[];
  width: number;
  height: number;
  maxDepth: number;
  monthlyIncome: number;
} {
  // 하위호환: 예전 시그니처 buckets[]
  const opts: LayoutInput = Array.isArray(input)
    ? { buckets: input, incomeSources: [] }
    : input;

  const buckets = opts.buckets;
  const sources = normalizeIncomeSources(opts.incomeSources).sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );
  const monthlyIncome = sumMonthlyIncome(sources);
  const anchors = opts.anchors ?? {};
  const drag = opts.drag;
  const showIncomeSources = opts.showIncomeSources !== false;

  const allRoots = roots(buckets);
  const growRoots = allRoots.filter((b) => b.category !== "spend");
  const spendRoots = allRoots.filter((b) => b.category === "spend");
  const growSlots = growRoots.map((r) => buildSlot(r, buckets, 1));
  const spendSlots = spendRoots.map((r) => buildSlot(r, buckets, 1));

  // 성장 밴드(위) → 지출 밴드(아래) 분리
  let cursor = PAD_Y;
  for (const s of growSlots) cursor = placeY(s, cursor);
  const growBottom = cursor;
  const spendTop = Math.max(growBottom + SPEND_BAND_GAP, PAD_Y + 200);
  cursor = spendTop;
  for (const s of spendSlots) cursor = placeY(s, cursor);
  const spendBottom = cursor;

  const contentH = Math.max(sizeForDepth(1).h * 2, spendBottom - PAD_Y, growBottom - PAD_Y);
  const incomeCy =
    growSlots.length > 0
      ? PAD_Y + (growBottom - PAD_Y) / 2
      : spendSlots.length > 0
        ? spendTop + (spendBottom - spendTop) / 2
        : PAD_Y + 120;

  const nodes: GraphNode[] = [];

  // 수입 항목 (월수입 왼쪽) — showIncomeSources=false면 합계만 쓰고 노드는 숨김
  if (showIncomeSources) {
    const sourceAutoX = colX(-1);
    let sourceCursor = PAD_Y + 8;
    sources.forEach((src) => {
      const id = src.id!;
      const autoY = sourceCursor;
      sourceCursor += SOURCE_H + ROW_GAP;
      const baseX = src.canvasX ?? sourceAutoX;
      const baseY = src.canvasY ?? autoY;
      const { x, y } = applyDrag(id, baseX, baseY, drag);
      nodes.push({
        id,
        kind: "source",
        incomeSource: src,
        depth: -1,
        x,
        y,
        w: SOURCE_W,
        h: SOURCE_H,
      });
    });
  }

  // 월수입 허브
  const incomeAutoX = colX(0);
  const incomeAutoY = incomeCy - INCOME_H / 2;
  const incomePos = applyDrag(
    "__income__",
    anchors.incomeCanvasX ?? incomeAutoX,
    anchors.incomeCanvasY ?? incomeAutoY,
    drag,
  );
  const income: GraphNode = {
    id: "__income__",
    kind: "income",
    depth: 0,
    x: incomePos.x,
    y: incomePos.y,
    w: INCOME_W,
    h: INCOME_H,
  };
  nodes.push(income);

  for (const s of growSlots) collectNodes(s, nodes, drag);
  for (const s of spendSlots) collectNodes(s, nodes, drag);

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const edges: GraphEdge[] = [];

  // 수입 항목 → 월수입
  const sourceNodes = nodes.filter((n) => n.kind === "source");
  sourceNodes.forEach((sn, i) => {
    const amt = sn.incomeSource?.monthly ?? 0;
    const ratio = monthlyIncome > 0 ? (amt / monthlyIncome) * 100 : 0;
    edges.push(linkEdge(sn, income, i, sourceNodes.length, ratio, "income"));
  });

  // 월수입 → 루트 배분 (성장 먼저, 지출은 아래 밴드)
  const rootSlots = [...growSlots, ...spendSlots];
  rootSlots.forEach((s, i) => {
    const node = byId.get(s.bucket.id)!;
    edges.push(
      linkEdge(
        income,
        node,
        i,
        rootSlots.length,
        s.bucket.ratioPct,
        s.bucket.category === "spend" ? "spend" : "brand",
      ),
    );
  });

  function walkChildren(slot: TreeSlot) {
    const parent = byId.get(slot.bucket.id)!;
    slot.children.forEach((c, i) => {
      const child = byId.get(c.bucket.id)!;
      edges.push(
        linkEdge(
          parent,
          child,
          i,
          slot.children.length,
          c.bucket.ratioPct,
          c.bucket.category === "spend" ? "spend" : "brand",
        ),
      );
      walkChildren(c);
    });
  }
  for (const s of rootSlots) walkChildren(s);

  let maxDepth = 1;
  for (const n of nodes) {
    if (n.kind === "bucket") maxDepth = Math.max(maxDepth, n.depth);
  }

  // 자산 = 투자·저축 리프 합류
  const feed = nodes.filter(
    (n) =>
      n.kind === "bucket" &&
      n.bucket &&
      n.bucket.category !== "spend" &&
      childrenOf(n.bucket.id, buckets).length === 0,
  );

  const poolAutoX = colX(maxDepth) + sizeForDepth(maxDepth).w + COL_GAP;
  const poolAutoY = incomeCy - POOL_H / 2;
  if (feed.length > 0) {
    const poolPos = applyDrag(
      "__pool__",
      anchors.poolCanvasX ?? poolAutoX,
      anchors.poolCanvasY ?? poolAutoY,
      drag,
    );
    const pool: GraphNode = {
      id: "__pool__",
      kind: "pool",
      depth: maxDepth + 1,
      x: poolPos.x,
      y: poolPos.y,
      w: POOL_W,
      h: POOL_H,
    };
    nodes.push(pool);

    feed.forEach((f, i) => {
      const pTop = pool.y + 14;
      const pUsable = Math.max(20, pool.h - 28);
      const y2 =
        feed.length <= 1 ? pool.y + pool.h / 2 : pTop + ((i + 0.5) / feed.length) * pUsable;
      edges.push({
        id: safeEdgeId(f.id, pool.id),
        fromId: f.id,
        toId: pool.id,
        tone: "brand",
        ratio: f.bucket?.ratioPct ?? 0,
        x1: f.x + f.w,
        y1: f.y + f.h / 2,
        x2: pool.x,
        y2,
      });
    });
  }

  let maxRight = colX(0) + INCOME_W;
  let maxBottom = PAD_Y + contentH + PAD_Y;
  for (const n of nodes) {
    maxRight = Math.max(maxRight, n.x + n.w + PAD_X);
    maxBottom = Math.max(maxBottom, n.y + n.h + PAD_Y);
  }
  const width = Math.max(maxRight, poolAutoX + POOL_W + PAD_X);
  const height = Math.max(maxBottom, 480);

  return { nodes, edges, width, height, maxDepth, monthlyIncome };
}

/** 기본 곡선 핸들 위치 (제어점 없을 때) */
export function defaultEdgeControl(
  e: Pick<GraphEdge, "x1" | "y1" | "x2" | "y2">,
  reinvest = false,
): { x: number; y: number } {
  if (reinvest) {
    return { x: (e.x1 + e.x2) / 2, y: Math.min(e.y1, e.y2) - 28 };
  }
  return { x: (e.x1 + e.x2) / 2, y: (e.y1 + e.y2) / 2 };
}

export function edgePath(
  e: GraphEdge,
  reinvest = false,
  control?: { x: number; y: number } | null,
): string {
  if (control) {
    return `M${e.x1},${e.y1} Q${control.x},${control.y} ${e.x2},${e.y2}`;
  }
  if (reinvest) {
    const midY = Math.min(e.y1, e.y2) - 28;
    return `M${e.x1},${e.y1} C${e.x1},${midY} ${e.x2},${midY} ${e.x2},${e.y2}`;
  }
  const mx = (e.x1 + e.x2) / 2;
  return `M${e.x1},${e.y1} C${mx},${e.y1} ${mx},${e.y2} ${e.x2},${e.y2}`;
}

export function anchorsFromEngine(engine: EngineConfig): LayoutAnchors {
  return {
    incomeCanvasX: engine.incomeCanvasX,
    incomeCanvasY: engine.incomeCanvasY,
    poolCanvasX: engine.poolCanvasX,
    poolCanvasY: engine.poolCanvasY,
  };
}
