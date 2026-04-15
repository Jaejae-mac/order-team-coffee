import type { Store } from "@/types";

/** 지원 매장 목록 */
export const STORES: Store[] = [
  { id: "starbucks",  name: "스타벅스", emoji: "☕", color: "#00704A", bg: "#f0faf5" },
  { id: "mega",       name: "메가커피", emoji: "🟡", color: "#E6A817", bg: "#fffbf0" },
  { id: "coffeebean", name: "커피빈",   emoji: "🫘", color: "#6B3FA0", bg: "#f5f0ff" },
  { id: "custom",     name: "기타",     emoji: "🏪", color: "#6366F1", bg: "#f5f3ff" },
];

/** 매장별 사이즈 옵션 */
export const SIZE_OPTIONS: Record<string, string[]> = {
  starbucks:  ["톨(T)", "그란데(G)", "벤티(V)"],
  coffeebean: ["스몰(S)", "레귤러(R)", "라지(L)"],
  default:    ["미디움(M)", "라지(L)"],
};

/** 온도 옵션 */
export const TEMP_OPTIONS = ["HOT", "ICE"] as const;

/** 스토어 ID로 사이즈 옵션 반환 */
export function getSizeOptions(storeId: string): string[] {
  return SIZE_OPTIONS[storeId] ?? SIZE_OPTIONS.default;
}
