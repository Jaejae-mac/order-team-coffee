import { useState, useEffect } from "react";


// 음료별 시각 정보 (외부 이미지 의존 없이 자체 렌더링)
// icon: 이모지, grad: 그라디언트 색상 쌍
const DRINK_VISUALS = {
  // 에스프레소 계열
  "아메리카노":    { icon: "☕", grad: ["#4a3728", "#6b4c3b"] },
  "아이스 아메리카노": { icon: "🧊", grad: ["#2c4a6e", "#3d6b9e"] },
  "카페 아메리카노": { icon: "☕", grad: ["#4a3728", "#7a5c48"] },
  "카페 라떼":    { icon: "🥛", grad: ["#8b6f5e", "#c4a882"] },
  "아이스 카페 라떼": { icon: "🥛", grad: ["#5e8fa8", "#9ec4d8"] },
  "바닐라 라떼":  { icon: "🌼", grad: ["#c4a84a", "#e8d07a"] },
  "아이스 바닐라 라떼": { icon: "🌼", grad: ["#7ab8c8", "#b8dce8"] },
  "카라멜 마키아또": { icon: "🍮", grad: ["#a0703a", "#d4a865"] },
  "아이스 카라멜 마키아또": { icon: "🍮", grad: ["#7a9eb8", "#a8c8d8"] },
  "카푸치노":    { icon: "☕", grad: ["#7a5440", "#a8785a"] },
  "카페 모카":   { icon: "🍫", grad: ["#5a3a2a", "#8a5a40"] },
  "아이스 카페 모카": { icon: "🍫", grad: ["#4a6878", "#6a9aaa"] },
  "돌체 라떼":   { icon: "🍯", grad: ["#b8824a", "#e0b070"] },
  "플랫 화이트": { icon: "🤍", grad: ["#8a7060", "#b8a090"] },
  "에스프레소":  { icon: "⬛", grad: ["#2a1a10", "#4a2a1a"] },
  // 콜드브루
  "콜드 브루":   { icon: "🫙", grad: ["#1a2a3a", "#2a4a5a"] },
  "나이트로 콜드 브루": { icon: "🌑", grad: ["#0a1a2a", "#1a3a4a"] },
  "돌체 콜드 브루": { icon: "🍦", grad: ["#4a6a8a", "#8ab0c8"] },
  "콜드 브루 라떼": { icon: "🥛", grad: ["#3a5a7a", "#6a9ab8"] },
  // 프라푸치노
  "자바 칩 프라푸치노": { icon: "🍪", grad: ["#3a2a1a", "#7a5a3a"] },
  "카라멜 프라푸치노": { icon: "🍮", grad: ["#9a7a3a", "#c8a860"] },
  "모카 프라푸치노": { icon: "🍫", grad: ["#4a2a1a", "#8a5a3a"] },
  "더블 에스프레소 칩 프라푸치노": { icon: "☕", grad: ["#2a1a0a", "#5a3a2a"] },
  "그린 티 크림 프라푸치노": { icon: "🍵", grad: ["#4a7a4a", "#8ab88a"] },
  "바닐라 크림 프라푸치노": { icon: "🤍", grad: ["#c8b898", "#e8d8b8"] },
  // 티/리프레셔
  "그린 티 라떼": { icon: "🍵", grad: ["#3a7a3a", "#5aa85a"] },
  "아이스 그린 티 라떼": { icon: "🍵", grad: ["#4a8a6a", "#7ab89a"] },
  "자몽 허니 블랙 티": { icon: "🍊", grad: ["#c8603a", "#e89060"] },
  "복숭아 아이스 티": { icon: "🍑", grad: ["#e8905a", "#f0b888"] },
  "딸기 아사이 리프레셔": { icon: "🍓", grad: ["#c83a5a", "#e86080"] },
  "망고 드래곤 프루트 리프레셔": { icon: "🥭", grad: ["#e8903a", "#f0b860"] },
  "핑크 드링크": { icon: "🩷", grad: ["#e87090", "#f0a0b8"] },
  // 메가커피
  "메가리카노":  { icon: "🫗", grad: ["#2a3a4a", "#4a6a7a"] },
  "꿀아메리카노": { icon: "🍯", grad: ["#c8903a", "#e8c060"] },
  "헤이즐넛아메리카노": { icon: "🌰", grad: ["#7a5030", "#a87850"] },
  "바닐라아메리카노": { icon: "🌼", grad: ["#a8903a", "#d0b860"] },
  "카페라떼":   { icon: "🥛", grad: ["#8a6a58", "#b89878"] },
  "바닐라라떼":  { icon: "🌼", grad: ["#b89840", "#d8c068"] },
  "헤이즐넛라떼": { icon: "🌰", grad: ["#8a6040", "#b08868"] },
  "연유라떼":   { icon: "🍶", grad: ["#c8b080", "#e8d0a0"] },
  "흑당라떼":   { icon: "🟤", grad: ["#4a2a10", "#7a5030"] },
  "오레오초코라떼": { icon: "🍪", grad: ["#1a1a1a", "#4a3a2a"] },
  "초코라떼":   { icon: "🍫", grad: ["#5a2a1a", "#8a5030"] },
  "콜드브루":   { icon: "🫙", grad: ["#1a2a3a", "#3a5a6a"] },
  "콜드브루라떼": { icon: "🫙", grad: ["#2a4a5a", "#5a7a8a"] },
  "할메가커피":  { icon: "☕", grad: ["#6a4a2a", "#9a7a50"] },
  "왕할메가커피": { icon: "☕", grad: ["#5a3a1a", "#8a6040"] },
  "로얄밀크티":  { icon: "🍵", grad: ["#8a5a40", "#b88868"] },
  "딸기밀크티":  { icon: "🍓", grad: ["#c84060", "#e87090"] },
  "왕메가아이스티": { icon: "🧊", grad: ["#4a8a8a", "#7ababa"] },
  "복숭아아이스티": { icon: "🍑", grad: ["#e0885a", "#f0b080"] },
  "얼그레이라떼": { icon: "🫖", grad: ["#8a7a6a", "#b0a090"] },
  "그린티라떼":  { icon: "🍵", grad: ["#3a7a3a", "#5aa05a"] },
  "메가에이드":  { icon: "🍋", grad: ["#d0c030", "#e8d858"] },
  "자몽에이드":  { icon: "🍊", grad: ["#e06030", "#f09050"] },
  "레몬에이드":  { icon: "🍋", grad: ["#d8c828", "#f0e050"] },
  "청포도에이드": { icon: "🍇", grad: ["#608a40", "#90b868"] },
  "체리콕":     { icon: "🍒", grad: ["#9a1a30", "#c84050"] },
  "딸기바나나주스": { icon: "🍓", grad: ["#d04868", "#e87898"] },
  "망고주스":   { icon: "🥭", grad: ["#e89030", "#f0b858"] },
  "딸기라떼":   { icon: "🍓", grad: ["#d05070", "#e880a0"] },
  "고구마라떼":  { icon: "🍠", grad: ["#9a5890", "#c888b8"] },
  "퐁크러쉬(플레인)": { icon: "🫧", grad: ["#8090a0", "#a8b8c8"] },
  "퐁크러쉬(딸기)": { icon: "🍓", grad: ["#c84870", "#e878a0"] },
  "퐁크러쉬(초코)": { icon: "🍫", grad: ["#4a2818", "#7a5038"] },
  "쿠키프라페":  { icon: "🍪", grad: ["#6a5040", "#9a8060"] },
  "민트초코프라페": { icon: "🍃", grad: ["#3a7a5a", "#5aa080"] },
  "코코넛커피스무디": { icon: "🥥", grad: ["#7a9060", "#a8b888"] },
  "디카페인 아메리카노": { icon: "☕", grad: ["#6a5a4a", "#9a8a7a"] },
  "디카페인 카페라떼": { icon: "🥛", grad: ["#9a8070", "#c8a898"] },
  "디카페인 바닐라라떼": { icon: "🌼", grad: ["#a89060", "#c8b080"] },
  // 커피빈 전용
  "커피빈 라떼":    { icon: "🫘", grad: ["#6b3f80", "#9a6ab8"] },
  "아이스 커피빈 라떼": { icon: "🫘", grad: ["#4a6a9a", "#7a9ac8"] },
  "아이스 헤이즐넛 아메리카노": { icon: "🌰", grad: ["#5a4030", "#8a6848"] },
  "헤이즐넛 아메리카노": { icon: "🌰", grad: ["#6a4a38", "#9a7858"] },
  "바닐라빈 오트 라떼": { icon: "🌿", grad: ["#8a9060", "#b8b888"] },
  "아이스 바닐라빈 오트 라떼": { icon: "🌿", grad: ["#6a8870", "#9ab8a0"] },
  "캐러멜 마끼아또": { icon: "🍮", grad: ["#a07038", "#d0a060"] },
  "아이스 캐러멜 마끼아또": { icon: "🍮", grad: ["#7a9ab8", "#a8c8d8"] },
  "달고나 크림 라떼": { icon: "🍬", grad: ["#c8983a", "#e8c870"] },
  "카페 수아": { icon: "🥛", grad: ["#c8a878", "#e8c8a0"] },
  "오리지널 아이스 블렌디드": { icon: "🫙", grad: ["#3a4a6a", "#5a7a9a"] },
  "모카 아이스 블렌디드": { icon: "🍫", grad: ["#3a2010", "#6a4828"] },
  "헤이즐넛 아이스 블렌디드": { icon: "🌰", grad: ["#8a6030", "#b89058"] },
  "바닐라 아이스 블렌디드": { icon: "🌼", grad: ["#c8b060", "#e8d090"] },
  "그린티 아이스 블렌디드": { icon: "🍵", grad: ["#3a7a4a", "#6aaa6a"] },
  "딸기 아이스 블렌디드": { icon: "🍓", grad: ["#c83a5a", "#e86888"] },
  "망고 아이스 블렌디드": { icon: "🥭", grad: ["#e09030", "#f0b858"] },
  "얼그레이 티": { icon: "🫖", grad: ["#7a6858", "#a89880"] },
  "아이스 얼그레이 티": { icon: "🫖", grad: ["#7a8898", "#a8b8c8"] },
  "잉글리쉬 브렉퍼스트 티": { icon: "🍵", grad: ["#8a5848", "#b88870"] },
  "캐모마일 티": { icon: "🌼", grad: ["#c8b840", "#e8d870"] },
  "페퍼민트 티": { icon: "🍃", grad: ["#3a8858", "#5ab880"] },
  "레몬 민트 티": { icon: "🍋", grad: ["#b8b838", "#d8d860"] },
  "제주 말차 라떼": { icon: "🍵", grad: ["#2a7a3a", "#4aaa5a"] },
  "아이스 제주 말차 라떼": { icon: "🍵", grad: ["#3a8a5a", "#5ab888"] },
  "헤이즐넛 말차 라떼": { icon: "🌿", grad: ["#5a7040", "#8aa068"] },
  "아이스 헤이즐넛 말차 라떼": { icon: "🌿", grad: ["#4a7858", "#7aa888"] },
  "로얄 밀크티 라떼": { icon: "👑", grad: ["#9a7850", "#c8a878"] },
  "아이스 로얄 밀크티 라떼": { icon: "👑", grad: ["#7a90a8", "#a8b8d0"] },
};

