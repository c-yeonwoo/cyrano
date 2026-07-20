"use client";

import { useEffect, useRef } from "react";
import { useProfile, selectSpending } from "@/lib/store/useProfile";
import { DEFAULT_SNAPSHOT } from "@/lib/store/defaults";
import { monthSpendingBreakdown } from "@/lib/spending/bridge";
import { track } from "@/lib/analytics";

/**
 * uiPrefs.autoSyncSpendToDiagnosis 켜면
 * 당월 지출 실측 → snapshot.monthlySpending 자동 반영.
 */
export function SpendDiagnosisSync() {
  const autoSync = useProfile(
    (s) => s.profile.uiPrefs?.autoSyncSpendToDiagnosis ?? false,
  );
  const profile = useProfile((s) => s.profile);
  const setSnapshot = useProfile((s) => s.setSnapshot);
  const spending = selectSpending(profile);
  const lastSynced = useRef<number | null>(null);

  useEffect(() => {
    if (!autoSync) {
      lastSynced.current = null;
      return;
    }
    const now = new Date();
    const measured = monthSpendingBreakdown(
      spending,
      now.getFullYear(),
      now.getMonth(),
    );
    if (measured.totalWon <= 0) return;
    if (lastSynced.current === measured.manwon) return;

    const snapshot = profile.snapshot ?? DEFAULT_SNAPSHOT;
    if (snapshot.monthlySpending === measured.manwon) {
      lastSynced.current = measured.manwon;
      return;
    }

    setSnapshot({ ...snapshot, monthlySpending: measured.manwon });
    lastSynced.current = measured.manwon;
    track("spend_auto_synced", {
      to: measured.manwon,
      variable_won: measured.variableWon,
      fixed_won: measured.fixedWon,
    });
  }, [
    autoSync,
    spending.logs,
    spending.fixed,
    profile.snapshot,
    setSnapshot,
  ]);

  return null;
}
