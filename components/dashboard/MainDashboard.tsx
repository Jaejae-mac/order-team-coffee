/**
 * 메인 대시보드 클라이언트 컴포넌트
 * - 서버에서 받은 초기 세션/투표 데이터를 각 스토어에 주입
 * - Realtime 구독을 시작해 다른 팀원의 주문/투표를 실시간으로 반영
 * - 로그인 상태 확인 후 /login으로 안내 (세션스토리지 초기화 시)
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Header from "@/components/layout/Header";
import SessionList from "@/components/sessions/SessionList";
import CreateSessionModal from "@/components/sessions/CreateSessionModal";
import PollList from "@/components/polls/PollList";
import CreatePollModal from "@/components/polls/CreatePollModal";
import FloatingActionButton from "@/components/layout/FloatingActionButton";
import GameModal from "@/components/layout/GameModal";
import { useSessionStore } from "@/lib/stores/sessionStore";
import { usePollStore } from "@/lib/stores/pollStore";
import { useAuthStore } from "@/lib/stores/authStore";
import { useRealtimeSessions } from "@/hooks/useRealtimeSessions";
import { useRealtimePolls } from "@/hooks/useRealtimePolls";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { getSessions } from "@/lib/actions/sessionActions";
import type { Session, Poll, PartId } from "@/types";

interface MainDashboardProps {
  initialSessions: Session[];
  initialPolls: Poll[];
  initialPart: PartId;
}

export default function MainDashboard({
  initialSessions,
  initialPolls,
  initialPart,
}: MainDashboardProps) {
  const router = useRouter();
  const { name, part, isLoggedIn, _hasHydrated } = useAuthStore();
  const { sessions, setSessions, addSession } = useSessionStore();
  const { polls, setPolls, addPoll } = usePollStore();

  const [createSessionModalOpen, setCreateSessionModalOpen] = useState(false);
  const [createPollModalOpen, setCreatePollModalOpen]       = useState(false);
  const [gameOpen, setGameOpen] = useState(false);
  const [isRefreshingSessions, setIsRefreshingSessions] = useState(false);

  // sessionStorage 복원 완료 후에만 로그인 상태를 확인
  // (_hasHydrated 전에는 isLoggedIn이 항상 false이므로 복원을 기다림)
  useEffect(() => {
    if (_hasHydrated && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, _hasHydrated, router]);

  // 서버에서 받은 초기 데이터를 스토어에 저장
  useEffect(() => {
    setSessions(initialSessions);
  }, [initialSessions, setSessions]);

  useEffect(() => {
    setPolls(initialPolls);
  }, [initialPolls, setPolls]);

  // Realtime 구독 시작 (현재 파트 또는 서버에서 내려온 파트 사용)
  const activePart = (part || initialPart) as PartId;
  useRealtimeSessions(activePart);
  useRealtimePolls(activePart);

  // 세션 목록 수동 새로고침 — Realtime이 누락한 변경사항을 DB에서 직접 재조회
  async function handleRefreshSessions() {
    setIsRefreshingSessions(true);
    try {
      const result = await getSessions(activePart);
      if (result.data) setSessions(result.data);
    } finally {
      setIsRefreshingSessions(false);
    }
  }

  // PWA 전용 당겨서 새로고침 (브라우저에서는 비활성화)
  const { pullDistance, isPWA } = usePullToRefresh(
    handleRefreshSessions,
    isRefreshingSessions,
  );

  // sessionStorage 복원 전 또는 미로그인 시 렌더링하지 않음
  if (!_hasHydrated) return null;
  if (!isLoggedIn) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 pb-40">
        {/* PWA 당겨서 새로고침 인디케이터 */}
        {isPWA && (isRefreshingSessions || pullDistance > 0) && (
          <div
            className="flex items-center justify-center overflow-hidden -mt-4 mb-2"
            style={{ height: isRefreshingSessions ? 44 : Math.round(pullDistance * 0.55) }}
          >
            <Loader2
              className={`w-5 h-5 text-amber-700 ${isRefreshingSessions ? "animate-spin" : ""}`}
              style={{
                opacity: Math.min(pullDistance / 60, 1),
                transform: isRefreshingSessions
                  ? undefined
                  : `rotate(${pullDistance * 3}deg)`,
              }}
            />
          </div>
        )}

        {/* 최상위 탭: 커피주문 / 투표 */}
        <Tabs defaultValue="coffee" className="w-full">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="coffee" className="flex-1 gap-2">
              {/* 커피 아이콘 */}
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
                <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                <line x1="6" y1="2" x2="6" y2="4" />
                <line x1="10" y1="2" x2="10" y2="4" />
                <line x1="14" y1="2" x2="14" y2="4" />
              </svg>
              커피주문
            </TabsTrigger>
            <TabsTrigger value="poll" className="flex-1 gap-2">
              {/* 투표 아이콘 */}
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              투표
            </TabsTrigger>
          </TabsList>

          {/* 커피주문 탭 */}
          <TabsContent value="coffee">
            <SessionList
              sessions={sessions}
              currentUserName={name}
              currentUserPart={part}
              onRefresh={handleRefreshSessions}
              isRefreshing={isRefreshingSessions}
            />
          </TabsContent>

          {/* 투표 탭 */}
          <TabsContent value="poll">
            <PollList
              polls={polls}
              currentUserName={name}
              currentUserPart={part}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* 마블 레이스 게임 전체화면 모달 */}
      <GameModal open={gameOpen} onClose={() => setGameOpen(false)} />

      {/* FAB — 게임 버튼이 내부에 통합되어 메뉴 열릴 때 자연스럽게 스택됨 */}
      <FloatingActionButton
        onCoffeeClick={() => setCreateSessionModalOpen(true)}
        onPollClick={()   => setCreatePollModalOpen(true)}
        onGameClick={()   => setGameOpen(true)}
      />

      {/* 세션 생성 모달 */}
      <CreateSessionModal
        open={createSessionModalOpen}
        onClose={() => setCreateSessionModalOpen(false)}
        userName={name}
        userPart={part}
        onCreated={(session) => {
          addSession(session);
          setCreateSessionModalOpen(false);
        }}
      />

      {/* 투표 생성 모달 */}
      <CreatePollModal
        open={createPollModalOpen}
        onClose={() => setCreatePollModalOpen(false)}
        userName={name}
        userPart={part}
        onCreated={(poll) => {
          addPoll(poll);
          setCreatePollModalOpen(false);
        }}
      />
    </div>
  );
}
