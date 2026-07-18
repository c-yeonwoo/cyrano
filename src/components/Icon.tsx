import type { SVGProps } from "react";

/**
 * Cyrano 아이콘 세트 — 이모지 대체용 인라인 SVG.
 * 24 그리드 · stroke 기반 · currentColor. 외부 의존성 없음.
 */
export type IconName =
  | "home"
  | "engine"
  | "diagnosis"
  | "target"
  | "wallet"
  | "check"
  | "check-circle"
  | "users"
  | "chevron-right"
  | "arrow-right"
  | "plus"
  | "lock"
  | "trash"
  | "copy"
  | "loop"
  | "info"
  | "alert"
  | "trending-up"
  | "building"
  | "shield"
  | "receipt"
  | "cart"
  | "sun"
  | "briefcase"
  | "coins"
  | "layers"
  | "x"
  | "calculator"
  | "image"
  | "flag"
  | "sparkle";

const PATHS: Record<IconName, React.ReactNode> = {
  home: <path d="M4 11.5 12 4l8 7.5M6 10v9h12v-9" />,
  engine: (
    <>
      <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
      <circle cx="16" cy="7" r="2.4" />
      <circle cx="8" cy="17" r="2.4" />
    </>
  ),
  diagnosis: <path d="M3 12h4l2.5 6 4-13 2.5 7H21" />,
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3" />
      <rect x="3" y="7.5" width="18" height="12" rx="2.5" />
      <circle cx="16.5" cy="13.5" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  check: <path d="M5 12.5 10 17 19 7" />,
  "check-circle": (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 12.2 11 14.7 15.7 9.5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="9" r="3" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M16 6.2A3 3 0 0 1 16 12M17 14c2.2.4 4 2.3 4 5" />
    </>
  ),
  "chevron-right": <path d="M9 5l7 7-7 7" />,
  "arrow-right": <path d="M4 12h15M13 6l6 6-6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="9" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </>
  ),
  trash: <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />,
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </>
  ),
  loop: <path d="M4 9a8 8 0 0 1 14-3l2 2M20 15a8 8 0 0 1-14 3l-2-2M18 4v4h-4M6 20v-4h4" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  alert: <path d="M12 4 2.5 20h19L12 4zM12 10v4M12 17h.01" />,
  "trending-up": <path d="M4 15l5-5 4 4 7-7M15 7h5v5" />,
  building: (
    <>
      <rect x="5" y="4" width="14" height="16" rx="1.5" />
      <path d="M9 8h1M14 8h1M9 12h1M14 12h1M10.5 20v-4h3v4" />
    </>
  ),
  shield: <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />,
  receipt: (
    <>
      <path d="M6 3.5h12v17l-2.5-1.5L13 20.5 10.5 19 8 20.5 6 19V3.5z" />
      <path d="M9 8h6M9 11.5h6" />
    </>
  ),
  cart: (
    <>
      <path d="M4 5h2l2 11h9l2-8H7" />
      <circle cx="9" cy="19.5" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="17" cy="19.5" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3.5" y="7.5" width="17" height="12" rx="2" />
      <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3.5 12.5h17" />
    </>
  ),
  coins: (
    <>
      <ellipse cx="9" cy="7" rx="5" ry="2.5" />
      <path d="M4 7v4c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V7" />
      <path d="M14 12.5c2.6.1 5 1.2 5 2.5 0 1.4-2.2 2.5-5 2.5-1 0-2-.15-2.8-.4" />
    </>
  ),
  layers: <path d="M12 4 3 9l9 5 9-5-9-5zM3 14l9 5 9-5" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  calculator: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15v3M8 18h4" />
    </>
  ),
  image: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M5 17l4.5-4 3 2.5L16 12l3 3" />
    </>
  ),
  flag: <path d="M6 21V4M6 4h11l-2 3.5L17 11H6" />,
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />,
};

interface Props extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 20, className, ...rest }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
