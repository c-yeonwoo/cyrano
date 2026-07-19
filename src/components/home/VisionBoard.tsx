"use client";

import Link from "next/link";
import { SCENE_META, type Scene, type SceneType, type Vision } from "@/lib/types";
import { Icon, type IconName } from "@/components/Icon";

const SCENE_ORDER: SceneType[] = ["place", "day", "work", "people"];

const SCENE_TONE: Record<SceneType, string> = {
  place: "from-gold-500/25 via-brand-800/80 to-brand-900",
  day: "from-sage-500/30 via-brand-800/80 to-brand-900",
  work: "from-invest-500/25 via-brand-800/80 to-brand-900",
  people: "from-spend-500/20 via-brand-800/80 to-brand-900",
};

export function VisionBoard({ vision }: { vision: Vision | null }) {
  const scenes = SCENE_ORDER.map((type) => {
    const sc = vision?.scenes.find((s) => s.type === type);
    return { type, scene: sc ?? ({ type, text: "" } satisfies Scene) };
  });
  const hasAny = scenes.some(({ scene }) => scene.text.trim() || scene.imageUrl);

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-bold text-ink-700">비전보드</div>
        <Link
          href="/goals"
          className="text-xs font-semibold text-gold-600 hover:underline"
        >
          편집
        </Link>
      </div>
      {!hasAny ? (
        <Link
          href="/goals"
          className="flex min-h-[160px] flex-col items-center justify-center rounded-2xl border border-dashed border-ink-300 bg-ink-50/60 px-4 text-center"
        >
          <Icon name="image" size={22} className="text-ink-300" />
          <p className="mt-2 text-sm font-semibold text-ink-600">미래 장면을 채워보세요</p>
          <p className="mt-1 text-xs text-ink-400">장소·하루·일·사람 — 끌어당길 이미지를 적어요</p>
        </Link>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {scenes.map(({ type, scene }) => {
            const meta = SCENE_META[type];
            const text = scene.text.trim();
            return (
              <div
                key={type}
                className="relative aspect-[5/3] overflow-hidden rounded-xl border border-ink-200 bg-brand-900"
              >
                {scene.imageUrl ? (
                  <img
                    src={scene.imageUrl}
                    alt={meta.label}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${SCENE_TONE[type]}`}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-900/85 via-brand-900/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3">
                  <div className="flex items-center gap-1 text-[10px] font-bold tracking-wide text-white/70">
                    <Icon name={meta.icon as IconName} size={11} />
                    {meta.label}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs font-semibold leading-snug text-white sm:text-sm">
                    {text || "아직 비어 있어요"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {vision?.why?.trim() && (
        <p className="mt-2 text-center text-xs leading-relaxed text-ink-500">
          “{vision.why.trim()}”
        </p>
      )}
    </section>
  );
}
