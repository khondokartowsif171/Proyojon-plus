import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Wallet, TrendingUp, Users, Gift, Shield, Crown, Award, Clock,
  ArrowUpRight, ArrowDownRight, Copy, RefreshCw, Send, CreditCard,
  Package, Timer, ChevronDown, ChevronUp, User, BarChart3,
  Network, FileText, Share2, Target, Eye, EyeOff, Edit, Save, X
} from 'lucide-react';
import { toast } from 'sonner';
import {
  addToClubPools,
  processReferrerCommission,
  buildPackageActivationPayload,
  CUSTOMER_PV_TO_ACTIVATE,
  MONTHLY_PV_TO_RENEW,
  WITHDRAW_CHARGE_PCT,
  TRANSFER_MIN,
} from '@/lib/mlm-business-logic';

export default function UserDashboard() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [generations, setGenerations] = useState<any[][]>([[], [], [], [], []]);
  const [networkMembers, setNetworkMembers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', method: 'bkash', account: '' });
  const [transferForm, setTransferForm] = useState({ amount: '', toEmail: '' });
  const [goldCountdown, setGoldCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [loading, setLoading] = useState(false);
  const [pvLogs, setPvLogs] = useState<any[]>([]);
  const [profileEdit, setProfileEdit] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '', phone: '', address: '', nid_number: '', nominee_name: '', nominee_phone: '',
  });
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.role === 'admin') { navigate('/admin'); return; }
    fetchData();
    setProfileForm({
      name:          user.name || '',
      phone:         user.phone || '',
      address:       (user as any).address || '',
      nid_number:    (user as any).nid_number || '',
      nominee_name:  (user as any).nominee_name || '',
      nominee_phone: (user as any).nominee_phone || '',
    });
  }, [user]);

  // Realtime balance update
  useEffect(() => {
    if (!user) return;
    const sub = supabase
      .channel(`user_balance_${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'mlm_users',
        filter: `id=eq.${user.id}`,
      }, () => { refreshUser(); })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [user]);

  // Gold countdown timer
  useEffect(() => {
    if (user?.package_type === 'gold' && user.gold_package_start) {
      const interval = setInterval(() => {
        const start = new Date(user.gold_package_start!).getTime();
        const end   = start + 365 * 24 * 60 * 60 * 1000;
        const rem   = Math.max(0, end - Date.now());
        setGoldCountdown({
          days:    Math.floor(rem / (1000 * 60 * 60 * 24)),
          hours:   Math.floor((rem % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((rem % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((rem % (1000 * 60)) / 1000),
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    const [txnsRes, refsRes, pvRes, wdsRes] = await Promise.all([
      supabase.from('mlm_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('mlm_users').select('id, name, email, phone, package_type, is_active, created_at, pv_points, current_balance, total_income').eq('referrer_id', user.id).order('created_at', { ascending: false }),
      supabase.from('mlm_pv_log').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('mlm_withdrawals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    ]);
    if (txnsRes.data) setTransactions(txnsRes.data);
    if (refsRes.data) setReferrals(refsRes.data);
    if (pvRes.data)   setPvLogs(pvRes.data);
    if (wdsRes.data)  setWithdrawals(wdsRes.data);
    await fetchGenerations(user.id);
  };

  const fetchGenerations = async (userId: string) => {
    const gens: any[][] = [[], [], [], [], []];
    const allMembers: any[] = [];
    const { data: gen1 } = await supabase.from('mlm_users')
      .select('id, name, email, phone, package_type, is_active, pv_points, created_at, current_balance, total_income, referrer_id')
      .eq('referrer_id', userId);
    gens[0] = gen1 || [];
    for (const m of gens[0]) allMembers.push({ ...m, level: 1, upline: user?.name || '' });

    for (let i = 1; i < 5; i++) {
      const parentIds = gens[i - 1].map(u => u.id);
      if (parentIds.length === 0) break;
      const { data } = await supabase.from('mlm_users')
        .select('id, name, email, phone, package_type, is_active, pv_points, created_at, current_balance, total_income, referrer_id')
        .in('referrer_id', parentIds);
      gens[i] = data || [];
      for (const m of gens[i]) {
        const parent = gens[i - 1].find(p => p.id === m.referrer_id);
        allMembers.push({ ...m, level: i + 1, upline: parent?.name || '' });
      }
    }
    setGenerations(gens);
    setNetworkMembers(allMembers);
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const amount = parseInt(withdrawForm.amount);
    if (isNaN(amount) || amount <= 0)        { toast.error('সঠিক পরিমাণ লিখুন'); setLoading(false); return; }
    if (amount < 100)                         { toast.error('সর্বনিম্ন উইথড্রো ৳১০০'); setLoading(false); return; }
    if (amount > (user.current_balance || 0)) { toast.error('পর্যাপ্ত ব্যালেন্স নেই'); setLoading(false); return; }
    if (!withdrawForm.account.trim())         { toast.error('একাউন্ট নম্বর দিন'); setLoading(false); return; }

    const charge    = Math.floor(amount * WITHDRAW_CHARGE_PCT);
    const netAmount = amount - charge;

    const { error } = await supabase.from('mlm_withdrawals').insert({
      user_id: user.id, amount, charge, net_amount: netAmount,
      method: withdrawForm.method, account_number: withdrawForm.account,
    });

    if (!error) {
      await supabase.from('mlm_users').update({ current_balance: (user.current_balance || 0) - amount }).eq('id', user.id);
      await supabase.from('mlm_transactions').insert({
        user_id: user.id, type: 'withdrawal', amount: -amount,
        description: `উইথড্রো অনুরোধ - ${withdrawForm.method} (${withdrawForm.account}) — চার্জ ৳${charge}`,
      });
      toast.success(`✅ উইথড্রো অনুরোধ সফল! নেট পাবেন: ৳${netAmount}`);
      setWithdrawForm({ amount: '', method: 'bkash', account: '' });
      await refreshUser(); fetchData();
    } else {
      toast.error('উইথড্রো করতে সমস্যা হয়েছে');
    }
    setLoading(false);
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const amount = parseInt(transferForm.amount);
    if (isNaN(amount) || amount < TRANSFER_MIN) { toast.error(`সর্বনিম্ন ট্রান্সফার ৳${TRANSFER_MIN}`); setLoading(false); return; }
    if (amount > (user.current_balance || 0))    { toast.error('পর্যাপ্ত ব্যালেন্স নেই'); setLoading(false); return; }
    if (!transferForm.toEmail.trim())            { toast.error('প্রাপকের ইমেইল দিন'); setLoading(false); return; }
    if (transferForm.toEmail === user.email)     { toast.error('নিজেকে ট্রান্সফার করা যাবে না'); setLoading(false); return; }

    const { data: toUser } = await supabase.from('mlm_users')
      .select('id, name, current_balance').eq('email', transferForm.toEmail).single();
    if (!toUser) { toast.error('প্রাপকের ইমেইল পাওয়া যায়নি'); setLoading(false); return; }

    await supabase.from('mlm_users').update({ current_balance: (user.current_balance || 0) - amount }).eq('id', user.id);
    await supabase.from('mlm_users').update({ current_balance: (toUser.current_balance || 0) + amount }).eq('id', toUser.id);
    await supabase.from('mlm_transfers').insert({ from_user_id: user.id, to_user_id: toUser.id, amount });
    await supabase.from('mlm_transactions').insert([
      { user_id: user.id,   type: 'transfer_out', amount: -amount, description: `ট্রান্সফার → ${toUser.name}`,     related_user_id: toUser.id },
      { user_id: toUser.id, type: 'transfer_in',  amount,          description: `ট্রান্সফার প্রাপ্ত ← ${user.name}`, related_user_id: user.id },
    ]);
    toast.success(`✅ ৳${amount} সফলভাবে ${toUser.name} কে ট্রান্সফার হয়েছে`);
    setTransferForm({ amount: '', toEmail: '' });
    await refreshUser(); fetchData(); setLoading(false);
  };

  // ── Balance দিয়ে package কেনা ────────────────────────────────────────────────
  const handleBuyPackageWithBalance = async (packageType: 'customer' | 'shareholder' | 'gold', price: number) => {
    if (!user) return;
    if ((user.current_balance || 0) < price) { toast.error('পর্যাপ্ত ব্যালেন্স নেই'); return; }

    const pkgNames: Record<string, string> = { customer: 'কাস্টমার', shareholder: 'শেয়ারহোল্ডার', gold: 'গোল্ড' };
    const confirmed = window.confirm(`৳${price.toLocaleString()} দিয়ে ${pkgNames[packageType]} প্যাকেজ কিনবেন?`);
    if (!confirmed) return;

    setLoading(true);
    const newBalance = (user.current_balance || 0) - price;
    const { updates: payload, pvPoints, psPoints, gpPoints } = buildPackageActivationPayload(packageType);

    await supabase.from('mlm_users').update({
      ...payload,
      current_balance: newBalance,
    }).eq('id', user.id);

    await supabase.from('mlm_transactions').insert({
      user_id:     user.id,
      type:        'package_purchase',
      amount:      -price,
      description: `ব্যালেন্স থেকে ${pkgNames[packageType]} প্যাকেজ ক্রয় (৳${price.toLocaleString()})`,
    });

    // Club pools only for customer (PV = 1000)
    if (packageType === 'customer' && pvPoints >= MONTHLY_PV_TO_RENEW) {
      await addToClubPools(pvPoints);
    }

    // ✅ Referrer commission immediately
    if (user.referrer_id) {
      const pointsForCommission = packageType === 'customer' ? pvPoints : packageType === 'shareholder' ? psPoints : gpPoints;
      await processReferrerCommission(user.id, user.referrer_id, packageType, pointsForCommission);
    }

    toast.success(`✅ ${pkgNames[packageType]} প্যাকেজ সফলভাবে কেনা হয়েছে!`);
    await refreshUser(); fetchData(); setLoading(false);
  };

  const handleProfileSave = async () => {
    if (!user) return;
    setLoading(true);
    await supabase.from('mlm_users').update({
      name: profileForm.name, phone: profileForm.phone, address: profileForm.address,
      nid_number: profileForm.nid_number, nominee_name: profileForm.nominee_name,
      nominee_phone: profileForm.nominee_phone,
    }).eq('id', user.id);
    toast.success('প্রোফাইল আপডেট সফল');
    setProfileEdit(false); await refreshUser(); setLoading(false);
  };

  const copyReferralLink = () => {
    if (!user) return;
    navigator.clipboard.writeText(`${window.location.origin}/register?ref=${user.id}`);
    toast.success('রেফারাল লিংক কপি হয়েছে!');
  };

  const isExpired  = user ? new Date(user.expires_at) < new Date() : false;
  const daysLeft   = user ? Math.max(0, Math.ceil((new Date(user.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
  const pvProgress = Math.min(100, ((user?.monthly_pv_purchased || 0) / MONTHLY_PV_TO_RENEW) * 100);

  if (!user) return null;

  const sidebarItems = [
    { id: 'overview',     label: 'ওভারভিউ',       icon: <BarChart3 size={18} /> },
    { id: 'network',      label: 'নেটওয়ার্ক',     icon: <Network size={18} /> },
    { id: 'generations',  label: 'জেনারেশন',      icon: <Users size={18} /> },
    { id: 'commission',   label: 'কমিশন',          icon: <TrendingUp size={18} /> },
    { id: 'transactions', label: 'লেনদেন',         icon: <FileText size={18} /> },
    { id: 'withdraw',     label: 'উইথড্রো',        icon: <Wallet size={18} /> },
    { id: 'transfer',     label: 'ট্রান্সফার',     icon: <Send size={18} /> },
    { id: 'buy_package',  label: 'প্যাকেজ কিনুন', icon: <Package size={18} /> },
    { id: 'profile',      label: 'প্রোফাইল',       icon: <User size={18} /> },
  ];

  const totalTeam = generations.reduce((s, g) => s + g.length, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Gold countdown */}
      {user.package_type === 'gold' && user.gold_package_start && (
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Timer size={20} />
              <span className="font-semibold text-sm">গোল্ড প্যাকেজ কাউন্টডাউন:</span>
            </div>
            <div className="flex items-center gap-2">
              {[
                { value: goldCountdown.days,    label: 'দিন' },
                { value: goldCountdown.hours,   label: 'ঘন্টা' },
                { value: goldCountdown.minutes, label: 'মিনিট' },
                { value: goldCountdown.seconds, label: 'সেকেন্ড' },
              ].map((t, i) => (
                <React.Fragment key={i}>
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 text-center min-w-[52px]">
                    <p className="text-lg font-bold">{String(t.value).padStart(2, '0')}</p>
                    <p className="text-[10px]">{t.label}</p>
                  </div>
                  {i < 3 && <span className="text-xl font-bold">:</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Expiry warnings */}
      {isExpired && user.package_type !== 'gold' && (
        <div className="bg-red-500 text-white text-center py-3 text-sm font-medium">
          আপনার আইডির মেয়াদ শেষ! মাসে ১০০ PV পণ্য কিনলে রিনিউ হবে।{' '}
          <Link to="/shop" className="underline font-bold">শপে যান</Link>
        </div>
      )}
      {!isExpired && daysLeft <= 7 && user.package_type === 'customer' && (
        <div className="bg-yellow-500 text-white text-center py-2 text-sm">
          আপনার আইডির মেয়াদ {daysLeft} দিন বাকি — মাসে ১০০ PV কিনলে রিনিউ হবে
        </div>
      )}

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white border-r border-gray-200 min-h-[calc(100vh-64px)] transition-all duration-300 hidden lg:block`}>
          <div className="p-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 mb-4">
              {sidebarOpen ? <ChevronDown size={18} className="rotate-90" /> : <ChevronUp size={18} className="rotate-90" />}
            </button>
            <nav className="space-y-1">
              {sidebarItems.map(item => (
                <button key={item.id} onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>
                  {item.icon}
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 p-4 lg:p-8 max-w-full overflow-x-hidden">
          {/* Mobile tabs */}
          <div className="flex flex-wrap gap-2 mb-6 lg:hidden bg-white rounded-xl p-1.5 shadow-sm border border-gray-100 overflow-x-auto">
            {sidebarItems.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">স্বাগতম, {user.name}!</h1>
              <p className="text-gray-500 text-sm">
                {user.package_type === 'customer' ? 'কাস্টমার' : user.package_type === 'shareholder' ? 'শেয়ারহোল্ডার' : 'গোল্ড'} প্যাকেজ
                {' • '}{user.is_active ? <span className="text-green-600 font-medium">সক্রিয়</span> : <span className="text-red-600 font-medium">নিষ্ক্রিয়</span>}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={copyReferralLink} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">
                <Share2 size={16} /> রেফার লিংক কপি
              </button>
              <Link to="/shop" className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700">
                <Package size={16} /> শপ
              </Link>
            </div>
          </div>

          {/* PV Progress — customer only */}
          {user.package_type === 'customer' && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white">
                    <Target size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">মাসিক PV লক্ষ্যমাত্রা</h3>
                    <p className="text-xs text-gray-500">আইডি রিনিউর জন্য মাসে {MONTHLY_PV_TO_RENEW} PV প্রয়োজন</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {user.monthly_pv_purchased || 0}<span className="text-sm text-gray-400">/{MONTHLY_PV_TO_RENEW} PV</span>
                </p>
              </div>
              <div className="relative w-full h-5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${pvProgress >= 100 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
                  style={{ width: `${pvProgress}%` }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-white drop-shadow">{Math.round(pvProgress)}%</span>
                </div>
              </div>
              {pvProgress >= 100
                ? <p className="text-xs text-green-600 font-medium mt-2">✅ লক্ষ্যমাত্রা পূরণ! আইডি রিনিউ হবে।</p>
                : <p className="text-xs text-gray-500 mt-2">আরও {MONTHLY_PV_TO_RENEW - (user.monthly_pv_purchased || 0)} PV প্রয়োজন। <Link to="/shop" className="text-indigo-600 font-medium hover:underline">পণ্য কিনুন</Link></p>
              }
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'কারেন্ট ব্যালেন্স', value: `৳${(user.current_balance || 0).toLocaleString()}`, icon: <Wallet size={22} />,    color: 'from-blue-500 to-cyan-500' },
              { label: 'টোটাল ইনকাম',      value: `৳${(user.total_income || 0).toLocaleString()}`,   icon: <TrendingUp size={22} />, color: 'from-green-500 to-emerald-500' },
              { label: 'ডিরেক্ট রেফারাল',  value: user.direct_referrals_count || 0,                   icon: <Users size={22} />,     color: 'from-purple-500 to-pink-500' },
              { label: 'মোট টিম',          value: totalTeam,                                           icon: <Network size={22} />,   color: 'from-orange-500 to-red-500' },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className={`w-11 h-11 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-white mb-3`}>{stat.icon}</div>
                <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Club status */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            {[
              { label: 'ডেইলি ক্লাব',         active: user.is_daily_club,       icon: <Gift size={18} />,   note: 'PV এর ৩০%' },
              { label: 'উইকলি ক্লাব',         active: user.is_weekly_club,      icon: <Clock size={18} />,  note: '১৫ রেফারে' },
              { label: 'ইনসুরেন্স ক্লাব',    active: user.is_insurance_club,   icon: <Shield size={18} />, note: '১৫ weekly refs' },
              { label: 'পেনশন ক্লাব',         active: user.is_pension_club,     icon: <Crown size={18} />,  note: '১৫ weekly refs' },
              { label: 'শেয়ারহোল্ডার ক্লাব', active: user.is_shareholder_club, icon: <Award size={18} />,  note: 'Shareholder only' },
            ].map((club, i) => (
              <div key={i} className={`rounded-xl p-4 border ${club.active ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={club.active ? 'text-green-600' : 'text-gray-400'}>{club.icon}</span>
                  <span className="text-xs font-medium text-gray-700">{club.label}</span>
                </div>
                <span className={`text-xs font-bold ${club.active ? 'text-green-600' : 'text-gray-400'}`}>
                  {club.active ? '✅ সদস্য' : `❌ (${club.note})`}
                </span>
              </div>
            ))}
          </div>

          {/* Gold bakeya */}
          {user.package_type === 'gold' && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-6">
              <div className="flex items-center gap-3">
                <Award size={24} className="text-orange-600" />
                <div>
                  <p className="font-semibold text-orange-800">বকেয়া হিসাব (দৈনিক জমা হচ্ছে)</p>
                  <p className="text-2xl font-bold text-orange-600">৳{(user.bakeya_amount || 0).toLocaleString()}</p>
                  <p className="text-xs text-orange-500 mt-1">মোট বকেয়া: ৳৩৬,০০০ | প্যাকেজ বাতিল করতে এই পরিমাণ পরিশোধ করতে হবে</p>
                </div>
              </div>
            </div>
          )}

          {/* Main content */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

            {activeTab === 'overview' && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">একাউন্ট তথ্য</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    {[
                      { label: 'আইডি',     value: user.id.slice(0, 12) + '...' },
                      { label: 'ইমেইল',   value: user.email },
                      { label: 'ফোন',     value: user.phone },
                      { label: 'প্যাকেজ', value: user.package_type === 'customer' ? 'কাস্টমার' : user.package_type === 'shareholder' ? 'শেয়ারহোল্ডার' : 'গোল্ড' },
                      { label: 'মেয়াদ',  value: isExpired ? '⚠️ মেয়াদ শেষ' : `${daysLeft} দিন বাকি` },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-500">{item.label}</span>
                        <span className="text-sm font-medium text-gray-700">{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'PV পয়েন্ট',           value: user.pv_points || 0 },
                      { label: 'PS পয়েন্ট',           value: user.ps_points || 0 },
                      { label: 'GP পয়েন্ট',           value: user.gp_points || 0 },
                      { label: 'মাসিক PV ক্রয়',       value: `${user.monthly_pv_purchased || 0}/${MONTHLY_PV_TO_RENEW}` },
                      { label: 'গোল্ড রেফার পেন্ডিং', value: `৳${(user.gold_referral_pending || 0).toLocaleString()}` },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-500">{item.label}</span>
                        <span className="text-sm font-bold text-gray-700">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-6 bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                  <h3 className="font-semibold text-sm text-indigo-800 mb-2">আপনার রেফারাল লিংক</h3>
                  <div className="flex items-center gap-2">
                    <input readOnly value={`${window.location.origin}/register?ref=${user.id}`}
                      className="flex-1 px-3 py-2 bg-white rounded-lg border text-xs font-mono text-gray-600" />
                    <button onClick={copyReferralLink} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700 flex items-center gap-1">
                      <Copy size={14} /> কপি
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'network' && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">নেটওয়ার্ক সামারি</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                  <div className="bg-indigo-50 rounded-xl p-4 text-center border border-indigo-100">
                    <p className="text-2xl font-bold text-indigo-700">{totalTeam}</p>
                    <p className="text-xs text-gray-600 font-medium">মোট Member</p>
                  </div>
                  {generations.map((gen, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
                      <p className="text-2xl font-bold text-gray-800">{gen.length}</p>
                      <p className="text-xs text-gray-600 font-medium">Level {i + 1}</p>
                    </div>
                  ))}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                      <th className="text-left py-3 px-4 text-xs rounded-tl-lg">নাম</th>
                      <th className="text-left py-3 px-4 text-xs">আপলাইন</th>
                      <th className="text-center py-3 px-4 text-xs">লেভেল</th>
                      <th className="text-right py-3 px-4 text-xs">আয়</th>
                      <th className="text-right py-3 px-4 text-xs rounded-tr-lg">ব্যালেন্স</th>
                    </tr></thead>
                    <tbody>
                      {networkMembers.length === 0
                        ? <tr><td colSpan={5} className="text-center py-8 text-gray-400 text-sm">কোন সদস্য নেই — রেফার করুন!</td></tr>
                        : networkMembers.map((m, i) => (
                          <tr key={m.id} className={`border-b border-gray-50 ${i%2===0?'bg-white':'bg-gray-50'} hover:bg-indigo-50`}>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${m.is_active?'bg-green-500':'bg-red-400'}`}>
                                  {m.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{m.name}</p>
                                  <p className="text-[10px] text-gray-400">{m.phone || m.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-xs text-gray-600">{m.upline}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${m.level===1?'bg-blue-100 text-blue-700':m.level===2?'bg-purple-100 text-purple-700':m.level===3?'bg-green-100 text-green-700':m.level===4?'bg-orange-100 text-orange-700':'bg-red-100 text-red-700'}`}>
                                L{m.level}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-green-600">৳{(m.total_income||0).toLocaleString()}</td>
                            <td className="py-3 px-4 text-right font-bold text-indigo-600">৳{(m.current_balance||0).toLocaleString()}</td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'generations' && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">জেনারেশন টেবিল</h2>
                <p className="text-xs text-gray-500 mb-4">PV product sales এর উপর ১% generation bonus (৫ level)</p>
                {generations.map((gen, i) => (
                  <div key={i} className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${i===0?'bg-blue-100 text-blue-700':i===1?'bg-purple-100 text-purple-700':i===2?'bg-green-100 text-green-700':i===3?'bg-orange-100 text-orange-700':'bg-red-100 text-red-700'}`}>
                        জেনারেশন {i + 1}
                      </span>
                      <span className="text-xs text-gray-500">{gen.length} জন</span>
                    </div>
                    {gen.length === 0 ? <p className="text-xs text-gray-400 py-2 pl-2">কোন সদস্য নেই</p> : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead><tr className="bg-gray-50">
                            {['নাম','ফোন','প্যাকেজ','PV','স্ট্যাটাস'].map(h => (
                              <th key={h} className="text-left py-2 px-3 text-xs font-medium text-gray-500">{h}</th>
                            ))}
                          </tr></thead>
                          <tbody>
                            {gen.map((member: any) => (
                              <tr key={member.id} className="border-b border-gray-50 hover:bg-gray-50">
                                <td className="py-2 px-3">{member.name}</td>
                                <td className="py-2 px-3 text-xs text-gray-500">{member.phone || member.email}</td>
                                <td className="py-2 px-3">
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${member.package_type==='gold'?'bg-yellow-100 text-yellow-700':member.package_type==='shareholder'?'bg-purple-100 text-purple-700':'bg-blue-100 text-blue-700'}`}>
                                    {member.package_type==='customer'?'কাস্টমার':member.package_type==='shareholder'?'শেয়ারহোল্ডার':'গোল্ড'}
                                  </span>
                                </td>
                                <td className="py-2 px-3 font-medium">{member.pv_points || 0}</td>
                                <td className="py-2 px-3"><span className={`text-xs font-medium ${member.is_active?'text-green-600':'text-red-500'}`}>{member.is_active?'✅ সক্রিয়':'❌ নিষ্ক্রিয়'}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'commission' && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">কমিশন বিবরণ</h2>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5 text-xs text-blue-800 space-y-1">
                  <p>✅ Customer রেফার: ৫% (৳৫০) — আইডি activate হলেই সাথে সাথে</p>
                  <p>✅ Shareholder রেফার: ২.৫% (৳১২৫) — আইডি activate হলেই সাথে সাথে</p>
                  <p>✅ Gold রেফার: ৳১,৮০০ মোট — ৳৪.৯৩/দিন করে ৩৬৫ দিনে</p>
                  <p>✅ Generation bonus: PV sales এর ১% × ৫ level</p>
                </div>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                    <h3 className="font-bold text-blue-800 mb-3">ডিরেক্ট রেফার কমিশন</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between py-2 border-b border-blue-100">
                        <span className="text-gray-600">মোট রেফার ইনকাম</span>
                        <span className="font-bold text-blue-700">৳{transactions.filter(t=>t.type==='referral_income'&&t.amount>0).reduce((s,t)=>s+t.amount,0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-blue-100">
                        <span className="text-gray-600">গোল্ড রেফার মোট</span>
                        <span className="font-bold text-yellow-600">৳{(user.gold_referral_income||0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">গোল্ড রেফার পেন্ডিং</span>
                        <span className="font-bold text-orange-600">৳{(user.gold_referral_pending||0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
                    <h3 className="font-bold text-green-800 mb-1">জেনারেশন বোনাস</h3>
                    <p className="text-xs text-green-600 mb-3">১% × ৫ লেভেল — শুধু PV product sales এ</p>
                    <div className="space-y-2 text-sm">
                      {[1,2,3,4,5].map(level => {
                        const genBonus = transactions.filter(t=>t.type==='generation_bonus'&&t.description?.includes(`জেনারেশন ${level}`)).reduce((s,t)=>s+Math.max(0,t.amount),0);
                        return (
                          <div key={level} className="flex justify-between py-1 border-b border-green-100">
                            <span className="text-gray-600">জেনারেশন {level}</span>
                            <span className="font-bold text-green-700">৳{genBonus.toLocaleString()}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
                  <h3 className="font-bold text-purple-800 mb-3">ক্লাব বোনাস</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                    {['daily_club','weekly_club','insurance_club','pension_club','shareholder_club'].map(club => {
                      const clubBonus = transactions.filter(t=>t.type===club&&t.amount>0).reduce((s,t)=>s+t.amount,0);
                      const labels: Record<string,string> = { daily_club:'ডেইলি', weekly_club:'উইকলি', insurance_club:'ইনসুরেন্স', pension_club:'পেনশন', shareholder_club:'শেয়ারহোল্ডার' };
                      return (
                        <div key={club} className="text-center bg-white rounded-lg p-3 shadow-sm">
                          <p className="text-xs text-gray-500 mb-1">{labels[club]}</p>
                          <p className="font-bold text-purple-700">৳{clubBonus.toLocaleString()}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'transactions' && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">লেনদেনের ইতিহাস</h2>
                {transactions.length === 0
                  ? <p className="text-gray-400 text-center py-8">কোন লেনদেন নেই</p>
                  : (
                    <div className="space-y-2">
                      {transactions.map(txn => (
                        <div key={txn.id} className="flex items-center justify-between py-3 px-4 rounded-xl bg-gray-50 hover:bg-gray-100">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${txn.amount>=0?'bg-green-100 text-green-600':'bg-red-100 text-red-600'}`}>
                              {txn.amount>=0?<ArrowDownRight size={16} />:<ArrowUpRight size={16} />}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">{txn.description}</p>
                              <p className="text-xs text-gray-400">{txn.type} • {new Date(txn.created_at).toLocaleDateString('bn-BD')}</p>
                            </div>
                          </div>
                          <span className={`font-bold text-sm ${txn.amount>=0?'text-green-600':'text-red-600'}`}>
                            {txn.amount>=0?'+':''}৳{Math.abs(txn.amount).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                }
              </div>
            )}

            {activeTab === 'withdraw' && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">উইথড্রো</h2>
                <p className="text-sm text-gray-500 mb-4">চার্জ: ৫% | সর্বনিম্ন: ৳১০০ | উপলব্ধ: <span className="font-bold text-green-600">৳{(user.current_balance || 0).toLocaleString()}</span></p>
                <div className="grid lg:grid-cols-2 gap-8">
                  <form onSubmit={handleWithdraw} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">পরিমাণ (৳)</label>
                      <input type="number" min="100" value={withdrawForm.amount}
                        onChange={e => setWithdrawForm({...withdrawForm,amount:e.target.value})} required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none text-sm"
                        placeholder="সর্বনিম্ন ৳১০০" />
                      {withdrawForm.amount && parseInt(withdrawForm.amount) >= 100 && (
                        <p className="text-xs text-gray-500 mt-1">
                          চার্জ (৫%): ৳{Math.floor(parseInt(withdrawForm.amount)*WITHDRAW_CHARGE_PCT)} | পাবেন: ৳{parseInt(withdrawForm.amount)-Math.floor(parseInt(withdrawForm.amount)*WITHDRAW_CHARGE_PCT)}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">মাধ্যম</label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { key: 'bkash',  label: 'বিকাশ', color: '#E2136E' },
                          { key: 'nagad',  label: 'নগদ',   color: '#F6921E' },
                          { key: 'rocket', label: 'রকেট',  color: '#8B2F8B' },
                          { key: 'bank',   label: 'ব্যাংক', color: '#1a56db' },
                        ].map(m => (
                          <button key={m.key} type="button" onClick={() => setWithdrawForm({...withdrawForm,method:m.key})}
                            className={`py-3 rounded-xl text-xs font-bold border-2 transition-all ${withdrawForm.method===m.key?'text-white shadow-lg':'bg-white text-gray-600 border-gray-200'}`}
                            style={withdrawForm.method===m.key?{backgroundColor:m.color,borderColor:m.color}:{}}>{m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">একাউন্ট নম্বর</label>
                      <input type="text" value={withdrawForm.account}
                        onChange={e => setWithdrawForm({...withdrawForm,account:e.target.value})} required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none text-sm"
                        placeholder="একাউন্ট নম্বর" />
                    </div>
                    <button type="submit" disabled={loading}
                      className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50">
                      {loading?'প্রসেসিং...':'উইথড্রো অনুরোধ করুন'}
                    </button>
                  </form>
                  <div>
                    <h3 className="font-semibold text-sm text-gray-700 mb-3">উইথড্রো ইতিহাস</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {withdrawals.length === 0
                        ? <p className="text-gray-400 text-center py-4 text-xs">কোন উইথড্রো নেই</p>
                        : withdrawals.map(wd => (
                          <div key={wd.id} className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-lg text-xs">
                            <div>
                              <p className="font-medium">{wd.method?.toUpperCase()} - {wd.account_number}</p>
                              <p className="text-gray-400">{new Date(wd.created_at).toLocaleDateString('bn-BD')}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">৳{wd.net_amount}</p>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${wd.status==='approved'?'bg-green-100 text-green-700':wd.status==='rejected'?'bg-red-100 text-red-700':'bg-yellow-100 text-yellow-700'}`}>
                                {wd.status==='approved'?'অনুমোদিত':wd.status==='rejected'?'প্রত্যাখ্যাত':'পেন্ডিং'}
                              </span>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'transfer' && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">আইডি টু আইডি ট্রান্সফার</h2>
                <p className="text-sm text-gray-500 mb-4">সর্বনিম্ন: ৳{TRANSFER_MIN} | উপলব্ধ: <span className="font-bold text-green-600">৳{(user.current_balance||0).toLocaleString()}</span></p>
                <form onSubmit={handleTransfer} className="max-w-md space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">প্রাপকের ইমেইল</label>
                    <input type="email" value={transferForm.toEmail}
                      onChange={e => setTransferForm({...transferForm,toEmail:e.target.value})} required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none text-sm"
                      placeholder="প্রাপকের ইমেইল" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">পরিমাণ (৳)</label>
                    <input type="number" min={TRANSFER_MIN} value={transferForm.amount}
                      onChange={e => setTransferForm({...transferForm,amount:e.target.value})} required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none text-sm"
                      placeholder={`সর্বনিম্ন ৳${TRANSFER_MIN}`} />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50">
                    {loading?'প্রসেসিং...':'ট্রান্সফার করুন'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'buy_package' && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">ব্যালেন্স দিয়ে প্যাকেজ কিনুন</h2>
                <p className="text-sm text-gray-500 mb-6">
                  উপলব্ধ ব্যালেন্স: <span className="font-bold text-green-600">৳{(user.current_balance || 0).toLocaleString()}</span>
                </p>
                <div className="grid md:grid-cols-3 gap-6">
                  {([
                    {
                      type: 'customer' as const,
                      name: 'কাস্টমার প্যাকেজ', price: 1000,
                      points: '১,০০০ PV', color: 'from-blue-500 to-cyan-600',
                      clubs: ['ডেইলি ক্লাব (PV এর ৩০%)'],
                      note: 'মাসে ১০০ PV কিনলে রিনিউ | ৫% রেফার কমিশন',
                    },
                    {
                      type: 'shareholder' as const,
                      name: 'শেয়ারহোল্ডার প্যাকেজ', price: 5000,
                      points: '৫,০০০ SP', color: 'from-purple-500 to-pink-600',
                      clubs: ['শেয়ারহোল্ডার ক্লাব (PV এর ১০%)'],
                      note: 'কোনো PV নেই | ২.৫% রেফার কমিশন',
                    },
                    {
                      type: 'gold' as const,
                      name: 'গোল্ড প্যাকেজ', price: 100000,
                      points: '১,০০,০০০ GP', color: 'from-yellow-500 to-orange-600',
                      clubs: [],
                      note: 'রেফারার পায় ৳১,৮০০ | বায়ার বকেয়া ৳৩৬,০০০',
                    },
                  ] as const).map(pkg => {
                    const canAfford = (user.current_balance || 0) >= pkg.price;
                    return (
                      <div key={pkg.type} className={`bg-white rounded-2xl border-2 p-6 shadow-sm hover:shadow-md transition-all ${canAfford ? 'border-gray-100' : 'border-gray-50 opacity-75'}`}>
                        <div className={`w-12 h-12 bg-gradient-to-br ${pkg.color} rounded-xl flex items-center justify-center text-white mb-4`}>
                          <Package size={22} />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1">{pkg.name}</h3>
                        <p className="text-sm text-gray-500 mb-2">{pkg.points}</p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {pkg.clubs.length > 0
                            ? pkg.clubs.map((c, idx) => <span key={idx} className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full">{c}</span>)
                            : <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">কোনো ক্লাব নেই</span>
                          }
                        </div>
                        <p className="text-xs text-gray-400 mb-3">{pkg.note}</p>
                        <p className="text-2xl font-bold text-gray-900 mb-4">৳{pkg.price.toLocaleString()}</p>
                        {!canAfford && (
                          <p className="text-xs text-red-500 mb-2">আরও ৳{(pkg.price-(user.current_balance||0)).toLocaleString()} প্রয়োজন</p>
                        )}
                        <button
                          onClick={() => handleBuyPackageWithBalance(pkg.type, pkg.price)}
                          disabled={loading || !canAfford}
                          className={`w-full py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r ${pkg.color} hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all`}>
                          {loading ? 'প্রসেসিং...' : !canAfford ? 'ব্যালেন্স কম' : 'ব্যালেন্স দিয়ে কিনুন'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">প্রোফাইল</h2>
                  {!profileEdit
                    ? <button onClick={() => setProfileEdit(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"><Edit size={14} /> এডিট</button>
                    : (
                      <div className="flex gap-2">
                        <button onClick={() => setProfileEdit(false)} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50"><X size={14} /></button>
                        <button onClick={handleProfileSave} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"><Save size={14} /> সেভ</button>
                      </div>
                    )
                  }
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { label: 'নাম',        key: 'name' },
                    { label: 'ফোন',       key: 'phone' },
                    { label: 'ঠিকানা',    key: 'address' },
                    { label: 'NID নম্বর', key: 'nid_number' },
                    { label: 'নমিনি নাম', key: 'nominee_name' },
                    { label: 'নমিনি ফোন', key: 'nominee_phone' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="block text-xs font-medium text-gray-500 mb-1">{field.label}</label>
                      {profileEdit
                        ? <input value={(profileForm as any)[field.key]||''}
                            onChange={e => setProfileForm({...profileForm,[field.key]:e.target.value})}
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-indigo-500 outline-none" />
                        : <p className="px-3 py-2.5 bg-gray-50 rounded-lg text-sm text-gray-700">{(profileForm as any)[field.key]||'—'}</p>
                      }
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}