/**
 * 음료 선택 컴포넌트
 * - 카테고리 탭으로 필터링 + 검색
 * - "직접 입력" 탭에서 메뉴에 없는 음료를 직접 입력 가능
 * - 기타 매장 세션은 직접 입력 탭만 표시
 */
"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import DrinkCard from "@/components/drink/DrinkCard";
import { getMenus } from "@/lib/constants/menus";
import type { Session } from "@/types";

interface MenuPickerProps {
  session: Session;
  selectedMenuName: string;
  onSelect: (name: string) => void;
  directInput: string;
  onDirectInputChange: (value: string) => void;
}

export default function MenuPicker({
  session,
  selectedMenuName,
  onSelect,
  directInput,
  onDirectInputChange,
}: MenuPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const menus = getMenus(session.store_id);
  const isCustomStore = session.store_id === "custom" || menus.length === 0;

  // 카테고리 목록 추출 (중복 제거)
  const categories = useMemo(
    () => ["전체", ...Array.from(new Set(menus.map((m) => m.category)))],
    [menus]
  );

  // 검색어로 메뉴 필터링
  const filteredMenus = useMemo(
    () =>
      menus.filter((m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [menus, searchQuery]
  );

  // 기타 매장은 직접 입력만 표시
  if (isCustomStore) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-gray-500">음료 이름을 직접 입력해주세요</p>
        <Input
          placeholder="예: 아이스 아메리카노"
          value={directInput}
          onChange={(e) => onDirectInputChange(e.target.value)}
          autoFocus
        />
      </div>
    );
  }

  return (
    <Tabs defaultValue="전체">
      {/* 검색 입력 — max-w-full로 dialog 너비 초과 방지 */}
      <Input
        placeholder="음료 이름 검색..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-3 max-w-full"
      />

      {/* 카테고리 탭 */}
      {/* 카테고리가 많아도 한 줄 유지 — 좌우로 슬라이드 가능 */}
      <TabsList className="flex flex-nowrap overflow-x-auto h-auto gap-1 mb-3 bg-transparent p-0" style={{ scrollbarWidth: "none" }}>
        {categories.map((cat) => (
          <TabsTrigger
            key={cat}
            value={cat}
            className="shrink-0 text-xs px-3 py-1 rounded-full border data-[state=active]:text-white"
            style={{
              ["--store-color" as string]: session.store_color,
            }}
            onClick={() => setSearchQuery("")}
          >
            {cat}
          </TabsTrigger>
        ))}
        <TabsTrigger value="직접입력" className="shrink-0 text-xs px-3 py-1 rounded-full border">
          ✏️ 직접입력
        </TabsTrigger>
      </TabsList>

      {/* 카테고리별 메뉴 그리드 */}
      {categories.map((cat) => (
        <TabsContent key={cat} value={cat} className="mt-0">
          {/* min-w-0: grid 셀 내부 버튼이 셀 너비를 초과하지 않도록 제한 */}
          <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
            {(cat === "전체" ? filteredMenus : filteredMenus.filter((m) => m.category === cat)).map(
              (menu) => (
                <button
                  key={menu.id}
                  onClick={() => onSelect(menu.name)}
                  className="min-w-0 flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all hover:scale-105"
                  style={{
                    borderColor:
                      selectedMenuName === menu.name
                        ? session.store_color
                        : "transparent",
                    background:
                      selectedMenuName === menu.name
                        ? `${session.store_color}12`
                        : "#f9fafb",
                  }}
                >
                  <DrinkCard
                    name={menu.name}
                    size={44}
                    selected={selectedMenuName === menu.name}
                    storeColor={session.store_color}
                  />
                  <span className="text-xs text-center text-gray-700 leading-tight line-clamp-2">
                    {menu.name}
                  </span>
                </button>
              )
            )}
          </div>
        </TabsContent>
      ))}

      {/* 직접 입력 탭 */}
      <TabsContent value="직접입력" className="mt-0">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-gray-500">메뉴에 없는 음료를 직접 입력하세요</p>
          <Input
            placeholder="예: 딸기 프라푸치노"
            value={directInput}
            onChange={(e) => onDirectInputChange(e.target.value)}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