const DEFAULT_VISUAL = { icon: "☕", grad: ["#6a5a4a", "#9a8a7a"] };

// 음료 시각 카드 컴포넌트 (이미지 대신 SVG 카드로 렌더링)
function DrinkCard({ name, size = 60, selected = false, storeColor }) {
  const visual = DRINK_VISUALS[name] || DEFAULT_VISUAL;
  const [g1, g2] = visual.grad;
  return (
    <div style={{
      width: size, height: size, borderRadius: size > 40 ? 12 : 8,
      background: `linear-gradient(135deg, ${g1}, ${g2})`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      flexShrink: 0, position: "relative", overflow: "hidden",
      boxShadow: selected ? `0 0 0 2px ${storeColor}` : "none",
      transition: "box-shadow 0.15s"
    }}>
      {/* 반짝임 효과 */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "45%",
        background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)",
        borderRadius: "inherit"
      }} />
      <span style={{ fontSize: size * 0.42, lineHeight: 1, position: "relative", zIndex: 1 }}>
        {visual.icon}
      </span>
    </div>
  );
}

const STARBUCKS_MENUS = [
  { id: "sb01", name: "아이스 아메리카노", category: "에스프레소" },
  { id: "sb02", name: "카페 아메리카노", category: "에스프레소" },
  { id: "sb03", name: "카페 라떼", category: "에스프레소" },
  { id: "sb04", name: "아이스 카페 라떼", category: "에스프레소" },
  { id: "sb05", name: "바닐라 라떼", category: "에스프레소" },
  { id: "sb06", name: "아이스 바닐라 라떼", category: "에스프레소" },
  { id: "sb07", name: "카라멜 마키아또", category: "에스프레소" },
  { id: "sb08", name: "아이스 카라멜 마키아또", category: "에스프레소" },
  { id: "sb09", name: "카푸치노", category: "에스프레소" },
  { id: "sb10", name: "카페 모카", category: "에스프레소" },
  { id: "sb11", name: "아이스 카페 모카", category: "에스프레소" },
  { id: "sb12", name: "돌체 라떼", category: "에스프레소" },
  { id: "sb13", name: "플랫 화이트", category: "에스프레소" },
  { id: "sb14", name: "에스프레소", category: "에스프레소" },
  { id: "sb20", name: "콜드 브루", category: "콜드브루" },
  { id: "sb21", name: "나이트로 콜드 브루", category: "콜드브루" },
  { id: "sb22", name: "돌체 콜드 브루", category: "콜드브루" },
  { id: "sb23", name: "콜드 브루 라떼", category: "콜드브루" },
  { id: "sb30", name: "자바 칩 프라푸치노", category: "프라푸치노" },
  { id: "sb31", name: "카라멜 프라푸치노", category: "프라푸치노" },
  { id: "sb32", name: "모카 프라푸치노", category: "프라푸치노" },
  { id: "sb33", name: "더블 에스프레소 칩 프라푸치노", category: "프라푸치노" },
  { id: "sb34", name: "그린 티 크림 프라푸치노", category: "프라푸치노" },
  { id: "sb35", name: "바닐라 크림 프라푸치노", category: "프라푸치노" },
  { id: "sb40", name: "그린 티 라떼", category: "티/리프레셔" },
  { id: "sb41", name: "아이스 그린 티 라떼", category: "티/리프레셔" },
  { id: "sb42", name: "자몽 허니 블랙 티", category: "티/리프레셔" },
  { id: "sb43", name: "복숭아 아이스 티", category: "티/리프레셔" },
  { id: "sb44", name: "딸기 아사이 리프레셔", category: "티/리프레셔" },
  { id: "sb45", name: "망고 드래곤 프루트 리프레셔", category: "티/리프레셔" },
  { id: "sb46", name: "핑크 드링크", category: "티/리프레셔" },
];
const MEGA_MENUS = [
  { id: "mg01", name: "아메리카노", category: "커피" },
  { id: "mg02", name: "메가리카노", category: "커피" },
  { id: "mg03", name: "꿀아메리카노", category: "커피" },
  { id: "mg04", name: "헤이즐넛아메리카노", category: "커피" },
  { id: "mg05", name: "바닐라아메리카노", category: "커피" },
  { id: "mg06", name: "카페라떼", category: "커피" },
  { id: "mg07", name: "바닐라라떼", category: "커피" },
  { id: "mg08", name: "헤이즐넛라떼", category: "커피" },
  { id: "mg09", name: "카푸치노", category: "커피" },
  { id: "mg10", name: "연유라떼", category: "커피" },
  { id: "mg11", name: "흑당라떼", category: "커피" },
  { id: "mg12", name: "오레오초코라떼", category: "커피" },
  { id: "mg13", name: "초코라떼", category: "커피" },
  { id: "mg14", name: "콜드브루", category: "커피" },
  { id: "mg15", name: "콜드브루라떼", category: "커피" },
  { id: "mg16", name: "할메가커피", category: "커피" },
  { id: "mg17", name: "왕할메가커피", category: "커피" },
  { id: "mg20", name: "그린티라떼", category: "티" },
  { id: "mg21", name: "얼그레이라떼", category: "티" },
  { id: "mg22", name: "로얄밀크티", category: "티" },
  { id: "mg23", name: "딸기밀크티", category: "티" },
  { id: "mg24", name: "왕메가아이스티", category: "티" },
  { id: "mg25", name: "복숭아아이스티", category: "티" },
  { id: "mg30", name: "메가에이드", category: "에이드&주스" },
  { id: "mg31", name: "자몽에이드", category: "에이드&주스" },
  { id: "mg32", name: "레몬에이드", category: "에이드&주스" },
  { id: "mg33", name: "청포도에이드", category: "에이드&주스" },
  { id: "mg34", name: "체리콕", category: "에이드&주스" },
  { id: "mg35", name: "딸기바나나주스", category: "에이드&주스" },
  { id: "mg36", name: "망고주스", category: "에이드&주스" },
  { id: "mg40", name: "딸기라떼", category: "스무디&프라페" },
  { id: "mg41", name: "고구마라떼", category: "스무디&프라페" },
  { id: "mg42", name: "퐁크러쉬(플레인)", category: "스무디&프라페" },
  { id: "mg43", name: "퐁크러쉬(딸기)", category: "스무디&프라페" },
  { id: "mg44", name: "퐁크러쉬(초코)", category: "스무디&프라페" },
  { id: "mg45", name: "쿠키프라페", category: "스무디&프라페" },
  { id: "mg46", name: "민트초코프라페", category: "스무디&프라페" },
  { id: "mg47", name: "코코넛커피스무디", category: "스무디&프라페" },
  { id: "mg50", name: "디카페인 아메리카노", category: "디카페인" },
  { id: "mg51", name: "디카페인 카페라떼", category: "디카페인" },
  { id: "mg52", name: "디카페인 바닐라라떼", category: "디카페인" },
];

