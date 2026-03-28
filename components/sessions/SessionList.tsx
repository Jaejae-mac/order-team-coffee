/**
 * 세션 목록 컴포넌트
 * - "접수중" / "마감" 탭으로 세션을 분류해서 보여줌
 * - 각 카드 클릭 시 SessionDetailModal을 열어 주문 상세를 확인
 */
"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import SessionCard from "@/components/sessions/SessionCard";
import SessionDetailModal from "@/components/sessions/SessionDetailModal";
import type { Session, PartId } from "@/types";

interface SessionListProps {
  sessions: Session[];
  currentUserName: string;
  currentUserPart: PartId | "";
}

export default function SessionList({
  sessions,
  currentUserName,
  currentUserPart,
}: SessionListProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const openSessions = sessions.filter((s) => s.status === "open");
  const closedSessions = sessions.filter((s) => s.status === "closed");
  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  return (
    <>
      <Tabs defaultValue="open" className="w-full">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="open" className="flex-1">
            접수중 ({openSessions.length})
          </TabsTrigger>
          <TabsTrigger value="closed" className="flex-1">
            마감 ({closedSessions.length})
          </TabsTrigger>
        </TabsList>

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
                  onClick={() => setSelectedSessionId(session.id)}
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
                  onClick={() => setSelectedSessionId(session.id)}
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
