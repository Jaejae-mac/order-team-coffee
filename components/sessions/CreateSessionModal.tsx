/**
 * 새 세션(주문 수집) 생성 모달
 * - 매장을 선택하거나 "기타"를 선택하면 직접 매장명을 입력할 수 있음
 * - 세션 생성 후 상위 컴포넌트에 새 세션 데이터를 전달
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
import { Input } from "@/components/ui/input";
import { STORES } from "@/lib/constants/stores";
import { createSession } from "@/lib/actions/sessionActions";
import type { Session, StoreId } from "@/types";

interface CreateSessionModalProps {
  open: boolean;
  onClose: () => void;
  userName: string;
  userPart: string;
  onCreated: (session: Session) => void;
}

export default function CreateSessionModal({
  open,
  onClose,
  userName,
  userPart,
  onCreated,
}: CreateSessionModalProps) {
  const [selectedStoreId, setSelectedStoreId] = useState<StoreId | "">("");
  const [customStoreName, setCustomStoreName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedStore = STORES.find((s) => s.id === selectedStoreId);
  const isCustom = selectedStoreId === "custom";
  const canCreate =
    selectedStoreId !== "" && (!isCustom || customStoreName.trim().length > 0);

  async function handleCreate() {
    if (!selectedStore || !canCreate) return;
    setIsLoading(true);
    setError("");

    try {
      const result = await createSession({
        storeId: selectedStore.id,
        storeName: isCustom ? customStoreName.trim() : selectedStore.name,
        storeEmoji: selectedStore.emoji,
        storeColor: selectedStore.color,
        storeBg: selectedStore.bg,
        creator: userName,
        creatorPart: userPart as "channel" | "business" | "pay",
      });

      if (result.error || !result.data) {
        setError(result.error ?? "세션 생성에 실패했습니다.");
        return;
      }

      onCreated(result.data);
      handleClose();
    } catch {
      setError("예상치 못한 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleClose() {
    setSelectedStoreId("");
    setCustomStoreName("");
    setError("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>☕ 주문 수집 시작</DialogTitle>
        </DialogHeader>

        {/* 매장 선택 그리드 */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          {STORES.map((store) => (
            <button
              key={store.id}
              onClick={() => setSelectedStoreId(store.id)}
              className="flex flex-col items-center gap-1 py-4 rounded-xl border-2 transition-all"
              style={{
                background:
                  selectedStoreId === store.id ? store.bg : "transparent",
                borderColor:
                  selectedStoreId === store.id ? store.color : "#e5e7eb",
              }}
            >
              <span className="text-3xl">{store.emoji}</span>
              <span
                className="text-sm font-semibold"
                style={{
                  color:
                    selectedStoreId === store.id ? store.color : "#374151",
                }}
              >
                {store.name}
              </span>
            </button>
          ))}
        </div>

        {/* 기타 매장 직접 입력 */}
        {isCustom && (
          <Input
            placeholder="매장 이름을 입력하세요"
            value={customStoreName}
            onChange={(e) => setCustomStoreName(e.target.value)}
            className="mt-2"
          />
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <Button
          onClick={handleCreate}
          disabled={!canCreate || isLoading}
          className="w-full mt-2"
          style={
            selectedStore
              ? { background: selectedStore.color }
              : undefined
          }
        >
          {isLoading ? "생성 중..." : "주문 수집 시작"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
