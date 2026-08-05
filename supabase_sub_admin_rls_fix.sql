-- ══════════════════════════════════════════════════════════════
-- Proyojon Plus — Sub Admin RLS Fix
-- কারণ: এই project Supabase Auth ব্যবহার করে না (custom auth)
-- তাই auth.role() = 'authenticated' সব request block করে
-- ══════════════════════════════════════════════════════════════

-- Step 1: পুরনো ভুল policy মুছুন
DROP POLICY IF EXISTS "authenticated full access sub accounts" ON admin_sub_accounts;

-- Step 2: RLS বন্ধ করুন (mlm_users এর মতোই)
ALTER TABLE admin_sub_accounts DISABLE ROW LEVEL SECURITY;

-- ── Verification ─────────────────────────────────────────────
-- Run করার পরে এই query দিয়ে test করুন:
SELECT id, name, email, is_active FROM admin_sub_accounts;
-- Expected: empty table (0 rows) — কোনো error ছাড়া
