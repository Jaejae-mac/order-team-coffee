/**
 * 세션 목록 저장소 (Zustand)
 * - 서버에서 가져온 세션 목록을 클라이언트 메모리에 보관
 * - Realtime 이벤트 수신 시 이 스토어를 직접 업데이트하여 화면을 갱신
 */
"use client";

import { create } from "zustand";
import type { Session, Order, PartId } from "@/types";

interface SessionStore {
  sessions: Session[];
  isLoading: boolean;
  error: string | null;

  // 전체 목록 교체 (초기 로드 시)
  setSessions: (sessions: Session[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // 단일 세션 추가 (새 세션 생성 시)
  addSession: (session: Session) => void;

  // 세션 상태 업데이트 (마감/재오픈 시)
  updateSessionStatus: (sessionId: string, status: "open" | "closed") => void;

  // 세션에 주문 추가
  addOrderToSession: (sessionId: string, order: Order) => void;

  // 세션의 특정 주문 업데이트
  updateOrderInSession: (sessionId: string, orderId: string, updates: Partial<Order>) => void;

  // 세션에서 주문 제거
  removeOrderFromSession: (sessionId: string, orderId: string) => void;

  // Realtime: 서버에서 세션 변경이 감지되면 업데이트
  upsertSession: (session: Omit<Session, "orders">) => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  sessions: [],
  isLoading: false,
  error: null,

  setSessions: (sessions) => set({ sessions }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  addSession: (session) =>
    set((state) => ({ sessions: [session, ...state.sessions] })),

  updateSessionStatus: (sessionId, status) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, status } : s
      ),
    })),

  addOrderToSession: (sessionId, order) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId
          ? { ...s, orders: [...s.orders, order] }
          : s
      ),
    })),

  updateOrderInSession: (sessionId, orderId, updates) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              orders: s.orders.map((o) =>
                o.id === orderId ? { ...o, ...updates } : o
              ),
            }
          : s
      ),
    })),

  removeOrderFromSession: (sessionId, orderId) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId
          ? { ...s, orders: s.orders.filter((o) => o.id !== orderId) }
          : s
      ),
    })),

  // Realtime에서 세션 변경을 받으면 기존 세션을 교체하거나 새로 추가
  upsertSession: (sessionData) =>
    set((state) => {
      const exists = state.sessions.some((s) => s.id === sessionData.id);
      if (exists) {
        return {
          sessions: state.sessions.map((s) =>
            s.id === sessionData.id
              ? { ...s, ...sessionData }
              : s
          ),
        };
      }
      // 새 세션은 기존 주문 없이 추가 (이후 주문 INSERT 이벤트로 채워짐)
      return {
        sessions: [{ ...sessionData, orders: [] }, ...state.sessions],
      };
    }),
}));

/** 파트별 세션 필터링 헬퍼 */
export function getPartSessions(sessions: Session[], part: PartId) {
  return sessions.filter((s) => s.creator_part === part);
}
