/**
 * 세션 목록에서 각 세션을 카드 형태로 보여주는 컴포넌트
 * - 매장 색상으로 카드 테마가 결정됨
 * - 클릭하면 상세 모달이 열림
 * - 생성자 본인일 경우 좌측 스와이프로 삭제 버튼 노출
 */
"use client";

import { useRef, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import DrinkCard from "@/components/drink/DrinkCard";
import { timeAgo } from "@/lib/utils/timeAgo";
import { PARTS } from "@/lib/constants/parts";
import type { Session } from "@/types";

interface SessionCardProps {
  session: Session;
  currentUserName: string;
  onClick: () => void;
  onDelete: (sessionId: string) => Promise<void>;
}

// 삭제 버튼이 완전히 노출되는 너비
const DELETE_BTN_WIDTH = 80;
// 이 거리 이상 스와이프하면 삭제 버튼에 스냅
const SNAP_THRESHOLD = 40;

export default function SessionCard({
  session,
  currentUserName,
  onClick,
  onDelete,
}: SessionCardProps) {
  const isOpen = session.status === "open";
  const creatorPart = PARTS.find((p) => p.id === session.creator_part);
  // 현재 로그인한 사용자가 이 세션의 생성자인지 확인
  const isMySession = session.creator === currentUserName;

  // 카드에 미리보기로 보여줄 최대 5개 음료
  const previewOrders = session.orders.slice(0, 5);

  // ── 스와이프 상태 ──────────────────────────────────────────────
  const touchStartX = useRef(0);
  // 터치 이동 거리가 충분하면 true → 카드 onClick을 차단하기 위해 사용
  const didSwipe = useRef(false);
  // 카드가 좌측으로 이동한 오프셋 (음수, 최대 -DELETE_BTN_WIDTH)
  const [swipeOffset, setSwipeOffset] = useState(0);
  // 스냅 애니메이션 활성화 여부 (손을 떼는 순간만 transition 적용)
  const [isSnapping, setIsSnapping] = useState(false);

  // 삭제 요청 중 로딩
  const [isDeleting, setIsDeleting] = useState(false);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    didSwipe.current = false;
    setIsSnapping(false);
  }

  function handleTouchMove(e: React.TouchEvent) {
    const deltaX = e.touches[0].clientX - touchStartX.current;

    // 10px 이상 이동했으면 스와이프로 간주 (onClick 차단용)
    if (Math.abs(deltaX) > 10) didSwipe.current = true;

    if (deltaX < 0) {
      // 좌측 스와이프: DELETE_BTN_WIDTH까지만 이동
      setSwipeOffset(Math.max(deltaX, -DELETE_BTN_WIDTH));
    } else if (swipeOffset < 0) {
      // 우측으로 돌아오는 경우: 스와이프된 상태에서만 처리
      setSwipeOffset(Math.min(0, swipeOffset + deltaX));
    }
  }

  function handleTouchEnd() {
    // 손을 뗄 때 스냅 애니메이션 켜기
    setIsSnapping(true);
    if (swipeOffset < -SNAP_THRESHOLD) {
      // 임계값 초과 → 삭제 버튼 완전히 노출
      setSwipeOffset(-DELETE_BTN_WIDTH);
    } else {
      // 미달 → 원위치
      setSwipeOffset(0);
    }
  }

  function handleCardClick() {
    // 스와이프 중이었으면 클릭 무시
    if (didSwipe.current) return;

    if (swipeOffset !== 0) {
      // 삭제 버튼이 열려있는 상태에서 카드 클릭 → 닫기
      setIsSnapping(true);
      setSwipeOffset(0);
      return;
    }

    onClick();
  }

  async function handleDelete(e: React.MouseEvent) {
    // 삭제 버튼 클릭이 카드 onClick으로 전파되지 않도록 차단
    e.stopPropagation();
    setIsDeleting(true);
    try {
      await onDelete(session.id);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    // overflow-hidden으로 삭제 버튼이 카드 영역 밖으로 보이지 않게 처리
    <div className="relative overflow-hidden rounded-2xl">

      {/* 삭제 버튼 — 우측에 절대 위치, 스와이프 시 노출 (본인 세션만 렌더링) */}
      {isMySession && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="absolute right-0 top-0 bottom-0 flex flex-col items-center justify-center gap-1 bg-red-500 text-white disabled:opacity-60"
          style={{ width: DELETE_BTN_WIDTH }}
        >
          {isDeleting
            ? <Loader2 className="w-5 h-5 animate-spin" />
            : <Trash2 className="w-5 h-5" />
          }
          <span className="text-xs font-medium">{isDeleting ? "" : "삭제"}</span>
        </button>
      )}

      {/* 카드 본체 — 스와이프 오프셋만큼 좌측으로 이동 */}
      <button
        onClick={handleCardClick}
        onTouchStart={isMySession ? handleTouchStart : undefined}
        onTouchMove={isMySession ? handleTouchMove : undefined}
        onTouchEnd={isMySession ? handleTouchEnd : undefined}
        className="relative w-full text-left rounded-2xl p-4 transition-shadow hover:shadow-lg active:opacity-90"
        style={{
          background: session.store_bg,
          border: `1.5px solid ${session.store_color}20`,
          transform: `translateX(${swipeOffset}px)`,
          // 손을 뗄 때만 부드러운 스냅 애니메이션 적용
          transition: isSnapping ? "transform 0.2s ease-out" : "box-shadow 0.15s",
          // 수직 스크롤은 허용하고 수평은 JS로 처리
          touchAction: isMySession ? "pan-y" : "auto",
        }}
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

        {/* 하단: 주문 수 + 생성자 이름 + 파트 뱃지 */}
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
              {session.creator} · {creatorPart.name}
            </span>
          )}
        </div>
      </button>
    </div>
  );
}
