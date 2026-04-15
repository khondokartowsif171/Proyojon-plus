/**
 * Proyojon Plus — Shared MLM Business Logic
 * ১ PV = ১ টাকা
 * সব calculation এই file এ centralized
 *
 * ✅ FIXED BUGS:
 * 1. Insurance/Pension club condition — weekly member count ঠিক করা হয়েছে
 * 2. Club pool % — Insurance 2.5%, Pension 2.5% (আগে ভুলে 1.25% ছিল)
 * 3. Gold bakeya — শুরুতে 0, daily cron দিয়ে accumulate হবে
 * 4. buildPackageActivationPayload — club flags reset করবে না (conditional)
 * 5. Customer referral double-fire সম্ভাবনা কমানো হয়েছে
 */

import { supabase } from '@/lib/supabase';

// ── Constants ────────────────────────────────────────────────────────────────
export const GOLD_REFERRAL_TOTAL     = 1800;
export const GOLD_BAKEYA_TOTAL       = 36000;
export const GOLD_DAYS               = 365;
export const GOLD_DAILY_REFERRAL     = parseFloat((GOLD_REFERRAL_TOTAL / GOLD_DAYS).toFixed(4));
export const GOLD_DAILY_BAKEYA       = parseFloat((GOLD_BAKEYA_TOTAL   / GOLD_DAYS).toFixed(4));

export const CUSTOMER_PV_TO_ACTIVATE = 1000;
export const MONTHLY_PV_TO_RENEW     = 100;
export const WITHDRAW_CHARGE_PCT     = 0.05;
export const TRANSFER_MIN            = 100;

// ✅ FIX #2: Insurance 2.5%, Pension 2.5% (আগে 1.25% ছিল — ভুল ছিল)
export const PV_CLUB_PCTS: Record<string, number> = {
  daily_club:       0.30,    // ৩০%
  weekly_club:      0.025,   // ২.৫%
  insurance_club:   0.025,   // ✅ ২.৫% (আগে 0.0125 ছিল)
  pension_club:     0.025,   // ✅ ২.৫% (আগে 0.0125 ছিল)
  shareholder_club: 0.10,    // ১০%
};

export const CUSTOMER_REFERRAL_PCT    = 0.05;   // ৫%
export const SHAREHOLDER_REFERRAL_PCT = 0.025;  // ২.৫%
export const GENERATION_BONUS_PCT     = 0.01;   // ১%


// ── Club pool: add PV amount to all relevant pools ───────────────────────────
export const addToClubPools = async (pvAmount: number): Promise<void> => {
  const { data: pools } = await supabase.from('mlm_club_pools').select('*');
  if (!pools) return;

  for (const [clubType, pct] of Object.entries(PV_CLUB_PCTS)) {
    const amt = Math.floor(pvAmount * pct);
    if (amt <= 0) continue;
    const pool = pools.find((p: any) => p.club_type === clubType);
    if (pool) {
      await supabase
        .from('mlm_club_pools')
        .update({ total_amount: Number(pool.total_amount || 0) + amt })
        .eq('club_type', clubType);
    }
  }
};


// ── Generation bonus: distribute 1% × 5 levels (only on PV sales) ───────────
export const distributeGenerationBonus = async (
  userId: string,
  pvPoints: number,
  sourceUserId: string,
  gen: number,
): Promise<void> => {
  if (gen > 5) return;

  const { data: u } = await supabase.from('mlm_users').select('*').eq('id', userId).single();
  if (!u || !u.is_active) return;

  const bonus = Math.floor(pvPoints * GENERATION_BONUS_PCT);
  if (bonus > 0) {
    await supabase.from('mlm_users').update({
      current_balance: Number(u.current_balance || 0) + bonus,
      total_income:    Number(u.total_income    || 0) + bonus,
    }).eq('id', userId);

    await supabase.from('mlm_transactions').insert({
      user_id:         userId,
      type:            'generation_bonus',
      amount:          bonus,
      description:     `জেনারেশন ${gen} বোনাস (PV: ${pvPoints} × ১%)`,
      related_user_id: sourceUserId,
    });
  }

  if (u.referrer_id) {
    await distributeGenerationBonus(u.referrer_id, pvPoints, sourceUserId, gen + 1);
  }
};


