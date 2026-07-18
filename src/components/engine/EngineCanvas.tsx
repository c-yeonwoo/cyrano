"use client";

import { useEffect, useState } from "react";
import type { Bucket } from "@/lib/types";
import { presetByKey, bucketFromPreset } from "@/lib/catalog";
import { formatKRW } from "@/lib/format";
import { Button, EmptyState } from "@/components/ui";
import { Icon } from "@/components/Icon";

/**
 * 엔진 캔버스 — 자금 흐름 그래프.
 * 멀티 수입(upstream) → 비율대로 각 버킷에 분배(가지치기) → 자산 풀(downstream).
 * 링크를 따라 골드 파티클이 흐르고(SMIL), 링크 두께는 배분 비율에 비례.
 * 노드 클릭 → 인스펙터 선택. 팔레트 카드 드롭/탭으로 추가.
 */

const VB_W = 720;
const ROW_H = 90;
const PAD_T = 30;
const PAD_B = 24;

const CAT_NODE: Record<string, string> = {
  invest: "border-invest-500 bg-invest-50 text-invest-700",
  save: "border-save-500 bg-save-50 text-save-700",
  spend: "border-spend-500 bg-spend-50 text-spend-700",
};

export function EngineCanvas({
  buckets,
  monthlyIncome,
  selectedId,
  onSelect,
  onAdd,
  onRecommend,
}: {
  buckets: Bucket[];
  monthlyIncome: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: (b: Bucket) => void;
  onRecommend: () => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setAnimate(!mq.matches);
    const on = () => setAnimate(!mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const key = e.dataTransfer.getData("application/bucket-preset");
    const preset = presetByKey(key);
    if (preset) onAdd(bucketFromPreset(preset, buckets.length));
  };

  const ordered = buckets.slice().sort((a, b) => a.position - b.position);
  const H = Math.max(420, ordered.length * ROW_H + PAD_T + PAD_B);

  // 노드 좌표
  const inc = { x: 12, w: 128, h: 92, cy: H / 2 };
  const incRight = inc.x + inc.w;
  const bx = 312,
    bw = 210,
    bh = 64;
  const bRight = bx + bw;
  const pool = { x: 566, w: 142, h: 136, cy: H / 2 };
  const poolLeft = pool.x;

  const nodeY = (i: number) => PAD_T + i * ROW_H + ROW_H / 2;

  const hasPoolFeed = ordered.some((b) => b.category !== "spend");

  const branchPath = (y2: number) => {
    const x1 = incRight,
      y1 = inc.cy,
      x2 = bx,
      mx = (x1 + x2) / 2;
    return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
  };
  const poolPath = (y1: number) => {
    const x1 = bRight,
      x2 = poolLeft,
      y2 = pool.cy,
      mx = (x1 + x2) / 2;
    return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
  };
  const linkWidth = (ratio: number) => 2 + (Math.max(0, Math.min(100, ratio)) / 100) * 9;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`relative rounded-2xl border-2 border-dashed p-2 transition-colors ${
        dragOver ? "border-brand-400 bg-brand-50" : "border-ink-200 bg-ink-50/40"
      }`}
    >
      {ordered.length === 0 ? (
        <div className="flex min-h-[440px] items-center justify-center">
          <EmptyState
            icon="layers"
            title="여기에 버킷을 끌어다 놓으세요"
            desc="수입에서 시작해, 팔레트의 버킷을 조립하면 자금 흐름과 복리 결과가 그려집니다."
            action={<Button onClick={onRecommend}>진단 데이터로 추천 배분 시작</Button>}
          />
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${VB_W} ${H}`}
          className="w-full"
          style={{ height: "auto", aspectRatio: `${VB_W} / ${H}` }}
        >
          {/* 재투입 아크 (pool → income) */}
          <path
            d={`M${pool.x + pool.w / 2},${pool.cy - pool.h / 2} C${pool.x},${28} ${inc.x + inc.w / 2},${28} ${inc.x + inc.w / 2},${inc.cy - inc.h / 2}`}
            fill="none"
            stroke="var(--color-brand-300)"
            strokeWidth="1.5"
            strokeDasharray="6 5"
          />
          <text x={VB_W / 2} y={20} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--color-brand-600)">
            ↺ 실현 자본소득 재투입 (하이브리드 복리)
          </text>

          {/* 링크: income → bucket */}
          {ordered.map((b, i) => {
            const y = nodeY(i);
            const d = branchPath(y);
            const id = `pin-${b.id}`;
            const isSpend = b.category === "spend";
            const stroke = isSpend ? "var(--color-spend-300)" : "var(--color-brand-300)";
            return (
              <g key={`lin-${b.id}`}>
                <path id={id} d={d} fill="none" stroke={stroke} strokeWidth={linkWidth(b.ratioPct)} opacity="0.5" />
                <path
                  d={d}
                  fill="none"
                  stroke={isSpend ? "var(--color-spend-500)" : "var(--color-brand-500)"}
                  strokeWidth="2"
                  strokeDasharray="2 10"
                  strokeLinecap="round"
                  className={animate ? "flow-link" : undefined}
                  opacity="0.9"
                />
                {animate && b.ratioPct > 0 && (
                  <circle r="3.4" fill="var(--color-gold-400)">
                    <animateMotion dur={`${2.4 - Math.min(1.2, b.ratioPct / 100)}s`} repeatCount="indefinite" begin={`${i * 0.3}s`}>
                      <mpath href={`#${id}`} />
                    </animateMotion>
                  </circle>
                )}
              </g>
            );
          })}

          {/* 링크: bucket(invest/save) → pool */}
          {ordered.map((b, i) => {
            if (b.category === "spend") return null;
            const y = nodeY(i);
            const d = poolPath(y);
            const id = `ppool-${b.id}`;
            return (
              <g key={`lpool-${b.id}`}>
                <path id={id} d={d} fill="none" stroke="var(--color-brand-300)" strokeWidth={linkWidth(b.ratioPct)} opacity="0.4" />
                {animate && b.ratioPct > 0 && (
                  <circle r="3" fill="var(--color-gold-400)">
                    <animateMotion dur="1.8s" repeatCount="indefinite" begin={`${i * 0.3 + 0.6}s`}>
                      <mpath href={`#${id}`} />
                    </animateMotion>
                  </circle>
                )}
              </g>
            );
          })}

          {/* income 노드 */}
          <foreignObject x={inc.x} y={inc.cy - inc.h / 2} width={inc.w} height={inc.h}>
            <div className="flex h-full flex-col justify-center rounded-xl border border-brand-300 bg-brand-50 px-3 text-center">
              <div className="text-xs font-bold text-brand-700">멀티 수입</div>
              <div className="tnum mt-0.5 text-sm font-extrabold text-brand-800">월 {formatKRW(monthlyIncome)}</div>
              <div className="text-[10px] text-brand-400">근로·자본·부수입</div>
            </div>
          </foreignObject>

          {/* bucket 노드 */}
          {ordered.map((b, i) => {
            const y = nodeY(i) - bh / 2;
            const selected = b.id === selectedId;
            return (
              <foreignObject key={`n-${b.id}`} x={bx} y={y} width={bw} height={bh}>
                <button
                  onClick={() => onSelect(b.id)}
                  className={`flex h-full w-full items-center justify-between rounded-xl border px-3 text-left transition-shadow ${CAT_NODE[b.category]} ${
                    selected ? "ring-2 ring-brand-400" : "hover:shadow-sm"
                  }`}
                  style={{ height: bh }}
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-1 text-sm font-bold">
                      {b.isLocked && <Icon name="lock" size={12} className="text-locked" />}
                      <span className="truncate">{b.name}</span>
                    </span>
                    <span className="block text-[10px] opacity-70">
                      {b.category === "spend" ? "소비 (out)" : `연 ${b.expectedAnnualReturnPct}% (가정)`}
                    </span>
                  </span>
                  <span className="tnum shrink-0 text-base font-extrabold">{b.ratioPct}%</span>
                </button>
              </foreignObject>
            );
          })}

          {/* pool 노드 */}
          {hasPoolFeed && (
            <foreignObject x={pool.x} y={pool.cy - pool.h / 2} width={pool.w} height={pool.h}>
              <div className="flex h-full flex-col items-center justify-center rounded-xl bg-brand-700 px-3 text-center text-white">
                <div className="text-sm font-extrabold">자산 풀</div>
                <div className="mt-0.5 text-[11px] opacity-80">복리 누적</div>
                <div className="mt-1 text-[10px] opacity-70">미실현=내부 복리<br />실현=위로 재유입</div>
              </div>
            </foreignObject>
          )}
        </svg>
      )}
    </div>
  );
}