const COFFEEBEAN_MENUS = [
  // ── 에스프레소 음료 ──
  { id: "cb01", name: "아이스 아메리카노", category: "에스프레소" },
  { id: "cb02", name: "아메리카노", category: "에스프레소" },
  { id: "cb03", name: "아이스 헤이즐넛 아메리카노", category: "에스프레소" },
  { id: "cb04", name: "헤이즐넛 아메리카노", category: "에스프레소" },
  { id: "cb05", name: "카페 라떼", category: "에스프레소" },
  { id: "cb06", name: "아이스 카페 라떼", category: "에스프레소" },
  { id: "cb07", name: "커피빈 라떼", category: "에스프레소" },
  { id: "cb08", name: "아이스 커피빈 라떼", category: "에스프레소" },
  { id: "cb09", name: "바닐라 라떼", category: "에스프레소" },
  { id: "cb10", name: "아이스 바닐라 라떼", category: "에스프레소" },
  { id: "cb11", name: "바닐라빈 오트 라떼", category: "에스프레소" },
  { id: "cb12", name: "아이스 바닐라빈 오트 라떼", category: "에스프레소" },
  { id: "cb13", name: "캐러멜 마끼아또", category: "에스프레소" },
  { id: "cb14", name: "아이스 캐러멜 마끼아또", category: "에스프레소" },
  { id: "cb15", name: "카푸치노", category: "에스프레소" },
  { id: "cb16", name: "플랫 화이트", category: "에스프레소" },
  { id: "cb17", name: "달고나 크림 라떼", category: "에스프레소" },
  { id: "cb18", name: "카페 수아", category: "에스프레소" },
  // ── 아이스 블렌디드 (Coffee) ──
  { id: "cb20", name: "오리지널 아이스 블렌디드", category: "아이스 블렌디드" },
  { id: "cb21", name: "모카 아이스 블렌디드", category: "아이스 블렌디드" },
  { id: "cb22", name: "헤이즐넛 아이스 블렌디드", category: "아이스 블렌디드" },
  { id: "cb23", name: "바닐라 아이스 블렌디드", category: "아이스 블렌디드" },
  { id: "cb24", name: "그린티 아이스 블렌디드", category: "아이스 블렌디드" },
  { id: "cb25", name: "딸기 아이스 블렌디드", category: "아이스 블렌디드" },
  { id: "cb26", name: "망고 아이스 블렌디드", category: "아이스 블렌디드" },
  // ── 티 ──
  { id: "cb30", name: "얼그레이 티", category: "티" },
  { id: "cb31", name: "아이스 얼그레이 티", category: "티" },
  { id: "cb32", name: "잉글리쉬 브렉퍼스트 티", category: "티" },
  { id: "cb33", name: "캐모마일 티", category: "티" },
  { id: "cb34", name: "페퍼민트 티", category: "티" },
  { id: "cb35", name: "레몬 민트 티", category: "티" },
  // ── 티 라떼 ──
  { id: "cb40", name: "제주 말차 라떼", category: "티 라떼" },
  { id: "cb41", name: "아이스 제주 말차 라떼", category: "티 라떼" },
  { id: "cb42", name: "헤이즐넛 말차 라떼", category: "티 라떼" },
  { id: "cb43", name: "아이스 헤이즐넛 말차 라떼", category: "티 라떼" },
  { id: "cb44", name: "로얄 밀크티 라떼", category: "티 라떼" },
  { id: "cb45", name: "아이스 로얄 밀크티 라떼", category: "티 라떼" },
];

const STORES = [
  { id: "starbucks", name: "스타벅스", emoji: "☕", color: "#00704A", bg: "#f0faf5" },
  { id: "mega", name: "메가커피", emoji: "🟡", color: "#E6A817", bg: "#fffbf0" },
  { id: "coffeebean", name: "커피빈", emoji: "🫘", color: "#6B3FA0", bg: "#f5f0ff" },
  { id: "custom", name: "기타", emoji: "🏪", color: "#6366F1", bg: "#f5f3ff" },
];

