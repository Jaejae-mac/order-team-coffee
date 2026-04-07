/**
 * 투표 결과 화면
 * - 각 선택지별 투표 수와 비율을 진행 바로 시각화
 * - 투표자 이름을 pill 형태로 표시
 * - 생성자는 마감된 투표를 재오픈할 수 있음
 */
"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  // 전체 투표 수 계산
  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.vote_count, 0);
  const isCreator = poll.creator === currentUserName;
  const isClosed = poll.status === "closed";

  async function handleReopen() {
    setIsReopening(true);
    try {
      const result = await reopenPoll(poll.id, currentUserName);
      if (result.error) {
        alert(result.error);
        return;
      }
      // 낙관적 업데이트: 서버 응답 전 화면에 즉시 반영
      updatePollStatus(poll.id, "open");
    } finally {
      setIsReopening(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* 총 투표 인원 */}
      <p className="text-sm text-gray-500 text-center">
        현재{" "}
        <span className="font-bold text-violet-600">{totalVotes}명</span>이 투표했어요
      </p>

      {/* 선택지별 결과 */}
      <div className="space-y-3">
        {poll.options.map((opt) => {
          // 득표율 계산 (0으로 나누기 방지)
          const ratio = totalVotes > 0 ? (opt.vote_count / totalVotes) * 100 : 0;
          const isTopOption =
            totalVotes > 0 &&
            opt.vote_count === Math.max(...poll.options.map((o) => o.vote_count));

          return (
            <div key={opt.id} className="space-y-1">
              {/* 선택지 이름 + 득표 수 */}
              <div className="flex items-center justify-between text-sm">
                <span className={`font-medium ${isTopOption && opt.vote_count > 0 ? "text-violet-700" : "text-gray-700"}`}>
                  {opt.label}
                  {isTopOption && opt.vote_count > 0 && (
                    <span className="ml-1.5 text-xs text-violet-500">최다</span>
                  )}
                </span>
                <span className="text-gray-500 tabular-nums">
                  {opt.vote_count}표 ({Math.round(ratio)}%)
                </span>
              </div>

              {/* 진행 바 */}
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${ratio}%`,
                    background: isTopOption && opt.vote_count > 0
                      ? "linear-gradient(to right, #7c3aed, #a855f7)"
                      : "#d1d5db",
                  }}
                />
              </div>

              {/* 투표자 목록 (pill 형태) */}
              {opt.voters.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {opt.voters.map((voter) => {
                    const part = PARTS.find((p) => p.id === voter.part);
                    return (
                      <span
                        key={voter.name}
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
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

      {/* 투표 상태 뱃지 */}
      <div className="flex items-center justify-center pt-1">
        <Badge variant={isClosed ? "secondary" : "default"} className={isClosed ? "" : "bg-violet-600"}>
          {isClosed ? "마감된 투표" : "진행 중"}
        </Badge>
      </div>

      {/* 생성자 전용: 재오픈 버튼 (마감 상태일 때만 표시) */}
      {isCreator && isClosed && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleReopen}
          disabled={isReopening}
          className="w-full gap-2 border-violet-300 text-violet-700 hover:bg-violet-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isReopening ? "animate-spin" : ""}`} />
          {isReopening ? "재오픈 중..." : "투표 재오픈"}
        </Button>
      )}
    </div>
  );
}
