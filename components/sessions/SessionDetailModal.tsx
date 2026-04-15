/**
 * 세션 상세 모달 — 현재 세션의 주문 목록을 보여주고 주문 추가/수정/취소를 지원
 * - 세션 생성자는 세션을 마감하거나 재오픈할 수 있음
 * - Realtime 업데이트는 상위(page.tsx)에서 sessionStore를 통해 전달됨
 * - 새로고침 버튼으로 언제든지 최신 주문 현황을 수동으로 갱신 가능
 */
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw } from "lucide-react";
import OrderGroupCard from "@/components/orders/OrderGroupCard";
import OrderModal from "@/components/orders/OrderModal";
import { groupOrders } from "@/lib/utils/groupOrders";
import { timeAgo } from "@/lib/utils/timeAgo";
import { closeSession, reopenSession, getSessionById } from "@/lib/actions/sessionActions";
import { cancelOrder } from "@/lib/actions/orderActions";
import { useSessionStore } from "@/lib/stores/sessionStore";
import type { Session, Order, PartId } from "@/types";

interface SessionDetailModalProps {
  session: Session;
  open: boolean;
  onClose: () => void;
  currentUserName: string;
  currentUserPart: PartId;
}

export default function SessionDetailModal({
  session,
  open,
  onClose,
  currentUserName,
  currentUserPart,
}: SessionDetailModalProps) {
  const { updateSessionStatus, addOrderToSession, updateOrderInSession, removeOrderFromSession, replaceSession } =
    useSessionStore();

  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | undefined>(undefined);
  const [actionLoading, setActionLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isOpen = session.status === "open";
  const isCreator = session.creator === currentUserName;
  const groupedOrders = groupOrders(session.orders);

  // 내 주문이 있는지 확인
  const myOrder = session.orders.find((o) => o.name === currentUserName);

  async function handleCloseSession() {
    setActionLoading(true);
    try {
      const result = await closeSession(session.id);
      if (!result.error) updateSessionStatus(session.id, "closed");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReopenSession() {
    setActionLoading(true);
    try {
      const result = await reopenSession(session.id);
      if (!result.error) updateSessionStatus(session.id, "open");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      const result = await getSessionById(session.id);
      if (result.data) replaceSession(result.data);
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleCancelOrder(orderId: string) {
    const result = await cancelOrder(orderId);
    if (!result.error) removeOrderFromSession(session.id, orderId);
  }

  function handleEditOrder(orderId: string) {
    const order = session.orders.find((o) => o.id === orderId);
    setEditingOrder(order);
    setOrderModalOpen(true);
  }

  function handleAddOrder() {
    setEditingOrder(undefined);
    setOrderModalOpen(true);
  }

  function handleOrderAdded(order: Order) {
    addOrderToSession(session.id, order);
  }

  function handleOrderEdited(order: Order) {
    updateOrderInSession(session.id, order.id, order);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            {/* 매장 정보 헤더 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{session.store_emoji}</span>
                <div>
                  <DialogTitle className="text-base">{session.store_name}</DialogTitle>
                  <p className="text-xs text-gray-400">{timeAgo(session.created_at)} · {session.creator}</p>
                </div>
              </div>
              {/* 상태 뱃지 + 새로고침 버튼 묶음 — mr-8: 닫기 버튼과의 겹침 방지 */}
              <div className="flex items-center gap-1 mr-8">
                <Badge
                  variant={isOpen ? "default" : "secondary"}
                  style={isOpen ? { background: session.store_color } : undefined}
                >
                  {isOpen ? "접수중" : "마감"}
                </Badge>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                  title="주문 목록 새로고침"
                >
                  {isRefreshing
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <RefreshCw className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>
          </DialogHeader>

          {/* 주문 목록 */}
          <div className="mt-2">
            {groupedOrders.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">아직 주문이 없습니다</p>
            ) : (
              <div>
                {/* 총 주문 수 */}
                <p className="text-xs text-gray-500 mb-2">
                  총{" "}
                  <span className="font-semibold" style={{ color: session.store_color }}>
                    {session.orders.length}
                  </span>
                  개 주문
                </p>
                {groupedOrders.map((group) => (
                  <OrderGroupCard
                    key={group.key}
                    group={group}
                    storeColor={session.store_color}
                    currentUserName={currentUserName}
                    sessionStatus={session.status}
                    onEdit={handleEditOrder}
                    onCancel={handleCancelOrder}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 하단 액션 버튼 */}
          <div className="flex flex-col gap-2 mt-2">
            {/* 주문 추가 (세션이 열려 있을 때만) */}
            {isOpen && (
              <Button
                onClick={handleAddOrder}
                className="w-full"
                style={{ background: session.store_color }}
              >
                {myOrder ? "내 주문 수정하기" : "내 주문 추가"}
              </Button>
            )}

            {/* 세션 마감/재오픈 (생성자만 가능) */}
            {isCreator && (
              <Button
                variant="outline"
                onClick={isOpen ? handleCloseSession : handleReopenSession}
                disabled={actionLoading}
                className="w-full"
              >
                {actionLoading ? "처리 중..." : isOpen ? "주문 마감하기" : "주문 재오픈"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 주문 추가/수정 모달 (중첩 모달) */}
      <OrderModal
        open={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        session={session}
        userName={currentUserName}
        userPart={currentUserPart}
        initialOrder={editingOrder}
        onOrderAdded={handleOrderAdded}
        onOrderEdited={handleOrderEdited}
      />
    </>
  );
}
