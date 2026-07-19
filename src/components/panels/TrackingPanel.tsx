"use client";

import { useMemo, useRef, useState } from "react";
import { useProfile } from "@/lib/store/useProfile";
import { useDerived } from "@/lib/useDerived";
import { emptyTracking, type RoutineItem } from "@/lib/types";
import {
  addDays,
  buildGrass,
  buildWeekDays,
  computeDailyStreak,
  dateKey,
  dayCompletion,
  formatSchedule,
  logForDate,
  mondayOf,
  normalizeTracking,
  scheduledRoutines,
  shouldShowNextStepNudge,
  type RoutineSchedule,
} from "@/lib/tracking";
import { track } from "@/lib/analytics";
import { Card, Button, TextInput, EmptyState } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { HabitGrass } from "@/components/tracking/HabitGrass";
import { WeekView } from "@/components/tracking/WeekView";
import { SchedulePicker } from "@/components/tracking/SchedulePicker";

export function TrackingPanel() {
  const raw = useProfile((s) => s.profile.tracking) ?? emptyTracking();
  const tracking = useMemo(() => normalizeTracking(raw), [raw]);
  const addRoutine = useProfile((s) => s.addRoutine);
  const removeRoutine = useProfile((s) => s.removeRoutine);
  const updateRoutine = useProfile((s) => s.updateRoutine);
  const reorderRoutinesInDay = useProfile((s) => s.reorderRoutinesInDay);
  const toggleRoutineDay = useProfile((s) => s.toggleRoutineDay);
  const dismissNextStepNudge = useProfile((s) => s.dismissNextStepNudge);
  const { stage } = useDerived();
  const showNudge = shouldShowNextStepNudge(
    stage?.stage,
    tracking.dismissedNextStepStage,
  );

  const today = dateKey();
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekMonday, setWeekMonday] = useState(() => mondayOf(today));
  const [newTitle, setNewTitle] = useState("");
  const [newSchedule, setNewSchedule] = useState<RoutineSchedule>("daily");
  const [editingId, setEditingId] = useState<string | null>(null);
  const dragId = useRef<string | null>(null);

  const streak = computeDailyStreak(tracking.routines, tracking.logs);
  const todayComp = dayCompletion(tracking.routines, tracking.logs, today);
  const selectedComp = dayCompletion(tracking.routines, tracking.logs, selectedDate);
  const scheduled = scheduledRoutines(tracking.routines, selectedDate);
  const dayLog = logForDate(tracking.logs, selectedDate);
  const grass = useMemo(
    () => buildGrass(tracking.routines, tracking.logs, 14),
    [tracking.routines, tracking.logs],
  );
  const weekDays = useMemo(
    () => buildWeekDays(tracking.routines, tracking.logs, weekMonday),
    [tracking.routines, tracking.logs, weekMonday],
  );

  const weekLabel = (() => {
    const end = addDays(weekMonday, 6);
    return `${weekMonday.slice(5).replace("-", "/")} – ${end.slice(5).replace("-", "/")}`;
  })();

  const isToday = selectedDate === today;
  const isFuture = selectedDate > today;

  const toggle = (routineId: string) => {
    if (isFuture) return;
    const wasDone = Boolean(dayLog?.done[routineId]);
    toggleRoutineDay(selectedDate, routineId);
    if (!wasDone) track("action_completed");
  };

  const add = (source: "manual" | "next_step" = "manual") => {
    const v = newTitle.trim();
    if (!v) return;
    addRoutine(v, newSchedule);
    track("action_added", { source });
    setNewTitle("");
    setNewSchedule("daily");
  };

  const dismissNudge = () => {
    if (stage) dismissNextStepNudge(stage.stage);
  };

  /** 엔진 조언 → 습관 초안만 폼에 넣고 넛지 닫기 (1회용) */
  const draftFromNextStep = () => {
    if (!stage?.nextStep) return;
    setNewTitle("재무 점검하기");
    setNewSchedule({ weekdays: [1] });
    dismissNextStepNudge(stage.stage);
    requestAnimationFrame(() => {
      document.getElementById("routine-title-input")?.focus();
    });
  };

  const onDropReorder = (targetId: string) => {
    const from = dragId.current;
    dragId.current = null;
    if (!from || from === targetId) return;
    const ids = scheduled.map((r) => r.id);
    const fromIdx = ids.indexOf(from);
    const toIdx = ids.indexOf(targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = [...ids];
    next.splice(fromIdx, 1);
    next.splice(toIdx, 0, from);
    reorderRoutinesInDay(selectedDate, next);
  };

  return (
    <div className="space-y-5">
      {showNudge && stage && (
        <Card className="relative border-invest-100 bg-invest-50/70">
          <button
            type="button"
            aria-label="넛지 닫기"
            onClick={dismissNudge}
            className="absolute right-3 top-3 rounded-md p-1 text-invest-400 hover:bg-invest-100 hover:text-invest-700"
          >
            <Icon name="x" size={16} />
          </button>
          <div className="pr-8">
            <div className="flex items-center gap-1.5 text-xs font-bold text-invest-600">
              <Icon name="flag" size={14} />
              이번 단계 넛지 · {stage.name}
            </div>
            <p className="mt-1.5 text-sm font-medium text-invest-800">{stage.nextStep}</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-invest-600/80">
              스테이지가 바뀔 때까지만 보여요. 습관으로 다듬거나 닫아 두세요.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="border-invest-500/40 text-invest-700"
                onClick={draftFromNextStep}
              >
                <Icon name="plus" size={14} /> 습관 초안 만들기
              </Button>
              <button
                type="button"
                onClick={dismissNudge}
                className="px-2 text-xs font-semibold text-invest-500 hover:underline"
              >
                나중에
              </button>
            </div>
          </div>
        </Card>
      )}

      <Card className="border-sage-100 bg-sage-50/80">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-sage-600">오늘 루틴</div>
            <div className="tnum mt-1 text-3xl font-extrabold text-sage-700">
              {todayComp.total === 0 ? "—" : `${Math.round(todayComp.rate * 100)}%`}
            </div>
            <div className="mt-1 text-sm text-sage-600">
              {todayComp.total === 0
                ? "루틴을 추가해 보세요"
                : `${todayComp.done}/${todayComp.total} 완료`}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold text-sage-600">연속</div>
            <div className="tnum mt-1 text-3xl font-extrabold text-ink-800">
              {streak}
              <span className="ml-1 text-base font-bold text-ink-500">일</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-bold text-ink-800">
                {isToday ? "오늘 할 일" : selectedDate}
              </div>
              <div className="tnum text-xs text-ink-400">
                {selectedComp.total > 0
                  ? `${selectedComp.done}/${selectedComp.total} · ${Math.round(selectedComp.rate * 100)}%`
                  : "예정 루틴 없음"}
                {scheduled.length > 1 ? " · 드래그로 순서 변경" : ""}
              </div>
            </div>
            {!isToday && (
              <button
                type="button"
                onClick={() => setSelectedDate(today)}
                className="text-xs font-semibold text-sage-600 hover:underline"
              >
                오늘로
              </button>
            )}
          </div>

          {scheduled.length === 0 ? (
            <EmptyState
              icon="check-circle"
              title="이 날 루틴이 없어요"
              desc="아래에서 요일을 골라 루틴을 만들어 보세요."
            />
          ) : (
            <div className="space-y-2">
              {scheduled.map((r) => {
                const done = Boolean(dayLog?.done[r.id]);
                return (
                  <div
                    key={r.id}
                    draggable={!isFuture}
                    onDragStart={() => {
                      dragId.current = r.id;
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onDropReorder(r.id)}
                    className={`flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-2 py-2.5 ${
                      isFuture ? "" : "cursor-grab active:cursor-grabbing"
                    }`}
                  >
                    <span
                      className="select-none px-1 text-ink-300"
                      aria-hidden
                      title="드래그해서 순서 변경"
                    >
                      ⠿
                    </span>
                    <button
                      type="button"
                      disabled={isFuture}
                      onClick={() => toggle(r.id)}
                      aria-label="완료 토글"
                      className={
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border " +
                        (done
                          ? "border-sage-600 bg-sage-500 text-white"
                          : "border-ink-300 text-transparent")
                      }
                    >
                      <Icon name="check" size={14} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div
                        className={
                          "text-sm font-medium " +
                          (done ? "text-ink-400 line-through" : "text-ink-700")
                        }
                      >
                        {r.title}
                      </div>
                      <div className="text-[10px] font-semibold text-ink-400">
                        {formatSchedule(r.schedule)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-1 text-sm font-bold text-ink-800">이번 주</div>
          <p className="mb-3 text-[11px] text-ink-400">
            날짜를 누르면 그날 체크리스트를 볼 수 있어요
          </p>
          <WeekView
            days={weekDays}
            selectedDate={selectedDate}
            weekLabel={weekLabel}
            onSelectDay={(d) => {
              setSelectedDate(d);
              setWeekMonday(mondayOf(d));
            }}
            onPrev={() => setWeekMonday((m) => addDays(m, -7))}
            onNext={() => setWeekMonday((m) => addDays(m, 7))}
          />
        </Card>
      </div>

      <Card>
        <div className="mb-1 text-sm font-bold text-ink-800">습관 잔디</div>
        <p className="mb-4 text-[11px] text-ink-400">
          최근 14주 · 칸 색은 그날 루틴 합산 완료율
        </p>
        <HabitGrass
          weeks={grass}
          onSelectDay={(d) => {
            setSelectedDate(d);
            setWeekMonday(mondayOf(d));
          }}
        />
      </Card>

      <Card>
        <div className="mb-3 text-sm font-bold text-ink-800">내 루틴</div>
        <div className="mb-2">
          <TextInput
            id="routine-title-input"
            value={newTitle}
            onChange={setNewTitle}
            placeholder="예: 지출 기록하기"
          />
        </div>
        <div className="mb-3">
          <SchedulePicker value={newSchedule} onChange={setNewSchedule} />
        </div>
        <Button
          className="mb-4 min-h-11 w-full text-sm"
          onClick={() => add("manual")}
          disabled={!newTitle.trim()}
        >
          루틴 추가
        </Button>

        {tracking.routines.length === 0 ? (
          <p className="text-sm text-ink-400">아직 루틴이 없어요.</p>
        ) : (
          <ul className="space-y-2">
            {tracking.routines
              .slice()
              .sort((a, b) => a.position - b.position)
              .map((r) => (
                <RoutineListItem
                  key={r.id}
                  routine={r}
                  editing={editingId === r.id}
                  onToggleEdit={() =>
                    setEditingId((id) => (id === r.id ? null : r.id))
                  }
                  onUpdateSchedule={(schedule) => updateRoutine(r.id, { schedule })}
                  onRemove={() => removeRoutine(r.id)}
                />
              ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function RoutineListItem({
  routine,
  editing,
  onToggleEdit,
  onUpdateSchedule,
  onRemove,
}: {
  routine: RoutineItem;
  editing: boolean;
  onToggleEdit: () => void;
  onUpdateSchedule: (s: RoutineSchedule) => void;
  onRemove: () => void;
}) {
  return (
    <li className="rounded-xl border border-ink-100 px-3 py-2.5">
      <div className="flex items-center gap-2 text-sm text-ink-700">
        <Icon name="check-circle" size={15} className="shrink-0 text-sage-500" />
        <span className="min-w-0 flex-1 font-medium">{routine.title}</span>
        <button
          type="button"
          onClick={onToggleEdit}
          className="shrink-0 text-[10px] font-bold text-sage-600 hover:underline"
        >
          {formatSchedule(routine.schedule)}
        </button>
        <button
          type="button"
          aria-label="삭제"
          onClick={onRemove}
          className="text-ink-300 hover:text-red-500"
        >
          <Icon name="x" size={15} />
        </button>
      </div>
      {editing && (
        <div className="mt-2 border-t border-ink-50 pt-2">
          <SchedulePicker value={routine.schedule} onChange={onUpdateSchedule} />
        </div>
      )}
    </li>
  );
}
