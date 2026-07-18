/**
 * 도메인 모델 — 핸드오프 §7 기반.
 *
 * 단위 규약(중요):
 *  - 모든 금액은 **만원** 단위 정수/실수 (예: 10억 = 100_000, 월 300만 = 300).
 *  - 비율은 퍼센트 값 (예: 54 = 54%).
 *  - 기간은 '지금부터 n년'.
 * 모든 수치는 '예시·가정'이며 수익을 보장하지 않는다.
 */

export type IncomeSourceType = "labor" | "capital" | "platform" | "freelance";

export const INCOME_SOURCE_META: Record<
  IncomeSourceType,
  { label: string; hint: string }
> = {
  labor: { label: "근로소득", hint: "월급·안정 소득" },
  capital: { label: "자본소득", hint: "배당·임대·이자 (실현)" },
  platform: { label: "플랫폼 부수입", hint: "콘텐츠·광고 등" },
  freelance: { label: "프리랜서", hint: "외주·사업 소득" },
};

export interface IncomeSource {
  type: IncomeSourceType;
  /** 월 금액(만원) */
  monthly: number;
}

/** A. 비전보드 장면 카드 */
export type SceneType = "place" | "day" | "work" | "people";

export const SCENE_META: Record<
  SceneType,
  { label: string; icon: string; placeholder: string }
> = {
  place: { label: "사는 곳", icon: "home", placeholder: "어디서, 어떤 집에 살고 있나요?" },
  day: { label: "하루 일과", icon: "sun", placeholder: "아침에 일어나면 무엇을 하나요?" },
  work: { label: "하는 일", icon: "briefcase", placeholder: "좋아서 하는 일은 무엇인가요?" },
  people: { label: "함께하는 사람", icon: "users", placeholder: "누구와 함께 있나요?" },
};

export interface Scene {
  type: SceneType;
  text: string;
  emoji?: string;
  imageUrl?: string; // fast-follow: AI 장면 생성
}

/** A. Vision / 목표 */
export interface Vision {
  goalNetworth: number; // 만원
  goalPassiveIncome: number; // 월 만원
  targetYears: number; // 지금부터 n년
  currentAge?: number;
  why: string;
  scenes: Scene[];
}

/** B. 재무 스냅샷 (엔진과 공유하는 원천 데이터) */
export interface FinancialSnapshot {
  cash: number; // 현금·예적금(만원)
  investAssets: number; // 투자자산(주식·펀드·연금·IRP 등, 만원)
  realEstate: number; // 부동산(만원)
  liabilities: number; // 부채(만원)
  incomeSources: IncomeSource[]; // 월 소득 소스별
  monthlySpending: number; // 월 지출(만원)
  emergencyMonths: number; // 비상금 개월수
}

/** C. 엔진 버킷 */
export type BucketCategory = "invest" | "save" | "spend";

export const CATEGORY_META: Record<
  BucketCategory,
  { label: string; accent: string; note: string }
> = {
  invest: { label: "투자", accent: "amber", note: "수익 발생 → 복리 재투입" },
  save: { label: "저축", accent: "emerald", note: "유동성·목적 자금 (저수익)" },
  spend: { label: "지출", accent: "sky", note: "소비 — 시스템 밖(out)" },
};

export interface Bucket {
  id: string;
  category: BucketCategory;
  name: string;
  /** income 대비 배분 비율 % */
  ratioPct: number;
  /** 기대 연 수익률 % (가정) — 투자/저축 버킷 */
  expectedAnnualReturnPct: number;
  /**
   * 실현 수익률 % (배당·임대·이자). 전체 수익률 중 현금으로 실현되어
   * upstream(자본소득)으로 재유입되는 몫. 나머지(미실현)는 버킷 내 복리.
   * 투자 버킷만 의미 있음.
   */
  realizedYieldPct: number;
  isLocked: boolean; // 연금·IRP 등 인출 제한
  lockUntilAge?: number;
  linkedTool?: string; // v2 cross-sell
  /** 캔버스 정렬 순서 */
  position: number;
}

export interface EngineConfig {
  buckets: Bucket[];
}

export interface Scenario {
  id: string;
  name: string;
  buckets: Bucket[];
  createdAt: string;
}

/** 전체 사용자 프로필 (localStorage / Supabase 공용 shape) */
export interface Profile {
  vision: Vision | null;
  snapshot: FinancialSnapshot | null;
  engine: EngineConfig;
  scenarios: Scenario[];
  onboardedAt: string | null;
  updatedAt: string;
}

/** 계산 결과 (ProjectionResult) */
export interface YearPoint {
  year: number; // 0 = 현재
  totalNetWorth: number; // 순자산(만원)
  liquidAssets: number; // 유동자산(만원)
  lockedAssets: number; // 잠긴자산(연금·IRP, 만원)
  monthlyPassiveIncome: number; // 월 실현 자본소득(만원)
  annualIncome: number; // 그 해 배분 대상 연 소득(만원)
  laborAnnual: number; // 근로성 연 소득(만원)
  capitalAnnual: number; // 자본 연 소득(만원)
}

export interface ProjectionResult {
  curve: YearPoint[];
  /** 목표 순자산 도달 연차 (없으면 null) */
  targetReachYear: number | null;
  /** 목표 passive income 도달 연차 */
  passiveReachYear: number | null;
  /** 현재 순자산 / 목표 순자산 (%) */
  achievementPct: number;
  /** 자본소득 > 근로소득 교차 연차 */
  crossoverYear: number | null;
  finalNetWorth: number;
  finalMonthlyPassive: number;
}
