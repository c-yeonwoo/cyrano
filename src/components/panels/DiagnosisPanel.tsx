"use client";

import type { ReactNode } from "react";
import { useProfile } from "@/lib/store/useProfile";
import { DEFAULT_SNAPSHOT } from "@/lib/store/defaults";
import { computeStage, STAGE_NAMES } from "@/lib/engine";
import {
  INCOME_SOURCE_META,
  type FinancialSnapshot,
  type IncomeSourceType,
} from "@/lib/types";
import { formatKRW, formatPct } from "@/lib/format";
import {
  Card,
  Field,
  NumberInput,
  StatCard,
  AssumptionNote,
} from "@/components/ui";
import { ApplySpendingToEngine } from "@/components/spending/ApplySpendingToEngine";

const INCOME_ORDER: IncomeSourceType[] = ["labor", "capital", "platform", "freelance"];

function getIncome(s: FinancialSnapshot, type: IncomeSourceType): number {
  return s.incomeSources.find((i) => i.type === type)?.monthly ?? 0;
}

function QuietSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-xs font-semibold tracking-[0.08em] text-ink-400 uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function DiagnosisPanel({ showResult = true }: { showResult?: boolean }) {
  const stored = useProfile((s) => s.profile.snapshot);
  const vision = useProfile((s) => s.profile.vision);
  const setSnapshot = useProfile((s) => s.setSnapshot);
  const s = stored ?? DEFAULT_SNAPSHOT;

  const patch = (p: Partial<FinancialSnapshot>) => setSnapshot({ ...s, ...p });
  const setIncome = (type: IncomeSourceType, monthly: number) => {
    const existing = s.incomeSources.find((i) => i.type === type);
    const others = s.incomeSources.filter((i) => i.type !== type);
    patch({
      incomeSources: [
        ...others,
        existing
          ? { ...existing, monthly }
          : { id: `inc_${type}`, type, monthly, position: others.length },
      ],
    });
  };

  const result = computeStage(s);
  const m = result.metrics;

  return (
    <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
      <div className="space-y-12">
        <QuietSection title="자산 · 부채">
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            <Field label="현금·예적금">
              <NumberInput value={s.cash} onChange={(v) => patch({ cash: v })} suffix="만원" />
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
        </QuietSection>

        <QuietSection title="월 소득">
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            {INCOME_ORDER.map((type) => (
              <Field key={type} label={INCOME_SOURCE_META[type].label}>
                <NumberInput
                  value={getIncome(s, type)}
                  onChange={(v) => setIncome(type, v)}
                  suffix="만원"
                />
              </Field>
            ))}
          </div>
        </QuietSection>

        <QuietSection title="지출 · 비상금">
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            <Field label="월 지출 (진단 기준)">
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
          <div className="pt-2">
            <ApplySpendingToEngine source="diagnosis" compact />
          </div>
          {(m.monthlySavable !== 0 || m.savingsRatePct !== 0) && (
            <p className="text-sm text-ink-500">
              저축 가능 약{" "}
              <span className="font-semibold text-ink-800">
                {formatKRW(Math.max(0, m.monthlySavable))}
              </span>
              <span className="text-ink-300"> · </span>
              저축률{" "}
              <span className="font-semibold text-ink-800">
                {formatPct(Math.max(0, m.savingsRatePct))}
              </span>
            </p>
          )}
        </QuietSection>
      </div>

      {showResult && (
        <div className="space-y-10 lg:sticky lg:top-8 lg:self-start">
          <QuietSection title="결과">
            <Card className="!p-6 bg-brand-50/40 border-ink-100">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="tnum text-3xl font-extrabold tracking-tight text-ink-900">
                    {result.stage}
                    <span className="text-lg font-bold text-ink-400"> / 8</span>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-ink-700">
                    {STAGE_NAMES[result.stage]}
                  </div>
                </div>
                <StageDots stage={result.stage} />
              </div>
            </Card>
          </QuietSection>

          <QuietSection title="스냅샷">
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="순자산" value={formatKRW(m.netWorth)} />
              <StatCard label="저축률" value={formatPct(Math.max(0, m.savingsRatePct))} />
              <StatCard
                label="근로 : 자본"
                value={`${Math.round(m.laborSharePct)}:${Math.round(m.capitalSharePct)}`}
              />
              <StatCard label="passive / 생활비" value={formatPct(m.passiveToSpendingPct)} />
            </div>
          </QuietSection>

          <QuietSection title="다음 한 걸음">
            <p className="text-sm leading-relaxed text-ink-700">{result.nextStep}</p>
          </QuietSection>

          {vision && vision.goalNetworth > 0 && (
            <QuietSection title="목표 대비">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-ink-400">{formatKRW(vision.goalNetworth)}</span>
                <span className="font-semibold text-ink-800">
                  {formatPct((m.netWorth / vision.goalNetworth) * 100, 1)}
                </span>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                <div
                  className="h-full rounded-full bg-gold-400"
                  style={{
                    width: `${Math.min(100, Math.max(1, (m.netWorth / vision.goalNetworth) * 100))}%`,
                  }}
                />
              </div>
            </QuietSection>
          )}

          <AssumptionNote>단계 기준은 예시·가정입니다.</AssumptionNote>
        </div>
      )}
    </div>
  );
}

function StageDots({ stage }: { stage: number }) {
  return (
    <div className="flex gap-1.5 pt-1">
      {Array.from({ length: 8 }, (_, i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-full ${i < stage ? "bg-gold-400" : "bg-ink-200"}`}
        />
      ))}
    </div>
  );
}
