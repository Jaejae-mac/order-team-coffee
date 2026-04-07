/**
 * 화면 우하단 플로팅 버튼
 * - "+" 버튼 클릭 시 "투표"와 "커피주문" 선택지가 스택 형태로 귀엽게 올라옴
 * - 버튼 외부(오버레이) 클릭 시 메뉴 닫힘
 * - "+" 아이콘은 메뉴가 열리면 45도 회전
 */
"use client";

import { useState } from "react";
import { Plus, Coffee } from "lucide-react";

interface FloatingActionButtonProps {
  onCoffeeClick: () => void;
  onPollClick: () => void;
}

export default function FloatingActionButton({ onCoffeeClick, onPollClick }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  function handleCoffeeClick() {
    setIsOpen(false);
    onCoffeeClick();
  }

  function handlePollClick() {
    setIsOpen(false);
    onPollClick();
  }

  return (
    <>
      {/* 메뉴가 열렸을 때 배경 오버레이 — 클릭 시 메뉴 닫힘 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* FAB 컨테이너 */}
      <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3 z-30">

        {/* 스택 메뉴 — isOpen일 때 아래에서 위로 순서대로 나타남 */}
        {isOpen && (
          <div className="flex flex-col items-end gap-2">

            {/* 투표 버튼 (위) */}
            <div
              className="flex items-center gap-2 animate-in slide-in-from-bottom-2 fade-in duration-200"
              style={{ animationDelay: "50ms", animationFillMode: "both" }}
            >
              <span className="bg-white text-gray-700 text-sm font-medium px-3 py-1.5 rounded-full shadow-md border border-gray-100">
                투표
              </span>
              <button
                onClick={handlePollClick}
                className="w-12 h-12 rounded-full shadow-md flex items-center justify-center bg-violet-600 text-white hover:bg-violet-700 active:scale-95 transition-all cursor-pointer"
                aria-label="투표 만들기"
              >
                {/* 막대 차트 아이콘 (투표) */}
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </button>
            </div>

            {/* 커피주문 버튼 (아래) */}
            <div
              className="flex items-center gap-2 animate-in slide-in-from-bottom-2 fade-in duration-200"
              style={{ animationDelay: "0ms", animationFillMode: "both" }}
            >
              <span className="bg-white text-gray-700 text-sm font-medium px-3 py-1.5 rounded-full shadow-md border border-gray-100">
                커피주문
              </span>
              <button
                onClick={handleCoffeeClick}
                className="w-12 h-12 rounded-full shadow-md flex items-center justify-center bg-gray-800 text-white hover:bg-gray-700 active:scale-95 transition-all cursor-pointer"
                aria-label="커피 주문 수집 시작"
              >
                <Coffee className="w-5 h-5" />
              </button>
            </div>

          </div>
        )}

        {/* 메인 "+" FAB 버튼 */}
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center bg-gray-900 text-white hover:bg-gray-700 active:scale-95 transition-all cursor-pointer"
          aria-label={isOpen ? "메뉴 닫기" : "새 항목 추가"}
          aria-expanded={isOpen}
        >
          <Plus
            className="w-6 h-6 transition-transform duration-200"
            style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
          />
        </button>
      </div>
    </>
  );
}
