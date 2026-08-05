-- ══════════════════════════════════════════════════════════════
-- Proyojon Plus — Sub Admin System Migration
-- Supabase SQL Editor এ RUN করুন
-- ══════════════════════════════════════════════════════════════

-- Sub Admin accounts table
-- (mlm_users থেকে সম্পূর্ণ আলাদা — শুধু admin panel access এর জন্য)
CREATE TABLE IF NOT EXISTS admin_sub_accounts (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT        NOT NULL,
  email          TEXT        NOT NULL UNIQUE,
  phone          TEXT,
  password_hash  TEXT        NOT NULL,
  role           TEXT        NOT NULL DEFAULT 'sub_admin',
  permissions    TEXT[]      DEFAULT '{}',
  is_active      BOOLEAN     DEFAULT TRUE,
  created_by     UUID        REFERENCES admin_sub_accounts(id) ON DELETE SET NULL,
  last_login_at  TIMESTAMPTZ,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast email lookup
CREATE INDEX IF NOT EXISTS admin_sub_accounts_email_idx ON admin_sub_accounts(email);
CREATE INDEX IF NOT EXISTS admin_sub_accounts_is_active_idx ON admin_sub_accounts(is_active);

-- RLS — শুধু authenticated user দেখতে পারবে
ALTER TABLE admin_sub_accounts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'authenticated full access sub accounts'
    AND tablename = 'admin_sub_accounts'
  ) THEN
    CREATE POLICY "authenticated full access sub accounts"
      ON admin_sub_accounts FOR ALL
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- ── Verification ─────────────────────────────────────────────
-- Run করার পরে এই query দিয়ে চেক করুন:
-- SELECT * FROM admin_sub_accounts;
-- Expected: empty table (কোনো row নেই, এখন admin panel থেকে add করুন)
