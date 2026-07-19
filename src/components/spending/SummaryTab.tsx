"use client";

import { useMemo } from "react";
import { useProfile, selectSpending } from "@/lib/store/useProfile";
import {
  categoryBreakdown,
  fixedCategoryBreakdown,
  logsInMonth,
  partitionFixedByBilling,
  peerInsight,
  patternInsight,
  sumLogs,
} from "@/lib/spending/calc";
import { formatWon } from "@/lib/spending/format";
import { AssumptionNote, Card } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { DonutChart } from "./DonutChart";
import { ApplySpendingToEngine } from "./ApplySpendingToEngine";
import { clsx } from "@/lib/clsx";

export function SummaryTab() {
  const profile = useProfile((s) => s.profile);
  const spending = selectSpending(profile);
  const today = new Date();
  const year = today.getFullYear();
  const monthIndex = today.getMonth();
  const day = today.getDate();

  const monthLogs = useMemo(
    () => logsInMonth(spending.logs, year, monthIndex),
    [spending.logs, year, monthIndex],
  );
  const fixedParts = useMemo(
    () => partitionFixedByBilling(spending.fixed, new Date(year, monthIndex, day)),
    [spending.fixed, year, monthIndex, day],
  );
  const variableSpent = sumLogs(monthLogs);
  const fixedPaid = fixedParts.paidWon;
  const fixedUpcoming = fixedParts.upcomingWon;
  const totalSpend = variableSpent + fixedPaid;
  const variableBreakdown = categoryBreakdown(monthLogs);
  const fixedBreakdown = fixedCategoryBreakdown(fixedParts.paid);
  const peer = peerInsight(variableBreakdown, profile.vision?.currentAge);
  const pattern = patternInsight(monthLogs);
  const incomeWon =
    (profile.snapshot?.incomeSources.reduce((s, i) => s + i.monthly, 0) ?? 0) * 10_000;
  const totalIncomePct = incomeWon > 0 ? (totalSpend / incomeWon) * 100 : null;
  const fixedIncomePct = incomeWon > 0 ? (fixedPaid / incomeWon) * 100 : null;
  const variableShare = totalSpend > 0 ? (variableSpent / totalSpend) * 100 : 0;
  const fixedShare = totalSpend > 0 ? (fixedPaid / totalSpend) * 100 : 0;

  return (
    <div className="space-y-5">
      {/* 요약 히어로 — 이 페이지의 강조 포인트 */}
      <section className="overflow-hidden rounded-2xl border border-brand-800/10 bg-brand-900 text-white">
        <div className="p-5 md:p-6">
          <div className="text-xs text-white/50">{monthIndex + 1}월 · 오늘까지 쓴 돈</div>
          <div className="mt-2 flex flex-wrap items-baseline gap-2">
            <span className="tnum text-3xl font-extrabold tracking-tight text-gold-400">
              {formatWon(totalSpend)}
            </span>
            {totalIncomePct != null && (
              <span className="text-sm text-white/45">소득의 {totalIncomePct.toFixed(0)}%</span>
            )}
          </div>
          <p className="mt-1 text-xs text-white/45">
            고정 {formatWon(fixedPaid)} + 변동 {formatWon(variableSpent)}
          </p>
          <div className="mt-5 flex h-2 overflow-hidden rounded-full bg-white/10">
            {totalSpend > 0 ? (
              <>
                <div
                  className="bg-white/50 transition-all"
                  style={{ width: `${fixedShare}%` }}
                  title="고정"
                />
                <div
                  className="bg-gold-400 transition-all"
                  style={{ width: `${variableShare}%` }}
                  title="변동"
                />
              </>
            ) : null}
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-white/50">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-white/50" />
              고정 {fixedShare.toFixed(0)}%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-gold-400" />
              변동 {variableShare.toFixed(0)}%
            </span>
          </div>
        </div>
      </section>

      <ApplySpendingToEngine source="summary" />

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="!p-4">
          <div className="text-xs font-semibold text-ink-400">고정비</div>
          <div className="tnum mt-1 text-xl font-extrabold text-ink-900">
            {formatWon(fixedPaid)}
          </div>
          <p className="mt-1 text-xs text-ink-500">
            {fixedIncomePct != null
              ? `소득의 ${fixedIncomePct.toFixed(0)}% · 청구일이 지난 항목`
              : "청구일이 지난 항목만"}
          </p>
        </Card>
        <Card className="!p-4">
          <div className="text-xs font-semibold text-ink-400">변동비</div>
          <div className="tnum mt-1 text-xl font-extrabold text-ink-900">
            {formatWon(variableSpent)}
          </div>
          <p className="mt-1 text-xs text-ink-500">이번 달 기록한 금액</p>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="mb-3 text-sm font-bold text-ink-800">카테고리별 고정</div>
          <DonutChart
            segments={fixedBreakdown}
            totalWon={fixedPaid}
            centerLabel="고정"
            emptyLabel="아직 청구된 고정이 없어요"
          />
        </Card>
        <Card>
          <div className="mb-3 text-sm font-bold text-ink-800">카테고리별 변동</div>
          <DonutChart
            segments={variableBreakdown}
            totalWon={variableSpent}
            centerLabel="변동"
            emptyLabel="이번 달 변동 기록이 없어요"
          />
        </Card>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-bold text-ink-800">진단</div>
        <div className="grid gap-3 lg:grid-cols-2">
          {peer && (
            <div
              className={clsx(
                "rounded-xl border px-4 py-3",
                peer.tone === "warning"
                  ? "border-amber-200 bg-amber-50"
                  : "border-ink-200 bg-ink-50",
              )}
            >
              <div className="flex items-start gap-2">
                <Icon
                  name={peer.tone === "warning" ? "alert" : "info"}
                  size={16}
                  className={peer.tone === "warning" ? "text-amber-700" : "text-ink-500"}
                />
                <div>
                  <div className="text-sm font-bold text-ink-800">{peer.title}</div>
                  <p className="mt-1 text-xs leading-relaxed text-ink-600">{peer.body}</p>
                </div>
              </div>
            </div>
          )}
          {pattern && (
            <div className="rounded-xl border border-sage-100 bg-sage-50 px-4 py-3">
              <div className="flex items-start gap-2">
                <Icon name="sparkle" size={16} className="text-sage-600" />
                <div>
                  <div className="text-sm font-bold text-sage-700">{pattern.title}</div>
                  <p className="mt-1 text-xs leading-relaxed text-sage-700/90">{pattern.body}</p>
                </div>
              </div>
            </div>
          )}
          {!peer && !pattern && (
            <Card className="!p-4 text-sm text-ink-500 lg:col-span-2">
              변동을 몇 건 기록하면 진단이 나타납니다.
            </Card>
          )}
        </div>
        <AssumptionNote>
          또래 비교는 연령대 평균의 <strong>예시·가정</strong>입니다.
        </AssumptionNote>
      </div>

      {fixedUpcoming > 0 && (
        <p className="text-center text-xs text-ink-400">
          청구 전 고정 {formatWon(fixedUpcoming)}은 위 총합에 넣지 않았어요
        </p>
      )}
    </div>
  );
}
