import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ActionItem,
  Bucket,
  BucketCategory,
  DayLog,
  IncomeSource,
  Profile,
  RoutineItem,
  Scenario,
  Scene,
  Tracking,
} from "../types";
import { emptyProfile } from "./defaults";
import { normalizeTracking } from "../tracking";

/** action_items jsonb: 레거시 ActionItem[] 또는 v2 { routines, logs, actions } */
function trackingFromDb(raw: unknown, checkIns: string[]): Tracking {
  if (raw && typeof raw === "object" && !Array.isArray(raw) && (raw as { v?: number }).v === 2) {
    const o = raw as {
      routines?: RoutineItem[];
      logs?: DayLog[];
      actions?: ActionItem[];
      dismissedNextStepStage?: number | null;
    };
    return normalizeTracking({
      routines: o.routines ?? [],
      logs: o.logs ?? [],
      actions: o.actions ?? [],
      checkIns,
      dismissedNextStepStage: o.dismissedNextStepStage ?? null,
    });
  }
  return normalizeTracking({
    actions: Array.isArray(raw) ? (raw as ActionItem[]) : [],
    checkIns,
    routines: [],
    logs: [],
  });
}

function trackingToDb(t: Tracking | undefined) {
  const n = normalizeTracking(t);
  return {
    v: 2 as const,
    routines: n.routines,
    logs: n.logs,
    actions: n.actions,
    dismissedNextStepStage: n.dismissedNextStepStage ?? null,
  };
}

/**
 * Profile ↔ Supabase 정규화 테이블(0001_init.sql) 매핑.
 *
 * - engine_buckets.id 는 uuid(default). 로컬 문자열 id는 저장하지 않고 DB가 생성 →
 *   load 시 DB uuid를 bucket.id로 사용한다(재저장은 delete+insert로 치환).
 * - vision/snapshot 은 user_id PK upsert. buckets/scenarios 는 delete 후 insert.
 * - 존재하지 않는 프로필(신규 유저)은 null 반환.
 */

interface BucketRow {
  id: string;
  category: string;
  name: string;
  ratio_pct: number;
  expected_annual_return_pct: number;
  realized_yield_pct: number;
  is_locked: boolean;
  lock_until_age: number | null;
  linked_tool: string | null;
  position: number;
}

function rowToBucket(r: BucketRow): Bucket {
  return {
    id: r.id,
    category: r.category as BucketCategory,
    name: r.name,
    ratioPct: Number(r.ratio_pct),
    expectedAnnualReturnPct: Number(r.expected_annual_return_pct),
    realizedYieldPct: Number(r.realized_yield_pct),
    isLocked: r.is_locked,
    lockUntilAge: r.lock_until_age ?? undefined,
    linkedTool: r.linked_tool ?? undefined,
    position: r.position,
  };
}

function bucketToRow(b: Bucket, userId: string) {
  return {
    user_id: userId,
    category: b.category,
    name: b.name,
    ratio_pct: b.ratioPct,
    expected_annual_return_pct: b.expectedAnnualReturnPct,
    realized_yield_pct: b.realizedYieldPct,
    is_locked: b.isLocked,
    lock_until_age: b.lockUntilAge ?? null,
    linked_tool: b.linkedTool ?? null,
    position: b.position,
  };
}

export async function loadProfile(
  sb: SupabaseClient,
  userId: string,
): Promise<Profile | null> {
  const { data: prof, error } = await sb
    .from("profiles")
    .select("onboarded_at, action_items, check_ins")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!prof) return null;

  const [visionRes, snapRes, bucketRes, scenRes] = await Promise.all([
    sb.from("visions").select("*").eq("user_id", userId).maybeSingle(),
    sb.from("snapshots").select("*").eq("user_id", userId).maybeSingle(),
    sb.from("engine_buckets").select("*").eq("user_id", userId).order("position"),
    sb.from("scenarios").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);

  const profile = emptyProfile();
  profile.onboardedAt = prof.onboarded_at ?? null;
  profile.updatedAt = new Date().toISOString();
  profile.tracking = trackingFromDb(prof.action_items, (prof.check_ins as string[]) ?? []);

  if (visionRes.data) {
    const v = visionRes.data;
    profile.vision = {
      goalNetworth: Number(v.goal_networth),
      goalPassiveIncome: Number(v.goal_passive_income),
      targetYears: v.target_years,
      currentAge: v.current_age ?? undefined,
      why: v.why ?? "",
      scenes: (v.scenes as Scene[]) ?? [],
    };
  }
  if (snapRes.data) {
    const s = snapRes.data;
    profile.snapshot = {
      cash: Number(s.cash),
      investAssets: Number(s.invest_assets),
      realEstate: Number(s.real_estate),
      liabilities: Number(s.liabilities),
      incomeSources: (s.income_sources as IncomeSource[]) ?? [],
      monthlySpending: Number(s.monthly_spending),
      emergencyMonths: Number(s.emergency_months),
    };
  }
  profile.engine = {
    buckets: (bucketRes.data ?? []).map((r) => rowToBucket(r as BucketRow)),
  };
  profile.scenarios = (scenRes.data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    buckets: r.buckets as Bucket[],
    createdAt: r.created_at,
  })) as Scenario[];

  return profile;
}

export async function saveProfile(
  sb: SupabaseClient,
  userId: string,
  profile: Profile,
): Promise<void> {
  // profiles (+ tracking)
  await sb.from("profiles").upsert(
    {
      id: userId,
      onboarded_at: profile.onboardedAt,
      action_items: trackingToDb(profile.tracking),
      check_ins: profile.tracking?.checkIns ?? [],
    },
    { onConflict: "id" },
  );

  // vision
  if (profile.vision) {
    const v = profile.vision;
    await sb.from("visions").upsert(
      {
        user_id: userId,
        goal_networth: v.goalNetworth,
        goal_passive_income: v.goalPassiveIncome,
        target_years: v.targetYears,
        current_age: v.currentAge ?? null,
        why: v.why,
        scenes: v.scenes,
      },
      { onConflict: "user_id" },
    );
  }

  // snapshot
  if (profile.snapshot) {
    const s = profile.snapshot;
    await sb.from("snapshots").upsert(
      {
        user_id: userId,
        cash: s.cash,
        invest_assets: s.investAssets,
        real_estate: s.realEstate,
        liabilities: s.liabilities,
        income_sources: s.incomeSources,
        monthly_spending: s.monthlySpending,
        emergency_months: s.emergencyMonths,
      },
      { onConflict: "user_id" },
    );
  }

  // engine_buckets: 치환
  await sb.from("engine_buckets").delete().eq("user_id", userId);
  if (profile.engine.buckets.length > 0) {
    await sb
      .from("engine_buckets")
      .insert(profile.engine.buckets.map((b) => bucketToRow(b, userId)));
  }

  // scenarios: 치환
  await sb.from("scenarios").delete().eq("user_id", userId);
  if (profile.scenarios.length > 0) {
    await sb.from("scenarios").insert(
      profile.scenarios.map((sc) => ({
        user_id: userId,
        name: sc.name,
        buckets: sc.buckets,
        created_at: sc.createdAt,
      })),
    );
  }
}

/** 로컬 프로필에 실데이터가 있는지 (신규 로그인 시 remote로 이관할지 판단) */
export function profileHasData(p: Profile): boolean {
  return Boolean(p.snapshot || p.vision || p.engine.buckets.length > 0);
}
