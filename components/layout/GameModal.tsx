/**
 * 마블 레이스 게임을 전체화면 모달로 표시하는 컴포넌트
 * - 게임 버튼 클릭 시 열리며, iframe으로 /marble-race.html을 로드
 * - 게임 화면 위에 오버레이된 "← 메인" 버튼으로 대시보드로 복귀
 */
"use client";

import { ChevronLeft } from "lucide-react";

interface GameModalProps {
  open: boolean;
  onClose: () => void;
}

export default function GameModal({ open, onClose }: GameModalProps) {
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
        onClick={onClose}
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
