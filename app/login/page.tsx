/**
 * 로그인 페이지 — 접근 코드 입력(1단계) → 이름/파트 선택(2단계) 순서로 진행
 * 다크 그라디언트 배경 위에 글래스모피즘 카드로 구성
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AccessCodeStep from "@/components/login/AccessCodeStep";
import ProfileStep from "@/components/login/ProfileStep";

export default function LoginPage() {
  const router = useRouter();
  // step 1: 접근 코드 입력, step 2: 이름+파트 선택
  const [step, setStep] = useState<1 | 2>(1);

  function handleCodeSuccess() {
    setStep(2);
  }

  function handleProfileSuccess() {
    router.push("/");
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      }}
    >
      {/* 글래스모피즘 카드 */}
      <div
        className="w-full max-w-sm p-10 rounded-3xl"
        style={{
          background: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
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
