import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { hashPassword, isEmail } from '@/lib/crypto';

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
  profile_image_url?: string;
  nid_front_url?: string;
  nid_back_url?: string;
  shareholder_count?: number;
  created_at?: string;
  is_dealer?: boolean;
  dealer_area?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string; userId?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email?: string;       // ঐচ্ছিক
  phone: string;        // বাধ্যতামূলক
  password: string;
  name: string;
  package_type: string;
  referrer_id?: string;
}

interface InsertUserData {
  email?: string;
  password_hash: string;
  name: string;
  phone: string;
  package_type: string;
  pv_points: number;
  ps_points: number;
  gp_points: number;
  monthly_pv_purchased: number;
  is_active: boolean;
  gold_package_start: string | null;
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
    } catch (e: unknown) {
      localStorage.removeItem('mlm_user_id');
    }
    setLoading(false);
  };

  const refreshUser = async () => {
    if (user) {
      await fetchUser(user.id);
    }
  };

  // ── Login: Phone অথবা Email যেকোনো একটা দিয়ে ────────────────────────────
  const login = async (identifier: string, password: string) => {
    try {
      const field = isEmail(identifier) ? 'email' : 'phone';

      // Step 1: phone/email দিয়ে user খুঁজি (password check নেই)
      const { data: userData } = await supabase
        .from('mlm_users')
        .select('*')
        .eq(field, identifier.trim())
        .maybeSingle();

      if (!userData) {
        return { success: false, error: 'মোবাইল নম্বর/ইমেইল অথবা পাসওয়ার্ড ভুল হয়েছে' };
      }

      // Step 2: password locally compare — plain text OR hash (পুরনো account)
      const stored = userData.password_hash || '';
      const hashedInput = await hashPassword(password);
      const matches = stored === password || stored === hashedInput;

      if (!matches) {
        return { success: false, error: 'মোবাইল নম্বর/ইমেইল অথবা পাসওয়ার্ড ভুল হয়েছে' };
      }

      if (userData.is_locked) {
        return { success: false, error: 'আপনার আইডি লক করা হয়েছে। এডমিনের সাথে যোগাযোগ করুন।' };
      }

      setUser(userData as User);
      localStorage.setItem('mlm_user_id', userData.id);
      return { success: true };
    } catch (e) {
      return { success: false, error: 'লগইন করতে সমস্যা হয়েছে' };
    }
  };

  // ── Register ─────────────────────────────────────────────────────────────
  const register = async (regData: RegisterData) => {
    try {
      // Phone uniqueness check (বাধ্যতামূলক)
      const { data: existingPhone } = await supabase
        .from('mlm_users')
        .select('id')
        .eq('phone', regData.phone.trim())
        .single();

      if (existingPhone) {
        return { success: false, error: 'এই মোবাইল নম্বর দিয়ে আগেই রেজিস্ট্রেশন করা হয়েছে' };
      }

      // Email uniqueness check (ঐচ্ছিক — দিলে unique হতে হবে)
      if (regData.email && regData.email.trim()) {
        const { data: existingEmail } = await supabase
          .from('mlm_users')
          .select('id')
          .eq('email', regData.email.trim())
          .single();

        if (existingEmail) {
          return { success: false, error: 'এই ইমেইল দিয়ে আগেই রেজিস্ট্রেশন করা হয়েছে' };
        }
      }

      const insertData: InsertUserData = {
        password_hash: regData.password,  // plain text — admin can view
        name: regData.name,
        phone: regData.phone.trim(),
        package_type: regData.package_type,
        pv_points: 0,
        ps_points: 0,
        gp_points: 0,
        monthly_pv_purchased: 0,
        is_active: false,
        gold_package_start: null,
      };

      // Email optional — শুধু থাকলে insert করো
      if (regData.email && regData.email.trim()) {
        insertData.email = regData.email.trim();
      }

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

      return { success: true, userId: data.id };
    } catch (e: unknown) {
      return {
        success: false,
        error: 'রেজিস্ট্রেশন করতে সমস্যা হয়েছে: ' + (e instanceof Error ? e.message : String(e)),
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mlm_user_id');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
