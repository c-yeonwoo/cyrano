"use client";

import { useEffect, useMemo, useState } from "react";
import { useProfile, MAX_SCENARIOS_LIMIT } from "@/lib/store/useProfile";
import { suggestEngineFromSnapshot, DEFAULT_SNAPSHOT } from "@/lib/store/defaults";
import {
  projectEngine,
  ratioSum,
  needsRealityNudge,
  adjustReturns,
  SENSITIVITY,
  childrenOf,
  collectDescendantIds,
  type SensitivityKey,
} from "@/lib/engine";
import type { Bucket } from "@/lib/types";
import {
  ASSET_CASHFLOW_SOURCE_ID,
  normalizeIncomeSources,
  sumMonthlyIncome,
} from "@/lib/income";
import { GROUP_PRESETS, bucketFromPreset } from "@/lib/catalog";
import { formatKRW } from "@/lib/format";
import { renderShareCard, shareOrDownload } from "@/lib/shareCard";
import { track, trackAhaAllocatedOnce } from "@/lib/analytics";
import { Card, Button, Badge, TextInput, AssumptionNote, StatCard } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { LeadCta } from "@/components/LeadCta";
import { AssetChart } from "@/components/AssetChart";
import { BottomSheet } from "@/components/BottomSheet";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Palette } from "./Palette";
import { Inspector } from "./Inspector";
import { EngineCanvas } from "./EngineCanvas";
import {
  IncomeHubInspector,
  PoolHubInspector,
  SourceInspector,
} from "./HubInspector";
import {
  SpendRatioSuggestionBar,
  useSpendSuggestionPending,
} from "./SpendRatioSuggestion";
import { PushBudgetToVariableBar } from "./PushBudgetToVariable";
import { DiagnosisModal } from "./DiagnosisModal";

