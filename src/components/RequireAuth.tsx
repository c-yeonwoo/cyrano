"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

/** Supabase가 연결된 환경에서는 로그인 필수 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { configured, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (configured && !user) router.replace("/login");
  }, [configured, loading, user, router]);

  if (loading || (configured && !user)) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-ink-400">
        불러오는 중…
      </div>
    );
  }

  return <>{children}</>;
}
