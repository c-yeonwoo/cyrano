"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { HydrationGate } from "@/components/HydrationGate";
import { Providers } from "@/components/Providers";
import { LogoMark } from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import { BRAND } from "@/lib/brand";
import { useEffect } from "react";

function LoginInner() {
  const { user, configured } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace("/home");
  }, [user, router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ink-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-ink-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-2.5">
          <LogoMark size={32} />
          <div>
            <div className="font-display text-lg font-bold text-ink-900">{BRAND.mark}</div>
            <p className="text-xs text-ink-500">
              {configured ? "이메일로 로그인 · 클라우드 저장" : "로컬 모드 · Supabase 연결 안내"}
            </p>
          </div>
        </div>
        <AuthForm onSuccess={() => router.replace("/home")} />
        <p className="mt-6 text-center text-xs text-ink-400">
          <Link href="/home" className="font-semibold text-ink-600 hover:underline">
            로그인 없이 계속
          </Link>
        </p>
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
