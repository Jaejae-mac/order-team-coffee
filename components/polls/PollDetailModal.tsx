/**
 * 투표 상세 모달
 * - 투표를 완료한 사람: 바로 결과 화면을 보여줌
 * - 투표 미완료자: 투표 참여 화면을 먼저 보여주고, 완료 후 결과 화면으로 전환
 * - 투표 생성자: 마감된 투표를 재오픈 가능 (결과 화면에서)
 */
"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PollResultView from "@/components/polls/PollResultView";
import { castVote } from "@/lib/actions/pollActions";
import { usePollStore } from "@/lib/stores/pollStore";
import { PARTS } from "@/lib/constants/parts";
import type { Poll, PartId } from "@/types";

interface PollDetailModalProps {
  poll: Poll;
  open: boolean;
  onClose: () => void;
  currentUserName: string;
  currentUserPart: PartId;
  /** true이면 투표 참여 없이 결과 화면부터 표시 (VoterCountBadge 클릭 시) */
  resultOnly?: boolean;
}

export default function PollDetailModal({
  poll,
  open,
  onClose,
  currentUserName,
  currentUserPart,
  resultOnly = false,
}: PollDetailModalProps) {
  const addVoteToPoll = usePollStore((state) => state.addVoteToPoll);

  // 현재 사용자가 이미 투표했는지 확인
  const myVote = poll.options.find((opt) =>
    opt.voters.some((v) => v.name === currentUserName)
  );
  const hasVoted = Boolean(myVote);

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState("");
  // 투표 완료 후 결과 화면으로 전환
  const [showResult, setShowResult] = useState(hasVoted || resultOnly || poll.status === "closed");

  const isClosed = poll.status === "closed";
  const creatorPart = PARTS.find((p) => p.id === poll.creator_part);

  // 마감까지 남은 시간 계산
  function getClosesAtLabel() {
    const diff = new Date(poll.closes_at).getTime() - Date.now();
    if (diff <= 0) return "마감됨";
    const hours = Math.floor(diff / 1000 / 60 / 60);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `${days}일 후 마감`;
    }
    if (hours > 0) return `${hours}시간 ${minutes}분 후 마감`;
    return `${minutes}분 후 마감`;
  }

  async function handleVote() {
    if (!selectedOptionId) return;
    setIsVoting(true);
    setError("");

    try {
      const result = await castVote({
        pollId:    poll.id,
        optionId:  selectedOptionId,
        voterName: currentUserName,
        voterPart: currentUserPart,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      // 낙관적 업데이트: 결과를 즉시 반영
      addVoteToPoll(poll.id, selectedOptionId, {
        name: currentUserName,
        part: currentUserPart,
      });
      setShowResult(true);
    } catch {
      setError("투표 중 오류가 발생했습니다.");
    } finally {
      setIsVoting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base leading-snug pr-6">{poll.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 투표 메타 정보: 마감 시각 + 상태 + 생성자 */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{getClosesAtLabel()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={isClosed ? "secondary" : "default"}
                className={`text-xs ${isClosed ? "" : "bg-violet-600"}`}
              >
                {isClosed ? "마감" : "진행 중"}
              </Badge>
              {creatorPart && (
                <span
                  className="px-2 py-0.5 rounded-full font-medium"
                  style={{ background: creatorPart.bg, color: creatorPart.color }}
                >
                  {poll.creator}
                </span>
              )}
            </div>
          </div>

          {/* 투표 내용 (설명) */}
          {poll.description && (
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">
              {poll.description}
            </p>
          )}

          {/* 투표 참여 화면 or 결과 화면 */}
          {showResult ? (
            <PollResultView poll={poll} currentUserName={currentUserName} />
          ) : (
            <div className="space-y-3">
              {/* 선택지 라디오 버튼 목록 */}
              <div className="space-y-2">
                {poll.options.map((opt) => {
                  const isSelected = selectedOptionId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedOptionId(opt.id)}
                      disabled={isClosed}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all cursor-pointer"
                      style={{
                        borderColor: isSelected ? "#7c3aed" : "#e5e7eb",
                        background:  isSelected ? "#f5f3ff" : "white",
                      }}
                    >
                      {/* 커스텀 라디오 원 */}
                      <div
                        className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                        style={{
                          borderColor: isSelected ? "#7c3aed" : "#d1d5db",
                        }}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-violet-600" />
                        )}
                      </div>
                      <span
                        className="text-sm font-medium"
                        style={{ color: isSelected ? "#5b21b6" : "#374151" }}
                      >
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              {/* 투표하기 버튼 */}
              <Button
                onClick={handleVote}
                disabled={!selectedOptionId || isVoting || isClosed}
                className="w-full bg-violet-600 hover:bg-violet-700"
              >
                {isVoting ? "투표 중..." : "투표하기"}
              </Button>

              {/* 투표 안 하고 결과만 보기 (투표 인원 배지에서 열린 경우) */}
              {resultOnly && (
                <button
                  onClick={() => setShowResult(true)}
                  className="w-full text-xs text-gray-400 text-center hover:text-gray-600 cursor-pointer"
                >
                  결과만 보기
                </button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
