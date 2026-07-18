"use client";

import { useMemo, useState } from "react";
import { useProfile, MAX_SCENARIOS_LIMIT } from "@/lib/store/useProfile";
import { suggestEngineFromSnapshot, DEFAULT_SNAPSHOT } from "@/lib/store/defaults";
import {
  projectEngine,
  ratioSum,
  needsRealityNudge,
  adjustReturns,
  SENSITIVITY,
  type SensitivityKey,
} from "@/lib/engine";
import { presetByKey, bucketFromPreset } from "@/lib/catalog";
import { CATEGORY_META, type Bucket } from "@/lib/types";
import { formatKRW, clampPct } from "@/lib/format";
import { Card, Button, Badge, EmptyState, TextInput, AssumptionNote, StatCard } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { AssetChart } from "@/components/AssetChart";
import { Palette } from "./Palette";
import { Inspector } from "./Inspector";
import { EngineFlow } from "./EngineFlow";

const CAT_ACCENT: Record<string, string> = {
  invest: "border-l-amber-400",
  save: "border-l-emerald-400",
  spend: "border-l-sky-400",
};

export function EngineBuilder() {
  const snapshot = useProfile((s) => s.profile.snapshot) ?? DEFAULT_SNAPSHOT;
  const vision = useProfile((s) => s.profile.vision);
  const buckets = useProfile((s) => s.profile.engine.buckets);
  const scenarios = useProfile((s) => s.profile.scenarios);
  const addBucket = useProfile((s) => s.addBucket);
  const updateBucket = useProfile((s) => s.updateBucket);
  const removeBucket = useProfile((s) => s.removeBucket);
  const setEngine = useProfile((s) => s.setEngine);
  const saveScenario = useProfile((s) => s.saveScenario);
  const loadScenario = useProfile((s) => s.loadScenario);
  const deleteScenario = useProfile((s) => s.deleteScenario);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compareId, setCompareId] = useState<string | null>(null);
  const [scenarioName, setScenarioName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [sens, setSens] = useState<SensitivityKey>("base");

  const monthlyIncome = snapshot.incomeSources.reduce((s, i) => s + i.monthly, 0);
  const sum = ratioSum(buckets);
  const sumOk = Math.round(sum) === 100;

  const horizon = Math.max(vision?.targetYears ?? 15, 30);

  // 선택한 가정(보수/기본/공격)을 반영한 메인 곡선
  const projection = useMemo(
    () =>
      projectEngine({
        snapshot,
        buckets: adjustReturns(buckets, SENSITIVITY[sens].deltaPp),
        horizonYears: horizon,
        goalNetworth: vision?.goalNetworth,
        goalPassiveIncome: vision?.goalPassiveIncome,
      }),
    [snapshot, buckets, sens, horizon, vision?.goalNetworth, vision?.goalPassiveIncome],
  );

  // 민감도 밴드: 보수~공격 범위 (항상 표시)
  const band = useMemo(() => {
    const low = projectEngine({
      snapshot,
      buckets: adjustReturns(buckets, SENSITIVITY.conservative.deltaPp),
      horizonYears: horizon,
      goalNetworth: vision?.goalNetworth,
    });
    const high = projectEngine({
      snapshot,
      buckets: adjustReturns(buckets, SENSITIVITY.aggressive.deltaPp),
      horizonYears: horizon,
      goalNetworth: vision?.goalNetworth,
    });
    return { low, high };
  }, [snapshot, buckets, horizon, vision?.goalNetworth]);

  const compareProjection = useMemo(() => {
    const sc = scenarios.find((x) => x.id === compareId);
    if (!sc) return null;
    return projectEngine({
      snapshot,
      buckets: sc.buckets,
      horizonYears: horizon,
      goalNetworth: vision?.goalNetworth,
    });
  }, [compareId, scenarios, snapshot, horizon, vision?.goalNetworth]);

  const selected = buckets.find((b) => b.id === selectedId) ?? null;
  const targetYears = vision?.targetYears ?? 15;
  const atYear = (curve: typeof projection.curve) =>
    curve.find((p) => p.year === targetYears) ?? curve[curve.length - 1];
  const atTarget = atYear(projection.curve);
  const lowAt = atYear(band.low.curve);
  const highAt = atYear(band.high.curve);

  const nudge = vision ? needsRealityNudge(projection.targetReachYear, targetYears) : false;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const key = e.dataTransfer.getData("application/bucket-preset");
    const preset = presetByKey(key);
    if (preset) addBucket(bucketFromPreset(preset, buckets.length));
  };

  const duplicate = (b: Bucket) => {
    const id = `b_${buckets.length}_${Math.random().toString(36).slice(2, 8)}`;
    addBucket({ ...b, id, name: `${b.name} 복제`, position: buckets.length });
  };

  return (
    <div className="space-y-5">
      {/* 상단바 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-ink-600">
          {vision && (
            <span className="flex items-center gap-1.5 font-semibold">
              <Icon name="target" size={16} className="text-brand-600" />
              목표 {formatKRW(vision.goalNetworth)} · {vision.targetYears}년 뒤
            </span>
          )}
        </div>
        <Badge tone={sumOk ? "emerald" : "amber"}>
          배분 합계 {Math.round(sum)}% {sumOk ? "✓" : "(100% 필요)"}
        </Badge>
      </div>

      <div className="grid gap-5 lg:grid-cols-[220px_1fr_260px]">
        {/* 팔레트 */}
        <Card className="h-fit">
          <Palette onAdd={addBucket} nextPosition={buckets.length} />
        </Card>

        {/* 캔버스 */}
        <div className="space-y-4">
          <EngineFlow buckets={buckets} monthlyIncome={monthlyIncome} />

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`min-h-[120px] rounded-2xl border-2 border-dashed p-2 transition-colors ${
              dragOver ? "border-brand-400 bg-brand-50" : "border-ink-200"
            }`}
          >
            {buckets.length === 0 ? (
              <EmptyState
                icon="layers"
                title="여기에 버킷을 끌어다 놓으세요"
                desc="소득에서 시작해, 팔레트의 버킷을 조립해 내 엔진을 만드세요."
                action={
                  <Button onClick={() => setEngine(suggestEngineFromSnapshot(snapshot))}>
                    진단 데이터로 추천 배분 시작
                  </Button>
                }
              />
            ) : (
              <div className="space-y-1.5">
                {buckets
                  .slice()
                  .sort((a, b) => a.position - b.position)
                  .map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedId(b.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border border-l-4 bg-white px-3 py-2 text-left transition-colors ${
                        CAT_ACCENT[b.category]
                      } ${selectedId === b.id ? "ring-2 ring-brand-300" : "hover:bg-ink-50"}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-ink-700">
                          {b.name}
                          {b.isLocked && <Icon name="lock" size={13} className="text-locked" />}
                          <Badge tone="slate">{CATEGORY_META[b.category].label}</Badge>
                        </div>
                        <div className="text-[11px] text-ink-400">
                          {b.category !== "spend"
                            ? `연 ${b.expectedAnnualReturnPct}% (가정)`
                            : "소비 (out)"}
                          {b.category === "invest" && b.realizedYieldPct > 0
                            ? ` · 실현 ${b.realizedYieldPct}%`
                            : ""}
                        </div>
                      </div>
                      <div className="w-32">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={b.ratioPct}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            updateBucket(b.id, { ratioPct: clampPct(Number(e.target.value)) })
                          }
                          className="w-full"
                        />
                      </div>
                      <div className="w-10 text-right text-sm font-bold text-ink-700">
                        {b.ratioPct}%
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
          <p className="text-xs text-ink-400">
            ＊ 노드를 클릭하면 오른쪽 인스펙터에서 비율·수익률·lock을 편집합니다. 수치는 예시·가정.
          </p>
        </div>

        {/* 인스펙터 */}
        <Card className="h-fit">
          {selected ? (
            <Inspector
              bucket={selected}
              onChange={(patch) => updateBucket(selected.id, patch)}
              onDelete={() => {
                removeBucket(selected.id);
                setSelectedId(null);
              }}
              onDuplicate={() => duplicate(selected)}
            />
          ) : (
            <div className="py-8 text-center text-sm text-ink-400">
              버킷을 선택하면
              <br />
              여기서 편집합니다.
            </div>
          )}
          <div
            className={`mt-4 rounded-xl border px-3 py-2 text-center text-xs font-semibold ${
              sumOk
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            비율 합계: {Math.round(sum)}% {sumOk ? "✓" : sum > 100 ? "초과" : "미달"}
          </div>
        </Card>
      </div>

      {/* 결과 패널 */}
      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-sm font-bold text-ink-700">
            <Icon name="trending-up" size={16} className="text-brand-600" />
            복리 시뮬 결과
          </div>
          <div className="flex items-center gap-2">
            {compareId && (
              <Badge tone="slate">
                점선 = {scenarios.find((s) => s.id === compareId)?.name} 비교
              </Badge>
            )}
            {/* 수익률 가정 프리셋 */}
            <div className="flex rounded-lg border border-ink-200 p-0.5 text-xs">
              {(["conservative", "base", "aggressive"] as SensitivityKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setSens(k)}
                  className={
                    "rounded-md px-2.5 py-1 font-semibold transition-colors " +
                    (sens === k ? "bg-brand-600 text-white" : "text-ink-500 hover:bg-ink-100")
                  }
                >
                  {SENSITIVITY[k].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mb-3 text-xs text-ink-400">
          수익률 가정: {SENSITIVITY[sens].label}
          {SENSITIVITY[sens].deltaPp !== 0 &&
            ` (기대수익률 ${SENSITIVITY[sens].deltaPp > 0 ? "+" : ""}${SENSITIVITY[sens].deltaPp}%p)`}
          . 음영은 보수~공격 범위입니다. 가정이 바뀌면 결과가 이만큼 달라져요.
        </p>

        {nudge && (
          <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            <Icon name="info" size={16} className="mt-0.5 shrink-0" />
            <span>
              현재 속도로는 목표 시점({targetYears}년) 내 도달이 어려워 보여요. 저축·수익률을 높이거나
              목표 시점을 늘려보는 건 어떨까요? (목표는 그대로 둬도 괜찮아요)
            </span>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
          <AssetChart
            curve={projection.curve}
            compareCurve={compareProjection?.curve ?? null}
            band={{ lower: band.low.curve, upper: band.high.curve }}
            goalNetworth={vision?.goalNetworth}
            targetReachYear={projection.targetReachYear}
            height={260}
          />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            <StatCard
              label={`${targetYears}년 뒤 예상 순자산`}
              value={formatKRW(atTarget.totalNetWorth)}
              sub={`범위 ${formatKRW(lowAt.totalNetWorth)} ~ ${formatKRW(highAt.totalNetWorth)}`}
            />
            <StatCard
              label="목표 도달까지"
              value={
                projection.targetReachYear != null
                  ? `약 ${projection.targetReachYear}년`
                  : "시점 내 미도달"
              }
              sub={vision ? `달성률 ${projection.achievementPct.toFixed(1)}%` : undefined}
            />
            <StatCard
              label={`${targetYears}년 뒤 월 passive`}
              value={formatKRW(atTarget.monthlyPassiveIncome)}
              sub={
                projection.crossoverYear != null
                  ? `${projection.crossoverYear}년 뒤 자본>근로 역전`
                  : "실현 자본소득"
              }
            />
          </div>
        </div>

        {/* 시나리오 */}
        <div className="mt-4 border-t border-ink-100 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-ink-600">시나리오</span>
            <div className="w-40">
              <TextInput value={scenarioName} onChange={setScenarioName} placeholder="이름 (예: 공격형)" />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                saveScenario(scenarioName);
                setScenarioName("");
              }}
              disabled={buckets.length === 0 || scenarios.length >= MAX_SCENARIOS_LIMIT}
            >
              현재 배분 저장
            </Button>
            <span className="text-xs text-ink-400">
              {scenarios.length}/{MAX_SCENARIOS_LIMIT}
            </span>
          </div>
          {scenarios.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {scenarios.map((sc) => (
                <div
                  key={sc.id}
                  className="flex items-center gap-1 rounded-full border border-ink-200 bg-ink-50 px-2 py-1 text-xs"
                >
                  <span className="font-medium text-ink-600">{sc.name}</span>
                  <button className="text-brand-600" onClick={() => loadScenario(sc.id)}>
                    불러오기
                  </button>
                  <button
                    className={compareId === sc.id ? "text-ink-800 font-bold" : "text-ink-400"}
                    onClick={() => setCompareId(compareId === sc.id ? null : sc.id)}
                  >
                    비교
                  </button>
                  <button
                    className="text-red-400"
                    onClick={() => deleteScenario(sc.id)}
                    aria-label="시나리오 삭제"
                  >
                    <Icon name="x" size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4">
          <AssumptionNote />
        </div>
      </Card>
    </div>
  );
}
