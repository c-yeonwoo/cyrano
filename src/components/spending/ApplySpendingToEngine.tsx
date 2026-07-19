"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useProfile, selectSpending } from "@/lib/store/useProfile";
import { DEFAULT_SNAPSHOT } from "@/lib/store/defaults";
import { monthSpendingBreakdown } from "@/lib/spending/bridge";
import { formatWon } from "@/lib/spending/format";
import { formatKRW } from "@/lib/format";
import { track } from "@/lib/analytics";
import { Button, Card } from "@/components/ui";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Icon } from "@/components/Icon";
import { clsx } from "@/lib/clsx";

type Source = "summary" | "diagnosis";

/**
 * Phase A — 지출 실측(당월 변동+고정 전체) → snapshot.monthlySpending 수동 반영.
 */
export function ApplySpendingToEngine({
  source,
  compact = false,
}: {
  source: Source;
  compact?: boolean;
}) {
  const profile = useProfile((s) => s.profile);
  const setSnapshot = useProfile((s) => s.setSnapshot);
  const spending = selectSpending(profile);
  const snapshot = profile.snapshot ?? DEFAULT_SNAPSHOT;

  const today = new Date();
  const year = today.getFullYear();
  const monthIndex = today.getMonth();

  const measured = useMemo(
    () => monthSpendingBreakdown(spending, year, monthIndex),
    [spending, year, monthIndex],
  );

  const current = snapshot.monthlySpending;
  const next = measured.manwon;
  const same = current === next;
  const empty = measured.totalWon === 0;

  const [open, setOpen] = useState(false);
  const [justApplied, setJustApplied] = useState(false);

  const apply = () => {
    setSnapshot({ ...snapshot, monthlySpending: next });
    track("spend_applied_to_engine", {
      source,
      from: current,
      to: next,
      variable_won: measured.variableWon,
      fixed_won: measured.fixedWon,
    });
    setOpen(false);
    setJustApplied(true);
  };

  const ctaLabel = source === "diagnosis" ? "지출 실측 가져오기" : "엔진에 반영";

  return (
    <>
      <Card
        className={clsx(
          compact ? "!p-3" : "!p-4",
          "border-brand-200/80 bg-brand-50/40",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-700">
              <Icon name="engine" size={14} />
              자산 설계 · 진단 연동
            </div>
            <p className="mt-1.5 text-sm text-ink-700">
              {monthIndex + 1}월 실측{" "}
              <span className="tnum font-extrabold text-ink-900">{formatKRW(next)}</span>
              <span className="text-ink-400">
                {" "}
                (변동 {formatWon(measured.variableWon)} + 고정 {formatWon(measured.fixedWon)}
                · 만원 버림)
              </span>
            </p>
            <p className="mt-1 text-xs text-ink-500">
              현재 진단 월 지출{" "}
              <span className="tnum font-semibold text-ink-700">{formatKRW(current)}</span>
              {same && !justApplied && (
                <span className="ml-1.5 text-sage-700">· 이미 같아요</span>
              )}
              {justApplied && (
                <span className="ml-1.5 text-sage-700">· 반영했어요</span>
              )}
            </p>
            {!compact && (
              <p className="mt-2 text-[11px] leading-relaxed text-ink-400">
                요약의 「오늘까지」와 달리, 엔진에는{" "}
                <strong className="font-semibold text-ink-500">이달 고정 전체</strong>를
                넣습니다. 자동으로 바꾸지 않아요.
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-stretch gap-1.5 sm:items-end">
            <span
              title={
                empty
                  ? "지출 기록이 없으면 반영할 값이 없어요"
                  : same
                    ? "이미 동일한 값이에요"
                    : undefined
              }
            >
              <Button onClick={() => setOpen(true)} disabled={empty || same}>
                {ctaLabel}
              </Button>
            </span>
            <div className="flex flex-col items-stretch gap-1 text-center sm:items-end">
              {source === "summary" && (
                <Link
                  href="/diagnosis"
                  className="text-[11px] font-medium text-brand-700 hover:underline"
                >
                  진단에서 확인 →
                </Link>
              )}
              {source === "diagnosis" && (
                <Link
                  href="/spending"
                  className="text-[11px] font-medium text-brand-700 hover:underline"
                >
                  지출 기록 →
                </Link>
              )}
              <Link
                href="/engine"
                className="text-[11px] font-medium text-spend-700 hover:underline"
              >
                배분 비율 제안 →
              </Link>
            </div>
          </div>
        </div>
      </Card>

      <ConfirmModal
        open={open}
        title="실측을 계획 입력에 넣을까요?"
        danger={false}
        confirmLabel="반영하기"
        cancelLabel="취소"
        onCancel={() => setOpen(false)}
        onConfirm={apply}
        message={
          <div className="space-y-2">
            <p>
              진단의 월 지출을{" "}
              <strong className="tnum text-ink-900">{formatKRW(current)}</strong>
              에서{" "}
              <strong className="tnum text-ink-900">{formatKRW(next)}</strong>
              으로 바꿉니다.
            </p>
            <ul className="list-inside list-disc text-xs text-ink-500">
              <li>
                {monthIndex + 1}월 변동 {formatWon(measured.variableWon)} + 고정{" "}
                {formatWon(measured.fixedWon)}
              </li>
              <li>원 → 만원은 버림 ({formatWon(measured.totalWon)} → {next}만)</li>
              <li>
                단계·저축률에 바로 쓰입니다. 배분 비율은 자산 설계의 「실측 기준 제안」에서
                따로 맞출 수 있어요.
              </li>
            </ul>
          </div>
        }
      />
    </>
  );
}
