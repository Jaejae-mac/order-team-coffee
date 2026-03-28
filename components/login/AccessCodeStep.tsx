/**
 * 로그인 1단계 — 팀 접근 코드를 입력하는 화면
 * 올바른 코드를 입력하면 서버에서 쿠키를 발급하고 2단계로 넘어감
 */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z.object({
  code: z.string().min(1, "접근 코드를 입력해주세요."),
});

type FormData = z.infer<typeof schema>;

interface AccessCodeStepProps {
  onSuccess: () => void;
}

export default function AccessCodeStep({ onSuccess }: AccessCodeStepProps) {
  const [showCode, setShowCode] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try {
      setServerError("");
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: data.code }),
      });

      if (!res.ok) {
        const json = await res.json() as { error?: string };
        setServerError(json.error ?? "오류가 발생했습니다.");
        return;
      }

      onSuccess();
    } catch {
      setServerError("서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* 자물쇠 아이콘 */}
      <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
        <Lock className="w-8 h-8 text-white" />
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">팀 커피 주문</h1>
        <p className="mt-1 text-sm text-white/60">접근 코드를 입력하세요</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-3">
        <div className="relative">
          <Input
            {...register("code")}
            type={showCode ? "text" : "password"}
            placeholder="접근 코드"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 pr-10 h-12"
            autoComplete="off"
          />
          {/* 코드 표시/숨기기 토글 버튼 */}
          <button
            type="button"
            onClick={() => setShowCode((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
          >
            {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* 유효성 검사 오류 */}
        {errors.code && (
          <p className="text-red-400 text-sm">{errors.code.message}</p>
        )}
        {serverError && (
          <p className="text-red-400 text-sm">{serverError}</p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 bg-white text-gray-900 hover:bg-white/90 font-semibold"
        >
          {isSubmitting ? "확인 중..." : "입장"}
        </Button>
      </form>
    </div>
  );
}
