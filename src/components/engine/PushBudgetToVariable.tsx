"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useProfile, selectSpending } from "@/lib/store/useProfile";
import { DEFAULT_SNAPSHOT } from "@/lib/store/defaults";
import {
  engineVariableBudgetSuggestion,
  isEngineBudgetDifferent,
} from "@/lib/spending/bridge";
import { sumFixed } from "@/lib/spending/calc";
import { formatWon } from "@/lib/spending/format";
import { normalizeIncomeSources, sumMonthlyIncome } from "@/lib/income";
import { track } from "@/lib/analytics";
import { Button, Card } from "@/components/ui";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Icon } from "@/components/Icon";

function useEngineBudgetSuggestion() {
  const profile = useProfile((s) => s.profile);
  const spending = selectSpending(profile);
  const snapshot = profile.snapshot ?? DEFAULT_SNAPSHOT;
  const income = sumMonthlyIncome(normalizeIncomeSources(snapshot.incomeSources));
  const buckets = profile.engine.buckets;
  return useMemo(
    () =>
      engineVariableBudgetSuggestion(buckets, income, sumFixed(spending.fixed)),
    [buckets, income, spending.fixed],
  );
}

/** 엔진 캔버스 위 — 한도 → 변동 예산 (Phase C, Phase B 바와 짝) */
export function PushBudgetToVariableBar() {
  const profile = useProfile((s) => s.profile);
  const spending = selectSpending(profile);
  const setBudget = useProfile((s) => s.setVariableBudget);
  const suggestion = useEngineBudgetSuggestion();
  const [open, setOpen] = useState(false);

  if (!suggestion || suggestion.suggestedWon <= 0) return null;

  const current = spending.monthlyVariableBudgetWon;
  if (!isEngineBudgetDifferent(current, suggestion)) return null;

  return (
    <>
      <Card className="!p-3 border-gold-200 bg-gold-50/40">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gold-600">
              <Icon name="wallet" size={14} />
              변동 예산에 반영
            </div>
            <p className="mt-1 text-sm text-ink-700">
              지출관리 예산{" "}
              <span className="tnum font-extrabold">
                {formatWon(current)} → {formatWon(suggestion.suggestedWon)}
              </span>
            </p>
            <p className="mt-1 text-[11px] text-ink-400">
              엔진 변동 한도({suggestion.variableManwon}만)를 기록용 예산으로 복사합니다.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
            <Button onClick={() => setOpen(true)}>예산에 맞추기</Button>
            <Link
              href="/spending"
              className="text-center text-[11px] font-medium text-brand-700 hover:underline"
            >
              지출관리 →
            </Link>
          </div>
        </div>
      </Card>

      <ConfirmModal
        open={open}
        title="변동지출 예산을 엔진 한도에 맞출까요?"
        danger={false}
        confirmLabel="맞추기"
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setBudget(suggestion.suggestedWon);
          track("engine_budget_to_variable_applied", {
            source: "engine_bar",
            from: current,
            to: suggestion.suggestedWon,
            suggest_source: suggestion.source,
          });
          setOpen(false);
        }}
        message={`예산을 ${formatWon(current)} → ${formatWon(suggestion.suggestedWon)}으로 바꿉니다.`}
      />
    </>
  );
}

/** Inspector — 지출 계열 선택 시 */
export function PushBudgetToVariableInline() {
  const profile = useProfile((s) => s.profile);
  const spending = selectSpending(profile);
  const setBudget = useProfile((s) => s.setVariableBudget);
  const suggestion = useEngineBudgetSuggestion();
  const [open, setOpen] = useState(false);

  if (!suggestion || suggestion.suggestedWon <= 0) return null;
  if (!isEngineBudgetDifferent(spending.monthlyVariableBudgetWon, suggestion)) return null;

  const current = spending.monthlyVariableBudgetWon;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-xl border border-gold-200 bg-gold-50 px-3 py-2 text-left text-xs font-semibold text-gold-600 hover:bg-gold-100/50"
      >
        <span className="flex items-center gap-1.5">
          <Icon name="wallet" size={14} />
          변동 예산에 반영
        </span>
        <span className="tnum text-ink-500">{formatWon(suggestion.suggestedWon)}</span>
      </button>
      <ConfirmModal
        open={open}
        title="변동지출 예산을 엔진 한도에 맞출까요?"
        danger={false}
        confirmLabel="맞추기"
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setBudget(suggestion.suggestedWon);
          track("engine_budget_to_variable_applied", {
            source: "inspector",
            from: current,
            to: suggestion.suggestedWon,
            suggest_source: suggestion.source,
          });
          setOpen(false);
        }}
        message={`예산을 ${formatWon(current)} → ${formatWon(suggestion.suggestedWon)}으로 바꿉니다.`}
      />
    </>
  );
}