export function EngineBuilder() {
  const snapshot = useProfile((s) => s.profile.snapshot) ?? DEFAULT_SNAPSHOT;
  const vision = useProfile((s) => s.profile.vision);
  const engine = useProfile((s) => s.profile.engine);
  const buckets = engine.buckets;
  const scenarios = useProfile((s) => s.profile.scenarios);
  const addBucket = useProfile((s) => s.addBucket);
  const updateBucket = useProfile((s) => s.updateBucket);
  const removeBucket = useProfile((s) => s.removeBucket);
  const setBuckets = useProfile((s) => s.setBuckets);
  const setEngine = useProfile((s) => s.setEngine);
  const setSnapshot = useProfile((s) => s.setSnapshot);
  const saveScenario = useProfile((s) => s.saveScenario);
  const loadScenario = useProfile((s) => s.loadScenario);
  const deleteScenario = useProfile((s) => s.deleteScenario);

  const incomeSources = normalizeIncomeSources(snapshot.incomeSources);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectedId = selectedIds[0] ?? null;
  const selectNode = (
    id: string | null,
    opts?: { toggle?: boolean; also?: string[] },
  ) => {
    if (id == null) {
      setSelectedIds([]);
      return;
    }
    if (opts?.also?.length) {
      const uniq = [id, ...opts.also.filter((x) => x !== id)];
      setSelectedIds(uniq);
      return;
    }
    if (opts?.toggle) {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      );
      return;
    }
    setSelectedIds([id]);
  };
  const selectNodes = (ids: string[], opts?: { additive?: boolean }) => {
    if (opts?.additive) {
      setSelectedIds((prev) => [...new Set([...prev, ...ids])]);
      return;
    }
    setSelectedIds(ids);
  };
  const [compareId, setCompareId] = useState<string | null>(null);
  const [scenarioName, setScenarioName] = useState("");
  const [sens, setSens] = useState<SensitivityKey>("base");
  const [sharing, setSharing] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(true);
  const [diagnosisOpen, setDiagnosisOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    name: string;
    hasKids: boolean;
  } | null>(null);

  const requestDelete = (id: string) => {
    const b = buckets.find((x) => x.id === id);
    if (!b) return;
    const hasKids = buckets.some((x) => x.parentId === id);
    setPendingDelete({ id, name: b.name, hasKids });
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const drop = collectDescendantIds(pendingDelete.id, buckets);
    removeBucket(pendingDelete.id);
    setSelectedIds((cur) => cur.filter((id) => !drop.includes(id)));
    setPendingDelete(null);
  };

  const monthlyIncome = sumMonthlyIncome(incomeSources);
  const sum = ratioSum(buckets);
  const sumOk = Math.round(sum) === 100;
  const spendSuggestionPending = useSpendSuggestionPending();

  const patchSources = (next: typeof incomeSources) => {
    setSnapshot({ ...snapshot, incomeSources: next });
  };

  const moveSibling = (id: string, dir: -1 | 1) => {
    const b = buckets.find((x) => x.id === id);
    if (!b) return;
    const sibs = childrenOf(b.parentId, buckets);
    const idx = sibs.findIndex((s) => s.id === id);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= sibs.length) return;
    const reordered = [...sibs];
    [reordered[idx], reordered[j]] = [reordered[j]!, reordered[idx]!];
    const posMap = new Map(reordered.map((s, i) => [s.id, i]));
    setBuckets(buckets.map((x) => (posMap.has(x.id) ? { ...x, position: posMap.get(x.id)! } : x)));
  };

  const moveSourceSibling = (id: string, dir: -1 | 1) => {
    const sorted = [...incomeSources].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    const idx = sorted.findIndex((s) => s.id === id);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= sorted.length) return;
    const reordered = [...sorted];
    [reordered[idx], reordered[j]] = [reordered[j]!, reordered[idx]!];
    patchSources(reordered.map((s, i) => ({ ...s, position: i })));
  };

  useEffect(() => {
    if (sumOk && buckets.length > 0) {
      trackAhaAllocatedOnce({ bucket_count: buckets.length });
    }
  }, [sumOk, buckets.length]);

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
  const selectedSource =
    selectedId && !selected && selectedId !== "__income__" && selectedId !== "__pool__"
      ? incomeSources.find((s) => s.id === selectedId) ?? null
      : null;
  /** 자본소득 합 — y1 패시브에서 빼면 자산 실현분(월) 추정 */
  const capitalMonthly = incomeSources
    .filter((s) => s.type === "capital")
    .reduce((a, s) => a + s.monthly, 0);
  const cashflowMonthly = useMemo(() => {
    const y1 = projection.curve[1];
    if (!y1) return 0;
    return Math.max(0, y1.monthlyPassiveIncome - capitalMonthly);
  }, [projection.curve, capitalMonthly]);
  const cashflowLinked = incomeSources.some((s) => s.id === ASSET_CASHFLOW_SOURCE_ID);
  const showIncomeSources = engine.showIncomeSources !== false;
  const setShowIncomeSources = (show: boolean) => {
    setEngine({ ...engine, showIncomeSources: show });
    if (
      !show &&
      selectedId &&
      incomeSources.some((s) => s.id === selectedId)
    ) {
      selectNode(null);
    }
  };
  const linkCashflowToIncome = () => {
    const amt = Math.round(cashflowMonthly);
    if (amt <= 0) return;
    if (cashflowLinked) {
      patchSources(
        incomeSources.map((s) =>
          s.id === ASSET_CASHFLOW_SOURCE_ID
            ? { ...s, monthly: amt, name: s.name || "자산 현금흐름" }
            : s,
        ),
      );
      return;
    }
    const maxPos = incomeSources.reduce((m, s) => Math.max(m, s.position ?? 0), -1);
    patchSources([
      ...incomeSources,
      {
        id: ASSET_CASHFLOW_SOURCE_ID,
        type: "capital" as const,
        monthly: amt,
        name: "자산 현금흐름",
        position: maxPos + 1,
      },
    ]);
  };
  const targetYears = vision?.targetYears ?? 15;
  const atYear = (curve: typeof projection.curve) =>
    curve.find((p) => p.year === targetYears) ?? curve[curve.length - 1];
  const atTarget = atYear(projection.curve);
  const lowAt = atYear(band.low.curve);
  const highAt = atYear(band.high.curve);

  const nudge = vision ? needsRealityNudge(projection.targetReachYear, targetYears) : false;

  const handleShare = async () => {
    setSharing(true);
    try {
      const blob = await renderShareCard({
        curve: projection.curve,
        goalNetworth: vision?.goalNetworth,
        targetYears,
        atTargetNetWorth: atTarget.totalNetWorth,
        lowNetWorth: lowAt.totalNetWorth,
        highNetWorth: highAt.totalNetWorth,
        targetReachYear: projection.targetReachYear,
        achievementPct: projection.achievementPct,
      });
      await shareOrDownload(blob);
      track("share_card_shared", {
        target_years: targetYears,
        achievement_pct: Math.round(projection.achievementPct),
      });
    } catch (e) {
      console.error("[share]", e);
    } finally {
      setSharing(false);
    }
  };

  const duplicate = (b: Bucket) => {
    const id = `b_${buckets.length}_${Math.random().toString(36).slice(2, 8)}`;
    const pos = childrenOf(b.parentId, buckets).length;
    addBucket({ ...b, id, name: `${b.name} 복제`, position: pos, parentId: b.parentId ?? null });
  };

  return (
    <div className="space-y-5">
      {/* 상단바 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-sm text-ink-600">
          <Button
            variant="outline"
            className="!px-3 !py-1.5 text-sm"
            onClick={() => setDiagnosisOpen(true)}
          >
            <Icon name="diagnosis" size={15} />
            내 현황
          </Button>
          {vision && (
            <span className="flex items-center gap-1.5 font-semibold">
              <Icon name="target" size={16} className="text-brand-600" />
              목표 {formatKRW(vision.goalNetworth)} · {vision.targetYears}년 뒤
            </span>
          )}
        </div>
        <Badge tone={sumOk ? "emerald" : "amber"}>
          수입 배분 {Math.round(sum)}% {sumOk ? "✓" : "(루트 합 100%)"}
        </Badge>
      </div>

      <DiagnosisModal open={diagnosisOpen} onClose={() => setDiagnosisOpen(false)} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* 항목 추가 */}
        {paletteOpen ? (
          <Card pad={false} className="shrink-0 lg:w-[200px]">
            <div className="flex items-center justify-between border-b border-ink-100 px-3 py-2.5">
              <span className="text-sm font-bold text-ink-800">항목 추가</span>
              <button
                onClick={() => setPaletteOpen(false)}
                aria-label="접기"
                className="text-ink-400 hover:text-ink-700"
              >
                <Icon name="x" size={16} />
              </button>
            </div>
            <div className="p-3">
              <Palette
                buckets={buckets}
                selectedId={selected && selectedId ? selectedId : null}
                incomeCount={incomeSources.length}
                onAdd={addBucket}
                onAddIncome={(s) => {
                  patchSources([...incomeSources, s]);
                  if (s.id) selectNode(s.id);
                }}
              />
            </div>
          </Card>
        ) : (
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex shrink-0 items-center gap-1.5 self-start rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-50"
          >
            <Icon name="plus" size={16} /> 항목 추가
          </button>
        )}

        {/* 흐름도 + 결과 */}
        <div className="min-w-0 flex-1 space-y-4">
          {buckets.length > 0 && (
            <div className="space-y-2">
              <SpendRatioSuggestionBar />
              <PushBudgetToVariableBar />
            </div>
          )}
          <EngineCanvas
            buckets={buckets}
            engine={engine}
            incomeSources={incomeSources}
            selectedIds={selectedIds}
            onSelect={selectNode}
            onAdd={addBucket}
            onRequestDelete={requestDelete}
            spendSuggestionPending={spendSuggestionPending}
            cashflowMonthly={cashflowMonthly}
            onOpenDiagnosis={() => setDiagnosisOpen(true)}
            onShowIncomeSourcesChange={setShowIncomeSources}
            onMoveNodes={(moves) => {
              const byId = new Map(moves.map((m) => [m.id, m]));
              let nextEngine = { ...engine };
              let engineTouched = false;
              const incomeMove = byId.get("__income__");
              if (incomeMove) {
                nextEngine = {
                  ...nextEngine,
                  incomeCanvasX: incomeMove.x,
                  incomeCanvasY: incomeMove.y,
                };
                engineTouched = true;
              }
              const poolMove = byId.get("__pool__");
              if (poolMove) {
                nextEngine = {
                  ...nextEngine,
                  poolCanvasX: poolMove.x,
                  poolCanvasY: poolMove.y,
                };
                engineTouched = true;
              }
              let sourcesTouched = false;
              const nextSources = incomeSources.map((s) => {
                if (!s.id) return s;
                const m = byId.get(s.id);
                if (!m) return s;
                sourcesTouched = true;
                return { ...s, canvasX: m.x, canvasY: m.y };
              });
              const nextBuckets = buckets.map((b) => {
                const m = byId.get(b.id);
                return m ? { ...b, canvasX: m.x, canvasY: m.y } : b;
              });
              const bucketsTouched = nextBuckets.some(
                (b, i) => b.canvasX !== buckets[i]?.canvasX || b.canvasY !== buckets[i]?.canvasY,
              );
              if (engineTouched || bucketsTouched) {
                setEngine({
                  ...nextEngine,
                  buckets: bucketsTouched ? nextBuckets : nextEngine.buckets,
                });
              }
              if (sourcesTouched) patchSources(nextSources);
            }}
            onEdgeControl={(edgeId, point) => {
              const prev = engine.edgeControls ?? {};
              if (point == null) {
                const { [edgeId]: _, ...rest } = prev;
                setEngine({ ...engine, edgeControls: rest });
                return;
              }
              setEngine({
                ...engine,
                edgeControls: { ...prev, [edgeId]: point },
              });
            }}
            onSelectIds={selectNodes}
            onResetLayout={() => {
              setEngine({
                ...engine,
                buckets: buckets.map((b) => ({ ...b, canvasX: null, canvasY: null })),
                incomeCanvasX: null,
                incomeCanvasY: null,
                poolCanvasX: null,
                poolCanvasY: null,
                edgeControls: {},
              });
              patchSources(
                incomeSources.map((s) => ({ ...s, canvasX: null, canvasY: null })),
              );
            }}
            onRecommend={() => {
              setEngine(suggestEngineFromSnapshot(snapshot));
              track("engine_recommend_applied", { source: "canvas_empty" });
            }}
          />

          <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-sm font-bold text-ink-800">
            <Icon name="trending-up" size={16} className="text-gold-500" />
            예상 결과
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
                  onClick={() => {
                    setSens(k);
                    track("sensitivity_changed", { sensitivity: k });
                  }}
                  className={
                    "rounded-md px-2.5 py-1 font-semibold transition-colors " +
                    (sens === k
                      ? "bg-sage-500 text-white"
                      : "text-ink-500 hover:bg-ink-100")
                  }
                >
                  {SENSITIVITY[k].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mb-3 text-xs text-ink-400">
          {SENSITIVITY[sens].label} = 기대수익률{" "}
          {SENSITIVITY[sens].deltaPp > 0 ? "+" : ""}
          {SENSITIVITY[sens].deltaPp}%p · 띠는 보수(−3)~공격(+3) 범위
        </p>

        {nudge && (
          <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <Icon name="info" size={16} className="mt-0.5 shrink-0" />
            <span>
              이 속도면 {targetYears}년 안에 목표 도달이 어려울 수 있어요. 저축을 늘리거나 목표
              시점을 늦춰 보세요.
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
              sub={
                vision
                  ? `현재 달성 ${projection.achievementPct.toFixed(1)}% · 지금 순자산÷목표`
                  : undefined
              }
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

        {sumOk && <LeadCta placement="engine_result" className="mt-4" />}

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
                track("scenario_saved", { scenario_count: scenarios.length + 1 });
                setScenarioName("");
              }}
              disabled={buckets.length === 0 || scenarios.length >= MAX_SCENARIOS_LIMIT}
            >
              현재 배분 저장
            </Button>
            <span className="text-xs text-ink-400">
              {scenarios.length}/{MAX_SCENARIOS_LIMIT}
            </span>
            <Button
              variant="outline"
              className="ml-auto"
              onClick={handleShare}
              disabled={buckets.length === 0 || sharing}
            >
              <Icon name="image" size={15} /> {sharing ? "생성 중…" : "결과 공유"}
            </Button>
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

          <div className="mt-3">
            <AssumptionNote />
          </div>
          </Card>
        </div>

        {/* 항목 수정 — 항상 고정 폭 */}
        <Card
          pad={false}
          className="sticky top-4 hidden max-h-[calc(100vh-2rem)] w-[280px] shrink-0 overflow-y-auto border-ink-200 lg:block"
        >
          <div className="flex items-center justify-between border-b border-ink-100 px-3 py-2.5">
            <span className="text-sm font-bold text-ink-800">항목 수정</span>
            {selectedId && (
              <button
                onClick={() => selectNode(null)}
                aria-label="선택 해제"
                className="text-ink-400 hover:text-ink-700"
              >
                <Icon name="x" size={16} />
              </button>
            )}
          </div>
          <div className="p-3">
            {selectedId === "__income__" ? (
              <IncomeHubInspector
                monthlyIncome={monthlyIncome}
                showIncomeSources={showIncomeSources}
                onShowIncomeSourcesChange={setShowIncomeSources}
                onAddGroup={() => {
                  const pos = childrenOf(null, buckets).length;
                  addBucket(bucketFromPreset(GROUP_PRESETS[0]!, pos, null));
                }}
              />
            ) : selectedId === "__pool__" ? (
              <PoolHubInspector
                cashflowMonthly={cashflowMonthly}
                cashflowLinked={cashflowLinked}
                onLinkCashflow={linkCashflowToIncome}
              />
            ) : selectedSource ? (
              <SourceInspector
                source={selectedSource}
                onChange={(patch) =>
                  patchSources(
                    incomeSources.map((s) =>
                      s.id === selectedSource.id ? { ...s, ...patch } : s,
                    ),
                  )
                }
                onDelete={() => {
                  patchSources(incomeSources.filter((s) => s.id !== selectedSource.id));
                  selectNode(null);
                }}
                onMoveSibling={(dir) => moveSourceSibling(selectedSource.id!, dir)}
              />
            ) : selected ? (
              <>
                <Inspector
                  bucket={selected}
                  all={buckets}
                  monthlyIncome={monthlyIncome}
                  onChange={(patch) => updateBucket(selected.id, patch)}
                  onDelete={() => requestDelete(selected.id)}
                  onDuplicate={() => duplicate(selected)}
                  onMoveSibling={(dir) => moveSibling(selected.id, dir)}
                />
                <div
                  className={`mt-4 rounded-lg border px-3 py-2 text-center text-xs font-semibold ${
                    sumOk
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  월수입 대비 루트 {Math.round(sum)}%{" "}
                  {sumOk ? "" : sum > 100 ? "· 초과" : "· 미달"}
                </div>
              </>
            ) : selectedIds.length > 1 ? (
              <div className="px-2 py-8 text-center text-sm text-ink-500">
                {selectedIds.length}개 선택 · 드래그하면 함께 움직여요
              </div>
            ) : (
              <div className="flex flex-col items-center px-2 py-10 text-center">
                <Icon name="layers" size={28} className="text-ink-300" />
                <p className="mt-3 text-sm font-semibold text-ink-600">노드를 선택하세요</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-400">
                  월수입 · 자산 · 투자/저축/지출
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <BottomSheet
        open={selectedId !== null}
        onClose={() => selectNode(null)}
        title="항목 수정"
      >
        {selectedId === "__income__" && (
          <IncomeHubInspector
            monthlyIncome={monthlyIncome}
            showIncomeSources={showIncomeSources}
            onShowIncomeSourcesChange={setShowIncomeSources}
            onAddGroup={() => {
              const pos = childrenOf(null, buckets).length;
              addBucket(bucketFromPreset(GROUP_PRESETS[0]!, pos, null));
            }}
          />
        )}
        {selectedId === "__pool__" && (
          <PoolHubInspector
            cashflowMonthly={cashflowMonthly}
            cashflowLinked={cashflowLinked}
            onLinkCashflow={linkCashflowToIncome}
          />
        )}
        {selectedSource && (
          <SourceInspector
            source={selectedSource}
            onChange={(patch) =>
              patchSources(
                incomeSources.map((s) =>
                  s.id === selectedSource.id ? { ...s, ...patch } : s,
                ),
              )
            }
            onDelete={() => {
              patchSources(incomeSources.filter((s) => s.id !== selectedSource.id));
              selectNode(null);
            }}
            onMoveSibling={(dir) => moveSourceSibling(selectedSource.id!, dir)}
          />
        )}
        {selected && (
          <Inspector
            bucket={selected}
            all={buckets}
            monthlyIncome={monthlyIncome}
            onChange={(patch) => updateBucket(selected.id, patch)}
            onDelete={() => requestDelete(selected.id)}
            onDuplicate={() => duplicate(selected)}
            onMoveSibling={(dir) => moveSibling(selected.id, dir)}
          />
        )}
      </BottomSheet>

      <ConfirmModal
        open={pendingDelete !== null}
        title="항목 삭제"
        message={
          pendingDelete?.hasKids
            ? `"${pendingDelete.name}"과 하위 항목을 모두 삭제할까요?`
            : `"${pendingDelete?.name ?? ""}" 항목을 삭제할까요?`
        }
        confirmLabel="삭제"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
