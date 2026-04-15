/**
 * Supabase Realtime 구독 훅
 * - sessions / orders 테이블 변경을 실시간으로 감지
 * - 변경이 감지되면 sessionStore를 업데이트해 화면을 자동 갱신
 *
 * 주의: 컴포넌트가 화면에 나타날 때 구독을 시작하고, 사라질 때 해제함
 */
"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSessionStore } from "@/lib/stores/sessionStore";
import type { PartId, Order, Session } from "@/types";

interface RealtimePayload<T> {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: T;
  old: Partial<T>;
}

export function useRealtimeSessions(part: PartId) {
  useEffect(() => {
    const supabase = createClient();
    // effect 내부에서 useSessionStore.getState()로 직접 접근 — 의존성 배열을 part만으로 최소화

    // 1. sessions 테이블 구독 — 파트별 필터 적용
    const sessionChannel = supabase
      .channel(`sessions:${part}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sessions",
          filter: `creator_part=eq.${part}`,
        },
        (payload) => {
          const p = payload as unknown as RealtimePayload<Omit<Session, "orders">>;
          if (p.eventType === "INSERT" || p.eventType === "UPDATE") {
            useSessionStore.getState().upsertSession({
              ...p.new,
              store_id: p.new.store_id as Session["store_id"],
              creator_part: p.new.creator_part as PartId,
              status: p.new.status as Session["status"],
            });
          } else if (p.eventType === "DELETE" && p.old.id) {
            // 세션이 삭제되면 스토어에서도 제거
            useSessionStore.getState().removeSession(p.old.id);
          }
        }
      )
      .subscribe();

    // 2. orders 테이블 구독 — 모든 주문 변경 감지
    const orderChannel = supabase
      .channel(`orders:${part}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          const p = payload as unknown as RealtimePayload<Order>;

          if (p.eventType === "INSERT") {
            useSessionStore.getState().addOrderToSession(p.new.session_id, {
              ...p.new,
              part: p.new.part as PartId,
              temp: p.new.temp as "HOT" | "ICE",
            });
          } else if (p.eventType === "UPDATE") {
            useSessionStore.getState().updateOrderInSession(p.new.session_id, p.new.id, {
              ...p.new,
              part: p.new.part as PartId,
              temp: p.new.temp as "HOT" | "ICE",
            });
          } else if (p.eventType === "DELETE" && p.old.id) {
            // DELETE 이벤트는 session_id 없이 id만 오므로 전체 세션 순회
            const sessions = useSessionStore.getState().sessions;
            for (const session of sessions) {
              const exists = session.orders.some((o) => o.id === p.old.id);
              if (exists) {
                useSessionStore.getState().removeOrderFromSession(session.id, p.old.id!);
                break;
              }
            }
          }
        }
      )
      .subscribe();

    // 컴포넌트가 사라질 때 구독 해제 (메모리 누수 방지)
    return () => {
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(orderChannel);
    };
  }, [part]); // part가 바뀔 때만 재구독 (store 함수는 getState()로 직접 접근하므로 의존성 불필요)
}
