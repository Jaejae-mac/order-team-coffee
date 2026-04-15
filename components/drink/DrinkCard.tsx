/**
 * 음료 시각 카드 컴포넌트
 * - 외부 이미지 없이 이모지 + SVG 그라디언트로 음료를 표현
 * - 선택 상태일 때 매장 색상의 테두리로 강조 표시
 */
import { getDrinkVisual } from "@/lib/constants/drinkVisuals";

interface DrinkCardProps {
  name: string;
  size?: number;          // 카드의 가로/세로 크기 (px)
  selected?: boolean;     // 선택된 상태 여부 (테두리 표시)
  storeColor?: string;    // 매장 브랜드 색상 (선택 테두리 색)
}

export default function DrinkCard({
  name,
  size = 60,
  selected = false,
  storeColor = "#6366F1",
}: DrinkCardProps) {
  const visual = getDrinkVisual(name);
  const [g1, g2] = visual.grad;
  const borderRadius = size > 40 ? 12 : 8;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius,
        background: `linear-gradient(135deg, ${g1}, ${g2})`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        position: "relative",
        overflow: "hidden",
        // 선택 시 매장 색상 테두리, 미선택 시 테두리 없음
        boxShadow: selected ? `0 0 0 2px ${storeColor}` : "none",
        transition: "box-shadow 0.15s",
      }}
    >
      {/* 상단 반짝임 효과 (빛이 위에서 내려오는 느낌) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "45%",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)",
          borderRadius: "inherit",
        }}
      />
      <span
        style={{
          fontSize: size * 0.42,
          lineHeight: 1,
          position: "relative",
          zIndex: 1,
        }}
      >
        {visual.icon}
      </span>
    </div>
  );
}
