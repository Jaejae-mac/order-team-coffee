/**
 * app/api/mega-menu/route.ts
 *
 * GET /api/mega-menu                  전체 음료 메뉴
 * GET /api/mega-menu?category=커피    카테고리 필터
 * GET /api/mega-menu?refresh=true     캐시 갱신 + DB upsert
 */
import { NextRequest, NextResponse } from "next/server";
import { getCachedMenu } from "@/lib/mega-coffee/cache";
import { upsertMegaMenus } from "@/lib/mega-coffee/db";
import { ScrapedMenuItem } from "@/lib/mega-coffee/scraper";

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
  const { searchParams } = req.nextUrl;
  const filterCategory = searchParams.get("category") ?? "";
  const forceRefresh   = searchParams.get("refresh") === "true";

  try {
    const { items, fetchedAt, fromCache } = await getCachedMenu(forceRefresh);

    // 신규 스크래핑(캐시 미사용)이면 DB에도 최신 메뉴 적재 (응답을 블록하지 않음)
    if (!fromCache) {
      upsertMegaMenus(items).catch((err) =>
        console.error("[/api/mega-menu] DB upsert 실패:", err)
      );
    }

    const filtered = filterCategory
      ? items.filter((i) => i.category.includes(filterCategory))
      : items;

    const categories = [...new Set(items.map((i) => i.category))];
    const ttl = Math.max(0, Math.floor((3_600_000 - (Date.now() - fetchedAt)) / 1000));

    return NextResponse.json(
      {
        success: true,
        total: filtered.length,
        categories,
        items: filtered,
        meta: { cachedAt: new Date(fetchedAt).toISOString(), fromCache, ttlSeconds: ttl },
      } satisfies MenuApiResponse,
      {
        headers: {
          "Cache-Control": `public, s-maxage=${ttl}, stale-while-revalidate=3600`,
          "X-Cache": fromCache ? "HIT" : "MISS",
        },
      }
    );
  } catch (err) {
    console.error("[/api/mega-menu]", err);
    return NextResponse.json(
      {
        success: false,
        total: 0,
        categories: [],
        items: [],
        meta: { cachedAt: new Date().toISOString(), fromCache: false, ttlSeconds: 0 },
        error: err instanceof Error ? err.message : "스크래핑 실패",
      } satisfies MenuApiResponse,
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