const SIZE_OPTIONS_DEFAULT = ["미디움(M)", "라지(L)"];
const SIZE_OPTIONS_STARBUCKS = ["톨(T)", "그란데(G)", "벤티(V)"];
const SIZE_OPTIONS_COFFEEBEAN = ["스몰(S)", "레귤러(R)", "라지(L)"];
const TEMP_OPTIONS = ["HOT", "ICE"];

const PARTS = [
  { id: "channel", name: "채널파트", color: "#3b82f6", bg: "#eff6ff" },
  { id: "business", name: "업무파트", color: "#10b981", bg: "#ecfdf5" },
  { id: "pay", name: "페이파트", color: "#f59e0b", bg: "#fffbeb" },
];

function getMenus(storeId) {
  if (storeId === "starbucks") return STARBUCKS_MENUS;
  if (storeId === "mega") return MEGA_MENUS;
  if (storeId === "coffeebean") return COFFEEBEAN_MENUS;
  return [];
}

function MenuImage({ src, name, color, size = 72 }) {
  // 외부 이미지 대신 DrinkCard로 통일 렌더링
  return <DrinkCard name={name} size={size} storeColor={color} />;
}

const ACCESS_CODE = "lpoint1!";

// ─── 로그인 ───────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [step, setStep] = useState(1); // 1: 입장코드, 2: 이름+파트
  const [code, setCode] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const [name, setName] = useState("");
  const [part, setPart] = useState("");
  const [touched, setTouched] = useState(false);

  const codeOk = code === ACCESS_CODE;
  const nameOk = name.trim().length > 0;
  const partOk = part !== "";
  const canEnter = nameOk && partOk;
  const selectedPart = PARTS.find(p => p.id === part);

  function handleCodeSubmit() {
    setCodeTouched(true);
    if (codeOk) setStep(2);
  }

  function handleSubmit() {
    setTouched(true);
    if (!canEnter) return;
    onLogin({ name: name.trim(), part });
  }

  const bg = "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)";
  const cardStyle = {
    background: "rgba(255,255,255,0.06)", backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.12)", borderRadius: 24,
    padding: "44px 36px", width: 360, maxWidth: "100%", textAlign: "center",
    boxShadow: "0 25px 50px rgba(0,0,0,0.5)"
  };

  /* ── Step 1: 입장 코드 ── */
  if (step === 1) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: bg, fontFamily: "system-ui, sans-serif", padding: "20px", boxSizing: "border-box" }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>🔐</div>
          <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: "0 0 6px" }}>입장 코드 확인</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 28 }}>팀 전용 입장 코드를 입력해주세요</p>

          <div style={{ textAlign: "left", marginBottom: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              입장 코드 <span style={{ color: "#f87171" }}>*</span>
            </label>
          </div>

          {/* 코드 입력 + 보기 토글 */}
          <div style={{ position: "relative", marginBottom: codeTouched && !codeOk ? 6 : 24 }}>
            <input
              value={code}
              onChange={e => { setCode(e.target.value); setCodeTouched(false); }}
              onKeyDown={e => e.key === "Enter" && handleCodeSubmit()}
              placeholder="입장 코드 입력"
              type={showCode ? "text" : "password"}
              autoFocus
              style={{
                width: "100%", padding: "13px 44px 13px 15px", borderRadius: 11,
                border: `1.5px solid ${codeTouched && !codeOk ? "#f87171" : "rgba(255,255,255,0.15)"}`,
                background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 15,
                outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
                letterSpacing: showCode ? "normal" : "0.2em"
              }}
            />
            <button
              onClick={() => setShowCode(v => !v)}
              style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                color: "rgba(255,255,255,0.4)", fontSize: 16, padding: 4
              }}
            >{showCode ? "🙈" : "👁️"}</button>
          </div>

          {codeTouched && !codeOk && (
            <p style={{ color: "#f87171", fontSize: 11, textAlign: "left", margin: "0 0 16px", fontWeight: 600 }}>
              ⚠ 입장 코드가 올바르지 않아요
            </p>
          )}

          <button onClick={handleCodeSubmit} style={{
            width: "100%", padding: "14px", borderRadius: 12, border: "none",
            background: code.length > 0 ? "linear-gradient(135deg, #4f8ef7, #7c5cbf)" : "rgba(255,255,255,0.08)",
            color: code.length > 0 ? "#fff" : "rgba(255,255,255,0.25)",
            fontSize: 15, fontWeight: 700, cursor: code.length > 0 ? "pointer" : "default",
            transition: "all 0.2s"
          }}>
            확인 →
          </button>
        </div>
      </div>
    );
  }

  /* ── Step 2: 이름 + 파트 ── */
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: bg, fontFamily: "system-ui, sans-serif", padding: "20px", boxSizing: "border-box" }}>
      <div style={cardStyle}>
        {/* 뒤로가기 */}
        <button onClick={() => { setStep(1); setCode(""); setCodeTouched(false); }} style={{
          position: "absolute", display: "block", marginBottom: 0,
          background: "none", border: "none", color: "rgba(255,255,255,0.4)",
          fontSize: 13, cursor: "pointer", marginTop: -8, textAlign: "left", width: "100%",
          padding: 0
        }}>← 코드 재입력</button>

        <div style={{ fontSize: 48, marginBottom: 10 }}>☕</div>
        <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: "0 0 6px" }}>팀 음료 주문</h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 28 }}>이름과 파트를 선택하고 시작하세요</p>

        {/* 진행 표시 */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", marginBottom: 24 }}>
          <div style={{ width: 24, height: 4, borderRadius: 2, background: "#4f8ef7" }} />
          <div style={{ width: 24, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)" }} />
        </div>

        {/* 이름 */}
        <div style={{ textAlign: "left", marginBottom: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            이름 <span style={{ color: "#f87171" }}>*</span>
          </label>
        </div>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          placeholder="이름 입력"
          autoFocus
          style={{
            width: "100%", padding: "13px 15px", borderRadius: 11,
            border: `1.5px solid ${touched && !nameOk ? "#f87171" : "rgba(255,255,255,0.15)"}`,
            background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 15,
            outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
            marginBottom: touched && !nameOk ? 6 : 22
          }}
        />
        {touched && !nameOk && (
          <p style={{ color: "#f87171", fontSize: 11, textAlign: "left", margin: "0 0 14px", fontWeight: 600 }}>
            ⚠ 이름을 입력해주세요
          </p>
        )}

        {/* 파트 선택 */}
        <div style={{ textAlign: "left", marginBottom: 8 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            파트 <span style={{ color: "#f87171" }}>*</span>
          </label>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: touched && !partOk ? 6 : 26 }}>
          {PARTS.map(p => {
            const isSelected = part === p.id;
            const hasError = touched && !partOk;
            return (
              <button key={p.id} onClick={() => setPart(p.id)} style={{
                padding: "14px 10px", borderRadius: 12, cursor: "pointer",
                border: isSelected ? `2px solid ${p.color}` : hasError ? "2px solid rgba(248,113,113,0.45)" : "2px solid rgba(255,255,255,0.14)",
                background: isSelected ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                transition: "all 0.15s"
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: isSelected ? p.color : "rgba(255,255,255,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, transition: "background 0.15s"
                }}>
                  {p.id === "channel" ? "📡" : p.id === "pay" ? "💳" : "💼"}
                </div>
                <span style={{ fontSize: 13, fontWeight: isSelected ? 700 : 500, color: isSelected ? "#fff" : "rgba(255,255,255,0.5)", transition: "all 0.15s" }}>
                  {p.name}
                </span>
                {isSelected && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: p.color, background: `${p.color}22`, padding: "2px 8px", borderRadius: 10 }}>
                    선택됨 ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {touched && !partOk && (
          <p style={{ color: "#f87171", fontSize: 11, textAlign: "left", margin: "0 0 18px", fontWeight: 600 }}>
            ⚠ 파트를 선택해주세요
          </p>
        )}

        {/* 입장 버튼 */}
        <button onClick={handleSubmit} style={{
          width: "100%", padding: "14px", borderRadius: 12, border: "none",
          background: canEnter ? "linear-gradient(135deg, #4f8ef7, #7c5cbf)" : "rgba(255,255,255,0.08)",
          color: canEnter ? "#fff" : "rgba(255,255,255,0.25)",
          fontSize: 15, fontWeight: 700, cursor: canEnter ? "pointer" : "default",
          transition: "all 0.2s", letterSpacing: "0.01em"
        }}>
          {canEnter && selectedPart ? `[${selectedPart.name}] ${name.trim()} 입장하기 →` : "입장하기 →"}
        </button>
      </div>
    </div>
  );
}

// ─── 세션 생성 모달 ────────────────────────────────────────────
function CreateModal({ userName, userPart, onClose, onCreate }) {
  const [selected, setSelected] = useState(null);
  const [customName, setCustomName] = useState("");
  const canCreate = selected && (selected !== "custom" || customName.trim());

  function handleCreate() {
    if (!canCreate) return;
    const store = STORES.find(s => s.id === selected);
    onCreate({
      id: Date.now().toString(),
      storeId: selected,
      storeName: selected === "custom" ? customName.trim() : store.name,
      storeEmoji: store.emoji,
      storeColor: store.color,
      storeBg: store.bg,
      creator: userName,
      creatorPart: userPart,
      status: "open",
      createdAt: new Date().toISOString(),
      orders: [],
    });
    onClose();
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 20, padding: 32, width: 380, maxWidth: "90vw",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)"
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700 }}>새 주문 세션</h2>
        <p style={{ margin: "0 0 24px", color: "#888", fontSize: 14 }}>주문할 매장을 선택하세요</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {STORES.map(store => (
            <button key={store.id} onClick={() => setSelected(store.id)} style={{
              padding: "14px 16px", borderRadius: 12,
              border: `2px solid ${selected === store.id ? store.color : "#e5e7eb"}`,
              background: selected === store.id ? store.bg : "#fff",
              display: "flex", alignItems: "center", gap: 12,
              cursor: "pointer", transition: "all 0.15s", textAlign: "left"
            }}>
              <span style={{ fontSize: 22 }}>{store.emoji}</span>
              <span style={{ fontWeight: 600, fontSize: 15, color: selected === store.id ? store.color : "#374151" }}>
                {store.name}
              </span>
              {selected === store.id && <span style={{ marginLeft: "auto", color: store.color, fontWeight: 700 }}>✓</span>}
            </button>
          ))}
        </div>
        {selected === "custom" && (
          <input
            value={customName} onChange={e => setCustomName(e.target.value)}
            placeholder="매장명 직접 입력" autoFocus
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 10,
              border: "1.5px solid #e5e7eb", fontSize: 15, outline: "none",
              boxSizing: "border-box", marginBottom: 16
            }}
          />
        )}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "13px", borderRadius: 10, border: "1.5px solid #e5e7eb",
            background: "#fff", color: "#374151", fontSize: 15, fontWeight: 600, cursor: "pointer"
          }}>취소</button>
          <button onClick={handleCreate} style={{
            flex: 2, padding: "13px", borderRadius: 10, border: "none",
            background: canCreate ? "linear-gradient(135deg, #4f8ef7, #7c5cbf)" : "#e5e7eb",
            color: canCreate ? "#fff" : "#9ca3af", fontSize: 15, fontWeight: 600,
            cursor: canCreate ? "pointer" : "default", transition: "all 0.2s"
          }}>세션 생성</button>
        </div>
      </div>
    </div>
  );
}

