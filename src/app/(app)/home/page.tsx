"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useProfile } from "@/lib/store/useProfile";
import { useDerived } from "@/lib/useDerived";
import { STAGE_NAMES, ratioSum } from "@/lib/engine";
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
import { LeadCta } from "@/components/LeadCta";
import { computeDailyStreak, normalizeTracking } from "@/lib/tracking";
import { computeWeekDelta, type WeekDelta } from "@/lib/homeDelta";
import { track } from "@/lib/analytics";
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
  const hasNumericGoal =
    (vision?.goalNetworth ?? 0) > 0 || (vision?.goalPassiveIncome ?? 0) > 0;
  const hasVision =
    Boolean(vision) &&
    (hasNumericGoal ||
      Boolean(vision?.why?.trim()) ||
      Boolean(vision?.scenes.some((s) => s.text.trim())));

  // 현황(스냅샷) 없음
  if (!snapshot || !stage) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="rounded-xl bg-brand-900 px-6 py-10 text-white md:px-8 md:py-12">
          <div className="flex items-center gap-2.5">
            <LogoMark size={36} />
            <div className="font-display text-xl font-bold tracking-tight">{BRAND.mark}</div>
          </div>
          <h1 className="font-display mt-8 text-3xl font-extrabold tracking-tight">
            3분 만에 내 곡선 보기
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/60">
            현황을 넣고 배분을 조립하면, n년 뒤 자산이 어떻게 쌓이는지 바로 보여요.
          </p>
          <div className="mt-8">
            <Link href="/engine">
              <Button className="!bg-gold-400 !text-white hover:!bg-gold-600">
                자산 설계 시작
              </Button>
            </Link>
          </div>
        </section>

        {hasVision && vision && (
          <>
            <VisionBoard vision={vision} />
            <Card>
              <EmptyState
                icon="diagnosis"
                title="지금 위치를 알려주세요"
                desc="현금·투자·소득·지출을 넣으면 홈 대시보드가 채워집니다."
                action={
                  <Link href="/engine">
                    <Button>현황 입력</Button>
                  </Link>
                }
              />
            </Card>
          </>
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

  const engineSumOk = Math.round(ratioSum(profile.engine.buckets)) === 100;
  const [weekDelta, setWeekDelta] = useState<WeekDelta | null>(null);

  useEffect(() => {
    const d = computeWeekDelta({
      netWorth: m.netWorth,
      achievementPct: currentAchievePct,
      stage: stage.stage,
    });
    setWeekDelta(d);
    track("home_week_delta_viewed", {
      is_new_week: d.isNewWeek,
      nw_delta: Math.round(d.netWorthDelta),
      stage_delta: d.stageDelta,
    });
  }, [m.netWorth, currentAchievePct, stage.stage]);

  const showProjectionHero =
    hasNumericGoal &&
    Boolean(projection) &&
    profile.engine.buckets.length > 0 &&
    Boolean(atYear);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-xl bg-brand-900 p-5 text-white md:p-6">
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
        {hasNumericGoal && vision ? (
          <p className="mt-2 text-sm text-white/55">
            목표 {formatKRW(vision.goalNetworth)}
            {vision.goalPassiveIncome > 0 &&
              ` · 월 패시브 ${formatKRW(vision.goalPassiveIncome)}`}
            {` · ${targetYears}년`}
          </p>
        ) : (
          <p className="mt-2 text-sm text-white/55">
            숫자 목표가 없으면 곡선은 참고용이에요. 목표를 정해 주세요.
          </p>
        )}
        {weekDelta && !weekDelta.isNewWeek && (
          <p className="mt-3 text-xs text-white/50">
            이번 주{" "}
            <span className="text-white/80">
              순자산 {formatSignedMan(weekDelta.netWorthDelta)}
            </span>
            {" · "}
            <span className="text-white/80">
              달성 {formatSignedPp(weekDelta.achievementDeltaPp)}
            </span>
            {weekDelta.stageDelta !== 0 && (
              <>
                {" · "}
                <span className="text-gold-300">
                  단계 {weekDelta.stageDelta > 0 ? "+" : ""}
                  {weekDelta.stageDelta}
                </span>
              </>
            )}
          </p>
        )}
        {weekDelta?.isNewWeek && (
          <p className="mt-3 text-xs text-white/45">이번 주 기준점을 기록했어요</p>
        )}
      </section>

      {/* N년 뒤 미리보기 — 히어로 (목표 있을 때만 큰 숫자) */}
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

        {!hasNumericGoal ? (
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gold-50 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-sm font-bold text-gold-700">
                  <Icon name="target" size={15} />
                  목표 숫자를 먼저 정해요
                </div>
                <p className="mt-1 text-xs text-ink-500">
                  순자산·패시브 목표가 없으면 억 단위 곡선은 참고용일 뿐이에요.
                </p>
              </div>
              <Link href="/goals" className="shrink-0">
                <Button>
                  목표 정하기 <Icon name="arrow-right" size={14} />
                </Button>
              </Link>
            </div>
            {projection && profile.engine.buckets.length > 0 && atYear && (
              <AssetChart
                curve={projection.curve.slice(0, targetYears + 1)}
                height={180}
                compact
              />
            )}
          </Card>
        ) : showProjectionHero && projection && atYear ? (
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
              <PreviewStat label="목표" value={formatKRW(goalNw)} />
            </div>
            <AssetChart
              curve={projection.curve.slice(0, targetYears + 1)}
              goalNetworth={vision?.goalNetworth}
              targetReachYear={projection.targetReachYear}
              height={200}
              compact
            />
            <p className="text-[11px] text-ink-400">
              예시·가정 수익률 기반 · 수익을 보장하지 않습니다
            </p>
          </Card>
        ) : (
          <Card>
            <EmptyState
              icon="engine"
              title="아직 배분이 없어요"
              desc="추천 배분으로 시작하면 자산 곡선이 그려집니다."
              action={
                <Link href="/engine">
                  <Button>설계 시작</Button>
                </Link>
              }
            />
          </Card>
        )}
      </section>

      {/* 비전보드 — 미리보기(히어로) 다음의 secondary */}
      {vision && <VisionBoard vision={vision} />}

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

      <LeadCta placement="home_retention" />
      {!engineSumOk && profile.engine.buckets.length > 0 && (
        <p className="text-center text-[11px] text-ink-400">
          수입 배분 합이 100%가 되면 아하·공유 루프가 열려요 (지금{" "}
          {Math.round(ratioSum(profile.engine.buckets))}%)
        </p>
      )}
    </div>
  );
}

function formatSignedMan(man: number): string {
  if (man === 0) return "변화 없음";
  const sign = man > 0 ? "+" : "";
  return `${sign}${formatKRW(man)}`;
}

function formatSignedPp(pp: number): string {
  if (Math.abs(pp) < 0.05) return "변화 없음";
  const sign = pp > 0 ? "+" : "";
  return `${sign}${pp.toFixed(1)}%p`;
}

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
