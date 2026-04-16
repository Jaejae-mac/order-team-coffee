/**
 * 투표 생성 모달
 * - 제목, 내용, 선택지(최대 10개), 마감 기한을 입력해 새 투표를 만듦
 * - 선택지는 + 버튼으로 추가하고 각 행의 X로 삭제 가능
 */
"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { createPoll, createDateCollectPoll } from "@/lib/actions/pollActions";
import { formatKoreanMonth } from "@/lib/utils/dateUtils";
import type { Poll, PartId } from "@/types";

interface CreatePollModalProps {
  open: boolean;
  onClose: () => void;
  userName: string;
  userPart: string;
  onCreated: (poll: Poll) => void;
}

export default function CreatePollModal({
  open,
  onClose,
  userName,
  userPart,
  onCreated,
}: CreatePollModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  // 선택지 목록 — 기본 2개로 시작
  const [options, setOptions] = useState(["", ""]);
  // 마감 기한 (날짜/시/분 분리 관리)
  const [closeDate, setCloseDate] = useState("");
  const [closeHour, setCloseHour] = useState("23");
  const [closeMinute, setCloseMinute] = useState("59");
  // 복수선택 허용 여부
  const [allowMultiple, setAllowMultiple] = useState(false);
  // 회식날짜취합 모드
  const [isDateCollect, setIsDateCollect] = useState(false);
  const [targetMonth, setTargetMonth] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // 유효성 검사
  const filledOptions = options.filter((o) => o.trim().length > 0);
  const canCreate = isDateCollect
    ? title.trim().length > 0 && targetMonth.length > 0 && closeDate.length > 0
    : title.trim().length > 0 && filledOptions.length >= 2 && closeDate.length > 0;

  /** 선택지 추가 (최대 10개) */
  function addOption() {
    if (options.length >= 10) return;
    setOptions([...options, ""]);
  }

  /** 선택지 삭제 (최소 2개 유지) */
  function removeOption(idx: number) {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== idx));
  }

  /** 선택지 값 변경 */
  function updateOption(idx: number, value: string) {
    setOptions(options.map((opt, i) => (i === idx ? value : opt)));
  }

  async function handleCreate() {
    if (!canCreate) return;
    setIsLoading(true);
    setError("");

    try {
      // 날짜 + 시 + 분을 합쳐 ISO 8601 문자열 생성
      const closesAt = new Date(
        `${closeDate}T${closeHour.padStart(2, "0")}:${closeMinute.padStart(2, "0")}:00`
      ).toISOString();

      if (isDateCollect) {
        const result = await createDateCollectPoll({
          title:       title.trim(),
          description: description.trim(),
          targetMonth,
          closesAt,
          creator:     userName,
          creatorPart: userPart as PartId,
        });
        if (result.error || !result.data) {
          setError(result.error ?? "날짜취합 생성에 실패했습니다.");
          return;
        }
        onCreated(result.data);
        handleClose();
        return;
      }

      const result = await createPoll({
        title:         title.trim(),
        description:   description.trim(),
        options:       filledOptions,
        closesAt,
        allowMultiple,
        creator:       userName,
        creatorPart:   userPart as PartId,
      });

      if (result.error || !result.data) {
        setError(result.error ?? "투표 생성에 실패했습니다.");
        return;
      }

      onCreated(result.data);
      handleClose();
    } catch {
      setError("예상치 못한 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleClose() {
    setTitle("");
    setDescription("");
    setOptions(["", ""]);
    setCloseDate("");
    setCloseHour("23");
    setCloseMinute("59");
    setAllowMultiple(false);
    setIsDateCollect(false);
    setTargetMonth("");
    setError("");
    onClose();
  }

  // 시 옵션: 0~23
  const hourOptions = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  // 분 옵션: 00, 05, 10, ... 55
  const minuteOptions = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {/* 투표 생성 아이콘 — SVG 인라인 (lucide BarChart3 사용) */}
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            투표 만들기
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-1">
          {/* 제목 입력 */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              제목 <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="투표 제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* 내용 입력 */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              내용 <span className="text-gray-400 font-normal">(선택)</span>
            </label>
            <textarea
              placeholder="투표에 대한 설명을 입력하세요"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          {/* 선택지 입력 (일반 투표 전용) */}
          {!isDateCollect && <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              선택지 <span className="text-red-500">*</span>
              <span className="text-gray-400 font-normal ml-1">({options.length}/10)</span>
            </label>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {/* 번호 표시 */}
                  <span className="text-sm text-gray-400 w-5 flex-shrink-0 text-center">
                    {idx + 1}.
                  </span>
                  <Input
                    placeholder={`선택지 ${idx + 1}`}
                    value={opt}
                    onChange={(e) => updateOption(idx, e.target.value)}
                    maxLength={100}
                    className="flex-1"
                  />
                  {/* 최소 2개 이상일 때만 삭제 버튼 표시 */}
                  {options.length > 2 && (
                    <button
                      onClick={() => removeOption(idx)}
                      className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      aria-label={`선택지 ${idx + 1} 삭제`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}

              {/* 선택지 추가 버튼 (최대 10개) */}
              {options.length < 10 && (
                <button
                  onClick={addOption}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  추가하기
                </button>
              )}
            </div>
          </div>}

          {/* 마감 기한 입력 */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              마감 기한 <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              {/* 날짜 선택 */}
              <input
                type="date"
                value={closeDate}
                onChange={(e) => setCloseDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
              />
              {/* 시 선택 */}
              <select
                value={closeHour}
                onChange={(e) => setCloseHour(e.target.value)}
                className="rounded-md border border-input bg-background px-2 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
              >
                {hourOptions.map((h) => (
                  <option key={h} value={h}>{h}시</option>
                ))}
              </select>
              {/* 분 선택 */}
              <select
                value={closeMinute}
                onChange={(e) => setCloseMinute(e.target.value)}
                className="rounded-md border border-input bg-background px-2 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
              >
                {minuteOptions.map((m) => (
                  <option key={m} value={m}>{m}분</option>
                ))}
              </select>
            </div>
          </div>

          {/* 회식날짜취합 토글 */}
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium text-gray-700">회식날짜취합</p>
              {isDateCollect && (
                <p className="text-xs text-emerald-600 mt-0.5">
                  선택한 월의 영업일(월~금)을 선택지로 자동 생성해요
                </p>
              )}
            </div>
            <Switch
              checked={isDateCollect}
              onCheckedChange={(v) => {
                setIsDateCollect(v);
                if (v) {
                  setAllowMultiple(false);
                  setOptions(["", ""]);
                } else {
                  setTargetMonth("");
                }
                setError("");
              }}
              aria-label="회식날짜취합 여부"
            />
          </div>

          {/* 회식날짜취합: 월 선택 */}
          {isDateCollect && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                대상 월 <span className="text-red-500">*</span>
              </label>
              <input
                type="month"
                value={targetMonth}
                onChange={(e) => setTargetMonth(e.target.value)}
                min={new Date().toISOString().slice(0, 7)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
              />
              {targetMonth && (
                <p className="text-xs text-gray-400 mt-1 pl-1">
                  {formatKoreanMonth(targetMonth)} 영업일이 선택지로 생성됩니다
                </p>
              )}
            </div>
          )}

          {/* 일반 투표: 복수선택 허용 토글 */}
          {!isDateCollect && (
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-gray-700">복수선택 허용</p>
                {allowMultiple && (
                  <p className="text-xs text-violet-500 mt-0.5">여러 선택지를 동시에 고를 수 있어요</p>
                )}
              </div>
              <Switch
                checked={allowMultiple}
                onCheckedChange={setAllowMultiple}
                aria-label="복수선택 허용 여부"
              />
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button
            onClick={handleCreate}
            disabled={!canCreate || isLoading}
            className="w-full bg-violet-600 hover:bg-violet-700"
          >
            {isLoading
              ? "생성 중..."
              : isDateCollect
              ? "날짜취합 만들기"
              : "투표 만들기"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
