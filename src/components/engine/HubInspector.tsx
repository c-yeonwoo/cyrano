"use client";

import {
  INCOME_SOURCE_META,
  type IncomeSource,
  type IncomeSourceType,
} from "@/lib/types";
import { incomeSourceLabel, INCOME_TYPE_ORDER } from "@/lib/income";
import { Field, NumberInput, Button, TextInput } from "@/components/ui";
import { Icon } from "@/components/Icon";

export function IncomeHubInspector({
  monthlyIncome,
  onAddGroup,
  onAddSource,
}: {
  monthlyIncome: number;
  onAddGroup: () => void;
  onAddSource: (type: IncomeSourceType) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm font-bold text-ink-800">월 수입</div>
        <p className="mt-1 text-xs text-ink-400">왼쪽 수입 항목 합산 → 오른쪽 배분으로 흘러갑니다.</p>
      </div>
      <div className="rounded-xl border border-brand-100 bg-brand-50 px-3 py-3 text-center">
        <div className="text-[11px] font-semibold text-brand-600">합산</div>
        <div className="tnum text-xl font-extrabold text-brand-800">{monthlyIncome}만</div>
      </div>
      <Button className="w-full" onClick={onAddGroup}>
        <Icon name="plus" size={14} /> 묶음 추가
      </Button>
      <div>
        <div className="mb-1.5 text-xs font-medium text-ink-500">수입 항목 추가 (왼쪽)</div>
        <div className="grid grid-cols-2 gap-1.5">
          {INCOME_TYPE_ORDER.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onAddSource(type)}
              className="rounded-lg border border-ink-200 px-2 py-1.5 text-left text-[11px] font-semibold text-ink-700 hover:bg-ink-50"
            >
              {INCOME_SOURCE_META[type].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PoolHubInspector() {
  return (
    <div className="space-y-3">
      <div>
        <div className="text-sm font-bold text-ink-800">투자·저축 합류</div>
        <p className="mt-1 text-xs leading-relaxed text-ink-400">
          최종 목적지가 아니라 <span className="font-semibold text-ink-600">중간 집계</span>
          입니다. 투자·저축 리프가 여기에 모이고, 실현 수익은 점선으로 월 수입에 다시 유입될 수
          있어요.
        </p>
      </div>
      <div className="rounded-xl border border-ink-100 bg-ink-50 px-3 py-2 text-xs text-ink-500">
        지출은 이 합류에 들어가지 않고, 아래 밴드로 빠져나갑니다.
      </div>
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
      <div>
        <div className="text-sm font-bold text-ink-800">{incomeSourceLabel(source)}</div>
        <p className="mt-0.5 text-xs text-ink-400">{INCOME_SOURCE_META[source.type].hint}</p>
      </div>
      <Field label="표시 이름">
        <TextInput
          value={source.name ?? ""}
          onChange={(v) => onChange({ name: v })}
          placeholder={INCOME_SOURCE_META[source.type].label}
        />
      </Field>
      <Field label="월 금액" hint="만원 · 합산되어 월 수입이 됩니다">
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
