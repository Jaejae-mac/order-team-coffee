-- ============================================================
-- 팀 커피 주문 앱 — Supabase DB 스키마
-- Supabase SQL Editor에 이 파일 전체를 붙여넣고 실행하세요.
-- ============================================================


-- ── 세션 테이블 ──────────────────────────────────────────────
-- 주문을 모으는 단위. 한 세션 = 한 번의 커피 주문 수집
CREATE TABLE IF NOT EXISTS sessions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id     TEXT        NOT NULL CHECK (store_id IN ('starbucks', 'mega', 'coffeebean', 'custom')),
  store_name   TEXT        NOT NULL,
  store_emoji  TEXT        NOT NULL,
  store_color  TEXT        NOT NULL,
  store_bg     TEXT        NOT NULL,
  creator      TEXT        NOT NULL,       -- 세션을 만든 사람의 이름
  creator_part TEXT        NOT NULL CHECK (creator_part IN ('channel', 'business', 'pay')),
  status       TEXT        NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 주문 테이블 ──────────────────────────────────────────────
-- 각 세션에 속하는 개별 주문. 세션 삭제 시 주문도 함께 삭제됨
CREATE TABLE IF NOT EXISTS orders (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,         -- 주문자 이름
  part       TEXT        NOT NULL CHECK (part IN ('channel', 'business', 'pay')),
  menu       TEXT        NOT NULL,
  size       TEXT        NOT NULL,
  temp       TEXT        NOT NULL CHECK (temp IN ('HOT', 'ICE')),
  memo       TEXT        NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 인덱스 ────────────────────────────────────────────────────
-- 자주 쓰는 필터 조건에 인덱스를 추가해 조회 속도 향상
CREATE INDEX IF NOT EXISTS idx_sessions_creator_part ON sessions(creator_part);
CREATE INDEX IF NOT EXISTS idx_sessions_status       ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_orders_session_id     ON orders(session_id);
CREATE INDEX IF NOT EXISTS idx_orders_name           ON orders(name);


-- ── RLS(행 수준 보안) 활성화 ─────────────────────────────────
-- 클라이언트(anon 키)는 읽기만 허용, 쓰기는 서버 전용 service_role 키만 허용
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders   ENABLE ROW LEVEL SECURITY;

-- 기존 정책이 있으면 먼저 삭제 (재실행 시 충돌 방지)
DROP POLICY IF EXISTS "anon_read_sessions"   ON sessions;
DROP POLICY IF EXISTS "service_all_sessions" ON sessions;
DROP POLICY IF EXISTS "anon_read_orders"     ON orders;
DROP POLICY IF EXISTS "service_all_orders"   ON orders;

-- 익명 사용자 읽기 정책 (Realtime 구독에 필요)
CREATE POLICY "anon_read_sessions" ON sessions
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_read_orders" ON orders
  FOR SELECT TO anon USING (true);

-- 서비스 롤 전체 권한 정책 (Server Actions에서 사용)
CREATE POLICY "service_all_sessions" ON sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_all_orders" ON orders
  FOR ALL TO service_role USING (true) WITH CHECK (true);
