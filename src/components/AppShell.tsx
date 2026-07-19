"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "@/lib/clsx";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import { Logo } from "./Logo";
import { AccountMenu } from "./AccountMenu";

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  core?: boolean;
  soon?: boolean;
};

/** IA: 허브 → 공방(엔진) → 준비 → 루프. 동급 메뉴가 아니라 루프 역할로 읽히게. */
const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "허브",
    items: [{ href: "/home", label: "홈", icon: "home" }],
  },
  {
    label: "공방",
    items: [{ href: "/engine", label: "엔진", icon: "engine", core: true }],
  },
  {
    label: "준비",
    items: [
      { href: "/goals", label: "목표·비전", icon: "target" },
      { href: "/diagnosis", label: "진단", icon: "diagnosis" },
    ],
  },
  {
    label: "루프",
    items: [
      { href: "/tracking", label: "실천", icon: "check-circle" },
      { href: "/spending", label: "지출관리", icon: "wallet", soon: true },
    ],
  },
];

/** 모바일: 엔진을 중앙에 두어 공방 강조 */
const MOBILE_NAV: NavItem[] = [
  { href: "/home", label: "홈", icon: "home" },
  { href: "/diagnosis", label: "진단", icon: "diagnosis" },
  { href: "/engine", label: "엔진", icon: "engine", core: true },
  { href: "/tracking", label: "실천", icon: "check-circle" },
  { href: "/goals", label: "목표", icon: "target" },
];

const LATER: { label: string; icon: IconName }[] = [{ label: "커뮤니티", icon: "users" }];

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
        <nav className="flex flex-col gap-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="mb-1 px-3 text-[10px] font-semibold tracking-wider text-ink-400 uppercase">
                {group.label}
              </div>
              <div className="flex flex-col gap-0.5">
                {group.items.map((n) =>
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
                      aria-current={isActive(n.href) ? "page" : undefined}
                      className={clsx(
                        "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors",
                        n.core && !isActive(n.href) && "font-semibold text-ink-800",
                        isActive(n.href)
                          ? "bg-gold-50 font-semibold text-gold-600"
                          : "font-medium text-ink-600 hover:bg-ink-100",
                      )}
                    >
                      <Icon name={n.icon} size={18} />
                      {n.label}
                      {n.core && (
                        <span className="ml-auto rounded-full bg-gold-100 px-1.5 text-[10px] font-semibold text-gold-600">
                          핵심
                        </span>
                      )}
                    </Link>
                  ),
                )}
              </div>
            </div>
          ))}
        </nav>
        <div className="mt-6 border-t border-ink-100 pt-4">
          {LATER.map((l) => (
            <div key={l.label} className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-ink-300">
              <Icon name={l.icon} size={16} />
              {l.label} <span className="text-ink-300">(곧)</span>
            </div>
          ))}
        </div>
        <div className="mt-auto border-t border-ink-100 pt-3">
          <AccountMenu />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 px-4 pb-24 pt-5 md:px-8 md:pb-10">{children}</main>

      {/* Bottom tab (mobile) — 엔진을 중앙에 두어 공방 강조 */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-ink-200 bg-white/95 backdrop-blur md:hidden">
        {MOBILE_NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            aria-current={isActive(n.href) ? "page" : undefined}
            className={clsx(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px]",
              isActive(n.href) ? "font-semibold text-gold-600" : "text-ink-500",
              n.core && !isActive(n.href) && "font-semibold text-ink-700",
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
