import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { hashPassword, isEmail } from '@/lib/crypto';
import { ALL_PERMISSIONS } from '@/lib/permissions';

// ── Interfaces ────────────────────────────────────────────────────────────────

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

export interface SubAdminAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'sub_admin';
  permissions: string[];
  is_active: boolean;
  created_by?: string | null;
  last_login_at?: string | null;
  notes?: string | null;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  subAdminAccount: SubAdminAccount | null;
  loading: boolean;
  isSuperAdmin: boolean;
  adminPermissions: string[];
  hasPermission: (perm: string) => boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  adminLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string; userId?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email?: string;
  phone: string;
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

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,            setUser]            = useState<User | null>(null);
  const [subAdminAccount, setSubAdminAccount] = useState<SubAdminAccount | null>(null);
  const [loading,         setLoading]         = useState(true);

  // ── Derived values ────────────────────────────────────────────────────────
  const isSuperAdmin      = !!(user && user.role === 'admin');
  const adminPermissions  = isSuperAdmin
    ? ALL_PERMISSIONS            // Super admin সব permission পাবে
    : (subAdminAccount?.permissions ?? []);
  const hasPermission = (perm: string): boolean => {
    if (isSuperAdmin) return true;
    return adminPermissions.includes(perm);
  };

  // ── Session restore on mount ──────────────────────────────────────────────
  useEffect(() => {
    const mlmUserId   = localStorage.getItem('mlm_user_id');
    const subAdminId  = localStorage.getItem('admin_sub_id');

    if (mlmUserId) {
      fetchUser(mlmUserId);
    } else if (subAdminId) {
      fetchSubAdmin(subAdminId);
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
    } catch {
      localStorage.removeItem('mlm_user_id');
    }
    setLoading(false);
  };

  const fetchSubAdmin = async (subAdminId: string) => {
    try {
      const { data, error } = await supabase
        .from('admin_sub_accounts')
        .select('*')
        .eq('id', subAdminId)
        .eq('is_active', true)
        .single();

      if (data && !error) {
        setSubAdminAccount(data as SubAdminAccount);
      } else {
        localStorage.removeItem('admin_sub_id');
      }
    } catch {
      localStorage.removeItem('admin_sub_id');
    }
    setLoading(false);
  };

  const refreshUser = async () => {
    if (user) {
      await fetchUser(user.id);
    } else if (subAdminAccount) {
      await fetchSubAdmin(subAdminAccount.id);
    }
  };

  // ── Regular User Login (Phone / Email) ───────────────────────────────────
  const login = async (identifier: string, password: string) => {
    try {
      const field      = isEmail(identifier) ? 'email' : 'phone';
      const hashedInput = await hashPassword(password);

      const { data: candidates, error: fetchErr } = await supabase
        .from('mlm_users')
        .select('*')
        .eq(field, identifier.trim());

      if (fetchErr) {
        return { success: false, error: 'লগইন করতে সমস্যা হয়েছে। একটু পরে আবার চেষ্টা করুন।' };
      }

      if (!candidates || candidates.length === 0) {
        return { success: false, error: 'মোবাইল নম্বর/ইমেইল পাওয়া যায়নি' };
      }

      const userData = candidates.find((u: any) => {
        const stored = u.password_hash || '';
        return stored === password || stored === hashedInput;
      });

      if (!userData) {
        return { success: false, error: 'পাসওয়ার্ড ভুল হয়েছে' };
      }

      if (userData.is_locked) {
        return { success: false, error: 'আপনার আইডি লক করা হয়েছে। এডমিনের সাথে যোগাযোগ করুন।' };
      }

      setUser(userData as User);
      localStorage.setItem('mlm_user_id', userData.id);
      return { success: true };
    } catch {
      return { success: false, error: 'লগইন করতে সমস্যা হয়েছে' };
    }
  };

  // ── Admin Login (Super Admin OR Sub Admin) ────────────────────────────────
  const adminLogin = async (identifier: string, password: string) => {
    try {
      const cleanInput = identifier.trim().toLowerCase();
      const hashedInput = await hashPassword(password);

      // ── Step 1: Super Admin in mlm_users ─────────────────────────────────
      // Fetch all users with any admin role (case insensitive) or matching email/phone
      const { data: allUsers } = await supabase
        .from('mlm_users')
        .select('*');

      if (allUsers && allUsers.length > 0) {
        // Filter admins
        const adminUsers = allUsers.filter((u: any) =>
          u.role && u.role.toString().toLowerCase().includes('admin')
        );

        if (adminUsers.length > 0) {
          const adminUser = adminUsers.find((u: any) => {
            const stored = u.password_hash || '';
            const passMatch = stored === password || stored === hashedInput;
            const uEmail = (u.email || '').trim().toLowerCase();
            const uPhone = (u.phone || '').trim();
            const idMatch = (uEmail && uEmail === cleanInput) || (uPhone && uPhone === identifier.trim());
            return passMatch && (idMatch || adminUsers.length === 1);
          });

          if (adminUser) {
            if (adminUser.is_locked) {
              return { success: false, error: 'এই অ্যাকাউন্ট লক করা হয়েছে।' };
            }
            setUser(adminUser as User);
            setSubAdminAccount(null);
            localStorage.setItem('mlm_user_id', adminUser.id);
            localStorage.removeItem('admin_sub_id');
            return { success: true, role: 'admin' };
          }
        }

        // Also check if any user matching email/phone is an admin
        const matchingUser = allUsers.find((u: any) => {
          const uEmail = (u.email || '').trim().toLowerCase();
          const uPhone = (u.phone || '').trim();
          const idMatch = (uEmail && uEmail === cleanInput) || (uPhone && uPhone === identifier.trim());
          const stored = u.password_hash || '';
          const passMatch = stored === password || stored === hashedInput;
          return idMatch && passMatch;
        });

        if (matchingUser) {
          if (matchingUser.role && matchingUser.role.toString().toLowerCase().includes('admin')) {
            if (matchingUser.is_locked) {
              return { success: false, error: 'এই অ্যাকাউন্ট লক করা হয়েছে।' };
            }
            setUser(matchingUser as User);
            setSubAdminAccount(null);
            localStorage.setItem('mlm_user_id', matchingUser.id);
            localStorage.removeItem('admin_sub_id');
            return { success: true, role: 'admin' };
          }
        }
      }

      // ── Step 2: Sub Admin in admin_sub_accounts ───────────────────────────
      try {
        const { data: subCandidates } = await supabase
          .from('admin_sub_accounts')
          .select('*');

        if (subCandidates && subCandidates.length > 0) {
          const subAdmin = subCandidates.find((u: any) => {
            const stored = u.password_hash || '';
            const passMatch = stored === password || stored === hashedInput;
            const uEmail = (u.email || '').trim().toLowerCase();
            const uPhone = (u.phone || '').trim();
            const idMatch = (uEmail && uEmail === cleanInput) || (uPhone && uPhone === identifier.trim());
            return passMatch && idMatch;
          });

          if (subAdmin) {
            if (!subAdmin.is_active) {
              return { success: false, error: 'আপনার অ্যাকাউন্ট নিষ্ক্রিয় করা হয়েছে। সুপার এডমিনের সাথে যোগাযোগ করুন।' };
            }

            await supabase
              .from('admin_sub_accounts')
              .update({ last_login_at: new Date().toISOString() })
              .eq('id', subAdmin.id);

            setSubAdminAccount(subAdmin as SubAdminAccount);
            setUser(null);
            localStorage.setItem('admin_sub_id', subAdmin.id);
            localStorage.removeItem('mlm_user_id');
            return { success: true, role: 'sub_admin' };
          }
        }
      } catch {
        // Table admin_sub_accounts might not exist yet if migration not run, ignore
      }

      return { success: false, error: 'ইমেইল/ফোন নম্বর বা পাসওয়ার্ড ভুল হয়েছে' };
    } catch (e) {
      return { success: false, error: 'লগইন করতে সমস্যা হয়েছে: ' + (e instanceof Error ? e.message : String(e)) };
    }
  };

  // ── Register ──────────────────────────────────────────────────────────────
  const register = async (regData: RegisterData) => {
    try {
      // Phone uniqueness check
      const { data: existingPhone } = await supabase
        .from('mlm_users')
        .select('id')
        .eq('phone', regData.phone.trim())
        .single();

      if (existingPhone) {
        return { success: false, error: 'এই মোবাইল নম্বর দিয়ে আগেই রেজিস্ট্রেশন করা হয়েছে' };
      }

      // Referrer ID mandatory
      if (!regData.referrer_id || !regData.referrer_id.trim()) {
        return { success: false, error: 'রেফারার আইডি বাধ্যতামূলক। সঠিক রেফারেল লিংক ব্যবহার করুন।' };
      }
      const { data: referrerExists } = await supabase
        .from('mlm_users')
        .select('id')
        .eq('id', regData.referrer_id.trim())
        .maybeSingle();
      if (!referrerExists) {
        return { success: false, error: 'রেফারার আইডি সঠিক নয়। সঠিক রেফারেল লিংক ব্যবহার করুন।' };
      }

      // Email uniqueness check (optional)
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
        password_hash:        regData.password, // plain text — admin can view
        name:                 regData.name,
        phone:                regData.phone.trim(),
        package_type:         regData.package_type,
        pv_points:            0,
        ps_points:            0,
        gp_points:            0,
        monthly_pv_purchased: 0,
        is_active:            false,
        gold_package_start:   null,
      };

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

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = () => {
    setUser(null);
    setSubAdminAccount(null);
    localStorage.removeItem('mlm_user_id');
    localStorage.removeItem('admin_sub_id');
  };

  return (
    <AuthContext.Provider value={{
      user,
      subAdminAccount,
      loading,
      isSuperAdmin,
      adminPermissions,
      hasPermission,
      login,
      adminLogin,
      register,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
