/**
 * 회식날짜취합 결과 화면
 *
 * 마감 후 결과 레이아웃:
 * - 최종 가능 날짜: 아무도 불가로 선택하지 않은 영업일 목록
 * - 인원별 불가 날짜: 각 참여자가 선택한 날짜 목록
 * - 생성자 전용: 재오픈 버튼
 */
"use client";

import { useState } from "react";
import { RefreshCw, CalendarCheck, CalendarX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PARTS } from "@/lib/constants/parts";
import { reopenPoll } from "@/lib/actions/pollActions";
import { usePollStore } from "@/lib/stores/pollStore";
import { formatKoreanDate } from "@/lib/utils/dateUtils";
import type { Poll, PartId } from "@/types";

interface DateCollectResultViewProps {
  poll: Poll;
  currentUserName: string;
}

export default function DateCollectResultView({
  poll,
  currentUserName,
}: DateCollectResultViewProps) {
  const updatePollStatus = usePollStore((state) => state.updatePollStatus);
  const [isReopening, setIsReopening] = useState(false);

  const isCreator = poll.creator === currentUserName;
  const isClosed  = poll.status === "closed";

  // 가능 날짜: 아무도 불가로 선택하지 않은 날짜
  const availableDates = poll.options.filter((opt) => opt.vote_count === 0);

  // 인원별 불가 날짜 그루핑
  const voterMap = new Map<string, { part: PartId; dates: string[] }>();
  poll.options.forEach((opt) => {
    opt.voters.forEach((voter) => {
      if (!voterMap.has(voter.name)) {
        voterMap.set(voter.name, { part: voter.part, dates: [] });
      }
      voterMap.get(voter.name)!.dates.push(opt.label);
    });
  });
  // 날짜 순 정렬
  voterMap.forEach((v) => v.dates.sort());

  // 참여 인원 수 (불가 날짜를 하나라도 선택한 사람)
  const participantCount = voterMap.size;

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
    <div className="space-y-5">
      {/* 참여 현황 */}
      <p className="text-sm text-center text-gray-500">
        <span className="font-bold text-violet-600 text-base">{participantCount}</span>명이 불가 날짜를 제출했어요
      </p>

      {/* ── 최종 가능 날짜 ── */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <CalendarCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-700">최종 가능 날짜 (영업일)</span>
        </div>
        {availableDates.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-3 bg-gray-50 rounded-xl">
            모든 날짜에 불가 인원이 있습니다
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5 bg-emerald-50 rounded-xl px-3 py-3">
            {availableDates.map((opt) => (
              <span
                key={opt.id}
                className="text-xs font-medium px-2.5 py-1 rounded-full bg-white border border-emerald-200 text-emerald-700"
              >
                {formatKoreanDate(opt.label)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── 인원별 불가 날짜 ── */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <CalendarX className="w-4 h-4 text-rose-500" />
          <span className="text-sm font-semibold text-gray-700">인원별 불가 날짜</span>
        </div>

        {voterMap.size === 0 ? (
          <p className="text-xs text-gray-400 text-center py-3 bg-gray-50 rounded-xl">
            불가 날짜를 선택한 인원이 없습니다
          </p>
        ) : (
          <div className="space-y-2">
            {Array.from(voterMap.entries()).map(([name, info]) => {
              const part = PARTS.find((p) => p.id === info.part);
              return (
                <div key={name} className="bg-gray-50 rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={
                        part
                          ? { background: part.bg, color: part.color }
                          : { background: "#f3f4f6", color: "#6b7280" }
                      }
                    >
                      {name}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed pl-1">
                    {info.dates.map((d) => formatKoreanDate(d)).join(", ")}
                  </p>
                </div>
              );
            })}
          </div>
        )}
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
