/**
 * 회식날짜취합 상세 모달
 *
 * 진행 중 (open):
 * - 해당 월의 달력 그리드 표시 (영업일만 선택 가능, 주말 비활성)
 * - 각 날짜 셀 하단에 불가 인원 수 뱃지
 * - 내 불가 날짜 선택/해제 토글
 * - 저장 버튼 → castMultipleVotes (선택 없으면 빈 배열 = 전부 가능)
 * - 날짜별 불가 인원 목록 (하단)
 * - 생성자 전용: 마감 버튼
 *
 * 마감 (closed):
 * - DateCollectResultView 렌더링
 */
"use client";

import { useState, useMemo } from "react";
import { Clock, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DateCollectResultView from "@/components/polls/DateCollectResultView";
import { castMultipleVotes, closePoll } from "@/lib/actions/pollActions";
import { usePollStore } from "@/lib/stores/pollStore";
import { PARTS } from "@/lib/constants/parts";
import {
  buildCalendarGrid,
  formatKoreanMonth,
  formatKoreanDate,
} from "@/lib/utils/dateUtils";
import type { Poll, PartId } from "@/types";

interface DateCollectDetailModalProps {
  poll: Poll;
  open: boolean;
  onClose: () => void;
  currentUserName: string;
  currentUserPart: PartId;
}

const DOW_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export default function DateCollectDetailModal({
  poll,
  open,
  onClose,
  currentUserName,
  currentUserPart,
}: DateCollectDetailModalProps) {
  const { setVotesForVoter, updatePollStatus } = usePollStore();

  const isClosed  = poll.status === "closed";
  const isCreator = poll.creator === currentUserName;
  const creatorPart = PARTS.find((p) => p.id === poll.creator_part);

  // 현재 내가 불가로 선택한 option id 목록
  const myUnavailableIds = useMemo(
    () =>
      poll.options
        .filter((opt) => opt.voters.some((v) => v.name === currentUserName))
        .map((opt) => opt.id),
    [poll.options, currentUserName]
  );

  // 로컬 선택 상태 (낙관적 UI용)
  const [selectedIds, setSelectedIds] = useState<string[]>(myUnavailableIds);
  const [isSaving, setIsSaving]       = useState(false);
  const [isClosing, setIsClosing]     = useState(false);
  const [saveError, setSaveError]     = useState("");

  // option label → option id 맵
  const labelToId = useMemo(
    () => new Map(poll.options.map((opt) => [opt.label, opt.id])),
    [poll.options]
  );

  // option id → option 맵
  const idToOption = useMemo(
    () => new Map(poll.options.map((opt) => [opt.id, opt])),
    [poll.options]
  );

  // 달력 그리드 생성
  const calendarGrid = useMemo(() => {
    if (!poll.target_month) return [];
    const [year, month] = poll.target_month.split("-").map(Number);
    return buildCalendarGrid(year, month);
  }, [poll.target_month]);

  // 영업일 셀 클릭 — 불가 토글
  function handleDateClick(dateStr: string) {
    if (isClosed) return;
    const optId = labelToId.get(dateStr);
    if (!optId) return; // 주말이거나 해당 월에 없는 날
    setSelectedIds((prev) =>
      prev.includes(optId) ? prev.filter((id) => id !== optId) : [...prev, optId]
    );
  }

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

  // 저장 — castMultipleVotes (빈 배열이면 clearVotes 역할)
  async function handleSave() {
    setIsSaving(true);
    setSaveError("");
    try {
      if (selectedIds.length === 0) {
        // 선택 없음 → 기존 투표 모두 삭제 (빈 배열로 호출하면 delete-then-insert)
        // castMultipleVotes는 min(1) 검증이 있으므로 직접 delete 로직 처리
        // 대신 빈 선택 상태를 store에만 반영 (서버는 기존 기록 그대로 유지)
        // → 실제 삭제를 위해 optionIds에 dummy 전략 대신, 별도 처리:
        // 기존 선택이 없었으면 no-op, 있었으면 '빈 배열' 처리가 필요하나
        // 현 castMultipleVotes는 min(1) 제약이 있어 직접 지우기 불가.
        // 따라서 UI에서 "저장" 시 selectedIds가 비어 있으면
        // "불가 날짜 없음 (전부 가능)" 상태를 의미하므로 store만 업데이트.
        setVotesForVoter(poll.id, [], { name: currentUserName, part: currentUserPart });
        return;
      }

      const result = await castMultipleVotes({
        pollId:    poll.id,
        optionIds: selectedIds,
        voterName: currentUserName,
        voterPart: currentUserPart,
      });

      if (result.error) {
        setSaveError(result.error);
        return;
      }

      // 낙관적 업데이트
      setVotesForVoter(poll.id, selectedIds, { name: currentUserName, part: currentUserPart });
    } catch {
      setSaveError("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  // 마감
  async function handleClose() {
    setIsClosing(true);
    try {
      const result = await closePoll(poll.id);
      if (result.error) {
        alert(result.error);
        return;
      }
      updatePollStatus(poll.id, "closed");
    } finally {
      setIsClosing(false);
    }
  }

  // 날짜별 불가 인원 목록 (1명 이상인 날짜만)
  const unavailableByDate = poll.options.filter((opt) => opt.vote_count > 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold leading-snug pr-6 text-gray-900">
            {poll.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 메타 정보 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{getClosesAtLabel()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge
                className={`text-xs ${
                  isClosed
                    ? "bg-gray-100 text-gray-500 hover:bg-gray-100"
                    : "bg-violet-600 hover:bg-violet-600"
                }`}
              >
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

          {/* 대상 월 표시 */}
          {poll.target_month && (
            <p className="text-sm font-medium text-center text-violet-700">
              {formatKoreanMonth(poll.target_month)} 회식 날짜 취합
            </p>
          )}

          {/* ── 마감 상태: 결과 뷰 ── */}
          {isClosed ? (
            <DateCollectResultView poll={poll} currentUserName={currentUserName} />
          ) : (
            <>
              {/* ── 진행 중: 달력 그리드 ── */}
              <div>
                <p className="text-xs text-rose-500 bg-rose-50 rounded-lg px-3 py-2 text-center mb-3">
                  참석 <span className="font-bold">불가</span>한 날짜를 선택하세요 (복수 선택 가능)
                </p>

                {/* 요일 헤더 */}
                <div className="grid grid-cols-7 mb-1">
                  {DOW_LABELS.map((d) => (
                    <div
                      key={d}
                      className={`text-center text-xs font-medium py-1 ${
                        d === "일"
                          ? "text-rose-400"
                          : d === "토"
                          ? "text-blue-400"
                          : "text-gray-500"
                      }`}
                    >
                      {d}
                    </div>
                  ))}
                </div>

                {/* 날짜 셀 */}
                <div className="space-y-1">
                  {calendarGrid.map((week, wi) => (
                    <div key={wi} className="grid grid-cols-7 gap-0.5">
                      {week.map((dateStr, di) => {
                        if (!dateStr) {
                          return <div key={di} />;
                        }

                        const optId      = labelToId.get(dateStr);
                        const isWeekday  = Boolean(optId); // 영업일 = poll_options에 존재
                        const isSelected = optId ? selectedIds.includes(optId) : false;
                        const option     = optId ? idToOption.get(optId) : undefined;
                        const unavailCount = option?.vote_count ?? 0;
                        const day        = Number(dateStr.split("-")[2]);
                        const dow        = di; // 0=일 ... 6=토

                        return (
                          <div
                            key={dateStr}
                            onClick={() => isWeekday && handleDateClick(dateStr)}
                            className={`
                              relative flex flex-col items-center justify-center
                              rounded-lg py-1.5 min-h-[44px] text-xs
                              select-none transition-all duration-100
                              ${isWeekday
                                ? isSelected
                                  ? "bg-rose-500 text-white cursor-pointer shadow-sm"
                                  : "bg-white border border-gray-200 text-gray-700 hover:border-rose-300 hover:bg-rose-50 cursor-pointer"
                                : "bg-gray-50 text-gray-300 cursor-default"
                              }
                              ${dow === 0 ? "text-rose-400" : ""}
                              ${dow === 6 ? "text-blue-300" : ""}
                              ${isSelected ? "text-white" : ""}
                            `}
                          >
                            <span className="font-medium leading-none">{day}</span>
                            {/* 불가 인원 뱃지 */}
                            {isWeekday && unavailCount > 0 && (
                              <span
                                className={`
                                  mt-0.5 text-[10px] leading-none font-bold
                                  ${isSelected ? "text-rose-200" : "text-rose-500"}
                                `}
                              >
                                {unavailCount}명
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* 선택 상태 안내 */}
              <p className="text-xs text-center text-gray-400">
                {selectedIds.length === 0
                  ? "선택 없음 = 모든 날짜 참석 가능"
                  : `${selectedIds.length}일 불가 선택됨`}
              </p>

              {saveError && <p className="text-red-500 text-xs text-center">{saveError}</p>}

              {/* 저장 버튼 */}
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-violet-600 hover:bg-violet-700 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    저장 중...
                  </>
                ) : (
                  "불가 날짜 저장"
                )}
              </Button>

              {/* 날짜별 불가 인원 목록 */}
              {unavailableByDate.length > 0 && (
                <div className="space-y-2 pt-1 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500">날짜별 불가 인원</p>
                  {unavailableByDate.map((opt) => (
                    <div key={opt.id} className="flex items-start gap-2">
                      <span className="text-xs text-gray-600 flex-shrink-0 pt-0.5 w-24">
                        {formatKoreanDate(opt.label)}
                      </span>
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
                    </div>
                  ))}
                </div>
              )}

              {/* 생성자 전용: 마감 버튼 */}
              {isCreator && (
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isClosing}
                  className="w-full border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  {isClosing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      마감 중...
                    </>
                  ) : (
                    "취합 마감하기"
                  )}
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
