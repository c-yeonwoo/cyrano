import type { Bucket } from "../types";

/** 자식이 없으면 리프(실제 돈이 들어가는 끝 항목) */
export function isLeaf(bucket: Bucket, all: Bucket[]): boolean {
  return !all.some((b) => b.parentId === bucket.id);
}

export function childrenOf(parentId: string | null | undefined, all: Bucket[]): Bucket[] {
  return all
    .filter((b) => (b.parentId ?? null) === (parentId ?? null))
    .sort((a, b) => a.position - b.position);
}

export function roots(all: Bucket[]): Bucket[] {
  return childrenOf(null, all);
}

/** 상위 체인 곱으로 수입 대비 전체 % */
export function ratioOfTotal(bucket: Bucket, all: Bucket[]): number {
  let pct = 1;
  let cur: Bucket | undefined = bucket;
  const guard = new Set<string>();
  while (cur) {
    if (guard.has(cur.id)) break;
    guard.add(cur.id);
    pct *= (cur.ratioPct || 0) / 100;
    const parentId: string | null = cur.parentId ?? null;
    if (!parentId) {
      cur = undefined;
    } else {
      cur = all.find((b) => b.id === parentId);
    }
  }
  // 부동소수 오차 정리 (예: 0.4*0.4 → 0.16000000000000003)
  return Math.round(pct * 100 * 1e6) / 1e6;
}

/** 월 환산(만원) — 소수 버림 */
export function monthlyManwon(bucket: Bucket, all: Bucket[], monthlyIncomeManwon: number): number {
  return Math.floor((monthlyIncomeManwon * ratioOfTotal(bucket, all)) / 100);
}

export function rootRatioSum(all: Bucket[]): number {
  return roots(all).reduce((s, b) => s + (b.ratioPct || 0), 0);
}

export function siblingRatioSum(parentId: string | null | undefined, all: Bucket[]): number {
  return childrenOf(parentId, all).reduce((s, b) => s + (b.ratioPct || 0), 0);
}

/** 삭제 시 자손 포함 id 목록 */
export function collectDescendantIds(id: string, all: Bucket[]): string[] {
  const out = [id];
  const kids = all.filter((b) => b.parentId === id);
  for (const k of kids) out.push(...collectDescendantIds(k.id, all));
  return out;
}

/**
 * 프로젝션용: 리프만 남기고 ratioPct를 수입 대비 전체 %로 치환.
 * 그룹(자식 있는 노드)은 제외.
 */
export function flattenLeavesForProjection(buckets: Bucket[]): Bucket[] {
  return buckets
    .filter((b) => isLeaf(b, buckets))
    .map((b) => ({
      ...b,
      ratioPct: ratioOfTotal(b, buckets),
      parentId: null,
    }));
}

export function parentOf(bucket: Bucket, all: Bucket[]): Bucket | null {
  if (!bucket.parentId) return null;
  return all.find((b) => b.id === bucket.parentId) ?? null;
}
