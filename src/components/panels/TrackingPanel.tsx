"use client";

import { useState } from "react";
import { useProfile } from "@/lib/store/useProfile";
import { useDerived } from "@/lib/useDerived";
import { emptyTracking } from "@/lib/types";
import { computeStreak, hasCheckedInThisWeek } from "@/lib/tracking";
import { track } from "@/lib/analytics";
import { Card, Button, SectionTitle, TextInput, EmptyState } from "@/components/ui";
import { Icon } from "@/components/Icon";

export function TrackingPanel() {
  const tracking = useProfile((s) => s.profile.tracking) ?? emptyTracking();
  const addAction = useProfile((s) => s.addAction);
  const toggleAction = useProfile((s) => s.toggleAction);
  const removeAction = useProfile((s) => s.removeAction);
  const weeklyCheckIn = useProfile((s) => s.weeklyCheckIn);
  const { stage } = useDerived();

  const [text, setText] = useState("");

  const streak = computeStreak(tracking.checkIns);
  const checkedThisWeek = hasCheckedInThisWeek(tracking.checkIns);
  const doneCount = tracking.actions.filter((a) => a.done).length;

  const add = (source: "manual" | "next_step" = "manual", value?: string) => {
    const v = (value ?? text).trim();
    if (!v) return;
    addAction(v);
    track("action_added", { source });
    if (!value) setText("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-5">
        {/* 주간 점검 */}
        <Card className="border-brand-200 bg-brand-50">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-brand-500">주간 점검 스트릭</div>
              <div className="tnum mt-1 text-3xl font-extrabold text-brand-700">
                {streak}주 연속
              </div>
              <div className="mt-1 text-sm text-brand-600">
                {checkedThisWeek
                  ? "이번 주 점검 완료 · 다음 주에 또 만나요"
                  : "이번 주 재무 상태를 점검해볼까요?"}
              </div>
            </div>
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm">
              <Icon name="check-circle" size={26} />
            </span>
          </div>
          <Button
            className="mt-4 w-full"
            onClick={() => {
              weeklyCheckIn();
              if (!checkedThisWeek) track("weekly_checkin", { streak_before: streak });
            }}
            disabled={checkedThisWeek}
          >
            {checkedThisWeek ? "이번 주 점검 완료됨" : "이번 주 점검 완료"}
          </Button>
        </Card>

        {/* 다음 한 걸음 (진단 연동) */}
        {stage && (
          <Card className="border-invest-100 bg-invest-50">
            <div className="flex items-center gap-1.5 text-sm font-bold text-invest-700">
              <Icon name="flag" size={15} /> 지금 추천하는 다음 한 걸음
            </div>
            <p className="mt-1.5 text-sm text-invest-700">{stage.nextStep}</p>
            <Button
              variant="outline"
              className="mt-3 border-invest-500/40 text-invest-700"
              onClick={() => add("next_step", stage.nextStep)}
            >
              <Icon name="plus" size={14} /> 실천 목록에 추가
            </Button>
          </Card>
        )}
      </div>

      {/* 실천 목록 */}
      <div className="space-y-3">
        <SectionTitle desc={`완료 ${doneCount} / ${tracking.actions.length}`}>
          실천 목록
        </SectionTitle>
        <div className="flex gap-2">
          <TextInput
            value={text}
            onChange={setText}
            placeholder="예: 비상금 자동이체 50만원 걸기"
          />
          <Button onClick={() => add("manual")} disabled={!text.trim()}>
            추가
          </Button>
        </div>

        {tracking.actions.length === 0 ? (
          <EmptyState
            icon="check-circle"
            title="아직 실천 항목이 없어요"
            desc="추천 다음 한 걸음을 추가하거나, 직접 목표를 적어보세요."
          />
        ) : (
          <div className="space-y-2">
            {tracking.actions.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-xl border border-ink-200 bg-white px-3 py-2.5"
              >
                <button
                  onClick={() => {
                    const becomingDone = !a.done;
                    toggleAction(a.id);
                    if (becomingDone) track("action_completed");
                  }}
                  aria-label="완료 토글"
                  className={
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border " +
                    (a.done
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-ink-300 text-transparent")
                  }
                >
                  <Icon name="check" size={13} />
                </button>
                <span
                  className={
                    "flex-1 text-sm " +
                    (a.done ? "text-ink-400 line-through" : "text-ink-700")
                  }
                >
                  {a.text}
                </span>
                <button
                  onClick={() => removeAction(a.id)}
                  aria-label="삭제"
                  className="text-ink-300 hover:text-red-500"
                >
                  <Icon name="x" size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
