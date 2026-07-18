"use client";

import type { Bucket } from "@/lib/types";
import { formatKRW } from "@/lib/format";
import { Icon } from "@/components/Icon";

/**
 * 엔진 흐름 스키매틱 (플로우 12번 요약):
 * 멀티 수입 → income 합류 → 비율 배분 → 버킷 → 자산 풀 ↺ 하이브리드 재투입.
 * 카테고리 배분 비율을 실시간 반영한다.
 */
export function EngineFlow({
  buckets,
  monthlyIncome,
}: {
  buckets: Bucket[];
  monthlyIncome: number;
}) {
  const sumBy = (cat: Bucket["category"]) =>
    buckets.filter((b) => b.category === cat).reduce((s, b) => s + b.ratioPct, 0);
  const invest = sumBy("invest");
  const save = sumBy("save");
  const spend = sumBy("spend");

  return (
    <div className="rounded-2xl border border-ink-200 bg-ink-50/60 p-4">
      <div className="mb-3 flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-brand-600">
        <Icon name="loop" size={14} />
        실현 자본소득(배당·임대·이자)은 다시 수입으로 재유입됩니다 (하이브리드 복리)
      </div>
      <div className="flex items-stretch gap-2 text-center text-xs">
        <FlowNode title="멀티 수입" sub={`월 ${formatKRW(monthlyIncome)}`} tone="pink" />
        <Arrow />
        <FlowNode title="비율 배분" sub="내 포트폴리오" tone="brand" />
        <Arrow />
        <div className="flex flex-1 flex-col gap-1">
          <FlowChip label="투자" pct={invest} tone="amber" />
          <FlowChip label="저축" pct={save} tone="emerald" />
          <FlowChip label="지출 (out)" pct={spend} tone="sky" />
        </div>
        <Arrow />
        <FlowNode title="자산 풀" sub="복리 누적" tone="brand" />
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <div className="flex items-center text-ink-300">
      <Icon name="chevron-right" size={16} />
    </div>
  );
}

const TONES: Record<string, string> = {
  pink: "border-pink-200 bg-pink-50 text-pink-700",
  brand: "border-brand-200 bg-brand-50 text-brand-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  sky: "border-sky-200 bg-sky-50 text-sky-700",
};

function FlowNode({ title, sub, tone }: { title: string; sub: string; tone: string }) {
  return (
    <div className={`flex flex-col justify-center rounded-xl border px-3 py-2 ${TONES[tone]}`}>
      <div className="font-bold">{title}</div>
      <div className="text-[10px] opacity-80">{sub}</div>
    </div>
  );
}

function FlowChip({ label, pct, tone }: { label: string; pct: number; tone: string }) {
  return (
    <div className={`flex items-center justify-between rounded-lg border px-2 py-1 ${TONES[tone]}`}>
      <span>{label}</span>
      <span className="font-bold">{Math.round(pct)}%</span>
    </div>
  );
}
