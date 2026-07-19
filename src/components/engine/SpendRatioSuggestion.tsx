"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useProfile, selectSpending } from "@/lib/store/useProfile";
import { DEFAULT_SNAPSHOT } from "@/lib/store/defaults";
import {
  applySpendRatioToBuckets,
  currentSpendRatios,
  isSpendSuggestionDifferent,
  spendRatioSuggestion,
  toSpendRatioPctSuggestion,
  type SpendRatioPctSuggestion,
} from "@/lib/spending/bridge";
import { sumMonthlyIncome, normalizeIncomeSources } from "@/lib/income";
import { formatKRW } from "@/lib/format";
import { track } from "@/lib/analytics";
import type { Bucket, FinancialSnapshot } from "@/lib/types";
import { Button, Card } from "@/components/ui";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Icon } from "@/components/Icon";

function useMeasuredSpendSuggestion(): SpendRatioPctSuggestion | null {
  const profile = useProfile((s) => s.profile);
  const spending = selectSpending(profile);
  const snapshot = profile.snapshot ?? DEFAULT_SNAPSHOT;
  const income = sumMonthlyIncome(normalizeIncomeSources(snapshot.incomeSources));
  const now = new Date();
  const year = now.getFullYear();
  const monthIndex = now.getMonth();

  return useMemo(() => {
    const raw = spendRatioSuggestion(spending, year, monthIndex, income);
    return raw ? toSpendRatioPctSuggestion(raw) : null;
  }, [spending, income, year, monthIndex]);
}

function applySuggestion(
  buckets: Bucket[],
  suggestion: SpendRatioPctSuggestion,
  snapshot: FinancialSnapshot,
  source: string,
  setBuckets: (b: Bucket[]) => void,
  setSnapshot: (s: FinancialSnapshot) => void,
) {
  const { buckets: next, createdSpend, createdChildren } = applySpendRatioToBuckets(
    buckets,
    suggestion,
  );
  setBuckets(next);
  if (snapshot.monthlySpending !== suggestion.monthlySpendingManwon) {
    setSnapshot({
      ...snapshot,
      monthlySpending: suggestion.monthlySpendingManwon,
    });
  }
  track("spend_ratio_suggestion_applied", {
    source,
    spend_pct: suggestion.spendPct,
    fixed_pct: suggestion.fixedPct,
    variable_pct: suggestion.variablePct,
    created_spend: createdSpend,
    created_children: createdChildren,
  });
}

