/**
 * 브라우저 환경에서 사용하는 Supabase 클라이언트
 * - Realtime 구독(실시간 주문 업데이트)에 사용됩니다
 * - anon 키를 사용하므로 읽기 전용입니다
 */
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase 환경변수 누락: NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY가 설정되지 않았습니다."
    );
  }

  return createBrowserClient(url, anonKey);
}
