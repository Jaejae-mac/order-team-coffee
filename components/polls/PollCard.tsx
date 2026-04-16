/**
 * 투표 목록에서 각 투표를 카드 형태로 보여주는 컴포넌트
 * - 클릭하면 투표 참여 또는 결과 화면이 열림
 * - 생성자 본인일 경우 좌측 스와이프로 삭제 버튼 노출
 * - closes_at 기반으로 카운트다운 표시, 만료 시 자동 closed 처리
 * - button 중첩 에러 방지를 위해 카드 wrapper를 div로 구현
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Trash2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import VoterCountBadge from "@/components/polls/VoterCountBadge";
import { PARTS } from "@/lib/constants/parts";
import { closePoll, deletePoll } from "@/lib/actions/pollActions";
import { usePollStore } from "@/lib/stores/pollStore";
import { formatKoreanMonth } from "@/lib/utils/dateUtils";
import type { Poll } from "@/types";

interface PollCardProps {
  poll: Poll;
  currentUserName: string;
  onClick: () => void;
  onVoterClick: () => void;
}

const DELETE_BTN_WIDTH = 80;
const SNAP_THRESHOLD   = 40;

export default function PollCard({ poll, currentUserName, onClick, onVoterClick }: PollCardProps) {
  const { updatePollStatus, removePoll } = usePollStore();
  const isOpen         = poll.status === "open";
  const isMyPoll       = poll.creator === currentUserName;
  const creatorPart    = PARTS.find((p) => p.id === poll.creator_part);
  const totalVotes     = poll.options.reduce((sum, opt) => sum + opt.vote_count, 0);
  const isDateCollect  = poll.poll_type === "date_collect";
  // 날짜취합: 불가를 선택한 유니크 참여자 수
  const participantCount = isDateCollect
    ? new Set(poll.options.flatMap((opt) => opt.voters.map((v) => v.name))).size
    : totalVotes;

  // ── 카운트다운 타이머 ────────────────────────────────────────
  const [countdown, setCountdown] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    function calcCountdown() {
      const diff = new Date(poll.closes_at).getTime() - Date.now();
      if (diff <= 0) {
        setCountdown("마감됨");
        updatePollStatus(poll.id, "closed");
        closePoll(poll.id).catch(() => {});
        return;
      }
      const hours   = Math.floor(diff / 1000 / 60 / 60);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      if (hours >= 24) {
        setCountdown(`${Math.floor(hours / 24)}일 후 마감`);
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

  // ── 스와이프 삭제 ──────────────────────────────────────────
  const touchStartX      = useRef(0);
  const touchStartOffset = useRef(0);
  const currentOffset    = useRef(0);
  const didSwipe         = useRef(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSnapping, setIsSnapping]   = useState(false);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current      = e.touches[0].clientX;
    touchStartOffset.current = currentOffset.current;
    didSwipe.current         = false;
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

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
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
      {/* 삭제 버튼 (생성자 본인만) */}
      {isMyPoll && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="absolute right-0 top-0 bottom-0 flex flex-col items-center justify-center gap-1 bg-red-500 text-white disabled:opacity-60 cursor-pointer"
          style={{ width: DELETE_BTN_WIDTH }}
          aria-label="투표 삭제"
        >
          {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
          <span className="text-xs font-medium">{isDeleting ? "" : "삭제"}</span>
        </button>
      )}

      {/* 카드 본체 — div로 변경하여 button 중첩 방지 */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        onTouchStart={isMyPoll ? handleTouchStart : undefined}
        onTouchMove={isMyPoll ? handleTouchMove : undefined}
        onTouchEnd={isMyPoll ? handleTouchEnd : undefined}
        className="relative w-full text-left rounded-2xl p-4 bg-white border border-violet-100 hover:border-violet-200 hover:shadow-md active:opacity-90 transition-all cursor-pointer select-none"
        style={{
          transform:   `translateX(${swipeOffset}px)`,
          transition:  isSnapping ? "transform 0.2s ease-out" : "border-color 0.15s, box-shadow 0.15s",
          touchAction: isMyPoll ? "pan-y" : "auto",
        }}
        aria-label={`투표: ${poll.title}`}
      >
        {/* 상단: 아이콘 + 제목 + 상태 뱃지 */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isDateCollect ? "bg-emerald-100" : "bg-violet-100"
              }`}
            >
              {isDateCollect ? (
                /* 달력 아이콘 */
                <svg viewBox="0 0 24 24" style={{ width: 18, height: 18 }} className="text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              ) : (
                /* 바 차트 아이콘 */
                <svg viewBox="0 0 24 24" className="text-violet-600" style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              )}
            </div>
            <p className="font-semibold text-gray-800 text-sm leading-snug truncate">{poll.title}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* 날짜취합 뱃지 */}
            {isDateCollect && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                날짜취합
              </span>
            )}
            {/* 복수선택 뱃지 (일반 투표 전용) */}
            {!isDateCollect && poll.allow_multiple && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 font-medium">
                복수선택
              </span>
            )}
            <Badge
              className={`text-xs ${isOpen ? "bg-violet-600 hover:bg-violet-600" : "bg-gray-100 text-gray-500 hover:bg-gray-100"}`}
            >
              {isOpen ? "진행중" : "마감"}
            </Badge>
          </div>
        </div>

        {/* 설명 */}
        {poll.description && (
          <p className="text-xs text-gray-500 mb-2.5 line-clamp-1 pl-11">{poll.description}</p>
        )}

        {/* 날짜취합: 대상 월 표시 */}
        {isDateCollect && poll.target_month ? (
          <div className="pl-11 mb-3">
            <p className="text-xs text-emerald-700 font-medium">
              {formatKoreanMonth(poll.target_month)} 영업일 ({poll.options.length}일)
            </p>
          </div>
        ) : (
          /* 일반 투표: 선택지 미리보기 (최대 3개) */
          <div className="pl-11 space-y-1 mb-3">
            {poll.options.slice(0, 3).map((opt, idx) => (
              <div key={opt.id} className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className="text-gray-400 w-3 flex-shrink-0">{idx + 1}.</span>
                <span className="truncate">{opt.label}</span>
              </div>
            ))}
            {poll.options.length > 3 && (
              <p className="text-xs text-gray-400 pl-4">+{poll.options.length - 3}개 더</p>
            )}
          </div>
        )}

        {/* 하단: 마감 타이머 + 참여 인원 + 생성자 */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-50">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{countdown || (isOpen ? "계산 중..." : "마감됨")}</span>
          </div>
          <div className="flex items-center gap-2">
            <VoterCountBadge count={participantCount} onClick={onVoterClick} />
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
      </div>
    </div>
  );
}
