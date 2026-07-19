import type { Bucket, BucketCategory } from "./types";
import type { IconName } from "@/components/Icon";

/**
 * 항목 추가 프리셋.
 * - kind: group = 월수입 바로 아래 묶음(투자·저축 = 자산 / 지출)
 * - kind: item = 선택 중인 묶음 아래
 */
export interface BucketPreset {
  key: string;
  category: BucketCategory;
  name: string;
  icon: IconName;
  kind: "group" | "item";
  defaultReturnPct: number;
  defaultRealizedPct: number;
  isLocked?: boolean;
  lockUntilAge?: number;
  desc: string;
  linkedTool?: string;
}

export const GROUP_PRESETS: BucketPreset[] = [
  {
    key: "g_invest",
    category: "invest",
    name: "투자",
    icon: "trending-up",
    kind: "group",
    defaultReturnPct: 0,
    defaultRealizedPct: 0,
    desc: "주식·펀드·연금 등",
  },
  {
    key: "g_save",
    category: "save",
    name: "저축",
    icon: "shield",
    kind: "group",
    defaultReturnPct: 0,
    defaultRealizedPct: 0,
    desc: "예적금·비상금",
  },
  {
    key: "g_spend",
    category: "spend",
    name: "지출",
    icon: "wallet",
    kind: "group",
    defaultReturnPct: 0,
    defaultRealizedPct: 0,
    desc: "나가는 돈 · 복리 없음",
  },
];

export const ITEM_PRESETS: BucketPreset[] = [
  {
    key: "stock",
    category: "invest",
    name: "주식",
    icon: "trending-up",
    kind: "item",
    defaultReturnPct: 8,
    defaultRealizedPct: 2,
    desc: "장기 성장",
    linkedTool: "Signal Desk (v2)",
  },
  {
    key: "realestate",
    category: "invest",
    name: "부동산",
    icon: "building",
    kind: "item",
    defaultReturnPct: 6,
    defaultRealizedPct: 3,
    desc: "임대·시세",
    linkedTool: "Signal APT (v2)",
  },
  {
    key: "pension",
    category: "invest",
    name: "연금·IRP",
    icon: "lock",
    kind: "item",
    defaultReturnPct: 7,
    defaultRealizedPct: 0,
    isLocked: true,
    lockUntilAge: 55,
    desc: "잠긴 계좌",
  },
  {
    key: "emergency",
    category: "save",
    name: "비상금",
    icon: "shield",
    kind: "item",
    defaultReturnPct: 3,
    defaultRealizedPct: 0,
    desc: "바로 쓸 돈",
  },
  {
    key: "housing",
    category: "save",
    name: "청약통장",
    icon: "home",
    kind: "item",
    defaultReturnPct: 2,
    defaultRealizedPct: 0,
    desc: "내 집 준비",
  },
  {
    key: "fixed",
    category: "spend",
    name: "고정지출",
    icon: "receipt",
    kind: "item",
    defaultReturnPct: 0,
    defaultRealizedPct: 0,
    desc: "월세·통신·구독",
  },
  {
    key: "variable",
    category: "spend",
    name: "변동지출",
    icon: "cart",
    kind: "item",
    defaultReturnPct: 0,
    defaultRealizedPct: 0,
    desc: "식비·여가",
  },
];

export const BUCKET_PRESETS: BucketPreset[] = [...GROUP_PRESETS, ...ITEM_PRESETS];

export function presetByKey(key: string): BucketPreset | undefined {
  return BUCKET_PRESETS.find((p) => p.key === key);
}

let counter = 0;
function localId(): string {
  counter += 1;
  return `b_${counter}_${Math.random().toString(36).slice(2, 8)}`;
}

export function bucketFromPreset(
  preset: BucketPreset,
  position: number,
  parentId: string | null = null,
): Bucket {
  return {
    id: localId(),
    category: preset.category,
    name: preset.name,
    ratioPct: 0,
    parentId,
    expectedAnnualReturnPct: preset.defaultReturnPct,
    realizedYieldPct: preset.defaultRealizedPct,
    isLocked: preset.isLocked ?? false,
    lockUntilAge: preset.lockUntilAge,
    linkedTool: preset.linkedTool,
    position,
  };
}

export function customBucket(
  category: BucketCategory,
  name: string,
  position: number,
  parentId: string | null = null,
): Bucket {
  const returnDefault = category === "invest" ? 6 : category === "save" ? 2 : 0;
  return {
    id: localId(),
    category,
    name: name || "새 항목",
    ratioPct: 0,
    parentId,
    expectedAnnualReturnPct: returnDefault,
    realizedYieldPct: 0,
    isLocked: false,
    position,
  };
}
