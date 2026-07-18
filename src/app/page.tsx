"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/store/useProfile";

/** 진입점: 온보딩 완료 여부에 따라 라우팅 */
export default function Landing() {
  const router = useRouter();
  const hydrated = useProfile((s) => s.hasHydrated);
  const onboardedAt = useProfile((s) => s.profile.onboardedAt);

  useEffect(() => {
    if (!hydrated) return;
    router.replace(onboardedAt ? "/home" : "/onboarding");
  }, [hydrated, onboardedAt, router]);

  return (
    <div className="flex h-screen items-center justify-center text-sm text-ink-400">
      불러오는 중…
    </div>
  );
}
