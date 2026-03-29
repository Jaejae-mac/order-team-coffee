/**
 * 로그인 2단계 — 이름과 소속 파트를 선택하는 화면
 * 입력한 정보는 Zustand authStore에 저장되어 앱 전체에서 사용됨
 */
"use client";

import { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PARTS } from "@/lib/constants/parts";
import { useAuthStore } from "@/lib/stores/authStore";
import type { PartId } from "@/types";

const schema = z.object({
  name: z.string().min(1, "이름을 입력해주세요.").max(20, "20자 이하로 입력해주세요."),
  part: z.enum(["channel", "business", "pay"] as const, {
    error: "파트를 선택해주세요.",
  }),
});

type FormData = z.infer<typeof schema>;

interface ProfileStepProps {
  onSuccess: () => void;
}

export default function ProfileStep({ onSuccess }: ProfileStepProps) {
  const setUser = useAuthStore((state) => state.setUser);
  // isPending: router.push 페이지 이동이 완료될 때까지 true로 유지됨
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const selectedPart = watch("part");

  function onSubmit(data: FormData) {
    setUser(data.name, data.part as PartId);
    // startTransition으로 감싸면 이동이 완료될 때까지 isPending이 true가 됨
    startTransition(() => onSuccess());
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* 사용자 아이콘 */}
      <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center">
        <User className="w-8 h-8 text-stone-500" />
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">내 정보 입력</h1>
        <p className="mt-1 text-sm text-gray-500">이름과 파트를 선택해주세요</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-4">
        {/* 이름 입력 */}
        <div>
          <Input
            {...register("name")}
            placeholder="이름"
            className="bg-white/70 border-stone-200 text-gray-900 placeholder:text-gray-400 h-12"
          />
          {errors.name && (
            <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* 파트 선택 버튼 그룹 */}
        <div>
          <p className="text-gray-500 text-sm mb-2">소속 파트</p>
          <Controller
            name="part"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-3 gap-2">
                {PARTS.map((part) => (
                  <button
                    key={part.id}
                    type="button"
                    onClick={() => field.onChange(part.id)}
                    className="py-3 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      // 선택된 파트는 파트 색상으로, 미선택은 반투명 흰색
                      background:
                        selectedPart === part.id
                          ? part.color
                          : "rgba(0,0,0,0.05)",
                      color: selectedPart === part.id ? "white" : "#374151",
                      border:
                        selectedPart === part.id
                          ? `2px solid ${part.color}`
                          : "2px solid transparent",
                    }}
                  >
                    {part.name}
                  </button>
                ))}
              </div>
            )}
          />
          {errors.part && (
            <p className="text-red-400 text-sm mt-1">{errors.part.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="h-12 bg-stone-900 text-white hover:bg-stone-700 font-semibold mt-2"
        >
          {isPending ? (
            // 페이지 이동 중 스피너 표시
            <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
          ) : (
            "시작하기"
          )}
        </Button>
      </form>
    </div>
  );
}
