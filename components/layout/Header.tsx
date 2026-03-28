/**
 * 앱 상단 헤더 컴포넌트
 * - 앱 이름 + 현재 로그인한 사용자 정보 + 로그아웃 버튼
 */
"use client";

import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PARTS } from "@/lib/constants/parts";
import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const { name, part, logout, isLoggingOut } = useAuth();
  const currentPart = PARTS.find((p) => p.id === part);

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* 앱 이름 */}
        <div className="flex items-center gap-2">
          <span className="text-xl">☕</span>
          <span className="font-bold text-gray-900">팀 커피 주문</span>
        </div>

        {/* 사용자 정보 + 로그아웃 */}
        <div className="flex items-center gap-2">
          {name && (
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-gray-700">{name}</span>
              {currentPart && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: currentPart.bg, color: currentPart.color }}
                >
                  {currentPart.name}
                </span>
              )}
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            disabled={isLoggingOut}
            className="text-gray-400 hover:text-gray-600 p-1.5"
            aria-label="로그아웃"
          >
            {/* 로그아웃 요청 중이면 스피너, 아니면 로그아웃 아이콘 */}
            {isLoggingOut
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <LogOut className="w-4 h-4" />
            }
          </Button>
        </div>
      </div>
    </header>
  );
}
