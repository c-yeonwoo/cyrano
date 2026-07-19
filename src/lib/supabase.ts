import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase 클라이언트 (선택적).
 *
 * MVP 스켈레톤의 기본 영속 계층은 localStorage(useProfile persist)다.
 * 환경변수가 설정되면 Supabase 클라이언트가 생성되어, 인증 + 정규화 테이블
 * (supabase/migrations/0001_init.sql) 로 동기화하는 다음 단계에 사용된다.
 *
 * 이렇게 한 이유: 백엔드 미설정 상태에서도 앱이 즉시 '실행 가능'하도록.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
/** publishable(sb_…) 또는 legacy anon JWT — 둘 다 createClient 2번째 인자로 사용 */
const publicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && publicKey);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) client = createClient(url!, publicKey!);
  return client;
}
