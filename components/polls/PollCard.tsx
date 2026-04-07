/**
 * 투표 목록에서 각 투표를 카드 형태로 보여주는 컴포넌트
 * - 클릭하면 투표 참여 또는 결과 화면이 열림
 * - 생성자 본인일 경우 좌측 스와이프로 삭제 버튼 노출
 * - closes_at 기반으로 카운트다운 표시, 만료 시 자동 closed 처리
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Trash2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import VoterCountBadge from "@/components/polls/VoterCountBadge";
import { PARTS } from "@/lib/constants/parts";
import { closePoll, deletePoll } from "@/lib/actions/pollActions";
import { usePollStore } from "@/lib/stores/pollStore";
import type { Poll } from "@/types";

interface PollCardProps {
  poll: Poll;
  currentUserName: string;
  /** 카드 클릭 시 (투표 참여/결과 화면 열기) */
  onClick: () => void;
  /** 투표 인원 뱃지 클릭 시 (결과만 열기) */
  onVoterClick: () => void;
}

// 삭제 버튼이 완전히 노출되는 너비
const DELETE_BTN_WIDTH = 80;
const SNAP_THRESHOLD   = 40;

export default function PollCard({ poll, currentUserName, onClick, onVoterClick }: PollCardProps) {
  const { updatePollStatus, removePoll } = usePollStore();
  const isOpen = poll.status === "open";
  const isMyPoll = poll.creator === currentUserName;
  const creatorPart = PARTS.find((p) => p.id === poll.creator_part);

  // 전체 투표 수
  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.vote_count, 0);

  // ── 카운트다운 타이머 ────────────────────────────────────────
  const [countdown, setCountdown] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    function calcCountdown() {
      const diff = new Date(poll.closes_at).getTime() - Date.now();
      if (diff <= 0) {
        setCountdown("마감됨");
        // 클라이언트 타이머 만료 → optimistic close 후 서버에도 반영
        updatePollStatus(poll.id, "closed");
        closePoll(poll.id).catch(() => {});
        return;
      }
      const hours   = Math.floor(diff / 1000 / 60 / 60);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      if (hours >= 24) {
        const days = Math.floor(hours / 24);
        setCountdown(`${days}일 후 마감`);
      } else if (hours > 0) {
        setCountdown(`${hours}시간 ${minutes}분`);
      } else {
        setCountdown(`${minutes}분 후 마감`);
      }
    }

    calcCountdown();
    const timer = setInterval(calcCountdown, 60_000);
    return () => clearInterval(timer);
  }, [isOpen, poll.closes_at, poll.id, updatePollStatus]);

  // ── 스와이프 삭제 (SessionCard와 동일한 패턴) ─────────────
  const touchStartX    = useRef(0);
  const touchStartOffset = useRef(0);
  const currentOffset  = useRef(0);
  const didSwipe       = useRef(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSnapping, setIsSnapping]   = useState(false);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current     = e.touches[0].clientX;
    touchStartOffset.current = currentOffset.current;
    didSwipe.current        = false;
    setIsSnapping(false);
  }

  function handleTouchMove(e: React.TouchEvent) {
    const deltaX = e.touches[0].clientX - touchStartX.current;
    if (Math.abs(deltaX) > 10) didSwipe.current = true;
    const newOffset = Math.min(0, Math.max(touchStartOffset.current + deltaX, -DELETE_BTN_WIDTH));
    currentOffset.current = newOffset;
    setSwipeOffset(newOffset);
  }

  function handleTouchEnd() {
    setIsSnapping(true);
    if (currentOffset.current < -SNAP_THRESHOLD) {
      currentOffset.current = -DELETE_BTN_WIDTH;
      setSwipeOffset(-DELETE_BTN_WIDTH);
    } else {
      currentOffset.current = 0;
      setSwipeOffset(0);
    }
  }

  function handleCardClick() {
    if (didSwipe.current) return;
    if (currentOffset.current !== 0) {
      setIsSnapping(true);
      currentOffset.current = 0;
      setSwipeOffset(0);
      return;
    }
    onClick();
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      const result = await deletePoll(poll.id, currentUserName);
      if (result.error) {
        alert(result.error);
        return;
      }
      removePoll(poll.id);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* 삭제 버튼 (생성자 본인만 렌더링) */}
      {isMyPoll && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="absolute right-0 top-0 bottom-0 flex flex-col items-center justify-center gap-1 bg-red-500 text-white disabled:opacity-60"
          style={{ width: DELETE_BTN_WIDTH }}
        >
          {isDeleting
            ? <Loader2 className="w-5 h-5 animate-spin" />
            : <Trash2 className="w-5 h-5" />
          }
          <span className="text-xs font-medium">{isDeleting ? "" : "삭제"}</span>
        </button>
      )}

      {/* 카드 본체 */}
      <button
        onClick={handleCardClick}
        onTouchStart={isMyPoll ? handleTouchStart : undefined}
        onTouchMove={isMyPoll ? handleTouchMove : undefined}
        onTouchEnd={isMyPoll ? handleTouchEnd : undefined}
        className="relative w-full text-left rounded-2xl p-4 bg-white border border-violet-100 hover:shadow-md active:opacity-90 transition-shadow cursor-pointer"
        style={{
          transform:  `translateX(${swipeOffset}px)`,
          transition: isSnapping ? "transform 0.2s ease-out" : "box-shadow 0.15s",
          touchAction: isMyPoll ? "pan-y" : "auto",
        }}
      >
        {/* 상단: 제목 + 상태 뱃지 */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* 투표 아이콘 */}
            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <p className="font-semibold text-gray-800 text-sm truncate">{poll.title}</p>
          </div>
          <Badge
            variant={isOpen ? "default" : "secondary"}
            className={`flex-shrink-0 text-xs ${isOpen ? "bg-violet-600" : ""}`}
          >
            {isOpen ? "진행중" : "마감"}
          </Badge>
        </div>

        {/* 설명 (있을 경우) */}
        {poll.description && (
          <p className="text-xs text-gray-500 mb-2 line-clamp-1">{poll.description}</p>
        )}

        {/* 선택지 미리보기 (최대 3개) */}
        <div className="space-y-1 mb-3">
          {poll.options.slice(0, 3).map((opt, idx) => (
            <div key={opt.id} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="text-gray-400">{idx + 1}.</span>
              <span className="truncate">{opt.label}</span>
            </div>
          ))}
          {poll.options.length > 3 && (
            <p className="text-xs text-gray-400">+{poll.options.length - 3}개 더</p>
          )}
        </div>

        {/* 하단: 마감 시각 + 투표 인원 뱃지 + 생성자 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{countdown || (isOpen ? "계산 중..." : "마감됨")}</span>
          </div>
          <div className="flex items-center gap-2">
            <VoterCountBadge count={totalVotes} onClick={onVoterClick} />
            {creatorPart && (
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: creatorPart.bg, color: creatorPart.color }}
              >
                {poll.creator}
              </span>
            )}
          </div>
        </div>
      </button>
    </div>
  );
}
