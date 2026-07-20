"use client";

import type { ReactNode } from "react";
import { useProfile } from "@/lib/store/useProfile";
import { DEFAULT_VISION } from "@/lib/store/defaults";
import { SCENE_META, type Scene, type SceneType, type Vision } from "@/lib/types";
import { formatKRW } from "@/lib/format";
import { Card, Field, NumberInput, AssumptionNote } from "@/components/ui";
import { Icon, type IconName } from "@/components/Icon";

const SCENE_ORDER: SceneType[] = ["place", "day", "work", "people"];

function QuietSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-xs font-semibold tracking-[0.08em] text-ink-400 uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function GoalsPanel() {
  const stored = useProfile((s) => s.profile.vision);
  const setVision = useProfile((s) => s.setVision);
  const v = stored ?? DEFAULT_VISION;

  const patch = (p: Partial<Vision>) => setVision({ ...v, ...p });
  const getScene = (type: SceneType): Scene =>
    v.scenes.find((sc) => sc.type === type) ?? { type, text: "" };
  const setScene = (type: SceneType, patchScene: Partial<Scene>) => {
    const others = v.scenes.filter((sc) => sc.type !== type);
    patch({ scenes: [...others, { ...getScene(type), ...patchScene }] });
  };

  const reverseTarget = v.goalPassiveIncome > 0 ? (v.goalPassiveIncome * 12) / 0.04 : 0;

  return (
    <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
      <div className="space-y-12">
        <QuietSection title="동기">
          <textarea
            className="h-28 w-full resize-none rounded-2xl border border-ink-100 bg-ink-50/50 px-4 py-3 text-sm leading-relaxed text-ink-800 outline-none placeholder:text-ink-300 focus:border-gold-300 focus:bg-white"
            placeholder="왜 경제적 자유를 원하나요? (선택)"
            value={v.why}
            onChange={(e) => patch({ why: e.target.value })}
          />
        </QuietSection>

        <QuietSection title="미래 장면">
          <div className="grid gap-4 sm:grid-cols-2">
            {SCENE_ORDER.map((type) => {
              const sc = getScene(type);
              const meta = SCENE_META[type];
              return (
                <div key={type} className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-ink-600">
                    <Icon name={meta.icon as IconName} size={15} className="text-ink-400" />
                    {meta.label}
                  </div>
                  <textarea
                    className="h-20 w-full resize-none rounded-xl border border-ink-100 bg-white px-3 py-2.5 text-sm leading-relaxed outline-none placeholder:text-ink-300 focus:border-gold-300"
                    placeholder={meta.placeholder}
                    value={sc.text}
                    onChange={(e) => setScene(type, { text: e.target.value })}
                  />
                </div>
              );
            })}
          </div>
        </QuietSection>
      </div>

      <div className="space-y-12">
        <QuietSection title="목표 수치">
          <Card className="!p-6 space-y-5">
            <Field label="목표 순자산">
              <NumberInput
                value={v.goalNetworth}
                onChange={(n) => patch({ goalNetworth: n })}
                suffix="만원"
              />
            </Field>
            {v.goalNetworth > 0 && (
              <p className="-mt-3 text-xs text-ink-400">≈ {formatKRW(v.goalNetworth)}</p>
            )}
            <Field label="목표 월 passive income">
              <NumberInput
                value={v.goalPassiveIncome}
                onChange={(n) => patch({ goalPassiveIncome: n })}
                suffix="만원"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="목표 시점">
                <NumberInput
                  value={v.targetYears}
                  onChange={(n) => patch({ targetYears: n })}
                  suffix="년 뒤"
                />
              </Field>
              <Field label="현재 나이">
                <NumberInput
                  value={v.currentAge ?? 0}
                  onChange={(n) =>
                    patch({ currentAge: n > 0 ? n : undefined })
                  }
                  suffix="세"
                  placeholder="예: 32"
                  blankZero
                />
              </Field>
            </div>

            {v.goalPassiveIncome > 0 && (
              <div className="border-t border-ink-100 pt-4">
                <p className="text-xs leading-relaxed text-ink-500">
                  월 {formatKRW(v.goalPassiveIncome)} × 12 ÷ 4% ≈{" "}
                  <span className="font-semibold text-ink-700">{formatKRW(reverseTarget)}</span>
                </p>
                <button
                  type="button"
                  onClick={() => patch({ goalNetworth: Math.round(reverseTarget) })}
                  className="mt-2 text-xs font-semibold text-gold-600 hover:underline"
                >
                  순자산 목표로 적용
                </button>
              </div>
            )}
          </Card>
        </QuietSection>

        <AssumptionNote>목표는 참고선이에요. 언제든 바꿀 수 있습니다.</AssumptionNote>
      </div>
    </div>
  );
}
