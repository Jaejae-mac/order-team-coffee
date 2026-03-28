/**
 * 화면 우하단 플로팅 게임 버튼 — + 버튼 바로 위에 위치
 * bottom-24(96px) = bottom-6(24px) + h-14(56px) + gap(16px)
 */
"use client";

import { Gamepad2 } from "lucide-react";

interface GameButtonProps {
  onClick: () => void;
}

export default function GameButton({ onClick }: GameButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center
                 bg-gray-900 text-white hover:bg-gray-700 active:scale-95 transition-all z-10"
      aria-label="게임"
    >
      <Gamepad2 className="w-6 h-6" />
    </button>
  );
}
