"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { trackPageView } from "@/lib/analytics";

/** 루트에 두어 온보딩·앱 공통으로 page_viewed를 보낸다. */
export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    trackPageView(pathname);
  }, [pathname]);

  return <>{children}</>;
}