// ─── 메뉴 피커 (이미지 그리드 + 직접입력) ────────────────────
function MenuPicker({ session, onSelect, selectedId, onDirectInput, directInputValue }) {
  const menus = getMenus(session.storeId);
  const categories = ["전체", ...new Set(menus.map(m => m.category)), "직접입력"];
  const [activeCategory, setActiveCategory] = useState("전체");
  const [search, setSearch] = useState("");

  const isDirect = activeCategory === "직접입력";

  const filtered = menus.filter(m =>
    (activeCategory === "전체" || m.category === activeCategory) &&
    m.name.includes(search)
  );

  return (
    <div>
      {/* 카테고리 탭 */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, overflowX: "auto", paddingBottom: 2 }}>
        {categories.map(cat => {
          const isDirCat = cat === "직접입력";
          const isActive = activeCategory === cat;
          return (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{
              padding: "4px 11px", borderRadius: 20, border: isDirCat ? `1.5px dashed ${isActive ? session.storeColor : "#d1d5db"}` : "none",
              whiteSpace: "nowrap", flexShrink: 0,
              background: isActive ? (isDirCat ? session.storeBg : session.storeColor) : "#f3f4f6",
              color: isActive ? (isDirCat ? session.storeColor : "#fff") : "#6b7280",
              fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s"
            }}>{isDirCat ? "✏️ 직접입력" : cat}</button>
          );
        })}
      </div>

      {isDirect ? (
        /* 직접 입력 영역 */
        <div style={{
          padding: "16px", borderRadius: 12, border: `1.5px dashed ${session.storeColor}66`,
          background: session.storeBg, marginBottom: 4
        }}>
          <p style={{ margin: "0 0 10px", fontSize: 12, color: "#6b7280" }}>
            메뉴판에 없는 음료를 직접 입력하세요
          </p>
          <input
            value={directInputValue}
            onChange={e => onDirectInput(e.target.value)}
            placeholder="예) 시즌 한정 메뉴, 커스텀 음료 등"
            autoFocus
            style={{
              width: "100%", padding: "11px 13px", borderRadius: 10,
              border: `1.5px solid ${session.storeColor}55`,
              fontSize: 14, outline: "none", boxSizing: "border-box",
              background: "#fff"
            }}
          />
        </div>
      ) : (
        /* 메뉴 그리드 */
        <>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="메뉴 검색..."
            style={{
              width: "100%", padding: "9px 12px", borderRadius: 10,
              border: "1.5px solid #e5e7eb", fontSize: 13, outline: "none",
              boxSizing: "border-box", marginBottom: 10
            }}
          />
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8,
            maxHeight: 240, overflowY: "auto", paddingRight: 2
          }}>
            {filtered.map(menu => (
              <button key={menu.id} onClick={() => { onSelect(menu); onDirectInput(""); }} style={{
                padding: "8px 6px", borderRadius: 12,
                border: `2px solid ${selectedId === menu.id ? session.storeColor : "#f0f0f0"}`,
                background: selectedId === menu.id ? session.storeBg : "#fff",
                cursor: "pointer", transition: "all 0.15s",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 5
              }}>
                <MenuImage src={menu.img} name={menu.name} color={session.storeColor} size={58} />
                <span style={{
                  fontSize: 10.5, fontWeight: selectedId === menu.id ? 700 : 500, lineHeight: 1.3,
                  color: selectedId === menu.id ? session.storeColor : "#374151",
                  wordBreak: "keep-all", textAlign: "center",
                  width: "100%", overflow: "hidden",
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical"
                }}>{menu.name}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div style={{ gridColumn: "1/-1", padding: "24px 0", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                메뉴를 찾을 수 없어요
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── 주문 추가 / 수정 모달 ────────────────────────────────────
function OrderModal({ session, userName, userPart, onClose, onAddOrder, onEditOrder, initialOrder }) {
  const isEdit = !!initialOrder;
  const isCustom = session.storeId === "custom";
  const isStarbucks = session.storeId === "starbucks";
  const isCoffeebean = session.storeId === "coffeebean";
  const sizeOptions = isStarbucks ? SIZE_OPTIONS_STARBUCKS : isCoffeebean ? SIZE_OPTIONS_COFFEEBEAN : SIZE_OPTIONS_DEFAULT;

  // 편집 모드면 기존값으로 초기화
  const [selectedMenu, setSelectedMenu] = useState(() => {
    if (!isEdit) return null;
    const menus = getMenus(session.storeId);
    return menus.find(m => m.name === initialOrder.menu) || null;
  });
  const [directInput, setDirectInput] = useState(() =>
    isEdit && !isCustom && !getMenus(session.storeId).find(m => m.name === initialOrder.menu) ? initialOrder.menu : ""
  );
  const [customMenuInput, setCustomMenuInput] = useState(() =>
    isEdit && isCustom ? initialOrder.menu : ""
  );
  const [size, setSize] = useState(() => isEdit ? initialOrder.size : isStarbucks ? "톨(T)" : isCoffeebean ? "스몰(S)" : "미디움(M)");
  const [temp, setTemp] = useState(() => isEdit ? initialOrder.temp : "ICE");
  const [memo, setMemo] = useState(() => isEdit ? initialOrder.memo : "");

  // 최종 메뉴명: 기타매장 → 수기입력 / 그 외 → 직접입력 or 선택메뉴
  const menuName = isCustom
    ? customMenuInput
    : (directInput.trim() || selectedMenu?.name || "");
  const canSubmit = menuName.trim().length > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    if (isEdit) {
      onEditOrder(session.id, initialOrder.id, { menu: menuName.trim(), size, temp, memo: memo.trim() });
    } else {
      onAddOrder(session.id, { id: Date.now().toString(), name: userName, part: userPart, menu: menuName.trim(), size, temp, memo: memo.trim() });
    }
    onClose();
  }

  // 메뉴 그리드에서 선택 시 직접입력 초기화
  function handleSelectMenu(menu) {
    setSelectedMenu(menu);
    setDirectInput("");
  }

  // 직접입력 시 선택 메뉴 초기화
  function handleDirectInput(val) {
    setDirectInput(val);
    if (val) setSelectedMenu(null);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 20, padding: 24,
        width: isCustom ? 380 : 480, maxWidth: "93vw", maxHeight: "90vh",
        display: "flex", flexDirection: "column",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)", overflowY: "auto"
      }} onClick={e => e.stopPropagation()}>

        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <span style={{ fontSize: 24 }}>{session.storeEmoji}</span>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{session.storeName}</h2>
            <p style={{ margin: 0, fontSize: 13, color: "#888" }}>{isEdit ? "내 주문 변경하기" : "내 음료 선택하기"}</p>
          </div>
        </div>

        {/* 메뉴 선택 */}
        {isCustom ? (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>
              메뉴명 입력
            </label>
            <input
              value={customMenuInput} onChange={e => setCustomMenuInput(e.target.value)}
              placeholder="예) 아메리카노, 딸기라떼 등" autoFocus
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 10,
                border: `1.5px solid ${session.storeColor}55`,
                fontSize: 15, outline: "none", boxSizing: "border-box"
              }}
            />
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "#9ca3af" }}>
              기타 매장은 메뉴를 직접 입력해주세요
            </p>
          </div>
        ) : (
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>
              메뉴 선택
              {menuName && (
                <span style={{ marginLeft: 8, color: session.storeColor, fontWeight: 600 }}>· {menuName}</span>
              )}
            </label>
            <MenuPicker
              session={session}
              onSelect={handleSelectMenu}
              selectedId={selectedMenu?.id}
              onDirectInput={handleDirectInput}
              directInputValue={directInput}
            />
          </div>
        )}

        {/* 선택된 메뉴 프리뷰 (그리드 선택 시만) */}
        {!isCustom && selectedMenu && !directInput && (
          <div style={{
            display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
            background: session.storeBg, borderRadius: 12, marginBottom: 14
          }}>
            <MenuImage src={selectedMenu.img} name={selectedMenu.name} color={session.storeColor} size={44} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{selectedMenu.name}</div>
              <div style={{ fontSize: 12, color: session.storeColor, fontWeight: 600 }}>{selectedMenu.category}</div>
            </div>
            <button onClick={() => setSelectedMenu(null)} style={{
              marginLeft: "auto", padding: "4px 8px", borderRadius: 6, border: "none",
              background: "rgba(0,0,0,0.06)", color: "#6b7280", fontSize: 12, cursor: "pointer"
            }}>변경</button>
          </div>
        )}

        {/* 직접입력 프리뷰 */}
        {!isCustom && directInput.trim() && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "11px 14px",
            background: session.storeBg, borderRadius: 12, marginBottom: 14
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, background: `${session.storeColor}22`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0
            }}>✏️</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{directInput.trim()}</div>
              <div style={{ fontSize: 12, color: session.storeColor, fontWeight: 600 }}>직접 입력</div>
            </div>
          </div>
        )}

        {/* 온도 / 사이즈 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>온도</label>
            <div style={{ display: "flex", gap: 6 }}>
              {TEMP_OPTIONS.map(t => (
                <button key={t} onClick={() => setTemp(t)} style={{
                  flex: 1, padding: "9px", borderRadius: 8,
                  border: `1.5px solid ${temp === t ? session.storeColor : "#e5e7eb"}`,
                  background: temp === t ? session.storeBg : "#fff",
                  color: temp === t ? session.storeColor : "#6b7280",
                  fontSize: 13, fontWeight: temp === t ? 700 : 400, cursor: "pointer"
                }}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>사이즈</label>
            <div style={{ display: "flex", gap: 6 }}>
              {sizeOptions.map(s => (
                <button key={s} onClick={() => setSize(s)} style={{
                  flex: 1, padding: "9px", borderRadius: 8,
                  border: `1.5px solid ${size === s ? session.storeColor : "#e5e7eb"}`,
                  background: size === s ? session.storeBg : "#fff",
                  color: size === s ? session.storeColor : "#6b7280",
                  fontSize: 12, fontWeight: size === s ? 700 : 400, cursor: "pointer"
                }}>{s.split("(")[0]}</button>
              ))}
            </div>
          </div>
        </div>

        {/* 메모 */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
            요청사항 (선택)
          </label>
          <input
            value={memo} onChange={e => setMemo(e.target.value)}
            placeholder="샷 추가, 시럽 빼기, 두유 변경 등"
            style={{
              width: "100%", padding: "11px 14px", borderRadius: 10,
              border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none", boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "13px", borderRadius: 10, border: "1.5px solid #e5e7eb",
            background: "#fff", color: "#374151", fontSize: 15, fontWeight: 600, cursor: "pointer"
          }}>취소</button>
          <button onClick={handleSubmit} disabled={!canSubmit} style={{
            flex: 2, padding: "13px", borderRadius: 10, border: "none",
            background: canSubmit ? `linear-gradient(135deg, ${session.storeColor}ee, ${session.storeColor}99)` : "#e5e7eb",
            color: canSubmit ? "#fff" : "#9ca3af",
            fontSize: 15, fontWeight: 600, cursor: canSubmit ? "pointer" : "default"
          }}>{ isEdit ? "주문 변경 완료" : "주문 추가"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── 세션 상세 모달 ────────────────────────────────────────────
function SessionDetailModal({ session, userName, userPart, onClose, onAddOrder, onEditOrder, onCancelOrder, onCloseSession, onReopenSession }) {
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const myOrder = session.orders.find(o => o.name === userName);

  return (
    <>
      <div style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 900
      }} onClick={onClose}>
        <div style={{
          background: "#fff", borderRadius: 20, width: 440, maxWidth: "92vw",
          maxHeight: "82vh", display: "flex", flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)", overflow: "hidden"
        }} onClick={e => e.stopPropagation()}>

          <div style={{
            padding: "22px 24px 18px", borderBottom: "1px solid #f3f4f6",
            background: session.storeBg, display: "flex", alignItems: "center", justifyContent: "space-between"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 28 }}>{session.storeEmoji}</span>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{session.storeName}</h2>
                <p style={{ margin: 0, fontSize: 13, color: "#888" }}>
                  {session.creator} 님 개설 · {session.orders.length}명 주문 · <span style={{ fontWeight: 700, color: session.storeColor }}>총 {session.orders.length}잔</span>
                </p>
              </div>
            </div>
            <span style={{
              padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
              background: session.status === "open" ? "#dcfce7" : "#f3f4f6",
              color: session.status === "open" ? "#16a34a" : "#6b7280"
            }}>{session.status === "open" ? "🟢 접수중" : "⚫ 마감"}</span>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px" }}>
            {session.orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "36px 0", color: "#9ca3af" }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
                <p style={{ margin: 0, fontSize: 14 }}>아직 주문이 없어요</p>
              </div>
            ) : (() => {
              // 메뉴명 + 온도 + 사이즈 + 메모 기준으로 그룹핑
              const groupKey = o => `${o.menu}__${o.temp}__${o.size}__${o.memo}`;
              const groups = [];
              const seen = {};
              session.orders.forEach(o => {
                const key = groupKey(o);
                if (seen[key] !== undefined) {
                  groups[seen[key]].members.push({ name: o.name, part: o.part || "" });
                } else {
                  seen[key] = groups.length;
                  groups.push({ ...o, members: [{ name: o.name, part: o.part || "" }] });
                }
              });
              return groups.map((group, i) => {
                const isMe = group.members.some(m => m.name === userName);
                return (
                  <div key={group.id} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "13px 0",
                    borderBottom: i < groups.length - 1 ? "1px solid #f3f4f6" : "none"
                  }}>
                    <MenuImage src={group.menuImg} name={group.menu} color={session.storeColor} size={46} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* 메뉴명 + 수량 뱃지 */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, minWidth: 0 }}>
                        <span style={{
                          fontWeight: 700, fontSize: 14, color: "#111",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                        }}>{group.menu}</span>
                        {group.members.length > 1 && (
                          <span style={{
                            padding: "2px 8px", borderRadius: 20, fontSize: 12, fontWeight: 800,
                            background: session.storeColor, color: "#fff", lineHeight: 1.4,
                            flexShrink: 0
                          }}>×{group.members.length}</span>
                        )}
                      </div>
                      {/* 옵션 */}
                      <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 5 }}>
                        {group.temp} · {group.size}{group.memo ? ` · "${group.memo}"` : ""}
                      </div>
                      {/* 주문자 목록 — 이름 + 파트 뱃지 */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {group.members.map(({ name, part }) => {
                          const isMyTag = name === userName;
                          const partInfo = PARTS.find(p => p.id === part);
                          return (
                            <span key={name} style={{
                              display: "inline-flex", alignItems: "center", gap: 4,
                              fontSize: 11, padding: "3px 8px", borderRadius: 10, fontWeight: 600,
                              background: isMyTag ? session.storeBg : "#f3f4f6",
                              color: isMyTag ? session.storeColor : "#6b7280",
                              border: isMyTag ? `1px solid ${session.storeColor}44` : "1px solid transparent"
                            }}>
                              {partInfo && (
                                <span style={{
                                  fontSize: 10, fontWeight: 700,
                                  color: partInfo.color,
                                  background: partInfo.bg,
                                  padding: "1px 5px", borderRadius: 6
                                }}>{partInfo.name}</span>
                              )}
                              {name}{isMyTag ? " (나)" : ""}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    {/* 내 주문이고 접수중일 때만 변경 / 취소 버튼 */}
                    {isMe && session.status === "open" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 5, flexShrink: 0 }}>
                        <button onClick={() => setEditingOrder(myOrder)} style={{
                          padding: "6px 10px", borderRadius: 8,
                          border: `1.5px solid ${session.storeColor}55`,
                          background: session.storeBg, color: session.storeColor,
                          fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap"
                        }}>변경</button>
                        <button onClick={() => onCancelOrder(session.id, myOrder.id)} style={{
                          padding: "6px 10px", borderRadius: 8,
                          border: "1.5px solid #fee2e2",
                          background: "#fff", color: "#ef4444",
                          fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap"
                        }}>취소</button>
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>

          <div style={{ padding: "14px 20px", borderTop: "1px solid #f3f4f6", display: "flex", gap: 10 }}>
            {session.status === "open" && !myOrder && (
              <button onClick={() => setShowOrderModal(true)} style={{
                flex: 2, padding: "13px", borderRadius: 10, border: "none",
                background: `linear-gradient(135deg, ${session.storeColor}ee, ${session.storeColor}99)`,
                color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer"
              }}>내 주문 추가</button>
            )}
            {session.status === "open" && myOrder && (
              <div style={{
                flex: 2, padding: "13px", borderRadius: 10, background: "#f9fafb",
                color: "#6b7280", fontSize: 14, fontWeight: 600, textAlign: "center"
              }}>✓ {myOrder.menu} — 목록에서 변경 가능</div>
            )}
            {session.status === "open" && session.creator === userName && (
              <button onClick={() => onCloseSession(session.id)} style={{
                flex: 1, padding: "13px", borderRadius: 10, border: "1.5px solid #fee2e2",
                background: "#fff", color: "#ef4444", fontSize: 14, fontWeight: 600, cursor: "pointer"
              }}>마감</button>
            )}
            {session.status === "closed" && session.creator === userName && (
              <button onClick={() => onReopenSession(session.id)} style={{
                flex: 1, padding: "13px", borderRadius: 10, border: "1.5px solid #bfdbfe",
                background: "#fff", color: "#3b82f6", fontSize: 14, fontWeight: 600, cursor: "pointer"
              }}>🔄 주문 재오픈</button>
            )}
            {session.status === "closed" && session.creator !== userName && (
              <div style={{
                flex: 1, padding: "13px", borderRadius: 10, background: "#f3f4f6",
                color: "#9ca3af", fontSize: 14, fontWeight: 600, textAlign: "center"
              }}>마감된 세션입니다</div>
            )}
          </div>
        </div>
      </div>
      {showOrderModal && (
        <OrderModal session={session} userName={userName} userPart={userPart} onClose={() => setShowOrderModal(false)} onAddOrder={onAddOrder} onEditOrder={onEditOrder} />
      )}
      {editingOrder && (
        <OrderModal session={session} userName={userName} userPart={userPart} onClose={() => setEditingOrder(null)} onAddOrder={onAddOrder} onEditOrder={onEditOrder} initialOrder={editingOrder} />
      )}
    </>
  );
}

// ─── 세션 카드 ─────────────────────────────────────────────────
function SessionCard({ session, onClick }) {
  const timeAgo = () => {
    const diff = Math.floor((Date.now() - new Date(session.createdAt)) / 60000);
    if (diff < 1) return "방금 전";
    if (diff < 60) return `${diff}분 전`;
    return `${Math.floor(diff / 60)}시간 전`;
  };
  return (
    <div onClick={onClick} style={{
      background: "#fff", borderRadius: 16, border: "1.5px solid #f0f0f0",
      padding: "20px", cursor: "pointer", transition: "all 0.2s",
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 10px 28px rgba(0,0,0,0.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 13, background: session.storeBg,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22
        }}>{session.storeEmoji}</div>
        <span style={{
          padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
          background: session.status === "open" ? "#dcfce7" : "#f3f4f6",
          color: session.status === "open" ? "#16a34a" : "#6b7280"
        }}>{session.status === "open" ? "🟢 접수중" : "⚫ 마감"}</span>
      </div>
      <h3 style={{ margin: "0 0 3px", fontSize: 16, fontWeight: 700, color: "#111" }}>{session.storeName}</h3>
      <p style={{ margin: "0 0 12px", fontSize: 12, color: "#aaa" }}>{session.creator} 님 · {timeAgo()}</p>

      {session.orders.length > 0 && (
        <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
          {session.orders.slice(0, 5).map(order => (
            <div key={order.id} title={`${order.name}: ${order.menu}`}>
              <MenuImage src={order.menuImg} name={order.menu} color={session.storeColor} size={30} />
            </div>
          ))}
          {session.orders.length > 5 && (
            <div style={{
              width: 30, height: 30, borderRadius: 8, background: "#f3f4f6",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, color: "#6b7280", fontWeight: 700
            }}>+{session.orders.length - 5}</div>
          )}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, color: "#6b7280" }}>👤 {session.orders.length}명</span>
          <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#d1d5db", display: "inline-block" }} />
          <span style={{ fontSize: 13, color: session.storeColor, fontWeight: 700 }}>☕ 총 {session.orders.length}잔</span>
        </div>
        <span style={{ fontSize: 13, color: session.storeColor, fontWeight: 600 }}>자세히 →</span>
      </div>
    </div>
  );
}

// ─── 메인 앱 ───────────────────────────────────────────────────
export default function App() {
  const [userName, setUserName] = useState(() => {
    try { return localStorage.getItem("teamorder_user") || ""; } catch { return ""; }
  });
  const [userPart, setUserPart] = useState(() => {
    try { return localStorage.getItem("teamorder_part") || ""; } catch { return ""; }
  });
  const [sessions, setSessions] = useState(() => {
    try { return JSON.parse(localStorage.getItem("teamorder_sessions") || "[]"); } catch { return []; }
  });
  const [showCreate, setShowCreate] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  useEffect(() => {
    try { localStorage.setItem("teamorder_sessions", JSON.stringify(sessions)); } catch {}
  }, [sessions]);

  function handleLogin({ name, part }) {
    try {
      localStorage.setItem("teamorder_user", name);
      localStorage.setItem("teamorder_part", part);
    } catch {}
    setUserName(name);
    setUserPart(part);
  }
  function handleCreate(session) { setSessions(prev => [session, ...prev]); }
  function handleAddOrder(sessionId, order) {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, orders: [...s.orders, order] } : s));
  }  function handleEditOrder(sessionId, orderId, updatedOrder) {
    setSessions(prev => prev.map(s =>
      s.id === sessionId
        ? { ...s, orders: s.orders.map(o => o.id === orderId ? { ...o, ...updatedOrder } : o) }
        : s
    ));
  }
  function handleCancelOrder(sessionId, orderId) {
    setSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, orders: s.orders.filter(o => o.id !== orderId) } : s
    ));
  }
  function handleCloseSession(sessionId) {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: "closed" } : s));
  }
  function handleReopenSession(sessionId) {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: "open" } : s));
  }

  if (!userName || !userPart) return <LoginScreen onLogin={handleLogin} />;

  const openSessions = sessions.filter(s => s.status === "open" && s.creatorPart === userPart);
  const closedSessions = sessions.filter(s => s.status === "closed" && s.creatorPart === userPart);
  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fc", fontFamily: "system-ui, sans-serif" }}>
      <div style={{
        background: "#fff", borderBottom: "1px solid #f0f0f0", padding: "0 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 60, position: "sticky", top: 0, zIndex: 50
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>☕</span>
          <span style={{ fontWeight: 800, fontSize: 18, color: "#111" }}>팀 음료 주문</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {(() => {
            const p = PARTS.find(p => p.id === userPart);
            return p ? (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 10,
                background: p.bg, color: p.color, border: `1px solid ${p.color}33`
              }}>{p.name}</span>
            ) : null;
          })()}
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #4f8ef7, #7c5cbf)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: "#fff"
          }}>{userName[0]}</div>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>{userName}</span>
          <button onClick={() => {
            setUserName(""); setUserPart("");
            try { localStorage.removeItem("teamorder_user"); localStorage.removeItem("teamorder_part"); } catch {}
          }} style={{
            padding: "4px 10px", borderRadius: 8, border: "1.5px solid #e5e7eb",
            background: "#fff", color: "#9ca3af", fontSize: 12, cursor: "pointer"
          }}>로그아웃</button>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 20px 100px" }}>
        {sessions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#9ca3af" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>☕</div>
            <p style={{ fontSize: 18, fontWeight: 600, color: "#6b7280", margin: "0 0 6px" }}>주문 세션이 없어요</p>
            <p style={{ fontSize: 14, margin: 0 }}>우측 하단 + 버튼으로 새 세션을 만들어보세요</p>
          </div>
        ) : (
          <>
            {openSessions.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block" }}></span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#374151" }}>접수중 {openSessions.length}개</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                  {openSessions.map(s => <SessionCard key={s.id} session={s} onClick={() => setSelectedSessionId(s.id)} />)}
                </div>
              </div>
            )}
            {closedSessions.length > 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#9ca3af", display: "inline-block" }}></span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#9ca3af" }}>마감된 세션 {closedSessions.length}개</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14, opacity: 0.55 }}>
                  {closedSessions.map(s => <SessionCard key={s.id} session={s} onClick={() => setSelectedSessionId(s.id)} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <button onClick={() => setShowCreate(true)} style={{
        position: "fixed", bottom: 28, right: 28,
        width: 56, height: 56, borderRadius: "50%", border: "none",
        background: "linear-gradient(135deg, #4f8ef7, #7c5cbf)",
        color: "#fff", fontSize: 28, cursor: "pointer",
        boxShadow: "0 4px 20px rgba(79,142,247,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "transform 0.2s"
      }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
      >+</button>

      {showCreate && <CreateModal userName={userName} userPart={userPart} onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
      {selectedSession && (
        <SessionDetailModal
          session={selectedSession} userName={userName}
          userPart={userPart}
          onClose={() => setSelectedSessionId(null)}
          onAddOrder={handleAddOrder}
          onEditOrder={handleEditOrder}
          onCancelOrder={handleCancelOrder}
          onCloseSession={handleCloseSession}
          onReopenSession={handleReopenSession}
        />
      )}
    </div>
  );
}
