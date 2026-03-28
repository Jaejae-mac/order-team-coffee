/**
 * 주문 관련 Server Actions
 * - 주문 추가/수정/취소를 처리
 * - 모든 함수에서 인증 쿠키 확인 후 실행
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
  AddOrderSchema,
  EditOrderSchema,
  type AddOrderInput,
  type EditOrderInput,
} from "@/lib/validations/orderSchema";
import type { ActionResult, Order, PartId } from "@/types";

/** 인증 확인 헬퍼 */
async function requireAuth(): Promise<{ ok: true } | { ok: false; error: string }> {
  const cookieStore = await cookies();
  const verified = cookieStore.get("verified")?.value;
  if (verified !== "true") {
    return { ok: false, error: "인증이 필요합니다." };
  }
  return { ok: true };
}

/** 주문 추가 */
export async function addOrder(
  sessionId: string,
  input: AddOrderInput
): Promise<ActionResult<Order>> {
  const auth = await requireAuth();
  if (!auth.ok) return { data: null, error: auth.error };

  try {
    const parsed = AddOrderSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0].message };
    }

    const supabase = createServerClient();
    const d = parsed.data;

    // 세션이 열려 있는지 확인
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("status")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) return { data: null, error: "세션을 찾을 수 없습니다." };
    if (session.status === "closed") {
      return { data: null, error: "마감된 세션에는 주문을 추가할 수 없습니다." };
    }

    const { data, error } = await supabase
      .from("orders")
      .insert({
        session_id: sessionId,
        name: d.name,
        part: d.part,
        menu: d.menu,
        size: d.size,
        temp: d.temp,
        memo: d.memo,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      data: { ...data, part: data.part as PartId, temp: data.temp as "HOT" | "ICE" },
      error: null,
    };
  } catch (err) {
    const message = getErrorMessage(err, "주문 추가에 실패했습니다.");
    return { data: null, error: message };
  }
}

/** 주문 수정 — 마감된 세션의 주문은 수정 불가 */
export async function editOrder(
  orderId: string,
  input: EditOrderInput
): Promise<ActionResult<Order>> {
  const auth = await requireAuth();
  if (!auth.ok) return { data: null, error: auth.error };

  try {
    const parsed = EditOrderSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0].message };
    }

    const supabase = createServerClient();

    // 주문의 세션 상태를 확인하여 마감된 세션은 수정 차단
    const { data: order, error: orderFetchError } = await supabase
      .from("orders")
      .select("session_id, sessions(status)")
      .eq("id", orderId)
      .single();

    if (orderFetchError || !order) return { data: null, error: "주문을 찾을 수 없습니다." };

    const sessionStatus = (order.sessions as unknown as { status: string } | null)?.status;
    if (sessionStatus === "closed") {
      return { data: null, error: "마감된 세션의 주문은 수정할 수 없습니다." };
    }

    const { data, error } = await supabase
      .from("orders")
      .update({
        menu: parsed.data.menu,
        size: parsed.data.size,
        temp: parsed.data.temp,
        memo: parsed.data.memo,
      })
      .eq("id", orderId)
      .select()
      .single();

    if (error) throw error;

    return {
      data: { ...data, part: data.part as PartId, temp: data.temp as "HOT" | "ICE" },
      error: null,
    };
  } catch (err) {
    const message = getErrorMessage(err, "주문 수정에 실패했습니다.");
    return { data: null, error: message };
  }
}

/** 주문 취소 (삭제) */
export async function cancelOrder(
  orderId: string
): Promise<ActionResult<void>> {
  const auth = await requireAuth();
  if (!auth.ok) return { data: null, error: auth.error };

  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("id", orderId);

    if (error) throw error;
    return { data: undefined, error: null };
  } catch (err) {
    const message = getErrorMessage(err, "주문 취소에 실패했습니다.");
    return { data: null, error: message };
  }
}
