/**
 * lib/mega-coffee/db.ts
 * 스크래핑된 메가커피 메뉴를 Supabase mega_menus 테이블에 upsert
 */
import { createClient } from "@supabase/supabase-js";
import type { ScrapedMenuItem } from "./scraper";

export async function upsertMegaMenus(items: ScrapedMenuItem[]): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const rows = items.map((i) => ({
    id: i.id,
    name: i.name,
    name_en: i.nameEn,
    category: i.category,
    image_url: i.imageUrl,
    price: i.price,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("mega_menus")
    .upsert(rows, { onConflict: "id" });

  if (error) throw new Error(`mega_menus upsert 실패: ${error.message}`);
}
