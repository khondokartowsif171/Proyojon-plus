-- ══════════════════════════════════════════════════════════════
-- Proyojon Plus — Complete DB Migration (সব SQL এক সাথে)
-- Supabase SQL Editor এ RUN করুন
-- ══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- SESSION 1 — Dealer + Gallery + Notice (আগের session থেকে)
-- ─────────────────────────────────────────────────────────────

-- 1. Dealer column
ALTER TABLE mlm_users ADD COLUMN IF NOT EXISTS is_dealer BOOLEAN DEFAULT FALSE;

-- 2. Image Gallery
CREATE TABLE IF NOT EXISTS proyojon_gallery (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url  TEXT        NOT NULL,
  caption    TEXT,
  sort_order INTEGER     DEFAULT 0,
  is_visible BOOLEAN     DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Notice Board
CREATE TABLE IF NOT EXISTS proyojon_notices (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT        NOT NULL,
  content    TEXT,
  is_active  BOOLEAN     DEFAULT TRUE,
  priority   INTEGER     DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RLS for gallery & notices
ALTER TABLE proyojon_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyojon_notices ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public read gallery' AND tablename = 'proyojon_gallery') THEN
    CREATE POLICY "public read gallery" ON proyojon_gallery FOR SELECT USING (is_visible = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated full gallery' AND tablename = 'proyojon_gallery') THEN
    CREATE POLICY "authenticated full gallery" ON proyojon_gallery FOR ALL USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public read notices' AND tablename = 'proyojon_notices') THEN
    CREATE POLICY "public read notices" ON proyojon_notices FOR SELECT USING (is_active = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated full notices' AND tablename = 'proyojon_notices') THEN
    CREATE POLICY "authenticated full notices" ON proyojon_notices FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- SESSION 2 — আজকের নতুন (পাসওয়ার্ড, PV log, টিম লেভেল)
-- ─────────────────────────────────────────────────────────────

-- 5. PV Log table (রেফারদের কেনাকাটা feed এর জন্য)
CREATE TABLE IF NOT EXISTS mlm_pv_log (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES mlm_users(id) ON DELETE CASCADE,
  amount     INTEGER     NOT NULL DEFAULT 0,
  source     TEXT        DEFAULT 'product_purchase',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS mlm_pv_log_user_id_idx ON mlm_pv_log(user_id);
CREATE INDEX IF NOT EXISTS mlm_pv_log_created_at_idx ON mlm_pv_log(created_at DESC);

-- 6. RLS for pv_log
ALTER TABLE mlm_pv_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated pv_log' AND tablename = 'mlm_pv_log') THEN
    CREATE POLICY "authenticated pv_log" ON mlm_pv_log FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════
-- STORAGE BUCKET (Dashboard থেকে ম্যানুয়ালি করতে হবে)
-- ══════════════════════════════════════════════════════════════
-- Supabase Dashboard > Storage > New Bucket:
--   Name: gallery-images   → Public: YES
--   Name: profile-images   → Public: YES (already exists?)
--   Name: nid-images       → Public: NO
--   Name: gold-locker-images → Public: YES (already exists?)

-- ══════════════════════════════════════════════════════════════
-- FRESH START (টেস্টের জন্য — সব user data মুছতে চাইলে)
-- শুধু তখনই Run করুন যখন fresh start দরকার
-- ══════════════════════════════════════════════════════════════
/*
-- সতর্কতা: এই block uncomment করলে সব MLM data মুছে যাবে!

TRUNCATE TABLE mlm_transactions CASCADE;
TRUNCATE TABLE mlm_withdrawals CASCADE;
TRUNCATE TABLE mlm_payment_verifications CASCADE;
TRUNCATE TABLE mlm_club_pools CASCADE;
TRUNCATE TABLE mlm_gold_packages CASCADE;
TRUNCATE TABLE mlm_pv_log CASCADE;
DELETE FROM mlm_users WHERE role != 'admin';

-- Club pools রিসেট
INSERT INTO mlm_club_pools (club_type, total_amount) VALUES
  ('daily_club', 0), ('weekly_club', 0), ('insurance_club', 0),
  ('pension_club', 0), ('shareholder_club', 0)
ON CONFLICT (club_type) DO UPDATE SET total_amount = 0;
*/