/** 엔진 캔버스 위 — 실측 기준 지출 비율 제안 (Phase B) */
export function SpendRatioSuggestionBar() {
  const profile = useProfile((s) => s.profile);
  const setBuckets = useProfile((s) => s.setBuckets);
  const setSnapshot = useProfile((s) => s.setSnapshot);
  const snapshot = profile.snapshot ?? DEFAULT_SNAPSHOT;
  const buckets = profile.engine.buckets;
  const suggestion = useMeasuredSpendSuggestion();
  const different = suggestion
    ? isSpendSuggestionDifferent(buckets, suggestion)
    : false;
  const current = currentSpendRatios(buckets);

  const [open, setOpen] = useState(false);

  if (!suggestion || suggestion.monthlySpendingManwon <= 0) {
    return (
      <Card className="!p-3 border-ink-100 bg-ink-50/50">
        <p className="text-xs text-ink-500">
          지출 실측이 있으면 여기서 배분 비율을 제안해요.{" "}
          <Link href="/spending" className="font-semibold text-brand-700 hover:underline">
            지출 기록 →
          </Link>
        </p>
      </Card>
    );
  }

  if (!different) {
    return (
      <Card className="!p-3 border-sage-100 bg-sage-50/60">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-sage-700">
          <Icon name="check" size={14} />
          지출 비율이 실측과 같아요 · 수입 대비 {suggestion.spendPct}% (고정{" "}
          {suggestion.fixedPct}% / 변동 {suggestion.variablePct}%)
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="!p-3 border-spend-100 bg-spend-50/50">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-spend-700">
              <Icon name="wallet" size={14} />
              실측 기준 제안
            </div>
            <p className="mt-1 text-sm text-ink-700">
              지출{" "}
              <span className="tnum font-extrabold">
                {current.spendPct ?? "—"}% → {suggestion.spendPct}%
              </span>
              <span className="text-ink-400">
                {" "}
                · 고정 {suggestion.fixedPct}% / 변동 {suggestion.variablePct}% ·{" "}
                {formatKRW(suggestion.monthlySpendingManwon)}
              </span>
            </p>
            <p className="mt-1 text-[11px] text-ink-400">
              지출 노드 비율만 바꿉니다. 위치·투자·저축은 그대로예요.
            </p>
          </div>
          <Button onClick={() => setOpen(true)}>제안 적용</Button>
        </div>
      </Card>

      <ConfirmModal
        open={open}
        title="실측 기준으로 지출 비율을 맞출까요?"
        danger={false}
        confirmLabel="적용하기"
        cancelLabel="취소"
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          applySuggestion(
            buckets,
            suggestion,
            snapshot,
            "engine_bar",
            setBuckets,
            setSnapshot,
          );
          setOpen(false);
        }}
        message={
          <div className="space-y-2">
            <ul className="list-inside list-disc text-xs text-ink-500">
              <li>
                지출(수입 대비): {current.spendPct ?? "—"}% →{" "}
                <strong className="text-ink-800">{suggestion.spendPct}%</strong>
              </li>
              <li>
                고정/변동: {current.fixedPct ?? "—"}/{current.variablePct ?? "—"}% →{" "}
                <strong className="text-ink-800">
                  {suggestion.fixedPct}/{suggestion.variablePct}%
                </strong>
              </li>
              <li>
                진단 월 지출도 {formatKRW(suggestion.monthlySpendingManwon)}으로 맞춥니다
              </li>
            </ul>
          </div>
        }
      />
    </>
  );
}

/** Inspector — 지출 계열 선택 시 짧은 CTA */
export function SpendRatioSuggestionInline() {
  const profile = useProfile((s) => s.profile);
  const setBuckets = useProfile((s) => s.setBuckets);
  const setSnapshot = useProfile((s) => s.setSnapshot);
  const snapshot = profile.snapshot ?? DEFAULT_SNAPSHOT;
  const buckets = profile.engine.buckets;
  const suggestion = useMeasuredSpendSuggestion();
  const [open, setOpen] = useState(false);

  if (!suggestion || suggestion.monthlySpendingManwon <= 0) return null;
  if (!isSpendSuggestionDifferent(buckets, suggestion)) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-xl border border-spend-100 bg-spend-50 px-3 py-2 text-left text-xs font-semibold text-spend-700 hover:bg-spend-100/60"
      >
        <span className="flex items-center gap-1.5">
          <Icon name="wallet" size={14} />
          실측 기준 제안 적용
        </span>
        <span className="tnum text-ink-500">{suggestion.spendPct}%</span>
      </button>
      <ConfirmModal
        open={open}
        title="실측 기준으로 지출 비율을 맞출까요?"
        danger={false}
        confirmLabel="적용하기"
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          applySuggestion(
            buckets,
            suggestion,
            snapshot,
            "inspector",
            setBuckets,
            setSnapshot,
          );
          setOpen(false);
        }}
        message={`지출 ${suggestion.spendPct}% · 고정 ${suggestion.fixedPct}% / 변동 ${suggestion.variablePct}%로 맞추고, 진단 월 지출도 갱신합니다.`}
      />
    </>
  );
}

/** 캔버스 지출 루트 배지용 — 제안이 있고 다를 때만 true */
export function useSpendSuggestionPending(): boolean {
  const buckets = useProfile((s) => s.profile.engine.buckets);
  const suggestion = useMeasuredSpendSuggestion();
  if (!suggestion || suggestion.monthlySpendingManwon <= 0) return false;
  return isSpendSuggestionDifferent(buckets, suggestion);
}
