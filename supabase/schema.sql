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


-- ============================================================
-- 투표 기능 스키마
-- ============================================================

-- ── 투표 테이블 ──────────────────────────────────────────────
-- 투표를 모으는 단위. 한 투표 = 하나의 설문/의사결정
CREATE TABLE IF NOT EXISTS polls (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT        NOT NULL,
  description    TEXT        NOT NULL DEFAULT '',
  creator        TEXT        NOT NULL,       -- 투표를 만든 사람의 이름
  creator_part   TEXT        NOT NULL CHECK (creator_part IN ('channel', 'business', 'pay')),
  status         TEXT        NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  closes_at      TIMESTAMPTZ NOT NULL,       -- 마감 기한 (이 시각 이후 lazy close 처리)
  allow_multiple BOOLEAN     NOT NULL DEFAULT FALSE, -- 복수선택 허용 여부
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 투표 선택지 테이블 ───────────────────────────────────────
-- 각 투표에 속하는 선택지. 투표 삭제 시 함께 삭제됨
CREATE TABLE IF NOT EXISTS poll_options (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id    UUID        NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  label      TEXT        NOT NULL,
  position   INT         NOT NULL DEFAULT 0,  -- 표시 순서
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 투표 기록 테이블 ─────────────────────────────────────────
-- 누가 어떤 선택지에 투표했는지 기록. 투표 삭제 시 함께 삭제됨
CREATE TABLE IF NOT EXISTS poll_votes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id    UUID        NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id  UUID        NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  voter_name TEXT        NOT NULL,
  voter_part TEXT        NOT NULL CHECK (voter_part IN ('channel', 'business', 'pay')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- 단일선택: 서버에서 1인 1표 enforce / 복수선택: 같은 선택지에 중복 투표만 방지
  UNIQUE (poll_id, voter_name, option_id)
);

-- ── 인덱스 ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_polls_creator_part ON polls(creator_part);
CREATE INDEX IF NOT EXISTS idx_polls_status       ON polls(status);
CREATE INDEX IF NOT EXISTS idx_polls_closes_at    ON polls(closes_at);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll  ON poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll    ON poll_votes(poll_id);

-- ── RLS(행 수준 보안) 활성화 ─────────────────────────────────
ALTER TABLE polls        ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes   ENABLE ROW LEVEL SECURITY;

-- 기존 정책이 있으면 먼저 삭제 (재실행 시 충돌 방지)
DROP POLICY IF EXISTS "anon_read_polls"          ON polls;
DROP POLICY IF EXISTS "service_all_polls"        ON polls;
DROP POLICY IF EXISTS "anon_read_poll_options"   ON poll_options;
DROP POLICY IF EXISTS "service_all_poll_options" ON poll_options;
DROP POLICY IF EXISTS "anon_read_poll_votes"     ON poll_votes;
DROP POLICY IF EXISTS "service_all_poll_votes"   ON poll_votes;

-- 익명 사용자 읽기 정책 (Realtime 구독에 필요)
CREATE POLICY "anon_read_polls"        ON polls        FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_poll_options" ON poll_options FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_poll_votes"   ON poll_votes   FOR SELECT TO anon USING (true);

-- 서비스 롤 전체 권한 정책 (Server Actions에서 사용)
CREATE POLICY "service_all_polls"        ON polls        FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_poll_options" ON poll_options FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_poll_votes"   ON poll_votes   FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ============================================================
-- 복수선택 기능 마이그레이션 (이미 테이블이 존재하는 경우 실행)
-- Supabase SQL Editor에서 아래 구문만 따로 실행하세요.
-- ============================================================
-- ALTER TABLE polls ADD COLUMN IF NOT EXISTS allow_multiple BOOLEAN NOT NULL DEFAULT FALSE;
-- ALTER TABLE poll_votes DROP CONSTRAINT IF EXISTS poll_votes_poll_id_voter_name_key;
-- ALTER TABLE poll_votes ADD CONSTRAINT poll_votes_unique_per_option UNIQUE (poll_id, voter_name, option_id);
