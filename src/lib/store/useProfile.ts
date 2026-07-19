"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Bucket,
  EngineConfig,
  FinancialSnapshot,
  Profile,
  Scenario,
  Tracking,
  Vision,
} from "../types";
import { emptyTracking } from "../types";
import type { FixedExpense, SpendingState, VariableLog } from "../spending/types";
import type { SpendCategory, SpendFavorite } from "../spending/catalog";
import { emptyProfile, ensureSpending } from "./defaults";
import { seedSpending } from "../spending/seed";
import { hasCheckedInThisWeek } from "../tracking";
import { collectDescendantIds } from "../engine/tree";
import { normalizeIncomeSources } from "../income";

const MAX_SCENARIOS = 5;

let idc = 0;
function sid() {
  idc += 1;
  return `s_${idc}_${Math.random().toString(36).slice(2, 8)}`;
}

function withSpending(p: Profile, spending: SpendingState): Profile {
  return touch({ ...p, spending });
}

function touch(p: Profile): Profile {
  return { ...p, updatedAt: new Date().toISOString() };
}

function ensureTracking(p: Profile): Tracking {
  return p.tracking ?? emptyTracking();
}

function migrateBucketLabels(name: string): string {
  if (name === "성장") return "투자";
  if (name === "안전") return "저축";
  return name;
}

function migrateProfile(p: Profile): Profile {
  let next = p;
  if (!next.spending) next = { ...next, spending: seedSpending() };
  if (next.snapshot?.incomeSources) {
    next = {
      ...next,
      snapshot: {
        ...next.snapshot,
        incomeSources: normalizeIncomeSources(next.snapshot.incomeSources),
      },
    };
  }
  if (next.engine?.buckets?.some((b) => b.name === "성장" || b.name === "안전")) {
    next = {
      ...next,
      engine: {
        ...next.engine,
        buckets: next.engine.buckets.map((b) => ({
          ...b,
          name: migrateBucketLabels(b.name),
        })),
      },
    };
  }
  return next;
}

interface ProfileState {
  profile: Profile;
  hasHydrated: boolean;

  setVision: (v: Vision) => void;
  setSnapshot: (s: FinancialSnapshot) => void;
  setEngine: (e: EngineConfig) => void;
  setBuckets: (b: Bucket[]) => void;
  addBucket: (b: Bucket) => void;
  updateBucket: (id: string, patch: Partial<Bucket>) => void;
  removeBucket: (id: string) => void;

  saveScenario: (name: string) => void;
  loadScenario: (id: string) => void;
  deleteScenario: (id: string) => void;

  addAction: (text: string) => void;
  toggleAction: (id: string) => void;
  removeAction: (id: string) => void;
  weeklyCheckIn: () => void;

  setVariableBudget: (won: number) => void;
  addVariableLog: (input: {
    amountWon: number;
    category: SpendCategory;
    date: string;
    memo: string;
  }) => void;
  updateVariableLog: (id: string, patch: Partial<VariableLog>) => void;
  removeVariableLog: (id: string) => void;
  addFixedExpense: (input: Omit<FixedExpense, "id">) => void;
  updateFixedExpense: (id: string, patch: Partial<FixedExpense>) => void;
  removeFixedExpense: (id: string) => void;
  setFavorites: (favorites: SpendFavorite[]) => void;

  completeOnboarding: () => void;
  resetAll: () => void;
  replaceProfile: (p: Profile) => void;
  setHasHydrated: (v: boolean) => void;
}

