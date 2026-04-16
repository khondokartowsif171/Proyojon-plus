import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Wallet, TrendingUp, Gift, Users, Copy, Check, ArrowDownToLine,
  ArrowRightLeft, Crown, Award, Clock, RefreshCw,
  Star, Shield, LogOut, ShoppingBag,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Gold countdown timer ──────────────────────────────────────────────────────
function GoldCountdown({ startDate }: { startDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 365);

    const tick = () => {
      const diff = endDate.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
      setTimeLeft({
        days:    Math.floor(diff / 86400000),
        hours:   Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000)  / 60000),
        seconds: Math.floor((diff % 60000)    / 1000),
      });
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startDate]);

  return (
    <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl p-5 mb-6 text-white">
      <div className="flex items-center gap-2 mb-3">
        <Clock size={20} />
        <h3 className="font-bold">গোল্ড প্যাকেজ কাউন্টডাউন</h3>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[
          { value: timeLeft.days,    label: 'দিন' },
          { value: timeLeft.hours,   label: 'ঘণ্টা' },
          { value: timeLeft.minutes, label: 'মিনিট' },
          { value: timeLeft.seconds, label: 'সেকেন্ড' },
        ].map((item, i) => (
          <div key={i} className="bg-white/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold tabular-nums">{String(item.value).padStart(2, '0')}</p>
            <p className="text-xs opacity-80">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function UserDashboard() {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();

  const [activeTab,    setActiveTab]    = useState('overview');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [generations,  setGenerations]  = useState<any[]>([]);
  const [withdrawals,  setWithdrawals]  = useState<any[]>([]);
  const [clubPools,    setClubPools]    = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [copied,       setCopied]       = useState(false);

  // Withdrawal form
  const [wdMethod,  setWdMethod]  = useState('bkash');
  const [wdAccount, setWdAccount] = useState('');
  const [wdAmount,  setWdAmount]  = useState('');
  const [wdLoading, setWdLoading] = useState(false);

  // Transfer form
  const [trfToId,    setTrfToId]    = useState('');
  const [trfAmount,  setTrfAmount]  = useState('');
  const [trfLoading, setTrfLoading] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const [txRes, wdRes, poolRes] = await Promise.all([
      supabase.from('mlm_transactions')
        .select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(50),
      supabase.from('mlm_withdrawals')
        .select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(20),
      supabase.from('mlm_club_pools').select('*'),
    ]);

    if (txRes.data)   setTransactions(txRes.data);
    if (wdRes.data)   setWithdrawals(wdRes.data);
    if (poolRes.data) setClubPools(poolRes.data);

    await buildGenerationTable();
    setLoading(false);
  };

  const buildGenerationTable = async () => {
    if (!user) return;
    const table: { gen: number; members: any[] }[] = [];

    const { data: gen1 } = await supabase
      .from('mlm_users')
      .select('id, name, phone, package_type, is_active, pv_points, total_income, created_at')
      .eq('referrer_id', user.id);

    if (!gen1?.length) { setGenerations([]); return; }
    table.push({ gen: 1, members: gen1 });

    let prevIds = gen1.map(u => u.id);
    for (let g = 2; g <= 5; g++) {
      if (!prevIds.length) break;
      const { data: genN } = await supabase
        .from('mlm_users')
        .select('id, name, phone, package_type, is_active, pv_points, total_income, created_at')
        .in('referrer_id', prevIds);
      if (genN?.length) {
        table.push({ gen: g, members: genN });
        prevIds = genN.map(u => u.id);
      } else break;
    }

    setGenerations(table);
  };

  // ── Withdrawal ────────────────────────────────────────────────────────────
  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const amount = parseFloat(wdAmount);
    if (isNaN(amount) || amount < 100) { toast.error('সর্বনিম্ন উইথড্রো ৳১০০'); return; }
    if (amount > (user.current_balance || 0)) { toast.error('ব্যালেন্স যথেষ্ট নয়'); return; }
    if (!wdAccount.trim()) { toast.error('একাউন্ট নম্বর দিন'); return; }

    const charge    = Math.ceil(amount * 0.05);
    const netAmount = amount - charge;

    setWdLoading(true);

    const { error: balErr } = await supabase.from('mlm_users')
      .update({ current_balance: (user.current_balance || 0) - amount })
      .eq('id', user.id);

    if (balErr) { toast.error('সমস্যা হয়েছে: ' + balErr.message); setWdLoading(false); return; }

    await Promise.all([
      supabase.from('mlm_withdrawals').insert({
        user_id:        user.id,
        amount,
        charge,
        net_amount:     netAmount,
        method:         wdMethod,
        account_number: wdAccount.trim(),
        status:         'pending',
      }),
      supabase.from('mlm_transactions').insert({
        user_id:     user.id,
        type:        'withdrawal_request',
        amount:      -amount,
        description: `উইথড্রো অনুরোধ — ${wdMethod} — ${wdAccount.trim()} (চার্জ: ৳${charge})`,
      }),
    ]);

    toast.success(`✅ উইথড্রো অনুরোধ জমা! নেট: ৳${netAmount}`);
    setWdAmount(''); setWdAccount('');
    await refreshUser();
    await fetchData();
    setWdLoading(false);
  };

  // ── ID-to-ID Transfer ─────────────────────────────────────────────────────
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const amount = parseFloat(trfAmount);
    if (isNaN(amount) || amount < 100) { toast.error('সর্বনিম্ন ট্রান্সফার ৳১০০'); return; }
    if (amount > (user.current_balance || 0)) { toast.error('ব্যালেন্স যথেষ্ট নয়'); return; }
    if (!trfToId.trim()) { toast.error('প্রাপকের আইডি দিন'); return; }
    if (trfToId.trim() === user.id) { toast.error('নিজের আইডিতে ট্রান্সফার করা যাবে না'); return; }

    setTrfLoading(true);

    const { data: recipient } = await supabase
      .from('mlm_users')
      .select('id, name, current_balance')
      .eq('id', trfToId.trim())
      .single();

    if (!recipient) { toast.error('প্রাপকের আইডি পাওয়া যায়নি'); setTrfLoading(false); return; }

    await Promise.all([
      supabase.from('mlm_users')
        .update({ current_balance: (user.current_balance || 0) - amount })
        .eq('id', user.id),
      supabase.from('mlm_users')
        .update({ current_balance: (recipient.current_balance || 0) + amount })
        .eq('id', recipient.id),
    ]);

    await supabase.from('mlm_transactions').insert([
      { user_id: user.id,      type: 'transfer_out', amount: -amount, description: `ট্রান্সফার → ${recipient.name} (৳${amount})`, related_user_id: recipient.id },
      { user_id: recipient.id, type: 'transfer_in',  amount,          description: `ট্রান্সফার ← ${user.name} (৳${amount})`,    related_user_id: user.id },
    ]);

    toast.success(`✅ ৳${amount} সফলভাবে ${recipient.name}-কে পাঠানো হয়েছে!`);
    setTrfAmount(''); setTrfToId('');
    await refreshUser();
    await fetchData();
    setTrfLoading(false);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const copyReferralLink = () => {
    if (!user) return;
    navigator.clipboard.writeText(`${window.location.origin}/register?ref=${user.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('রেফারেল লিংক কপি হয়েছে!');
  };

  const getClubPool  = (type: string) => clubPools.find(p => p.club_type === type)?.total_amount || 0;
  const sumByType    = (type: string) => transactions.filter(t => t.type === type).reduce((s, t) => s + (t.amount || 0), 0);
  const sumByTypes   = (types: string[]) => transactions.filter(t => types.includes(t.type)).reduce((s, t) => s + (t.amount || 0), 0);

  const daysLeft = user?.expires_at
    ? Math.max(0, Math.ceil((new Date(user.expires_at).getTime() - Date.now()) / 86400000))
    : 0;

  const pkgColor = user?.package_type === 'gold'        ? 'from-yellow-500 to-orange-600'
                 : user?.package_type === 'shareholder' ? 'from-purple-500 to-pink-600'
                 : 'from-blue-500 to-cyan-600';

  const pkgLabel = user?.package_type === 'gold'        ? 'গোল্ড'
                 : user?.package_type === 'shareholder' ? 'শেয়ারহোল্ডার'
                 : 'কাস্টমার';

  if (!user) return null;

  const wdMethods = [
    { key: 'bkash',  label: 'বিকাশ',  color: '#E2136E', placeholder: '০১XXXXXXXXX' },
    { key: 'nagad',  label: 'নগদ',    color: '#F6921E', placeholder: '০১XXXXXXXXX' },
    { key: 'rocket', label: 'রকেট',   color: '#8B2F8B', placeholder: '০১XXXXXXXXX' },
    { key: 'bank',   label: 'ব্যাংক', color: '#1E40AF', placeholder: 'ব্যাংক একাউন্ট নম্বর' },
  ];

  const genColors = ['bg-blue-600','bg-indigo-500','bg-purple-500','bg-pink-500','bg-orange-500'];

  const tabs = [
    { id: 'overview',    label: 'ওভারভিউ' },
    { id: 'income',      label: 'ইনকাম' },
    { id: 'generations', label: 'জেনারেশন' },
    { id: 'clubs',       label: 'ক্লাব' },
    { id: 'withdraw',    label: 'উইথড্রো' },
    { id: 'transfer',    label: 'ট্রান্সফার' },
    { id: 'history',     label: 'ইতিহাস' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Gold countdown */}
        {user.package_type === 'gold' && user.gold_package_start && (
          <GoldCountdown startDate={user.gold_package_start} />
        )}

        {/* User banner */}
        <div className={`bg-gradient-to-r ${pkgColor} rounded-2xl p-6 mb-6 text-white`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-extrabold">
                {user.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold">{user.name}</h1>
                <p className="text-white/80 text-sm">{user.email} • {user.phone}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{pkgLabel} প্যাকেজ</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${user.is_active ? 'bg-green-400/30' : 'bg-red-400/40'}`}>
                    {user.is_active ? '✓ সক্রিয়' : '✗ নিষ্ক্রিয়'}
                  </span>
                  {user.package_type === 'customer' && user.is_active && (
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{daysLeft} দিন বাকি</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {user.package_type === 'customer' && (
                <div className="text-right hidden md:block">
                  <p className="text-white/70 text-xs">
                    {(user.pv_points || 0) >= 1000 ? 'মাসিক PV (নবায়ন)' : 'মোট PV (প্রথম সক্রিয়করণ)'}
                  </p>
                  <p className="font-bold">
                    {(user.pv_points || 0) >= 1000
                      ? `${user.monthly_pv_purchased || 0} / 100`
                      : `${user.pv_points || 0} / 1000`
                    }
                  </p>
                </div>
              )}
              <button onClick={copyReferralLink}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/20 rounded-xl text-sm font-medium hover:bg-white/30 transition-all">
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'কপি হয়েছে!' : 'রেফার লিংক'}
              </button>
              <button onClick={fetchData} className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-all">
                <RefreshCw size={14} />
              </button>
              <button onClick={() => { logout(); navigate('/'); }}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/20 rounded-xl text-sm font-medium hover:bg-white/30 transition-all">
                <LogOut size={14} /> লগআউট
              </button>
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'কারেন্ট ব্যালেন্স', value: `৳${(user.current_balance || 0).toLocaleString()}`,  icon: <Wallet size={20} />,     color: 'from-green-500 to-emerald-600' },
            { label: 'মোট ইনকাম',          value: `৳${(user.total_income || 0).toLocaleString()}`,     icon: <TrendingUp size={20} />, color: 'from-blue-500 to-indigo-600' },
            { label: 'ডিরেক্ট রেফার',      value: `${user.direct_referrals_count || 0} জন`,           icon: <Users size={20} />,      color: 'from-purple-500 to-pink-600' },
            {
              label: user.package_type === 'customer' ? 'PV পয়েন্ট' : user.package_type === 'shareholder' ? 'SP পয়েন্ট' : 'GP পয়েন্ট',
              value: String(user.package_type === 'customer' ? (user.pv_points || 0) : user.package_type === 'shareholder' ? (user.ps_points || 0) : (user.gp_points || 0)),
              icon: <Star size={20} />, color: 'from-orange-500 to-red-600',
            },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className={`w-10 h-10 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center text-white mb-3`}>{s.icon}</div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Inactive warning */}
        {!user.is_active && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-800 font-semibold text-sm">⚠️ আপনার আইডি নিষ্ক্রিয় — কোনো ইনকাম জমা হবে না</p>
            {user.package_type === 'customer' && (
              <p className="text-red-700 text-xs mt-1">
                {!user.activated_at
                  ? 'প্রথমবার সক্রিয় করতে ১,০০০ PV মূল্যের পণ্য কিনুন।'
                  : 'পুনরায় সক্রিয় করতে মাসে ১০০ PV মূল্যের পণ্য কিনুন।'}
              </p>
            )}
            <Link to="/shop" className="inline-block mt-2 px-4 py-2 bg-red-600 text-white text-xs rounded-lg font-medium hover:bg-red-700">
              শপে যান →
            </Link>
          </div>
        )}

        {/* Gold bakeya */}
        {user.package_type === 'gold' && (user.bakeya_amount || 0) > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <p className="text-yellow-800 font-semibold text-sm">বকেয়া হিসাব</p>
            <p className="text-yellow-700 text-xs mt-1">
              বর্তমান বকেয়া: <span className="font-bold">৳{(user.bakeya_amount || 0).toLocaleString()}</span>
            </p>
            <p className="text-yellow-600 text-xs">প্যাকেজ বাতিলের আগে এই বকেয়া এডমিনকে পরিশোধ করতে হবে।</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

          {/* ── OVERVIEW ────────────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-lg font-bold mb-5">আমার আইডি তথ্য</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  {([
                    ['নাম',           user.name],
                    ['ইমেইল',        user.email],
                    ['ফোন',           user.phone],
                    ['প্যাকেজ',       pkgLabel],
                    ['স্ট্যাটাস',    user.is_active ? '✓ সক্রিয়' : '✗ নিষ্ক্রিয়'],
                    ...(user.package_type === 'customer' ? [
                      ['মাসিক PV', `${user.monthly_pv_purchased || 0} / 100`],
                      ...(user.expires_at ? [['মেয়াদ', `${daysLeft} দিন বাকি`]] : []),
                    ] : []),
                    ...(user.package_type === 'gold' ? [
                      ['গোল্ড রেফার ইনকাম', `৳${(user.gold_referral_income || 0).toLocaleString()}`],
                      ['গোল্ড পেন্ডিং',    `৳${(user.gold_referral_pending || 0).toLocaleString()}`],
                      ['বকেয়া',            `৳${(user.bakeya_amount || 0).toLocaleString()}`],
                    ] : []),
                  ] as [string, string][]).map(([label, value], i) => (
                    <div key={i} className="flex justify-between items-center py-2.5 border-b border-gray-50">
                      <span className="text-sm text-gray-500">{label}</span>
                      <span className="text-sm font-semibold text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-gray-700 mb-4">ইনকাম সারসংক্ষেপ</h3>
                  <div className="space-y-2 mb-5">
                    {[
                      { label: 'রেফার ইনকাম',   value: sumByType('referral_income') },
                      { label: 'জেনারেশন বোনাস', value: sumByType('generation_bonus') },
                      { label: 'ক্লাব বোনাস',    value: sumByTypes(['daily_club','weekly_club','insurance_club','pension_club','shareholder_club']) },
                      ...(user.package_type === 'gold' ? [{ label: 'গোল্ড দৈনিক', value: sumByType('gold_daily') }] : []),
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                        <span className="text-sm text-gray-600">{item.label}</span>
                        <span className="text-sm font-bold text-indigo-600">৳{item.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                    <p className="text-xs text-indigo-700 font-semibold mb-2">আপনার রেফারেল লিংক</p>
                    <div className="flex items-center gap-2">
                      <input readOnly
                        value={`${window.location.origin}/register?ref=${user.id}`}
                        className="flex-1 text-xs bg-white px-3 py-2 rounded-lg border border-indigo-200 font-mono text-gray-600 truncate" />
                      <button onClick={copyReferralLink}
                        className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex-shrink-0">
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── INCOME ──────────────────────────────────────────────────────── */}
          {activeTab === 'income' && (
            <div>
              <h2 className="text-lg font-bold mb-5">ইনকাম বিবরণ</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {([
                  { label: 'রেফার ইনকাম',       type: 'referral_income',  color: 'from-green-500 to-emerald-600', icon: <Users size={20} /> },
                  { label: 'জেনারেশন বোনাস',     type: 'generation_bonus', color: 'from-blue-500 to-indigo-600',   icon: <TrendingUp size={20} /> },
                  { label: 'ডেইলি ক্লাব',        type: 'daily_club',       color: 'from-orange-500 to-red-600',    icon: <Gift size={20} /> },
                  { label: 'উইকলি ক্লাব',         type: 'weekly_club',      color: 'from-purple-500 to-pink-600',   icon: <Crown size={20} /> },
                  { label: 'ইনসুরেন্স ক্লাব',    type: 'insurance_club',   color: 'from-teal-500 to-cyan-600',     icon: <Shield size={20} /> },
                  { label: 'পেনশন ক্লাব',         type: 'pension_club',     color: 'from-amber-500 to-yellow-600',  icon: <Award size={20} /> },
                  { label: 'শেয়ারহোল্ডার ক্লাব', type: 'shareholder_club', color: 'from-violet-500 to-purple-600', icon: <Star size={20} /> },
                  { label: 'গোল্ড দৈনিক',        type: 'gold_daily',       color: 'from-yellow-500 to-orange-600', icon: <Award size={20} /> },
                ] as { label: string; type: string; color: string; icon: React.ReactNode }[]).map(item => {
                  const total = sumByType(item.type);
                  return (
                    <div key={item.type} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                      <div className={`w-10 h-10 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center text-white mb-3`}>
                        {item.icon}
                      </div>
                      <p className="text-xs text-gray-500">{item.label}</p>
                      <p className="text-xl font-bold text-gray-900 mt-0.5">৳{total.toLocaleString()}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── GENERATIONS ─────────────────────────────────────────────────── */}
          {activeTab === 'generations' && (
            <div>
              <h2 className="text-lg font-bold mb-2">জেনারেশন টেবিল</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5 text-xs text-blue-800">
                📌 জেনারেশন বোনাস শুধু Customer package এর PV sales এ — প্রতি জেনারেশনে PV এর ১% (১ম–৫ম জেনারেশন)।
                শুধু সক্রিয় আইডিতে বোনাস যায়।
              </div>

              {loading ? (
                <div className="text-center py-8 text-gray-400 text-sm">লোড হচ্ছে...</div>
              ) : generations.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Users size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">এখনো কোনো রেফারেল নেই</p>
                  <button onClick={copyReferralLink}
                    className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">
                    রেফারেল লিংক কপি করুন
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {generations.map(({ gen, members }) => (
                    <div key={gen} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className={`${genColors[gen - 1]} p-3 text-white font-bold text-sm flex items-center justify-between`}>
                        <span>{gen}ম জেনারেশন</span>
                        <span className="text-xs opacity-80 font-normal">{members.length} জন</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead><tr className="bg-gray-50">
                            {['নাম', 'ফোন', 'প্যাকেজ', 'PV পয়েন্ট', 'স্ট্যাটাস'].map(h => (
                              <th key={h} className="text-left py-2 px-3 text-xs font-medium text-gray-500">{h}</th>
                            ))}
                          </tr></thead>
                          <tbody>
                            {members.map((m: any) => (
                              <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                                <td className="py-2.5 px-3 font-medium text-xs">{m.name}</td>
                                <td className="py-2.5 px-3 text-xs text-gray-500">{m.phone}</td>
                                <td className="py-2.5 px-3">
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${m.package_type === 'gold' ? 'bg-yellow-100 text-yellow-700' : m.package_type === 'shareholder' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {m.package_type === 'customer' ? 'কাস্টমার' : m.package_type === 'shareholder' ? 'শেয়ারহোল্ডার' : 'গোল্ড'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-xs">{m.pv_points || 0}</td>
                                <td className="py-2.5 px-3">
                                  <span className={`text-xs font-medium ${m.is_active ? 'text-green-600' : 'text-red-500'}`}>
                                    {m.is_active ? '✓ সক্রিয়' : '✗ নিষ্ক্রিয়'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── CLUBS ───────────────────────────────────────────────────────── */}
          {activeTab === 'clubs' && (
            <div>
              <h2 className="text-lg font-bold mb-5">ক্লাব সদস্যপদ</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {([
                  { key: 'daily_club',       label: 'ডেইলি ক্লাব',         desc: 'PV এর ৩০%',    flag: user.is_daily_club,       color: 'from-orange-500 to-red-500',    cond: 'Customer package হলেই',       icon: <ShoppingBag size={18} /> },
                  { key: 'weekly_club',      label: 'উইকলি ক্লাব',          desc: 'PV এর ২.৫%',   flag: user.is_weekly_club,      color: 'from-green-500 to-emerald-600', cond: '১৫ ডিরেক্ট Customer রেফার',  icon: <Users size={18} /> },
                  { key: 'insurance_club',   label: 'ইনসুরেন্স ক্লাব',      desc: 'PV এর ১.২৫%',  flag: user.is_insurance_club,   color: 'from-blue-500 to-indigo-600',   cond: '১৫ জন Weekly club member',    icon: <Shield size={18} /> },
                  { key: 'pension_club',     label: 'পেনশন ক্লাব',          desc: 'PV এর ১.২৫%',  flag: user.is_pension_club,     color: 'from-teal-500 to-cyan-600',     cond: 'ইনসুরেন্সের সাথেই পাবেন',   icon: <Award size={18} /> },
                  { key: 'shareholder_club', label: 'শেয়ারহোল্ডার ক্লাব',   desc: 'PV এর ১০%',    flag: user.is_shareholder_club, color: 'from-purple-500 to-violet-600', cond: 'Shareholder package holders', icon: <Crown size={18} /> },
                ] as { key: string; label: string; desc: string; flag: boolean; color: string; cond: string; icon: React.ReactNode }[]).map(club => (
                  <div key={club.key} className={`rounded-xl p-5 border-2 transition-all ${club.flag ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${club.color} rounded-xl flex items-center justify-center text-white`}>
                        {club.icon}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${club.flag ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                        {club.flag ? 'সদস্য ✓' : 'সদস্য নয়'}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-800 text-sm mb-1">{club.label}</h3>
                    <p className="text-xs text-gray-500 mb-1">{club.desc}</p>
                    <p className="text-xs text-gray-400">{club.cond}</p>
                    {club.flag && (
                      <div className="mt-3 pt-2 border-t border-green-200">
                        <p className="text-xs text-green-700 font-medium">পুল: ৳{getClubPool(club.key).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-5 bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800 space-y-1">
                <p className="font-semibold">📌 ক্লাব পুল বন্টন সম্পর্কে</p>
                <p>প্রতিটি পুলের টাকা এডমিন থেকে সমান হারে সব সক্রিয় সদস্যদের মধ্যে বন্টন করা হয়।</p>
                <p>নিষ্ক্রিয় আইডিতে কোনো ক্লাব বোনাস যাবে না।</p>
              </div>
            </div>
          )}

          {/* ── WITHDRAW ────────────────────────────────────────────────────── */}
          {activeTab === 'withdraw' && (
            <div className="max-w-lg">
              <h2 className="text-lg font-bold mb-5">উইথড্রো</h2>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200 mb-5 flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500">উপলব্ধ ব্যালেন্স</p>
                  <p className="text-2xl font-bold text-green-700">৳{(user.current_balance || 0).toLocaleString()}</p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <p>চার্জ: ৫%</p>
                  <p>সর্বনিম্ন: ৳১০০</p>
                </div>
              </div>

              {/* Method selector */}
              <div className="grid grid-cols-4 gap-2 mb-5">
                {wdMethods.map(m => (
                  <button key={m.key} type="button" onClick={() => setWdMethod(m.key)}
                    className={`p-3 rounded-xl border-2 text-center text-xs font-bold transition-all ${wdMethod === m.key ? 'shadow-md' : 'border-gray-200 text-gray-500'}`}
                    style={wdMethod === m.key ? { borderColor: m.color, backgroundColor: m.color + '15', color: m.color } : {}}>
                    {m.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleWithdrawal} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">
                    {wdMethod === 'bank' ? 'ব্যাংক একাউন্ট নম্বর' : `${wdMethods.find(m => m.key === wdMethod)?.label} নম্বর`} *
                  </label>
                  <input value={wdAccount} onChange={e => setWdAccount(e.target.value)} required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none"
                    placeholder={wdMethods.find(m => m.key === wdMethod)?.placeholder} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">পরিমাণ (৳) *</label>
                  <input type="number" value={wdAmount} onChange={e => setWdAmount(e.target.value)} required
                    min="100" max={user.current_balance || 0}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none"
                    placeholder="সর্বনিম্ন ৳১০০" />
                </div>

                {wdAmount && parseFloat(wdAmount) >= 100 && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2">
                    {[
                      { label: 'উইথড্রো পরিমাণ', value: `৳${parseFloat(wdAmount).toLocaleString()}`,                                    cls: '' },
                      { label: 'চার্জ (৫%)',       value: `- ৳${Math.ceil(parseFloat(wdAmount) * 0.05).toLocaleString()}`,               cls: 'text-red-500' },
                      { label: 'নেট পরিমাণ',      value: `৳${(parseFloat(wdAmount) - Math.ceil(parseFloat(wdAmount) * 0.05)).toLocaleString()}`, cls: 'text-green-600 font-bold' },
                    ].map((row, i) => (
                      <div key={i} className={`flex justify-between text-sm ${i === 2 ? 'pt-2 border-t border-gray-200' : ''}`}>
                        <span className="text-gray-500">{row.label}</span>
                        <span className={`font-medium ${row.cls}`}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                <button type="submit" disabled={wdLoading || !wdAmount || parseFloat(wdAmount) < 100 || parseFloat(wdAmount) > (user.current_balance || 0)}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2">
                  <ArrowDownToLine size={18} />
                  {wdLoading ? 'প্রসেসিং...' : 'উইথড্রো করুন'}
                </button>
              </form>

              {withdrawals.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-sm text-gray-700 mb-3">উইথড্রো ইতিহাস</h3>
                  <div className="space-y-2">
                    {withdrawals.slice(0, 8).map(wd => (
                      <div key={wd.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                          <p className="text-xs font-medium text-gray-700">{wd.method?.toUpperCase()} — {wd.account_number}</p>
                          <p className="text-[10px] text-gray-400">{new Date(wd.created_at).toLocaleDateString('bn-BD')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-red-600">৳{(wd.amount || 0).toLocaleString()}</p>
                          <p className="text-xs text-gray-400">নেট: ৳{(wd.net_amount || 0).toLocaleString()}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${wd.status === 'approved' ? 'bg-green-100 text-green-700' : wd.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {wd.status === 'approved' ? 'অনুমোদিত' : wd.status === 'rejected' ? 'প্রত্যাখ্যাত' : 'পেন্ডিং'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TRANSFER ────────────────────────────────────────────────────── */}
          {activeTab === 'transfer' && (
            <div className="max-w-lg">
              <h2 className="text-lg font-bold mb-5">আইডি থেকে আইডি ট্রান্সফার</h2>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 mb-5 flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500">উপলব্ধ ব্যালেন্স</p>
                  <p className="text-2xl font-bold text-blue-700">৳{(user.current_balance || 0).toLocaleString()}</p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <p>সর্বনিম্ন: ৳১০০</p>
                  <p>কোনো চার্জ নেই</p>
                </div>
              </div>

              <form onSubmit={handleTransfer} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">প্রাপকের User ID *</label>
                  <input value={trfToId} onChange={e => setTrfToId(e.target.value)} required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none font-mono"
                    placeholder="UUID (রেফারেল লিংকের শেষের অংশ)" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">পরিমাণ (৳) *</label>
                  <input type="number" value={trfAmount} onChange={e => setTrfAmount(e.target.value)} required
                    min="100" max={user.current_balance || 0}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none"
                    placeholder="সর্বনিম্ন ৳১০০" />
                </div>

                <button type="submit" disabled={trfLoading || !trfAmount || parseFloat(trfAmount) < 100 || parseFloat(trfAmount) > (user.current_balance || 0)}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2">
                  <ArrowRightLeft size={18} />
                  {trfLoading ? 'প্রসেসিং...' : 'ট্রান্সফার করুন'}
                </button>
              </form>

              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                <p className="text-xs text-yellow-800 font-semibold">⚠️ সতর্কতা</p>
                <p className="text-xs text-yellow-700 mt-1">ট্রান্সফার সম্পূর্ণ অপরিবর্তনীয়। পাঠানোর আগে সঠিক User ID নিশ্চিত করুন।</p>
              </div>
            </div>
          )}

          {/* ── HISTORY ─────────────────────────────────────────────────────── */}
          {activeTab === 'history' && (
            <div>
              <h2 className="text-lg font-bold mb-5">লেনদেনের ইতিহাস</h2>
              {loading ? (
                <div className="text-center py-8 text-gray-400 text-sm">লোড হচ্ছে...</div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <TrendingUp size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">কোনো লেনদেন নেই</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map(txn => (
                    <div key={txn.id} className="flex items-center justify-between py-3 px-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-gray-700">{txn.description}</p>
                        <p className="text-xs text-gray-400">
                          {txn.type} • {new Date(txn.created_at).toLocaleString('bn-BD', { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      </div>
                      <span className={`font-bold text-sm ml-4 flex-shrink-0 ${txn.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {txn.amount >= 0 ? '+' : ''}৳{Math.abs(txn.amount).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
      <Footer />
    </div>
  );
}
