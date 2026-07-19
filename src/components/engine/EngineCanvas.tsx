"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Bucket, BucketCategory, EngineConfig, IncomeSource } from "@/lib/types";
import {
  GROUP_PRESETS,
  ITEM_PRESETS,
  bucketFromPreset,
  customBucket,
  presetByKey,
  type BucketPreset,
} from "@/lib/catalog";
import {
  childrenOf,
  isLeaf,
  monthlyManwon,
  pathToRoot,
  ratioOfTotal,
} from "@/lib/engine/tree";
import {
  anchorsFromEngine,
  edgePath,
  layoutEngineGraph,
  type GraphNode,
} from "@/lib/engine/layout";
import { incomeSourceLabel, normalizeIncomeSources, sumMonthlyIncome } from "@/lib/income";
import { Button, EmptyState, TextInput } from "@/components/ui";
import { Icon } from "@/components/Icon";

const CAT_NODE: Record<string, string> = {
  invest: "border-invest-500 bg-invest-50 text-invest-700",
  save: "border-save-500 bg-save-50 text-save-700",
  spend: "border-spend-500 bg-spend-50 text-spend-700",
};

function linkWidth(ratio: number) {
  return 1.4 + (Math.max(0, Math.min(100, ratio)) / 100) * 7;
}

function QuickAddMenu({
  parentId,
  parent,
  buckets,
  onAdd,
  onClose,
}: {
  parentId: string | null;
  parent: Bucket | null;
  buckets: Bucket[];
  onAdd: (b: Bucket) => void;
  onClose: () => void;
}) {
  const [customName, setCustomName] = useState("");
  const underIncome = parentId === null;
  const cat: BucketCategory = parent?.category ?? "invest";
  const presets: BucketPreset[] = underIncome
    ? GROUP_PRESETS
    : ITEM_PRESETS.filter((p) => p.category === cat);

  const add = (p: BucketPreset) => {
    const pid = underIncome ? null : parentId;
    const pos = childrenOf(pid, buckets).length;
    onAdd(bucketFromPreset(p, pos, pid));
    onClose();
  };

  return (
    <div className="absolute bottom-3 left-3 right-3 z-10 mx-auto max-w-md rounded-xl border border-ink-200 bg-white p-3 shadow-lg sm:left-auto sm:right-3 sm:w-72">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-bold text-ink-800">
          {underIncome ? "수입 아래에 묶음 추가" : `"${parent?.name}" 아래에 추가`}
        </div>
        <button type="button" onClick={onClose} className="text-ink-400 hover:text-ink-700" aria-label="닫기">
          <Icon name="x" size={16} />
        </button>
      </div>
      <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
        {presets.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => add(p)}
            className="flex items-center gap-2 rounded-lg border border-ink-100 px-2.5 py-2 text-left text-sm font-semibold text-ink-700 hover:bg-ink-50"
          >
            <Icon name={p.icon} size={16} />
            {p.name}
          </button>
        ))}
      </div>
      {!underIncome && (
        <div className="mt-2 border-t border-ink-100 pt-2">
          <TextInput value={customName} onChange={setCustomName} placeholder="직접 이름" />
          <Button
            className="mt-2 w-full"
            disabled={!customName.trim()}
            onClick={() => {
              const pos = childrenOf(parentId, buckets).length;
              onAdd(customBucket(cat, customName.trim(), pos, parentId));
              onClose();
            }}
          >
            추가
          </Button>
        </div>
      )}
    </div>
  );
}

type DragState = {
  id: string;
  grabDX: number;
  grabDY: number;
  x: number;
  y: number;
  originX: number;
  originY: number;
  moved: boolean;
};

