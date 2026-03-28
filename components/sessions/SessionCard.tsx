/**
 * 세션 목록에서 각 세션을 카드 형태로 보여주는 컴포넌트
 * - 매장 색상으로 카드 테마가 결정됨
 * - 클릭하면 상세 모달이 열림
 */
"use client";

import { Badge } from "@/components/ui/badge";
import DrinkCard from "@/components/drink/DrinkCard";
import { timeAgo } from "@/lib/utils/timeAgo";
import { PARTS } from "@/lib/constants/parts";
import type { Session } from "@/types";

interface SessionCardProps {
  session: Session;
  onClick: () => void;
}

export default function SessionCard({ session, onClick }: SessionCardProps) {
  const isOpen = session.status === "open";
  const creatorPart = PARTS.find((p) => p.id === session.creator_part);

  // 카드에 미리보기로 보여줄 최대 5개 음료
  const previewOrders = session.orders.slice(0, 5);

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl p-4 transition-all hover:scale-[1.01] hover:shadow-lg active:scale-[0.99]"
      style={{ background: session.store_bg, border: `1.5px solid ${session.store_color}20` }}
    >
      {/* 상단: 매장 정보 + 상태 뱃지 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{session.store_emoji}</span>
          <div>
            <p className="font-semibold text-gray-800 text-sm">{session.store_name}</p>
            <p className="text-xs text-gray-500">{timeAgo(session.created_at)}</p>
          </div>
        </div>
        <Badge
          variant={isOpen ? "default" : "secondary"}
          style={
            isOpen
              ? { background: session.store_color, color: "white" }
              : undefined
          }
        >
          {isOpen ? "접수중" : "마감"}
        </Badge>
      </div>

      {/* 주문 음료 미리보기 */}
      {previewOrders.length > 0 ? (
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {previewOrders.map((order) => (
            <DrinkCard
              key={order.id}
              name={order.menu}
              size={40}
              storeColor={session.store_color}
            />
          ))}
          {/* 5개 초과 시 개수 표시 */}
          {session.orders.length > 5 && (
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ background: `${session.store_color}20`, color: session.store_color }}
            >
              +{session.orders.length - 5}
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-400 mb-3">아직 주문이 없습니다</p>
      )}

      {/* 하단: 주문 수 + 파트 뱃지 */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          총 <span className="font-semibold" style={{ color: session.store_color }}>
            {session.orders.length}
          </span>개 주문
        </span>
        {creatorPart && (
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: creatorPart.bg, color: creatorPart.color }}
          >
            {creatorPart.name}
          </span>
        )}
      </div>
    </button>
  );
}
