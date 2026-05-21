/**
 * lib/mega-coffee/scraper.ts
 * Shuttle Delivery에서 메가커피 메뉴 + 실제 이미지 URL 파싱
 */
import * as cheerio from "cheerio";

export interface ScrapedMenuItem {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  imageUrl: string;
  price: string;
}

const SOURCE_URL =
  "https://www.shuttledelivery.co.kr/en/restaurant/menu/2600/mega-coffee";

const NAME_MAP: Array<{
  key: string;
  name: string;
  nameEn: string;
  category: string;
}> = [
  { key: "gold-mango-smoothie",  name: "골드망고스무디",      nameEn: "Gold Mango Smoothie",          category: "스무디&프라페" },
  { key: "americano-01",         name: "아이스 아메리카노",   nameEn: "Iced Americano",               category: "커피" },
  { key: "americano-02",         name: "핫 아메리카노",       nameEn: "Hot Americano",                category: "커피" },
  { key: "mega-coffee-01_7f12",  name: "흑당라떼",            nameEn: "Brown Sugar Latte",            category: "커피" },
  { key: "mega-coffee-02_2e30",  name: "바닐라라떼",          nameEn: "Vanilla Latte",                category: "커피" },
  { key: "mega-coffee-05_d5d2",  name: "연유라떼",            nameEn: "Condensed Milk Latte",         category: "커피" },
  { key: "mega-coffee-06_df75",  name: "헤이즐넛라떼",        nameEn: "Hazelnut Latte",               category: "커피" },
  { key: "mega-coffee-07_336d",  name: "돌체라떼",            nameEn: "Dolce Latte",                  category: "커피" },
  { key: "mega-coffee-08_5a66",  name: "카라멜 마키아또",     nameEn: "Caramel Macchiato",            category: "커피" },
  { key: "mega-coffee-09_6626",  name: "핫 카페라떼",         nameEn: "Hot Cafe Latte",               category: "커피" },
  { key: "mega-coffee-10_64a3",  name: "아이스 카페라떼",     nameEn: "Iced Cafe Latte",              category: "커피" },
  { key: "mega-coffee-11_ef4d",  name: "카푸치노",            nameEn: "Cappuccino",                   category: "커피" },
  { key: "mega-coffee-12_8818",  name: "코코넛라떼",          nameEn: "Coconut Latte",                category: "커피" },
  { key: "mega-coffee-13_a4ca",  name: "로얄밀크티라떼",      nameEn: "Royal Milk Tea Latte",         category: "티" },
  { key: "mega-coffee-14_ae2b",  name: "말차라떼",            nameEn: "Matcha Latte",                 category: "티" },
  { key: "mega-coffee-15_9458",  name: "흑임자라떼",          nameEn: "Black Sesame Latte",           category: "티" },
  { key: "tea-01",               name: "자몽허니블랙티",      nameEn: "Grapefruit Honey Black Tea",   category: "티" },
  { key: "tea-02",               name: "복숭아아이스티",      nameEn: "Peach Iced Tea",               category: "티" },
  { key: "tea-03",               name: "레몬민트티",          nameEn: "Lemon Mint Tea",               category: "티" },
  { key: "tea-04",               name: "캐모마일티",          nameEn: "Chamomile Tea",                category: "티" },
  { key: "tea-05",               name: "히비스커스티",        nameEn: "Hibiscus Tea",                 category: "티" },
  { key: "tea-06",               name: "얼그레이티",          nameEn: "Earl Grey Tea",                category: "티" },
  { key: "tea-08",               name: "페퍼민트티",          nameEn: "Peppermint Tea",               category: "티" },
  { key: "tea-09",               name: "루이보스티",          nameEn: "Rooibos Tea",                  category: "티" },
  { key: "tea-10",               name: "녹차티",              nameEn: "Green Tea",                    category: "티" },
  { key: "tea-11",               name: "생강차",              nameEn: "Ginger Tea",                   category: "티" },
  { key: "tea-12",               name: "유자차",              nameEn: "Yuzu Tea",                     category: "티" },
  { key: "tea-13",               name: "꿀레몬차",            nameEn: "Honey Lemon Tea",              category: "티" },
  { key: "tea-14",               name: "복숭아차",            nameEn: "Peach Tea",                    category: "티" },
  { key: "tea-15",               name: "딸기차",              nameEn: "Strawberry Tea",               category: "티" },
  { key: "tea-16",               name: "사과차",              nameEn: "Apple Tea",                    category: "티" },
  { key: "tea-17",               name: "블루베리차",          nameEn: "Blueberry Tea",                category: "티" },
  { key: "mega-coffee-08_7d90",  name: "코코넛커피스무디",    nameEn: "Coconut Coffee Smoothie",      category: "스무디&프라페" },
  { key: "mega-coffee-02_bdab",  name: "딸기라떼스무디",      nameEn: "Strawberry Latte Smoothie",    category: "스무디&프라페" },
  { key: "mega-coffee-03_4fdf",  name: "망고스무디",          nameEn: "Mango Smoothie",               category: "스무디&프라페" },
  { key: "mega-coffee-04_a232",  name: "초코프라페",          nameEn: "Choco Frappe",                 category: "스무디&프라페" },
  { key: "mega-coffee-05_b7fa",  name: "그린티스무디",        nameEn: "Green Tea Smoothie",           category: "스무디&프라페" },
  { key: "mega-coffee-07_421d",  name: "바닐라스무디",        nameEn: "Vanilla Smoothie",             category: "스무디&프라페" },
  { key: "mega-coffee-09_a5c2",  name: "망빙프라페",          nameEn: "Mango Bingsu Frappe",          category: "스무디&프라페" },
  { key: "mega-coffee-10_c8d4",  name: "딸기스무디",          nameEn: "Strawberry Smoothie",          category: "스무디&프라페" },
  { key: "mega-coffee-11_e748",  name: "요거트스무디",        nameEn: "Yogurt Smoothie",              category: "스무디&프라페" },
  { key: "mega-coffee-12_68fa",  name: "자몽스무디",          nameEn: "Grapefruit Smoothie",          category: "스무디&프라페" },
  { key: "mega-coffee-13_3339",  name: "청포도스무디",        nameEn: "Green Grape Smoothie",         category: "스무디&프라페" },
  { key: "mega-coffee-14_20da",  name: "복숭아스무디",        nameEn: "Peach Smoothie",               category: "스무디&프라페" },
  { key: "mega-coffee-15_ff54",  name: "레몬스무디",          nameEn: "Lemon Smoothie",               category: "스무디&프라페" },
  { key: "capture-dcran-2023-08-30--164331", name: "자몽에이드",    nameEn: "Grapefruit Ade",  category: "에이드&주스" },
  { key: "capture-dcran-2023-08-30--164609", name: "레몬에이드",    nameEn: "Lemon Ade",       category: "에이드&주스" },
  { key: "capture-dcran-2023-08-30--164706", name: "청포도에이드",  nameEn: "Green Grape Ade", category: "에이드&주스" },
  { key: "capture-dcran-2023-08-30--164803", name: "복숭아에이드",  nameEn: "Peach Ade",       category: "에이드&주스" },
  { key: "capture-dcran-2023-08-30--164913", name: "딸기에이드",    nameEn: "Strawberry Ade",  category: "에이드&주스" },
  { key: "capture-dcran-2023-08-30--165010", name: "키위에이드",    nameEn: "Kiwi Ade",        category: "에이드&주스" },
  { key: "capture-dcran-2023-08-30--165208", name: "블루베리에이드",nameEn: "Blueberry Ade",   category: "에이드&주스" },
];

function resolveName(src: string) {
  const filename = src.split("/").pop() ?? "";
  for (const m of NAME_MAP) {
    if (filename.startsWith(m.key)) return m;
  }
  return null;
}

export async function scrapeMegaCoffeeMenu(): Promise<ScrapedMenuItem[]> {
  const res = await fetch(SOURCE_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "ko-KR,ko;q=0.9",
    },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Fetch 실패: ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);

  const items: ScrapedMenuItem[] = [];
  const seen = new Set<string>();
  let idx = 0;

  $("img").each((_, el) => {
    const src = $(el).attr("src") ?? "";
    if (!src.includes("cloudfront.net")) return;
    const info = resolveName(src);
    if (!info) return;
    if (seen.has(src)) return;
    seen.add(src);

    const nextText = $(el).next().text().trim() || $(el).parent().text().replace(/ADD/g, "").trim();
    const priceMatch = nextText.match(/₩[\d,]+/);

    idx++;
    items.push({
      id: String(idx).padStart(3, "0"),
      name: info.name,
      nameEn: info.nameEn,
      category: info.category,
      imageUrl: src,
      price: priceMatch?.[0] ?? "",
    });
  });

  return items;
}
