import type { Bucket, BucketCategory } from "./types";
import type { IconName } from "@/components/Icon";

/**
 * 팔레트 프리셋 (BucketCatalog).
 * expectedAnnualReturnPct / realizedYieldPct 는 모두 '가정·예시' 기본값.
 * 사용자가 인스펙터에서 자유롭게 수정한다. (열린 결정 → 기본값 제시 + 수정)
 */
export interface BucketPreset {
  key: string;
  category: BucketCategory;
  name: string;
  icon: IconName;
  defaultReturnPct: number;
  /** 전체 수익률 중 실현(배당·임대·이자) 몫 — upstream 재유입 */
  defaultRealizedPct: number;
  isLocked?: boolean;
  lockUntilAge?: number;
  desc: string;
  linkedTool?: string;
}

export const BUCKET_PRESETS: BucketPreset[] = [
  // ── 투자 (복리)
  {
    key: "stock",
    category: "invest",
    name: "주식",
    icon: "trending-up",
    defaultReturnPct: 8,
    defaultRealizedPct: 2, // 배당
    desc: "유동적 · 장기 복리",
    linkedTool: "Signal Desk (v2)",
  },
  {
    key: "realestate",
    category: "invest",
    name: "부동산",
    icon: "building",
    defaultReturnPct: 6,
    defaultRealizedPct: 3, // 임대
    desc: "큰 단위 · 레버리지",
    linkedTool: "Signal APT (v2)",
  },
  {
    key: "pension",
    category: "invest",
    name: "연금·IRP",
    icon: "lock",
    defaultReturnPct: 7,
    defaultRealizedPct: 0, // 계좌 내부 복리(잠김)
    isLocked: true,
    lockUntilAge: 55,
    desc: "내부 복리 · 만 55세까지 인출 제한 · 절세",
  },
  // ── 저축 (유동·목적)
  {
    key: "emergency",
    category: "save",
    name: "비상금 (CMA)",
    icon: "shield",
    defaultReturnPct: 3,
    defaultRealizedPct: 0,
    desc: "유동성 안전망",
  },
  {
    key: "housing",
    category: "save",
    name: "청약통장",
    icon: "home",
    defaultReturnPct: 2,
    defaultRealizedPct: 0,
    desc: "내집마련 준비",
  },
  // ── 지출 (소비, out)
  {
    key: "fixed",
    category: "spend",
    name: "고정지출",
    icon: "receipt",
    defaultReturnPct: 0,
    defaultRealizedPct: 0,
    desc: "월세·통신·구독 등",
  },
  {
    key: "variable",
    category: "spend",
    name: "변동지출",
    icon: "cart",
    defaultReturnPct: 0,
    defaultRealizedPct: 0,
    desc: "식비·여가 등",
  },
];

export function presetByKey(key: string): BucketPreset | undefined {
  return BUCKET_PRESETS.find((p) => p.key === key);
}

let counter = 0;
function localId(): string {
  // 결정론적이지 않아도 되지만 Date.now 사용은 피함 (SSR 안전)
  counter += 1;
  return `b_${counter}_${Math.random().toString(36).slice(2, 8)}`;
}

export function bucketFromPreset(preset: BucketPreset, position: number): Bucket {
  return {
    id: localId(),
    category: preset.category,
    name: preset.name,
    ratioPct: 0,
    expectedAnnualReturnPct: preset.defaultReturnPct,
    realizedYieldPct: preset.defaultRealizedPct,
    isLocked: preset.isLocked ?? false,
    lockUntilAge: preset.lockUntilAge,
    linkedTool: preset.linkedTool,
    position,
  };
}

export function customBucket(category: BucketCategory, name: string, position: number): Bucket {
  const returnDefault = category === "invest" ? 6 : category === "save" ? 2 : 0;
  return {
    id: localId(),
    category,
    name: name || "커스텀 버킷",
    ratioPct: 0,
    expectedAnnualReturnPct: returnDefault,
    realizedYieldPct: 0,
    isLocked: false,
    position,
  };
}
