"use client";

import { useState } from "react";
import Link from "next/link";
import { budgetPace } from "@/lib/spending/calc";
import { formatWon } from "@/lib/spending/format";
import { Button, NumberInput } from "@/components/ui";
import { track } from "@/lib/analytics";
import { clsx } from "@/lib/clsx";

/** 변동지출 탭 상단 — n월 현재까지 실적 vs 예산 */
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
    <section className="overflow-hidden rounded-2xl border border-brand-800/10 bg-brand-900 text-white">
      <div className="p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs text-white/50">
              {monthLabel} 변동지출 · {isCurrentMonth ? "현재까지" : "합계"}
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-2">
              <span className="tnum text-3xl font-extrabold tracking-tight text-gold-400">
                {formatWon(spentWon)}
              </span>
              <span className="tnum text-lg text-white/50">/ {formatWon(budgetWon)}</span>
            </div>
            <p className="mt-1 text-xs text-white/45">예산 대비 {pace.usedPct.toFixed(0)}% 사용</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setDraftMan(budgetWon / 10_000);
              setEditing((v) => !v);
            }}
            className="rounded-lg border border-white/15 px-2.5 py-1 text-xs text-white/70 hover:bg-white/5"
          >
            예산 수정
          </button>
        </div>

        {editing && (
          <div className="mt-3 flex flex-wrap items-end gap-2 rounded-xl bg-white/5 p-3">
            <div className="w-36">
              <NumberInput value={draftMan} onChange={setDraftMan} />
            </div>
            <span className="pb-2 text-xs text-white/50">만원</span>
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

        <div className="mt-5">
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={clsx(
                "h-full rounded-full transition-all",
                pace.usedPct > 100 ? "bg-red-400" : "bg-gold-400",
              )}
              style={{ width: `${Math.min(100, pace.usedPct)}%` }}
            />
          </div>
          <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-white/55">
            <span>
              {pace.daysLeft}일 남음 · 하루 약 {formatWon(Math.max(0, pace.dailyRoomWon))} 여유
            </span>
            <span className="tnum">남은 {formatWon(Math.max(0, pace.remainingWon))}</span>
          </div>
          <p className={clsx("mt-2 text-sm", pace.overPace ? "text-amber-200" : "text-white/70")}>
            {pace.overPace
              ? `이 페이스면 월말 예산 약 ${pace.projectedPct.toFixed(0)}% 소진 예상이에요.`
              : `이 페이스면 월말 약 ${formatWon(pace.projectedWon)}.`}
          </p>
          {pace.overPace && (
            <Link
              href="/engine"
              onClick={() =>
                track("budget_overpace_engine_link", {
                  used_pct: Math.round(pace.usedPct),
                  projected_pct: Math.round(pace.projectedPct),
                })
              }
              className="mt-3 inline-flex items-center gap-1 rounded-lg border border-amber-200/40 bg-amber-400/15 px-2.5 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-400/25"
            >
              지출 배분(자산 설계)을 줄여볼까요? →
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
