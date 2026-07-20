"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { HydrationGate } from "@/components/HydrationGate";
import { Providers } from "@/components/Providers";
import { LogoMark } from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import { useProfile } from "@/lib/store/useProfile";
import { BRAND } from "@/lib/brand";

function LoginInner() {
  const { user, configured, loading } = useAuth();
  const router = useRouter();
  const onboardedAt = useProfile((s) => s.profile.onboardedAt);

  useEffect(() => {
    if (loading || !user) return;
    router.replace(onboardedAt ? "/home" : "/onboarding");
  }, [user, loading, onboardedAt, router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ink-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-ink-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-2.5">
          <LogoMark size={32} />
          <div>
            <div className="font-display text-lg font-bold text-ink-900">{BRAND.mark}</div>
            <p className="text-xs text-ink-500">
              {configured ? "이메일로 로그인 · 클라우드 저장" : "Supabase 연결이 필요합니다"}
            </p>
          </div>
        </div>
        <AuthForm
          onSuccess={() => router.replace(onboardedAt ? "/home" : "/onboarding")}
        />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <HydrationGate>
      <Providers>
        <LoginInner />
      </Providers>
    </HydrationGate>
  );
}
