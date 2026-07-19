"use client";

import { useState } from "react";
import type { Bucket } from "@/lib/types";
import { presetByKey, bucketFromPreset } from "@/lib/catalog";
import {
  childrenOf,
  isLeaf,
  monthlyManwon,
  ratioOfTotal,
  roots,
} from "@/lib/engine/tree";
import { Button, EmptyState } from "@/components/ui";
import { Icon } from "@/components/Icon";

const CAT_NODE: Record<string, string> = {
  invest: "border-invest-500/40 bg-invest-50 text-invest-700",
  save: "border-save-500/40 bg-save-50 text-save-700",
  spend: "border-spend-500/40 bg-spend-50 text-spend-700",
};

function confirmDelete(name: string, hasKids: boolean): boolean {
  const msg = hasKids
    ? `"${name}"과 하위 항목을 모두 삭제할까요?`
    : `"${name}" 항목을 삭제할까요?`;
  return window.confirm(msg);
}

function NodeCard({
  bucket,
  all,
  monthlyIncome,
  selectedId,
  onSelect,
  onDelete,
  depth,
}: {
  bucket: Bucket;
  all: Bucket[];
  monthlyIncome: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  depth: number;
}) {
  const kids = childrenOf(bucket.id, all);
  const leaf = isLeaf(bucket, all);
  const ofTotal = ratioOfTotal(bucket, all);
  const month = monthlyManwon(bucket, all, monthlyIncome);
  const selected = bucket.id === selectedId;
  const parentLabel = bucket.parentId ? "상위 대비" : "수입 대비";

  return (
    <div className={depth > 0 ? "ml-3 border-l border-ink-200 pl-3" : ""}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(bucket.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(bucket.id);
          }
        }}
        className={`group mb-2 flex w-full cursor-pointer items-start gap-2 rounded-xl border px-3 py-2.5 text-left transition-shadow ${CAT_NODE[bucket.category]} ${
          selected ? "ring-2 ring-brand-500 shadow-sm" : "hover:shadow-sm"
        }`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-sm font-bold">
            {bucket.isLocked && <Icon name="lock" size={12} className="text-locked" />}
            <span className="truncate">{bucket.name}</span>
            {!leaf && (
              <span className="ml-1 rounded bg-white/70 px-1.5 py-0.5 text-[10px] font-semibold text-ink-500">
                묶음
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] opacity-80">
            <span className="tnum font-semibold">
              {parentLabel} {bucket.ratioPct}%
            </span>
            <span className="tnum">전체 {ofTotal.toFixed(1).replace(/\.0$/, "")}%</span>
            <span className="tnum font-semibold">월 {month}만</span>
          </div>
          {leaf && bucket.category !== "spend" && (
            <div className="mt-0.5 text-[10px] opacity-60">연 {bucket.expectedAnnualReturnPct}% 가정</div>
          )}
        </div>
        <button
          type="button"
          aria-label={`${bucket.name} 삭제`}
          onClick={(e) => {
            e.stopPropagation();
            if (!confirmDelete(bucket.name, kids.length > 0)) return;
            onDelete(bucket.id);
          }}
          className="shrink-0 rounded-lg p-1.5 text-ink-400 opacity-70 hover:bg-white/80 hover:text-red-500 group-hover:opacity-100"
        >
          <Icon name="x" size={14} />
        </button>
      </div>
      {kids.map((k) => (
        <NodeCard
          key={k.id}
          bucket={k}
          all={all}
          monthlyIncome={monthlyIncome}
          selectedId={selectedId}
          onSelect={onSelect}
          onDelete={onDelete}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

export function EngineCanvas({
  buckets,
  monthlyIncome,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
  onRecommend,
}: {
  buckets: Bucket[];
  monthlyIncome: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: (b: Bucket) => void;
  onDelete: (id: string) => void;
  onRecommend: () => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const top = roots(buckets);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const key = e.dataTransfer.getData("application/bucket-preset");
    const preset = presetByKey(key);
    if (!preset) return;
    const parentId =
      preset.kind === "group"
        ? null
        : selectedId && buckets.some((b) => b.id === selectedId)
          ? selectedId
          : (top.find((r) => r.category === preset.category)?.id ?? null);
    const siblings = childrenOf(parentId, buckets);
    onAdd(bucketFromPreset(preset, siblings.length, parentId));
  };

  if (buckets.length === 0) {
    return (
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex min-h-[420px] items-center justify-center rounded-xl border bg-white ${
          dragOver ? "border-2 border-dashed border-brand-400 bg-brand-50/40" : "border-ink-200"
        }`}
      >
        <EmptyState
          icon="layers"
          title="왼쪽에서 항목을 눌러 추가하세요"
          desc="수입 → 묶음(투자·저축·지출) → 세부 항목 순으로 나눕니다. 비율만 정하면 월 금액이 자동으로 나옵니다."
          action={<Button onClick={onRecommend}>추천 배분으로 시작</Button>}
        />
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`rounded-xl border bg-white p-4 transition-colors ${
        dragOver ? "border-2 border-dashed border-brand-400 bg-brand-50/40" : "border-ink-200"
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-400">
        <span>항목을 누르면 수정 · ×로 삭제 · 왼쪽 항목은 선택 중인 묶음 아래에 추가</span>
        <span className="tnum font-semibold text-ink-600">월 수입 {monthlyIncome}만</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[140px_1fr_130px] lg:items-stretch">
        {/* 수입 */}
        <div className="flex flex-col justify-center rounded-xl border border-brand-200 bg-brand-50 px-3 py-4 text-center">
          <div className="text-[11px] font-semibold text-brand-600">월 수입</div>
          <div className="tnum mt-1 text-base font-extrabold text-brand-800">{monthlyIncome}만</div>
          <div className="mt-1 text-[10px] text-brand-400">근로·자본·부수입</div>
        </div>

        {/* 계층 배분 */}
        <div className="min-w-0">
          {top.map((r) => (
            <NodeCard
              key={r.id}
              bucket={r}
              all={buckets}
              monthlyIncome={monthlyIncome}
              selectedId={selectedId}
              onSelect={onSelect}
              onDelete={onDelete}
              depth={0}
            />
          ))}
        </div>

        {/* 모인 자산 */}
        <div className="flex flex-col items-center justify-center rounded-xl bg-brand-800 px-3 py-5 text-center text-white">
          <div className="text-sm font-bold">모인 자산</div>
          <div className="mt-1 text-[11px] opacity-80">투자·저축 누적</div>
          <div className="mt-2 text-[10px] leading-relaxed opacity-65">
            미실현 = 내부 복리
            <br />
            실현 = 수입으로 재유입
          </div>
        </div>
      </div>
    </div>
  );
}
