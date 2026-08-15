-- ══════════════════════════════════════════════════════════════
-- Proyojon Plus — Hajj Fund & Reward Points Migration
-- Supabase SQL Editor এ এই SQL RUN করুন
-- ══════════════════════════════════════════════════════════════

-- ── 1. mlm_users তে নতুন কলাম যোগ করুন ─────────────────────
ALTER TABLE mlm_users ADD COLUMN IF NOT EXISTS omrah_hajj_balance NUMERIC(12,4) DEFAULT 0;
ALTER TABLE mlm_users ADD COLUMN IF NOT EXISTS reward_points       NUMERIC(12,4) DEFAULT 0;

-- ── 2. mlm_transactions তে type constraint আপডেট ────────────
-- (যদি CHECK constraint থাকে তাহলে নতুন type add করতে হবে)
-- নিচের line এ 'type' column এর constraint check করুন।
-- সাধারণত Proyojon Plus এ type TEXT — তাই নিচের ALTER দরকার নাও হতে পারে।
-- ALTER TABLE mlm_transactions DROP CONSTRAINT IF EXISTS mlm_transactions_type_check;

-- ── 3. lottery_omrah_hajj_club pool আছে কিনা নিশ্চিত করুন ──
INSERT INTO mlm_club_pools (club_type, total_amount)
VALUES ('lottery_omrah_hajj_club', 0)
ON CONFLICT (club_type) DO NOTHING;

-- ── 4. Index যোগ করুন (performance) ─────────────────────────
CREATE INDEX IF NOT EXISTS mlm_users_omrah_hajj_idx ON mlm_users(omrah_hajj_balance);
CREATE INDEX IF NOT EXISTS mlm_users_reward_points_idx ON mlm_users(reward_points);

-- ── 5. Transaction type index ─────────────────────────────────
CREATE INDEX IF NOT EXISTS mlm_transactions_type_user_idx ON mlm_transactions(user_id, type);

-- ── 6. যাচাই করুন (এই query run করুন, result দেখুন) ─────────
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'mlm_users'
  AND column_name IN ('omrah_hajj_balance', 'reward_points');

-- ── 7. mlm_transactions এর type গুলো check করুন ─────────────
SELECT DISTINCT type FROM mlm_transactions ORDER BY type;
