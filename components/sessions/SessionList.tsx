/**
 * 세션 목록 컴포넌트
 * - "접수중" / "마감" 탭으로 세션을 분류해서 보여줌
 * - 각 카드 클릭 시 SessionDetailModal을 열어 주문 상세를 확인
 * - 새로고침 버튼으로 전체 세션 목록을 DB에서 재조회 가능
 */
"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import SessionCard from "@/components/sessions/SessionCard";
import SessionDetailModal from "@/components/sessions/SessionDetailModal";
import { deleteSession } from "@/lib/actions/sessionActions";
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
  const removeSession = useSessionStore((state) => state.removeSession);

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
        {/* 탭 + 새로고침 버튼 행 */}
        <div className="flex items-center gap-2 mb-4">
          <TabsList className="flex-1">
            <TabsTrigger value="open" className="flex-1">
              접수중 ({openSessions.length})
            </TabsTrigger>
            <TabsTrigger value="closed" className="flex-1">
              마감 ({closedSessions.length})
            </TabsTrigger>
          </TabsList>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50 shrink-0"
              title="목록 새로고침"
            >
              {isRefreshing
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <RefreshCw className="w-4 h-4" />
              }
            </button>
          )}
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
                  onClick={() => setSelectedSessionId(session.id)}
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
                  onClick={() => setSelectedSessionId(session.id)}
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
          onClose={() => setSelectedSessionId(null)}
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