export const useProfile = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: emptyProfile(),
      hasHydrated: false,

      setVision: (v) => set((st) => ({ profile: touch({ ...st.profile, vision: v }) })),
      setSnapshot: (s) =>
        set((st) => ({
          profile: touch({
            ...st.profile,
            snapshot: {
              ...s,
              incomeSources: normalizeIncomeSources(s.incomeSources),
            },
          }),
        })),
      setEngine: (e) => set((st) => ({ profile: touch({ ...st.profile, engine: e }) })),
      setBuckets: (b) =>
        set((st) => ({
          profile: touch({
            ...st.profile,
            engine: { ...st.profile.engine, buckets: b },
          }),
        })),

      addBucket: (b) =>
        set((st) => ({
          profile: touch({
            ...st.profile,
            engine: {
              ...st.profile.engine,
              buckets: [...st.profile.engine.buckets, b],
            },
          }),
        })),

      updateBucket: (id, patch) =>
        set((st) => ({
          profile: touch({
            ...st.profile,
            engine: {
              ...st.profile.engine,
              buckets: st.profile.engine.buckets.map((x) =>
                x.id === id ? { ...x, ...patch } : x,
              ),
            },
          }),
        })),

      removeBucket: (id) =>
        set((st) => {
          const drop = new Set(collectDescendantIds(id, st.profile.engine.buckets));
          return {
            profile: touch({
              ...st.profile,
              engine: {
                ...st.profile.engine,
                buckets: st.profile.engine.buckets.filter((x) => !drop.has(x.id)),
              },
            }),
          };
        }),

      saveScenario: (name) =>
        set((st) => {
          const sc: Scenario = {
            id: sid(),
            name: name || `시나리오 ${st.profile.scenarios.length + 1}`,
            buckets: st.profile.engine.buckets.map((b) => ({ ...b })),
            createdAt: new Date().toISOString(),
          };
          const scenarios = [sc, ...st.profile.scenarios].slice(0, MAX_SCENARIOS);
          return { profile: touch({ ...st.profile, scenarios }) };
        }),

      loadScenario: (id) =>
        set((st) => {
          const sc = st.profile.scenarios.find((x) => x.id === id);
          if (!sc) return {};
          return {
            profile: touch({
              ...st.profile,
              engine: { buckets: sc.buckets.map((b) => ({ ...b })) },
            }),
          };
        }),

      deleteScenario: (id) =>
        set((st) => ({
          profile: touch({
            ...st.profile,
            scenarios: st.profile.scenarios.filter((x) => x.id !== id),
          }),
        })),

      addAction: (text) =>
        set((st) => {
          const t = ensureTracking(st.profile);
          const action = {
            id: sid(),
            text: text.trim(),
            done: false,
            createdAt: new Date().toISOString(),
          };
          return {
            profile: touch({ ...st.profile, tracking: { ...t, actions: [action, ...t.actions] } }),
          };
        }),

      toggleAction: (id) =>
        set((st) => {
          const t = ensureTracking(st.profile);
          return {
            profile: touch({
              ...st.profile,
              tracking: {
                ...t,
                actions: t.actions.map((a) =>
                  a.id === id
                    ? { ...a, done: !a.done, doneAt: !a.done ? new Date().toISOString() : undefined }
                    : a,
                ),
              },
            }),
          };
        }),

      removeAction: (id) =>
        set((st) => {
          const t = ensureTracking(st.profile);
          return {
            profile: touch({
              ...st.profile,
              tracking: { ...t, actions: t.actions.filter((a) => a.id !== id) },
            }),
          };
        }),

      weeklyCheckIn: () =>
        set((st) => {
          const t = ensureTracking(st.profile);
          if (hasCheckedInThisWeek(t.checkIns)) return {};
          return {
            profile: touch({
              ...st.profile,
              tracking: { ...t, checkIns: [...t.checkIns, new Date().toISOString()] },
            }),
          };
        }),

      setVariableBudget: (won) =>
        set((st) => {
          const s = ensureSpending(st.profile);
          return { profile: withSpending(st.profile, { ...s, monthlyVariableBudgetWon: Math.max(0, won) }) };
        }),

      addVariableLog: (input) =>
        set((st) => {
          const s = ensureSpending(st.profile);
          if (input.amountWon <= 0) return {};
          const log: VariableLog = {
            id: sid(),
            amountWon: Math.round(input.amountWon),
            category: input.category,
            date: input.date,
            memo: input.memo.trim(),
            time: null,
            createdAt: new Date().toISOString(),
          };
          return { profile: withSpending(st.profile, { ...s, logs: [log, ...s.logs] }) };
        }),

      updateVariableLog: (id, patch) =>
        set((st) => {
          const s = ensureSpending(st.profile);
          return {
            profile: withSpending(st.profile, {
              ...s,
              logs: s.logs.map((l) => (l.id === id ? { ...l, ...patch } : l)),
            }),
          };
        }),

      removeVariableLog: (id) =>
        set((st) => {
          const s = ensureSpending(st.profile);
          return {
            profile: withSpending(st.profile, {
              ...s,
              logs: s.logs.filter((l) => l.id !== id),
            }),
          };
        }),

      addFixedExpense: (input) =>
        set((st) => {
          const s = ensureSpending(st.profile);
          const row: FixedExpense = { ...input, id: sid() };
          return { profile: withSpending(st.profile, { ...s, fixed: [...s.fixed, row] }) };
        }),

      updateFixedExpense: (id, patch) =>
        set((st) => {
          const s = ensureSpending(st.profile);
          return {
            profile: withSpending(st.profile, {
              ...s,
              fixed: s.fixed.map((f) => (f.id === id ? { ...f, ...patch } : f)),
            }),
          };
        }),

      removeFixedExpense: (id) =>
        set((st) => {
          const s = ensureSpending(st.profile);
          return {
            profile: withSpending(st.profile, {
              ...s,
              fixed: s.fixed.filter((f) => f.id !== id),
            }),
          };
        }),

      setFavorites: (favorites) =>
        set((st) => {
          const s = ensureSpending(st.profile);
          return { profile: withSpending(st.profile, { ...s, favorites }) };
        }),

      completeOnboarding: () =>
        set((st) => ({
          profile: touch({
            ...st.profile,
            onboardedAt: st.profile.onboardedAt ?? new Date().toISOString(),
          }),
        })),

      resetAll: () => set({ profile: emptyProfile() }),
      replaceProfile: (p) => set({ profile: migrateProfile(p) }),
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "looplus-profile-v1",
      storage: createJSONStorage(() => {
        if (typeof window !== "undefined") {
          try {
            const next = "looplus-profile-v1";
            const prev = "cyrano-profile-v1";
            if (!localStorage.getItem(next) && localStorage.getItem(prev)) {
              localStorage.setItem(next, localStorage.getItem(prev)!);
            }
          } catch {
            /* ignore */
          }
        }
        return localStorage;
      }),
      partialize: (st) => ({ profile: st.profile }),
      onRehydrateStorage: () => (state) => {
        if (state && !state.profile.spending) {
          state.profile = migrateProfile(state.profile);
        }
        state?.setHasHydrated(true);
      },
    },
  ),
);

export const MAX_SCENARIOS_LIMIT = MAX_SCENARIOS;

/** 컴포넌트용 안전한 spending 셀렉터 */
export function selectSpending(profile: Profile): SpendingState {
  return ensureSpending(migrateProfile(profile));
}
