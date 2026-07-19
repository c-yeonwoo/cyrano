"use client";

import { useState } from "react";
import { budgetPace } from "@/lib/spending/calc";
import { formatWon } from "@/lib/spending/format";
import { Button, Card, NumberInput } from "@/components/ui";
import { clsx } from "@/lib/clsx";

/** 변동지출 탭 — 예산·페이스 (요약 히어로보다 차분한 카드) */
export function BudgetHero({
  year,
  monthIndex,
  spentWon,
  budgetWon,
  onSaveBudget,
}: {
  year: number;
  monthIndex: number;
  spentWon: number;
  budgetWon: number;
  onSaveBudget: (won: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draftMan, setDraftMan] = useState(budgetWon / 10_000);
  const pace = budgetPace({ spentWon, budgetWon, year, monthIndex });
  const monthLabel = `${monthIndex + 1}월`;
  const isCurrentMonth =
    new Date().getFullYear() === year && new Date().getMonth() === monthIndex;

  return (
    <Card className="!p-5 md:!p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold tracking-wide text-ink-400">
            {monthLabel} 변동 · {isCurrentMonth ? "현재까지" : "합계"} / 예산
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-2">
            <span className="tnum text-2xl font-extrabold tracking-tight text-ink-900">
              {formatWon(spentWon)}
            </span>
            <span className="tnum text-base text-ink-400">/ {formatWon(budgetWon)}</span>
          </div>
          <p className="mt-1 text-xs text-ink-500">
            예산의 {pace.usedPct.toFixed(0)}% 썼어요
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setDraftMan(budgetWon / 10_000);
            setEditing((v) => !v);
          }}
          className="rounded-lg border border-ink-200 px-2.5 py-1 text-xs font-medium text-ink-600 hover:bg-ink-50"
        >
          예산 수정
        </button>
      </div>

      {editing && (
        <div className="mt-3 flex flex-wrap items-end gap-2 rounded-xl bg-ink-50 p-3">
          <div className="w-36">
            <NumberInput value={draftMan} onChange={setDraftMan} />
          </div>
          <span className="pb-2 text-xs text-ink-400">만원</span>
          <Button
            onClick={() => {
              onSaveBudget(Math.round(draftMan * 10_000));
              setEditing(false);
            }}
          >
            저장
          </Button>
        </div>
      )}

      <div className="mt-4">
        <div className="h-1.5 overflow-hidden rounded-full bg-ink-100">
          <div
            className={clsx(
              "h-full rounded-full transition-all",
              pace.usedPct > 100 ? "bg-amber-500" : "bg-gold-400",
            )}
            style={{ width: `${Math.min(100, pace.usedPct)}%` }}
          />
        </div>
        <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-ink-400">
          <span>
            {pace.daysLeft}일 남음 · 하루 약 {formatWon(Math.max(0, pace.dailyRoomWon))}
          </span>
          <span className="tnum">남은 {formatWon(Math.max(0, pace.remainingWon))}</span>
        </div>
        <p
          className={clsx(
            "mt-2 text-sm",
            pace.overPace ? "text-amber-800" : "text-ink-500",
          )}
        >
          {pace.overPace
            ? `이 속도면 월말에 예산을 넘길 수 있어요. 쓰기를 줄이거나 예산을 올려 보세요.`
            : `이 속도면 월말 약 ${formatWon(pace.projectedWon)} 예상.`}
        </p>
      </div>
    </Card>
  );
}
