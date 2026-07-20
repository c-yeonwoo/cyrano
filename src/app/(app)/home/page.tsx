"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useProfile } from "@/lib/store/useProfile";
import { useDerived } from "@/lib/useDerived";
import { STAGE_NAMES } from "@/lib/engine";
import { formatKRW, formatPct } from "@/lib/format";
import { avgMonthlySpendWon } from "@/lib/spending";
import { ensureSpending } from "@/lib/store/defaults";
import { Card, Button, EmptyState } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { LogoMark } from "@/components/Logo";
import { AssetChart } from "@/components/AssetChart";
import { VisionBoard } from "@/components/home/VisionBoard";
import {
  HomeMetricGrid,
  buildHomeMetrics,
} from "@/components/home/HomeMetricGrid";
import { computeDailyStreak, normalizeTracking } from "@/lib/tracking";
import { emptyTracking } from "@/lib/types";
import { BRAND } from "@/lib/brand";

export default function HomePage() {
  const profile = useProfile((s) => s.profile);
  const { stage, projection } = useDerived();
  const { vision, snapshot } = profile;

  const spending = ensureSpending(profile);
  const recordedAvgSpendWon3m = useMemo(
    () => avgMonthlySpendWon(spending.fixed, spending.logs, 3),
    [spending.fixed, spending.logs],
  );

  const targetYears = vision?.targetYears ?? 15;
  const hasVision =
    Boolean(vision) &&
    ((vision?.goalNetworth ?? 0) > 0 ||
      (vision?.goalPassiveIncome ?? 0) > 0 ||
      Boolean(vision?.why?.trim()) ||
      Boolean(vision?.scenes.some((s) => s.text.trim())));

  // 현황(스냅샷) 없음 — 목표만 있어도 부분 요약
  if (!snapshot || !stage) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-2.5">
          <LogoMark size={32} />
          <div>
            <div className="font-display text-lg font-bold text-ink-900">{BRAND.mark}</div>
            <p className="text-xs text-ink-500">
              {BRAND.ko} · {BRAND.descriptor}
            </p>
          </div>
        </div>

        {hasVision && vision ? (
          <>
            <section className="rounded-2xl bg-brand-900 p-5 text-white md:p-6">
              <div className="text-xs text-white/45">목표만 있어요</div>
              <h1 className="mt-1 text-xl font-extrabold tracking-tight">
                {vision.goalNetworth > 0
                  ? `목표 ${formatKRW(vision.goalNetworth)}`
                  : "목표를 이어가요"}
              </h1>
              <p className="mt-2 text-sm text-white/55">
                {vision.goalPassiveIncome > 0 &&
                  `월 패시브 ${formatKRW(vision.goalPassiveIncome)} · `}
                {targetYears}년 · 현황을 넣으면 단계·달성률이 계산돼요
              </p>
            </section>
            <VisionBoard vision={vision} />
            <Card>
              <EmptyState
                icon="diagnosis"
                title="지금 위치를 알려주세요"
                desc="현금·투자·소득·지출을 넣으면 홈 대시보드가 채워집니다."
                action={
                  <div className="flex flex-wrap gap-2">
                    <Link href="/onboarding">
                      <Button>현황 입력</Button>
                    </Link>
                    <Link href="/goals">
                      <Button variant="outline">목표 수정</Button>
                    </Link>
                  </div>
                }
              />
            </Card>
          </>
        ) : (
          <EmptyState
            icon="engine"
            title="자산 설계로 현재 위치를 잡아봐요"
            desc="목표와 현황을 넣으면 단계와 다음 할 일이 보여요."
            action={
              <Link href="/onboarding">
                <Button>시작하기</Button>
              </Link>
            }
          />
        )}
      </div>
    );
  }

  const m = stage.metrics;
  const tracking = normalizeTracking(profile.tracking ?? emptyTracking());
  const streak = computeDailyStreak(tracking.routines, tracking.logs);
  const atYear = projection
    ? projection.curve[Math.min(targetYears, projection.curve.length - 1)]
    : null;

  const goalNw = vision?.goalNetworth ?? 0;
  const currentAchievePct = projection?.achievementPct ?? 0;
  const horizonAchievePct =
    goalNw > 0 && atYear ? (atYear.totalNetWorth / goalNw) * 100 : 0;

  const homeMetrics = buildHomeMetrics({
    cash: snapshot.cash,
    investAssets: snapshot.investAssets,
    realEstate: snapshot.realEstate,
    liabilities: snapshot.liabilities,
    netWorth: m.netWorth,
    totalMonthlyIncome: m.totalMonthlyIncome,
    diagnosisSpendMan: snapshot.monthlySpending,
    laborSharePct: m.laborSharePct,
    capitalSharePct: m.capitalSharePct,
    savingsRatePct: m.savingsRatePct,
    passiveToSpendingPct: m.passiveToSpendingPct,
    recordedAvgSpendWon3m,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* 단계 히어로 */}
      <section className="rounded-2xl bg-brand-900 p-5 text-white md:p-6">
        <div className="mb-4 flex items-center gap-2.5">
          <LogoMark size={28} />
          <span className="font-display text-base font-bold tracking-tight text-white">
            {BRAND.mark}
          </span>
        </div>
        <div className="text-xs text-white/45">지금 단계</div>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">
          <span className="tnum text-gold-400">{stage.stage}</span>
          <span className="text-white/40"> / 8</span>
          <span className="mx-2 text-white/30">·</span>
          {STAGE_NAMES[stage.stage]}
        </h1>
        {vision && (
          <p className="mt-2 text-sm text-white/55">
            목표 {formatKRW(vision.goalNetworth)}
            {vision.goalPassiveIncome > 0 &&
              ` · 월 패시브 ${formatKRW(vision.goalPassiveIncome)}`}
            {` · ${targetYears}년`}
          </p>
        )}
      </section>

      <VisionBoard vision={vision} />

      {/* N년 뒤 미리보기 + 지표 */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm font-bold text-ink-700">
            <Icon name="trending-up" size={16} className="text-sage-600" />
            {targetYears}년 뒤 미리보기
          </div>
          <Link href="/engine">
            <Button className="!py-1.5 !text-xs">
              자산 설계 <Icon name="arrow-right" size={14} />
            </Button>
          </Link>
        </div>

        {projection && profile.engine.buckets.length > 0 && atYear ? (
          <Card className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <PreviewStat
                label="예상 순자산"
                value={formatKRW(atYear.totalNetWorth)}
              />
              <PreviewStat
                label="월 패시브"
                value={formatKRW(atYear.monthlyPassiveIncome)}
              />
              <PreviewStat
                label="예상 ETA"
                value={
                  projection.targetReachYear != null
                    ? `약 ${projection.targetReachYear}년`
                    : "재조정"
                }
              />
              <PreviewStat
                label="현재 달성"
                value={formatAchievePct(currentAchievePct)}
                sub="지금 순자산 ÷ 목표"
              />
              <PreviewStat
                label={`${targetYears}년 뒤 달성`}
                value={formatAchievePct(horizonAchievePct)}
                sub="예상 순자산 ÷ 목표"
              />
              <PreviewStat
                label="목표"
                value={goalNw > 0 ? formatKRW(goalNw) : "—"}
              />
            </div>
            <AssetChart
              curve={projection.curve.slice(0, targetYears + 1)}
              goalNetworth={vision?.goalNetworth}
              targetReachYear={projection.targetReachYear}
              height={200}
              compact
            />
            {(projection.passiveReachYear != null ||
              projection.crossoverYear != null) && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-400">
                {projection.passiveReachYear != null && (
                  <span>패시브 목표 · {projection.passiveReachYear}년차</span>
                )}
                {projection.crossoverYear != null && (
                  <span>자본≥근로 · {projection.crossoverYear}년차</span>
                )}
              </div>
            )}
          </Card>
        ) : (
          <Card>
            <EmptyState
              icon="engine"
              title="아직 배분이 없어요"
              desc="항목을 추가하면 자산 곡선이 그려집니다."
              action={
                <Link href="/engine">
                  <Button>설계 시작</Button>
                </Link>
              }
            />
          </Card>
        )}
      </section>

      <Card className="border-sage-100 bg-sage-50">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-sm font-bold text-sage-700">
              <Icon name="check-circle" size={16} />
              다음 한 걸음
            </div>
            <p className="mt-2 text-sm text-sage-700">{stage.nextStep}</p>
          </div>
          <Link href="/tracking">
            <Button
              variant="outline"
              className="shrink-0 border-sage-500/35 text-sage-700 hover:border-sage-500 hover:bg-sage-50"
            >
              {streak > 0 ? `실천 · ${streak}일` : "실천하기"}
            </Button>
          </Link>
        </div>
      </Card>

      <HomeMetricGrid metrics={homeMetrics} />
    </div>
  );
}

/** 1% 미만도 안 보이도록 자리수 조정 (0.0% 오인 방지) */
function formatAchievePct(pct: number): string {
  if (!Number.isFinite(pct) || pct <= 0) return "0%";
  if (pct < 0.1) return `${pct.toFixed(2)}%`;
  if (pct < 10) return formatPct(pct, 1);
  return formatPct(pct, 0);
}

function PreviewStat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg bg-ink-50 px-3 py-2">
      <div className="text-[10px] font-medium text-ink-400">{label}</div>
      <div className="tnum mt-0.5 text-sm font-extrabold text-ink-800">{value}</div>
      {sub && <div className="mt-0.5 text-[10px] text-ink-400">{sub}</div>}
    </div>
  );
}
