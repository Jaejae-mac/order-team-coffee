/**
 * 인증 상태 저장소 (Zustand)
 * - 사용자 이름과 파트를 메모리 + sessionStorage에 보관
 * - 탭을 닫으면 초기화되어 재로그인 필요 (보안을 위한 의도적 설계)
 */
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { PartId } from "@/types";

interface AuthState {
  name: string;
  part: PartId | "";
  isLoggedIn: boolean;
  setUser: (name: string, part: PartId) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      name: "",
      part: "",
      isLoggedIn: false,

      // 이름과 파트를 저장해 로그인 상태로 전환
      setUser: (name, part) => set({ name, part, isLoggedIn: true }),

      // 로컬 상태만 초기화 (쿠키 삭제는 별도 API 호출 필요)
      logout: () => set({ name: "", part: "", isLoggedIn: false }),
    }),
    {
      name: "auth-storage",
      // sessionStorage: 탭을 닫으면 사라지는 임시 저장소
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? sessionStorage : localStorage
      ),
    }
  )
);
