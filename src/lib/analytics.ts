/**
 * 시라노 계측 레이어.
 * - PostHog 키 없으면 no-op (로컬 모드와 동일 패턴). DEV에서는 console.debug.
 * - 외부 SDK 의존 0 — capture API fetch만 사용.
 */

export type AnalyticsEvent =
  | "onboarding_started"
  | "onboarding_step_viewed"
  | "onboarding_step_completed"
  | "onboarding_skipped"
  | "onboarding_completed"
  | "page_viewed"
  | "engine_recommend_applied"
  | "aha_engine_allocated"
  | "sensitivity_changed"
  | "scenario_saved"
  | "share_card_shared"
  | "action_added"
  | "action_completed"
  | "weekly_checkin"
  | "lead_cta_clicked";

type Props = Record<string, string | number | boolean | null | undefined>;

const DISTINCT_KEY = "cyrano_distinct_id";
const AHA_KEY = "cyrano_aha_fired";
const STARTED_KEY = "cyrano_onboarding_started";

function posthogKey(): string | undefined {
  return process.env.NEXT_PUBLIC_POSTHOG_KEY || undefined;
}

function posthogHost(): string {
  return (process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com").replace(/\/$/, "");
}

function debugEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "1"
  );
}

export function isAnalyticsConfigured(): boolean {
  return Boolean(posthogKey());
}

export function getDistinctId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = localStorage.getItem(DISTINCT_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `anon_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(DISTINCT_KEY, id);
    }
    return id;
  } catch {
    return `anon_session_${Date.now()}`;
  }
}

/** 로그인 시 익명 ID와 계정 ID를 연결 */
export function identify(userId: string, traits?: Props): void {
  if (typeof window === "undefined") return;
  const key = posthogKey();
  const payload = {
    api_key: key,
    event: "$identify",
    distinct_id: userId,
    properties: {
      $anon_distinct_id: getDistinctId(),
      ...sanitize(traits),
    },
    timestamp: new Date().toISOString(),
  };
  if (debugEnabled()) console.debug("[analytics] identify", userId, traits);
  if (!key) return;
  void send(payload);
  try {
    localStorage.setItem(DISTINCT_KEY, userId);
  } catch {
    /* ignore */
  }
}

export function track(event: AnalyticsEvent, properties?: Props): void {
  if (typeof window === "undefined") return;
  const props = {
    ...sanitize(properties),
    path: window.location.pathname,
    $lib: "cyrano",
    $lib_version: "0.1.0",
  };
  if (debugEnabled()) console.debug("[analytics]", event, props);

  const key = posthogKey();
  if (!key) return;

  void send({
    api_key: key,
    event,
    distinct_id: getDistinctId(),
    properties: props,
    timestamp: new Date().toISOString(),
  });
}

export function trackPageView(path: string): void {
  track("page_viewed", { page: path });
}

/** 온보딩 진입 — 세션당 1회 */
export function trackOnboardingStartedOnce(): void {
  if (typeof window === "undefined") return;
  try {
    if (sessionStorage.getItem(STARTED_KEY)) return;
    sessionStorage.setItem(STARTED_KEY, "1");
  } catch {
    /* ignore */
  }
  track("onboarding_started");
}

/** 엔진 100% 배분 아하 — 브라우저당 1회 */
export function trackAhaAllocatedOnce(properties?: Props): void {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(AHA_KEY)) return;
    localStorage.setItem(AHA_KEY, "1");
  } catch {
    /* ignore */
  }
  track("aha_engine_allocated", properties);
}

function sanitize(properties?: Props): Record<string, string | number | boolean> {
  if (!properties) return {};
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(properties)) {
    if (v === undefined || v === null) continue;
    out[k] = v;
  }
  return out;
}

async function send(body: unknown): Promise<void> {
  try {
    await fetch(`${posthogHost()}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
      mode: "cors",
    });
  } catch (e) {
    if (debugEnabled()) console.warn("[analytics] send failed", e);
  }
}

/** 테스트·문서용 이벤트 목록 */
export const ANALYTICS_EVENTS: AnalyticsEvent[] = [
  "onboarding_started",
  "onboarding_step_viewed",
  "onboarding_step_completed",
  "onboarding_skipped",
  "onboarding_completed",
  "page_viewed",
  "engine_recommend_applied",
  "aha_engine_allocated",
  "sensitivity_changed",
  "scenario_saved",
  "share_card_shared",
  "action_added",
  "action_completed",
  "weekly_checkin",
  "lead_cta_clicked",
];
