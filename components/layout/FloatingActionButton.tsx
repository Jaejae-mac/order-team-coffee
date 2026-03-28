/**
 * 화면 우하단 플로팅 버튼 — 새 세션 생성을 시작하는 진입점
 */
"use client";

import { Plus } from "lucide-react";

interface FloatingActionButtonProps {
  onClick: () => void;
}

export default function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center
                 bg-gray-900 text-white hover:bg-gray-700 active:scale-95 transition-all z-10"
      aria-label="새 주문 수집 시작"
    >
      <Plus className="w-6 h-6" />
    </button>
  );
}
