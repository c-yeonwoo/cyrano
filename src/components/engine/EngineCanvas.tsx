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
  defaultEdgeControl,
  edgePath,
  layoutEngineGraph,
  type GraphNode,
} from "@/lib/engine/layout";
import {
  ASSET_CASHFLOW_SOURCE_ID,
  incomeSourceLabel,
  normalizeIncomeSources,
  sumMonthlyIncome,
} from "@/lib/income";
import { Button, EmptyState, TextInput } from "@/components/ui";
import { Icon } from "@/components/Icon";

/** 투자 amber · 저축 emerald · 지출 rose */
const CAT_NODE: Record<string, string> = {
  invest: "border-invest-300 border-l-[3px] border-l-invest-500 bg-invest-50 text-invest-800",
  save: "border-save-300 border-l-[3px] border-l-save-500 bg-save-50 text-save-800",
  spend: "border-spend-300 border-l-[3px] border-l-spend-500 bg-spend-50 text-spend-800",
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
  /** node = 노드 이동 / edge = 선 제어점만 (노드 고정) */
  mode: "node" | "edge";
  grabDX: number;
  grabDY: number;
  x: number;
  y: number;
  originX: number;
  originY: number;
  moved: boolean;
  /** 복수 선택 시 함께 이동할 노드 원점 */
  group: { id: string; originX: number; originY: number }[];
  /** edge 모드: 양끝 id (클릭 선택용) */
  edgeEnds?: { fromId: string; toId: string };
};

type MarqueeState = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  additive: boolean;
};

type PanDrag = {
  startClientX: number;
  startClientY: number;
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
  group: { id: string; originX: number; originY: number }[],
) {
  if ((e.target as HTMLElement).closest("button")) return;
  e.preventDefault();
  const p = clientToSvg(e.clientX, e.clientY);
  const next: DragState = {
    id,
    mode: "node",
    grabDX: p.x - n.x,
    grabDY: p.y - n.y,
    x: n.x,
    y: n.y,
    originX: n.x,
    originY: n.y,
    moved: false,
    group,
  };
  dragRef.current = next;
  setDrag(next);
}

/** 레거시 성장/안전 → 투자/저축 */
function displayBucketName(name: string): string {
  if (name === "성장") return "투자";
  if (name === "안전") return "저축";
  return name;
}

