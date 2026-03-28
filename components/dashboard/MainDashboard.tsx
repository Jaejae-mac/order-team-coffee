/**
 * 메인 대시보드 클라이언트 컴포넌트
 * - 서버에서 받은 초기 세션 데이터를 sessionStore에 주입
 * - Realtime 구독을 시작해 다른 팀원의 주문을 실시간으로 반영
 * - 로그인 상태 확인 후 /login으로 안내 (세션스토리지 초기화 시)
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import SessionList from "@/components/sessions/SessionList";
import CreateSessionModal from "@/components/sessions/CreateSessionModal";
import FloatingActionButton from "@/components/layout/FloatingActionButton";
import GameButton from "@/components/layout/GameButton";
import { useSessionStore } from "@/lib/stores/sessionStore";
import { useAuthStore } from "@/lib/stores/authStore";
import { useRealtimeSessions } from "@/hooks/useRealtimeSessions";
import type { Session, PartId } from "@/types";

interface MainDashboardProps {
  initialSessions: Session[];
  initialPart: PartId;
}

export default function MainDashboard({
  initialSessions,
  initialPart,
}: MainDashboardProps) {
  const router = useRouter();
  const { name, part, isLoggedIn } = useAuthStore();
  const { sessions, setSessions, addSession } = useSessionStore();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // 로그인 상태가 없으면 /login으로 이동 (세션스토리지 초기화 시)
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, router]);

  // 서버에서 받은 초기 세션을 스토어에 저장
  useEffect(() => {
    setSessions(initialSessions);
  }, [initialSessions, setSessions]);

  // Realtime 구독 시작 (현재 파트 또는 서버에서 내려온 파트 사용)
  const activePart = (part || initialPart) as PartId;
  useRealtimeSessions(activePart);

  if (!isLoggedIn) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 pb-40">
        <SessionList
          sessions={sessions}
          currentUserName={name}
          currentUserPart={part}
        />
      </main>

      {/* 게임 버튼 (+ 버튼 위) */}
      <GameButton onClick={() => {}} />

      {/* 새 세션 생성 FAB */}
      <FloatingActionButton onClick={() => setCreateModalOpen(true)} />

      {/* 세션 생성 모달 */}
      <CreateSessionModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        userName={name}
        userPart={part}
        onCreated={(session) => {
          addSession(session);
          setCreateModalOpen(false);
        }}
      />
    </div>
  );
}
