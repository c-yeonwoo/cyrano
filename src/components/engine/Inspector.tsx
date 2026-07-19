"use client";

import { CATEGORY_META, type Bucket } from "@/lib/types";
import {
  isLeaf,
  monthlyManwon,
  parentOf,
  ratioOfTotal,
  siblingRatioSum,
} from "@/lib/engine/tree";
import { Field, NumberInput, Button, Badge } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { clampPct } from "@/lib/format";
import { SpendRatioSuggestionInline } from "./SpendRatioSuggestion";
import { PushBudgetToVariableInline } from "./PushBudgetToVariable";

export function Inspector({
  bucket,
  all,
  monthlyIncome,
  onChange,
  onDelete,
  onDuplicate,
  onMoveSibling,
}: {
  bucket: Bucket;
  all: Bucket[];
  monthlyIncome: number;
  onChange: (patch: Partial<Bucket>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  /** 같은 레이어(형제) 순서 — SDUI 빌더식 */
  onMoveSibling?: (dir: -1 | 1) => void;
}) {
  const isInvest = bucket.category === "invest";
  const meta = CATEGORY_META[bucket.category];
  const parent = parentOf(bucket, all);
  const leaf = isLeaf(bucket, all);
  const ofTotal = ratioOfTotal(bucket, all);
  const month = monthlyManwon(bucket, all, monthlyIncome);
  const sibSum = siblingRatioSum(bucket.parentId, all);
  const ratioLabel = parent ? `"${parent.name}" 대비` : "월 수입 대비";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-ink-800">{bucket.name}</div>
        <Badge
          tone={bucket.category === "invest" ? "amber" : bucket.category === "save" ? "emerald" : "rose"}
        >
          {meta.label}
          {!leaf ? " · 묶음" : ""}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-xl border border-ink-100 bg-ink-50/80 px-3 py-2.5 text-xs">
        <div>
          <div className="text-ink-400">월 환산</div>
          <div className="tnum text-sm font-extrabold text-ink-800">{month}만</div>
        </div>
        <div>
          <div className="text-ink-400">전체 대비</div>
          <div className="tnum text-sm font-extrabold text-ink-800">
            {ofTotal.toFixed(1).replace(/\.0$/, "")}%
          </div>
        </div>
      </div>

      {bucket.category === "spend" && (
        <div className="space-y-2">
          <SpendRatioSuggestionInline />
          <PushBudgetToVariableInline />
        </div>
      )}

      <Field label={`${ratioLabel} 비율`}>
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
      <div
        className={`rounded-lg border px-2.5 py-1.5 text-center text-[11px] font-semibold ${
          Math.round(sibSum) === 100
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-amber-200 bg-amber-50 text-amber-700"
        }`}
      >
        형제 합 {Math.round(sibSum)}% {Math.round(sibSum) === 100 ? "" : "· 100%에 맞춰 주세요"}
      </div>

      {leaf && bucket.category !== "spend" && (
        <div className="space-y-1">
          <Field label="전체 수익률" hint="연 %">
            <NumberInput
              value={bucket.expectedAnnualReturnPct}
              onChange={(n) => onChange({ expectedAnnualReturnPct: n })}
              suffix="%"
            />
          </Field>
          <p className="text-[11px] leading-relaxed text-ink-400">
            {isInvest
              ? "시세 상승+배당·이자 등 이 자산이 1년에 얼마나 불지 가정"
              : "예금·적금 이자 등 연 수익률 가정"}
          </p>
        </div>
      )}

      {leaf && isInvest && (
        <div className="space-y-1">
          <Field label="현금으로 받는 비율" hint="연 % · 전체 이하">
            <NumberInput
              value={bucket.realizedYieldPct}
              onChange={(n) =>
                onChange({ realizedYieldPct: Math.min(n, bucket.expectedAnnualReturnPct) })
              }
              suffix="%"
            />
          </Field>
          <p className="text-[11px] leading-relaxed text-ink-400">
            배당·임대·이자처럼 현금으로 들어오는 몫. 나머지는 계좌 안 복리로 남아요
            {bucket.expectedAnnualReturnPct > 0 && (
              <>
                {" "}
                · 계좌 안 복리 약{" "}
                <span className="tnum font-semibold text-ink-500">
                  {Math.max(
                    0,
                    bucket.expectedAnnualReturnPct - bucket.realizedYieldPct,
                  ).toFixed(1)}
                  %
                </span>
              </>
            )}
          </p>
        </div>
      )}

      {leaf && isInvest && (
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

      {leaf && bucket.isLocked && (
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

      {onMoveSibling && (
        <div>
          <div className="mb-1.5 text-xs font-medium text-ink-500">같은 레이어 순서</div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onMoveSibling(-1)}>
              위로
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => onMoveSibling(1)}>
              아래로
            </Button>
          </div>
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
