/**
 * 서버 환경에서 사용하는 Supabase 클라이언트
 * - Server Actions, API Routes에서 DB 쓰기 작업에 사용됩니다
 * - service_role 키를 사용하므로 RLS를 우회해 모든 쓰기가 가능합니다
 * - 이 파일은 절대 클라이언트 컴포넌트에서 import하면 안 됩니다
 */
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createServerClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        // 서버에서는 세션 관리가 필요 없으므로 자동 새로고침 비활성화
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
