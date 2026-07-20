import type { IconName } from "@/components/Icon";

/** 지출 카테고리 — 엔진 spend(rose)와 별개로, 지출관리 내부 분류 */
export type SpendCategory =
  | "food"
  | "cafe"
  | "transport"
  | "shopping"
  | "living"
  | "housing"
  | "telecom"
  | "subscription"
  | "insurance"
  | "loan"
  | "allowance"
  | "other";

export const SPEND_CATEGORY_META: Record<
  SpendCategory,
  { label: string; icon: IconName; /** 차트용 hex — Quiet Ledger 절제 팔레트 */ color: string }
> = {
  food: { label: "식비", icon: "cart", color: "#4a90b8" },
  cafe: { label: "카페", icon: "sun", color: "#7bb8d4" },
  transport: { label: "교통", icon: "layers", color: "#4d8b82" },
  shopping: { label: "쇼핑", icon: "cart", color: "#64748b" },
  living: { label: "생활", icon: "home", color: "#475569" },
  housing: { label: "주거", icon: "building", color: "#334155" },
  telecom: { label: "통신", icon: "receipt", color: "#0d9488" },
  subscription: { label: "구독", icon: "loop", color: "#3a7a9e" },
  insurance: { label: "보험", icon: "shield", color: "#2f5852" },
  loan: { label: "대출이자", icon: "coins", color: "#585a60" },
  allowance: { label: "용돈", icon: "wallet", color: "#94a3b8" },
  other: { label: "기타", icon: "layers", color: "#cbd5e1" },
};

/** 변동지출에 자주 쓰는 카테고리 */
export const VARIABLE_CATEGORIES: SpendCategory[] = [
  "food",
  "cafe",
  "transport",
  "shopping",
  "living",
  "other",
];

/** 고정지출 프리셋 카테고리 */
export const FIXED_CATEGORIES: SpendCategory[] = [
  "housing",
  "telecom",
  "subscription",
  "insurance",
  "loan",
  "allowance",
  "other",
];

export interface SpendFavorite {
  id: string;
  label: string;
  amountWon: number;
  category: SpendCategory;
}

/** 즐겨찾기 기본값 — 빈 목록 (사용자가 직접 추가) */
export const DEFAULT_FAVORITES: SpendFavorite[] = [];
