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

type Source = "summary" | "diagnosis";

/**
 * 지출 실측(당월 변동+고정) → snapshot.monthlySpending.
 * 수동 반영 + 자동동기 opt-in.
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
  const setAutoSync = useProfile((s) => s.setAutoSyncSpendToDiagnosis);
  const autoSync = profile.uiPrefs?.autoSyncSpendToDiagnosis ?? false;
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

  const toggleAuto = () => {
    const nextOn = !autoSync;
    setAutoSync(nextOn);
    track("spend_auto_sync_toggled", { on: nextOn, source });
    if (nextOn && !empty && !same) {
      setSnapshot({ ...snapshot, monthlySpending: next });
      track("spend_auto_synced", {
        to: next,
        variable_won: measured.variableWon,
        fixed_won: measured.fixedWon,
        reason: "toggle_on",
      });
      setJustApplied(true);
    }
  };

  const ctaLabel = source === "diagnosis" ? "지출 실측 가져오기" : "엔진에 반영";

  const autoToggle = (
    <label className="flex cursor-pointer items-center gap-2 text-[11px] text-ink-500">
      <input
        type="checkbox"
        checked={autoSync}
        onChange={toggleAuto}
        className="rounded border-ink-300 text-gold-500 focus:ring-gold-400"
      />
      <span>
        기록하면 진단 월지출에 <strong className="font-semibold text-ink-700">자동 반영</strong>
      </span>
    </label>
  );

  if (compact) {
    return (
      <>
        <div className="space-y-2 rounded-xl border border-ink-100 bg-ink-50/60 px-3 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-ink-500">
              지출 실측{" "}
              <span className="tnum font-semibold text-ink-800">{formatKRW(next)}</span>
              {autoSync ? (
                <span className="ml-1.5 text-sage-700">· 자동동기</span>
              ) : same || justApplied ? (
                <span className="ml-1.5 text-sage-700">· 반영됨</span>
              ) : current > 0 ? (
                <span className="ml-1.5 text-ink-400">· 현재 {formatKRW(current)}</span>
              ) : null}
            </p>
            {!autoSync && (
              <Button onClick={() => setOpen(true)} disabled={empty || same}>
                {ctaLabel}
              </Button>
            )}
          </div>
          {autoToggle}
        </div>
        <ConfirmModal
          open={open}
          title="실측을 월 지출에 넣을까요?"
          danger={false}
          confirmLabel="반영하기"
          cancelLabel="취소"
          onCancel={() => setOpen(false)}
          onConfirm={apply}
          message={
            <p>
              <strong className="tnum">{formatKRW(current)}</strong> →{" "}
              <strong className="tnum">{formatKRW(next)}</strong>
            </p>
          }
        />
      </>
    );
  }

  return (
    <>
      <Card className="!p-4 border-brand-200/80 bg-brand-50/40">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-700">
              <Icon name="engine" size={14} />
              진단 연동
            </div>
            <p className="mt-1.5 text-sm text-ink-700">
              {monthIndex + 1}월 실측{" "}
              <span className="tnum font-extrabold text-ink-900">{formatKRW(next)}</span>
            </p>
            <p className="mt-1 text-xs text-ink-500">
              현재 진단 {formatKRW(current)}
              {autoSync && <span className="ml-1.5 text-sage-700">· 자동동기 켜짐</span>}
              {!autoSync && same && !justApplied && (
                <span className="ml-1.5 text-sage-700">· 이미 같아요</span>
              )}
              {!autoSync && justApplied && (
                <span className="ml-1.5 text-sage-700">· 반영했어요</span>
              )}
            </p>
            <div className="mt-2.5">{autoToggle}</div>
          </div>
          <div className="flex shrink-0 flex-col items-stretch gap-1.5 sm:items-end">
            {!autoSync && (
              <Button onClick={() => setOpen(true)} disabled={empty || same}>
                {ctaLabel}
              </Button>
            )}
            <Link
              href="/engine"
              className="text-center text-[11px] font-medium text-spend-700 hover:underline"
            >
              배분 비율 →
            </Link>
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
                단계·저축률·홈 월지출에 바로 쓰입니다. 자동동기를 켜면 이후 기록마다
                맞춰집니다.
              </li>
            </ul>
          </div>
        }
      />
    </>
  );
}
