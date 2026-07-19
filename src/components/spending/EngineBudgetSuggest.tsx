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

/** Phase C — 자산 설계 변동 한도 → 변동지출 예산 제안 (변동 탭) */
export function EngineBudgetSuggest() {
  const profile = useProfile((s) => s.profile);
  const setBudget = useProfile((s) => s.setVariableBudget);
  const spending = selectSpending(profile);
  const snapshot = profile.snapshot ?? DEFAULT_SNAPSHOT;
  const income = sumMonthlyIncome(normalizeIncomeSources(snapshot.incomeSources));
  const buckets = profile.engine.buckets;

  const suggestion = useMemo(
    () =>
      engineVariableBudgetSuggestion(buckets, income, sumFixed(spending.fixed)),
    [buckets, income, spending.fixed],
  );

  const [open, setOpen] = useState(false);

  if (!suggestion || suggestion.suggestedWon <= 0) {
    return (
      <p className="text-center text-[11px] text-ink-400">
        자산 설계에 지출 배분이 있으면 변동 예산을 맞춰 볼 수 있어요.{" "}
        <Link href="/engine" className="font-semibold text-brand-700 hover:underline">
          자산 설계 →
        </Link>
      </p>
    );
  }

  const current = spending.monthlyVariableBudgetWon;
  if (!isEngineBudgetDifferent(current, suggestion)) {
    return (
      <p className="flex items-center justify-center gap-1 text-center text-[11px] font-medium text-sage-700">
        <Icon name="check" size={12} />
        변동 예산이 자산 설계 한도와 같아요 ({formatWon(current)})
      </p>
    );
  }

  return (
    <>
      <Card className="!p-3 border-spend-100 bg-spend-50/40">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-spend-700">
              <Icon name="engine" size={14} />
              자산 설계 한도 → 변동 예산
            </div>
            <p className="mt-1 text-sm text-ink-700">
              <span className="tnum font-extrabold">
                {formatWon(current)} → {formatWon(suggestion.suggestedWon)}
              </span>
              <span className="text-ink-400">
                {" "}
                · 엔진 지출 {suggestion.spendManwon}만 중 변동 {suggestion.variableManwon}만
              </span>
            </p>
          </div>
          <Button onClick={() => setOpen(true)}>예산에 맞추기</Button>
        </div>
      </Card>

      <ConfirmModal
        open={open}
        title="자산 설계 한도로 예산을 맞출까요?"
        danger={false}
        confirmLabel="맞추기"
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setBudget(suggestion.suggestedWon);
          track("engine_budget_to_variable_applied", {
            source: "variable_tab",
            from: current,
            to: suggestion.suggestedWon,
            suggest_source: suggestion.source,
          });
          setOpen(false);
        }}
        message={
          <p>
            변동지출 예산을{" "}
            <strong className="tnum">{formatWon(current)}</strong>에서{" "}
            <strong className="tnum">{formatWon(suggestion.suggestedWon)}</strong>
            으로 바꿉니다. 배분 트리는 그대로예요.
          </p>
        }
      />
    </>
  );
}
