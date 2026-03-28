/**
 * 브라우저 환경에서 사용하는 Supabase 클라이언트
 * - Realtime 구독(실시간 주문 업데이트)에 사용됩니다
 * - anon 키를 사용하므로 읽기 전용입니다
 */
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
