"use client";

import { INCOME_SOURCE_META, type IncomeSource } from "@/lib/types";
import { incomeSourceLabel } from "@/lib/income";
import { Field, NumberInput, Button, TextInput } from "@/components/ui";
import { Icon } from "@/components/Icon";

export function IncomeHubInspector({
  monthlyIncome,
  onAddGroup,
}: {
  monthlyIncome: number;
  onAddGroup: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="text-sm font-bold text-ink-800">월수입</div>
      <div className="rounded-xl border border-brand-100 bg-brand-50 px-3 py-3 text-center">
        <div className="tnum text-xl font-extrabold text-brand-800">{monthlyIncome}만</div>
        <div className="mt-0.5 text-[11px] text-brand-500">이번 달 기준</div>
      </div>
      <Button className="w-full" onClick={onAddGroup}>
        <Icon name="plus" size={14} /> 묶음 추가
      </Button>
    </div>
  );
}

export function PoolHubInspector({
  cashflowMonthly = 0,
  cashflowLinked = false,
  onLinkCashflow,
}: {
  /** 자산→월수입 재유입 추정(만원/월) */
  cashflowMonthly?: number;
  /** 이미 수입원 노드로 연결됨 */
  cashflowLinked?: boolean;
  onLinkCashflow?: () => void;
}) {
  const amt = Math.round(cashflowMonthly);
  return (
    <div className="space-y-3">
      <div className="text-sm font-bold text-ink-800">자산</div>
      {amt > 0 ? (
        <div className="rounded-xl border border-gold-200 bg-gold-50 px-3 py-2 text-center">
          <div className="text-[11px] font-semibold text-gold-600">현금흐름(추정)</div>
          <div className="tnum text-lg font-extrabold text-ink-800">월 {amt}만</div>
        </div>
      ) : (
        <div className="rounded-xl border border-ink-100 bg-ink-50 px-3 py-2 text-center text-xs text-ink-400">
          실현 수익이 생기면 여기에 표시돼요
        </div>
      )}
      {onLinkCashflow && (
        <Button
          className="w-full"
          disabled={amt <= 0}
          onClick={onLinkCashflow}
        >
          <Icon name="plus" size={14} />
          {cashflowLinked ? "수입원 금액 갱신" : "수입원으로 연결"}
        </Button>
      )}
    </div>
  );
}

export function SourceInspector({
  source,
  onChange,
  onDelete,
  onMoveSibling,
}: {
  source: IncomeSource;
  onChange: (patch: Partial<IncomeSource>) => void;
  onDelete: () => void;
  onMoveSibling?: (dir: -1 | 1) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="text-sm font-bold text-ink-800">{incomeSourceLabel(source)}</div>
      <Field label="표시 이름">
        <TextInput
          value={source.name ?? ""}
          onChange={(v) => onChange({ name: v })}
          placeholder={INCOME_SOURCE_META[source.type].label}
        />
      </Field>
      <Field label="월 금액">
        <NumberInput
          value={source.monthly}
          onChange={(n) => onChange({ monthly: Math.max(0, n) })}
          suffix="만원"
        />
      </Field>
      {onMoveSibling && (
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onMoveSibling(-1)}>
            위로
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => onMoveSibling(1)}>
            아래로
          </Button>
        </div>
      )}
      <Button variant="danger" className="w-full" onClick={onDelete}>
        삭제
      </Button>
    </div>
  );
}
