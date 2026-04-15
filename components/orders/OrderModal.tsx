/**
 * 주문 추가/수정 모달
 * - 음료 선택(MenuPicker) → 온도 선택 → 사이즈 선택 → 메모 입력
 * - initialOrder가 있으면 수정 모드, 없으면 추가 모드로 동작
 */
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MenuPicker from "@/components/orders/MenuPicker";
import { getSizeOptions, TEMP_OPTIONS } from "@/lib/constants/stores";
import { addOrder, editOrder } from "@/lib/actions/orderActions";
import type { Session, Order } from "@/types";

interface OrderModalProps {
  open: boolean;
  onClose: () => void;
  session: Session;
  userName: string;
  userPart: string;
  initialOrder?: Order;                   // 수정 모드일 때 기존 주문 데이터
  prefillMenu?: string;                   // 빠른 추가 시 미리 선택할 메뉴 이름
  onOrderAdded: (order: Order) => void;
  onOrderEdited: (order: Order) => void;
}

export default function OrderModal({
  open,
  onClose,
  session,
  userName,
  userPart,
  initialOrder,
  prefillMenu,
  onOrderAdded,
  onOrderEdited,
}: OrderModalProps) {
  const isEditMode = Boolean(initialOrder);
  const sizeOptions = getSizeOptions(session.store_id);

  // 폼 상태 초기화 (수정 모드면 기존 값으로)
  const [selectedMenu, setSelectedMenu] = useState(initialOrder?.menu ?? "");
  const [directInput, setDirectInput] = useState("");
  const [temp, setTemp] = useState<"HOT" | "ICE">(initialOrder?.temp ?? "ICE");
  const [size, setSize] = useState(initialOrder?.size ?? sizeOptions[0]);
  const [memo, setMemo] = useState(initialOrder?.memo ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // 수정 모드 전환 또는 빠른 추가(prefillMenu) 시 초기값 재설정
  useEffect(() => {
    if (initialOrder) {
      setSelectedMenu(initialOrder.menu);
      setTemp(initialOrder.temp);
      setSize(initialOrder.size);
      setMemo(initialOrder.memo);
    } else {
      setSelectedMenu(prefillMenu ?? "");
      setDirectInput("");
      setTemp("ICE");
      setSize(sizeOptions[0]);
      setMemo("");
    }
    setError("");
  }, [initialOrder, prefillMenu, open, sizeOptions]);

  // 실제 음료 이름 (선택 또는 직접 입력 중 하나)
  const finalMenu = directInput.trim() || selectedMenu;

  async function handleSubmit() {
    if (!finalMenu) {
      setError("음료를 선택하거나 직접 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      if (isEditMode && initialOrder) {
        // 수정 모드
        const result = await editOrder(initialOrder.id, {
          menu: finalMenu,
          size,
          temp,
          memo,
        });
        if (result.error || !result.data) {
          setError(result.error ?? "수정에 실패했습니다.");
          return;
        }
        onOrderEdited(result.data);
      } else {
        // 추가 모드
        const result = await addOrder(session.id, {
          name: userName,
          part: userPart as "channel" | "business" | "pay",
          menu: finalMenu,
          size,
          temp,
          memo,
        });
        if (result.error || !result.data) {
          setError(result.error ?? "주문 추가에 실패했습니다.");
          return;
        }
        onOrderAdded(result.data);
      }
      onClose();
    } catch {
      setError("예상치 못한 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      {/* max-w-sm 제거: dialog.tsx에 이미 모바일 안전 제약(max-w-[calc(100%-2rem)])이 있음 */}
      {/* overflow-x-hidden: overflow-y-auto 설정 시 CSS 스펙상 overflow-x도 auto로 암묵 변환되므로 명시적으로 hidden 설정 */}
      <DialogContent className="max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "✏️ 주문 수정" : "➕ 내 주문 추가"}
          </DialogTitle>
        </DialogHeader>

        {/* min-w-0: grid 아이템의 기본 min-width: auto를 0으로 재정의 → 자식 컨텐츠가 다이얼로그 너비를 넘지 않도록 방어 */}
        <div className="flex flex-col gap-4 min-w-0">
          {/* 1단계: 음료 선택 */}
          <section>
            <p className="text-sm font-medium text-gray-700 mb-2">음료 선택</p>
            <MenuPicker
              session={session}
              selectedMenuName={selectedMenu}
              onSelect={(name) => {
                setSelectedMenu(name);
                setDirectInput("");
              }}
              directInput={directInput}
              onDirectInputChange={(val) => {
                setDirectInput(val);
                setSelectedMenu("");
              }}
            />
          </section>

          {/* 2단계: 온도 선택 */}
          <section>
            <p className="text-sm font-medium text-gray-700 mb-2">온도</p>
            <div className="flex gap-2">
              {TEMP_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTemp(t)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all"
                  style={{
                    borderColor: temp === t ? session.store_color : "#e5e7eb",
                    background: temp === t ? `${session.store_color}15` : "white",
                    color: temp === t ? session.store_color : "#374151",
                  }}
                >
                  {t === "HOT" ? "🔥 HOT" : "🧊 ICE"}
                </button>
              ))}
            </div>
          </section>

          {/* 3단계: 사이즈 선택 */}
          <section>
            <p className="text-sm font-medium text-gray-700 mb-2">사이즈</p>
            <div className="flex gap-2">
              {sizeOptions.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all"
                  style={{
                    borderColor: size === s ? session.store_color : "#e5e7eb",
                    background: size === s ? `${session.store_color}15` : "white",
                    color: size === s ? session.store_color : "#374151",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          {/* 4단계: 메모 입력 (선택 사항) */}
          <section>
            <p className="text-sm font-medium text-gray-700 mb-2">
              메모 <span className="text-gray-400 font-normal">(선택)</span>
            </p>
            <Input
              placeholder="예: 샷 추가, 달달하게"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </section>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button
            onClick={handleSubmit}
            disabled={isLoading || !finalMenu}
            className="w-full"
            style={{ background: session.store_color }}
          >
            {isLoading
              ? "처리 중..."
              : isEditMode
              ? "수정 완료"
              : "주문 추가"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
