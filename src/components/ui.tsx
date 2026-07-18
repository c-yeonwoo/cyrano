"use client";

import { clsx } from "@/lib/clsx";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

export function Card({
  children,
  className = "",
  pad = true,
}: {
  children: ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-ink-200 bg-white shadow-sm",
        pad && "p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  children,
  desc,
  n,
}: {
  children: ReactNode;
  desc?: ReactNode;
  n?: number;
}) {
  return (
    <div className="mb-3">
      <h2 className="flex items-center gap-2 text-base font-bold text-ink-800">
        {n != null && <NumberChip n={n} />}
        {children}
      </h2>
      {desc && <p className="mt-0.5 text-sm text-ink-500">{desc}</p>}
    </div>
  );
}

type BtnVariant = "primary" | "ghost" | "outline" | "danger";
export function Button({
  children,
  onClick,
  variant = "primary",
  className = "",
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: BtnVariant;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const styles: Record<BtnVariant, string> = {
    primary:
      "bg-brand-600 text-white hover:bg-brand-700 disabled:bg-ink-300 disabled:text-ink-500",
    ghost: "text-ink-600 hover:bg-ink-100",
    outline: "border border-ink-300 text-ink-700 hover:bg-ink-50",
    danger: "border border-red-300 text-red-600 hover:bg-red-50",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed",
        styles[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  hint,
  children,
  suffix,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  suffix?: ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-sm font-medium text-ink-600">{label}</span>
        {hint && <span className="text-xs text-ink-400">{hint}</span>}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1">{children}</div>
        {suffix}
      </div>
    </label>
  );
}

export function NumberInput({
  value,
  onChange,
  suffix,
  placeholder,
}: {
  value: number;
  onChange: (n: number) => void;
  suffix?: string;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center rounded-xl border border-ink-300 bg-white focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">
      <input
        inputMode="numeric"
        className="w-full rounded-xl bg-transparent px-3 py-2 text-sm text-ink-900 outline-none"
        value={Number.isFinite(value) ? String(value) : ""}
        placeholder={placeholder ?? "0"}
        onChange={(e) => {
          const cleaned = e.target.value.replace(/[^0-9.-]/g, "");
          onChange(cleaned === "" ? 0 : Number(cleaned));
        }}
      />
      {suffix && <span className="pr-3 text-sm text-ink-400">{suffix}</span>}
    </div>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      className={clsx(
        "w-full rounded-xl border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500",
        className,
      )}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function Badge({
  children,
  tone = "brand",
}: {
  children: ReactNode;
  tone?: "brand" | "amber" | "emerald" | "sky" | "slate";
}) {
  const tones = {
    brand: "bg-brand-50 text-brand-700 border-brand-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    sky: "bg-sky-50 text-sky-700 border-sky-200",
    slate: "bg-ink-100 text-ink-600 border-ink-200",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

/** 컴플라이언스: 모든 수치는 예시·가정 고지 */
export function AssumptionNote({ children }: { children?: ReactNode }) {
  return (
    <p className="flex items-start gap-1.5 text-xs text-ink-400">
      <Icon name="info" size={14} className="mt-0.5 shrink-0" />
      <span>
        {children ??
          "모든 수치는 예시·가정이며 수익을 보장하지 않습니다. 개별 종목·매물 추천이 아닌 '배분 구조'만 다룹니다."}
      </span>
    </p>
  );
}

/** 번호가 매겨진 섹션 헤딩 (①②③ 대체) */
export function NumberChip({ n }: { n: number }) {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">
      {n}
    </span>
  );
}

export function StatCard({
  label,
  value,
  sub,
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-4">
      <div className="text-xs text-ink-400">{label}</div>
      <div className="tnum mt-1 text-xl font-bold text-ink-900">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-ink-500">{sub}</div>}
    </div>
  );
}

export function EmptyState({
  icon = "layers",
  title,
  desc,
  action,
}: {
  icon?: IconName;
  title: string;
  desc?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-300 bg-ink-50 px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-ink-400 shadow-sm">
        <Icon name={icon} size={24} />
      </span>
      <h3 className="mt-3 text-base font-bold text-ink-700">{title}</h3>
      {desc && <p className="mt-1 max-w-sm text-sm text-ink-500">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
