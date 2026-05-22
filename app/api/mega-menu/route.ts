/**
 * app/api/mega-menu/route.ts
 *
 * GET /api/mega-menu                  전체 메가커피 메뉴 (정적 데이터)
 * GET /api/mega-menu?category=커피    카테고리 필터
 *
 * 외부 스크래핑 없이 정적 메뉴 데이터를 즉시 반환합니다.
 * 이미지는 public/images/mega/ 폴더에서 self-hosting합니다.
 */
import { NextRequest, NextResponse } from "next/server";
import { MEGA_MENUS } from "@/lib/constants/menus";

export interface ScrapedMenuItem {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  imageUrl: string;
  price: string;
}

export interface MenuApiResponse {
  success: boolean;
  total: number;
  categories: string[];
  items: ScrapedMenuItem[];
  meta: {
    cachedAt: string;
    fromCache: boolean;
    ttlSeconds: number;
  };
  error?: string;
}

export async function GET(req: NextRequest) {
  const filterCategory = req.nextUrl.searchParams.get("category") ?? "";

  const allItems: ScrapedMenuItem[] = MEGA_MENUS.map((m) => ({
    id: m.id,
    name: m.name,
    nameEn: "",
    category: m.category,
    imageUrl: m.imageUrl ?? "",
    price: "",
  }));

  const filtered = filterCategory
    ? allItems.filter((i) => i.category.includes(filterCategory))
    : allItems;

  const categories = [...new Set(allItems.map((i) => i.category))];

  return NextResponse.json({
    success: true,
    total: filtered.length,
    categories,
    items: filtered,
    meta: {
      cachedAt: new Date().toISOString(),
      fromCache: false,
      ttlSeconds: 0,
    },
  } satisfies MenuApiResponse);
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
