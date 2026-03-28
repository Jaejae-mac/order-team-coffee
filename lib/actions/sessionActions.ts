/**
 * 세션 관련 Server Actions
 * - 모든 DB 쓰기 작업은 service_role 키를 쓰는 서버 클라이언트를 통해 수행
 * - 각 Action 최상단에서 인증 쿠키를 확인하여 미인증 접근을 차단
 */
"use server";

/**
 * Supabase PostgrestError는 Error 인스턴스가 아닌 plain object이므로
 * instanceof Error 체크 대신 이 헬퍼를 사용해 메시지를 추출함
 */
function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return fallback;
}

import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import {
  CreateSessionSchema,
  type CreateSessionInput,
} from "@/lib/validations/sessionSchema";
import type { ActionResult, Session, PartId } from "@/types";

/**
 * 인증 확인 헬퍼 — verified 쿠키가 없으면 에러 반환
 * proxy.ts 가 라우팅을 보호하지만, Server Actions는 직접 호출 가능하므로 이중 확인
 */
async function requireAuth(): Promise<{ ok: true } | { ok: false; error: string }> {
  const cookieStore = await cookies();
  const verified = cookieStore.get("verified")?.value;
  if (verified !== "true") {
    return { ok: false, error: "인증이 필요합니다." };
  }
  return { ok: true };
}

/** 세션 목록 조회 — Supabase JOIN으로 단일 쿼리 처리 */
export async function getSessions(
  part: PartId
): Promise<ActionResult<Session[]>> {
  const auth = await requireAuth();
  if (!auth.ok) return { data: null, error: auth.error };

  try {
    const supabase = createServerClient();

    // 세션과 주문을 한 번의 쿼리로 가져옴 (2-쿼리 구조 → 단일 JOIN)
    const { data: sessions, error } = await supabase
      .from("sessions")
      .select("*, orders(*)")
      .eq("creator_part", part)
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!sessions) return { data: [], error: null };

    const result: Session[] = sessions.map((session) => ({
      ...session,
      store_id: session.store_id as Session["store_id"],
      creator_part: session.creator_part as PartId,
      status: session.status as Session["status"],
      orders: (session.orders ?? []).map((o: Record<string, unknown>) => ({
        ...(o as object),
        part: o.part as PartId,
        temp: o.temp as "HOT" | "ICE",
      })),
    }));

    return { data: result, error: null };
  } catch (err) {
    const message = getErrorMessage(err, "세션 조회에 실패했습니다.");
    return { data: null, error: message };
  }
}

/** 세션 생성 */
export async function createSession(
  input: CreateSessionInput
): Promise<ActionResult<Session>> {
  const auth = await requireAuth();
  if (!auth.ok) return { data: null, error: auth.error };

  try {
    const parsed = CreateSessionSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0].message };
    }

    const supabase = createServerClient();
    const d = parsed.data;

    const { data, error } = await supabase
      .from("sessions")
      .insert({
        store_id: d.storeId,
        store_name: d.storeName,
        store_emoji: d.storeEmoji,
        store_color: d.storeColor,
        store_bg: d.storeBg,
        creator: d.creator,
        creator_part: d.creatorPart,
        status: "open",
      })
      .select()
      .single();

    if (error) throw error;

    return {
      data: {
        ...data,
        orders: [],
        store_id: data.store_id as Session["store_id"],
        creator_part: data.creator_part as PartId,
        status: data.status as Session["status"],
      },
      error: null,
    };
  } catch (err) {
    const message = getErrorMessage(err, "세션 생성에 실패했습니다.");
    return { data: null, error: message };
  }
}

/** 세션 마감 (open → closed) — 세션 존재 여부 및 상태 확인 후 변경 */
export async function closeSession(
  sessionId: string
): Promise<ActionResult<void>> {
  const auth = await requireAuth();
  if (!auth.ok) return { data: null, error: auth.error };

  try {
    const supabase = createServerClient();

    // 세션 존재 및 현재 상태 확인
    const { data: session, error: fetchError } = await supabase
      .from("sessions")
      .select("status")
      .eq("id", sessionId)
      .single();

    if (fetchError || !session) return { data: null, error: "세션을 찾을 수 없습니다." };
    if (session.status === "closed") return { data: null, error: "이미 마감된 세션입니다." };

    const { error } = await supabase
      .from("sessions")
      .update({ status: "closed" })
      .eq("id", sessionId);

    if (error) throw error;
    return { data: undefined, error: null };
  } catch (err) {
    const message = getErrorMessage(err, "세션 마감에 실패했습니다.");
    return { data: null, error: message };
  }
}

/** 세션 삭제 — 생성자 본인만 가능, 연결된 주문도 DB cascade로 함께 삭제 */
export async function deleteSession(
  sessionId: string,
  creatorName: string
): Promise<ActionResult<void>> {
  const auth = await requireAuth();
  if (!auth.ok) return { data: null, error: auth.error };

  try {
    const supabase = createServerClient();

    // 세션 존재 및 생성자 일치 확인
    const { data: session, error: fetchError } = await supabase
      .from("sessions")
      .select("creator")
      .eq("id", sessionId)
      .single();

    if (fetchError || !session) return { data: null, error: "세션을 찾을 수 없습니다." };
    if (session.creator !== creatorName) return { data: null, error: "세션 생성자만 삭제할 수 있습니다." };

    const { error } = await supabase
      .from("sessions")
      .delete()
      .eq("id", sessionId);

    if (error) throw error;
    return { data: undefined, error: null };
  } catch (err) {
    const message = getErrorMessage(err, "세션 삭제에 실패했습니다.");
    return { data: null, error: message };
  }
}

/** 세션 재오픈 (closed → open) */
export async function reopenSession(
  sessionId: string
): Promise<ActionResult<void>> {
  const auth = await requireAuth();
  if (!auth.ok) return { data: null, error: auth.error };

  try {
    const supabase = createServerClient();

    const { data: session, error: fetchError } = await supabase
      .from("sessions")
      .select("status")
      .eq("id", sessionId)
      .single();

    if (fetchError || !session) return { data: null, error: "세션을 찾을 수 없습니다." };
    if (session.status === "open") return { data: null, error: "이미 열려 있는 세션입니다." };

    const { error } = await supabase
      .from("sessions")
      .update({ status: "open" })
      .eq("id", sessionId);

    if (error) throw error;
    return { data: undefined, error: null };
  } catch (err) {
    const message = getErrorMessage(err, "세션 재오픈에 실패했습니다.");
    return { data: null, error: message };
  }
}
