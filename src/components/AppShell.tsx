"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "@/lib/clsx";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import { Logo } from "./Logo";

const NAV: { href: string; label: string; icon: IconName; core?: boolean; soon?: boolean }[] = [
  { href: "/home", label: "홈", icon: "home" },
  { href: "/engine", label: "엔진", icon: "engine", core: true },
  { href: "/diagnosis", label: "진단", icon: "diagnosis" },
  { href: "/goals", label: "목표·비전", icon: "target" },
  { href: "/spending", label: "지출관리", icon: "wallet", soon: true },
];

const LATER: { label: string; icon: IconName }[] = [
  { label: "실천·트래킹", icon: "check-circle" },
  { label: "커뮤니티", icon: "users" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const isActive = (href: string) => path === href || path.startsWith(href + "/");

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl">
      {/* Sidebar (web) */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-ink-200 bg-white px-3 py-5 md:flex">
        <Link href="/home" className="mb-7 px-2">
          <Logo />
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) =>
            n.soon ? (
              <span
                key={n.href}
                className="flex cursor-not-allowed items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink-300"
              >
                <Icon name={n.icon} size={18} />
                {n.label}
                <span className="ml-auto text-[10px] text-ink-300">v1.5</span>
              </span>
            ) : (
              <Link
                key={n.href}
                href={n.href}
                className={clsx(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  isActive(n.href)
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-600 hover:bg-ink-100",
                )}
              >
                <Icon name={n.icon} size={18} />
                {n.label}
                {n.core && (
                  <span className="ml-auto rounded-full bg-invest-100 px-1.5 text-[10px] font-semibold text-invest-700">
                    핵심
                  </span>
                )}
              </Link>
            ),
          )}
        </nav>
        <div className="mt-6 border-t border-ink-100 pt-4">
          {LATER.map((l) => (
            <div key={l.label} className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-ink-300">
              <Icon name={l.icon} size={16} />
              {l.label} <span className="text-ink-300">(곧)</span>
            </div>
          ))}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 px-4 pb-24 pt-5 md:px-8 md:pb-10">{children}</main>

      {/* Bottom tab (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-ink-200 bg-white/95 backdrop-blur md:hidden">
        {NAV.filter((n) => !n.soon).map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={clsx(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px]",
              isActive(n.href) ? "text-brand-700" : "text-ink-500",
            )}
          >
            <Icon name={n.icon} size={20} />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
