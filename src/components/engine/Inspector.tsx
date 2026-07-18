"use client";

import { CATEGORY_META, type Bucket } from "@/lib/types";
import { Field, NumberInput, Button, Badge } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { clampPct } from "@/lib/format";

export function Inspector({
  bucket,
  onChange,
  onDelete,
  onDuplicate,
}: {
  bucket: Bucket;
  onChange: (patch: Partial<Bucket>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const isInvest = bucket.category === "invest";
  const meta = CATEGORY_META[bucket.category];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-ink-700">인스펙터 · {bucket.name}</div>
        <Badge
          tone={bucket.category === "invest" ? "amber" : bucket.category === "save" ? "emerald" : "sky"}
        >
          {meta.label}
        </Badge>
      </div>

      <Field label="배분 비율" hint={`${bucket.ratioPct}%`}>
        <input
          type="range"
          min={0}
          max={100}
          value={bucket.ratioPct}
          onChange={(e) => onChange({ ratioPct: clampPct(Number(e.target.value)) })}
          className="w-full"
        />
      </Field>
      <NumberInput
        value={bucket.ratioPct}
        onChange={(n) => onChange({ ratioPct: clampPct(n) })}
        suffix="%"
      />

      {bucket.category !== "spend" && (
        <Field label="기대 연 수익률 (가정)">
          <NumberInput
            value={bucket.expectedAnnualReturnPct}
            onChange={(n) => onChange({ expectedAnnualReturnPct: n })}
            suffix="%"
          />
        </Field>
      )}

      {isInvest && (
        <Field
          label="실현 수익률 (배당·임대·이자)"
          hint="전체 수익 중 현금으로 실현되는 몫"
        >
          <NumberInput
            value={bucket.realizedYieldPct}
            onChange={(n) =>
              onChange({ realizedYieldPct: Math.min(n, bucket.expectedAnnualReturnPct) })
            }
            suffix="%"
          />
        </Field>
      )}

      {isInvest && (
        <label className="flex items-center justify-between rounded-xl border border-ink-200 px-3 py-2 text-sm">
          <span className="flex items-center gap-1.5 text-ink-600">
            <Icon name="lock" size={15} /> 인출 제한 (연금·IRP)
          </span>
          <input
            type="checkbox"
            checked={bucket.isLocked}
            onChange={(e) =>
              onChange({
                isLocked: e.target.checked,
                lockUntilAge: e.target.checked ? bucket.lockUntilAge ?? 55 : undefined,
              })
            }
          />
        </label>
      )}

      {bucket.isLocked && (
        <Field label="인출 제한 나이">
          <NumberInput
            value={bucket.lockUntilAge ?? 55}
            onChange={(n) => onChange({ lockUntilAge: n })}
            suffix="세"
          />
        </Field>
      )}

      {bucket.linkedTool && (
        <div className="flex items-center justify-between text-xs text-ink-400">
          <span>연결 도구</span>
          <span>{bucket.linkedTool}</span>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button variant="outline" className="flex-1" onClick={onDuplicate}>
          복제
        </Button>
        <Button variant="danger" className="flex-1" onClick={onDelete}>
          삭제
        </Button>
      </div>
    </div>
  );
}
