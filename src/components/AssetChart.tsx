"use client";

import { useRef, useState } from "react";
import type { YearPoint } from "@/lib/types";
import { formatKRW } from "@/lib/format";

interface Props {
  curve: YearPoint[];
  compareCurve?: YearPoint[] | null;
  band?: { lower: YearPoint[]; upper: YearPoint[] } | null;
  goalNetworth?: number;
  targetReachYear?: number | null;
  height?: number;
  showLocked?: boolean;
  compact?: boolean;
}

const W = 720;
/** 메인 곡선·영역 — sage/teal */
const TEAL = "#4d8b82";
const TEAL_DEEP = "#3d7169";

export function AssetChart({
  curve,
  compareCurve,
  band,
  goalNetworth,
  targetReachYear,
  height = 260,
  showLocked = true,
  compact = false,
}: Props) {
  const H = height;
  const padL = compact ? 12 : 44;
  const padR = 12;
  const padT = 16;
  const padB = compact ? 18 : 28;
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  if (curve.length < 2) return null;

  const years = curve.length - 1;
  const maxVal = Math.max(
    ...curve.map((p) => p.totalNetWorth),
    ...(compareCurve ?? []).map((p) => p.totalNetWorth),
    ...(band?.upper ?? []).map((p) => p.totalNetWorth),
    goalNetworth ?? 0,
    1,
  );
  const minVal = Math.min(
    0,
    ...curve.map((p) => p.totalNetWorth),
    ...(compareCurve ?? []).map((p) => p.totalNetWorth),
    ...(band?.lower ?? []).map((p) => p.totalNetWorth),
  );
  const startVal = Math.max(curve[0]?.totalNetWorth ?? 0, 0);
  const yMax = maxVal * 1.08;
  /** 후반이 폭증하면 초·중반이 바닥에 깔림 → 양수 구간에서 sqrt 스케일 */
  const useSoftScale =
    minVal >= 0 && startVal > 0 && yMax / startVal >= 12;

  const project = (val: number) =>
    useSoftScale ? Math.sqrt(Math.max(0, val)) : Math.max(0, val);

  const yTop = project(yMax) || 1;
  const y = (val: number) => padT + (1 - project(val) / yTop) * (H - padT - padB);
  const x = (year: number) => padL + (year / years) * (W - padL - padR);

  const line = (sel: (p: YearPoint) => number) =>
    curve.map((p) => `${x(p.year)},${y(sel(p))}`).join(" ");

  const totalPts = line((p) => p.totalNetWorth);
  const lockedPts = line((p) => p.lockedAssets);
  const areaPts = `${padL},${y(0)} ${totalPts} ${x(years)},${y(0)}`;

  const bandPts =
    band && band.upper.length > 1
      ? band.upper
          .filter((p) => p.year <= years)
          .map((p) => `${x(p.year)},${y(p.totalNetWorth)}`)
          .join(" ") +
        " " +
        band.lower
          .filter((p) => p.year <= years)
          .slice()
          .reverse()
          .map((p) => `${x(p.year)},${y(p.totalNetWorth)}`)
          .join(" ")
      : null;

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = ((e.clientX - rect.left) / rect.width) * W;
    const yr = Math.round(((relX - padL) / (W - padL - padR)) * years);
    setHover(Math.max(0, Math.min(years, yr)));
  };

  const hp = hover !== null ? curve[hover] : null;
  const labelYears = [0, Math.round(years / 2), years].filter(
    (v, i, a) => a.indexOf(v) === i,
  );

  return (
    <div className="w-full">
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height }}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={TEAL} stopOpacity="0.28" />
            <stop offset="100%" stopColor={TEAL} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 민감도 밴드 (보수~공격 범위) */}
        {bandPts && <polygon points={bandPts} fill={TEAL} fillOpacity="0.1" />}

        {/* y grid */}
        {!compact &&
          [0, 0.25, 0.5, 0.75, 1].map((f) => {
            const val = useSoftScale ? (f * Math.sqrt(yMax)) ** 2 : yMax * f;
            return (
              <g key={f}>
                <line
                  x1={padL}
                  x2={W - padR}
                  y1={y(val)}
                  y2={y(val)}
                  stroke="#eef0f4"
                />
                <text x={4} y={y(val) + 3} fontSize="9" fill="#9ca3af">
                  {formatKRW(val)}
                </text>
              </g>
            );
          })}

        {/* goal line */}
        {goalNetworth && goalNetworth <= yMax && (
          <>
            <line
              x1={padL}
              x2={W - padR}
              y1={y(goalNetworth)}
              y2={y(goalNetworth)}
              stroke="var(--color-goal)"
              strokeWidth="1.2"
              strokeDasharray="5 4"
            />
            <text
              x={W - padR}
              y={y(goalNetworth) - 4}
              fontSize="9"
              fill="var(--color-goal)"
              textAnchor="end"
            >
              목표 {formatKRW(goalNetworth)}
            </text>
          </>
        )}

        {/* compare curve (시나리오 B) */}
        {compareCurve && compareCurve.length > 1 && (
          <polyline
            points={compareCurve
              .filter((p) => p.year <= years)
              .map((p) => `${x(p.year)},${y(p.totalNetWorth)}`)
              .join(" ")}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="1.8"
            strokeDasharray="6 4"
          />
        )}

        {/* area + total */}
        <polygon points={areaPts} fill="url(#areaG)" />
        <polyline
          points={totalPts}
          fill="none"
          stroke={TEAL}
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        {showLocked && curve.some((p) => p.lockedAssets > 0) && (
          <polyline
            points={lockedPts}
            fill="none"
            stroke={TEAL_DEEP}
            strokeWidth="1.4"
            strokeDasharray="4 3"
          />
        )}

        {/* 시작·중간·끝 값 라벨 — 바닥에 깔려도 숫자로 읽히게 */}
        {!compact &&
          labelYears.map((yr) => {
            const p = curve[yr];
            if (!p) return null;
            const cy = y(p.totalNetWorth);
            const labelY = Math.max(padT + 10, cy - 8);
            return (
              <g key={`lbl-${yr}`}>
                <circle cx={x(yr)} cy={cy} r="3" fill={TEAL} />
                <text
                  x={x(yr)}
                  y={labelY}
                  fontSize="9"
                  fontWeight="600"
                  fill={TEAL_DEEP}
                  textAnchor={yr === 0 ? "start" : yr === years ? "end" : "middle"}
                >
                  {formatKRW(p.totalNetWorth)}
                </text>
              </g>
            );
          })}

        {/* target reach marker */}
        {targetReachYear != null && targetReachYear <= years && (
          <line
            x1={x(targetReachYear)}
            x2={x(targetReachYear)}
            y1={padT}
            y2={H - padB}
            stroke="#cbd5e1"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        )}

        {/* x labels */}
        {!compact &&
          labelYears.map((yr) => (
            <text
              key={yr}
              x={x(yr)}
              y={H - 5}
              fontSize="9"
              fill="#9ca3af"
              textAnchor="middle"
            >
              {yr}년
            </text>
          ))}

        {/* hover */}
        {hp && (
          <>
            <line
              x1={x(hp.year)}
              x2={x(hp.year)}
              y1={padT}
              y2={H - padB}
              stroke="#c7cad1"
            />
            <circle cx={x(hp.year)} cy={y(hp.totalNetWorth)} r="4" fill={TEAL} />
          </>
        )}
      </svg>

      {useSoftScale && !compact && (
        <p className="mt-1 text-[11px] text-ink-400">
          후반 폭증을 눌러 초·중반이 보이도록 스케일을 조정했어요 (값 자체는 동일)
        </p>
      )}

      {hp && !compact && (
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-ink-600">
          <span className="font-semibold text-ink-800">{hp.year}년 뒤</span>
          <span>
            순자산 <b>{formatKRW(hp.totalNetWorth)}</b>
          </span>
          <span>유동 {formatKRW(hp.liquidAssets)}</span>
          {hp.lockedAssets > 0 && <span>잠김 {formatKRW(hp.lockedAssets)}</span>}
          <span>월 passive {formatKRW(hp.monthlyPassiveIncome)}</span>
        </div>
      )}
    </div>
  );
}
