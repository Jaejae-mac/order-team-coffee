/**
 * 세션 상세에서 동일한 음료를 묶어 보여주는 그룹 카드
 * - 같은 메뉴+온도+사이즈+메모 조합을 한 줄로 표시
 * - 자신의 주문에는 수정/취소 버튼 표시
 */
"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import DrinkCard from "@/components/drink/DrinkCard";
import { PARTS } from "@/lib/constants/parts";
import type { GroupedOrder, PartId } from "@/types";

interface OrderGroupCardProps {
  group: GroupedOrder;
  storeColor: string;
  currentUserName: string;
  sessionStatus: "open" | "closed";
  onEdit: (orderId: string) => void;
  onCancel: (orderId: string) => Promise<void>;
  onQuickAdd?: (menu: string, temp: "HOT" | "ICE", size: string) => void;
}

export default function OrderGroupCard({
  group,
  storeColor,
  currentUserName,
  sessionStatus,
  onEdit,
  onCancel,
  onQuickAdd,
}: OrderGroupCardProps) {
  const isOpen = sessionStatus === "open";
  // 현재 사용자의 주문이 이 그룹에 포함되어 있는지 확인 (수정/취소 버튼 표시 여부 결정)
  const myOrderInGroup = group.orderers.find((o) => o.name === currentUserName);
  // 취소 요청 진행 중 여부 — 서버 응답 전까지 버튼 비활성화
  const [isCanceling, setIsCanceling] = useState(false);

  async function handleCancel(orderId: string) {
    setIsCanceling(true);
    try {
      await onCancel(orderId);
    } finally {
      setIsCanceling(false);
    }
  }

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      {/* 음료 카드 */}
      <DrinkCard name={group.menu} size={48} storeColor={storeColor} />

      {/* 음료 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-gray-800 text-sm truncate">
            {group.menu}
          </span>
          {/* 수량 뱃지 */}
          {group.count > 1 && (
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white"
              style={{ background: storeColor }}
            >
              x{group.count}
            </span>
          )}
          {/* 빠른 주문 추가 버튼 — 세션이 열려 있을 때만 표시 */}
          {isOpen && onQuickAdd && (
            <button
              onClick={() => onQuickAdd(group.menu, group.temp, group.size)}
              className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0 transition-opacity hover:opacity-80 active:opacity-60"
              style={{ background: storeColor }}
              title={`${group.menu} 동일 메뉴 추가`}
            >
              <Plus className="w-3 h-3" strokeWidth={3} />
            </button>
          )}
        </div>

        {/* 온도/사이즈 */}
        <p className="text-xs text-gray-500 mt-0.5">
          {group.temp} · {group.size}
          {group.memo && ` · ${group.memo}`}
        </p>

        {/* 주문자 목록 — 이름 뱃지만 표시 (수정/취소는 셀 우측으로 이동) */}
        <div className="flex flex-wrap gap-1 mt-1.5">
          {group.orderers.map((orderer) => {
            const part = PARTS.find((p) => p.id === orderer.part);
            const isMe = orderer.name === currentUserName;

            return (
              <span
                key={orderer.orderId}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: part?.bg ?? "#f3f4f6",
                  color: part?.color ?? "#374151",
                  fontWeight: isMe ? 700 : 400,
                  // 내 주문은 테두리로 강조
                  border: isMe ? `1px solid ${part?.color ?? "#9ca3af"}` : "none",
                }}
              >
                {orderer.name}
              </span>
            );
          })}
        </div>
      </div>

      {/* 세션이 열려 있고 내 주문이 이 그룹에 있을 때 셀 우측에 버튼 표시 */}
      {isOpen && myOrderInGroup && (
        <div className="flex flex-col gap-1 shrink-0">
          <button
            onClick={() => onEdit(myOrderInGroup.orderId)}
            disabled={isCanceling}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            수정
          </button>
          <button
            onClick={() => handleCancel(myOrderInGroup.orderId)}
            disabled={isCanceling}
            className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-400 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
          >
            {/* 취소 요청 중이면 스피너, 아니면 텍스트 */}
            {isCanceling ? <Loader2 className="w-3 h-3 animate-spin" /> : "취소"}
          </button>
        </div>
      )}
    </div>
  );
}
