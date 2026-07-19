"use client";

import { useProfile } from "@/lib/store/useProfile";
import { formatKRW, formatPct } from "@/lib/format";

export type HomeMetricId =
  | "totalAssets"
  | "netWorth"
  | "leverage"
  | "avgCashflow"
  | "avgSpend"
  | "savingsRate"
  | "incomeMix"
  | "passiveRatio";

export type HomeMetricValues = Record<
  HomeMetricId,
  { label: string; value: string; sub?: string }
>;

const ORDER: HomeMetricId[] = [
  "totalAssets",
  "netWorth",
  "leverage",
  "avgCashflow",
  "avgSpend",
  "savingsRate",
  "incomeMix",
  "passiveRatio",
];

/** Zustand selector용 — `?? []` 는 매 렌더 새 참조 → 무한 루프 */
const EMPTY_HIDDEN: string[] = [];

export function HomeMetricGrid({ metrics }: { metrics: HomeMetricValues }) {
  const hidden = useProfile(
    (s) => s.profile.uiPrefs?.hiddenHomeMetrics ?? EMPTY_HIDDEN,
  );
  const toggle = useProfile((s) => s.toggleHomeMetricHidden);
  const hiddenSet = new Set(hidden);

  return (
    <section>
      <div className="mb-2 text-sm font-bold text-ink-700">자산 · 현금흐름</div>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {ORDER.map((id) => {
          const m = metrics[id];
          const isHidden = hiddenSet.has(id);
          return (
            <div
              key={id}
              className="relative rounded-xl border border-ink-200 bg-white px-3 py-3"
            >
              <button
                type="button"
                onClick={() => toggle(id)}
                className="absolute right-2 top-2 text-[10px] font-semibold text-ink-300 hover:text-ink-600"
              >
                {isHidden ? "보이기" : "가리기"}
              </button>
              <div className="pr-10 text-[11px] text-ink-400">{m.label}</div>
              <div
                className={`tnum mt-1 text-lg font-bold tracking-tight ${
                  isHidden ? "select-none text-ink-300 blur-[6px]" : "text-ink-900"
                }`}
              >
                {isHidden ? "••••" : m.value}
              </div>
              {m.sub && !isHidden && (
                <div className="mt-0.5 text-[10px] text-ink-400">{m.sub}</div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** 스냅샷·지출로 홈 8지표 조립 (만원 기준 formatKRW) */
export function buildHomeMetrics(input: {
  cash: number;
  investAssets: number;
  realEstate: number;
  liabilities: number;
  netWorth: number;
  totalMonthlyIncome: number;
  laborSharePct: number;
  capitalSharePct: number;
  savingsRatePct: number;
  passiveToSpendingPct: number;
  /** 원 */
  avgSpendWon3m: number;
}): HomeMetricValues {
  const totalAssets = input.cash + input.investAssets + input.realEstate;
  const leveragePct =
    totalAssets > 0 ? (input.liabilities / totalAssets) * 100 : 0;
  const avgSpendMan = input.avgSpendWon3m / 10000;
  const avgCashflowMan = input.totalMonthlyIncome - avgSpendMan;

  return {
    totalAssets: {
      label: "총자산",
      value: formatKRW(totalAssets),
    },
    netWorth: {
      label: "순자산",
      value: formatKRW(input.netWorth),
    },
    leverage: {
      label: "레버리지율",
      value: formatPct(leveragePct, 1),
      sub: "부채 ÷ 총자산",
    },
    avgCashflow: {
      label: "월 평균 현금흐름",
      value: formatKRW(avgCashflowMan),
      sub: "지난 3개월 · 수입−지출",
    },
    avgSpend: {
      label: "월 평균 지출",
      value: formatKRW(avgSpendMan),
      sub: "지난 3개월",
    },
    savingsRate: {
      label: "저축률",
      value: formatPct(Math.max(0, input.savingsRatePct), 1),
    },
    incomeMix: {
      label: "수입구조",
      value: `${Math.round(input.laborSharePct)}:${Math.round(input.capitalSharePct)}`,
      sub: "근로성 : 자본",
    },
    passiveRatio: {
      label: "패시브 / 생활비",
      value: formatPct(input.passiveToSpendingPct, 1),
    },
  };
}
