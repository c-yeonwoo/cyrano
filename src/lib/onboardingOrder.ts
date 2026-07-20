/**
 * 온보딩 스텝 순서 A/B.
 * - diagnosis_first (B→A→C): 기본 — 자기 파악 후 목표 (PRODUCT_REVIEW 권고)
 * - goals_first (A→B→C): 레거시
 *
 * 할당: env 강제 → 없으면 localStorage sticky → 없으면 70% diagnosis / 30% goals
 */

import type { IconName } from "@/components/Icon";

export type OnboardingOrder = "diagnosis_first" | "goals_first";

export type OnboardingStepKey = "goals" | "diagnosis" | "engine";

export interface OnboardingStepDef {
  key: OnboardingStepKey;
  label: string;
  icon: IconName;
  title: string;
  desc: string;
  nextLabel: string;
}

const LS_KEY = "looplus_onboarding_order";

const STEP_COPY: Record<
  OnboardingStepKey,
  Omit<OnboardingStepDef, "key"> & { key: OnboardingStepKey }
> = {
  diagnosis: {
    key: "diagnosis",
    label: "현재 진단",
    icon: "diagnosis",
    title: "지금 내 위치를 확인해요",
    desc: "최소만 입력해도 됩니다. 자산 설계와 같은 숫자를 씁니다.",
    nextLabel: "다음",
  },
  goals: {
    key: "goals",
    label: "목표·비전",
    icon: "target",
    title: "미래의 나를 그려요",
    desc: "왜 경제적 자유를 원하는지, 얼마를 언제까지. 목표는 언제든 수정할 수 있어요.",
    nextLabel: "다음",
  },
  engine: {
    key: "engine",
    label: "자산 설계",
    icon: "engine",
    title: "돈을 어디에 나눌까요",
    desc: "항목을 추가하고 비율만 맞추면, 몇 년 뒤 자산이 바로 보입니다.",
    nextLabel: "완료 · 홈으로",
  },
};

export function stepsForOrder(order: OnboardingOrder): OnboardingStepDef[] {
  const mid =
    order === "diagnosis_first"
      ? [STEP_COPY.diagnosis, STEP_COPY.goals]
      : [STEP_COPY.goals, STEP_COPY.diagnosis];
  // 엔진 직전 CTA 라벨
  const beforeEngine = mid.map((s, i) =>
    i === mid.length - 1 ? { ...s, nextLabel: "자산 설계로" } : s,
  );
  return [...beforeEngine, STEP_COPY.engine];
}

function envForce(): OnboardingOrder | null {
  const v = process.env.NEXT_PUBLIC_ONBOARDING_ORDER?.trim();
  if (v === "diagnosis_first" || v === "goals_first") return v;
  return null;
}

function readSticky(): OnboardingOrder | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(LS_KEY);
    if (v === "diagnosis_first" || v === "goals_first") return v;
  } catch {
    /* ignore */
  }
  return null;
}

function writeSticky(order: OnboardingOrder): void {
  try {
    localStorage.setItem(LS_KEY, order);
  } catch {
    /* ignore */
  }
}

/** 브라우저당 1회 할당 후 sticky */
export function resolveOnboardingOrder(): OnboardingOrder {
  const forced = envForce();
  if (forced) return forced;

  const sticky = readSticky();
  if (sticky) return sticky;

  // 기본 편향: 진단 먼저 70%
  const order: OnboardingOrder =
    Math.random() < 0.7 ? "diagnosis_first" : "goals_first";
  writeSticky(order);
  return order;
}
