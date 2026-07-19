"use client";

import { useMemo } from "react";
import { useProfile, selectSpending } from "@/lib/store/useProfile";
import {
  categoryBreakdown,
  fixedCategoryBreakdown,
  logsInMonth,
  peerInsight,
  patternInsight,
  sumFixed,
  sumLogs,
} from "@/lib/spending/calc";
import { formatWon } from "@/lib/spending/format";
import { AssumptionNote, Card } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { DonutChart } from "./DonutChart";
import { clsx } from "@/lib/clsx";

export function SummaryTab() {
  const profile = useProfile((s) => s.profile);
  const spending = selectSpending(profile);
  const now = new Date();
  const year = now.getFullYear();
  const monthIndex = now.getMonth();

  const monthLogs = useMemo(
    () => logsInMonth(spending.logs, year, monthIndex),
    [spending.logs, year, monthIndex],
  );
  const variableSpent = sumLogs(monthLogs);
  const fixedTotal = sumFixed(spending.fixed);
  const totalSpend = variableSpent + fixedTotal;
  const variableBreakdown = categoryBreakdown(monthLogs);
  const fixedBreakdown = fixedCategoryBreakdown(spending.fixed);
  const peer = peerInsight(variableBreakdown, profile.vision?.currentAge);
  const pattern = patternInsight(monthLogs);
  const incomeWon =
    (profile.snapshot?.incomeSources.reduce((s, i) => s + i.monthly, 0) ?? 0) * 10_000;
  const totalIncomePct = incomeWon > 0 ? (totalSpend / incomeWon) * 100 : null;
  const fixedIncomePct = incomeWon > 0 ? (fixedTotal / incomeWon) * 100 : null;
  const variableShare = totalSpend > 0 ? (variableSpent / totalSpend) * 100 : 0;
  const fixedShare = totalSpend > 0 ? (fixedTotal / totalSpend) * 100 : 0;

  return (
    <div className="space-y-5">
      {/* 총지출 히어로 */}
      <section className="rounded-2xl border border-ink-200 bg-white p-5 md:p-6">
        <div className="text-xs font-semibold tracking-wide text-ink-400">
          {monthIndex + 1}월 지출 총합
        </div>
        <div className="mt-2 flex flex-wrap items-baseline gap-2">
          <span className="tnum text-3xl font-extrabold tracking-tight text-ink-900">
            {formatWon(totalSpend)}
          </span>
          {totalIncomePct != null && (
            <span className="text-sm text-ink-400">소득 대비 {totalIncomePct.toFixed(0)}%</span>
          )}
        </div>
        <p className="mt-1 text-xs text-ink-500">
          변동 {formatWon(variableSpent)} + 고정 {formatWon(fixedTotal)}
        </p>
        <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-ink-100">
          {totalSpend > 0 ? (
            <>
              <div
                className="bg-gold-400 transition-all"
                style={{ width: `${variableShare}%` }}
                title="변동"
              />
              <div
                className="bg-brand-400 transition-all"
                style={{ width: `${fixedShare}%` }}
                title="고정"
              />
            </>
          ) : null}
        </div>
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-ink-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-gold-400" />
            변동 {variableShare.toFixed(0)}%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brand-400" />
            고정 {fixedShare.toFixed(0)}%
          </span>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="!p-4">
          <div className="text-xs font-semibold text-ink-400">고정비</div>
          <div className="tnum mt-1 text-xl font-extrabold text-ink-900">
            {formatWon(fixedTotal)}
          </div>
          <p className="mt-1 text-xs text-ink-500">
            {fixedIncomePct != null
              ? `소득 대비 ${fixedIncomePct.toFixed(0)}% · 결제일만 관리`
              : "진단에서 소득을 넣으면 비중을 보여줘요"}
          </p>
        </Card>
        <Card className="!p-4 border-gold-200 bg-gold-50/40">
          <div className="text-xs font-semibold text-gold-600">변동비</div>
          <div className="tnum mt-1 text-xl font-extrabold text-ink-900">
            {formatWon(variableSpent)}
          </div>
          <p className="mt-1 text-xs text-ink-500">
            예산·페이스는 <span className="font-semibold">변동지출</span> 탭에서
          </p>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="mb-3 text-sm font-bold text-ink-800">카테고리별 변동지출</div>
          <DonutChart
            segments={variableBreakdown}
            totalWon={variableSpent}
            centerLabel="변동"
            emptyLabel="이번 달 변동 기록이 없어요"
          />
        </Card>
        <Card>
          <div className="mb-3 text-sm font-bold text-ink-800">카테고리별 고정지출</div>
          <DonutChart
            segments={fixedBreakdown}
            totalWon={fixedTotal}
            centerLabel="고정"
            emptyLabel="고정지출을 등록해 보세요"
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
              변동 지출을 몇 건 기록하면 또래·패턴 진단이 나타납니다.
            </Card>
          )}
        </div>
        <AssumptionNote>
          또래 비교는 연령대 집단 평균의 <strong>예시·가정</strong>입니다. 개별 종목·매물 추천이
          아닙니다.
        </AssumptionNote>
      </div>
    </div>
  );
}
