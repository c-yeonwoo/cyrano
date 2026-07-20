"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { HydrationGate } from "@/components/HydrationGate";
import { Providers } from "@/components/Providers";
import { useAuth } from "@/lib/auth";
import { useProfile } from "@/lib/store/useProfile";

/** 진입점: 로그인 → 온보딩/홈 */
function LandingInner() {
  const router = useRouter();
  const { configured, loading, user } = useAuth();
  const hydrated = useProfile((s) => s.hasHydrated);
  const onboardedAt = useProfile((s) => s.profile.onboardedAt);

  useEffect(() => {
    if (!hydrated || loading) return;
    if (configured && !user) {
      router.replace("/login");
      return;
    }
    router.replace(onboardedAt ? "/home" : "/onboarding");
  }, [hydrated, loading, configured, user, onboardedAt, router]);

  return (
    <div className="flex h-screen items-center justify-center text-sm text-ink-400">
      불러오는 중…
    </div>
  );
}

export default function Landing() {
  return (
    <HydrationGate>
      <Providers>
        <LandingInner />
      </Providers>
    </HydrationGate>
  );
}
