"use client";

import { useState } from "react";
import {
  GROUP_PRESETS,
  ITEM_PRESETS,
  bucketFromPreset,
  customBucket,
  type BucketPreset,
} from "@/lib/catalog";
import {
  CATEGORY_META,
  INCOME_SOURCE_META,
  type Bucket,
  type BucketCategory,
  type IncomeSource,
  type IncomeSourceType,
} from "@/lib/types";
import { childrenOf, roots } from "@/lib/engine/tree";
import {
  createIncomeSource,
  INCOME_PALETTE_PRESETS,
  INCOME_TYPE_ORDER,
} from "@/lib/income";
import { Field, TextInput } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { parseNum } from "@/lib/format";

const CAT_ORDER: BucketCategory[] = ["invest", "save", "spend"];
/** 흰 카드 + 왼쪽 액센트만으로 구별 (파스텔 면 채우기 X) */
const CAT_ACCENT: Record<BucketCategory, string> = {
  invest: "border-l-invest-500 text-invest-700",
  save: "border-l-save-500 text-save-700",
  spend: "border-l-spend-500 text-spend-700",
};
const CAT_ROW =
  "border border-ink-200 border-l-[3px] bg-white hover:bg-ink-50";
const CAT_TEXT: Record<BucketCategory, string> = {
  invest: "text-invest-700",
  save: "text-save-700",
  spend: "text-spend-700",
};

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

