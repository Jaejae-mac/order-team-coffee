/**
 * 앱 전체에서 사용하는 TypeScript 타입 정의
 * 변경 시 DB 스키마(supabase/schema.sql)와 동기화 필요
 */

// ── 파트(팀) 식별자 ─────────────────────────────────────────
export type PartId = "channel" | "business" | "pay";

// ── 매장 식별자 ──────────────────────────────────────────────
export type StoreId = "starbucks" | "mega" | "coffeebean" | "custom";

// ── 세션 상태 ────────────────────────────────────────────────
export type SessionStatus = "open" | "closed";

// ── 온도 옵션 ────────────────────────────────────────────────
export type TempOption = "HOT" | "ICE";

// ── 파트 정보 ────────────────────────────────────────────────
export interface Part {
  id: PartId;
  name: string;    // 화면에 표시되는 한글 이름 (예: "채널파트")
  color: string;   // 뱃지 텍스트 색상 (hex)
  bg: string;      // 뱃지 배경 색상 (hex)
}

// ── 매장 정보 ────────────────────────────────────────────────
export interface Store {
  id: StoreId;
  name: string;    // 매장 이름 (예: "스타벅스")
  emoji: string;   // 매장 아이콘 이모지
  color: string;   // 브랜드 색상 (hex)
  bg: string;      // 카드 배경 색상 (연한 브랜드 색)
}

// ── 메뉴 항목 ────────────────────────────────────────────────
export interface MenuItem {
  id: string;
  name: string;
  category: string;
}

// ── 음료 시각 정보 ───────────────────────────────────────────
export interface DrinkVisual {
  icon: string;               // 이모지 아이콘
  grad: [string, string];     // SVG 카드에 쓸 그라디언트 색상 쌍 [시작, 끝]
}

// ── 주문 ─────────────────────────────────────────────────────
export interface Order {
  id: string;
  session_id: string;
  name: string;       // 주문자 이름
  part: PartId;
  menu: string;       // 음료 이름
  size: string;       // 예: "톨(T)", "라지(L)"
  temp: TempOption;
  memo: string;
  created_at: string; // ISO 8601 타임스탬프
}

// ── 세션 ─────────────────────────────────────────────────────
export interface Session {
  id: string;
  store_id: StoreId;
  store_name: string;
  store_emoji: string;
  store_color: string;
  store_bg: string;
  creator: string;
  creator_part: PartId;
  status: SessionStatus;
  created_at: string; // ISO 8601 타임스탬프
  orders: Order[];    // 세션 조회 시 JOIN해서 가져오는 주문 목록
}

// ── 그룹된 주문 (화면 표시용) ────────────────────────────────
// 동일한 메뉴+온도+사이즈+메모를 묶어서 수량을 표시할 때 사용
export interface GroupedOrder {
  key: string;        // 그룹 식별 키 (menu|temp|size|memo 조합)
  menu: string;
  temp: TempOption;
  size: string;
  memo: string;
  count: number;
  orderers: Array<{ name: string; part: PartId; orderId: string }>;
}

// ── Server Action 응답 타입 ──────────────────────────────────
export interface ActionResult<T> {
  data: T | null;
  error: string | null;
}
