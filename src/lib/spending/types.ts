import type { SpendCategory, SpendFavorite } from "./catalog";

/**
 * 지출관리 도메인.
 * 금액 단위 = **원** (엔진/진단의 만원과 다름 — 연동 시 /10000).
 */

export interface VariableLog {
  id: string;
  amountWon: number;
  category: SpendCategory;
  /** YYYY-MM-DD */
  date: string;
  memo: string;
  /** 수기는 null. 오픈뱅킹 연동 시 실제 시각 */
  time?: string | null;
  createdAt: string;
}

export interface FixedExpense {
  id: string;
  name: string;
  category: SpendCategory;
  amountWon: number;
  /** 1–28 본인 세팅 결제일 */
  billingDay: number;
}

export interface SpendingState {
  /** 이번 달 변동지출 종합 예산(원) */
  monthlyVariableBudgetWon: number;
  logs: VariableLog[];
  fixed: FixedExpense[];
  favorites: SpendFavorite[];
}

export function emptySpending(): SpendingState {
  return {
    monthlyVariableBudgetWon: 0,
    logs: [],
    fixed: [],
    favorites: [],
  };
}
