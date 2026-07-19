"use client";

import { useState } from "react";
import {
  GROUP_PRESETS,
  ITEM_PRESETS,
  bucketFromPreset,
  customBucket,
  type BucketPreset,
} from "@/lib/catalog";
import { CATEGORY_META, type Bucket, type BucketCategory } from "@/lib/types";
import { childrenOf, roots } from "@/lib/engine/tree";
import { TextInput } from "@/components/ui";
import { Icon } from "@/components/Icon";

const CAT_ORDER: BucketCategory[] = ["invest", "save", "spend"];
const CAT_TEXT: Record<BucketCategory, string> = {
  invest: "text-amber-700",
  save: "text-emerald-700",
  spend: "text-sky-700",
};
const CAT_CARD: Record<BucketCategory, string> = {
  invest: "border-amber-200 bg-amber-50 hover:bg-amber-100",
  save: "border-emerald-200 bg-emerald-50 hover:bg-emerald-100",
  spend: "border-sky-200 bg-sky-50 hover:bg-sky-100",
};

/**
 * 팔레트 UX
 * 1) 묶음(그룹) → 수입 바로 아래 루트로 추가
 * 2) 세부 항목 → 선택 중인 노드 아래, 없으면 같은 카테고리 루트 아래, 그것도 없으면 루트로
 * 클릭만으로 캔버스에 올라감 (드래그도 가능)
 */
export function resolveAddParent(
  preset: BucketPreset,
  buckets: Bucket[],
  selectedId: string | null,
): string | null {
  if (preset.kind === "group") return null;
  if (selectedId && buckets.some((b) => b.id === selectedId)) return selectedId;
  const root = roots(buckets).find((r) => r.category === preset.category);
  return root?.id ?? null;
}

export function Palette({
  buckets,
  selectedId,
  onAdd,
}: {
  buckets: Bucket[];
  selectedId: string | null;
  onAdd: (b: Bucket) => void;
}) {
  const [customName, setCustomName] = useState("");
  const [customCat, setCustomCat] = useState<BucketCategory>("invest");

  const selected = selectedId ? buckets.find((b) => b.id === selectedId) : null;
  const contextLabel = selected
    ? `"${selected.name}" 아래`
    : "같은 종류의 묶음 아래 (없으면 수입 바로 아래)";

  const addPreset = (p: BucketPreset) => {
    const parentId = resolveAddParent(p, buckets, selectedId);
    const pos = childrenOf(parentId, buckets).length;
    onAdd(bucketFromPreset(p, pos, parentId));
  };

  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed text-ink-400">
        눌러서 캔버스에 추가 · 세부 항목은{" "}
        <span className="font-semibold text-ink-600">{contextLabel}</span>
      </p>

      <div>
        <div className="mb-1.5 text-xs font-bold text-ink-500">1. 묶음 (수입 바로 아래)</div>
        <div className="space-y-1.5">
          {GROUP_PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              draggable
              onDragStart={(e) => e.dataTransfer.setData("application/bucket-preset", p.key)}
              onClick={() => addPreset(p)}
              className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-semibold text-ink-700 transition-colors ${CAT_CARD[p.category]}`}
            >
              <Icon name={p.icon} size={18} className="shrink-0" />
              <span className="min-w-0">
                <span className="block">{p.name}</span>
                <span className="block text-[10px] font-normal opacity-70">{p.desc}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1.5 text-xs font-bold text-ink-500">2. 세부 항목</div>
        {CAT_ORDER.map((cat) => (
          <div key={cat} className="mb-2.5">
            <div className={`mb-1 text-[11px] font-bold ${CAT_TEXT[cat]}`}>
              {CATEGORY_META[cat].label}
            </div>
            <div className="space-y-1.5">
              {ITEM_PRESETS.filter((p) => p.category === cat).map((p) => (
                <button
                  key={p.key}
                  type="button"
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("application/bucket-preset", p.key)}
                  onClick={() => addPreset(p)}
                  className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-semibold text-ink-700 transition-colors ${CAT_CARD[cat]}`}
                >
                  <Icon name={p.icon} size={18} className="shrink-0" />
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-dashed border-ink-300 p-2">
        <div className="mb-1.5 text-xs font-bold text-ink-500">직접 만들기</div>
        <TextInput value={customName} onChange={setCustomName} placeholder="이름 (예: 코인)" />
        <div className="mt-2 flex gap-1">
          {CAT_ORDER.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCustomCat(c)}
              className={`flex-1 rounded-lg border px-2 py-1 text-xs ${
                customCat === c ? CAT_CARD[c] + " font-bold" : "border-ink-200 text-ink-500"
              }`}
            >
              {CATEGORY_META[c].label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            if (!customName.trim()) return;
            const parentId = resolveAddParent(
              {
                key: "custom",
                category: customCat,
                name: customName,
                icon: "plus",
                kind: "item",
                defaultReturnPct: 0,
                defaultRealizedPct: 0,
                desc: "",
              },
              buckets,
              selectedId,
            );
            onAdd(customBucket(customCat, customName.trim(), childrenOf(parentId, buckets).length, parentId));
            setCustomName("");
          }}
          className="mt-2 w-full rounded-lg bg-ink-800 py-1.5 text-xs font-semibold text-white disabled:bg-ink-300"
          disabled={!customName.trim()}
        >
          추가
        </button>
      </div>
    </div>
  );
}
