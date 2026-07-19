"use client";

import { useMemo, useState } from "react";
import { useProfile, selectSpending } from "@/lib/store/useProfile";
import {
  SPEND_CATEGORY_META,
  VARIABLE_CATEGORIES,
  type SpendCategory,
} from "@/lib/spending/catalog";
import { dailyTotals, logsInMonth, logsOnDate, sumLogs } from "@/lib/spending/calc";
import {
  formatWon,
  formatWonFull,
  monthLabel,
  parseDateKey,
  toDateKey,
  weekdayShort,
} from "@/lib/spending/format";
import { Button, Card, TextInput, NumberInput } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { clsx } from "@/lib/clsx";
import { track } from "@/lib/analytics";
import { BudgetHero } from "./BudgetHero";
import { EngineBudgetSuggest } from "./EngineBudgetSuggest";

type ViewMode = "calendar" | "list";

export function VariableTab() {
  const profile = useProfile((s) => s.profile);
  const addLog = useProfile((s) => s.addVariableLog);
  const removeLog = useProfile((s) => s.removeVariableLog);
  const setBudget = useProfile((s) => s.setVariableBudget);
  const spending = selectSpending(profile);

  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [view, setView] = useState<ViewMode>("calendar");
  const [selected, setSelected] = useState(toDateKey(now));

  // 빠른 기록
  const [amountWon, setAmountWon] = useState(0);
  const [category, setCategory] = useState<SpendCategory>("food");
  const [date, setDate] = useState(toDateKey(now));
  const [memo, setMemo] = useState("");

  const monthLogs = useMemo(
    () => logsInMonth(spending.logs, cursor.y, cursor.m),
    [spending.logs, cursor],
  );
  const totals = useMemo(
    () => dailyTotals(spending.logs, cursor.y, cursor.m),
    [spending.logs, cursor],
  );
  const maxDay = useMemo(() => Math.max(1, ...totals.values()), [totals]);
  const dayLogs = logsOnDate(spending.logs, selected);
  const daySum = sumLogs(dayLogs);

  const save = () => {
    if (amountWon <= 0) return;
    addLog({ amountWon, category, date, memo });
    track("spend_logged", { source: "quick_bar", category });
    setAmountWon(0);
    setMemo("");
  };

  const onFav = (amount: number, cat: SpendCategory, label: string) => {
    addLog({
      amountWon: amount,
      category: cat,
      date: selected,
      memo: label,
    });
  };

  const monthSpent = sumLogs(monthLogs);

  return (
    <div className="space-y-4">
      <BudgetHero
        year={cursor.y}
        monthIndex={cursor.m}
        spentWon={monthSpent}
        budgetWon={spending.monthlyVariableBudgetWon}
        onSaveBudget={(won) => {
          setBudget(won);
          track("budget_pace_viewed", { source: "variable_tab" });
        }}
      />
      <EngineBudgetSuggest />

      {/* 인라인 빠른 기록 바 */}
      <Card className="!p-3">
        <div className="mb-2 text-xs font-semibold tracking-wide text-ink-400 uppercase">
          빠른 기록 · Enter로 저장
        </div>
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <label className="block">
            <span className="mb-1 block text-[11px] text-ink-400">금액(원)</span>
            <NumberInput value={amountWon} onChange={setAmountWon} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] text-ink-400">카테고리</span>
            <select
              className="h-[38px] rounded-lg border border-ink-200 bg-white px-2.5 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value as SpendCategory)}
            >
              {VARIABLE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {SPEND_CATEGORY_META[c].label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] text-ink-400">날짜</span>
            <input
              type="date"
              className="h-[38px] rounded-lg border border-ink-200 px-2.5 text-sm"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label className="min-w-[140px] flex-1">
            <span className="mb-1 block text-[11px] text-ink-400">메모</span>
            <TextInput value={memo} onChange={setMemo} placeholder="선택" />
          </label>
          <Button type="submit" disabled={amountWon <= 0}>
            저장
          </Button>
        </form>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {spending.favorites.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onFav(f.amountWon, f.category, f.label)}
              className="rounded-full border border-ink-200 bg-ink-50 px-2.5 py-1 text-xs font-medium text-ink-700 hover:border-gold-400 hover:bg-gold-50"
            >
              {f.label} · {formatWon(f.amountWon)}
            </button>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex rounded-lg border border-ink-200 p-0.5 text-xs">
          {(
            [
              ["calendar", "달력으로 보기"],
              ["list", "리스트로 보기"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setView(k)}
              className={clsx(
                "rounded-md px-3 py-1.5 font-semibold transition-colors",
                view === k ? "bg-brand-900 text-white" : "text-ink-500 hover:bg-ink-50",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === "calendar" ? (
        <>
          <CalendarMonth
            year={cursor.y}
            monthIndex={cursor.m}
            totals={totals}
            maxDay={maxDay}
            selected={selected}
            onSelect={(key) => {
              setSelected(key);
              setDate(key);
            }}
            onPrev={() =>
              setCursor((c) =>
                c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 },
              )
            }
            onNext={() =>
              setCursor((c) =>
                c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 },
              )
            }
          />
          <DayDetail
            dateKey={selected}
            logs={dayLogs}
            sum={daySum}
            onRemove={removeLog}
          />
        </>
      ) : (
        <ListView logs={monthLogs} onRemove={removeLog} />
      )}
    </div>
  );
}

function CalendarMonth({
  year,
  monthIndex,
  totals,
  maxDay,
  selected,
  onSelect,
  onPrev,
  onNext,
}: {
  year: number;
  monthIndex: number;
  totals: Map<string, number>;
  maxDay: number;
  selected: string;
  onSelect: (key: string) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const first = new Date(year, monthIndex, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: startPad }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <Card className="!p-4">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100" onClick={onPrev}>
          <Icon name="chevron-right" size={18} className="rotate-180" />
        </button>
        <div className="text-sm font-bold text-ink-800">{monthLabel(year, monthIndex)}</div>
        <button type="button" className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100" onClick={onNext}>
          <Icon name="chevron-right" size={18} />
        </button>
      </div>
      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-ink-400">
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day == null) return <div key={`e${i}`} className="min-h-[64px]" />;
          const key = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const won = totals.get(key) ?? 0;
          const intensity = won > 0 ? 0.15 + (won / maxDay) * 0.75 : 0;
          const isSel = key === selected;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={clsx(
                "flex min-h-[64px] flex-col rounded-lg border px-1.5 py-1 text-left transition-colors",
                isSel
                  ? "border-brand-800 bg-gold-50"
                  : "border-transparent hover:border-ink-200 hover:bg-ink-50",
              )}
            >
              <span
                className={clsx(
                  "text-[11px] font-semibold",
                  i % 7 === 0 ? "text-red-400" : "text-ink-500",
                )}
              >
                {day}
              </span>
              {won > 0 ? (
                <>
                  <span className="tnum mt-auto text-[11px] font-semibold text-ink-800">
                    {formatWon(won)}
                  </span>
                  <span
                    className="mt-0.5 h-1 w-full rounded-full"
                    style={{
                      background: `rgba(74, 144, 184, ${intensity})`,
                    }}
                  />
                </>
              ) : (
                <span className="mt-auto text-[10px] text-ink-200">·</span>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-ink-400">띠가 진할수록 그날 지출이 많아요. 날짜를 누르면 아래에 내역이 열려요.</p>
    </Card>
  );
}

function DayDetail({
  dateKey,
  logs,
  sum,
  onRemove,
}: {
  dateKey: string;
  logs: ReturnType<typeof logsOnDate>;
  sum: number;
  onRemove: (id: string) => void;
}) {
  const d = parseDateKey(dateKey);
  const label = `${d.getMonth() + 1}/${d.getDate()}(${weekdayShort(d)})`;

  return (
    <Card className="!p-4">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <div className="text-sm font-bold text-ink-800">
          {label} · {logs.length}건
        </div>
        <div className="tnum text-sm font-semibold text-ink-700">
          총 {formatWonFull(sum)}
        </div>
      </div>
      {logs.length === 0 ? (
        <p className="py-4 text-center text-sm text-ink-400">
          이 날 기록이 없어요. 위 빠른 기록으로 추가하세요.
        </p>
      ) : (
        <ul className="divide-y divide-ink-100">
          {logs.map((l) => (
            <li key={l.id} className="flex items-center gap-3 py-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-50 text-ink-500">
                <Icon name={SPEND_CATEGORY_META[l.category].icon} size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink-800">
                  {SPEND_CATEGORY_META[l.category].label}
                  {l.memo && (
                    <span className="font-normal text-ink-500"> · {l.memo}</span>
                  )}
                </div>
              </div>
              <div className="tnum text-sm font-semibold text-ink-900">
                -{formatWonFull(l.amountWon)}
              </div>
              <button
                type="button"
                aria-label="삭제"
                className="text-ink-300 hover:text-red-500"
                onClick={() => onRemove(l.id)}
              >
                <Icon name="trash" size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function ListView({
  logs,
  onRemove,
}: {
  logs: ReturnType<typeof logsInMonth>;
  onRemove: (id: string) => void;
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, typeof logs>();
    for (const l of [...logs].sort((a, b) => b.date.localeCompare(a.date))) {
      const arr = map.get(l.date) ?? [];
      arr.push(l);
      map.set(l.date, arr);
    }
    return [...map.entries()];
  }, [logs]);

  if (grouped.length === 0) {
    return (
      <Card className="!p-8 text-center text-sm text-ink-400">이번 달 변동 기록이 없어요.</Card>
    );
  }

  return (
    <div className="space-y-3">
      {grouped.map(([date, items]) => {
        const d = parseDateKey(date);
        return (
          <Card key={date} className="!p-3">
            <div className="mb-2 flex justify-between text-xs font-semibold text-ink-500">
              <span>
                {d.getMonth() + 1}/{d.getDate()}({weekdayShort(d)})
              </span>
              <span className="tnum">{formatWon(sumLogs(items))}</span>
            </div>
            <ul className="divide-y divide-ink-50">
              {items.map((l) => (
                <li key={l.id} className="flex items-center gap-2 py-2 text-sm">
                  <span className="text-ink-600">{SPEND_CATEGORY_META[l.category].label}</span>
                  <span className="flex-1 truncate text-ink-400">{l.memo}</span>
                  <span className="tnum font-semibold">-{formatWonFull(l.amountWon)}</span>
                  <button type="button" onClick={() => onRemove(l.id)} className="text-ink-300">
                    <Icon name="x" size={14} />
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}
