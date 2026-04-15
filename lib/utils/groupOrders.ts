import type { Order, GroupedOrder } from "@/types";

/**
 * 주문 목록을 메뉴+온도+사이즈+메모 조합으로 묶어 수량을 합산
 * 세션 상세 화면에서 동일 음료를 한 줄로 묶어 표시할 때 사용
 */
export function groupOrders(orders: Order[]): GroupedOrder[] {
  const map = new Map<string, GroupedOrder>();

  for (const order of orders) {
    // 1. 그룹 키 생성 (동일한 메뉴/온도/사이즈/메모 묶음)
    const key = `${order.menu}|${order.temp}|${order.size}|${order.memo}`;

    const existing = map.get(key);
    if (existing) {
      // 2. 이미 같은 그룹이 있으면 수량 증가 및 주문자 목록 추가
      existing.count += 1;
      existing.orderers.push({
        name: order.name,
        part: order.part,
        orderId: order.id,
      });
    } else {
      // 3. 새 그룹 생성
      map.set(key, {
        key,
        menu: order.menu,
        temp: order.temp,
        size: order.size,
        memo: order.memo,
        count: 1,
        orderers: [{ name: order.name, part: order.part, orderId: order.id }],
      });
    }
  }

  return Array.from(map.values());
}
