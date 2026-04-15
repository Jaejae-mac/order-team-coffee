/**
 * 투표 결과 화면
 * - 선택지별 득표 수와 비율을 진행 바로 시각화
 * - 투표자 이름을 파트 색상 pill 형태로 표시
 * - 투표 생성자는 마감된 투표를 재오픈 가능
 */
"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PARTS } from "@/lib/constants/parts";
import { reopenPoll } from "@/lib/actions/pollActions";
import { usePollStore } from "@/lib/stores/pollStore";
import type { Poll } from "@/types";

interface PollResultViewProps {
  poll: Poll;
  currentUserName: string;
}

export default function PollResultView({ poll, currentUserName }: PollResultViewProps) {
  const updatePollStatus = usePollStore((state) => state.updatePollStatus);
  const [isReopening, setIsReopening] = useState(false);

  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.vote_count, 0);
  const isCreator  = poll.creator === currentUserName;
  const isClosed   = poll.status === "closed";
  const maxVotes   = Math.max(...poll.options.map((o) => o.vote_count));

  // 복수선택: 중복 집계를 막기 위해 유니크 참여자 수로 비율 계산
  const totalParticipants = poll.allow_multiple
    ? new Set(poll.options.flatMap((opt) => opt.voters.map((v) => v.name))).size
    : totalVotes;

  async function handleReopen() {
    setIsReopening(true);
    try {
      const result = await reopenPoll(poll.id, currentUserName);
      if (result.error) {
        alert(result.error);
        return;
      }
      updatePollStatus(poll.id, "open");
    } finally {
      setIsReopening(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* 총 투표 인원 */}
      <div className="flex items-center justify-center">
        <span className="text-sm text-gray-500">
          현재{" "}
          <span className="font-bold text-violet-600 text-base">{totalParticipants}</span>
          <span className="text-gray-500">명이 참여했어요</span>
          {/* 복수선택: 총 표 수를 괄호로 보조 표시 */}
          {poll.allow_multiple && totalVotes > 0 && (
            <span className="text-gray-400 text-xs ml-1">(총 {totalVotes}표)</span>
          )}
        </span>
      </div>

      {/* 선택지별 결과 */}
      <div className="space-y-3.5">
        {poll.options.map((opt) => {
          // 복수선택: 참여자 기준 비율 / 단일선택: 총 투표 수 기준 비율
          const ratio = totalParticipants > 0 ? (opt.vote_count / totalParticipants) * 100 : 0;
          const isTop = totalVotes > 0 && opt.vote_count === maxVotes && opt.vote_count > 0;

          return (
            <div key={opt.id} className="space-y-1.5">
              {/* 선택지 이름 + 득표 정보 */}
              <div className="flex items-center justify-between gap-2">
                <span className={`text-sm font-medium truncate ${isTop ? "text-violet-700" : "text-gray-700"}`}>
                  {opt.label}
                  {isTop && (
                    <span className="ml-1.5 text-xs font-normal text-violet-400">✓ 최다</span>
                  )}
                </span>
                <span className="text-xs text-gray-400 flex-shrink-0 tabular-nums">
                  {opt.vote_count}표 · {Math.round(ratio)}%
                </span>
              </div>

              {/* 진행 바 */}
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width:      `${ratio}%`,
                    background: isTop
                      ? "linear-gradient(to right, #7c3aed, #a855f7)"
                      : "#e5e7eb",
                  }}
                />
              </div>

              {/* 투표자 목록 */}
              {opt.voters.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {opt.voters.map((voter) => {
                    const part = PARTS.find((p) => p.id === voter.part);
                    return (
                      <span
                        key={voter.name}
                        className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                        style={
                          part
                            ? { background: part.bg, color: part.color }
                            : { background: "#f3f4f6", color: "#6b7280" }
                        }
                      >
                        {voter.name}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 생성자 전용: 재오픈 버튼 (마감 상태일 때만) */}
      {isCreator && isClosed && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleReopen}
          disabled={isReopening}
          className="w-full gap-2 border-violet-200 text-violet-700 hover:bg-violet-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isReopening ? "animate-spin" : ""}`} />
          {isReopening ? "재오픈 중..." : "투표 재오픈"}
        </Button>
      )}
    </div>
  );
}
