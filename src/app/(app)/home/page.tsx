"use client";

import Link from "next/link";
import { useProfile } from "@/lib/store/useProfile";
import { useDerived } from "@/lib/useDerived";
import { STAGE_NAMES } from "@/lib/engine";
import { formatKRW, formatPct } from "@/lib/format";
import { Card, StatCard, Button, EmptyState } from "@/components/ui";
import { Icon, type IconName } from "@/components/Icon";
import { LogoMark } from "@/components/Logo";
import { AssetChart } from "@/components/AssetChart";
import { computeStreak } from "@/lib/tracking";
import { emptyTracking } from "@/lib/types";
import { BRAND } from "@/lib/brand";

export default function HomePage() {
  const profile = useProfile((s) => s.profile);
  const { stage, projection } = useDerived();
  const { vision, snapshot } = profile;

  if (!snapshot || !stage) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2.5">
          <LogoMark size={32} />
          <div>
            <div className="font-display text-lg font-bold text-ink-900">{BRAND.mark}</div>
            <p className="text-xs text-ink-500">
              {BRAND.ko} · {BRAND.descriptor}
            </p>
          </div>
        </div>
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
      </div>
    );
  }

  const m = stage.metrics;
  const streak = computeStreak((profile.tracking ?? emptyTracking()).checkIns);
  const targetYears = vision?.targetYears ?? 15;
  const whyLine = vision?.why?.trim();
  const firstScene = vision?.scenes.find((s) => s.text.trim());

  return (
    <div className="space-y-6">
      {/* 한 화면 한 메시지: 브랜드 + 단계·달성·다음 */}
      <section className="rounded-2xl bg-brand-900 p-5 text-white md:p-6">
        <div className="mb-4 flex items-center gap-2.5">
          <LogoMark size={28} />
          <span className="font-display text-base font-bold tracking-tight text-white">
            {BRAND.mark}
          </span>
          <span className="text-[11px] text-white/40">{BRAND.ko}</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div>
            <div className="text-xs text-white/45">지금 위치</div>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white">
              {stage.stage} / 8 · {STAGE_NAMES[stage.stage]}
            </h1>
            {(whyLine || firstScene) && (
              <p className="mt-2 flex items-start gap-1.5 text-sm text-white/65">
                <Icon name="target" size={15} className="mt-0.5 shrink-0 text-gold-400" />
                <span>
                  {whyLine || firstScene?.text}
                  {vision && ` · 목표 ${formatKRW(vision.goalNetworth)}`}
                </span>
              </p>
            )}
          </div>
          {vision && projection && (
            <div className="flex gap-6 border-t border-white/12 pt-3 sm:border-l sm:border-t-0 sm:pt-0 sm:pl-6">
              <div>
                <div className="text-[11px] text-white/45">목표 대비</div>
                <div className="tnum text-xl font-bold text-gold-400">
                  {formatPct(projection.achievementPct, 1)}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-white/45">예상 ETA</div>
                <div className="tnum text-xl font-bold text-gold-400">
                  {projection.targetReachYear != null
                    ? `약 ${projection.targetReachYear}년`
                    : "재조정 필요"}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* 엔진 미니뷰 — 보더 없이 open section에 가깝게 */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm font-bold text-ink-700">
              <Icon name="trending-up" size={16} className="text-brand-600" />
              {targetYears}년 뒤 미리보기
            </div>
            <Link href="/engine">
              <Button className="!py-1.5 !text-xs">
                자산 설계 <Icon name="arrow-right" size={14} />
              </Button>
            </Link>
          </div>
          <Card>
            {projection && profile.engine.buckets.length > 0 ? (
              <AssetChart
                curve={projection.curve}
                goalNetworth={vision?.goalNetworth}
                targetReachYear={projection.targetReachYear}
                height={200}
                compact
              />
            ) : (
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
            )}
          </Card>
        </div>

        {/* 다음 한 걸음 — sage (코치 순간, invest 기능색과 분리) */}
        <Card className="border-sage-100 bg-sage-50">
          <div className="flex items-center gap-1.5 text-sm font-bold text-sage-700">
            <Icon name="check-circle" size={16} />
            다음 한 걸음
          </div>
          <p className="mt-2 text-sm text-sage-700">{stage.nextStep}</p>
          <Link href="/tracking">
            <Button
              variant="outline"
              className="mt-4 w-full border-sage-500/35 text-sage-700 hover:border-sage-500 hover:bg-sage-50"
            >
              {streak > 0 ? `실천하기 · ${streak}주 연속` : "실천하기"}
            </Button>
          </Link>
        </Card>
      </div>

      {/* 자산 요약 — open section */}
      <div>
        <div className="mb-2 text-sm font-bold text-ink-700">자산 · 현금흐름</div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="순자산" value={formatKRW(m.netWorth)} />
          <StatCard label="저축률" value={formatPct(Math.max(0, m.savingsRatePct))} />
          <StatCard
            label="소득구조 (근로:자본)"
            value={`${Math.round(m.laborSharePct)}:${Math.round(m.capitalSharePct)}`}
          />
          <StatCard label="passive / 생활비" value={formatPct(m.passiveToSpendingPct)} />
        </div>
      </div>

      <div>
        <div className="mb-2 text-sm font-bold text-ink-700">바로가기</div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {(
            [
              { href: "/engine", label: "자산 설계", icon: "engine" },
              { href: "/spending", label: "지출", icon: "wallet" },
              { href: "/goals", label: "목표", icon: "target" },
              { href: "/tracking", label: "실천", icon: "check-circle" },
            ] as { href: string; label: string; icon: IconName }[]
          ).map((q) => (
            <Link
              key={q.href}
              href={q.href}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-ink-200 bg-white py-3 text-center text-sm font-medium text-ink-700 hover:bg-ink-100"
            >
              <Icon name={q.icon} size={16} className="text-ink-400" />
              {q.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
