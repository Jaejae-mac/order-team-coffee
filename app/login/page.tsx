/**
 * 로그인 페이지 — 접근 코드 입력(1단계) → 이름/파트 선택(2단계) 순서로 진행
 * 다크 그라디언트 배경 위에 글래스모피즘 카드로 구성
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AccessCodeStep from "@/components/login/AccessCodeStep";
import ProfileStep from "@/components/login/ProfileStep";
import { useAuthStore } from "@/lib/stores/authStore";

export default function LoginPage() {
  const router = useRouter();
  // step 1: 접근 코드 입력, step 2: 이름+파트 선택
  const [step, setStep] = useState<1 | 2>(1);

  function handleCodeSuccess() {
    setStep(2);
  }

  function handleProfileSuccess() {
    // ProfileStep에서 setUser 완료 후 part가 저장되므로 getState()로 즉시 읽어 URL에 포함
    const { part } = useAuthStore.getState();
    router.push(`/?part=${part}`);
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(150deg, #fefdfb 0%, #f5ede0 60%, #ede3d2 100%)",
      }}
    >
      {/* 글래스모피즘 카드 */}
      <div
        className="w-full max-w-sm p-10 rounded-3xl"
        style={{
          background: "rgba(255,255,255,0.65)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.85)",
          boxShadow: "0 20px 60px rgba(180,150,110,0.13), 0 4px 16px rgba(180,150,110,0.08)",
        }}
      >
        {/* 단계에 따라 컴포넌트 전환 */}
        {step === 1 ? (
          <AccessCodeStep onSuccess={handleCodeSuccess} />
        ) : (
          <ProfileStep onSuccess={handleProfileSuccess} />
        )}
      </div>
    </main>
  );
}