function startDrag(
  e: React.PointerEvent,
  id: string,
  n: { x: number; y: number },
  clientToSvg: (x: number, y: number) => { x: number; y: number },
  dragRef: React.MutableRefObject<DragState | null>,
  setDrag: (d: DragState) => void,
) {
  if ((e.target as HTMLElement).closest("button")) return;
  e.preventDefault();
  const p = clientToSvg(e.clientX, e.clientY);
  const next: DragState = {
    id,
    grabDX: p.x - n.x,
    grabDY: p.y - n.y,
    x: n.x,
    y: n.y,
    originX: n.x,
    originY: n.y,
    moved: false,
  };
  dragRef.current = next;
  setDrag(next);
}

export function EngineCanvas({
  buckets,
  engine,
  incomeSources,
  selectedId,
  onSelect,
  onAdd,
  onRequestDelete,
  onMoveNode,
  onResetLayout,
  onRecommend,
  spendSuggestionPending = false,
}: {
  buckets: Bucket[];
  engine: EngineConfig;
  incomeSources: IncomeSource[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAdd: (b: Bucket) => void;
  onRequestDelete: (id: string) => void;
  onMoveNode: (id: string, x: number, y: number) => void;
  onResetLayout: () => void;
  onRecommend: () => void;
  /** Phase B — 지출 루트에 실측 제안 배지 */
  spendSuggestionPending?: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [quickAddParent, setQuickAddParent] = useState<string | null | undefined>(undefined);
  const [drag, setDrag] = useState<DragState | null>(null);

  const sources = useMemo(() => normalizeIncomeSources(incomeSources), [incomeSources]);
  const monthlyIncome = sumMonthlyIncome(sources);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setAnimate(!mq.matches);
    const on = () => setAnimate(!mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const clientToSvg = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  };

  useEffect(() => {
    if (!drag) return;
    const onMove = (e: PointerEvent) => {
      const cur = dragRef.current;
      if (!cur) return;
      const p = clientToSvg(e.clientX, e.clientY);
      const x = p.x - cur.grabDX;
      const y = p.y - cur.grabDY;
      const moved = cur.moved || Math.hypot(x - cur.originX, y - cur.originY) > 4;
      const next = { ...cur, x, y, moved };
      dragRef.current = next;
      setDrag(next);
    };
    const onUp = () => {
      const cur = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      if (!cur) return;
      if (cur.moved) onMoveNode(cur.id, Math.round(cur.x), Math.round(cur.y));
      else onSelect(cur.id);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag?.id]);

  const { nodes, edges, width, height } = useMemo(
    () =>
      layoutEngineGraph({
        buckets,
        incomeSources: sources,
        anchors: anchorsFromEngine(engine),
        drag: drag ? { id: drag.id, x: drag.x, y: drag.y } : null,
      }),
    [buckets, sources, engine, drag],
  );

  const crumb =
    selectedId && buckets.some((b) => b.id === selectedId) ? pathToRoot(selectedId, buckets) : [];
  const hasCustomLayout =
    buckets.some((b) => b.canvasX != null || b.canvasY != null) ||
    sources.some((s) => s.canvasX != null || s.canvasY != null) ||
    engine.incomeCanvasX != null ||
    engine.poolCanvasX != null;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const key = e.dataTransfer.getData("application/bucket-preset");
    const preset = presetByKey(key);
    if (!preset) return;
    const parentId =
      preset.kind === "group"
        ? null
        : selectedId && buckets.some((b) => b.id === selectedId)
          ? selectedId
          : null;
    const siblings = childrenOf(parentId, buckets);
    onAdd(bucketFromPreset(preset, siblings.length, parentId));
  };

  if (buckets.length === 0 && sources.every((s) => s.monthly === 0)) {
    return (
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative flex min-h-[420px] items-center justify-center rounded-xl border bg-white ${
          dragOver ? "border-2 border-dashed border-brand-400 bg-brand-50/40" : "border-ink-200"
        }`}
      >
        <EmptyState
          icon="layers"
          title="수입 항목과 배분 트리를 만드세요"
          desc="왼쪽 수입 → 월 수입 합산 → 투자·저축·지출로 흘러갑니다."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={onRecommend}>추천 배분으로 시작</Button>
              <Button variant="outline" onClick={() => setQuickAddParent(null)}>
                묶음부터 추가
              </Button>
            </div>
          }
        />
        {quickAddParent !== undefined && (
          <QuickAddMenu
            parentId={quickAddParent}
            parent={null}
            buckets={buckets}
            onAdd={onAdd}
            onClose={() => setQuickAddParent(undefined)}
          />
        )}
      </div>
    );
  }

  const renderBucket = (n: GraphNode) => {
    const b = n.bucket!;
    const leaf = isLeaf(b, buckets);
    const ofTotal = ratioOfTotal(b, buckets);
    const month = monthlyManwon(b, buckets, monthlyIncome);
    const selected = b.id === selectedId;
    const parentLabel = b.parentId ? "상위" : "수입";
    const compact = n.depth >= 2;
    const dragging = drag?.id === b.id;

    return (
      <foreignObject key={n.id} x={n.x} y={n.y} width={n.w} height={n.h}>
        <div
          role="button"
          tabIndex={0}
          onPointerDown={(e) => startDrag(e, b.id, n, clientToSvg, dragRef, setDrag)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect(b.id);
            }
          }}
          className={`group flex h-full w-full select-none flex-col justify-center border text-left transition-shadow ${
            compact ? "rounded-lg px-2 py-1" : "rounded-xl px-2.5 py-1.5"
          } ${CAT_NODE[b.category]} ${
            selected ? "ring-2 ring-brand-500 shadow-sm" : "hover:shadow-sm"
          } ${dragging ? "cursor-grabbing opacity-90 shadow-md" : "cursor-grab"}`}
        >
          <div className="flex items-start gap-1">
            <div className="min-w-0 flex-1">
              <div
                className={`flex items-center gap-0.5 font-bold leading-tight ${
                  compact ? "text-[11px]" : "text-[13px]"
                }`}
              >
                {b.isLocked && <Icon name="lock" size={compact ? 10 : 11} className="text-locked" />}
                <span className="truncate">{b.name}</span>
                {spendSuggestionPending &&
                  b.category === "spend" &&
                  !b.parentId &&
                  !compact && (
                    <span className="ml-0.5 shrink-0 rounded bg-white/80 px-1 py-px text-[8px] font-bold text-spend-700">
                      실측
                    </span>
                  )}
              </div>
              <div
                className={`mt-0.5 flex flex-wrap gap-x-1.5 opacity-80 ${
                  compact ? "text-[9px]" : "text-[10px]"
                }`}
              >
                <span className="tnum font-semibold">
                  {parentLabel} {b.ratioPct}%
                </span>
                {!compact && (
                  <span className="tnum">전체 {ofTotal.toFixed(1).replace(/\.0$/, "")}%</span>
                )}
                <span className="tnum font-semibold">월 {month}만</span>
              </div>
            </div>
            <button
              type="button"
              aria-label={`${b.name} 삭제`}
              onClick={(e) => {
                e.stopPropagation();
                onRequestDelete(b.id);
              }}
              className="shrink-0 rounded p-0.5 text-ink-400 opacity-0 hover:text-red-500 group-hover:opacity-100"
            >
              <Icon name="x" size={compact ? 11 : 12} />
            </button>
          </div>
          {selected && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setQuickAddParent(b.id);
              }}
              className="mt-1 flex w-full items-center justify-center gap-0.5 rounded-md bg-white/70 py-0.5 text-[10px] font-bold text-ink-600 hover:bg-white"
            >
              <Icon name="plus" size={11} /> 하위
            </button>
          )}
          {!leaf && !selected && !compact && (
            <div className="mt-0.5 text-[9px] font-semibold opacity-50">묶음</div>
          )}
        </div>
      </foreignObject>
    );
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`relative rounded-xl border bg-white transition-colors ${
        dragOver ? "border-2 border-dashed border-brand-400 bg-brand-50/40" : "border-ink-200"
      }`}
    >
      <div className="flex flex-wrap items-center gap-1 border-b border-ink-100 px-3 py-2 text-xs">
        <button
          type="button"
          onClick={() => onSelect("__income__")}
          className={`rounded-md px-1.5 py-0.5 font-semibold ${
            selectedId === "__income__"
              ? "bg-brand-50 text-brand-700"
              : "text-brand-600 hover:bg-brand-50"
          }`}
        >
          월 수입
        </button>
        {crumb.map((b) => (
          <span key={b.id} className="flex items-center gap-1">
            <Icon name="chevron-right" size={12} className="text-ink-300" />
            <button
              type="button"
              onClick={() => onSelect(b.id)}
              className={`rounded-md px-1.5 py-0.5 font-semibold ${
                b.id === selectedId ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50"
              }`}
            >
              {b.name}
            </button>
          </span>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {hasCustomLayout && (
            <button
              type="button"
              onClick={onResetLayout}
              className="rounded-md px-1.5 py-0.5 font-semibold text-ink-500 hover:bg-ink-100 hover:text-ink-700"
            >
              자동 정렬
            </button>
          )}
          <span className="tnum font-semibold text-ink-500">합산 {monthlyIncome}만</span>
        </div>
      </div>

      <div className="overflow-x-auto p-2">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[780px] touch-none"
          style={{ height: Math.min(560, Math.max(380, height * 0.52)), minHeight: 380 }}
          preserveAspectRatio="xMidYMid meet"
        >
          <text
            x={width / 2}
            y={16}
            textAnchor="middle"
            fontSize="10"
            fontWeight="600"
            fill="var(--color-ink-400)"
          >
            수입 항목 → 월 수입 → 배분 · 투자·저축은 합류(중간) · 지출은 아래 밴드
          </text>

          {nodes.map((n) => {
            if (n.kind === "source") {
              const src = n.incomeSource!;
              const selected = selectedId === n.id;
              const dragging = drag?.id === n.id;
              return (
                <foreignObject key={n.id} x={n.x} y={n.y} width={n.w} height={n.h}>
                  <div
                    role="button"
                    tabIndex={0}
                    onPointerDown={(e) => startDrag(e, n.id, n, clientToSvg, dragRef, setDrag)}
                    className={`flex h-full w-full cursor-grab select-none flex-col justify-center rounded-lg border border-brand-200 bg-white px-2 text-left ${
                      selected ? "ring-2 ring-brand-500" : "hover:shadow-sm"
                    } ${dragging ? "cursor-grabbing opacity-90" : ""}`}
                  >
                    <div className="truncate text-[11px] font-bold text-brand-800">
                      {incomeSourceLabel(src)}
                    </div>
                    <div className="tnum text-sm font-extrabold text-brand-700">
                      월 {src.monthly}만
                    </div>
                  </div>
                </foreignObject>
              );
            }

            if (n.kind === "income") {
              const selected = selectedId === "__income__";
              const dragging = drag?.id === "__income__";
              return (
                <foreignObject key={n.id} x={n.x} y={n.y} width={n.w} height={n.h}>
                  <div
                    role="button"
                    tabIndex={0}
                    onPointerDown={(e) =>
                      startDrag(e, "__income__", n, clientToSvg, dragRef, setDrag)
                    }
                    className={`flex h-full w-full cursor-grab select-none flex-col justify-center rounded-xl border border-brand-200 bg-brand-50 px-2 text-center ${
                      selected ? "ring-2 ring-brand-500" : "hover:shadow-sm"
                    } ${dragging ? "cursor-grabbing opacity-90" : ""}`}
                  >
                    <div className="text-[11px] font-semibold text-brand-600">월 수입</div>
                    <div className="tnum mt-0.5 text-base font-extrabold text-brand-800">
                      {monthlyIncome}만
                    </div>
                    <div className="mt-0.5 text-[9px] text-brand-400">항목 합산</div>
                    {selected && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickAddParent(null);
                        }}
                        className="mx-auto mt-1.5 flex items-center gap-0.5 rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-brand-600 hover:bg-white"
                      >
                        <Icon name="plus" size={11} /> 묶음
                      </button>
                    )}
                  </div>
                </foreignObject>
              );
            }

            if (n.kind === "pool") {
              const selected = selectedId === "__pool__";
              const dragging = drag?.id === "__pool__";
              return (
                <foreignObject key={n.id} x={n.x} y={n.y} width={n.w} height={n.h}>
                  <div
                    role="button"
                    tabIndex={0}
                    onPointerDown={(e) =>
                      startDrag(e, "__pool__", n, clientToSvg, dragRef, setDrag)
                    }
                    className={`flex h-full w-full cursor-grab select-none flex-col items-center justify-center rounded-xl bg-brand-800 px-2 text-center text-white ${
                      selected ? "ring-2 ring-gold-400" : ""
                    } ${dragging ? "cursor-grabbing opacity-90" : ""}`}
                  >
                    <div className="text-sm font-bold">투자·저축 합류</div>
                    <div className="mt-0.5 text-[10px] opacity-80">중간 집계</div>
                    <div className="mt-1.5 text-[9px] leading-relaxed opacity-60">
                      최종 싱크 아님
                      <br />
                      실현→수입 재유입
                    </div>
                  </div>
                </foreignObject>
              );
            }

            return renderBucket(n);
          })}

          {edges.map((e, i) => {
            const reinvest = e.fromId === "__pool__" && e.toId === "__income__";
            const d = edgePath(e, reinvest);
            const stroke =
              e.tone === "spend"
                ? "var(--color-spend-500)"
                : e.tone === "income"
                  ? "var(--color-brand-400)"
                  : e.tone === "dashed"
                    ? "var(--color-brand-300)"
                    : "var(--color-brand-400)";
            return (
              <g key={e.id} style={{ pointerEvents: "none" }}>
                <path
                  id={e.id}
                  d={d}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={e.tone === "dashed" ? 1.3 : linkWidth(e.ratio)}
                  strokeDasharray={e.tone === "dashed" ? "5 5" : undefined}
                  opacity={0.9}
                />
                {animate && e.tone !== "dashed" && !drag && (
                  <>
                    <path
                      d={d}
                      fill="none"
                      stroke={
                        e.tone === "spend"
                          ? "var(--color-spend-600)"
                          : e.tone === "income"
                            ? "var(--color-gold-400)"
                            : "var(--color-brand-500)"
                      }
                      strokeWidth="1.5"
                      strokeDasharray="2 10"
                      strokeLinecap="round"
                      className="flow-link"
                      opacity="0.9"
                    />
                    <circle
                      r="3"
                      fill={
                        e.tone === "spend"
                          ? "var(--color-spend-500)"
                          : e.tone === "income"
                            ? "var(--color-gold-400)"
                            : "var(--color-gold-400)"
                      }
                    >
                      <animateMotion
                        dur={`${2.2 - Math.min(1, Math.max(e.ratio, 15) / 120)}s`}
                        repeatCount="indefinite"
                        begin={`${(i % 5) * 0.25}s`}
                      >
                        <mpath href={`#${e.id}`} />
                      </animateMotion>
                    </circle>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <p className="border-t border-ink-100 px-3 py-2 text-[11px] text-ink-400">
        드래그로 위치 · 월수입 클릭 시 묶음 추가 · 수입 항목은 왼쪽에서 합산 · 지출은 아래 밴드
      </p>

      {quickAddParent !== undefined && (
        <QuickAddMenu
          parentId={quickAddParent}
          parent={quickAddParent ? buckets.find((b) => b.id === quickAddParent) ?? null : null}
          buckets={buckets}
          onAdd={onAdd}
          onClose={() => setQuickAddParent(undefined)}
        />
      )}
    </div>
  );
}
