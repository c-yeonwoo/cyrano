"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/store/useProfile";
import { HydrationGate } from "@/components/HydrationGate";
import { Providers } from "@/components/Providers";
import { RequireAuth } from "@/components/RequireAuth";
import { GoalsPanel } from "@/components/panels/GoalsPanel";
import { DiagnosisPanel } from "@/components/panels/DiagnosisPanel";
import { EngineBuilder } from "@/components/engine/EngineBuilder";
import { Button } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { clsx } from "@/lib/clsx";
import { track, trackOnboardingStartedOnce } from "@/lib/analytics";
import {
  resolveOnboardingOrder,
  stepsForOrder,
  type OnboardingOrder,
} from "@/lib/onboardingOrder";

function OnboardingInner() {
  const router = useRouter();
  const [order, setOrder] = useState<OnboardingOrder | null>(null);
  const [step, setStep] = useState(0);
  const completeOnboarding = useProfile((s) => s.completeOnboarding);

  const steps = useMemo(
    () => (order ? stepsForOrder(order) : []),
    [order],
  );

  useEffect(() => {
    const o = resolveOnboardingOrder();
    setOrder(o);
    trackOnboardingStartedOnce();
    track("onboarding_order_assigned", { order: o });
  }, []);

  useEffect(() => {
    if (!order || !steps[step]) return;
    track("onboarding_step_viewed", {
      step: steps[step].key,
      step_index: step,
      order,
    });
  }, [step, order, steps]);

  if (!order || steps.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-ink-400">
        불러오는 중…
      </div>
    );
  }

  const current = steps[step]!;

  const finish = (skipped: boolean) => {
    if (skipped) {
      track("onboarding_skipped", { from_step: current.key, order });
    } else {
      track("onboarding_completed", { last_step: current.key, order });
    }
    completeOnboarding();
    router.push("/home");
  };

  const goNext = () => {
    track("onboarding_step_completed", {
      step: current.key,
      step_index: step,
      order,
    });
    setStep((s) => s + 1);
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-[1680px] px-5 py-6 md:px-8 lg:px-10">
      <div className="mb-6 flex items-center justify-between">
        <Logo />
        <button
          type="button"
          onClick={() => finish(true)}
          className="flex items-center gap-1 text-xs text-ink-400 hover:text-ink-600"
        >
          나중에 채우기 · 건너뛰기 <Icon name="arrow-right" size={13} />
        </button>
      </div>

      <div className="mb-6 flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.key} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              onClick={() => setStep(i)}
              className={clsx(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors",
                i === step
                  ? "bg-gold-100 text-gold-600 ring-1 ring-gold-300"
                  : i < step
                    ? "bg-gold-50 text-gold-500"
                    : "bg-ink-100 text-ink-400",
              )}
            >
              <Icon name={s.icon} size={16} />
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < steps.length - 1 && <div className="h-px flex-1 bg-ink-200" />}
          </div>
        ))}
      </div>

      <div className="mb-6">
        <StepHeader n={step + 1} title={current.title} desc={current.desc} />
        {current.key === "goals" && <GoalsPanel />}
        {current.key === "diagnosis" && <DiagnosisPanel />}
        {current.key === "engine" && <EngineBuilder />}
      </div>

      <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-ink-200 bg-white/95 py-3 backdrop-blur">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          이전
        </Button>
        {step < steps.length - 1 ? (
          <Button onClick={goNext}>
            {current.nextLabel}
            <Icon name="arrow-right" size={15} />
          </Button>
        ) : (
          <Button onClick={() => finish(false)}>
            {current.nextLabel} <Icon name="arrow-right" size={15} />
          </Button>
        )}
      </div>
    </div>
  );
}

function StepHeader({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-100 text-sm font-bold text-gold-600">
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
      <Providers>
        <RequireAuth>
          <OnboardingInner />
        </RequireAuth>
      </Providers>
    </HydrationGate>
  );
}
