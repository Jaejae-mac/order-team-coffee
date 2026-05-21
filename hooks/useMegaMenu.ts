"use client";
/**
 * hooks/useMegaMenu.ts
 * 메가커피 세션 주문 모달에서 "메뉴판 갱신" 버튼 클릭 시 실시간 메뉴를 가져오는 훅.
 * autoFetch가 false(기본값)이므로 refetch()를 직접 호출해야 API가 실행됨.
 */
import { useState, useEffect, useCallback } from "react";
import type { MenuApiResponse } from "@/app/api/mega-menu/route";
import type { MenuItem } from "@/types";

interface Options {
  category?: string;
  autoFetch?: boolean;
}

export function useMegaMenu(options: Options = {}) {
  const { category, autoFetch = false } = options;

  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(
    async (forceRefresh = true) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (category) params.set("category", category);
        if (forceRefresh) params.set("refresh", "true");

        const res = await fetch(`/api/mega-menu?${params.toString()}`);
        const json: MenuApiResponse = await res.json();

        if (!json.success) throw new Error(json.error ?? "알 수 없는 오류");

        // ScrapedMenuItem → 기존 MenuItem 타입으로 변환 (id, name, category만 사용)
        setMenus(json.items.map((i) => ({ id: i.id, name: i.name, category: i.category })));
      } catch (e) {
        setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    },
    [category]
  );

  // autoFetch 옵션이 true일 때 마운트 시 자동 호출 (기본은 false)
  useEffect(() => {
    if (autoFetch) refetch(false);
  }, [autoFetch, refetch]);

  return { menus, loading, error, refetch };
}
