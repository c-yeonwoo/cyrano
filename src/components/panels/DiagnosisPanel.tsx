"use client";

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
  SectionTitle,
  AssumptionNote,
} from "@/components/ui";
import { Icon } from "@/components/Icon";

const INCOME_ORDER: IncomeSourceType[] = ["labor", "capital", "platform", "freelance"];

function getIncome(s: FinancialSnapshot, type: IncomeSourceType): number {
  return s.incomeSources.find((i) => i.type === type)?.monthly ?? 0;
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
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ── 입력 ── */}
      <div className="space-y-5">
        <Card>
          <SectionTitle n={1} desc="최소만 입력해도 됩니다. 대략값·스킵 허용.">
            현재 자산 / 부채
          </SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <Field label="현금·예적금">
              <NumberInput value={s.cash} onChange={(v) => patch({ cash: v })} suffix="만원" />
            </Field>
            <Field label="투자자산" hint="주식·펀드·연금">
              <NumberInput value={s.investAssets} onChange={(v) => patch({ investAssets: v })} suffix="만원" />
            </Field>
            <Field label="부동산">
              <NumberInput value={s.realEstate} onChange={(v) => patch({ realEstate: v })} suffix="만원" />
            </Field>
            <Field label="부채">
              <NumberInput value={s.liabilities} onChange={(v) => patch({ liabilities: v })} suffix="만원" />
            </Field>
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <SectionTitle n={2} desc="자산 설계와 같은 숫자를 씁니다">
              월 소득
            </SectionTitle>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {INCOME_ORDER.map((type) => (
              <Field
                key={type}
                label={INCOME_SOURCE_META[type].label}
                hint={type === "capital" ? "배당·임대·이자" : undefined}
              >
                <NumberInput
                  value={getIncome(s, type)}
                  onChange={(v) => setIncome(type, v)}
                  suffix="만원"
                />
              </Field>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle n={3}>지출 · 비상금</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <Field label="월 지출 (대략)">
              <NumberInput value={s.monthlySpending} onChange={(v) => patch({ monthlySpending: v })} suffix="만원" />
            </Field>
            <Field label="비상금" hint="몇 개월치">
              <NumberInput value={s.emergencyMonths} onChange={(v) => patch({ emergencyMonths: v })} suffix="개월" />
            </Field>
          </div>
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            → 월 저축·투자 가능액 약 <b>{formatKRW(Math.max(0, m.monthlySavable))}</b> · 저축률{" "}
            <b>{formatPct(Math.max(0, m.savingsRatePct))}</b>
          </div>
        </Card>
      </div>

      {/* ── 결과 ── */}
      {showResult && (
        <div className="space-y-5">
          <Card className="bg-brand-50/60">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-3xl font-extrabold text-brand-700">
                  {result.stage} / 8 단계
                </div>
                <div className="mt-1 text-sm font-medium text-brand-600">
                  {STAGE_NAMES[result.stage]}
                </div>
                <div className="mt-1 text-xs text-ink-400">
                  1~2단계는 누구나 거치는 정상 출발점이에요.
                </div>
              </div>
              <StageDots stage={result.stage} />
            </div>
          </Card>

          <div>
            <SectionTitle>재무 스냅샷</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="순자산" value={formatKRW(m.netWorth)} />
              <StatCard label="저축률" value={formatPct(Math.max(0, m.savingsRatePct))} />
              <StatCard
                label="소득구조 (근로:자본)"
                value={`${Math.round(m.laborSharePct)}:${Math.round(m.capitalSharePct)}`}
              />
              <StatCard label="passive / 생활비" value={formatPct(m.passiveToSpendingPct)} />
            </div>
          </div>

          <Card className="border-amber-200 bg-amber-50">
            <div className="text-sm font-bold text-amber-800">다음 한 걸음 (원씽)</div>
            <p className="mt-1 text-sm text-amber-700">{result.nextStep}</p>
          </Card>

          {vision && vision.goalNetworth > 0 && (
            <Card>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-500">
                  목표 대비 (목표 {formatKRW(vision.goalNetworth)})
                </span>
                <span className="font-semibold text-ink-700">
                  달성률 {formatPct((m.netWorth / vision.goalNetworth) * 100, 1)}
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink-200">
                <div
                  className="h-full rounded-full bg-brand-600"
                  style={{
                    width: `${Math.min(100, Math.max(1, (m.netWorth / vision.goalNetworth) * 100))}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-ink-400">자세한 예상 시점은 자산 설계에서 확인해요.</p>
            </Card>
          )}

          <AssumptionNote>
            단계는 비상금·저축률·투자 시작 등 신호로 판정해요. 기준값은 예시·가정입니다.
          </AssumptionNote>
        </div>
      )}
    </div>
  );
}

function StageDots({ stage }: { stage: number }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: 8 }, (_, i) => (
        <span
          key={i}
          className={`h-2.5 w-2.5 rounded-full ${
            i < stage ? "bg-brand-600" : "bg-brand-200"
          }`}
        />
      ))}
    </div>
  );
}
