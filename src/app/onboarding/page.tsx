"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/store/useProfile";
import { HydrationGate } from "@/components/HydrationGate";
import { GoalsPanel } from "@/components/panels/GoalsPanel";
import { DiagnosisPanel } from "@/components/panels/DiagnosisPanel";
import { EngineBuilder } from "@/components/engine/EngineBuilder";
import { Button } from "@/components/ui";
import { Icon, type IconName } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { clsx } from "@/lib/clsx";

const STEPS: { key: string; label: string; icon: IconName }[] = [
  { key: "goals", label: "목표·비전", icon: "target" },
  { key: "diagnosis", label: "현재 진단", icon: "diagnosis" },
  { key: "engine", label: "엔진 구성", icon: "engine" },
];

function OnboardingInner() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const completeOnboarding = useProfile((s) => s.completeOnboarding);

  const finish = () => {
    completeOnboarding();
    router.push("/home");
  };

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6 md:px-8">
      {/* Stepper */}
      <div className="mb-6 flex items-center justify-between">
        <Logo />
        <button
          onClick={finish}
          className="flex items-center gap-1 text-xs text-ink-400 hover:text-ink-600"
        >
          나중에 채우기 · 건너뛰기 <Icon name="arrow-right" size={13} />
        </button>
      </div>

      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex flex-1 items-center gap-2">
            <button
              onClick={() => setStep(i)}
              className={clsx(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors",
                i === step
                  ? "bg-brand-600 text-white"
                  : i < step
                    ? "bg-brand-100 text-brand-700"
                    : "bg-ink-100 text-ink-400",
              )}
            >
              <Icon name={s.icon} size={16} />
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-ink-200" />}
          </div>
        ))}
      </div>

      <div className="mb-6">
        {step === 0 && (
          <>
            <StepHeader
              n={1}
              title="미래의 나를 그려요"
              desc="왜 경제적 자유를 원하는지, 얼마를 언제까지. 목표는 언제든 수정할 수 있어요."
            />
            <GoalsPanel />
          </>
        )}
        {step === 1 && (
          <>
            <StepHeader
              n={2}
              title="지금 내 위치를 확인해요"
              desc="최소만 입력해도 됩니다. 이 데이터는 엔진과 그대로 공유돼요."
            />
            <DiagnosisPanel />
          </>
        )}
        {step === 2 && (
          <>
            <StepHeader
              n={3}
              title="내 엔진을 조립해요"
              desc="팔레트에서 버킷을 끌어다 배분하면 n년 뒤 자산이 바로 보입니다."
            />
            <EngineBuilder />
          </>
        )}
      </div>

      {/* Nav */}
      <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-ink-200 bg-white/95 py-3 backdrop-blur">
        <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          이전
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)}>
            {step === 0 ? "이 목표로 시작하기" : "이 데이터로 엔진 구성"}
            <Icon name="arrow-right" size={15} />
          </Button>
        ) : (
          <Button onClick={finish}>
            완료 · 홈으로 <Icon name="arrow-right" size={15} />
          </Button>
        )}
      </div>
    </div>
  );
}

function StepHeader({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
        {n}
      </span>
      <div>
        <h1 className="text-xl font-extrabold text-ink-800">{title}</h1>
        <p className="text-sm text-ink-500">{desc}</p>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <HydrationGate>
      <OnboardingInner />
    </HydrationGate>
  );
}
