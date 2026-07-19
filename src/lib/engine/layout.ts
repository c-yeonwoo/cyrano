import type { Bucket } from "../types";
import { childrenOf, roots } from "./tree";

export const NODE_W = 168;
export const NODE_H = 70;
export const COL_GAP = 48;
export const ROW_GAP = 12;
export const PAD_X = 20;
export const PAD_Y = 36;
export const INCOME_W = 148;
export const INCOME_H = 96;
export const POOL_W = 128;
export const POOL_H = 140;

/** depth 1=루트 묶음, 2+=하위(작아짐) */
export function sizeForDepth(depth: number): { w: number; h: number } {
  if (depth <= 0) return { w: INCOME_W, h: INCOME_H };
  if (depth === 1) return { w: NODE_W, h: NODE_H };
  if (depth === 2) return { w: 138, h: 54 };
  return { w: 120, h: 48 };
}

export type GraphNodeKind = "income" | "bucket" | "pool";

export interface GraphNode {
  id: string;
  kind: GraphNodeKind;
  bucket?: Bucket;
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
  tone: "brand" | "spend" | "dashed";
  ratio: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
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

function colX(depth: number): number {
  if (depth <= 0) return PAD_X;
  let x = PAD_X + INCOME_W + COL_GAP;
  for (let d = 1; d < depth; d++) {
    x += sizeForDepth(d).w + COL_GAP;
  }
  return x;
}

function safeEdgeId(fromId: string, toId: string): string {
  return `e_${fromId}_to_${toId}`.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function collectNodes(slot: TreeSlot, out: GraphNode[]) {
  const { w, h } = sizeForDepth(slot.depth);
  const autoX = colX(slot.depth);
  const autoY = slot.y - h / 2;
  const x = slot.bucket.canvasX ?? autoX;
  const y = slot.bucket.canvasY ?? autoY;
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
  for (const c of slot.children) collectNodes(c, out);
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

export function layoutEngineGraph(buckets: Bucket[]): {
  nodes: GraphNode[];
  edges: GraphEdge[];
  width: number;
  height: number;
  maxDepth: number;
} {
  const topSlots = roots(buckets).map((r) => buildSlot(r, buckets, 1));

  let cursor = PAD_Y;
  for (const s of topSlots) {
    cursor = placeY(s, cursor);
  }
  const contentH = Math.max(sizeForDepth(1).h * 2 + ROW_GAP, cursor - PAD_Y);
  const incomeCy = PAD_Y + contentH / 2;

  const nodes: GraphNode[] = [];
  const income: GraphNode = {
    id: "__income__",
    kind: "income",
    depth: 0,
    x: PAD_X,
    y: incomeCy - INCOME_H / 2,
    w: INCOME_W,
    h: INCOME_H,
  };
  nodes.push(income);

  for (const s of topSlots) collectNodes(s, nodes);

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const edges: GraphEdge[] = [];

  topSlots.forEach((s, i) => {
    const node = byId.get(s.bucket.id)!;
    edges.push(
      linkEdge(
        income,
        node,
        i,
        topSlots.length,
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
  for (const s of topSlots) walkChildren(s);

  let maxDepth = 1;
  for (const n of nodes) {
    if (n.kind === "bucket") maxDepth = Math.max(maxDepth, n.depth);
  }

  const feed = nodes.filter(
    (n) =>
      n.kind === "bucket" &&
      n.bucket &&
      n.bucket.category !== "spend" &&
      childrenOf(n.bucket.id, buckets).length === 0,
  );

  const poolX = colX(maxDepth) + sizeForDepth(maxDepth).w + COL_GAP;
  if (feed.length > 0) {
    const pool: GraphNode = {
      id: "__pool__",
      kind: "pool",
      depth: maxDepth + 1,
      x: poolX,
      y: incomeCy - POOL_H / 2,
      w: POOL_W,
      h: POOL_H,
    };
    nodes.push(pool);

    feed.forEach((f, i) => {
      const pTop = pool.y + 16;
      const pUsable = Math.max(20, pool.h - 32);
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

    edges.push({
      id: safeEdgeId(pool.id, income.id),
      fromId: pool.id,
      toId: income.id,
      tone: "dashed",
      ratio: 0,
      x1: pool.x + pool.w / 2,
      y1: pool.y,
      x2: income.x + income.w / 2,
      y2: income.y,
    });
  }

  let maxRight = PAD_X + INCOME_W;
  let maxBottom = PAD_Y + contentH + PAD_Y;
  for (const n of nodes) {
    maxRight = Math.max(maxRight, n.x + n.w + PAD_X);
    maxBottom = Math.max(maxBottom, n.y + n.h + PAD_Y);
  }
  const width = Math.max(maxRight, (feed.length > 0 ? poolX + POOL_W : colX(maxDepth) + NODE_W) + PAD_X);
  const height = Math.max(maxBottom, 440);

  return { nodes, edges, width, height, maxDepth };
}

export function edgePath(e: GraphEdge, reinvest = false): string {
  if (reinvest) {
    const midY = Math.min(e.y1, e.y2) - 28;
    return `M${e.x1},${e.y1} C${e.x1},${midY} ${e.x2},${midY} ${e.x2},${e.y2}`;
  }
  const mx = (e.x1 + e.x2) / 2;
  return `M${e.x1},${e.y1} C${mx},${e.y1} ${mx},${e.y2} ${e.x2},${e.y2}`;
}
