/**
 * 투표 목록 컴포넌트
 * - "진행중" / "마감" 탭으로 투표를 분류해서 보여줌
 * - 각 카드 클릭 시 투표 참여 or 결과 화면을 모달로 열어줌
 * - 투표 인원 뱃지 클릭 시 결과만 바로 볼 수 있음
 */
"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PollCard from "@/components/polls/PollCard";
import PollDetailModal from "@/components/polls/PollDetailModal";
import DateCollectDetailModal from "@/components/polls/DateCollectDetailModal";
import type { Poll, PartId } from "@/types";

interface PollListProps {
  polls: Poll[];
  currentUserName: string;
  currentUserPart: PartId | "";
}

export default function PollList({ polls, currentUserName, currentUserPart }: PollListProps) {
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null);
  // resultOnly: 투표 인원 뱃지 클릭 시 true (결과 화면 바로 열기)
  const [resultOnly, setResultOnly] = useState(false);

  function openPoll(pollId: string, showResultOnly = false) {
    setSelectedPollId(pollId);
    setResultOnly(showResultOnly);
  }

  const openPolls   = polls.filter((p) => p.status === "open");
  const closedPolls = polls.filter((p) => p.status === "closed");
  const selectedPoll = polls.find((p) => p.id === selectedPollId);

  return (
    <>
      <Tabs defaultValue="open" className="w-full">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="open" className="flex-1">
            진행중 ({openPolls.length})
          </TabsTrigger>
          <TabsTrigger value="closed" className="flex-1">
            마감 ({closedPolls.length})
          </TabsTrigger>
        </TabsList>

        {/* 진행중 투표 목록 */}
        <TabsContent value="open">
          {openPolls.length === 0 ? (
            <PollEmptyState message="진행 중인 투표가 없습니다" sub="+ 버튼을 눌러 투표를 만들어보세요" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {openPolls.map((poll) => (
                <PollCard
                  key={poll.id}
                  poll={poll}
                  currentUserName={currentUserName}
                  onClick={() => openPoll(poll.id, false)}
                  onVoterClick={() => openPoll(poll.id, true)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* 마감된 투표 목록 */}
        <TabsContent value="closed">
          {closedPolls.length === 0 ? (
            <PollEmptyState message="마감된 투표가 없습니다" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {closedPolls.map((poll) => (
                <PollCard
                  key={poll.id}
                  poll={poll}
                  currentUserName={currentUserName}
                  onClick={() => openPoll(poll.id, true)}
                  onVoterClick={() => openPoll(poll.id, true)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 투표 상세 모달 — 타입에 따라 분기 */}
      {selectedPoll && currentUserPart !== "" && (
        selectedPoll.poll_type === "date_collect" ? (
          <DateCollectDetailModal
            poll={selectedPoll}
            open={Boolean(selectedPollId)}
            onClose={() => setSelectedPollId(null)}
            currentUserName={currentUserName}
            currentUserPart={currentUserPart}
          />
        ) : (
          <PollDetailModal
            poll={selectedPoll}
            open={Boolean(selectedPollId)}
            onClose={() => setSelectedPollId(null)}
            currentUserName={currentUserName}
            currentUserPart={currentUserPart}
            resultOnly={resultOnly}
          />
        )
      )}
    </>
  );
}

/** 빈 목록 안내 메시지 */
function PollEmptyState({ message, sub }: { message: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center mb-4 shadow-sm">
        <svg viewBox="0 0 24 24" style={{ width: 28, height: 28 }} className="text-violet-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      </div>
      <p className="text-gray-600 font-semibold text-sm">{message}</p>
      {sub && <p className="text-xs text-gray-400 mt-1.5">{sub}</p>}
    </div>
  );
}
