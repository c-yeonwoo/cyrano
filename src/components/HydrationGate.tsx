"use client";

import { useProfile } from "@/lib/store/useProfile";
import type { ReactNode } from "react";

/** localStorage 하이드레이션 완료 전까지 렌더 보류 (SSR 불일치 방지) */
export function HydrationGate({ children }: { children: ReactNode }) {
  const hydrated = useProfile((s) => s.hasHydrated);
  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-ink-400">
        불러오는 중…
      </div>
    );
  }
  return <>{children}</>;
}
