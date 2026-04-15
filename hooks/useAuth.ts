/**
 * 인증 상태를 편리하게 사용하기 위한 커스텀 훅
 * authStore를 직접 import하는 대신 이 훅을 사용하면 나중에 인증 방식을 바꿔도 컴포넌트 수정이 불필요
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import type { PartId } from "@/types";

export function useAuth() {
  const router = useRouter();
  const { name, part, isLoggedIn, setUser, logout } = useAuthStore();
  // fetch + 페이지 이동이 완료될 때까지 로딩 표시
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      // 서버에서 httpOnly 쿠키 삭제
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // 쿠키 삭제 실패해도 클라이언트 상태는 초기화
    } finally {
      logout();
      router.push("/login");
      // 페이지 이동 후에는 컴포넌트가 언마운트되므로 state 복원 불필요
    }
  }

  return {
    name,
    part: part as PartId | "",
    isLoggedIn,
    isLoggingOut,
    setUser,
    logout: handleLogout,
  };
}
