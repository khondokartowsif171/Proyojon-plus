import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminProductManager from '@/components/AdminProductManager';
import {
  Users, Wallet, TrendingUp, Gift, Search, Lock, Unlock, Edit, Trash2, RefreshCw,
  DollarSign, CheckCircle, XCircle, Play, Loader2, BarChart3, Network, Package,
  FolderTree, CreditCard, FileText, Plus, Save, ChevronDown, ChevronRight, ShoppingBag,
} from 'lucide-react';
import { toast } from 'sonner';

const clubLabels: Record<string, string> = {
  daily_club:       'ডেইলি ক্লাব',
  weekly_club:      'উইকলি ক্লাব',
  insurance_club:   'ইনসুরেন্স ক্লাব',
  pension_club:     'পেনশন ক্লাব',
  shareholder_club: 'শেয়ারহোল্ডার ক্লাব',
};

// Club pool percentages — শুধু PV sales থেকে
const PV_CLUB_PCTS: Record<string, number> = {
  daily_club:       0.30,
  weekly_club:      0.025,
  insurance_club:   0.0125,
  pension_club:     0.0125,
  shareholder_club: 0.10,
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [clubPools, setClubPools] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [paymentVerifications, setPV] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editUser, setEditUser] = useState<any>(null);
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, totalIncome: 0, totalWithdrawals: 0 });
  const [loading, setLoading] = useState(false);
  const [cronRunning, setCronRunning] = useState(false);
  const [cronResult, setCronResult] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [catForm, setCatForm] = useState({ name: '', parent_id: '', description: '' });
  const [showCatForm, setShowCatForm] = useState(false);
  const [networkMembers, setNetworkMembers] = useState<any[]>([]);

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/login'); return; }
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    const { data: usersData } = await supabase.from('mlm_users').select('*').order('created_at', { ascending: false });
    if (usersData) {
      setUsers(usersData);
      setStats({
        totalUsers:       usersData.filter(u => u.role !== 'admin').length,
        activeUsers:      usersData.filter(u => u.is_active && u.role !== 'admin').length,
        totalIncome:      usersData.reduce((s, u) => s + (u.total_income || 0), 0),
        totalWithdrawals: 0,
      });
      const allMembers: any[] = [];
      for (const u of usersData.filter(u => u.role !== 'admin')) {
        const referrer = usersData.find(r => r.id === u.referrer_id);
        const team     = usersData.filter(t => t.referrer_id === u.id).length;
        allMembers.push({ ...u, upline: referrer?.name || '-', team_count: team });
      }
      setNetworkMembers(allMembers);
    }

    const { data: pools } = await supabase.from('mlm_club_pools').select('*');
    if (pools) setClubPools(pools);

    const { data: wds } = await supabase.from('mlm_withdrawals')
      .select('*, user_id, user:mlm_users(name, email, phone)')
      .order('created_at', { ascending: false }).limit(100);
    if (wds) {
      setWithdrawals(wds);
      setStats(prev => ({ ...prev, totalWithdrawals: wds.reduce((s: number, w: any) => s + (w.net_amount || 0), 0) }));
    }

    const { data: txns } = await supabase.from('mlm_transactions')
      .select('*, user:mlm_users(name)').order('created_at', { ascending: false }).limit(100);
    if (txns) setTransactions(txns);

    const { data: ordersData } = await supabase.from('ecom_orders')
      .select('*, customer:ecom_customers(name, email)').order('created_at', { ascending: false }).limit(50);
    if (ordersData) setOrders(ordersData);

    const { data: catsData } = await supabase.from('mlm_categories').select('*').order('sort_order');
    if (catsData) setCategories(catsData);

    const { data: prodsData } = await supabase.from('ecom_products').select('*').order('created_at', { ascending: false });
    if (prodsData) setProducts(prodsData);

    const { data: pvData } = await supabase.from('mlm_payment_verifications')
      .select('*, user_id, user:mlm_users(name, email, phone)').order('created_at', { ascending: false });
    if (pvData) setPV(pvData);
  };

  // ── Daily cron ───────────────────────────────────────────────────────────────
  const handleRunDailyCron = async () => {
    setCronRunning(true);
    setCronResult(null);
    try {
      const dailyGold   = parseFloat((1800 / 365).toFixed(2));
      const dailyBakeya = Math.round((100000 * 0.36) / 365);
      let goldCount = 0;

      const { data: goldUsers } = await supabase.from('mlm_users')
        .select('id, gold_referral_pending, current_balance, total_income')
        .gt('gold_referral_pending', 0).eq('is_active', true).neq('role', 'admin');

      for (const u of (goldUsers || [])) {
        if (u.gold_referral_pending >= dailyGold) {
          await supabase.from('mlm_users').update({
            current_balance:       (u.current_balance || 0) + dailyGold,
            total_income:          (u.total_income || 0) + dailyGold,
            gold_referral_pending: u.gold_referral_pending - dailyGold,
          }).eq('id', u.id);
          await supabase.from('mlm_transactions').insert({
            user_id: u.id, type: 'gold_daily', amount: dailyGold,
            description: `গোল্ড রেফার দৈনিক ইনকাম ৳${dailyGold}`,
          });
          goldCount++;
        }
      }

      const { data: goldBuyers } = await supabase.from('mlm_users').select('id, bakeya_amount')
        .eq('package_type', 'gold').eq('is_active', true).neq('role', 'admin');
      for (const buyer of (goldBuyers || [])) {
        await supabase.from('mlm_users').update({ bakeya_amount: (buyer.bakeya_amount || 0) + dailyBakeya }).eq('id', buyer.id);
      }

      let deactivatedCount = 0;
      const { data: expiredUsers } = await supabase.from('mlm_users').select('id')
        .lt('expires_at', new Date().toISOString()).eq('is_active', true).neq('role', 'admin')
        .neq('package_type', 'gold').neq('package_type', 'shareholder');
      for (const u of (expiredUsers || [])) {
        const { data: profile } = await supabase.from('mlm_users').select('monthly_pv_purchased').eq('id', u.id).single();
        if (!profile || profile.monthly_pv_purchased < 100) {
          await supabase.from('mlm_users').update({ is_active: false }).eq('id', u.id);
          deactivatedCount++;
        }
      }

      const today = new Date();
      let pvReset = -1;
      if (today.getDate() === 1) {
        await supabase.from('mlm_users').update({ monthly_pv_purchased: 0 }).neq('role', 'admin');
        pvReset = 1;
      }

      setCronResult({ success: true, results: { goldReferralDistributed: goldCount, bakeyaAccumulated: (goldBuyers || []).length, deactivatedUsers: deactivatedCount, monthlyPvReset: pvReset } });
      toast.success('দৈনিক কাজ সম্পন্ন!');
      fetchAll();
    } catch (e: any) {
      toast.error('সমস্যা: ' + e.message);
      setCronResult({ success: false, error: e.message });
    }
    setCronRunning(false);
  };

  const handleLockUser = async (userId: string, lock: boolean) => {
    await supabase.from('mlm_users').update({ is_locked: lock }).eq('id', userId);
    toast.success(lock ? 'আইডি লক' : 'আইডি আনলক');
    fetchAll();
  };

  const handleUpdateUser = async () => {
    if (!editUser) return;
    setLoading(true);
    await supabase.from('mlm_users').update({
      name: editUser.name, email: editUser.email, phone: editUser.phone,
      password_hash: editUser.password_hash, is_active: editUser.is_active,
      is_locked: editUser.is_locked, current_balance: editUser.current_balance,
      is_weekly_club: editUser.is_weekly_club, is_insurance_club: editUser.is_insurance_club,
      is_pension_club: editUser.is_pension_club, is_shareholder_club: editUser.is_shareholder_club,
      is_daily_club: editUser.is_daily_club,
    }).eq('id', editUser.id);
    toast.success('ইউজার আপডেট সফল');
    setEditUser(null); fetchAll(); setLoading(false);
  };

  const handleAddCategory = async () => {
    if (!catForm.name) { toast.error('ক্যাটাগরি নাম দিন'); return; }
    setLoading(true);
    await supabase.from('mlm_categories').insert({ name: catForm.name, parent_id: catForm.parent_id || null, description: catForm.description || null });
    toast.success('ক্যাটাগরি যোগ হয়েছে!');
    setCatForm({ name: '', parent_id: '', description: '' });
    setShowCatForm(false); fetchAll(); setLoading(false);
  };

  const handleDeleteCategory = async (id: string) => {
    if (categories.filter(c => c.parent_id === id).length > 0) { toast.error('আগে সাব-ক্যাটাগরি মুছুন!'); return; }
    await supabase.from('mlm_categories').delete().eq('id', id);
    toast.success('মুছে ফেলা হয়েছে!'); fetchAll();
  };

  const handleDistributeClub = async (clubType: string) => {
    setLoading(true);
    const pool = clubPools.find(p => p.club_type === clubType);
    if (!pool || pool.total_amount <= 0) { toast.error('বন্টনযোগ্য পরিমাণ নেই'); setLoading(false); return; }

    let query = supabase.from('mlm_users').select('id, current_balance, total_income').eq('is_active', true).neq('role', 'admin');
    if (clubType === 'daily_club')          query = query.eq('is_daily_club', true);
    else if (clubType === 'weekly_club')    query = query.eq('is_weekly_club', true);
    else if (clubType === 'insurance_club') query = query.eq('is_insurance_club', true);
    else if (clubType === 'pension_club')   query = query.eq('is_pension_club', true);
    else if (clubType === 'shareholder_club') query = query.eq('is_shareholder_club', true).eq('package_type', 'shareholder');

    const { data: members } = await query;
    if (!members || members.length === 0) { toast.error('এই ক্লাবে কোনো সক্রিয় সদস্য নেই'); setLoading(false); return; }

    const perMember = Math.floor(pool.total_amount / members.length);
    if (perMember <= 0) { toast.error('পরিমাণ যথেষ্ট নয়'); setLoading(false); return; }

    for (const member of members) {
      await supabase.from('mlm_users').update({ current_balance: (member.current_balance || 0) + perMember, total_income: (member.total_income || 0) + perMember }).eq('id', member.id);
      await supabase.from('mlm_transactions').insert({ user_id: member.id, type: clubType, amount: perMember, description: `${clubLabels[clubType]} বোনাস বন্টন` });
    }

    await supabase.from('mlm_club_pools').update({ total_amount: 0 }).eq('id', pool.id);
    toast.success(`✅ ${members.length} জনকে প্রতিজনে ৳${perMember} বন্টন হয়েছে!`);
    fetchAll(); setLoading(false);
  };

  const handleApproveWithdrawal = async (id: string, approve: boolean) => {
    setLoading(true);
    const wd = withdrawals.find(w => w.id === id);
    if (!wd) { setLoading(false); return; }

    if (approve) {
      const { error } = await supabase.from('mlm_withdrawals').update({ status: 'approved', processed_at: new Date().toISOString() }).eq('id', id);
      if (error) { toast.error('সমস্যা: ' + error.message); }
      else {
        await supabase.from('mlm_transactions').insert({ user_id: wd.user_id, type: 'withdrawal_approved', amount: -(wd.amount || 0), description: `উইথড্রো অনুমোদিত - ${wd.method} - ${wd.account_number}` });
        toast.success(`✅ ৳${wd.net_amount} উইথড্রো অনুমোদিত`);
      }
    } else {
      const { data: userData } = await supabase.from('mlm_users').select('current_balance').eq('id', wd.user_id).single();
      if (userData) await supabase.from('mlm_users').update({ current_balance: (userData.current_balance || 0) + (wd.amount || 0) }).eq('id', wd.user_id);
      await supabase.from('mlm_withdrawals').update({ status: 'rejected', processed_at: new Date().toISOString() }).eq('id', id);
      await supabase.from('mlm_transactions').insert({ user_id: wd.user_id, type: 'withdrawal_refund', amount: wd.amount || 0, description: `উইথড্রো বাতিল - ৳${wd.amount} ফেরত` });
      toast.error(`❌ উইথড্রো বাতিল`);
    }
    fetchAll(); setLoading(false);
  };

  // ── Generation bonus — শুধু customer package PV sales ────────────────────
  const distributeGenerationBonus = async (userId: string, pvPoints: number, sourceId: string, gen: number) => {
    if (gen > 5) return;
    const { data: u } = await supabase.from('mlm_users')
      .select('id, referrer_id, is_active, current_balance, total_income').eq('id', userId).single();
    if (!u || !u.is_active) return;
    const bonus = Math.floor(pvPoints * 0.01);
    if (bonus > 0) {
      await supabase.from('mlm_users').update({ current_balance: (u.current_balance || 0) + bonus, total_income: (u.total_income || 0) + bonus }).eq('id', userId);
      await supabase.from('mlm_transactions').insert({ user_id: userId, type: 'generation_bonus', amount: bonus, description: `জেনারেশন ${gen} বোনাস (PV: ${pvPoints})`, related_user_id: sourceId });
    }
    if (u.referrer_id) await distributeGenerationBonus(u.referrer_id, pvPoints, sourceId, gen + 1);
  };

  // ── Club pool helper ─────────────────────────────────────────────────────
  const addToClubPools = async (pvAmount: number) => {
    for (const [clubType, pct] of Object.entries(PV_CLUB_PCTS)) {
      const amt = Math.floor(pvAmount * pct);
      if (amt <= 0) continue;
      const { data: pool } = await supabase.from('mlm_club_pools').select('id, total_amount').eq('club_type', clubType).single();
      if (pool) await supabase.from('mlm_club_pools').update({ total_amount: (pool.total_amount || 0) + amt }).eq('id', pool.id);
    }
  };

  // ── Payment approve ──────────────────────────────────────────────────────
  const handleApprovePayment = async (id: string, approve: boolean) => {
    const pv = paymentVerifications.find(p => p.id === id);
    if (!pv) return;
    setLoading(true);

    if (approve) {
      await supabase.from('mlm_payment_verifications').update({ status: 'approved', processed_at: new Date().toISOString() }).eq('id', id);

      // ══ CASE 1: Product purchase ══════════════════════════════════════════
      if (pv.purpose === 'product_purchase') {
        const { data: userData } = await supabase.from('mlm_users')
          .select('pv_points, monthly_pv_purchased, referrer_id, package_type, is_active')
          .eq('id', pv.user_id).single();

        if (userData) {
          const pvToAdd      = pv.pv_points || 0;
          const priorPvTotal = userData.pv_points || 0;
          const newTotalPv   = priorPvTotal + pvToAdd;
          const newMonthly   = (userData.monthly_pv_purchased || 0) + pvToAdd;

          const updates: any = {
            pv_points:            newTotalPv,
            monthly_pv_purchased: newMonthly,
          };

          // discriminator: pv_points < 1000 = প্রথমবার, >= 1000 = নবায়ন
          const isFirstTime   = priorPvTotal < 1000;
          let justFirstActivated = false;

          if (userData.package_type === 'customer') {
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + 30);

            if (!userData.is_active) {
              if (isFirstTime && newTotalPv >= 1000) {
                // প্রথম activation: মোট ১০০০ PV পূর্ণ হলে
                updates.is_active          = true;
                updates.expires_at         = expiry.toISOString();
                updates.activated_at       = new Date().toISOString();
                updates.is_daily_club      = true;
                justFirstActivated         = true;
              } else if (!isFirstTime && newMonthly >= 100) {
                // মেয়াদ শেষে re-activation: এই মাসে ১০০ PV হলে
                updates.is_active     = true;
                updates.expires_at    = expiry.toISOString();
                updates.is_daily_club = true;
              }
            } else if (userData.is_active && newMonthly >= 100) {
              // active থাকা অবস্থায় renewal
              updates.expires_at    = expiry.toISOString();
              updates.is_daily_club = true;
            }
          }

          await supabase.from('mlm_users').update(updates).eq('id', pv.user_id);

          // প্রথম activation এ referrer কমিশন + count + club promotion
          if (justFirstActivated && userData.referrer_id) {
            const commission = Math.floor(1000 * 0.05); // সবসময় ৳৫০
            const { data: ref } = await supabase.from('mlm_users')
              .select('id, current_balance, total_income, is_active, direct_referrals_count, is_weekly_club, is_insurance_club, name')
              .eq('id', userData.referrer_id).single();

            if (ref && ref.is_active) {
              const newCount   = Number(ref.direct_referrals_count || 0) + 1;
              const refUpdates: any = {
                direct_referrals_count: newCount,
                current_balance: Number(ref.current_balance || 0) + commission,
                total_income:    Number(ref.total_income    || 0) + commission,
              };

              await supabase.from('mlm_transactions').insert({
                user_id: ref.id, type: 'referral_income', amount: commission,
                description: `কাস্টমার রেফার কমিশন ৫% (৳৫০)`, related_user_id: pv.user_id,
              });

              // Weekly club: ১৫ সক্রিয় রেফারাল হলে
              if (newCount >= 15 && !ref.is_weekly_club) {
                refUpdates.is_weekly_club = true;
                toast.success(`🎉 ${ref.name} উইকলি ক্লাবে যোগ হয়েছে!`);
              }

              // Insurance + Pension: ১৫ জন weekly club direct হলে
              if (!ref.is_insurance_club) {
                const { data: directs } = await supabase.from('mlm_users')
                  .select('id, is_weekly_club').eq('referrer_id', ref.id).eq('is_active', true);
                const weeklyCount = (directs || []).filter(r => r.is_weekly_club).length;
                if (weeklyCount >= 15) {
                  refUpdates.is_insurance_club = true;
                  refUpdates.is_pension_club   = true;
                  toast.success(`🎉 ${ref.name} ইনসুরেন্স ও পেনশন ক্লাবে যোগ হয়েছে!`);
                }
              }

              await supabase.from('mlm_users').update(refUpdates).eq('id', ref.id);
            }
          }

          // Generation bonus — customer package only
          if (userData.package_type === 'customer' && userData.referrer_id && pvToAdd > 0) {
            await distributeGenerationBonus(userData.referrer_id, pvToAdd, pv.user_id, 1);
          }

          // Club pools
          if (pvToAdd >= 1) await addToClubPools(pvToAdd);
        }

        toast.success('✅ পণ্য পেমেন্ট অনুমোদিত! PV ও Club pool আপডেট হয়েছে।');
        fetchAll(); setLoading(false);
        return;
      }

      // ══ CASE 2: Customer registration — শুধু acknowledgment, activation নয় ══
      // activation হবে শুধু 1000 PV পণ্য কেনার পরে (CASE 1 বা Checkout)
      if (pv.purpose === 'customer_registration') {
        toast.success('✅ রেজিস্ট্রেশন নিশ্চিত হয়েছে। আইডি সক্রিয় হবে ১,০০০ PV পণ্য কিনলে।');
        fetchAll(); setLoading(false);
        return;
      }

      // ══ CASE 3: Package purchase ══════════════════════════════════════════
      const isCustomer    = pv.purpose === 'customer_package';
      const isShareholder = pv.purpose === 'shareholder_package';
      const isGold        = pv.purpose === 'gold_package';

      let pvPoints = 0, psPoints = 0, gpPoints = 0;
      let goldStart = null;
      const expiry = new Date();

      if (isCustomer) {
        // ✅ Fix 2: Customer package activate — ১০০০ PV set করো
        pvPoints = 1000;
        expiry.setDate(expiry.getDate() + 30);
      } else if (isShareholder) {
        psPoints = 5000; // শুধু SP, PV নেই
        expiry.setDate(expiry.getDate() + 30);
      } else if (isGold) {
        gpPoints  = 100000;
        goldStart = new Date().toISOString();
        expiry.setDate(expiry.getDate() + 365);
      }

      const updatePayload: any = {
        is_active:            true,
        expires_at:           expiry.toISOString(),
        activated_at:         new Date().toISOString(),
        gold_package_start:   goldStart,
        monthly_pv_purchased: isCustomer ? pvPoints : 0,
        // Club flags
        is_daily_club:        isCustomer,
        is_shareholder_club:  isShareholder,
        is_weekly_club:       false,
        is_insurance_club:    false,
        is_pension_club:      false,
      };

      if (isCustomer)    updatePayload.pv_points = pvPoints;
      if (isShareholder) updatePayload.ps_points = psPoints;
      if (isGold)        updatePayload.gp_points = gpPoints;

      await supabase.from('mlm_users').update(updatePayload).eq('id', pv.user_id);

      // ✅ Customer package activate হলে club pool এ টাকা যাবে
      if (isCustomer && pvPoints >= 100) {
        await addToClubPools(pvPoints);
      }

      // ── Referrer commission ──────────────────────────────────────────────
      const { data: newUser } = await supabase.from('mlm_users').select('referrer_id').eq('id', pv.user_id).single();

      if (newUser?.referrer_id) {
        const { data: referrer } = await supabase.from('mlm_users').select('*').eq('id', newUser.referrer_id).single();

        if (referrer && referrer.is_active) {
          let commission = 0;
          let desc       = '';

          if (isCustomer) {
            commission = Math.floor(pvPoints * 0.05);
            desc       = 'কাস্টমার রেফার কমিশন (৫%)';
          } else if (isShareholder) {
            commission = Math.floor(psPoints * 0.025);
            desc       = 'শেয়ারহোল্ডার রেফার কমিশন (২.৫%)';
          } else if (isGold) {
            const totalGold = 1800;
            await supabase.from('mlm_users').update({
              gold_referral_income:  (referrer.gold_referral_income || 0) + totalGold,
              gold_referral_pending: (referrer.gold_referral_pending || 0) + totalGold,
            }).eq('id', referrer.id);
            await supabase.from('mlm_transactions').insert({
              user_id: referrer.id, type: 'referral_income', amount: totalGold,
              description: 'গোল্ড রেফার ইনকাম (৳১৮০০, ৩৬৫ দিনে বন্টন)', related_user_id: pv.user_id,
            });
            const dailyBakeya = Math.round((100000 * 0.36) / 365);
            await supabase.from('mlm_users').update({ bakeya_amount: dailyBakeya }).eq('id', pv.user_id);
          }

          // ✅ Fix 3: Commission credit — সাথে সাথে balance এ যাবে
          if (commission > 0) {
            const { error: commErr } = await supabase.from('mlm_users').update({
              current_balance: (referrer.current_balance || 0) + commission,
              total_income:    (referrer.total_income || 0) + commission,
            }).eq('id', referrer.id);

            if (!commErr) {
              await supabase.from('mlm_transactions').insert({
                user_id: referrer.id, type: 'referral_income', amount: commission,
                description: desc, related_user_id: pv.user_id,
              });
            } else {
              console.error('Commission error:', commErr);
            }
          }

          // ✅ Fix 5: direct_referrals_count — একবারই increment করো
          // পুরনো count database থেকে নাও (stale না হওয়ার জন্য)
          const { data: freshReferrer } = await supabase.from('mlm_users')
            .select('direct_referrals_count, is_weekly_club, is_insurance_club')
            .eq('id', referrer.id).single();

          const currentCount = freshReferrer?.direct_referrals_count || 0;
          const newCount     = currentCount + 1;
          const refUpdates: any = { direct_referrals_count: newCount };

          if (newCount >= 15 && !freshReferrer?.is_weekly_club) {
            refUpdates.is_weekly_club = true;
            toast.success(`🎉 ${referrer.name} উইকলি ক্লাবে যোগ হয়েছে!`);
          }

          // Insurance ও pension: ১৫ জন weekly club member হলে
          if (!freshReferrer?.is_insurance_club) {
            const { data: directRefs } = await supabase.from('mlm_users')
              .select('id, is_weekly_club').eq('referrer_id', referrer.id).eq('is_active', true);
            const weeklyCount = (directRefs || []).filter(r => r.is_weekly_club).length;
            if (weeklyCount >= 15) {
              refUpdates.is_insurance_club = true;
              refUpdates.is_pension_club   = true;
              toast.success(`🎉 ${referrer.name} ইনসুরেন্স ও পেনশন ক্লাবে যোগ হয়েছে!`);
            }
          }

          await supabase.from('mlm_users').update(refUpdates).eq('id', referrer.id);
        }
      }

      toast.success('✅ অনুমোদিত! কমিশন বিতরণ হয়েছে।');

    } else {
      await supabase.from('mlm_payment_verifications').update({ status: 'rejected', processed_at: new Date().toISOString() }).eq('id', id);
      toast.error('❌ প্রত্যাখ্যাত!');
    }

    fetchAll(); setLoading(false);
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone?.includes(searchQuery),
  );
  const parentCategories = categories.filter(c => !c.parent_id);
  const getSubCategories = (pid: string) => categories.filter(c => c.parent_id === pid);

  if (!user || user.role !== 'admin') return null;

  const sidebarItems = [
    { id: 'overview',     label: 'ওভারভিউ',        icon: <BarChart3 size={18} /> },
    { id: 'users',        label: 'মেম্বার ম্যানেজ', icon: <Users size={18} /> },
    { id: 'network',      label: 'নেটওয়ার্ক টেবিল', icon: <Network size={18} /> },
    { id: 'categories',   label: 'ক্যাটাগরি',       icon: <FolderTree size={18} /> },
    { id: 'products',     label: 'পণ্য ম্যানেজ',    icon: <ShoppingBag size={18} /> },
    { id: 'payments',     label: 'পেমেন্ট ভেরিফাই', icon: <CreditCard size={18} /> },
    { id: 'clubs',        label: 'ক্লাব বন্টন',     icon: <Gift size={18} /> },
    { id: 'withdrawals',  label: 'উইথড্রো',         icon: <Wallet size={18} /> },
    { id: 'transactions', label: 'লেনদেন',          icon: <FileText size={18} /> },
    { id: 'orders',       label: 'অর্ডার',           icon: <Package size={18} /> },
    { id: 'reports',      label: 'রিপোর্ট',          icon: <BarChart3 size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="flex">
        <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-gradient-to-b from-gray-900 to-gray-800 min-h-[calc(100vh-64px)] transition-all duration-300 hidden lg:block`}>
          <div className="p-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-white/10 text-gray-400 mb-3">
              {sidebarOpen ? <ChevronDown size={18} className="rotate-90" /> : <ChevronRight size={18} />}
            </button>
            {sidebarOpen && <p className="text-xs text-gray-500 uppercase tracking-wider px-3 mb-3">এডমিন প্যানেল</p>}
            <nav className="space-y-1">
              {sidebarItems.map(item => (
                <button key={item.id} onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                  {item.icon}
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 p-4 lg:p-6 max-w-full overflow-x-hidden">
          <div className="flex flex-wrap gap-1.5 mb-4 lg:hidden overflow-x-auto">
            {sidebarItems.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">এডমিন ড্যাশবোর্ড</h1>
              <p className="text-gray-500 text-xs">সকল কার্যক্রম পরিচালনা করুন</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchAll} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs hover:bg-gray-50">
                <RefreshCw size={14} /> রিফ্রেশ
              </button>
              <button onClick={handleRunDailyCron} disabled={cronRunning}
                className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg text-xs hover:from-orange-600 hover:to-red-600 disabled:opacity-50 shadow-lg">
                {cronRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                {cronRunning ? 'চলছে...' : 'দৈনিক কাজ'}
              </button>
            </div>
          </div>

          {cronResult && (
            <div className={`mb-4 p-3 rounded-xl border text-xs ${cronResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              {cronResult.results && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="bg-white/60 rounded-lg p-2"><p className="text-gray-500">গোল্ড রেফার</p><p className="font-bold text-green-700">{cronResult.results.goldReferralDistributed} জন</p></div>
                  <div className="bg-white/60 rounded-lg p-2"><p className="text-gray-500">বকেয়া জমা</p><p className="font-bold text-orange-700">{cronResult.results.bakeyaAccumulated} জন</p></div>
                  <div className="bg-white/60 rounded-lg p-2"><p className="text-gray-500">নিষ্ক্রিয়</p><p className="font-bold text-red-700">{cronResult.results.deactivatedUsers} জন</p></div>
                  <div className="bg-white/60 rounded-lg p-2"><p className="text-gray-500">PV রিসেট</p><p className="font-bold text-blue-700">{cronResult.results.monthlyPvReset === -1 ? 'স্কিপ' : 'হয়েছে'}</p></div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'মোট মেম্বার',       value: stats.totalUsers,                              icon: <Users size={20} />,      color: 'from-blue-500 to-cyan-500' },
              { label: 'সক্রিয় মেম্বার',   value: stats.activeUsers,                             icon: <CheckCircle size={20} />, color: 'from-green-500 to-emerald-500' },
              { label: 'মোট ইনকাম বন্টিত', value: `৳${stats.totalIncome.toLocaleString()}`,       icon: <TrendingUp size={20} />, color: 'from-purple-500 to-pink-500' },
              { label: 'মোট উইথড্রো',      value: `৳${stats.totalWithdrawals.toLocaleString()}`, icon: <DollarSign size={20} />, color: 'from-orange-500 to-red-500' },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className={`w-10 h-10 bg-gradient-to-br ${s.color} rounded-lg flex items-center justify-center text-white mb-2`}>{s.icon}</div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-lg font-bold text-gray-900">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">

            {activeTab === 'overview' && (
              <div>
                <h2 className="text-lg font-bold mb-4">সিস্টেম ওভারভিউ</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="font-semibold text-sm text-gray-700 mb-3">প্যাকেজ অনুযায়ী</h3>
                    {['customer', 'shareholder', 'gold'].map(pkg => {
                      const count = users.filter(u => u.package_type === pkg && u.role !== 'admin').length;
                      const pct   = Math.round((count / (stats.totalUsers || 1)) * 100);
                      return (
                        <div key={pkg} className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">{pkg==='customer'?'কাস্টমার':pkg==='shareholder'?'শেয়ারহোল্ডার':'গোল্ড'}</span>
                            <span className="font-bold">{count} জন ({pct}%)</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${pkg==='customer'?'bg-blue-500':pkg==='shareholder'?'bg-purple-500':'bg-yellow-500'}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-gray-700 mb-3">ক্লাব সদস্য</h3>
                    {Object.entries(clubLabels).map(([key, label]) => {
                      const count = users.filter(u => (u as any)[`is_${key}`] && u.role !== 'admin').length;
                      return (
                        <div key={key} className="flex justify-between py-1.5 border-b border-gray-50 text-sm">
                          <span className="text-gray-600">{label}</span>
                          <span className="font-bold">{count} জন</span>
                        </div>
                      );
                    })}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-gray-700 mb-3">পেন্ডিং কাজ</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-2 px-3 bg-yellow-50 rounded-lg border border-yellow-100">
                        <span className="text-sm text-yellow-800">পেন্ডিং উইথড্রো</span>
                        <span className="font-bold text-yellow-700">{withdrawals.filter(w=>w.status==='pending').length}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded-lg border border-blue-100">
                        <span className="text-sm text-blue-800">পেন্ডিং পেমেন্ট</span>
                        <span className="font-bold text-blue-700">{paymentVerifications.filter(p=>p.status==='pending' && p.purpose!=='customer_registration').length}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-3 bg-red-50 rounded-lg border border-red-100">
                        <span className="text-sm text-red-800">নিষ্ক্রিয় আইডি</span>
                        <span className="font-bold text-red-700">{users.filter(u=>!u.is_active&&u.role!=='admin').length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-lg font-bold">মেম্বার ম্যানেজমেন্ট</h2>
                  <div className="flex-1 max-w-sm relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      placeholder="নাম, ইমেইল বা ফোন..."
                      className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-indigo-500 outline-none" />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50">
                      {['নাম','ইমেইল/ফোন','প্যাকেজ','ব্যালেন্স','PV','স্ট্যাটাস','পাসওয়ার্ড','অ্যাকশন'].map(h => (
                        <th key={h} className="text-left py-2 px-3 text-xs font-medium text-gray-500">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {filteredUsers.filter(u => u.role !== 'admin').map(u => (
                        <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2 px-3 font-medium">{u.name}</td>
                          <td className="py-2 px-3 text-xs"><p>{u.email}</p><p className="text-gray-400">{u.phone}</p></td>
                          <td className="py-2 px-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${u.package_type==='gold'?'bg-yellow-100 text-yellow-700':u.package_type==='shareholder'?'bg-purple-100 text-purple-700':'bg-blue-100 text-blue-700'}`}>
                              {u.package_type==='customer'?'কাস্টমার':u.package_type==='shareholder'?'শেয়ারহোল্ডার':'গোল্ড'}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-medium">৳{(u.current_balance||0).toLocaleString()}</td>
                          <td className="py-2 px-3 text-xs">{u.monthly_pv_purchased||0}/100</td>
                          <td className="py-2 px-3">
                            <span className={`text-xs ${u.is_locked?'text-red-600':u.is_active?'text-green-600':'text-yellow-600'}`}>
                              {u.is_locked?'লক':u.is_active?'সক্রিয়':'নিষ্ক্রিয়'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-xs font-mono text-gray-400">{u.password_hash}</td>
                          <td className="py-2 px-3">
                            <div className="flex gap-1">
                              <button onClick={() => setEditUser({...u})} className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600"><Edit size={14} /></button>
                              <button onClick={() => handleLockUser(u.id, !u.is_locked)}
                                className={`p-1.5 rounded-lg ${u.is_locked?'hover:bg-green-50 text-green-600':'hover:bg-red-50 text-red-600'}`}>
                                {u.is_locked?<Unlock size={14} />:<Lock size={14} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'network' && (
              <div>
                <h2 className="text-lg font-bold mb-4">নেটওয়ার্ক টেবিল</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                      {['নাম','আপলাইন','লেভেল','টিম','আয়','ব্যালেন্স','ক্লাব'].map((h,i) => (
                        <th key={h} className={`text-left py-3 px-4 text-xs font-semibold ${i===0?'rounded-tl-lg':''} ${i===6?'rounded-tr-lg text-center':''}`}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {networkMembers.map((m, i) => (
                        <tr key={m.id} className={`border-b border-gray-50 ${i%2===0?'bg-white':'bg-gray-50'} hover:bg-indigo-50`}>
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${m.is_active?'bg-green-500':'bg-red-400'}`}>
                                {m.name?.charAt(0)?.toUpperCase()}
                              </div>
                              <div><p className="font-medium text-xs">{m.name}</p><p className="text-[10px] text-gray-400">{m.phone}</p></div>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-xs text-gray-600">{m.upline}</td>
                          <td className="py-2.5 px-4">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${m.package_type==='gold'?'bg-yellow-100 text-yellow-700':m.package_type==='shareholder'?'bg-purple-100 text-purple-700':'bg-blue-100 text-blue-700'}`}>
                              {m.package_type==='customer'?'কাস্টমার':m.package_type==='shareholder'?'শেয়ারহোল্ডার':'গোল্ড'}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-center font-medium">{m.team_count}</td>
                          <td className="py-2.5 px-4 text-right font-bold text-green-600">৳{(m.total_income||0).toLocaleString()}</td>
                          <td className="py-2.5 px-4 text-right font-bold text-indigo-600">৳{(m.current_balance||0).toLocaleString()}</td>
                          <td className="py-2.5 px-4">
                            <div className="flex flex-wrap gap-1 justify-center">
                              {m.is_daily_club       && <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full">ডেইলি</span>}
                              {m.is_weekly_club      && <span className="text-[9px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full">উইকলি</span>}
                              {m.is_insurance_club   && <span className="text-[9px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full">ইনসুরেন্স</span>}
                              {m.is_pension_club     && <span className="text-[9px] px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded-full">পেনশন</span>}
                              {m.is_shareholder_club && <span className="text-[9px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">শেয়ারহোল্ডার</span>}
                              {!m.is_daily_club&&!m.is_weekly_club&&!m.is_insurance_club&&!m.is_pension_club&&!m.is_shareholder_club&&(
                                <span className="text-[9px] text-gray-400">কোনো ক্লাব নেই</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'categories' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">ক্যাটাগরি ম্যানেজমেন্ট</h2>
                  <button onClick={() => setShowCatForm(!showCatForm)} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700">
                    <Plus size={14} /> নতুন ক্যাটাগরি
                  </button>
                </div>
                {showCatForm && (
                  <div className="bg-indigo-50 rounded-xl p-4 mb-4 border border-indigo-100">
                    <div className="grid md:grid-cols-3 gap-3">
                      <input value={catForm.name} onChange={e => setCatForm({...catForm,name:e.target.value})} placeholder="ক্যাটাগরি নাম" className="px-3 py-2 rounded-lg border text-sm" />
                      <select value={catForm.parent_id} onChange={e => setCatForm({...catForm,parent_id:e.target.value})} className="px-3 py-2 rounded-lg border text-sm bg-white">
                        <option value="">প্যারেন্ট ক্যাটাগরি (ঐচ্ছিক)</option>
                        {parentCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <input value={catForm.description} onChange={e => setCatForm({...catForm,description:e.target.value})} placeholder="বিবরণ (ঐচ্ছিক)" className="px-3 py-2 rounded-lg border text-sm" />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={handleAddCategory} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700 disabled:opacity-50">
                        <Save size={14} className="inline mr-1" /> সেভ
                      </button>
                      <button onClick={() => setShowCatForm(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-xs hover:bg-gray-50">বাতিল</button>
                    </div>
                  </div>
                )}
                <div className="space-y-3">
                  {parentCategories.map(cat => (
                    <div key={cat.id} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between p-4 bg-gray-50">
                        <div className="flex items-center gap-3">
                          <FolderTree size={18} className="text-indigo-600" />
                          <div>
                            <p className="font-semibold text-gray-800">{cat.name}</p>
                            {cat.description && <p className="text-xs text-gray-500">{cat.description}</p>}
                          </div>
                        </div>
                        <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
                      </div>
                      {getSubCategories(cat.id).length > 0 && (
                        <div className="px-4 pb-3 pt-1">
                          {getSubCategories(cat.id).map(sub => (
                            <div key={sub.id} className="flex items-center justify-between py-2 pl-6 border-b border-gray-50 last:border-0">
                              <div className="flex items-center gap-2">
                                <ChevronRight size={14} className="text-gray-400" />
                                <span className="text-sm text-gray-700">{sub.name}</span>
                              </div>
                              <button onClick={() => handleDeleteCategory(sub.id)} className="p-1 rounded hover:bg-red-50 text-red-400"><Trash2 size={12} /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <AdminProductManager products={products} categories={categories} onRefresh={fetchAll} />
            )}

            {activeTab === 'payments' && (
              <div>
                <h2 className="text-lg font-bold mb-2">পেমেন্ট ভেরিফিকেশন</h2>
                <p className="text-xs text-gray-500 mb-4">বিকাশ / নগদ / রকেট পেমেন্ট যাচাই করুন</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50">
                      {['ইউজার','পরিমাণ','মাধ্যম','TRX ID','সেন্ডার','উদ্দেশ্য','স্ট্যাটাস','অ্যাকশন'].map(h => (
                        <th key={h} className="text-left py-2 px-3 text-xs font-medium text-gray-500">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {paymentVerifications
                        .filter(pv => pv.purpose !== 'customer_registration')
                        .map(pv => {
                        const purposeLabel =
                          pv.purpose === 'customer_package'    ? 'কাস্টমার প্যাকেজ'
                          : pv.purpose === 'shareholder_package' ? 'শেয়ারহোল্ডার'
                          : pv.purpose === 'gold_package'        ? 'গোল্ড'
                          : pv.purpose === 'product_purchase'    ? 'পণ্য ক্রয়'
                          : pv.purpose;
                        const purposeColor =
                          pv.purpose === 'product_purchase'    ? 'bg-teal-100 text-teal-700'
                          : pv.purpose === 'gold_package'      ? 'bg-yellow-100 text-yellow-700'
                          : pv.purpose === 'shareholder_package' ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700';
                        const methodLabel =
                          pv.method === 'bkash'  ? 'বিকাশ'
                          : pv.method === 'nagad'  ? 'নগদ'
                          : pv.method === 'rocket' ? 'রকেট'
                          : pv.method === 'balance' ? 'ব্যালেন্স'
                          : pv.method;
                        const methodColor =
                          pv.method === 'bkash'   ? 'bg-pink-500'
                          : pv.method === 'nagad'  ? 'bg-orange-500'
                          : pv.method === 'rocket' ? 'bg-purple-600'
                          : pv.method === 'balance' ? 'bg-green-600'
                          : 'bg-gray-500';
                        return (
                          <tr key={pv.id} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="py-2 px-3"><p className="font-medium text-xs">{pv.user?.name}</p><p className="text-[10px] text-gray-400">{pv.user?.phone}</p></td>
                            <td className="py-2 px-3 font-bold">৳{(pv.amount||0).toLocaleString()}</td>
                            <td className="py-2 px-3">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${methodColor}`}>{methodLabel}</span>
                            </td>
                            <td className="py-2 px-3 font-mono text-xs">{pv.trx_id}</td>
                            <td className="py-2 px-3 text-xs">{pv.sender_number||'-'}</td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs ${purposeColor}`}>{purposeLabel}</span>
                            </td>
                            <td className="py-2 px-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${pv.status==='approved'?'bg-green-100 text-green-700':pv.status==='rejected'?'bg-red-100 text-red-700':'bg-yellow-100 text-yellow-700'}`}>
                                {pv.status==='approved'?'অনুমোদিত':pv.status==='rejected'?'প্রত্যাখ্যাত':'পেন্ডিং'}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              {pv.status==='pending' && (
                                <div className="flex gap-1">
                                  <button onClick={() => handleApprovePayment(pv.id, true)} className="p-1 rounded bg-green-100 text-green-600 hover:bg-green-200"><CheckCircle size={14} /></button>
                                  <button onClick={() => handleApprovePayment(pv.id, false)} className="p-1 rounded bg-red-100 text-red-600 hover:bg-red-200"><XCircle size={14} /></button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {paymentVerifications.filter(p => p.purpose !== 'customer_registration').length === 0 && (
                        <tr><td colSpan={8} className="text-center py-8 text-gray-400 text-xs">কোন পেমেন্ট অনুরোধ নেই</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'clubs' && (
              <div>
                <h2 className="text-lg font-bold mb-1">ক্লাব বোনাস বন্টন</h2>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-xs text-blue-800 space-y-1">
                  <p>📌 Customer package + PV sales → Daily 30% • Weekly 2.5% • Insurance 1.25% • Pension 1.25% • Shareholder 10%</p>
                  <p>📌 Shareholder club → শুধু shareholder package holders পাবেন</p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clubPools.map(pool => {
                    const memberCount =
                      pool.club_type==='daily_club'         ? users.filter(u=>u.is_daily_club&&u.role!=='admin').length
                      : pool.club_type==='weekly_club'      ? users.filter(u=>u.is_weekly_club).length
                      : pool.club_type==='insurance_club'   ? users.filter(u=>u.is_insurance_club).length
                      : pool.club_type==='pension_club'     ? users.filter(u=>u.is_pension_club).length
                      : pool.club_type==='shareholder_club' ? users.filter(u=>u.is_shareholder_club&&u.package_type==='shareholder').length : 0;
                    const perMember = memberCount>0&&pool.total_amount>0 ? Math.floor(pool.total_amount/memberCount) : 0;
                    const pctLabel = pool.club_type==='daily_club'?'৩০%':pool.club_type==='shareholder_club'?'১০%':pool.club_type==='weekly_club'?'২.৫%':'১.২৫%';
                    return (
                      <div key={pool.id} className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-200">
                        <h3 className="font-bold text-gray-800 mb-1">{clubLabels[pool.club_type]||pool.club_type}</h3>
                        <p className="text-xs text-gray-400 mb-2">{pctLabel} PV pool</p>
                        <p className="text-2xl font-bold text-indigo-600 mb-1">৳{(pool.total_amount||0).toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mb-1">সদস্য: {memberCount} জন</p>
                        {perMember>0 && <p className="text-xs text-gray-400 mb-3">প্রতি জনে: ৳{perMember}</p>}
                        <button onClick={() => handleDistributeClub(pool.club_type)} disabled={loading||pool.total_amount<=0}
                          className="w-full py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">বন্টন করুন</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'withdrawals' && (
              <div>
                <h2 className="text-lg font-bold mb-4">উইথড্রো অনুরোধ</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50">
                      {['ইউজার','পরিমাণ','চার্জ','নেট','মাধ্যম','একাউন্ট','স্ট্যাটাস','অ্যাকশন'].map(h => (
                        <th key={h} className="text-left py-2 px-3 text-xs font-medium text-gray-500">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {withdrawals.map(wd => (
                        <tr key={wd.id} className="border-b border-gray-50">
                          <td className="py-2 px-3"><p className="font-medium text-xs">{wd.user?.name||'N/A'}</p><p className="text-[10px] text-gray-400">{wd.user?.phone}</p></td>
                          <td className="py-2 px-3 font-medium">৳{wd.amount}</td>
                          <td className="py-2 px-3 text-red-500 text-xs">৳{wd.charge}</td>
                          <td className="py-2 px-3 font-bold text-green-600">৳{wd.net_amount}</td>
                          <td className="py-2 px-3">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${wd.method==='bkash'?'bg-pink-500':wd.method==='nagad'?'bg-orange-500':wd.method==='rocket'?'bg-purple-600':'bg-blue-600'}`}>
                              {wd.method==='bkash'?'বিকাশ':wd.method==='nagad'?'নগদ':wd.method==='rocket'?'রকেট':'ব্যাংক'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-xs">{wd.account_number}</td>
                          <td className="py-2 px-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${wd.status==='approved'?'bg-green-100 text-green-700':wd.status==='rejected'?'bg-red-100 text-red-700':'bg-yellow-100 text-yellow-700'}`}>
                              {wd.status==='approved'?'অনুমোদিত':wd.status==='rejected'?'প্রত্যাখ্যাত':'পেন্ডিং'}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            {wd.status==='pending' && (
                              <div className="flex gap-1">
                                <button onClick={() => handleApproveWithdrawal(wd.id, true)} className="p-1 rounded bg-green-100 text-green-600 hover:bg-green-200"><CheckCircle size={14} /></button>
                                <button onClick={() => handleApproveWithdrawal(wd.id, false)} className="p-1 rounded bg-red-100 text-red-600 hover:bg-red-200"><XCircle size={14} /></button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'transactions' && (
              <div>
                <h2 className="text-lg font-bold mb-4">সকল লেনদেন</h2>
                <div className="space-y-2">
                  {transactions.map(txn => (
                    <div key={txn.id} className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-gray-50">
                      <div>
                        <p className="text-xs font-medium text-gray-700">{txn.user?.name} — {txn.description}</p>
                        <p className="text-[10px] text-gray-400">{txn.type} • {new Date(txn.created_at).toLocaleDateString('bn-BD')}</p>
                      </div>
                      <span className={`font-bold text-xs ${txn.amount>=0?'text-green-600':'text-red-600'}`}>
                        {txn.amount>=0?'+':''}৳{Math.abs(txn.amount).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div>
                <h2 className="text-lg font-bold mb-4">অর্ডার সমূহ</h2>
                {orders.length===0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Package size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">কোনো অর্ডার নেই</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-gray-50">
                        {['অর্ডার ID','কাস্টমার','মোট','স্ট্যাটাস','তারিখ'].map(h => (
                          <th key={h} className="text-left py-2 px-3 text-xs font-medium text-gray-500">{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {orders.map(order => (
                          <tr key={order.id} className="border-b border-gray-50">
                            <td className="py-2 px-3 font-mono text-xs">{order.id.slice(0,8)}...</td>
                            <td className="py-2 px-3 text-xs">{order.customer?.name||order.shipping_address?.name||'N/A'}</td>
                            <td className="py-2 px-3 font-bold text-xs">৳{((order.total||0)/100).toLocaleString()}</td>
                            <td className="py-2 px-3"><span className={`text-xs px-2 py-0.5 rounded-full ${order.status==='paid'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{order.status==='paid'?'পেইড':'পেন্ডিং'}</span></td>
                            <td className="py-2 px-3 text-xs">{new Date(order.created_at).toLocaleDateString('bn-BD')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reports' && (
              <div>
                <h2 className="text-lg font-bold mb-4">রিপোর্ট ও বিশ্লেষণ</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-xl p-5">
                    <h3 className="font-semibold mb-3">প্যাকেজ বিক্রয়</h3>
                    {['customer','shareholder','gold'].map(pkg => {
                      const pkgUsers = users.filter(u=>u.package_type===pkg&&u.role!=='admin');
                      return (
                        <div key={pkg} className="flex justify-between py-2 border-b border-gray-200 text-sm">
                          <span>{pkg==='customer'?'কাস্টমার':pkg==='shareholder'?'শেয়ারহোল্ডার':'গোল্ড'}</span>
                          <span className="font-bold">{pkgUsers.length} জন</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-5">
                    <h3 className="font-semibold mb-3">আর্থিক সারসংক্ষেপ</h3>
                    <div className="space-y-2 text-sm">
                      {[
                        { label: 'মোট ব্যালেন্স', value: users.reduce((s,u)=>s+(u.current_balance||0),0) },
                        { label: 'মোট ইনকাম',    value: stats.totalIncome },
                        { label: 'মোট উইথড্রো', value: stats.totalWithdrawals },
                        { label: 'ক্লাব পুল',    value: clubPools.reduce((s,p)=>s+(p.total_amount||0),0) },
                      ].map(r => (
                        <div key={r.label} className="flex justify-between py-2 border-b border-gray-200">
                          <span>{r.label}</span>
                          <span className="font-bold">৳{r.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {editUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">ইউজার এডিট</h2>
            <div className="space-y-3">
              {[
                { label: 'নাম',       key: 'name',            type: 'text' },
                { label: 'ইমেইল',    key: 'email',           type: 'email' },
                { label: 'ফোন',      key: 'phone',           type: 'text' },
                { label: 'পাসওয়ার্ড', key: 'password_hash', type: 'text' },
                { label: 'ব্যালেন্স', key: 'current_balance', type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-gray-500">{f.label}</label>
                  <input type={f.type} value={editUser[f.key]||''}
                    onChange={e => setEditUser({...editUser,[f.key]:f.type==='number'?parseInt(e.target.value)||0:e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border text-sm" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'is_active',          label: 'সক্রিয়' },
                  { key: 'is_locked',           label: 'লক' },
                  { key: 'is_daily_club',       label: 'ডেইলি ক্লাব' },
                  { key: 'is_weekly_club',      label: 'উইকলি ক্লাব' },
                  { key: 'is_insurance_club',   label: 'ইনসুরেন্স ক্লাব' },
                  { key: 'is_pension_club',     label: 'পেনশন ক্লাব' },
                  { key: 'is_shareholder_club', label: 'শেয়ারহোল্ডার ক্লাব' },
                ].map(f => (
                  <label key={f.key} className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox" checked={editUser[f.key]||false}
                      onChange={e => setEditUser({...editUser,[f.key]:e.target.checked})} className="rounded" />
                    {f.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditUser(null)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">বাতিল</button>
              <button onClick={handleUpdateUser} disabled={loading} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                {loading?'সেভ হচ্ছে...':'সেভ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}