"use client";

import { useProfile } from "@/lib/store/useProfile";
import { DEFAULT_VISION } from "@/lib/store/defaults";
import { SCENE_META, type Scene, type SceneType, type Vision } from "@/lib/types";
import { formatKRW } from "@/lib/format";
import { Card, Field, NumberInput, SectionTitle, AssumptionNote } from "@/components/ui";
import { Icon, type IconName } from "@/components/Icon";

const SCENE_ORDER: SceneType[] = ["place", "day", "work", "people"];

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

  // 역산 헬퍼: 월 생활비 × 12 ÷ 4%
  const reverseTarget = v.goalPassiveIncome > 0 ? (v.goalPassiveIncome * 12) / 0.04 : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* 비전보드 */}
      <div className="space-y-5">
        <Card className="border-invest-100 bg-invest-50/60">
          <SectionTitle n={1} desc="＂70살의 내가 지금으로 돌아왔다면…＂">
            왜 경제적 자유를 원하나요?
          </SectionTitle>
          <textarea
            className="h-24 w-full resize-none rounded-xl border border-invest-100 bg-white px-3 py-2 text-sm outline-none focus:border-invest-500"
            placeholder="동기를 한 문장~짧은 글로 적어보세요."
            value={v.why}
            onChange={(e) => patch({ why: e.target.value })}
          />
        </Card>

        <div>
          <SectionTitle n={2} desc="각 장면을 짧은 글로 그려보세요. (AI 장면 이미지는 준비 중)">
            미래의 내 삶 장면
          </SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            {SCENE_ORDER.map((type) => {
              const sc = getScene(type);
              const meta = SCENE_META[type];
              return (
                <Card key={type} className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-ink-700">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <Icon name={meta.icon as IconName} size={16} />
                    </span>
                    {meta.label}
                  </div>
                  <textarea
                    className="h-16 w-full resize-none rounded-lg border border-ink-200 bg-ink-50 px-2 py-1.5 text-xs outline-none focus:border-brand-400"
                    placeholder={meta.placeholder}
                    value={sc.text}
                    onChange={(e) => setScene(type, { text: e.target.value })}
                  />
                  <button
                    disabled
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-ink-200 py-1.5 text-[11px] text-ink-400"
                  >
                    <Icon name="image" size={13} /> AI 장면 이미지 (곧)
                  </button>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* 목표 수치 */}
      <div className="space-y-5">
        <Card>
          <SectionTitle n={3} desc="목표는 '타겟 라인' — 엔진 계산에는 영향을 주지 않아요.">
            목표 수치
          </SectionTitle>
          <div className="space-y-4">
            <Field label="목표 순자산">
              <NumberInput value={v.goalNetworth} onChange={(n) => patch({ goalNetworth: n })} suffix="만원" />
            </Field>
            <div className="-mt-2 text-right text-xs text-ink-400">= {formatKRW(v.goalNetworth)}</div>
            <Field label="목표 passive income (월)" hint="배당·임대 등 실현 자본소득">
              <NumberInput value={v.goalPassiveIncome} onChange={(n) => patch({ goalPassiveIncome: n })} suffix="만원" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="목표 시점">
                <NumberInput value={v.targetYears} onChange={(n) => patch({ targetYears: n })} suffix="년 뒤" />
              </Field>
              <Field label="현재 나이 (선택)">
                <NumberInput value={v.currentAge ?? 0} onChange={(n) => patch({ currentAge: n })} suffix="세" />
              </Field>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 p-3">
            <div className="flex items-center gap-1.5 text-sm font-bold text-brand-700">
              <Icon name="calculator" size={15} /> 월 생활비로 역산 (선택)
            </div>
            <p className="mt-1 text-sm text-brand-600">
              월 {formatKRW(v.goalPassiveIncome)} × 12 ÷ 4% ≈ 약 <b>{formatKRW(reverseTarget)}</b> 필요
            </p>
            <button
              onClick={() => patch({ goalNetworth: Math.round(reverseTarget) })}
              className="mt-2 text-xs font-semibold text-brand-700 underline"
            >
              이 값을 목표 순자산으로 적용
            </button>
            <p className="mt-1 text-xs text-brand-400">＊4% 규칙 · 예시·가정</p>
          </div>
        </Card>

        <AssumptionNote>
          목표 = 타겟 라인(엔진 미영향) · 하드 상한 없음, 현실 피드백으로 안내 · 모든 수치는 예시·가정. 언제든 수정 가능합니다.
        </AssumptionNote>
      </div>
    </div>
  );
}
