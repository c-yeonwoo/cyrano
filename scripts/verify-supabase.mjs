#!/usr/bin/env node
/**
 * Supabase E2E 스모크 (로컬 또는 원격).
 *
 * 사용:
 *   supabase start
 *   npm run verify:supabase
 *
 * 또는 env로 원격 지정:
 *   NEXT_PUBLIC_SUPABASE_URL=… NEXT_PUBLIC_SUPABASE_ANON_KEY=… SUPABASE_SERVICE_ROLE_KEY=… npm run verify:supabase
 */

import { createClient } from "@supabase/supabase-js";
import { execSync } from "node:child_process";

function loadLocalEnv() {
  try {
    const out = execSync("supabase status -o env", { encoding: "utf8" });
    const env = {};
    for (const line of out.split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)="(.*)"$/);
      if (m) env[m[1]] = m[2];
    }
    return env;
  } catch {
    return {};
  }
}

const local = loadLocalEnv();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || local.API_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || local.ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY || local.SERVICE_ROLE_KEY;

function fail(msg) {
  console.error("FAIL:", msg);
  process.exit(1);
}

function ok(msg) {
  console.log("OK  ", msg);
}

if (!url || !anon || !service) {
  fail(
    "URL/ANON/SERVICE_ROLE 키가 없습니다. `supabase start` 후 다시 실행하거나 env를 설정하세요.",
  );
}

const admin = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const email = `e2e_${Date.now()}@cyrano.test`;
const password = `E2e_${Math.random().toString(36).slice(2)}!9`;

console.log("→ Supabase E2E against", url);

// 1) 스키마 존재
const tables = ["profiles", "visions", "snapshots", "engine_buckets", "scenarios"];
for (const t of tables) {
  const { error } = await admin.from(t).select("*").limit(0);
  if (error) fail(`table ${t}: ${error.message}`);
  ok(`table ${t}`);
}

// 2) 유저 생성 → profiles 트리거
const { data: created, error: createErr } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});
if (createErr) fail(`createUser: ${createErr.message}`);
const userId = created.user.id;
ok(`auth user ${userId}`);

const { data: prof, error: profErr } = await admin
  .from("profiles")
  .select("id, action_items, check_ins")
  .eq("id", userId)
  .maybeSingle();
if (profErr) fail(`profiles trigger: ${profErr.message}`);
if (!prof) fail("profiles row missing after signup (handle_new_user trigger?)");
ok("profiles auto-created");

// 3) 정규화 저장 (앱 supabaseRepo와 동일 패턴)
const { error: vErr } = await admin.from("visions").upsert({
  user_id: userId,
  goal_networth: 100000,
  goal_passive_income: 300,
  target_years: 15,
  why: "e2e",
  scenes: [],
});
if (vErr) fail(`visions upsert: ${vErr.message}`);

const { error: sErr } = await admin.from("snapshots").upsert({
  user_id: userId,
  cash: 500,
  invest_assets: 1000,
  real_estate: 0,
  liabilities: 0,
  income_sources: [{ type: "labor", monthly: 300 }],
  monthly_spending: 150,
  emergency_months: 3,
});
if (sErr) fail(`snapshots upsert: ${sErr.message}`);

await admin.from("engine_buckets").delete().eq("user_id", userId);
const { error: bErr } = await admin.from("engine_buckets").insert({
  user_id: userId,
  category: "invest",
  name: "주식",
  ratio_pct: 100,
  expected_annual_return_pct: 8,
  realized_yield_pct: 2,
  is_locked: false,
  position: 0,
});
if (bErr) fail(`engine_buckets insert: ${bErr.message}`);

const { error: tErr } = await admin
  .from("profiles")
  .update({
    onboarded_at: new Date().toISOString(),
    action_items: [{ id: "a1", text: "비상금", done: false }],
    check_ins: [new Date().toISOString()],
  })
  .eq("id", userId);
if (tErr) fail(`tracking columns: ${tErr.message}`);
ok("profile write path");

// 4) anon 클라이언트로 로그인 + RLS 읽기
const userClient = createClient(url, anon, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const { error: signErr } = await userClient.auth.signInWithPassword({ email, password });
if (signErr) fail(`signIn: ${signErr.message}`);
ok("password sign-in");

const { data: myVision, error: mvErr } = await userClient
  .from("visions")
  .select("goal_networth")
  .maybeSingle();
if (mvErr) fail(`RLS read vision: ${mvErr.message}`);
if (!myVision || Number(myVision.goal_networth) !== 100000) {
  fail("RLS vision payload mismatch");
}
ok("RLS own-row read");

// 5) 타 유저 데이터 차단 (서비스로 다른 유저 만들고 anon이 못 읽는지)
const { data: other } = await admin.auth.admin.createUser({
  email: `other_${Date.now()}@cyrano.test`,
  password,
  email_confirm: true,
});
await admin.from("visions").upsert({
  user_id: other.user.id,
  goal_networth: 1,
  goal_passive_income: 0,
  target_years: 10,
  scenes: [],
});
const { data: leak, error: leakErr } = await userClient
  .from("visions")
  .select("user_id, goal_networth");
if (leakErr) fail(`RLS list: ${leakErr.message}`);
if ((leak ?? []).some((r) => r.user_id === other.user.id)) {
  fail("RLS leaked another user's vision");
}
ok("RLS isolation");

// cleanup
await admin.auth.admin.deleteUser(userId);
await admin.auth.admin.deleteUser(other.user.id);
ok("cleanup");

console.log("\nAll Supabase E2E checks passed.");
