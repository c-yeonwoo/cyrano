"use client";

import { useEffect, useRef, useState } from "react";
import { useProfile } from "@/lib/store/useProfile";
import { DEFAULT_SNAPSHOT, suggestEngineFromSnapshot } from "@/lib/store/defaults";
import { computeStage, STAGE_NAMES } from "@/lib/engine";
import type { FinancialSnapshot } from "@/lib/types";
import { sumMonthlyIncome } from "@/lib/income";
import { formatKRW, formatPct } from "@/lib/format";
import {
  Button,
  Field,
  NumberInput,
  StatCard,
  AssumptionNote,
} from "@/components/ui";
import { Icon } from "@/components/Icon";
import { ApplySpendingToEngine } from "@/components/spending/ApplySpendingToEngine";
import { ConfirmModal } from "@/components/ConfirmModal";
import { track } from "@/lib/analytics";

export function DiagnosisModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const stored = useProfile((s) => s.profile.snapshot);
  const vision = useProfile((s) => s.profile.vision);
  const buckets = useProfile((s) => s.profile.engine.buckets);
  const setSnapshot = useProfile((s) => s.setSnapshot);
  const setEngine = useProfile((s) => s.setEngine);
  const s = stored ?? DEFAULT_SNAPSHOT;

  const [confirmDraft, setConfirmDraft] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  const patch = (p: Partial<FinancialSnapshot>) => setSnapshot({ ...s, ...p });
  const monthlyIncome = sumMonthlyIncome(s.incomeSources);

  /** 진단은 월소득 합 1칸 — 엔진에서 수입원 분해 */
  const setMonthlyIncomeTotal = (monthly: number) => {
    const labor = s.incomeSources.find((i) => i.type === "labor");
    patch({
      incomeSources: [
        {
          id: labor?.id ?? "inc_labor",
          type: "labor",
          monthly: Math.max(0, monthly),
          name: labor?.name?.trim() || "월소득",
          position: 0,
          canvasX: labor?.canvasX,
          canvasY: labor?.canvasY,
        },
      ],
    });
  };

  const result = computeStage(s);
  const m = result.metrics;

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const applyDraft = () => {
    setEngine(suggestEngineFromSnapshot(s));
    track("engine_recommend_applied", { source: "diagnosis_modal" });
    setConfirmDraft(false);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="diagnosis-modal-title"
      >
        <button
          type="button"
          className="absolute inset-0 bg-ink-900/40"
          aria-label="닫기"
          onClick={onClose}
        />
        <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-t-2xl border border-ink-200 bg-white shadow-lg sm:rounded-2xl">
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3 sm:px-5">
            <div>
              <h2
                id="diagnosis-modal-title"
                className="text-base font-bold text-ink-900"
              >
                내 현황
              </h2>
              <p className="mt-0.5 text-xs text-ink-400">
                아는 숫자만 넣어도 됩니다 · 엔진 초안의 기준
              </p>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink-700"
              aria-label="닫기"
            >
              <Icon name="x" size={18} />
            </button>
          </div>

          <div className="overflow-y-auto px-4 py-4 sm:px-5">
            <div className="space-y-6">
              <section className="space-y-3">
                <h3 className="text-xs font-semibold tracking-[0.08em] text-ink-400 uppercase">
                  자산 · 부채
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="현금·예적금">
                    <NumberInput
                      value={s.cash}
                      onChange={(v) => patch({ cash: v })}
                      suffix="만원"
                    />
                  </Field>
                  <Field label="투자자산">
                    <NumberInput
                      value={s.investAssets}
                      onChange={(v) => patch({ investAssets: v })}
                      suffix="만원"
                    />
                  </Field>
                  <Field label="부동산">
                    <NumberInput
                      value={s.realEstate}
                      onChange={(v) => patch({ realEstate: v })}
                      suffix="만원"
                    />
                  </Field>
                  <Field label="부채">
                    <NumberInput
                      value={s.liabilities}
                      onChange={(v) => patch({ liabilities: v })}
                      suffix="만원"
                    />
                  </Field>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-xs font-semibold tracking-[0.08em] text-ink-400 uppercase">
                  월 흐름
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="월소득 (합)">
                    <NumberInput
                      value={monthlyIncome}
                      onChange={setMonthlyIncomeTotal}
                      suffix="만원"
                    />
                  </Field>
                  <Field label="월 지출">
                    <NumberInput
                      value={s.monthlySpending}
                      onChange={(v) => patch({ monthlySpending: v })}
                      suffix="만원"
                    />
                  </Field>
                  <Field label="비상금">
                    <NumberInput
                      value={s.emergencyMonths}
                      onChange={(v) => patch({ emergencyMonths: v })}
                      suffix="개월"
                    />
                  </Field>
                </div>
                <ApplySpendingToEngine source="diagnosis" compact />
              </section>

              <section className="space-y-3">
                <h3 className="text-xs font-semibold tracking-[0.08em] text-ink-400 uppercase">
                  스크리닝
                </h3>
                <div className="rounded-xl border border-ink-100 bg-brand-50/50 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="tnum text-2xl font-extrabold text-ink-900">
                        {result.stage}
                        <span className="text-base font-bold text-ink-400"> / 8</span>
                      </div>
                      <div className="mt-0.5 text-sm font-semibold text-ink-700">
                        {STAGE_NAMES[result.stage]}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: 8 }, (_, i) => (
                        <span
                          key={i}
                          className={`h-2 w-2 rounded-full ${
                            i < result.stage ? "bg-gold-400" : "bg-ink-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-ink-600">
                    {result.nextStep}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <StatCard label="순자산" value={formatKRW(m.netWorth)} />
                  <StatCard
                    label="저축률"
                    value={formatPct(Math.max(0, m.savingsRatePct))}
                  />
                </div>
                {vision && vision.goalNetworth > 0 && (
                  <p className="text-xs text-ink-500">
                    목표 대비{" "}
                    <span className="font-semibold text-ink-700">
                      {formatPct((m.netWorth / vision.goalNetworth) * 100, 1)}
                    </span>
                  </p>
                )}
                <AssumptionNote>단계 기준은 예시·가정입니다.</AssumptionNote>
              </section>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-ink-100 px-4 py-3 sm:flex-row sm:justify-end sm:px-5">
            <Button variant="outline" onClick={onClose}>
              닫기
            </Button>
            <Button
              onClick={() => {
                if (buckets.length > 0) setConfirmDraft(true);
                else applyDraft();
              }}
            >
              <Icon name="engine" size={14} />
              이걸로 엔진 초안 만들기
            </Button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmDraft}
        title="엔진 초안을 다시 그릴까요?"
        message="지금 캔버스의 배분 트리가 추천 초안으로 바뀝니다. 수입원·수동 위치는 유지되지 않을 수 있어요."
        confirmLabel="초안 적용"
        cancelLabel="취소"
        danger={false}
        onConfirm={applyDraft}
        onCancel={() => setConfirmDraft(false)}
      />
    </>
  );
}
