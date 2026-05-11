import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Wallet, TrendingUp, Gift, Users, Copy, Check, ArrowDownToLine,
  ArrowRightLeft, Crown, Award, Clock, RefreshCw,
  Star, Shield, LogOut, ShoppingBag, Camera, Upload, AlertCircle,
  BarChart3, ChevronDown, ChevronRight, History, Package,
} from 'lucide-react';
import { toast } from 'sonner';
import { hashPassword } from '@/lib/crypto';
import { useLiveGoldPrice, minutesAgo } from '@/utils/goldPrice';

function GoldCountdown({ startDate, t }: { startDate: string; t: (k: any) => string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 365);
    const tick = () => {
      const diff = endDate.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
      setTimeLeft({ days: Math.floor(diff/86400000), hours: Math.floor((diff%86400000)/3600000), minutes: Math.floor((diff%3600000)/60000), seconds: Math.floor((diff%60000)/1000) });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startDate]);
  return (
    <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl p-5 mb-6 text-white">
      <div className="flex items-center gap-2 mb-3"><Clock size={20}/><h3 className="font-bold">{t('goldCountdown')}</h3></div>
      <div className="grid grid-cols-4 gap-3">
        {[{v:timeLeft.days,l:t('days')},{v:timeLeft.hours,l:t('hours')},{v:timeLeft.minutes,l:t('minutes')},{v:timeLeft.seconds,l:t('seconds')}].map((x,i)=>(
          <div key={i} className="bg-white/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold tabular-nums">{String(x.v).padStart(2,'0')}</p>
            <p className="text-xs opacity-80">{x.l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout, refreshUser } = useAuth();
  const { t } = useLang();
  const { price: liveGold, loading: gpLoading, error: gpError, refresh: gpRefresh } = useLiveGoldPrice();

  const [activeTab,        setActiveTab]        = useState('overview');
  const [sidebarOpen,     setSidebarOpen]      = useState(true);
  const [transactions,     setTransactions]     = useState<any[]>([]);
  const [generations,      setGenerations]      = useState<any[]>([]);
  const [withdrawals,      setWithdrawals]      = useState<any[]>([]);
  const [clubPools,        setClubPools]        = useState<any[]>([]);
  const [goldPackages,     setGoldPackages]     = useState<any[]>([]);
  const [goldLockerImages, setGoldLockerImages] = useState<string[]>([]);
  const [pendingPayments,  setPendingPayments]  = useState<any[]>([]);
  const [directCustomers,  setDirectCustomers]  = useState<any[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [copied,           setCopied]           = useState(false);

  // Withdrawal
  const [wdMethod,            setWdMethod]            = useState('bkash');
  const [wdAccount,           setWdAccount]           = useState('');
  const [wdAccountHolderName, setWdAccountHolderName] = useState('');
  const [wdBankName,          setWdBankName]          = useState('');
  const [wdRoutingNumber,     setWdRoutingNumber]     = useState('');
  const [wdBranchName,        setWdBranchName]        = useState('');
  const [wdAmount,            setWdAmount]            = useState('');
  const [wdLoading,           setWdLoading]           = useState(false);

  // Transfer
  const [trfToId,    setTrfToId]    = useState('');
  const [trfAmount,  setTrfAmount]  = useState('');
  const [trfLoading, setTrfLoading] = useState(false);

  // Profile
  const [profName,         setProfName]         = useState('');
  const [profPhone,        setProfPhone]        = useState('');
  const [profNid,          setProfNid]          = useState('');
  const [profImgFile,      setProfImgFile]      = useState<File|null>(null);
  const [profImgPreview,   setProfImgPreview]   = useState('');
  const [profNidFrontFile, setProfNidFrontFile] = useState<File|null>(null);
  const [profNidBackFile,  setProfNidBackFile]  = useState<File|null>(null);
  const [profLoading,      setProfLoading]      = useState(false);

  // Package purchase
  const [pkgSelected, setPkgSelected] = useState<'shareholder'|'gold'|null>(null);
  const [pkgMethod,   setPkgMethod]   = useState('bkash');
  const [pkgAccount,  setPkgAccount]  = useState('');
  const [pkgTxnRef,   setPkgTxnRef]   = useState('');
  const [pkgQuantity, setPkgQuantity] = useState(1);
  const [pkgLoading,  setPkgLoading]  = useState(false);
  const [goldAmount,        setGoldAmount]        = useState<number>(5000);
  const [goldCustom,        setGoldCustom]        = useState('');
  const [goldLockerFile,    setGoldLockerFile]    = useState<File|null>(null);
  const [goldLockerPreview, setGoldLockerPreview] = useState('');
  // Hourly ticker for bakeya re-render
  const [, setHourTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setHourTick(t => t + 1), 3600000);
    return () => clearInterval(id);
  }, []);

  // Locker lightbox
  const [lockerLightbox, setLockerLightbox] = useState<string|null>(null);

  // Password change
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew,     setPwNew]     = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  // Referral purchases
  const [referralPurchases, setReferralPurchases] = useState<any[]>([]);

  // Bakeya payment
  const [bakeyaMethod,     setBakeyaMethod]     = useState('bkash');
  const [bakeyaAccount,    setBakeyaAccount]    = useState('');
  const [bakeyaTxnRef,     setBakeyaTxnRef]     = useState('');
  const [bakeyaPayAmt,     setBakeyaPayAmt]     = useState('');
  const [bakeyaPayLoading, setBakeyaPayLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    setProfName(user.name || '');
    setProfPhone(user.phone || '');
    setProfNid(user.nid_number || '');
    setProfImgPreview(user.profile_image_url || '');
    fetchData();
  }, [user, authLoading]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [txRes, wdRes, poolRes, goldRes, pvRes, dirRes, lockerRes] = await Promise.all([
      supabase.from('mlm_transactions').select('*').eq('user_id', user.id).order('created_at',{ascending:false}).limit(50),
      supabase.from('mlm_withdrawals').select('*').eq('user_id', user.id).order('created_at',{ascending:false}).limit(20),
      supabase.from('mlm_club_pools').select('*'),
      supabase.from('mlm_gold_packages').select('*').eq('user_id', user.id).order('created_at',{ascending:false}),
      supabase.from('mlm_payment_verifications').select('*').eq('user_id', user.id).order('created_at',{ascending:false}).limit(10),
      supabase.from('mlm_users').select('id,name,is_active,package_type,is_weekly_club').eq('referrer_id', user.id),
      supabase.from('mlm_payment_verifications').select('locker_image_url').eq('user_id', user.id).eq('purpose','gold_package').eq('status','approved').not('locker_image_url','is',null),
    ]);
    if (txRes.data)  setTransactions(txRes.data);
    if (wdRes.data)  setWithdrawals(wdRes.data);
    if (poolRes.data) setClubPools(poolRes.data);
    if (goldRes.data) setGoldPackages(goldRes.data);
    if (pvRes.data)  setPendingPayments(pvRes.data.filter((p:any) => p.status === 'pending'));
    if (dirRes.data) setDirectCustomers(dirRes.data);
    if (lockerRes.data) setGoldLockerImages(lockerRes.data.map((p:any)=>p.locker_image_url).filter(Boolean));
    // Referral purchases feed
    const directIds = (dirRes.data||[]).map((u:any)=>u.id);
    if (directIds.length > 0) {
      const {data:pvLog} = await supabase.from('mlm_pv_log').select('*, user:mlm_users(name,phone)').in('user_id', directIds).order('created_at',{ascending:false}).limit(20);
      if (pvLog) setReferralPurchases(pvLog);
    }
    await buildGenerationTable();
    setLoading(false);
  };

  const buildGenerationTable = async () => {
    if (!user) return;
    const table: {gen:number; members:any[]}[] = [];
    const {data:gen1} = await supabase.from('mlm_users').select('id,name,phone,package_type,is_active,pv_points,total_income,created_at').eq('referrer_id', user.id);
    if (!gen1?.length) { setGenerations([]); return; }
    table.push({gen:1, members:gen1});
    let prevIds = gen1.map((u:any) => u.id);
    for (let g=2; g<=5; g++) {
      if (!prevIds.length) break;
      const {data:genN} = await supabase.from('mlm_users').select('id,name,phone,package_type,is_active,pv_points,total_income,created_at').in('referrer_id', prevIds);
      if (genN?.length) { table.push({gen:g, members:genN}); prevIds = genN.map((u:any)=>u.id); } else break;
    }
    setGenerations(table);
  };

  const handleWdMethodChange = (method: string) => {
    setWdMethod(method); setWdAccount('');
    if (method !== 'bank') { setWdAccountHolderName(''); setWdBankName(''); setWdRoutingNumber(''); setWdBranchName(''); }
  };

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const amount = parseFloat(wdAmount);
    const wdMin = wdMethod === 'bank' ? 1000 : 100;
    if (isNaN(amount) || amount < wdMin) { toast.error(`সর্বনিম্ন উইথড্রো ৳${wdMin}`); return; }
    if (amount > (user.current_balance||0)) { toast.error('ব্যালেন্স যথেষ্ট নয়'); return; }
    if (!wdAccount.trim()) { toast.error('একাউন্ট নম্বর দিন'); return; }
    if (wdMethod==='bank') {
      if (!wdAccountHolderName.trim()) { toast.error('একাউন্ট ধারকের নাম দিন'); return; }
      if (!wdBankName.trim()) { toast.error('ব্যাংকের নাম দিন'); return; }
      if (!wdRoutingNumber.trim()) { toast.error('রাউটিং নম্বর দিন'); return; }
      if (!wdBranchName.trim()) { toast.error('শাখার নাম দিন'); return; }
    }
    const charge = Math.ceil(amount*0.05);
    const netAmount = amount-charge;
    setWdLoading(true);
    const {error:balErr} = await supabase.from('mlm_users').update({current_balance:(user.current_balance||0)-amount}).eq('id',user.id);
    if (balErr) { toast.error('সমস্যা: '+balErr.message); setWdLoading(false); return; }
    const wdInsert: any = {user_id:user.id, amount, charge, net_amount:netAmount, method:wdMethod, account_number:wdAccount.trim(), status:'pending'};
    if (wdMethod==='bank') { wdInsert.account_holder_name=wdAccountHolderName.trim(); wdInsert.bank_name=wdBankName.trim(); wdInsert.routing_number=wdRoutingNumber.trim(); wdInsert.branch_name=wdBranchName.trim(); }
    await Promise.all([
      supabase.from('mlm_withdrawals').insert(wdInsert),
      supabase.from('mlm_transactions').insert({user_id:user.id, type:'withdrawal_request', amount:-amount, description:`উইথড্রো অনুরোধ — ${wdMethod} — ${wdAccount.trim()} (চার্জ: ৳${charge})`}),
    ]);
    toast.success(`✅ উইথড্রো অনুরোধ জমা! নেট: ৳${netAmount}`);
    setWdAmount(''); setWdAccount(''); setWdAccountHolderName(''); setWdBankName(''); setWdRoutingNumber(''); setWdBranchName('');
    await refreshUser(); await fetchData(); setWdLoading(false);
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const amount = parseFloat(trfAmount);
    if (isNaN(amount)||amount<100) { toast.error('সর্বনিম্ন ট্রান্সফার ৳১০০'); return; }
    if (amount>(user.current_balance||0)) { toast.error('ব্যালেন্স যথেষ্ট নয়'); return; }
    if (!trfToId.trim()) { toast.error('প্রাপকের আইডি দিন'); return; }
    if (trfToId.trim()===user.id) { toast.error('নিজের আইডিতে ট্রান্সফার করা যাবে না'); return; }
    setTrfLoading(true);
    const {data:recipient} = await supabase.from('mlm_users').select('id,name,current_balance').eq('id',trfToId.trim()).single();
    if (!recipient) { toast.error('প্রাপকের আইডি পাওয়া যায়নি'); setTrfLoading(false); return; }
    await Promise.all([
      supabase.from('mlm_users').update({current_balance:(user.current_balance||0)-amount}).eq('id',user.id),
      supabase.from('mlm_users').update({current_balance:(recipient.current_balance||0)+amount}).eq('id',recipient.id),
    ]);
    await supabase.from('mlm_transactions').insert([
      {user_id:user.id, type:'transfer_out', amount:-amount, description:`ট্রান্সফার → ${recipient.name} (৳${amount})`, related_user_id:recipient.id},
      {user_id:recipient.id, type:'transfer_in', amount, description:`ট্রান্সফার ← ${user.name} (৳${amount})`, related_user_id:user.id},
    ]);
    toast.success(`✅ ৳${amount} সফলভাবে ${recipient.name}-কে পাঠানো হয়েছে!`);
    setTrfAmount(''); setTrfToId('');
    await refreshUser(); await fetchData(); setTrfLoading(false);
  };

  const handleProfImgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfImgFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setProfImgPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleProfileSave = async () => {
    if (!user) return;
    if (!profName.trim()) { toast.error('নাম দিন'); return; }
    if (!profPhone.trim()) { toast.error('ফোন নম্বর দিন'); return; }
    setProfLoading(true);
    const updates: any = {name:profName.trim(), phone:profPhone.trim(), nid_number:profNid.trim()||null};
    const uploadFile = async (bucket: string, path: string, file: File) => {
      const {error} = await supabase.storage.from(bucket).upload(path, file, {upsert:true});
      if (!error) { const {data:u} = supabase.storage.from(bucket).getPublicUrl(path); return u.publicUrl; }
      return null;
    };
    if (profImgFile) { const url = await uploadFile('profile-images',`${user.id}/profile.${profImgFile.name.split('.').pop()}`,profImgFile); if (url) updates.profile_image_url=url; }
    if (profNidFrontFile) { const url = await uploadFile('nid-images',`${user.id}/nid_front.${profNidFrontFile.name.split('.').pop()}`,profNidFrontFile); if (url) updates.nid_front_url=url; }
    if (profNidBackFile) { const url = await uploadFile('nid-images',`${user.id}/nid_back.${profNidBackFile.name.split('.').pop()}`,profNidBackFile); if (url) updates.nid_back_url=url; }
    const {error} = await supabase.from('mlm_users').update(updates).eq('id',user.id);
    if (error) { toast.error('আপডেট ব্যর্থ: '+error.message); } else { toast.success('✅ প্রোফাইল আপডেট সফল!'); await refreshUser(); setProfImgFile(null); setProfNidFrontFile(null); setProfNidBackFile(null); }
    setProfLoading(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (pwNew.length < 4) { toast.error('নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষর'); return; }
    if (pwNew !== pwConfirm) { toast.error('নতুন পাসওয়ার্ড মিলছে না'); return; }
    setPwLoading(true);
    const currentHash = await hashPassword(pwCurrent);
    const { data: match } = await supabase.from('mlm_users').select('id').eq('id', user.id).eq('password_hash', currentHash).single();
    if (!match) { toast.error('বর্তমান পাসওয়ার্ড ভুল'); setPwLoading(false); return; }
    const newHash = await hashPassword(pwNew);
    const { error } = await supabase.from('mlm_users').update({ password_hash: newHash }).eq('id', user.id);
    if (error) { toast.error('আপডেট ব্যর্থ: ' + error.message); } else {
      toast.success('✅ পাসওয়ার্ড পরিবর্তন সফল!');
      setPwCurrent(''); setPwNew(''); setPwConfirm('');
    }
    setPwLoading(false);
  };

  const handlePackagePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user||!pkgSelected) return;
    const pricePerUnit = pkgSelected==='shareholder' ? 5000 : goldAmount;
    const totalAmount = pricePerUnit*pkgQuantity;
    if (pkgMethod!=='balance'&&!pkgAccount.trim()) { toast.error('মোবাইল নম্বর দিন'); return; }
    if (pkgMethod==='balance'&&(user.current_balance||0)<totalAmount) { toast.error(`ব্যালেন্স যথেষ্ট নয়। প্রয়োজন: ৳${totalAmount.toLocaleString()}`); return; }
    setPkgLoading(true);
    if (pkgMethod==='balance') {
      const {error:balErr} = await supabase.from('mlm_users').update({current_balance:(user.current_balance||0)-totalAmount}).eq('id',user.id);
      if (balErr) { toast.error('সমস্যা: '+balErr.message); setPkgLoading(false); return; }
      await supabase.from('mlm_transactions').insert({user_id:user.id, type:'package_purchase', amount:-totalAmount, description:`${pkgSelected==='shareholder'?'শেয়ারহোল্ডার':'গোল্ড'} প্যাকেজ (${pkgQuantity}টি) — ব্যালেন্স থেকে`});
    }
    let lockerImageUrl: string|null = null;
    if (pkgSelected==='gold' && goldLockerFile) {
      const ext = goldLockerFile.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      await supabase.storage.from('gold-locker-images').upload(path, goldLockerFile, {upsert:true});
      const {data:pu} = supabase.storage.from('gold-locker-images').getPublicUrl(path);
      lockerImageUrl = pu.publicUrl;
    }
    const {error} = await supabase.from('mlm_payment_verifications').insert({user_id:user.id, purpose:`${pkgSelected}_package`, pv_points:0, amount:totalAmount, method:pkgMethod, sender_number:pkgMethod==='balance'?'balance':pkgAccount.trim(), trx_id:pkgTxnRef.trim()||null, quantity:pkgQuantity, status:'pending', locker_image_url:lockerImageUrl});
    if (error) {
      if (pkgMethod==='balance') await supabase.from('mlm_users').update({current_balance:user.current_balance||0}).eq('id',user.id);
      toast.error('সমস্যা: '+error.message);
    } else {
      toast.success(`✅ ${pkgSelected==='shareholder'?'শেয়ারহোল্ডার':'গোল্ড'} প্যাকেজ অনুরোধ জমা!`);
      setPkgSelected(null); setPkgQuantity(1); setPkgAccount(''); setPkgTxnRef('');
      setGoldAmount(5000); setGoldCustom(''); setGoldLockerFile(null); setGoldLockerPreview('');
      await refreshUser(); await fetchData();
    }
    setPkgLoading(false);
  };

  const handleBakeyaPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const amount = parseFloat(bakeyaPayAmt);
    if (isNaN(amount)||amount<=0) { toast.error('পরিমাণ দিন'); return; }
    if (amount>(user.bakeya_amount||0)) { toast.error('বকেয়ার চেয়ে বেশি দেওয়া যাবে না'); return; }
    if (bakeyaMethod!=='balance'&&!bakeyaAccount.trim()) { toast.error('মোবাইল নম্বর দিন'); return; }
    if (bakeyaMethod==='balance'&&(user.current_balance||0)<amount) { toast.error('ব্যালেন্স যথেষ্ট নয়'); return; }
    setBakeyaPayLoading(true);
    if (bakeyaMethod==='balance') {
      await supabase.from('mlm_users').update({current_balance:(user.current_balance||0)-amount}).eq('id',user.id);
    }
    await supabase.from('mlm_payment_verifications').insert({user_id:user.id, purpose:'bakeya_payment', pv_points:0, amount, method:bakeyaMethod, sender_number:bakeyaMethod==='balance'?'balance':bakeyaAccount.trim(), trx_id:bakeyaTxnRef.trim()||null, quantity:1, status:'pending'});
    toast.success('✅ বকেয়া পরিশোধের অনুরোধ জমা!');
    setBakeyaPayAmt(''); setBakeyaAccount(''); setBakeyaTxnRef('');
    await refreshUser(); await fetchData();
    setBakeyaPayLoading(false);
  };

  const copyReferralLink = () => {
    if (!user) return;
    navigator.clipboard.writeText(`${window.location.origin}/register?ref=${user.id}`);
    setCopied(true); setTimeout(()=>setCopied(false),2000);
    toast.success('রেফারেল লিংক কপি হয়েছে!');
  };

  const getClubPool  = (type: string) => clubPools.find(p=>p.club_type===type)?.total_amount||0;
  const sumByType    = (type: string) => transactions.filter(t=>t.type===type).reduce((s,t)=>s+(t.amount||0),0);
  const sumByTypes   = (types: string[]) => transactions.filter(t=>types.includes(t.type)).reduce((s,t)=>s+(t.amount||0),0);
  const daysLeft     = user?.expires_at ? Math.max(0,Math.ceil((new Date(user.expires_at).getTime()-Date.now())/86400000)) : 0;
  const realTimeBakeya = (() => {
    const activePkgs = goldPackages.filter((g: any) => g.status !== 'expired');
    if (activePkgs.length > 0) {
      const cronAccumulated = activePkgs.reduce((s: number, g: any) => s + (g.bakeya_accumulated || 0), 0);
      const realTimeDue = activePkgs.reduce((s: number, g: any) => {
        const purchasedAt = new Date(g.purchased_at || g.created_at);
        const hoursElapsed = Math.floor((Date.now() - purchasedAt.getTime()) / 3600000);
        return s + hoursElapsed * ((g.daily_bakeya || 0) / 24);
      }, 0);
      const uncaught = Math.max(0, realTimeDue - cronAccumulated);
      return parseFloat(((user?.bakeya_amount || 0) + uncaught).toFixed(4));
    }
    // পুরনো package: mlm_gold_packages-এ row নেই, user fields থেকে calculate
    if (user?.gold_package_start && (user?.gp_points || 0) > 0) {
      const startDate = new Date(user.gold_package_start);
      const hoursElapsed = Math.floor((Date.now() - startDate.getTime()) / 3600000);
      const hourlyBakeya = (user.gp_points || 0) * 0.36 / 365 / 24;
      const realTimeDue = hoursElapsed * hourlyBakeya;
      return parseFloat(((user?.bakeya_amount || 0) + Math.max(0, realTimeDue)).toFixed(4));
    }
    return parseFloat((user?.bakeya_amount || 0).toFixed(4));
  })();
  const pkgColor     = user?.package_type==='gold' ? 'from-yellow-500 to-orange-600' : user?.package_type==='shareholder' ? 'from-purple-500 to-pink-600' : 'from-blue-500 to-cyan-600';
  const pkgLabel     = user?.package_type==='gold' ? t('goldPkg') : user?.package_type==='shareholder' ? t('shareholderPkg') : t('customerPkg');

  // Club progress stats
  const activeCustomerDirects = directCustomers.filter(d=>d.is_active&&d.package_type==='customer').length;
  const weeklyClubDirects     = directCustomers.filter(d=>d.is_active&&d.is_weekly_club).length;
  const transferTxns          = transactions.filter(t=>t.type==='transfer_out'||t.type==='transfer_in');

  if (!user) return null;

  const wdMethods = [
    {key:'bkash',  label:'বিকাশ',  color:'#E2136E', placeholder:'০১XXXXXXXXX'},
    {key:'nagad',  label:'নগদ',    color:'#F6921E', placeholder:'০১XXXXXXXXX'},
    {key:'rocket', label:'রকেট',   color:'#8B2F8B', placeholder:'০১XXXXXXXXX'},
    {key:'bank',   label:'ব্যাংক', color:'#1E40AF', placeholder:'একাউন্ট নম্বর'},
  ];
  const pkgPayMethods = [
    {key:'bkash',   label:'বিকাশ',    color:'#E2136E'},
    {key:'nagad',   label:'নগদ',      color:'#F6921E'},
    {key:'rocket',  label:'রকেট',     color:'#8B2F8B'},
    {key:'balance', label:'ব্যালেন্স', color:'#059669'},
  ];
  const genColors = ['bg-blue-600','bg-indigo-500','bg-purple-500','bg-pink-500','bg-orange-500'];
  const tabs = [
    {id:'overview',    label:t('overview'),    icon:<BarChart3 size={18}/>},
    {id:'income',      label:t('income'),      icon:<TrendingUp size={18}/>},
    {id:'team', label:t('generations'), icon:<Users size={18}/>},
    {id:'clubs',       label:t('clubs'),       icon:<Gift size={18}/>},
    {id:'packages',    label:t('pkgTab'),      icon:<Package size={18}/>},
    {id:'withdraw',    label:t('withdraw'),    icon:<ArrowDownToLine size={18}/>},
    {id:'transfer',    label:t('transfer'),    icon:<ArrowRightLeft size={18}/>},
    {id:'history',     label:t('history'),     icon:<History size={18}/>},
    {id:'profile',     label:t('profile'),     icon:<Camera size={18}/>},
  ];

  const purposeLabel = (p: string) =>
    p==='shareholder_package' ? t('shareholderPkg')+' Package' :
    p==='gold_package'        ? t('goldPkg')+' Package' :
    p==='customer_package'    ? t('customerPkg')+' Package' :
    p==='product_purchase'    ? 'Product Purchase' : p;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">

        {/* ── Sidebar (Desktop) ── */}
        <aside className={`${
          sidebarOpen ? 'w-64' : 'w-16'
        } bg-gradient-to-b from-gray-900 to-gray-800 min-h-[calc(100vh-64px)] transition-all duration-300 hidden lg:flex flex-col flex-shrink-0`}>
          <div className="p-3 flex-1">
            {/* Collapse toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-white/10 text-gray-400 mb-4 transition-all"
            >
              {sidebarOpen ? <ChevronDown size={18} className="rotate-90" /> : <ChevronRight size={18} />}
            </button>

            {/* User mini card */}
            {sidebarOpen && (
              <div className="mb-4 px-2">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${pkgColor} flex items-center justify-center text-white font-bold text-lg mx-auto mb-2`}>
                  {user.name?.charAt(0)?.toUpperCase()}
                </div>
                <p className="text-white text-xs font-semibold text-center truncate">{user.name}</p>
                <p className="text-gray-400 text-[10px] text-center truncate">{user.phone}</p>
                <div className="flex justify-center mt-1.5">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                    user.is_active ? 'bg-green-500/30 text-green-300' : 'bg-red-500/30 text-red-300'
                  }`}>
                    {user.is_active ? '✓ সক্রিয়' : '✗ নিষ্ক্রিয়'}
                  </span>
                </div>
              </div>
            )}

            {sidebarOpen && <p className="text-[10px] text-gray-500 uppercase tracking-wider px-3 mb-2">মেনু</p>}

            {/* Nav items */}
            <nav className="space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {tab.icon}
                  {sidebarOpen && <span>{tab.label}</span>}
                </button>
              ))}
            </nav>
          </div>

          {/* Sidebar footer */}
          {sidebarOpen && (
            <div className="p-3 border-t border-white/10">
              <button
                onClick={() => { logout(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-500/20 hover:text-red-300 transition-all"
              >
                <LogOut size={18} />
                <span>{t('logout')}</span>
              </button>
            </div>
          )}
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <div className="max-w-5xl mx-auto px-4 py-6">

            {/* Mobile tabs */}
            <div className="flex flex-wrap gap-1.5 mb-4 lg:hidden overflow-x-auto">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
                  }`}>
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

        {user.package_type==='gold'&&user.gold_package_start&&<GoldCountdown startDate={user.gold_package_start} t={t}/>}

        {/* Pending payments alert */}
        {pendingPayments.length>0&&(
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4 flex items-start gap-3">
            <AlertCircle size={18} className="text-orange-500 mt-0.5 flex-shrink-0"/>
            <div>
              <p className="text-orange-800 font-semibold text-sm">{t('pendingPayments')}: {pendingPayments.length}টি</p>
              <div className="mt-1 space-y-1">
                {pendingPayments.map(pp=>(
                  <p key={pp.id} className="text-xs text-orange-700">• {purposeLabel(pp.purpose)} — ৳{(pp.amount||0).toLocaleString()} — <span className="bg-orange-200 px-1 rounded">{t('paymentPending')}</span></p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active customer renewal tracking (H) */}
        {user.package_type==='customer'&&user.is_active&&(
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-blue-800 font-semibold text-sm">📅 {t('renewalTitle')}</p>
              <span className="text-xs text-blue-600">{daysLeft} {t('daysLeft')}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-blue-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full transition-all" style={{width:`${Math.min(100,(user.monthly_pv_purchased||0))}%`}}/>
              </div>
              <span className="text-sm font-bold text-blue-700">{user.monthly_pv_purchased||0}/100 PV</span>
            </div>
            {(user.monthly_pv_purchased||0)<100&&(
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-blue-600">{t('renewalNote')}</p>
                <Link to="/shop" className="text-xs px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{t('goShop')}</Link>
              </div>
            )}
          </div>
        )}

        {/* Banner */}
        <div className={`bg-gradient-to-r ${pkgColor} rounded-2xl p-6 mb-6 text-white`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-white/20 flex items-center justify-center">
                {user.profile_image_url ? <img src={user.profile_image_url} alt="profile" className="w-full h-full object-cover"/> : <span className="text-3xl font-extrabold">{user.name?.charAt(0)?.toUpperCase()}</span>}
              </div>
              <div>
                <h1 className="text-xl font-bold">{user.name}</h1>
                <p className="text-white/80 text-sm">{user.email} • {user.phone}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{pkgLabel}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${user.is_active?'bg-green-400/30':'bg-red-400/40'}`}>{user.is_active?t('active'):t('inactive')}</span>
                  {user.package_type==='customer'&&user.is_active&&<span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{daysLeft} {t('daysLeft')}</span>}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={copyReferralLink} className="flex items-center gap-1.5 px-3 py-2 bg-white/20 rounded-xl text-sm font-medium hover:bg-white/30 transition-all">
                {copied?<Check size={14}/>:<Copy size={14}/>}{copied?t('copied'):t('copyLink')}
              </button>
              <button onClick={fetchData} className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-all"><RefreshCw size={14}/></button>
              <button onClick={()=>{logout();navigate('/')}} className="flex items-center gap-1.5 px-3 py-2 bg-white/20 rounded-xl text-sm font-medium hover:bg-white/30 transition-all">
                <LogOut size={14}/>{t('logout')}
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            {label:t('currentBalance'), value:`৳${(user.current_balance||0).toLocaleString()}`, icon:<Wallet size={20}/>, color:'from-green-500 to-emerald-600'},
            {label:t('totalIncome'),    value:`৳${(user.total_income||0).toLocaleString()}`,    icon:<TrendingUp size={20}/>, color:'from-blue-500 to-indigo-600'},
            {label:t('directRefer'),    value:`${user.direct_referrals_count||0} জন`,           icon:<Users size={20}/>, color:'from-purple-500 to-pink-600'},
            {label:user.package_type==='customer'?t('pvPoints'):user.package_type==='shareholder'?t('spPoints'):t('gpPoints'),
             value:String(user.package_type==='customer'?(user.pv_points||0):user.package_type==='shareholder'?(user.ps_points||0):(user.gp_points||0)),
             icon:<Star size={20}/>, color:'from-orange-500 to-red-600'},
          ].map((s,i)=>(
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className={`w-10 h-10 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center text-white mb-3`}>{s.icon}</div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Inactive warning */}
        {!user.is_active&&(
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-800 font-semibold text-sm">⚠️ আপনার আইডি নিষ্ক্রিয় — কোনো ইনকাম জমা হবে না</p>
            {user.package_type==='customer'&&<p className="text-red-700 text-xs mt-1">{!user.activated_at?'প্রথমবার সক্রিয় করতে ১,০০০ PV মূল্যের পণ্য কিনুন।':'পুনরায় সক্রিয় করতে মাসে ১০০ PV মূল্যের পণ্য কিনুন।'}</p>}
            <Link to="/shop" className="inline-block mt-2 px-4 py-2 bg-red-600 text-white text-xs rounded-lg font-medium hover:bg-red-700">{t('goShop')}</Link>
          </div>
        )}

        {user.package_type==='gold'&&user.is_active&&(
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-5 mb-6 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <Award size={22}/>
              <p className="font-bold text-base">গোল্ড বকেয়া</p>
            </div>
            <p className="text-4xl font-bold tabular-nums mb-1">৳{realTimeBakeya.toFixed(2)}</p>
            {goldPackages.filter(g=>g.status!=='expired').length>0&&(
              <p className="text-yellow-100 text-sm">দৈনিক জমা: ৳{goldPackages.filter(g=>g.status!=='expired').reduce((s:number,g:any)=>s+(g.daily_bakeya||0),0).toFixed(2)}/দিন</p>
            )}
            {goldLockerImages.length>0&&(
              <div className="mt-3 pt-3 border-t border-white/30">
                <p className="text-yellow-100 text-xs mb-2">🔐 লকার ছবি</p>
                <div className="flex gap-2 flex-wrap">
                  {goldLockerImages.map((url,i)=>(
                    <img key={i} src={url} alt={`locker-${i+1}`} onClick={()=>setLockerLightbox(url)}
                      className="h-20 w-20 rounded-xl object-cover border-2 border-white/50 cursor-pointer hover:border-white transition-all hover:scale-105"/>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {/* Locker lightbox */}
        {lockerLightbox&&(
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={()=>setLockerLightbox(null)}>
            <div className="relative max-w-2xl w-full" onClick={e=>e.stopPropagation()}>
              <img src={lockerLightbox} alt="locker" className="w-full rounded-2xl shadow-2xl"/>
              <button onClick={()=>setLockerLightbox(null)} className="absolute top-3 right-3 w-9 h-9 bg-black/60 text-white rounded-full flex items-center justify-center text-lg hover:bg-black/80">✕</button>
            </div>
          </div>
        )}

        {/* Page title */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              {tabs.find(t => t.id === activeTab)?.label}
            </h1>
            <p className="text-xs text-gray-400">Proyojon Plus ড্যাশবোর্ড</p>
          </div>
          <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs hover:bg-gray-50">
            <RefreshCw size={13}/> রিফ্রেশ
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

          {/* OVERVIEW */}
          {activeTab==='overview'&&(
            <div>
              {/* International Gold Price */}
              <div className="mb-5 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl p-4 text-white shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🌍</span>
                    <span className="text-sm font-semibold">আন্তর্জাতিক স্বর্ণ বাজার মূল্য</span>
                    {!gpLoading && !gpError && <span className="text-[10px] bg-white/30 px-2 py-0.5 rounded-full">LIVE</span>}
                  </div>
                  <button onClick={gpRefresh} className="text-white/80 hover:text-white text-xs transition-colors">↻ রিফ্রেশ</button>
                </div>
                {gpLoading ? (
                  <p className="text-white/80 text-xs">লোড হচ্ছে...</p>
                ) : gpError || !liveGold ? (
                  <p className="text-white/80 text-xs">মূল্য পাওয়া যাচ্ছে না</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white/20 rounded-lg px-3 py-1.5 text-center">
                      <p className="text-[10px] text-white/70">24K/গ্রাম</p>
                      <p className="text-sm font-bold">৳{liveGold.bdtPer24kGram.toLocaleString()}</p>
                    </div>
                    <div className="bg-white/20 rounded-lg px-3 py-1.5 text-center">
                      <p className="text-[10px] text-white/70">22K/গ্রাম</p>
                      <p className="text-sm font-bold">৳{liveGold.bdtPer22kGram.toLocaleString()}</p>
                    </div>
                    <div className="bg-white/20 rounded-lg px-3 py-1.5 text-center">
                      <p className="text-[10px] text-white/70">আন্তর্জাতিক</p>
                      <p className="text-sm font-bold">${liveGold.usdPerOz.toLocaleString()}/oz</p>
                    </div>
                  </div>
                )}
                {liveGold && !gpLoading && (
                  <p className="text-[10px] text-white/60 mt-1.5">আপডেট: {minutesAgo(liveGold.updatedAt)} • তথ্যসূত্র: আন্তর্জাতিক বাজার (goldprice.org)</p>
                )}
              </div>

              <div className="flex items-center gap-3 mb-5">
                <h2 className="text-lg font-bold">{t('myId')}</h2>
                {user.is_dealer && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold rounded-full shadow-md">
                    <Award size={12} /> ডিলার
                  </span>
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  {([
                    [t('name'), user.name],[t('email'), user.email],[t('phone'), user.phone],['জয়েনিং তারিখ', user.created_at ? new Date(user.created_at).toLocaleDateString('bn-BD') : '—'],
                    [t('package'), pkgLabel],[t('status'), user.is_active?t('active'):t('inactive')],
                    ...(user.package_type==='customer'?[[t('monthlyPv'),`${user.monthly_pv_purchased||0}/100`],...(user.expires_at?[[t('expiry'),`${daysLeft} ${t('daysLeft')}`]]:[])]:[] as any),
                    ...(user.package_type==='shareholder'?[[t('shareholderPkg'),`${user.shareholder_count||1}টি`]]:[] as any),
                    ...(user.package_type==='gold'?[[t('goldPkg'),`${goldPackages.length||1}টি`],[t('goldReferIncome'),`৳${(user.gold_referral_income||0).toLocaleString()}`],[t('goldPending'),`৳${(user.gold_referral_pending||0).toLocaleString()}`],[t('bakeya'),`৳${realTimeBakeya.toLocaleString()}`]]:[] as any),
                  ] as [string,string][]).map(([lbl,val],i)=>(
                    <div key={i} className="flex justify-between items-center py-2.5 border-b border-gray-50">
                      <span className="text-sm text-gray-500">{lbl}</span>
                      <span className="text-sm font-semibold text-gray-900">{val}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-700 mb-4">{t('incomeSummary')}</h3>
                  <div className="space-y-2 mb-5">
                    {[
                      {label:t('referIncome'), value:sumByType('referral_income')},
                      {label:t('genBonus'),    value:sumByType('generation_bonus')},
                      {label:t('clubBonus'),   value:sumByTypes(['daily_club','weekly_club','insurance_club','pension_club','shareholder_club'])},
                      ...(user.package_type==='gold'?[{label:t('goldDaily'),value:sumByType('gold_daily')}]:[]),
                      ...(user.is_dealer?[{label:'ডিলার কমিশন',value:sumByType('dealer_commission')}]:[]),
                    ].map((item,i)=>(
                      <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                        <span className="text-sm text-gray-600">{item.label}</span>
                        <span className="text-sm font-bold text-indigo-600">৳{item.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                    <p className="text-xs text-indigo-700 font-semibold mb-2">{t('referralLink')}</p>
                    <div className="flex items-center gap-2">
                      <input readOnly value={`${window.location.origin}/register?ref=${user.id}`} className="flex-1 text-xs bg-white px-3 py-2 rounded-lg border border-indigo-200 font-mono text-gray-600 truncate"/>
                      <button onClick={copyReferralLink} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex-shrink-0">{copied?<Check size={14}/>:<Copy size={14}/>}</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* INCOME */}
          {activeTab==='income'&&(
            <div>
              <h2 className="text-lg font-bold mb-5">{t('incomeDetails')}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {([
                  {label:t('referIncome'),   type:'referral_income',  color:'from-green-500 to-emerald-600', icon:<Users size={20}/>},
                  {label:t('genBonus'),       type:'generation_bonus', color:'from-blue-500 to-indigo-600',   icon:<TrendingUp size={20}/>},
                  {label:'ডেইলি ক্লাব',      type:'daily_club',       color:'from-orange-500 to-red-600',    icon:<Gift size={20}/>},
                  {label:'উইকলি ক্লাব',       type:'weekly_club',      color:'from-purple-500 to-pink-600',   icon:<Crown size={20}/>},
                  {label:'ইনসুরেন্স ক্লাব',  type:'insurance_club',   color:'from-teal-500 to-cyan-600',     icon:<Shield size={20}/>},
                  {label:'পেনশন ক্লাব',       type:'pension_club',     color:'from-amber-500 to-yellow-600',  icon:<Award size={20}/>},
                  {label:'শেয়ারহোল্ডার ক্লাব',type:'shareholder_club',color:'from-violet-500 to-purple-600', icon:<Star size={20}/>},
                  {label:t('goldDaily'),      type:'gold_daily',       color:'from-yellow-500 to-orange-600', icon:<Award size={20}/>},
                ]).map(item=>(
                  <div key={item.type} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className={`w-10 h-10 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center text-white mb-3`}>{item.icon}</div>
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="text-xl font-bold text-gray-900 mt-0.5">৳{sumByType(item.type).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TEAM LEVEL */}
          {activeTab==='team'&&(
            <div>
              <h2 className="text-lg font-bold mb-2">{t('genTable')}</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5 text-xs text-blue-800">{t('genNote')}</div>
              {loading ? <div className="text-center py-8 text-gray-400 text-sm">{t('loading')}</div>
              : generations.length===0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Users size={40} className="mx-auto mb-3 opacity-30"/>
                  <p className="text-sm">{t('noReferrals')}</p>
                  <button onClick={copyReferralLink} className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">{t('copyRefLink')}</button>
                </div>
              ) : (
                <div className="space-y-5">
                  {generations.map(({gen,members})=>(
                    <div key={gen} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className={`${genColors[gen-1]} p-3 text-white font-bold text-sm flex items-center justify-between`}>
                        <span>লেভেল {gen}</span><span className="text-xs opacity-80 font-normal">{members.length} জন</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead><tr className="bg-gray-50">{[t('genName'),t('genPhone'),t('genPkg'),t('genPv'),t('genStatus')].map(h=><th key={h} className="text-left py-2 px-3 text-xs font-medium text-gray-500">{h}</th>)}</tr></thead>
                          <tbody>
                            {members.map((m:any)=>(
                              <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                                <td className="py-2.5 px-3 font-medium text-xs">{m.name}</td>
                                <td className="py-2.5 px-3 text-xs text-gray-500">{m.phone}</td>
                                <td className="py-2.5 px-3"><span className={`text-xs px-2 py-0.5 rounded-full ${m.package_type==='gold'?'bg-yellow-100 text-yellow-700':m.package_type==='shareholder'?'bg-purple-100 text-purple-700':'bg-blue-100 text-blue-700'}`}>{m.package_type==='customer'?t('customerPkg'):m.package_type==='shareholder'?t('shareholderPkg'):t('goldPkg')}</span></td>
                                <td className="py-2.5 px-3 text-xs">{m.pv_points||0}</td>
                                <td className="py-2.5 px-3"><span className={`text-xs font-medium ${m.is_active?'text-green-600':'text-red-500'}`}>{m.is_active?t('active'):t('inactive')}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Referral purchases feed */}
              {referralPurchases.length>0&&(
                <div className="mt-6">
                  <h3 className="font-semibold text-sm text-gray-700 mb-3">ডিরেক্ট রেফারদের সাম্প্রতিক কেনাকাটা</h3>
                  <div className="space-y-2">
                    {referralPurchases.map((p:any,i:number)=>(
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div>
                          <p className="text-xs font-semibold text-gray-800">{p.user?.name||'—'}</p>
                          <p className="text-[10px] text-gray-400">{p.user?.phone} • {new Date(p.created_at).toLocaleDateString('bn-BD')}</p>
                          <p className="text-[10px] text-gray-500">{p.source||'purchase'}</p>
                        </div>
                        <span className="text-sm font-bold text-indigo-600">+{p.amount||0} PV</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CLUBS */}
          {activeTab==='clubs'&&(
            <div>
              <h2 className="text-lg font-bold mb-5">{t('clubTitle')}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {([
                  {key:'daily_club',       label:'ডেইলি ক্লাব',        desc:'PV এর ৩০%',   flag:user.is_daily_club,       color:'from-orange-500 to-red-500',    cond:'Customer package হলেই',      icon:<ShoppingBag size={18}/>},
                  {key:'weekly_club',      label:'উইকলি ক্লাব',         desc:'PV এর ২.৫%',  flag:user.is_weekly_club,      color:'from-green-500 to-emerald-600',cond:'১৫ ডিরেক্ট Customer রেফার', icon:<Users size={18}/>},
                  {key:'insurance_club',   label:'ইনসুরেন্স ক্লাব',     desc:'PV এর ১.২৫%', flag:user.is_insurance_club,   color:'from-blue-500 to-indigo-600',  cond:'১৫ জন Weekly club member',   icon:<Shield size={18}/>},
                  {key:'pension_club',     label:'পেনশন ক্লাব',         desc:'PV এর ১.২৫%', flag:user.is_pension_club,     color:'from-teal-500 to-cyan-600',    cond:'ইনসুরেন্সের সাথেই পাবেন',  icon:<Award size={18}/>},
                  {key:'shareholder_club', label:'শেয়ারহোল্ডার ক্লাব',  desc:'PV এর ১০%',   flag:user.is_shareholder_club, color:'from-purple-500 to-violet-600',cond:'Shareholder package holders',icon:<Crown size={18}/>},
                ]).map(club=>(
                  <div key={club.key} className={`rounded-xl p-5 border-2 transition-all ${club.flag?'border-green-300 bg-green-50':'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${club.color} rounded-xl flex items-center justify-center text-white`}>{club.icon}</div>
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${club.flag?'bg-green-500 text-white':'bg-gray-300 text-gray-600'}`}>{club.flag?t('member'):t('notMember')}</span>
                    </div>
                    <h3 className="font-bold text-gray-800 text-sm mb-1">{club.label}</h3>
                    <p className="text-xs text-gray-500 mb-1">{club.desc}</p>
                    <p className="text-xs text-gray-400">{club.cond}</p>
                    {club.flag&&<div className="mt-3 pt-2 border-t border-green-200"><p className="text-xs text-green-700 font-medium">{t('pool')}: ৳{getClubPool(club.key).toLocaleString()}</p></div>}
                  </div>
                ))}
              </div>

              {/* Weekly Club progress (E) */}
              {user.package_type==='customer'&&!user.is_weekly_club&&(
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                  <p className="text-sm font-semibold text-green-800 mb-2">📊 {t('weeklyProgress')}</p>
                  <p className="text-xs text-green-600 mb-2">{t('weeklyTarget')}</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-green-200 rounded-full h-2.5">
                      <div className="bg-green-600 h-2.5 rounded-full transition-all" style={{width:`${Math.min(100,(activeCustomerDirects/15)*100)}%`}}/>
                    </div>
                    <span className="text-sm font-bold text-green-700">{activeCustomerDirects}/15</span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">{t('yourDirects')}: {activeCustomerDirects} জন</p>
                </div>
              )}

              {/* Insurance/Pension progress (F) */}
              {user.is_weekly_club&&!user.is_insurance_club&&(
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <p className="text-sm font-semibold text-blue-800 mb-2">📊 {t('insuranceProgress')}</p>
                  <p className="text-xs text-blue-600 mb-2">{t('insuranceTarget')}</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-blue-200 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full transition-all" style={{width:`${Math.min(100,(weeklyClubDirects/15)*100)}%`}}/>
                    </div>
                    <span className="text-sm font-bold text-blue-700">{weeklyClubDirects}/15</span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">{t('weeklyDirects')}: {weeklyClubDirects} জন</p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800 space-y-1">
                <p className="font-semibold">📌 ক্লাব পুল বন্টন সম্পর্কে</p>
                <p>{t('clubNote')}</p><p>{t('clubNote2')}</p>
              </div>
            </div>
          )}

          {/* PACKAGES */}
          {activeTab==='packages'&&(
            <div>
              <h2 className="text-lg font-bold mb-2">{t('buyPackage')}</h2>
              <p className="text-xs text-gray-500 mb-5">{t('buyPackageNote')}</p>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <button onClick={()=>{setPkgSelected(pkgSelected==='shareholder'?null:'shareholder');setPkgQuantity(1);}} className={`text-left p-5 rounded-2xl border-2 transition-all ${pkgSelected==='shareholder'?'border-purple-500 bg-purple-50':'border-gray-200 hover:border-purple-300 bg-white'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white"><Crown size={22}/></div>
                    <div><h3 className="font-bold text-gray-800">{t('shareholderPkg')} Package</h3><p className="text-purple-600 font-bold text-lg">৳৫,০০০ / টি</p></div>
                  </div>
                  <ul className="space-y-1 text-xs text-gray-600">
                    <li>✓ ৫,০০০ SP যোগ হবে</li><li>✓ শেয়ারহোল্ডার ক্লাব সদস্যপদ</li>
                    <li>✓ ২.৫% রেফার কমিশন</li><li>✓ একাধিক কিনলে ক্লাব শেয়ার গুণ হবে</li>
                  </ul>
                  {(user.shareholder_count||0)>0&&<p className="mt-3 text-xs text-purple-600 font-medium">{t('current')}: {user.shareholder_count}টি</p>}
                </button>
                <button onClick={()=>{setPkgSelected(pkgSelected==='gold'?null:'gold');setPkgQuantity(1);}} className={`text-left p-5 rounded-2xl border-2 transition-all ${pkgSelected==='gold'?'border-yellow-500 bg-yellow-50':'border-gray-200 hover:border-yellow-300 bg-white'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center text-white"><Award size={22}/></div>
                    <div><h3 className="font-bold text-gray-800">{t('goldPkg')} Package</h3><p className="text-yellow-600 font-bold text-lg">৳৫,০০০ থেকে শুরু</p></div>
                  </div>
                  <ul className="space-y-1 text-xs text-gray-600">
                    <li>✓ রেফারার পায় বিনিয়োগের ১.৮% (৩৬৫ দিনে)</li>
                    <li>✓ বকেয়া: বিনিয়োগের ৩৬% (দৈনিক)</li>
                    <li>✓ প্রতিটিতে আলাদা ৩৬৫ দিনের টাইমার</li>
                  </ul>
                  {goldPackages.length>0&&<p className="mt-3 text-xs text-yellow-600 font-medium">{t('current')}: {goldPackages.length}টি</p>}
                </button>
              </div>
              {pkgSelected&&(
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-4">{pkgSelected==='shareholder'?t('shareholderPkg'):t('goldPkg')} {t('buyPackage')}</h3>
                  <form onSubmit={handlePackagePurchase} className="space-y-4">
                    {pkgSelected==='gold'&&(
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-2 block">বিনিয়োগ পরিমাণ (৳) *</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {[5000,6000,7000,10000,15000,30000,50000,80000,100000].map(amt=>(
                            <button key={amt} type="button" onClick={()=>{setGoldAmount(amt);setGoldCustom('');}}
                              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${goldAmount===amt&&!goldCustom?'bg-yellow-500 text-white border-yellow-500':'border-gray-300 text-gray-600 hover:border-yellow-400'}`}>
                              ৳{amt.toLocaleString()}
                            </button>
                          ))}
                          <button type="button" onClick={()=>setGoldCustom(goldCustom===''?'5000':'')}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${goldCustom!==''?'bg-yellow-500 text-white border-yellow-500':'border-gray-300 text-gray-600 hover:border-yellow-400'}`}>
                            অন্য পরিমাণ
                          </button>
                        </div>
                        {goldCustom!==''&&(
                          <input type="number" value={goldCustom} onChange={e=>{setGoldCustom(e.target.value);const v=parseInt(e.target.value)||5000;setGoldAmount(Math.max(5000,v));}}
                            min="5000" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-yellow-500 outline-none mb-2" placeholder="৳৫,০০০ বা তার বেশি"/>
                        )}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs space-y-1">
                          <p className="text-yellow-800">💰 রেফারার ইনকাম: <span className="font-bold">৳{(goldAmount*0.018*pkgQuantity).toFixed(2)}</span> (৳{(goldAmount*0.018/365).toFixed(4)}/দিন)</p>
                          <p className="text-yellow-700">📊 দৈনিক বকেয়া: <span className="font-bold">৳{(goldAmount*0.36/365*pkgQuantity).toFixed(2)}</span>/দিন</p>
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-2 block">{t('quantity')} *</label>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={()=>setPkgQuantity(q=>Math.max(1,q-1))} className="w-10 h-10 rounded-xl border border-gray-300 text-xl font-bold flex items-center justify-center hover:bg-gray-100">−</button>
                        <span className="text-xl font-bold w-12 text-center">{pkgQuantity}</span>
                        <button type="button" onClick={()=>setPkgQuantity(q=>Math.min(pkgSelected==='shareholder'?10:5,q+1))} className="w-10 h-10 rounded-xl border border-gray-300 text-xl font-bold flex items-center justify-center hover:bg-gray-100">+</button>
                        <span className="text-sm text-gray-500 ml-2">মোট: ৳{((pkgSelected==='shareholder'?5000:goldAmount)*pkgQuantity).toLocaleString()}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-2 block">{t('payMethod')} *</label>
                      <div className="grid grid-cols-4 gap-2">
                        {pkgPayMethods.map(m=>(
                          <button key={m.key} type="button" onClick={()=>{setPkgMethod(m.key);setPkgAccount('');setPkgTxnRef('');}} className={`p-2.5 rounded-xl border-2 text-center text-xs font-bold transition-all ${pkgMethod===m.key?'shadow-md':'border-gray-200 text-gray-500'}`} style={pkgMethod===m.key?{borderColor:m.color,backgroundColor:m.color+'18',color:m.color}:{}}>{m.label}</button>
                        ))}
                      </div>
                    </div>
                    {pkgMethod==='balance'?(
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm">
                        <p className="text-green-700">উপলব্ধ: <span className="font-bold">৳{(user.current_balance||0).toLocaleString()}</span></p>
                        {(user.current_balance||0)<(pkgSelected==='shareholder'?5000:goldAmount)*pkgQuantity&&<p className="text-red-600 text-xs mt-1">⚠️ ব্যালেন্স যথেষ্ট নয়</p>}
                      </div>
                    ):(
                      <>
                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-1 block">{pkgMethod==='bkash'?'বিকাশ':pkgMethod==='nagad'?'নগদ':'রকেট'} নম্বর *</label>
                          <input value={pkgAccount} onChange={e=>setPkgAccount(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none" placeholder="০১XXXXXXXXX" required/>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-1 block">ট্রানজেকশন রেফারেন্স (ঐচ্ছিক)</label>
                          <input value={pkgTxnRef} onChange={e=>setPkgTxnRef(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none" placeholder="TrxID"/>
                        </div>
                      </>
                    )}
                    {pkgSelected==='gold'&&(
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-2 block">🔐 গোল্ড লকার ছবি (ঐচ্ছিক)</label>
                        <div className="border-2 border-dashed border-yellow-300 rounded-xl p-4 bg-yellow-50">
                          <label className="flex items-center gap-2 cursor-pointer text-sm text-yellow-700">
                            <Upload size={16}/>{goldLockerFile?goldLockerFile.name:'ছবি আপলোড করুন'}
                            <input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(!f)return;setGoldLockerFile(f);const r=new FileReader();r.onloadend=()=>setGoldLockerPreview(r.result as string);r.readAsDataURL(f);}} className="hidden"/>
                          </label>
                          {goldLockerPreview&&<img src={goldLockerPreview} alt="locker" className="mt-2 h-20 w-auto rounded-lg object-cover"/>}
                          <p className="text-[10px] text-yellow-600 mt-1">⚠️ Package সক্রিয় হলে মেয়াদ শেষের আগে পরিবর্তন করা যাবে না</p>
                        </div>
                      </div>
                    )}
                    <button type="submit" disabled={pkgLoading} className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg">
                      {pkgLoading?t('processing'):`${t('submitRequest')} (৳${((pkgSelected==='shareholder'?5000:goldAmount)*pkgQuantity).toLocaleString()})`}
                    </button>
                  </form>
                </div>
              )}
              {goldPackages.length>0&&(
                <div className="mt-6">
                  <h3 className="font-semibold text-sm text-gray-700 mb-3">{t('activePackages')}</h3>
                  <div className="space-y-2">
                    {goldPackages.map((gp,i)=>{
                      const exp = gp.expires_at?new Date(gp.expires_at):null;
                      const rem = exp?Math.max(0,Math.ceil((exp.getTime()-Date.now())/86400000)):'-';
                      return (
                        <div key={gp.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                          <div className="flex items-center justify-between">
                            <div><p className="text-xs font-bold text-yellow-800">গোল্ড #{i+1}</p><p className="text-[10px] text-yellow-600">{t('purchased')}: {new Date(gp.purchased_at||gp.created_at).toLocaleDateString('bn-BD')}</p></div>
                            <div className="text-right text-xs"><p className="text-yellow-700 font-medium">{rem} {t('daysLeft')}</p><p className="text-yellow-600">মুক্তি: ৳{(gp.income_released||0).toFixed(2)}</p></div>
                          </div>
                          {goldLockerImages[i]&&(
                            <div className="mt-2 pt-2 border-t border-yellow-200">
                              <p className="text-[10px] text-yellow-600 mb-1">🔐 লকার ছবি</p>
                              <img src={goldLockerImages[i]} alt="locker" className="h-16 rounded-lg object-cover border border-yellow-300"/>
                              {exp&&new Date()<exp&&<p className="text-[10px] text-yellow-500 mt-1">🔒 Locked until {exp.toLocaleDateString('bn-BD')}</p>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* WITHDRAW */}
          {activeTab==='withdraw'&&(
            <div className="max-w-lg">
              <h2 className="text-lg font-bold mb-5">{t('withdrawTitle')}</h2>
              {user.package_type==='gold'&&user.is_active&&(
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-5">
                  <h3 className="font-bold text-yellow-800 text-sm mb-1">বকেয়া পরিশোধ</h3>
                  <p className="text-xs text-yellow-700 mb-3">বর্তমান বকেয়া: <span className="font-bold">৳{(user.bakeya_amount||0).toLocaleString()}</span></p>
                  <form onSubmit={handleBakeyaPayment} className="space-y-3">
                    <div className="grid grid-cols-4 gap-2">
                      {[{key:'bkash',label:'বিকাশ',color:'#E2136E'},{key:'nagad',label:'নগদ',color:'#F6921E'},{key:'rocket',label:'রকেট',color:'#8B2F8B'},{key:'balance',label:'ব্যালেন্স',color:'#059669'}].map(m=>(
                        <button key={m.key} type="button" onClick={()=>{setBakeyaMethod(m.key);setBakeyaAccount('');}}
                          className={`p-2 rounded-xl border-2 text-center text-xs font-bold transition-all ${bakeyaMethod===m.key?'shadow-md':'border-gray-200 text-gray-500'}`}
                          style={bakeyaMethod===m.key?{borderColor:m.color,backgroundColor:m.color+'18',color:m.color}:{}}>{m.label}</button>
                      ))}
                    </div>
                    {bakeyaMethod!=='balance'&&(
                      <>
                        <input value={bakeyaAccount} onChange={e=>setBakeyaAccount(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-yellow-500 outline-none" placeholder="মোবাইল নম্বর" required/>
                        <input value={bakeyaTxnRef} onChange={e=>setBakeyaTxnRef(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-yellow-500 outline-none" placeholder="TrxID (ঐচ্ছিক)"/>
                      </>
                    )}
                    {bakeyaMethod==='balance'&&<p className="text-xs text-green-700 bg-green-50 p-2 rounded-lg">ব্যালেন্স: ৳{(user.current_balance||0).toLocaleString()}</p>}
                    <input type="number" value={bakeyaPayAmt} onChange={e=>setBakeyaPayAmt(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-yellow-500 outline-none" placeholder="পরিমাণ" min="1" max={user.bakeya_amount||0} required/>
                    <button type="submit" disabled={bakeyaPayLoading} className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-xl disabled:opacity-50 transition-all">
                      {bakeyaPayLoading?'প্রসেসিং...':'বকেয়া পরিশোধ করুন'}
                    </button>
                  </form>
                </div>
              )}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200 mb-5 flex justify-between items-center">
                <div><p className="text-xs text-gray-500">{t('availableBalance')}</p><p className="text-2xl font-bold text-green-700">৳{(user.current_balance||0).toLocaleString()}</p></div>
                <div className="text-right text-xs text-gray-500"><p>{t('charge')}: ৫%</p><p>{t('minAmount')}: {wdMethod==='bank'?'৳১০০০':'৳১০০'}</p></div>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-5">
                {wdMethods.map(m=>(
                  <button key={m.key} type="button" onClick={()=>handleWdMethodChange(m.key)} className={`p-3 rounded-xl border-2 text-center text-xs font-bold transition-all ${wdMethod===m.key?'shadow-md':'border-gray-200 text-gray-500'}`} style={wdMethod===m.key?{borderColor:m.color,backgroundColor:m.color+'15',color:m.color}:{}}>{m.label}</button>
                ))}
              </div>
              <form onSubmit={handleWithdrawal} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">{wdMethod==='bank'?t('accountNum'):`${wdMethods.find(m=>m.key===wdMethod)?.label} নম্বর`} *</label>
                  <input value={wdAccount} onChange={e=>setWdAccount(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none" placeholder={wdMethods.find(m=>m.key===wdMethod)?.placeholder}/>
                </div>
                {wdMethod==='bank'&&(
                  <div className="space-y-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-xs font-semibold text-blue-700">{t('bankDetails')}</p>
                    {[{label:t('accHolder'),val:wdAccountHolderName,set:setWdAccountHolderName,ph:'আপনার নাম যেমন ব্যাংকে আছে'},
                      {label:t('bankName'),  val:wdBankName,          set:setWdBankName,          ph:'যেমন: Dutch Bangla Bank'},
                      {label:t('routingNum'),val:wdRoutingNumber,     set:setWdRoutingNumber,     ph:'৯ সংখ্যার রাউটিং নম্বর'},
                      {label:t('branchName'),val:wdBranchName,        set:setWdBranchName,        ph:'শাখার নাম ও জেলা'},
                    ].map((f,i)=>(
                      <div key={i}><label className="text-xs font-medium text-gray-500 mb-1 block">{f.label} *</label>
                      <input value={f.val} onChange={e=>f.set(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none bg-white" placeholder={f.ph}/></div>
                    ))}
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">{t('amount')} (৳) *</label>
                  <input type="number" value={wdAmount} onChange={e=>setWdAmount(e.target.value)} required min={wdMethod==='bank'?1000:100} max={user.current_balance||0} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none" placeholder={`সর্বনিম্ন ৳${wdMethod==='bank'?'১০০০':'১০০'}`}/>
                </div>
                {wdAmount&&parseFloat(wdAmount)>=100&&(
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2">
                    {[{l:t('withdrawAmount'),v:`৳${parseFloat(wdAmount).toLocaleString()}`,c:''},{l:`${t('charge')} (৫%)`,v:`- ৳${Math.ceil(parseFloat(wdAmount)*0.05).toLocaleString()}`,c:'text-red-500'},{l:t('netAmount'),v:`৳${(parseFloat(wdAmount)-Math.ceil(parseFloat(wdAmount)*0.05)).toLocaleString()}`,c:'text-green-600 font-bold'}].map((r,i)=>(
                      <div key={i} className={`flex justify-between text-sm ${i===2?'pt-2 border-t border-gray-200':''}`}><span className="text-gray-500">{r.l}</span><span className={`font-medium ${r.c}`}>{r.v}</span></div>
                    ))}
                  </div>
                )}
                <button type="submit" disabled={wdLoading||!wdAmount||parseFloat(wdAmount)<100||parseFloat(wdAmount)>(user.current_balance||0)} className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2">
                  <ArrowDownToLine size={18}/>{wdLoading?t('processing'):t('doWithdraw')}
                </button>
              </form>
              {withdrawals.length>0&&(
                <div className="mt-6">
                  <h3 className="font-semibold text-sm text-gray-700 mb-3">{t('withdrawHistory')}</h3>
                  <div className="space-y-2">
                    {withdrawals.slice(0,8).map(wd=>(
                      <div key={wd.id} className="p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-gray-700">{wd.method?.toUpperCase()} — {wd.account_number}</p>
                            {wd.method==='bank'&&wd.bank_name&&<p className="text-[10px] text-gray-500">{wd.bank_name} | {wd.branch_name}</p>}
                            <p className="text-[10px] text-gray-400">{new Date(wd.created_at).toLocaleDateString('bn-BD')}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-red-600">৳{(wd.amount||0).toLocaleString()}</p>
                            <p className="text-xs text-gray-400">নেট: ৳{(wd.net_amount||0).toLocaleString()}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${wd.status==='approved'?'bg-green-100 text-green-700':wd.status==='rejected'?'bg-red-100 text-red-700':'bg-yellow-100 text-yellow-700'}`}>{wd.status==='approved'?t('approved'):wd.status==='rejected'?t('rejected'):t('pending')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TRANSFER */}
          {activeTab==='transfer'&&(
            <div className="max-w-lg">
              <h2 className="text-lg font-bold mb-5">{t('transferTitle')}</h2>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 mb-5 flex justify-between items-center">
                <div><p className="text-xs text-gray-500">{t('availableBalance')}</p><p className="text-2xl font-bold text-blue-700">৳{(user.current_balance||0).toLocaleString()}</p></div>
                <div className="text-right text-xs text-gray-500"><p>{t('minAmount')}: ৳১০০</p><p>{t('noCharge')}</p></div>
              </div>
              <form onSubmit={handleTransfer} className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">{t('recipientId')} *</label>
                  <input value={trfToId} onChange={e=>setTrfToId(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none font-mono" placeholder="UUID"/>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">{t('amount')} (৳) *</label>
                  <input type="number" value={trfAmount} onChange={e=>setTrfAmount(e.target.value)} required min="100" max={user.current_balance||0} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none" placeholder="সর্বনিম্ন ৳১০০"/>
                </div>
                <button type="submit" disabled={trfLoading||!trfAmount||parseFloat(trfAmount)<100||parseFloat(trfAmount)>(user.current_balance||0)} className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2">
                  <ArrowRightLeft size={18}/>{trfLoading?t('processing'):t('doTransfer')}
                </button>
              </form>
              <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                <p className="text-xs text-yellow-800 font-semibold">{t('transferWarning')}</p>
                <p className="text-xs text-yellow-700 mt-1">{t('transferNote')} পাঠানোর আগে সঠিক User ID নিশ্চিত করুন।</p>
              </div>
              {/* Transfer history (D) */}
              {transferTxns.length>0&&(
                <div>
                  <h3 className="font-semibold text-sm text-gray-700 mb-3">{t('transferHistory')}</h3>
                  <div className="space-y-2">
                    {transferTxns.slice(0,10).map(txn=>(
                      <div key={txn.id} className="flex items-center justify-between py-3 px-4 rounded-xl bg-gray-50">
                        <div>
                          <p className="text-xs font-medium text-gray-700">{txn.description}</p>
                          <p className="text-[10px] text-gray-400">{new Date(txn.created_at).toLocaleString('bn-BD',{dateStyle:'short',timeStyle:'short'})}</p>
                        </div>
                        <div className="text-right">
                          <span className={`font-bold text-sm ${txn.amount>=0?'text-green-600':'text-red-600'}`}>{txn.amount>=0?'+':''}৳{Math.abs(txn.amount).toLocaleString()}</span>
                          <p className="text-[10px] text-gray-400">{txn.type==='transfer_out'?t('sent'):t('received')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* HISTORY */}
          {activeTab==='history'&&(
            <div>
              <h2 className="text-lg font-bold mb-5">{t('historyTitle')}</h2>
              {loading?<div className="text-center py-8 text-gray-400 text-sm">{t('loading')}</div>
              :transactions.length===0?<div className="text-center py-12 text-gray-400"><TrendingUp size={40} className="mx-auto mb-3 opacity-30"/><p className="text-sm">{t('noTx')}</p></div>
              :(
                <div className="space-y-2">
                  {transactions.map(txn=>(
                    <div key={txn.id} className="flex items-center justify-between py-3 px-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-gray-700">{txn.description}</p>
                        <p className="text-xs text-gray-400">{txn.type} • {new Date(txn.created_at).toLocaleString('bn-BD',{dateStyle:'short',timeStyle:'short'})}</p>
                      </div>
                      <span className={`font-bold text-sm ml-4 flex-shrink-0 ${txn.amount>=0?'text-green-600':'text-red-600'}`}>{txn.amount>=0?'+':''}৳{Math.abs(txn.amount).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PROFILE */}
          {activeTab==='profile'&&(
            <div className="max-w-lg">
              <h2 className="text-lg font-bold mb-5">{t('profileTitle')}</h2>
              <div className="space-y-5">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                    {profImgPreview?<img src={profImgPreview} alt="profile" className="w-full h-full object-cover"/>:<span className="text-4xl font-bold text-gray-300">{user.name?.charAt(0)?.toUpperCase()}</span>}
                  </div>
                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-200 transition-all">
                    <Camera size={16}/>{t('changePic')}<input type="file" accept="image/*" onChange={handleProfImgChange} className="hidden"/>
                  </label>
                  {profImgFile&&<p className="text-xs text-green-600">{profImgFile.name}</p>}
                </div>
                {[{label:t('fullName'),val:profName,set:setProfName,ph:'আপনার পুরো নাম'},{label:t('phone'),val:profPhone,set:setProfPhone,ph:'০১XXXXXXXXX'},{label:t('nidNum'),val:profNid,set:setProfNid,ph:'NID নম্বর'}].map((f,i)=>(
                  <div key={i}><label className="text-xs font-medium text-gray-500 mb-1 block">{f.label}</label>
                  <input value={f.val} onChange={e=>f.set(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none" placeholder={f.ph}/></div>
                ))}
                {/* NID front */}
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">{t('nidFront')}</label>
                  {user.nid_front_url&&!profNidFrontFile&&<div className="mb-2 w-full h-28 rounded-xl overflow-hidden border border-gray-200"><img src={user.nid_front_url} alt="NID front" className="w-full h-full object-cover"/></div>}
                  <label className="flex items-center gap-2 px-4 py-2.5 w-full bg-gray-50 border border-dashed border-gray-300 rounded-xl text-sm text-gray-600 cursor-pointer hover:bg-gray-100 transition-all">
                    <Upload size={16}/>{profNidFrontFile?profNidFrontFile.name:t('uploadFront')}<input type="file" accept="image/*" onChange={e=>setProfNidFrontFile(e.target.files?.[0]||null)} className="hidden"/>
                  </label>
                </div>
                {/* NID back */}
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">{t('nidBack')}</label>
                  {user.nid_back_url&&!profNidBackFile&&<div className="mb-2 w-full h-28 rounded-xl overflow-hidden border border-gray-200"><img src={user.nid_back_url} alt="NID back" className="w-full h-full object-cover"/></div>}
                  <label className="flex items-center gap-2 px-4 py-2.5 w-full bg-gray-50 border border-dashed border-gray-300 rounded-xl text-sm text-gray-600 cursor-pointer hover:bg-gray-100 transition-all">
                    <Upload size={16}/>{profNidBackFile?profNidBackFile.name:t('uploadBack')}<input type="file" accept="image/*" onChange={e=>setProfNidBackFile(e.target.files?.[0]||null)} className="hidden"/>
                  </label>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">{t('nidNote')}</div>
                <button onClick={handleProfileSave} disabled={profLoading} className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg">
                  {profLoading?t('saving'):t('saveProfile')}
                </button>
              </div>

              {/* Password change */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4">পাসওয়ার্ড পরিবর্তন</h3>
                <form onSubmit={handlePasswordChange} className="space-y-3">
                  {[
                    {label:'বর্তমান পাসওয়ার্ড', val:pwCurrent, set:setPwCurrent},
                    {label:'নতুন পাসওয়ার্ড',   val:pwNew,     set:setPwNew},
                    {label:'নিশ্চিত করুন',       val:pwConfirm, set:setPwConfirm},
                  ].map((f,i)=>(
                    <div key={i}>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">{f.label}</label>
                      <input type="password" value={f.val} onChange={e=>f.set(e.target.value)} required minLength={4}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none"/>
                    </div>
                  ))}
                  <button type="submit" disabled={pwLoading} className="w-full py-3 bg-gradient-to-r from-gray-700 to-gray-900 text-white font-bold rounded-xl hover:from-gray-800 hover:to-black disabled:opacity-50 transition-all">
                    {pwLoading ? 'আপডেট হচ্ছে...' : '🔒 পাসওয়ার্ড পরিবর্তন করুন'}
                  </button>
                </form>
              </div>
            </div>
          )}

          </div>

          </div>
        </main>
      </div>
      <Footer/>
    </div>
  );
}