export function EngineCanvas({
  buckets,
  engine,
  incomeSources,
  selectedIds,
  onSelect,
  onAdd,
  onRequestDelete,
  onMoveNodes,
  onEdgeControl,
  onSelectIds,
  onResetLayout,
  onRecommend,
  onOpenDiagnosis,
  onShowIncomeSourcesChange,
  spendSuggestionPending = false,
  cashflowMonthly = 0,
}: {
  buckets: Bucket[];
  engine: EngineConfig;
  incomeSources: IncomeSource[];
  selectedIds: string[];
  onSelect: (
    id: string | null,
    opts?: { toggle?: boolean; also?: string[] },
  ) => void;
  onAdd: (b: Bucket) => void;
  onRequestDelete: (id: string) => void;
  onMoveNodes: (moves: { id: string; x: number; y: number }[]) => void;
  /** 선 제어점 저장 (null이면 해당 선 초기화) */
  onEdgeControl: (edgeId: string, point: { x: number; y: number } | null) => void;
  /** 마퀴 등으로 여러 id 선택 */
  onSelectIds: (ids: string[], opts?: { additive?: boolean }) => void;
  onResetLayout: () => void;
  onRecommend: () => void;
  /** 내 현황(진단) 모달 */
  onOpenDiagnosis?: () => void;
  /** 월수입 — 수입원 노드 표시 on/off */
  onShowIncomeSourcesChange?: (show: boolean) => void;
  /** Phase B — 지출 루트에 실측 제안 배지 */
  spendSuggestionPending?: boolean;
  /** 자산→월수입 현금흐름 추정(만원/월) */
  cashflowMonthly?: number;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const marqueeRef = useRef<MarqueeState | null>(null);
  const panDragRef = useRef<PanDrag | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [quickAddParent, setQuickAddParent] = useState<string | null | undefined>(undefined);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [marquee, setMarquee] = useState<MarqueeState | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);
  zoomRef.current = zoom;
  const panRef = useRef(pan);
  panRef.current = pan;

  const sources = useMemo(() => normalizeIncomeSources(incomeSources), [incomeSources]);
  const monthlyIncome = sumMonthlyIncome(sources);
  const showIncomeSources = engine.showIncomeSources !== false;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setAnimate(!mq.matches);
    const on = () => setAnimate(!mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.92 : 1.08;
      const next = Math.min(2.2, Math.max(0.45, zoomRef.current * factor));
      zoomRef.current = next;
      setZoom(next);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
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

  /** 팬(translate)이 적용된 콘텐츠 좌표 */
  const clientToContent = (clientX: number, clientY: number) => {
    const p = clientToSvg(clientX, clientY);
    return { x: p.x - panRef.current.x, y: p.y - panRef.current.y };
  };

  useEffect(() => {
    if (!drag) return;
    const onMove = (e: PointerEvent) => {
      const cur = dragRef.current;
      if (!cur) return;
      const p = clientToContent(e.clientX, e.clientY);
      const x = p.x - cur.grabDX;
      const y = p.y - cur.grabDY;
      const moved = cur.moved || Math.hypot(x - cur.originX, y - cur.originY) > 4;
      const next = { ...cur, x, y, moved };
      dragRef.current = next;
      setDrag(next);
    };
    const onUp = (e: PointerEvent) => {
      const cur = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      if (!cur) return;
      if (cur.mode === "edge") {
        if (cur.moved) {
          onEdgeControl(cur.id, { x: Math.round(cur.x), y: Math.round(cur.y) });
        } else if (cur.edgeEnds) {
          onSelect(cur.edgeEnds.fromId, { also: [cur.edgeEnds.toId] });
        }
        return;
      }
      if (cur.moved) {
        const dx = cur.x - cur.originX;
        const dy = cur.y - cur.originY;
        const targets =
          cur.group.length > 0
            ? cur.group
            : [{ id: cur.id, originX: cur.originX, originY: cur.originY }];
        onMoveNodes(
          targets.map((g) => ({
            id: g.id,
            x: Math.round(g.originX + dx),
            y: Math.round(g.originY + dy),
          })),
        );
      } else {
        onSelect(cur.id, { toggle: e.shiftKey || e.metaKey || e.ctrlKey });
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag?.id, drag?.mode]);

  const { nodes, edges, width, height } = useMemo(
    () =>
      layoutEngineGraph({
        buckets,
        incomeSources: sources,
        anchors: anchorsFromEngine(engine),
        showIncomeSources,
        drag:
          drag && drag.mode === "node"
            ? { id: drag.id, x: drag.x, y: drag.y }
            : null,
      }),
    [buckets, sources, engine, drag, showIncomeSources],
  );

  const selectedId = selectedIds[0] ?? null;
  const dragDx = drag && drag.mode === "node" ? drag.x - drag.originX : 0;
  const dragDy = drag && drag.mode === "node" ? drag.y - drag.originY : 0;
  /** primary는 레이아웃 반영 → 복수 선택 나머지만 오프셋 */
  const groupOffset = (id: string) => {
    if (!drag || drag.mode !== "node") return { dx: 0, dy: 0 };
    if (id === drag.id) return { dx: 0, dy: 0 };
    if (drag.group.some((g) => g.id === id)) return { dx: dragDx, dy: dragDy };
    return { dx: 0, dy: 0 };
  };
  const posOf = (n: GraphNode) => {
    const { dx, dy } = groupOffset(n.id);
    return { x: n.x + dx, y: n.y + dy };
  };
  const shiftedEdge = (e: (typeof edges)[number]) => {
    const a = groupOffset(e.fromId);
    const b = groupOffset(e.toId);
    if (!a.dx && !a.dy && !b.dx && !b.dy) return e;
    return {
      ...e,
      x1: e.x1 + a.dx,
      y1: e.y1 + a.dy,
      x2: e.x2 + b.dx,
      y2: e.y2 + b.dy,
    };
  };
  const edgeControlOf = (edge: { id: string }) => {
    if (drag?.mode === "edge" && drag.id === edge.id) {
      return { x: drag.x, y: drag.y };
    }
    return engine.edgeControls?.[edge.id] ?? null;
  };
  const beginNodeDrag = (
    e: React.PointerEvent,
    id: string,
    n: { x: number; y: number },
  ) => {
    const ids =
      selectedIds.includes(id) && selectedIds.length > 1 ? selectedIds : [id];
    const group = ids.map((gid) => {
      const gn = nodes.find((x) => x.id === gid);
      return { id: gid, originX: gn?.x ?? n.x, originY: gn?.y ?? n.y };
    });
    startDrag(e, id, n, clientToContent, dragRef, setDrag, group);
  };

  const beginEdgeDrag = (
    e: React.PointerEvent,
    edge: { id: string; fromId: string; toId: string; x1: number; y1: number; x2: number; y2: number },
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const saved = engine.edgeControls?.[edge.id];
    const base = saved ?? defaultEdgeControl(edge);
    const p = clientToContent(e.clientX, e.clientY);
    const next: DragState = {
      id: edge.id,
      mode: "edge",
      grabDX: p.x - base.x,
      grabDY: p.y - base.y,
      x: base.x,
      y: base.y,
      originX: base.x,
      originY: base.y,
      moved: false,
      group: [],
      edgeEnds: { fromId: edge.fromId, toId: edge.toId },
    };
    dragRef.current = next;
    setDrag(next);
  };

  const beginMarquee = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const p = clientToContent(e.clientX, e.clientY);
    const next: MarqueeState = {
      x0: p.x,
      y0: p.y,
      x1: p.x,
      y1: p.y,
      additive: true,
    };
    marqueeRef.current = next;
    setMarquee(next);
  };

  const beginPan = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    panDragRef.current = {
      startClientX: e.clientX,
      startClientY: e.clientY,
      originX: panRef.current.x,
      originY: panRef.current.y,
      moved: false,
    };
    setPanning(true);
  };

  const onBackgroundPointerDown = (e: React.PointerEvent) => {
    if (e.shiftKey || e.metaKey || e.ctrlKey) beginMarquee(e);
    else beginPan(e);
  };

  useEffect(() => {
    if (!panning) return;
    const onMove = (e: PointerEvent) => {
      const cur = panDragRef.current;
      const svg = svgRef.current;
      if (!cur || !svg) return;
      const ctm = svg.getScreenCTM();
      const scale = ctm ? ctm.a : 1;
      const dx = (e.clientX - cur.startClientX) / scale;
      const dy = (e.clientY - cur.startClientY) / scale;
      const moved = cur.moved || Math.hypot(dx, dy) > 3;
      panDragRef.current = { ...cur, moved };
      setPan({ x: cur.originX + dx, y: cur.originY + dy });
    };
    const onUp = () => {
      const cur = panDragRef.current;
      panDragRef.current = null;
      setPanning(false);
      if (cur && !cur.moved) onSelect(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panning]);

  useEffect(() => {
    if (!marquee) return;
    const onMove = (e: PointerEvent) => {
      const cur = marqueeRef.current;
      if (!cur) return;
      const p = clientToContent(e.clientX, e.clientY);
      const next = { ...cur, x1: p.x, y1: p.y };
      marqueeRef.current = next;
      setMarquee(next);
    };
    const onUp = () => {
      const cur = marqueeRef.current;
      marqueeRef.current = null;
      setMarquee(null);
      if (!cur) return;
      const x = Math.min(cur.x0, cur.x1);
      const y = Math.min(cur.y0, cur.y1);
      const w = Math.abs(cur.x1 - cur.x0);
      const h = Math.abs(cur.y1 - cur.y0);
      if (w < 4 && h < 4) {
        return;
      }
      const hit = nodes
        .filter((n) => {
          const p = posOf(n);
          return p.x < x + w && p.x + n.w > x && p.y < y + h && p.y + n.h > y;
        })
        .map((n) => n.id);
      onSelectIds(hit, { additive: cur.additive });
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marquee != null]);

  const crumb =
    selectedId && buckets.some((b) => b.id === selectedId) ? pathToRoot(selectedId, buckets) : [];
  const hasCustomLayout =
    buckets.some((b) => b.canvasX != null || b.canvasY != null) ||
    sources.some((s) => s.canvasX != null || s.canvasY != null) ||
    engine.incomeCanvasX != null ||
    engine.poolCanvasX != null ||
    Object.keys(engine.edgeControls ?? {}).length > 0;

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
          title="월수입과 자산 흐름을 만드세요"
          desc="수입 → 월수입 → 자산(복리·현금흐름) · 지출은 아래"
          action={
            <div className="flex flex-wrap justify-center gap-2">
              {onOpenDiagnosis && (
                <Button onClick={onOpenDiagnosis}>
                  <Icon name="diagnosis" size={14} /> 내 현황 입력
                </Button>
              )}
              <Button variant={onOpenDiagnosis ? "outline" : "primary"} onClick={onRecommend}>
                추천 배분으로 시작
              </Button>
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
    const selected = selectedIds.includes(b.id);
    const parentLabel = b.parentId ? "상위" : "월수입";
    const compact = n.depth >= 2;
    const dragging = drag?.id === b.id || (drag != null && drag.group.some((g) => g.id === b.id));
    const p = posOf(n);

    return (
      <foreignObject key={n.id} x={p.x} y={p.y} width={n.w} height={n.h}>
        <div
          role="button"
          tabIndex={0}
          onPointerDown={(e) => beginNodeDrag(e, b.id, n)}
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
                <span className="truncate">{displayBucketName(b.name)}</span>
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
          {!leaf && !compact && (
            <div className="mt-0.5 text-[9px] font-semibold opacity-50">묶음</div>
          )}
        </div>
      </foreignObject>
    );
  };

  const selectedBucket =
    selectedId && buckets.some((b) => b.id === selectedId)
      ? buckets.find((b) => b.id === selectedId)!
      : null;

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
        {selectedBucket && (
          <button
            type="button"
            onClick={() => setQuickAddParent(selectedBucket.id)}
            className="ml-1 flex items-center gap-0.5 rounded-md border border-ink-200 bg-white px-1.5 py-0.5 font-semibold text-ink-600 hover:bg-ink-50"
          >
            <Icon name="plus" size={12} /> 하위 추가
          </button>
        )}
        {selectedId === "__income__" && (
          <>
            {onShowIncomeSourcesChange && (
              <label className="ml-1 flex cursor-pointer items-center gap-1 rounded-md border border-ink-200 bg-white px-1.5 py-0.5 font-semibold text-ink-600 hover:bg-ink-50">
                <input
                  type="checkbox"
                  className="h-3 w-3 accent-brand-700"
                  checked={showIncomeSources}
                  onChange={(e) => onShowIncomeSourcesChange(e.target.checked)}
                />
                수입원
              </label>
            )}
            <button
              type="button"
              onClick={() => setQuickAddParent(null)}
              className="ml-1 flex items-center gap-0.5 rounded-md border border-brand-200 bg-brand-50 px-1.5 py-0.5 font-semibold text-brand-700 hover:bg-brand-100"
            >
              <Icon name="plus" size={12} /> 묶음 추가
            </button>
          </>
        )}
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
          <button
            type="button"
            onClick={() => {
              zoomRef.current = 1;
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="tnum rounded-md px-1.5 py-0.5 font-semibold text-ink-500 hover:bg-ink-100 hover:text-ink-700"
            title="줌·위치 초기화"
          >
            {Math.round(zoom * 100)}%
          </button>
          <span className="tnum font-semibold text-ink-500">월수입 {monthlyIncome}만</span>
        </div>
      </div>

      <div className={`overflow-auto p-2 ${panning ? "cursor-grabbing" : ""}`}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className={`touch-none ${panning ? "cursor-grabbing" : "cursor-grab"}`}
          style={{
            width: Math.max(780, width) * zoom,
            height: Math.min(560, Math.max(380, height * 0.52)) * zoom,
            minHeight: 380 * zoom,
          }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* 배경: 드래그=팬 · Shift/⌘=박스 선택 */}
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill="transparent"
            onPointerDown={onBackgroundPointerDown}
          />

          <g transform={`translate(${pan.x}, ${pan.y})`}>
          {/* 선(시각·히트) → 노드 → 핸들 */}
          {edges.map((raw, i) => {
            const e = shiftedEdge(raw);
            const ctl = edgeControlOf(e);
            const d = edgePath(e, false, ctl);
            const handle = ctl ?? defaultEdgeControl(e);
            const stroke =
              e.tone === "spend"
                ? "var(--color-spend-500)"
                : e.tone === "income"
                  ? "var(--color-brand-500)"
                  : "var(--color-brand-400)";
            return (
              <g key={`edge-${e.id}`}>
                <path
                  id={e.id}
                  d={d}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={linkWidth(e.ratio)}
                  opacity={0.9}
                  style={{ pointerEvents: "none" }}
                />
                <path
                  d={d}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={16}
                  className="cursor-grab"
                  onPointerDown={(ev) => beginEdgeDrag(ev, e)}
                />
                {animate && !drag && (
                  <>
                    <path
                      d={d}
                      fill="none"
                      stroke={
                        e.tone === "spend"
                          ? "var(--color-spend-500)"
                          : e.tone === "income"
                            ? "var(--color-gold-500)"
                            : "var(--color-brand-500)"
                      }
                      strokeWidth="1.5"
                      strokeDasharray="2 10"
                      strokeLinecap="round"
                      className="flow-link"
                      opacity="0.9"
                      style={{ pointerEvents: "none" }}
                    />
                    <circle
                      r="3"
                      fill={
                        e.tone === "spend"
                          ? "var(--color-spend-500)"
                          : "var(--color-gold-500)"
                      }
                      style={{ pointerEvents: "none" }}
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

          {nodes.map((n) => {
            if (n.kind === "source") {
              const src = n.incomeSource!;
              const selected = selectedIds.includes(n.id);
              const fromAssets = src.id === ASSET_CASHFLOW_SOURCE_ID;
              const dragging =
                drag?.id === n.id || (drag != null && drag.group.some((g) => g.id === n.id));
              const p = posOf(n);
              return (
                <foreignObject key={n.id} x={p.x} y={p.y} width={n.w} height={n.h}>
                  <div
                    role="button"
                    tabIndex={0}
                    onPointerDown={(e) => beginNodeDrag(e, n.id, n)}
                    className={`flex h-full w-full cursor-grab select-none flex-col justify-center rounded-lg border px-2 text-left ${
                      fromAssets
                        ? "border-gold-400 bg-gold-50"
                        : "border-brand-200 bg-white"
                    } ${
                      selected ? "ring-2 ring-brand-500" : "hover:shadow-sm"
                    } ${dragging ? "cursor-grabbing opacity-90" : ""}`}
                  >
                    <div
                      className={`truncate text-[11px] font-bold ${
                        fromAssets ? "text-gold-700" : "text-brand-800"
                      }`}
                    >
                      {incomeSourceLabel(src)}
                    </div>
                    <div
                      className={`tnum text-sm font-extrabold ${
                        fromAssets ? "text-gold-800" : "text-brand-700"
                      }`}
                    >
                      월 {src.monthly}만
                    </div>
                  </div>
                </foreignObject>
              );
            }

            if (n.kind === "income") {
              const selected = selectedIds.includes("__income__");
              const dragging =
                drag?.id === "__income__" ||
                (drag != null && drag.group.some((g) => g.id === "__income__"));
              const p = posOf(n);
              return (
                <foreignObject key={n.id} x={p.x} y={p.y} width={n.w} height={n.h}>
                  <div
                    role="button"
                    tabIndex={0}
                    onPointerDown={(e) => beginNodeDrag(e, "__income__", n)}
                    className={`flex h-full w-full cursor-grab select-none flex-col justify-center rounded-xl border border-gold-300 bg-gold-50 px-2 text-center ${
                      selected ? "ring-2 ring-gold-500" : "hover:shadow-sm"
                    } ${dragging ? "cursor-grabbing opacity-90" : ""}`}
                  >
                    <div className="text-[11px] font-semibold text-gold-600">월수입</div>
                    <div className="tnum mt-0.5 text-base font-extrabold text-gold-700">
                      {monthlyIncome}만
                    </div>
                  </div>
                </foreignObject>
              );
            }

            if (n.kind === "pool") {
              const selected = selectedIds.includes("__pool__");
              const dragging =
                drag?.id === "__pool__" ||
                (drag != null && drag.group.some((g) => g.id === "__pool__"));
              const p = posOf(n);
              return (
                <foreignObject key={n.id} x={p.x} y={p.y} width={n.w} height={n.h}>
                  <div
                    role="button"
                    tabIndex={0}
                    onPointerDown={(e) => beginNodeDrag(e, "__pool__", n)}
                    className={`flex h-full w-full cursor-grab select-none flex-col items-center justify-center rounded-xl border border-sage-500/35 bg-sage-50 px-2 text-center ${
                      selected ? "ring-2 ring-sage-500" : "hover:shadow-sm"
                    } ${dragging ? "cursor-grabbing opacity-90" : ""}`}
                  >
                    <div className="text-sm font-bold text-sage-700">자산</div>
                    {cashflowMonthly > 0 ? (
                      <div className="tnum mt-1 text-[11px] font-semibold text-sage-600">
                        흐름 월 {Math.round(cashflowMonthly)}만
                      </div>
                    ) : null}
                  </div>
                </foreignObject>
              );
            }

            return renderBucket(n);
          })}

          {edges.map((raw) => {
            const e = shiftedEdge(raw);
            const ctl = edgeControlOf(e);
            const handle = ctl ?? defaultEdgeControl(e);
            const edgeActive = drag?.mode === "edge" && drag.id === e.id;
            const customized = Boolean(engine.edgeControls?.[e.id]);
            return (
              <circle
                key={`handle-${e.id}`}
                cx={handle.x}
                cy={handle.y}
                r={edgeActive || customized ? 5.5 : 4}
                fill="white"
                stroke={
                  edgeActive || customized
                    ? "var(--color-brand-500)"
                    : "var(--color-ink-300)"
                }
                strokeWidth={edgeActive || customized ? 2 : 1.25}
                className="cursor-grab"
                onPointerDown={(ev) => beginEdgeDrag(ev, e)}
              />
            );
          })}

          {marquee && (
            <rect
              x={Math.min(marquee.x0, marquee.x1)}
              y={Math.min(marquee.y0, marquee.y1)}
              width={Math.abs(marquee.x1 - marquee.x0)}
              height={Math.abs(marquee.y1 - marquee.y0)}
              fill="var(--color-brand-400)"
              opacity={0.12}
              stroke="var(--color-brand-500)"
              strokeWidth={1}
              style={{ pointerEvents: "none" }}
            />
          )}
          </g>
        </svg>
      </div>

      <p className="border-t border-ink-100 px-3 py-2 text-[11px] text-ink-400">
        휠 줌 · 빈 곳 드래그=전체 이동 · Shift+드래그=박스 선택 · 선 핸들=곡선
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
