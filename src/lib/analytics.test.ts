import { describe, expect, it } from "vitest";
import { ANALYTICS_EVENTS } from "./analytics";

describe("analytics event catalog", () => {
  it("includes north-star funnel events", () => {
    for (const e of [
      "onboarding_started",
      "onboarding_completed",
      "aha_engine_allocated",
      "page_viewed",
      "lead_cta_clicked",
      "weekly_checkin",
    ] as const) {
      expect(ANALYTICS_EVENTS).toContain(e);
    }
  });

  it("has unique event names", () => {
    expect(new Set(ANALYTICS_EVENTS).size).toBe(ANALYTICS_EVENTS.length);
  });
});
