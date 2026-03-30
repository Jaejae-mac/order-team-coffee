/**
 * 마블 레이스 게임을 전체화면 모달로 표시하는 컴포넌트
 * - 게임 버튼 클릭 시 열리며, iframe으로 /marble-race.html을 로드
 * - 게임 화면 위에 오버레이된 "← 메인" 버튼으로 대시보드로 복귀
 *
 * [뒤로가기 처리]
 * 모달은 CSS overlay이므로 브라우저 히스토리에 항목이 없음.
 * 모달 열릴 때 pushState로 항목을 추가하고 popstate(뒤로가기)를
 * 가로채서 모달을 닫는다 → 메인 세션 화면 유지.
 */
"use client";

import { useEffect } from "react";
import { ChevronLeft } from "lucide-react";

interface GameModalProps {
  open: boolean;
  onClose: () => void;
}

export default function GameModal({ open, onClose }: GameModalProps) {
  useEffect(() => {
    if (!open) return;

    // 모달 열릴 때 히스토리 항목 추가
    // → 뒤로가기가 "/login"이 아닌 이 항목을 먼저 소비
    window.history.pushState({ gameModal: true }, "");

    const handlePopState = () => {
      // 뒤로가기 발생 시 모달 닫기 (페이지 이동 없음)
      onClose();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // "메인" 버튼: history.back() → popstate 발생 → onClose() 호출
  // (직접 onClose() 호출 시 pushState 항목이 남아 히스토리가 오염됨)
  const handleClose = () => window.history.back();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* 게임 iframe — 화면 전체를 차지 */}
      <iframe
        src="/marble-race.html"
        className="absolute inset-0 w-full h-full border-none"
        title="마블 레이스 게임"
      />

      {/* 메인 화면 이동 버튼 — 게임 위에 오버레이, 상단 좌측 고정
          부모 문서 z-index는 iframe 내부 z-index와 완전히 분리되어 항상 최상위에 표시됨 */}
      <button
        onClick={handleClose}
        className="absolute top-3 left-3 z-10 flex items-center gap-1.5
                   bg-black/50 hover:bg-black/80 text-white text-xs font-medium
                   px-3 py-2 rounded-full backdrop-blur-sm
                   active:scale-95 transition-all cursor-pointer"
        aria-label="메인 화면으로 이동"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        메인
      </button>
    </div>
  );
}