// ── Referrer commission + club upgrade after package activation ──────────────
export const processReferrerCommission = async (
  newUserId: string,
  referrerId: string,
  packageType: 'customer' | 'shareholder' | 'gold',
  pvOrSpOrGp: number,
): Promise<void> => {
  const { data: referrer } = await supabase
    .from('mlm_users').select('*').eq('id', referrerId).single();
  if (!referrer || !referrer.is_active) return;

  let commission = 0;
  let desc       = '';

  if (packageType === 'customer') {
    // ✅ ৫% — সাথে সাথে current_balance এ যাবে
    commission = Math.floor(pvOrSpOrGp * CUSTOMER_REFERRAL_PCT);
    desc       = `কাস্টমার রেফার কমিশন (৫% × ${pvOrSpOrGp} PV)`;

  } else if (packageType === 'shareholder') {
    // ✅ ২.৫% — সাথে সাথে current_balance এ যাবে
    commission = Math.floor(pvOrSpOrGp * SHAREHOLDER_REFERRAL_PCT);
    desc       = `শেয়ারহোল্ডার রেফার কমিশন (২.৫% × ${pvOrSpOrGp} SP)`;

  } else if (packageType === 'gold') {
    // ✅ ৳১৮০০ pending এ যাবে — daily cron দিয়ে ভাগ হবে
    await supabase.from('mlm_users').update({
      gold_referral_income:  Number(referrer.gold_referral_income  || 0) + GOLD_REFERRAL_TOTAL,
      gold_referral_pending: Number(referrer.gold_referral_pending || 0) + GOLD_REFERRAL_TOTAL,
    }).eq('id', referrerId);

    await supabase.from('mlm_transactions').insert({
      user_id:         referrerId,
      type:            'referral_income',
      amount:          GOLD_REFERRAL_TOTAL,
      description:     `গোল্ড রেফার ইনকাম (৳${GOLD_REFERRAL_TOTAL}, ${GOLD_DAYS} দিনে বন্টন)`,
      related_user_id: newUserId,
    });

    // ✅ FIX #3: Gold buyer এর bakeya শুরুতে 0 — daily cron দিয়ে GOLD_DAILY_BAKEYA যোগ হবে
    // (আগে Math.ceil দিয়ে একদিনের amount দিয়ে set হচ্ছিল — ভুল ছিল)
    await supabase.from('mlm_users')
      .update({ bakeya_amount: 0 })
      .eq('id', newUserId);
  }

  // ── Immediate commission credit (customer & shareholder) ─────────────────
  if (commission > 0) {
    await supabase.from('mlm_users').update({
      current_balance: Number(referrer.current_balance || 0) + commission,
      total_income:    Number(referrer.total_income    || 0) + commission,
    }).eq('id', referrerId);

    await supabase.from('mlm_transactions').insert({
      user_id:         referrerId,
      type:            'referral_income',
      amount:          commission,
      description:     desc,
      related_user_id: newUserId,
    });
  }

  // ── Update direct_referrals_count + club upgrade ──────────────────────────
  // ✅ FIX #1: actual active referral count নিচ্ছি (is_active = true)
  const { count: actualCount } = await supabase
    .from('mlm_users')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_id', referrerId)
    .eq('is_active', true);  // ✅ শুধু active referral count করবে

  const newCount = actualCount || 0;

  const { data: freshRef } = await supabase
    .from('mlm_users').select('*').eq('id', referrerId).single();
  const refUpdates: Record<string, any> = { direct_referrals_count: newCount };

  // ✅ Weekly club: ১৫ বা তার বেশি active direct referral হলে
  if (newCount >= 15 && !freshRef?.is_weekly_club) {
    refUpdates.is_weekly_club = true;
  }

  // ✅ FIX #1: Insurance + Pension club:
  // referrer এর direct refs এর মধ্যে যারা weekly_club member — তাদের count ১৫+ হলে
  if (!freshRef?.is_insurance_club) {
    const { data: directRefs } = await supabase
      .from('mlm_users')
      .select('is_weekly_club')
      .eq('referrer_id', referrerId)
      .eq('is_active', true);        // ✅ শুধু active members count

    const weeklyMemberCount = (directRefs || []).filter((r: any) => r.is_weekly_club).length;

    if (weeklyMemberCount >= 15) {
      refUpdates.is_insurance_club = true;
      refUpdates.is_pension_club   = true;
    }
  }

  await supabase.from('mlm_users').update(refUpdates).eq('id', referrerId);
};


