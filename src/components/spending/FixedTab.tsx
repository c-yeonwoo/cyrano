"use client";

import { useMemo, useState } from "react";
import { useProfile, selectSpending } from "@/lib/store/useProfile";
import {
  FIXED_CATEGORIES,
  SPEND_CATEGORY_META,
  type SpendCategory,
} from "@/lib/spending/catalog";
import { isFixedPaidThisMonth, partitionFixedByBilling, sumFixed } from "@/lib/spending/calc";
import { formatWon, formatWonFull } from "@/lib/spending/format";
import { Button, Card, TextInput, NumberInput } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { clsx } from "@/lib/clsx";
import type { FixedExpense } from "@/lib/spending/types";

export function FixedTab() {
  const profile = useProfile((s) => s.profile);
  const addFixed = useProfile((s) => s.addFixedExpense);
  const updateFixed = useProfile((s) => s.updateFixedExpense);
  const removeFixed = useProfile((s) => s.removeFixedExpense);
  const spending = selectSpending(profile);
  const today = useMemo(() => new Date(), []);
  const parts = useMemo(
    () => partitionFixedByBilling(spending.fixed, today),
    [spending.fixed, today],
  );
  const total = sumFixed(spending.fixed);
  const incomeWon =
    (profile.snapshot?.incomeSources.reduce((s, i) => s + i.monthly, 0) ?? 0) * 10_000;
  const pct = incomeWon > 0 ? (total / incomeWon) * 100 : null;

  const [name, setName] = useState("");
  const [category, setCategory] = useState<SpendCategory>("housing");
  const [amountMan, setAmountMan] = useState(0);
  const [day, setDay] = useState(1);

  const add = () => {
    if (!name.trim() || amountMan <= 0) return;
    addFixed({
      name: name.trim(),
      category,
      amountWon: Math.round(amountMan * 10_000),
      billingDay: Math.min(28, Math.max(1, Math.round(day))),
    });
    setName("");
    setAmountMan(0);
  };

  const ordered = [...parts.paid, ...parts.upcoming];

  return (
    <div className="space-y-5">
      <Card className="!p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs font-semibold tracking-wide text-ink-400 uppercase">
              매달 자동 · 이미 정해진 것
            </div>
            <div className="tnum mt-1 text-2xl font-extrabold text-ink-900">
              {formatWon(total)}
              <span className="ml-2 text-sm font-medium text-ink-400">/월</span>
            </div>
            <p className="mt-2 text-xs text-ink-500">
              청구일 지남 {formatWon(parts.paidWon)}
              <span className="mx-1.5 text-ink-300">·</span>
              남음 {formatWon(parts.upcomingWon)}
              {pct != null ? (
                <span className="text-ink-400"> · 소득의 {pct.toFixed(0)}%</span>
              ) : null}
            </p>
          </div>
          <p className="max-w-xs text-xs leading-relaxed text-ink-400">
            오늘({today.getMonth() + 1}/{today.getDate()}) 기준 · 청구일이 지났으면 「지남」,
            아직이면 「남음」.
          </p>
        </div>
      </Card>

      <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink-100 bg-ink-50/80 text-xs text-ink-500">
            <tr>
              <th className="px-3 py-2.5 font-semibold">상태</th>
              <th className="px-3 py-2.5 font-semibold">이름</th>
              <th className="px-3 py-2.5 font-semibold">카테고리</th>
              <th className="px-3 py-2.5 font-semibold">금액</th>
              <th className="px-3 py-2.5 font-semibold">결제일</th>
              <th className="px-3 py-2.5 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {spending.fixed.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-ink-400">
                  등록된 고정지출이 없어요. 아래 행에서 추가하세요.
                </td>
              </tr>
            )}
            {ordered.map((f) => (
              <FixedRow
                key={f.id}
                f={f}
                paid={isFixedPaidThisMonth(f, today)}
                onUpdate={updateFixed}
                onRemove={removeFixed}
              />
            ))}
            {/* 추가 행 */}
            <tr className="bg-gold-50/30">
              <td className="px-3 py-2 text-xs text-ink-300">—</td>
              <td className="px-3 py-2">
                <TextInput value={name} onChange={setName} placeholder="예: 월세" />
              </td>
              <td className="px-3 py-2">
                <select
                  className="w-full rounded-lg border border-ink-200 bg-white px-2 py-2 text-sm"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as SpendCategory)}
                >
                  {FIXED_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {SPEND_CATEGORY_META[c].label}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-1">
                  <NumberInput value={amountMan} onChange={setAmountMan} />
                  <span className="text-xs text-ink-400">만</span>
                </div>
              </td>
              <td className="px-3 py-2">
                <NumberInput value={day} onChange={setDay} />
              </td>
              <td className="px-3 py-2 text-right">
                <Button onClick={add} disabled={!name.trim() || amountMan <= 0}>
                  <Icon name="plus" size={14} /> 추가
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink-400">
        금액은 만원 단위로 입력 · 표시는 {formatWonFull(total)} 형식. 결제 리마인더는 v2.
      </p>
    </div>
  );
}

function FixedRow({
  f,
  paid,
  onUpdate,
  onRemove,
}: {
  f: FixedExpense;
  paid: boolean;
  onUpdate: (id: string, patch: Partial<FixedExpense>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <tr
      className={clsx(
        "border-b border-ink-50 last:border-0",
        !paid && "bg-ink-50/40",
      )}
    >
      <td className="px-3 py-2">
        <span
          className={clsx(
            "inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold",
            paid
              ? "bg-sage-50 text-sage-700"
              : "bg-amber-50 text-amber-800",
          )}
        >
          {paid ? "지남" : "남음"}
        </span>
      </td>
      <td className="px-3 py-2">
        <input
          className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1.5 font-medium text-ink-800 hover:border-ink-200 focus:border-gold-400 focus:outline-none"
          value={f.name}
          onChange={(e) => onUpdate(f.id, { name: e.target.value })}
        />
      </td>
      <td className="px-3 py-2">
        <select
          className="rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-ink-700"
          value={f.category}
          onChange={(e) => onUpdate(f.id, { category: e.target.value as SpendCategory })}
        >
          {FIXED_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {SPEND_CATEGORY_META[c].label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          className="tnum w-28 rounded-lg border border-ink-200 px-2 py-1.5"
          value={Math.round(f.amountWon / 10_000)}
          onChange={(e) =>
            onUpdate(f.id, {
              amountWon: Math.max(0, Number(e.target.value) || 0) * 10_000,
            })
          }
        />
        <span className="ml-1 text-xs text-ink-400">만</span>
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          min={1}
          max={28}
          className="tnum w-16 rounded-lg border border-ink-200 px-2 py-1.5"
          value={f.billingDay}
          onChange={(e) =>
            onUpdate(f.id, {
              billingDay: Math.min(28, Math.max(1, Number(e.target.value) || 1)),
            })
          }
        />
        <span className="ml-1 text-xs text-ink-400">일</span>
      </td>
      <td className="px-3 py-2 text-right">
        <button
          type="button"
          aria-label="삭제"
          className="text-ink-300 hover:text-red-500"
          onClick={() => onRemove(f.id)}
        >
          <Icon name="trash" size={16} />
        </button>
      </td>
    </tr>
  );
}
