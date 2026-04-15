/**
 * 세션 목록 컴포넌트
 * - "접수중" / "마감" 탭으로 세션을 분류해서 보여줌
 * - 각 카드 클릭 시 SessionDetailModal을 열어 주문 상세를 확인
 * - 새로고침은 PWA에서 당겨서 새로고침으로 동작 (버튼 없음)
 */
"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import SessionCard from "@/components/sessions/SessionCard";
import SessionDetailModal from "@/components/sessions/SessionDetailModal";
import { deleteSession, getSessionById } from "@/lib/actions/sessionActions";
import { useSessionStore } from "@/lib/stores/sessionStore";
import type { Session, PartId } from "@/types";

interface SessionListProps {
  sessions: Session[];
  currentUserName: string;
  currentUserPart: PartId | "";
  onRefresh?: () => Promise<void>;
  isRefreshing?: boolean;
}

export default function SessionList({
  sessions,
  currentUserName,
  currentUserPart,
  onRefresh,
  isRefreshing = false,
}: SessionListProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  // 카드 클릭 후 DB 조회 중인 세션 ID — 해당 카드에 로딩 오버레이 표시
  const [openingSessionId, setOpeningSessionId] = useState<string | null>(null);

  const removeSession  = useSessionStore((state) => state.removeSession);
  const replaceSession = useSessionStore((state) => state.replaceSession);

  /**
   * 세션 카드 클릭
   * 1. DB에서 최신 데이터를 가져와 스토어를 갱신
   * 2. 모달 오픈 (fetch 실패 시에도 기존 데이터로 오픈)
   * 이미 다른 세션을 여는 중이거나 목록 갱신 중이면 무시
   */
  async function handleSessionClick(sessionId: string) {
    if (openingSessionId || isRefreshing) return;

    setOpeningSessionId(sessionId);
    try {
      const result = await getSessionById(sessionId);
      if (result.data) replaceSession(result.data);
    } finally {
      // fetch 성공·실패 모두 모달은 반드시 오픈
      setOpeningSessionId(null);
      setSelectedSessionId(sessionId);
    }
  }

  /**
   * 모달 닫기
   * 1. 모달을 즉시 닫음
   * 2. 메인 화면 세션 목록을 DB에서 재조회해 최신 상태로 갱신
   */
  async function handleModalClose() {
    setSelectedSessionId(null);
    try {
      await onRefresh?.();
    } catch {
      // 갱신 실패는 무시 — 화면은 이미 닫힌 상태
    }
  }

  /** 세션 삭제 — 서버 삭제 성공 즉시 스토어에서도 제거 (realtime 도달 전 즉각 반영) */
  async function handleDeleteSession(sessionId: string) {
    const result = await deleteSession(sessionId, currentUserName);
    if (result.error) {
      alert(result.error);
      return;
    }
    // 낙관적 업데이트: 서버 삭제 성공 후 로컬 스토어에서 즉시 제거
    removeSession(sessionId);
  }

  const openSessions = sessions.filter((s) => s.status === "open");
  const closedSessions = sessions.filter((s) => s.status === "closed");
  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  return (
    <>
      <Tabs defaultValue="open" className="w-full">
        {/* 탭 행 */}
        <div className="mb-4">
          <TabsList className="w-full">
            <TabsTrigger value="open" className="flex-1">
              접수중 ({openSessions.length})
            </TabsTrigger>
            <TabsTrigger value="closed" className="flex-1">
              마감 ({closedSessions.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* 접수중 세션 목록 */}
        <TabsContent value="open">
          {openSessions.length === 0 ? (
            <EmptyState message="접수중인 주문이 없습니다" sub="+ 버튼을 눌러 주문 수집을 시작하세요" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {openSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  currentUserName={currentUserName}
                  onClick={() => handleSessionClick(session.id)}
                  isOpening={openingSessionId === session.id}
                  onDelete={handleDeleteSession}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* 마감된 세션 목록 */}
        <TabsContent value="closed">
          {closedSessions.length === 0 ? (
            <EmptyState message="마감된 주문이 없습니다" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {closedSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  currentUserName={currentUserName}
                  onClick={() => handleSessionClick(session.id)}
                  isOpening={openingSessionId === session.id}
                  onDelete={handleDeleteSession}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 세션 상세 모달 — 파트가 설정된 경우에만 렌더링 */}
      {selectedSession && currentUserPart !== "" && (
        <SessionDetailModal
          session={selectedSession}
          open={Boolean(selectedSessionId)}
          onClose={handleModalClose}
          currentUserName={currentUserName}
          currentUserPart={currentUserPart}
        />
      )}
    </>
  );
}

/** 빈 목록 안내 메시지 */
function EmptyState({ message, sub }: { message: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-4xl mb-3">☕</span>
      <p className="text-gray-500 font-medium">{message}</p>
      {sub && <p className="text-sm text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}
