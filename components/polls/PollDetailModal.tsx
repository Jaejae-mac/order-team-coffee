/**
 * 투표 상세 모달
 *
 * 화면 전환 흐름:
 * - 미투표자 → 투표 화면 (투표하기)
 * - 투표 완료자 → 결과 화면 (투표 변경하기 / 결과 보기)
 * - 결과 화면 → 투표 화면 복귀 (미투표자: 투표하기, 완료자: 투표 변경하기)
 * - 마감된 투표 → 결과 화면만 (생성자: 재오픈 가능)
 *
 * 선택 상태 통합:
 * - selectedOptionIds: string[] 하나로 단일/복수 선택 통합 관리
 *   - 단일선택: 클릭 시 [optionId] 로 교체 (라디오 동작)
 *   - 복수선택: 클릭 시 토글 (체크박스 동작)
 */
"use client";

import { useState } from "react";
import { Clock, Check, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PollResultView from "@/components/polls/PollResultView";
import VoterCountBadge from "@/components/polls/VoterCountBadge";
import { castVote, changeVote, castMultipleVotes } from "@/lib/actions/pollActions";
import { usePollStore } from "@/lib/stores/pollStore";
import { PARTS } from "@/lib/constants/parts";
import type { Poll, PartId } from "@/types";

interface PollDetailModalProps {
  poll: Poll;
  open: boolean;
  onClose: () => void;
  currentUserName: string;
  currentUserPart: PartId;
  /** true이면 결과 화면부터 표시 (VoterCountBadge 클릭 시) */
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
  const { addVoteToPoll, changeVoteInPoll, setVotesForVoter } = usePollStore();

  // 현재 사용자가 투표한 선택지 목록 (매 렌더마다 재계산 — Realtime 반영)
  const myVotedOptions = poll.options.filter((opt) =>
    opt.voters.some((v) => v.name === currentUserName)
  );
  const hasVoted     = myVotedOptions.length > 0;
  const myVotedOptId = myVotedOptions[0]?.id ?? null; // 단일선택 전용 (재투표 시 pre-select)

  const isClosed = poll.status === "closed";

  // 초기 화면: 투표 완료자 or resultOnly or 마감 → 결과 화면 / 그 외 → 투표 화면
  const [showResult, setShowResult]   = useState(hasVoted || resultOnly || isClosed);
  // 재투표 모드: 이미 투표했고 변경 중인 상태
  const [isRevoting, setIsRevoting]   = useState(false);

  // 단일/복수 선택 모두 하나의 배열로 관리
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [isVoting, setIsVoting]       = useState(false);
  const [error, setError]             = useState("");

  const creatorPart = PARTS.find((p) => p.id === poll.creator_part);
  const totalVotes  = poll.options.reduce((sum, opt) => sum + opt.vote_count, 0);

  // 마감까지 남은 시간
  function getClosesAtLabel() {
    const diff = new Date(poll.closes_at).getTime() - Date.now();
    if (diff <= 0) return "마감됨";
    const hours   = Math.floor(diff / 1000 / 60 / 60);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    if (hours >= 24) return `${Math.floor(hours / 24)}일 후 마감`;
    if (hours > 0)   return `${hours}시간 ${minutes}분 후 마감`;
    return `${minutes}분 후 마감`;
  }

  /** 선택지 클릭 처리 — 복수선택: 토글, 단일선택: 교체 */
  function handleOptionClick(optionId: string) {
    if (isClosed) return;
    if (poll.allow_multiple) {
      // 체크박스 동작: 이미 선택돼 있으면 제거, 없으면 추가
      setSelectedOptionIds((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      // 라디오 동작: 항상 하나만 유지
      setSelectedOptionIds([optionId]);
    }
  }

  /** 재투표 모드 진입 — 기존 투표 선택지를 pre-select */
  function enterRevoteMode() {
    if (poll.allow_multiple) {
      // 복수선택: 현재 투표한 모든 선택지를 pre-check
      setSelectedOptionIds(myVotedOptions.map((opt) => opt.id));
    } else {
      // 단일선택: 현재 투표한 선택지 하나만 pre-select
      setSelectedOptionIds(myVotedOptId ? [myVotedOptId] : []);
    }
    setIsRevoting(true);
    setShowResult(false);
    setError("");
  }

  /** 투표 화면으로 돌아가기 (미투표자) */
  function enterVoteMode() {
    setSelectedOptionIds([]);
    setIsRevoting(false);
    setShowResult(false);
    setError("");
  }

  /** 투표 취소 → 결과 화면으로 복귀 */
  function cancelVote() {
    setShowResult(true);
    setIsRevoting(false);
    setSelectedOptionIds([]);
    setError("");
  }

  async function handleVote() {
    if (selectedOptionIds.length === 0) return;
    setIsVoting(true);
    setError("");

    const voter = { name: currentUserName, part: currentUserPart };

    try {
      if (poll.allow_multiple) {
        // ── 복수선택: castMultipleVotes (첫투표 + 재투표 통합) ──
        const result = await castMultipleVotes({
          pollId:    poll.id,
          optionIds: selectedOptionIds,
          voterName: currentUserName,
          voterPart: currentUserPart,
        });
        if (result.error) { setError(result.error); return; }

        // 낙관적 업데이트: voter를 모든 선택지에서 정리 후 새 선택지들에 추가
        setVotesForVoter(poll.id, selectedOptionIds, voter);

      } else if (isRevoting) {
        // ── 단일선택 재투표: changeVote ──
        const result = await changeVote({
          pollId:      poll.id,
          newOptionId: selectedOptionIds[0],
          voterName:   currentUserName,
          voterPart:   currentUserPart,
        });
        if (result.error) { setError(result.error); return; }

        changeVoteInPoll(poll.id, selectedOptionIds[0], voter);

      } else {
        // ── 단일선택 첫투표: castVote ──
        const result = await castVote({
          pollId:    poll.id,
          optionId:  selectedOptionIds[0],
          voterName: currentUserName,
          voterPart: currentUserPart,
        });
        if (result.error) { setError(result.error); return; }

        addVoteToPoll(poll.id, selectedOptionIds[0], voter);
      }

      setShowResult(true);
      setIsRevoting(false);
    } catch {
      setError("처리 중 오류가 발생했습니다.");
    } finally {
      setIsVoting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold leading-snug pr-6 text-gray-900">
            {poll.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 메타 정보: 마감 시각 + 상태 + 생성자 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{getClosesAtLabel()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge className={`text-xs ${isClosed ? "bg-gray-100 text-gray-500 hover:bg-gray-100" : "bg-violet-600 hover:bg-violet-600"}`}>
                {isClosed ? "마감" : "진행 중"}
              </Badge>
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

          {/* 설명 */}
          {poll.description && (
            <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2.5 leading-relaxed">
              {poll.description}
            </p>
          )}

          {/* ── 결과 화면 ── */}
          {showResult ? (
            <div className="space-y-3">
              <PollResultView poll={poll} currentUserName={currentUserName} />

              {/* 미투표자: 투표하기 버튼 */}
              {!isClosed && !hasVoted && (
                <Button
                  variant="outline"
                  onClick={enterVoteMode}
                  className="w-full border-violet-200 text-violet-700 hover:bg-violet-50 cursor-pointer"
                >
                  투표하기
                </Button>
              )}

              {/* 투표 완료자: 투표 변경하기 버튼 */}
              {!isClosed && hasVoted && (
                <Button
                  variant="outline"
                  onClick={enterRevoteMode}
                  className="w-full gap-2 border-violet-200 text-violet-700 hover:bg-violet-50 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  투표 변경하기
                </Button>
              )}
            </div>

          ) : (
            /* ── 투표 참여 화면 ── */
            <div className="space-y-3">
              {/* 복수선택 안내 */}
              {poll.allow_multiple && (
                <p className="text-xs text-violet-600 bg-violet-50 rounded-lg px-3 py-2 text-center">
                  {isRevoting ? "선택지를 추가하거나 제거해 투표를 변경할 수 있어요" : "여러 선택지를 동시에 선택할 수 있어요"}
                </p>
              )}

              {/* 단일선택 재투표 안내 */}
              {!poll.allow_multiple && isRevoting && (
                <p className="text-xs text-violet-600 bg-violet-50 rounded-lg px-3 py-2 text-center">
                  현재 투표를 변경할 수 있어요
                </p>
              )}

              {/* 선택지 목록 */}
              <div className="space-y-2">
                {poll.options.map((opt) => {
                  const isSelected      = selectedOptionIds.includes(opt.id);
                  // 재투표 모드에서 기존 투표 표시용 (단일선택)
                  const isMyCurrentVote = !poll.allow_multiple && opt.id === myVotedOptId;

                  return (
                    <div
                      key={opt.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleOptionClick(opt.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleOptionClick(opt.id);
                        }
                      }}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left
                        transition-all duration-150 select-none
                        ${isClosed
                          ? "cursor-not-allowed opacity-60"
                          : "cursor-pointer hover:border-violet-300 hover:bg-violet-50/50"
                        }
                        ${isSelected
                          ? "border-violet-500 bg-violet-50 border-l-4"
                          : "border-gray-200 bg-white"
                        }
                      `}
                    >
                      {/* 선택 아이콘 — 복수선택: 사각형(체크박스), 단일선택: 원형(라디오) */}
                      <div
                        className={`
                          w-5 h-5 flex-shrink-0 flex items-center justify-center
                          border-2 transition-all duration-150
                          ${poll.allow_multiple ? "rounded-md" : "rounded-full"}
                          ${isSelected
                            ? "border-violet-600 bg-violet-600"
                            : "border-gray-300 bg-white"
                          }
                        `}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                      </div>

                      <span className={`text-sm font-medium transition-colors duration-150 flex-1 ${isSelected ? "text-violet-700" : "text-gray-700"}`}>
                        {opt.label}
                      </span>

                      {/* 단일선택 재투표 모드에서 기존 투표 표시 */}
                      {isRevoting && isMyCurrentVote && !isSelected && (
                        <span className="text-xs text-gray-400 flex-shrink-0">기존 투표</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 현황 뱃지 + 에러 */}
              <div className="flex items-center justify-between min-h-[24px]">
                {error
                  ? <p className="text-red-500 text-xs">{error}</p>
                  : <span />
                }
                <VoterCountBadge
                  count={totalVotes}
                  onClick={() => {
                    setShowResult(true);
                    setIsRevoting(false);
                  }}
                />
              </div>

              {/* 투표하기 / 변경하기 버튼 */}
              <Button
                onClick={handleVote}
                disabled={selectedOptionIds.length === 0 || isVoting || isClosed}
                className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 cursor-pointer"
              >
                {isVoting
                  ? (isRevoting ? "변경 중..." : "투표 중...")
                  : (isRevoting ? "변경하기" : "투표하기")
                }
              </Button>

              {/* 취소 링크 — 결과 화면으로 복귀 (투표 중 아닐 때만) */}
              {!isVoting && (
                <button
                  onClick={cancelVote}
                  className="w-full text-xs text-gray-400 text-center hover:text-gray-600 transition-colors cursor-pointer py-1"
                >
                  취소
                </button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
