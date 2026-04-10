import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: string;
  referrer_id: string | null;
  package_type: string | null;
  pv_points: number;
  ps_points: number;
  gp_points: number;
  current_balance: number;
  total_income: number;
  gold_referral_income: number;
  gold_referral_pending: number;
  bakeya_amount: number;
  is_active: boolean;
  is_locked: boolean;
  activated_at: string;
  expires_at: string;
  gold_package_start: string | null;
  monthly_pv_purchased: number;
  direct_referrals_count: number;
  is_weekly_club: boolean;
  is_insurance_club: boolean;
  is_pension_club: boolean;
  is_daily_club: boolean;
  is_shareholder_club: boolean;
  address?: string;
  nid_number?: string;
  nominee_name?: string;
  nominee_phone?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string; userId?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  trackPvPurchase: (pvPoints: number, productName: string) => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone: string;
  package_type: string;
  referrer_id?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('mlm_user_id');
    if (stored) {
      fetchUser(stored);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('mlm_users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (data && !error) {
        setUser(data as User);
      } else {
        localStorage.removeItem('mlm_user_id');
      }
    } catch (e) {
      localStorage.removeItem('mlm_user_id');
    }
    setLoading(false);
  };

  const refreshUser = async () => {
    if (user) {
      await fetchUser(user.id);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase
        .from('mlm_users')
        .select('*')
        .eq('email', email)
        .eq('password_hash', password)
        .single();

      if (error || !data) {
        return { success: false, error: 'ইমেইল বা পাসওয়ার্ড ভুল হয়েছে' };
      }

      if (data.is_locked) {
        return { success: false, error: 'আপনার আইডি লক করা হয়েছে। এডমিনের সাথে যোগাযোগ করুন।' };
      }

      setUser(data as User);
      localStorage.setItem('mlm_user_id', data.id);
      return { success: true };
    } catch (e) {
      return { success: false, error: 'লগইন করতে সমস্যা হয়েছে' };
    }
  };

  const register = async (regData: RegisterData) => {
    try {
      const { data: existing } = await supabase
        .from('mlm_users')
        .select('id')
        .eq('email', regData.email)
        .single();

      if (existing) {
        return { success: false, error: 'এই ইমেইল দিয়ে আগেই রেজিস্ট্রেশন করা হয়েছে' };
      }

      let pvPoints = 0, psPoints = 0, gpPoints = 0;

      if (regData.package_type === 'customer') {
        pvPoints = 1000;
      } else if (regData.package_type === 'shareholder') {
        psPoints = 5000;
        pvPoints = 1000;
      } else if (regData.package_type === 'gold') {
        gpPoints = 100000;
        pvPoints = 1000;
      }

      const insertData: any = {
        email: regData.email,
        password_hash: regData.password,
        name: regData.name,
        phone: regData.phone,
        package_type: regData.package_type,
        pv_points: pvPoints,
        ps_points: psPoints,
        gp_points: gpPoints,
        monthly_pv_purchased: pvPoints,
        is_active: true,
        gold_package_start: regData.package_type === 'gold' ? new Date().toISOString() : null,
      };

      if (regData.referrer_id) {
        insertData.referrer_id = regData.referrer_id;
      }

      const { data, error } = await supabase
        .from('mlm_users')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        return { success: false, error: 'রেজিস্ট্রেশন করতে সমস্যা হয়েছে: ' + error.message };
      }

      if (regData.referrer_id && data) {
        await processReferralCommission(regData.referrer_id, regData.package_type, pvPoints, psPoints, gpPoints, data.id);
      }

      return { success: true, userId: data.id };
    } catch (e: any) {
      return { success: false, error: 'রেজিস্ট্রেশন করতে সমস্যা হয়েছে: ' + e.message };
    }
  };

  const processReferralCommission = async (
    referrerId: string, packageType: string, pvPoints: number, psPoints: number, gpPoints: number, newUserId: string
  ) => {
    const { data: referrer } = await supabase.from('mlm_users').select('*').eq('id', referrerId).single();
    if (!referrer || !referrer.is_active) return;

    let commission = 0;

    if (packageType === 'customer') {
      commission = Math.floor(pvPoints * 0.05);
    } else if (packageType === 'shareholder') {
      commission = Math.floor(psPoints * 0.025);
    } else if (packageType === 'gold') {
      // 100000 * 5% = 5000 total commission
      const totalGoldCommission = Math.floor(gpPoints * 0.05);
      // Daily = 5000 / 365 = 13.69
      const dailyAmount = Math.floor(totalGoldCommission / 365);

      await supabase.from('mlm_users').update({
        gold_referral_income: (referrer.gold_referral_income || 0) + totalGoldCommission,
        gold_referral_pending: (referrer.gold_referral_pending || 0) + totalGoldCommission,
        direct_referrals_count: (referrer.direct_referrals_count || 0) + 1,
      }).eq('id', referrerId);

      await supabase.from('mlm_transactions').insert({
        user_id: referrerId,
        type: 'referral_income',
        amount: totalGoldCommission,
        description: `গোল্ড রেফার ইনকাম (৩৬৫ দিনে বন্টিত) - প্রতিদিন ৳${dailyAmount}`,
        related_user_id: newUserId,
      });
      return;
    }

    if (commission > 0) {
      await supabase.from('mlm_users').update({
        current_balance: (referrer.current_balance || 0) + commission,
        total_income: (referrer.total_income || 0) + commission,
        direct_referrals_count: (referrer.direct_referrals_count || 0) + 1,
      }).eq('id', referrerId);

      await supabase.from('mlm_transactions').insert({
        user_id: referrerId, type: 'referral_income', amount: commission,
        description: `রেফার কমিশন - ${packageType === 'customer' ? 'কাস্টমার' : 'শেয়ারহোল্ডার'} প্যাকেজ`, related_user_id: newUserId,
      });
    } else {
      await supabase.from('mlm_users').update({
        direct_referrals_count: (referrer.direct_referrals_count || 0) + 1,
      }).eq('id', referrerId);
    }

    // Generation bonus (1% PV for 5 generations)
    if (pvPoints > 0) {
      await processGenerationBonus(referrerId, pvPoints, newUserId, 1);
    }

    // Distribute PV to club pools
    if (pvPoints >= 100) {
      await distributeToClubPools(pvPoints);
    }

    // Check weekly club eligibility
    const updatedReferrals = (referrer.direct_referrals_count || 0) + 1;
    if (updatedReferrals >= 15 && !referrer.is_weekly_club) {
      await supabase.from('mlm_users').update({ is_weekly_club: true }).eq('id', referrerId);

      // Check insurance & pension club eligibility
      const { data: weeklyMembers } = await supabase.from('mlm_users')
        .select('is_weekly_club')
        .eq('referrer_id', referrerId)
        .eq('is_weekly_club', true);

      if (weeklyMembers && weeklyMembers.length >= 15) {
        await supabase.from('mlm_users').update({
          is_insurance_club: true, is_pension_club: true,
        }).eq('id', referrerId);
      }
    }
  };

  const processGenerationBonus = async (userId: string, pvPoints: number, sourceUserId: string, generation: number) => {
    if (generation > 5) return;
    const { data: u } = await supabase.from('mlm_users')
      .select('id, referrer_id, is_active, current_balance, total_income')
      .eq('id', userId).single();

    if (!u || !u.is_active) return;

    const bonus = Math.floor(pvPoints * 0.01);
    if (bonus > 0) {
      await supabase.from('mlm_users').update({
        current_balance: (u.current_balance || 0) + bonus,
        total_income: (u.total_income || 0) + bonus,
      }).eq('id', userId);

      await supabase.from('mlm_transactions').insert({
        user_id: userId, type: 'generation_bonus', amount: bonus,
        description: `জেনারেশন ${generation} বোনাস (PV: ${pvPoints})`, related_user_id: sourceUserId,
      });
    }

    if (u.referrer_id) {
      await processGenerationBonus(u.referrer_id, pvPoints, sourceUserId, generation + 1);
    }
  };

  const distributeToClubPools = async (pvAmount: number) => {
    const pools = [
      { type: 'daily_club', amount: Math.floor(pvAmount * 0.30) },
      { type: 'weekly_club', amount: Math.floor(pvAmount * 0.025) },
      { type: 'insurance_club', amount: Math.floor(pvAmount * 0.025) },
      { type: 'pension_club', amount: Math.floor(pvAmount * 0.025) },
      { type: 'shareholder_club', amount: Math.floor(pvAmount * 0.10) },
    ];

    for (const pool of pools) {
      const { data: existing } = await supabase.from('mlm_club_pools').select('total_amount').eq('club_type', pool.type).single();
      if (existing) {
        await supabase.from('mlm_club_pools').update({ total_amount: (existing.total_amount || 0) + pool.amount }).eq('club_type', pool.type);
      }
    }
  };

  // Track PV purchase from shop
  const trackPvPurchase = async (pvPoints: number, productName: string) => {
    if (!user || pvPoints <= 0) return;

    const newMonthlyPV = (user.monthly_pv_purchased || 0) + pvPoints;
    const newTotalPV = (user.pv_points || 0) + pvPoints;

    await supabase.from('mlm_users').update({
      monthly_pv_purchased: newMonthlyPV,
      pv_points: newTotalPV,
    }).eq('id', user.id);

    // Log PV
    await supabase.from('mlm_pv_log').insert({
      user_id: user.id, amount: pvPoints, source: 'product_purchase', product_name: productName,
    });

    // Auto-reactivation
    if (newMonthlyPV >= 100) {
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 30);
      await supabase.from('mlm_users').update({
        is_active: true, expires_at: newExpiry.toISOString(),
      }).eq('id', user.id);
    }

    // Generation bonus for PV purchase
    if (user.referrer_id && pvPoints > 0) {
      await processGenerationBonus(user.referrer_id, pvPoints, user.id, 1);
    }

    // Club pool distribution
    if (pvPoints >= 100) {
      await distributeToClubPools(pvPoints);
    }

    await refreshUser();
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mlm_user_id');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, trackPvPurchase }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