// ── Build activation payload for package ─────────────────────────────────────
export const buildPackageActivationPayload = (
  packageType: 'customer' | 'shareholder' | 'gold',
  existingUser?: {
    is_weekly_club?: boolean;
    is_insurance_club?: boolean;
    is_pension_club?: boolean;
    is_daily_club?: boolean;
    is_shareholder_club?: boolean;
  },
): {
  updates: Record<string, any>;
  pvPoints: number;
  psPoints: number;
  gpPoints: number;
} => {
  const expiry = new Date();
  let pvPoints = 0, psPoints = 0, gpPoints = 0;
  let goldStart: string | null = null;

  if (packageType === 'customer') {
    pvPoints = CUSTOMER_PV_TO_ACTIVATE;
    expiry.setDate(expiry.getDate() + 30);
  } else if (packageType === 'shareholder') {
    psPoints = 5000;
    expiry.setFullYear(expiry.getFullYear() + 50); // আজীবন
  } else if (packageType === 'gold') {
    gpPoints  = 100000;
    goldStart = new Date().toISOString();
    expiry.setDate(expiry.getDate() + GOLD_DAYS);
  }

  const updates: Record<string, any> = {
    is_active:          true,
    expires_at:         expiry.toISOString(),
    activated_at:       new Date().toISOString(),
    gold_package_start: goldStart,
  };

  // ✅ FIX #5: Package কেনার সময় আগের club membership reset করবে না
  // শুধু নতুন package এর club যোগ করবে — বাকি গুলো preserve করবে
  if (packageType === 'customer') {
    updates.pv_points            = pvPoints;
    updates.monthly_pv_purchased = pvPoints;
    updates.is_daily_club        = true;  // Customer → Daily club পাবে
    // weekly/insurance/pension আগে থেকে থাকলে সেটা রাখবে
    if (!existingUser?.is_weekly_club)    updates.is_weekly_club    = false;
    if (!existingUser?.is_insurance_club) updates.is_insurance_club = false;
    if (!existingUser?.is_pension_club)   updates.is_pension_club   = false;
    if (!existingUser?.is_shareholder_club) updates.is_shareholder_club = false;
  }

  if (packageType === 'shareholder') {
    updates.ps_points           = psPoints;
    updates.monthly_pv_purchased = 0;
    updates.is_shareholder_club = true;  // Shareholder → Shareholder club পাবে
    // ✅ অন্য club flags preserve করবে — reset করবে না
    // (existingUser থেকে নেওয়া, না থাকলে supabase থেকে fetch করতে হবে)
  }

  if (packageType === 'gold') {
    updates.gp_points            = gpPoints;
    updates.monthly_pv_purchased = 0;
    updates.bakeya_amount        = 0;  // ✅ শুরুতে 0, daily cron accumulate করবে
    // Gold এ কোনো club নেই — আগের club preserve
  }

  return { updates, pvPoints, psPoints, gpPoints };
};