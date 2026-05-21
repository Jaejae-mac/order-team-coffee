# 메가커피 실시간 메뉴판 갱신 기능 TODO

메가커피 세션 주문 모달 상단에 "메뉴판 갱신" 버튼을 추가하여,
Shuttle Delivery에서 실시간 메뉴를 파싱해 MenuPicker에 반영한다.

---

## Step 0 — 의존성 설치

- [ ] `npm install cheerio` 실행

---

## Step 1 — 스크래퍼 모듈 생성

- [ ] `lib/mega-coffee/scraper.ts` 생성
  - Shuttle Delivery HTML 파싱 (Cheerio)
  - NAME_MAP 47개 항목 (이미지 파일명 → 메뉴명 매핑)
  - 4개 카테고리: 커피, 티, 스무디&프라페, 에이드&주스
  - 가격 정규식: `/₩[\d,]+/`
  - 반환 타입: `ScrapedMenuItem[]`

- [ ] `lib/mega-coffee/cache.ts` 생성
  - `globalThis.__megaCoffeeCache` 글로벌 메모리 캐시
  - TTL: 1시간
  - `getCachedMenu(forceRefresh?: boolean)` 함수 export

---

## Step 2 — API Route 생성

- [ ] `app/api/mega-menu/route.ts` 생성
  - `GET /api/mega-menu` — 전체 메뉴 조회
  - `GET /api/mega-menu?refresh=true` — 캐시 무시하고 강제 갱신
  - `GET /api/mega-menu?category=커피` — 카테고리 필터
  - `export const runtime = "nodejs"` 명시
  - `export const dynamic = "force-dynamic"` 명시
  - 에러 핸들링 (500 응답)

---

## Step 3 — React 훅 생성

- [ ] `hooks/useMegaMenu.ts` 생성
  - `autoFetch: false` 기본값 (버튼 클릭 시에만 실행)
  - API 응답 `{id, name, nameEn, category, imageUrl, price}` → 기존 `MenuItem {id, name, category}` 매핑
  - 반환: `{ menus: MenuItem[], isLoading, error, refetch }`

---

## Step 4 — MenuPicker 수정

- [ ] `components/orders/MenuPicker.tsx` 수정
  - `megaMenuOverride?: MenuItem[]` prop 추가
  - `import type { Session, MenuItem }` 으로 변경
  - 메뉴 소스: `megaMenuOverride` 제공 시 정적 메뉴 대신 사용

---

## Step 5 — OrderModal 수정

- [ ] `components/orders/OrderModal.tsx` 수정
  - `useMegaMenu({ autoFetch: false })` 훅 연결
  - `RefreshCw` 아이콘 import (lucide-react)
  - 메가커피 세션일 때만 갱신 버튼 표시 (팝업 상단, amber 스타일)
  - 로딩 중: 버튼 비활성화 + 스피너 애니메이션
  - 갱신 완료: `실시간 메뉴 N개 로드됨` 메시지
  - 에러 발생 시 빨간 텍스트 표시
  - MenuPicker에 `megaMenuOverride` prop 전달

---

## Step 6 — next.config.ts 수정

- [ ] `next.config.ts` 수정
  - `images.remotePatterns`에 CloudFront 도메인 추가
  - hostname: `d3af5evjz6cdzs.cloudfront.net`

---

## 검증 체크리스트

- [ ] API 호출 확인: `curl http://localhost:3000/api/mega-menu | jq '.menus | length'`
- [ ] 메가커피 세션 → 주문 모달 → 갱신 버튼 표시 확인
- [ ] 갱신 버튼 클릭 → 로딩 → 메뉴 47개 교체 확인
- [ ] 스타벅스/커피빈 세션에서 갱신 버튼 미표시 확인
- [ ] 갱신 미실행 시 기존 정적 MEGA_MENUS(38개) 유지 확인
