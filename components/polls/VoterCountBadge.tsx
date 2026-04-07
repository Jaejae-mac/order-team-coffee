/**
 * 투표 카드 하단 우측에 표시되는 "현재 N명 투표" 클릭 가능 뱃지
 * - 투표 미완료자도 이 뱃지를 클릭해 현재 투표 현황을 볼 수 있음
 */
"use client";

import { Users } from "lucide-react";

interface VoterCountBadgeProps {
  count: number;
  onClick: () => void;
}

export default function VoterCountBadge({ count, onClick }: VoterCountBadgeProps) {
  return (
    <button
      onClick={(e) => {
        // 카드 클릭(상세 모달)과 이벤트 충돌 방지
        e.stopPropagation();
        onClick();
      }}
      className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-xs font-medium hover:bg-violet-200 transition-colors cursor-pointer"
      aria-label={`현재 ${count}명 투표, 클릭해서 현황 보기`}
    >
      <Users className="w-3 h-3" />
      {count}명 투표
    </button>
  );
}
