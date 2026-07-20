import { describe, expect, it } from "vitest";
import { stepsForOrder } from "./onboardingOrder";

describe("onboardingOrder.stepsForOrder", () => {
  it("diagnosis_first 는 B→A→C", () => {
    const keys = stepsForOrder("diagnosis_first").map((s) => s.key);
    expect(keys).toEqual(["diagnosis", "goals", "engine"]);
  });

  it("goals_first 는 A→B→C", () => {
    const keys = stepsForOrder("goals_first").map((s) => s.key);
    expect(keys).toEqual(["goals", "diagnosis", "engine"]);
  });

  it("엔진 직전 스텝 nextLabel 은 자산 설계로", () => {
    const steps = stepsForOrder("diagnosis_first");
    expect(steps[1]!.nextLabel).toBe("자산 설계로");
    expect(steps[2]!.nextLabel).toBe("완료 · 홈으로");
  });
});
