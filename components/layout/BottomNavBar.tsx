/**
 * 앱 하단 고정 내비게이션 바
 * - 커피주문 / 투표 탭을 하단에 고정
 * - iOS safe-area(홈 인디케이터 영역)를 padding-bottom으로 처리
 */
"use client";

import { Coffee } from "lucide-react";

export type MainTab = "coffee" | "poll";

interface BottomNavBarProps {
  active: MainTab;
  onChange: (tab: MainTab) => void;
}

export default function BottomNavBar({ active, onChange }: BottomNavBarProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-14 max-w-2xl mx-auto">
        {/* 커피주문 탭 */}
        <button
          onClick={() => onChange("coffee")}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative ${
            active === "coffee" ? "text-amber-700" : "text-gray-400"
          }`}
        >
          {/* 활성 인디케이터 — 상단 선 */}
          {active === "coffee" && (
            <span className="absolute top-0 left-4 right-4 h-0.5 rounded-full bg-amber-700" />
          )}
          <Coffee className="w-5 h-5" />
          <span className="text-xs font-medium">커피주문</span>
        </button>

        {/* 투표 탭 */}
        <button
          onClick={() => onChange("poll")}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative ${
            active === "poll" ? "text-violet-600" : "text-gray-400"
          }`}
        >
          {active === "poll" && (
            <span className="absolute top-0 left-4 right-4 h-0.5 rounded-full bg-violet-600" />
          )}
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <span className="text-xs font-medium">투표</span>
        </button>
      </div>
    </nav>
  );
}
