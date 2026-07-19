import { NextResponse } from "next/server";

/** Railway / 로드밸런서 헬스체크. 비밀 정보 없음. */
export function GET() {
  return NextResponse.json({
    ok: true,
    service: "cyrano",
    ts: new Date().toISOString(),
    supabase: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
    analytics: Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY),
  });
}
