"use client";

import { useState } from "react";
import { BUCKET_PRESETS, bucketFromPreset, customBucket, type BucketPreset } from "@/lib/catalog";
import { CATEGORY_META, type Bucket, type BucketCategory } from "@/lib/types";
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

export function Palette({
  onAdd,
  nextPosition,
}: {
  onAdd: (b: Bucket) => void;
  nextPosition: number;
}) {
  const [customName, setCustomName] = useState("");
  const [customCat, setCustomCat] = useState<BucketCategory>("invest");

  const addPreset = (p: BucketPreset) => onAdd(bucketFromPreset(p, nextPosition));

  return (
    <div className="space-y-4">
      <div className="text-sm font-bold text-ink-700">팔레트 · 버킷</div>
      <p className="text-xs text-ink-400">
        드래그해서 캔버스에 놓거나, 카드를 탭해서 추가하세요.
      </p>

      {CAT_ORDER.map((cat) => (
        <div key={cat}>
          <div className={`mb-1.5 text-xs font-bold ${CAT_TEXT[cat]}`}>
            {CATEGORY_META[cat].label} · {CATEGORY_META[cat].note}
          </div>
          <div className="space-y-1.5">
            {BUCKET_PRESETS.filter((p) => p.category === cat).map((p) => (
              <button
                key={p.key}
                draggable
                onDragStart={(e) =>
                  e.dataTransfer.setData("application/bucket-preset", p.key)
                }
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

      {/* 커스텀 버킷 */}
      <div className="rounded-xl border border-dashed border-ink-300 p-2">
        <div className="mb-1.5 text-xs font-bold text-ink-500">＋ 커스텀 버킷</div>
        <TextInput value={customName} onChange={setCustomName} placeholder="이름 (예: 코인)" />
        <div className="mt-2 flex gap-1">
          {CAT_ORDER.map((c) => (
            <button
              key={c}
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
          onClick={() => {
            if (!customName.trim()) return;
            onAdd(customBucket(customCat, customName.trim(), nextPosition));
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