/** 수입원 추가 폼 — 금액 입력 후 확정 */
function IncomeAddForm({
  type,
  defaultName,
  nextPosition,
  onConfirm,
  onCancel,
}: {
  type: IncomeSourceType;
  defaultName: string;
  nextPosition: number;
  onConfirm: (s: IncomeSource) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(defaultName);
  const [monthlyStr, setMonthlyStr] = useState("");

  const monthly = monthlyStr.trim() === "" ? null : parseNum(monthlyStr);
  const canAdd = monthly !== null && Number.isFinite(monthly) && name.trim().length > 0;

  return (
    <div className="mt-1.5 space-y-2 rounded-xl border border-brand-200 bg-brand-50/60 p-2.5">
      <Field label="이름">
        <TextInput value={name} onChange={setName} placeholder={defaultName} />
      </Field>
      <Field label="월 금액" hint="만원 · 필수 입력">
        <div className="flex items-center rounded-lg border border-ink-300 bg-white focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">
          <input
            inputMode="numeric"
            autoFocus
            className="w-full rounded-lg bg-transparent px-3 py-2 text-sm outline-none"
            value={monthlyStr}
            placeholder="예: 300"
            onChange={(e) => setMonthlyStr(e.target.value.replace(/[^0-9.]/g, ""))}
          />
          <span className="pr-3 text-sm text-ink-400">만원</span>
        </div>
      </Field>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-ink-200 py-1.5 text-xs font-semibold text-ink-600 hover:bg-white"
        >
          취소
        </button>
        <button
          type="button"
          disabled={!canAdd}
          onClick={() => {
            if (!canAdd || monthly === null) return;
            onConfirm(createIncomeSource(type, nextPosition, monthly, name.trim()));
          }}
          className="flex-1 rounded-lg bg-brand-800 py-1.5 text-xs font-semibold text-white disabled:bg-ink-300"
        >
          추가
        </button>
      </div>
    </div>
  );
}

export function Palette({
  buckets,
  selectedId,
  incomeCount,
  onAdd,
  onAddIncome,
}: {
  buckets: Bucket[];
  selectedId: string | null;
  incomeCount: number;
  onAdd: (b: Bucket) => void;
  onAddIncome: (s: IncomeSource) => void;
}) {
  const [customName, setCustomName] = useState("");
  const [customCat, setCustomCat] = useState<BucketCategory>("invest");
  /** 수입원: 프리셋 선택 시 금액 폼 / custom = 자율 */
  const [incomeDraft, setIncomeDraft] = useState<IncomeSourceType | "custom" | null>(null);
  const [customIncomeName, setCustomIncomeName] = useState("");
  const [customIncomeType, setCustomIncomeType] = useState<IncomeSourceType>("capital");
  const [customIncomeMonthly, setCustomIncomeMonthly] = useState("");

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
        눌러서 추가 · 수입원은 금액 입력 후 확정 · 세부 항목은{" "}
        <span className="font-semibold text-ink-600">{contextLabel}</span>
      </p>

      {/* 0. 수입원 */}
      <div>
        <div className="mb-1.5 text-xs font-bold text-brand-600">0. 수입원 (월수입 왼쪽)</div>
        <p className="mb-1.5 text-[10px] text-ink-400">유형을 고르거나 직접 이름을 지어 추가</p>
        <div className="space-y-1.5">
          {INCOME_PALETTE_PRESETS.map((type) => (
            <div key={type}>
              <button
                type="button"
                onClick={() => setIncomeDraft(incomeDraft === type ? null : type)}
                className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-colors ${
                  incomeDraft === type
                    ? "border-brand-400 bg-brand-50 text-brand-800"
                    : "border-brand-100 bg-white text-ink-700 hover:bg-brand-50/50"
                }`}
              >
                <Icon name="coins" size={18} className="shrink-0 text-brand-500" />
                <span className="min-w-0">
                  <span className="block">{INCOME_SOURCE_META[type].label}</span>
                  <span className="block text-[10px] font-normal opacity-70">
                    {INCOME_SOURCE_META[type].hint}
                  </span>
                </span>
              </button>
              {incomeDraft === type && (
                <IncomeAddForm
                  type={type}
                  defaultName={INCOME_SOURCE_META[type].label}
                  nextPosition={incomeCount}
                  onConfirm={(s) => {
                    onAddIncome(s);
                    setIncomeDraft(null);
                  }}
                  onCancel={() => setIncomeDraft(null)}
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-2 rounded-xl border border-dashed border-brand-200 p-2">
          <button
            type="button"
            onClick={() => setIncomeDraft(incomeDraft === "custom" ? null : "custom")}
            className="mb-1 w-full text-left text-xs font-bold text-brand-600"
          >
            직접 만들기 {incomeDraft === "custom" ? "· 접기" : ""}
          </button>
          {incomeDraft === "custom" && (
            <div className="space-y-2">
              <Field label="이름">
                <TextInput
                  value={customIncomeName}
                  onChange={setCustomIncomeName}
                  placeholder="예: 배당 · 알바 · 프리랜서"
                />
              </Field>
              <div className="flex flex-wrap gap-1">
                {INCOME_TYPE_ORDER.filter((t) => t !== "labor").map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setCustomIncomeType(t)}
                    className={`rounded-lg border px-2 py-1 text-[10px] font-semibold ${
                      customIncomeType === t
                        ? "border-brand-400 bg-brand-50 text-brand-700"
                        : "border-ink-200 text-ink-500"
                    }`}
                  >
                    {INCOME_SOURCE_META[t].label}
                  </button>
                ))}
              </div>
              <Field label="월 금액" hint="만원 · 필수 입력">
                <div className="flex items-center rounded-lg border border-ink-300 bg-white focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">
                  <input
                    inputMode="numeric"
                    className="w-full rounded-lg bg-transparent px-3 py-2 text-sm outline-none"
                    value={customIncomeMonthly}
                    placeholder="예: 50"
                    onChange={(e) => setCustomIncomeMonthly(e.target.value.replace(/[^0-9.]/g, ""))}
                  />
                  <span className="pr-3 text-sm text-ink-400">만원</span>
                </div>
              </Field>
              <button
                type="button"
                disabled={
                  !customIncomeName.trim() ||
                  customIncomeMonthly.trim() === "" ||
                  !Number.isFinite(parseNum(customIncomeMonthly))
                }
                onClick={() => {
                  const monthly = parseNum(customIncomeMonthly);
                  if (!customIncomeName.trim() || customIncomeMonthly.trim() === "") return;
                  onAddIncome(
                    createIncomeSource(
                      customIncomeType,
                      incomeCount,
                      monthly,
                      customIncomeName.trim(),
                    ),
                  );
                  setCustomIncomeName("");
                  setCustomIncomeMonthly("");
                  setIncomeDraft(null);
                }}
                className="w-full rounded-lg bg-brand-800 py-1.5 text-xs font-semibold text-white disabled:bg-ink-300"
              >
                수입원 추가
              </button>
            </div>
          )}
        </div>
      </div>

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
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors ${CAT_ROW} ${CAT_ACCENT[p.category]}`}
            >
              <Icon name={p.icon} size={18} className={`shrink-0 ${CAT_TEXT[p.category]}`} />
              <span className="min-w-0 text-ink-700">
                <span className="block">{p.name}</span>
                <span className="block text-[10px] font-normal text-ink-400">{p.desc}</span>
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
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-ink-700 transition-colors ${CAT_ROW} ${CAT_ACCENT[cat]}`}
                >
                  <Icon name={p.icon} size={18} className={`shrink-0 ${CAT_TEXT[cat]}`} />
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-dashed border-ink-300 p-2">
        <div className="mb-1.5 text-xs font-bold text-ink-500">배분 항목 직접 만들기</div>
        <TextInput value={customName} onChange={setCustomName} placeholder="이름 (예: 코인)" />
        <div className="mt-2 flex gap-1">
          {CAT_ORDER.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCustomCat(c)}
              className={`flex-1 rounded-lg border px-2 py-1 text-xs ${
                customCat === c
                  ? `${CAT_ROW} ${CAT_ACCENT[c]} font-bold`
                  : "border-ink-200 text-ink-500"
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
            onAdd(
              customBucket(
                customCat,
                customName.trim(),
                childrenOf(parentId, buckets).length,
                parentId,
              ),
            );
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
