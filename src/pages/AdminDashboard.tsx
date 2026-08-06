import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { processDealerCommission, processDealerPurchasePv, addToClubPools, PV_CLUB_PCTS } from '@/lib/mlm-business-logic';
import { PERMISSION_GROUPS, PERM_LABELS, ALL_PERMISSIONS } from '@/lib/permissions';
import { hashPassword } from '@/lib/crypto';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminProductManager from '@/components/AdminProductManager';
import {
  Users, Wallet, TrendingUp, Gift, Search, Lock, Unlock, Edit, Trash2, RefreshCw,
  DollarSign, CheckCircle, XCircle, Play, Loader2, BarChart3, Network, Package,
  FolderTree, CreditCard, FileText, Plus, Save, ChevronDown, ChevronRight, ShoppingBag,
  Image, Bell, Star, Award, Shield, UserPlus, UserCheck, UserX, Eye, EyeOff, Key, LogOut,
} from 'lucide-react';
import { toast } from 'sonner';

const clubLabels: Record<string, string> = {
  daily_club:       'ডেইলি ক্লাব',
  weekly_club:      'উইকলি ক্লাব',
  insurance_club:   'ইনসুরেন্স ক্লাব',
  pension_club:     'পেনশন ক্লাব',
  shareholder_club: 'শেয়ারহোল্ডার ক্লাব',
};


const adminT = {
  bn: {
    sidebarTitle: 'এডমিন প্যানেল',
    overview: 'ওভারভিউ', users: 'মেম্বার ম্যানেজ', network: 'নেটওয়ার্ক টেবিল',
    categories: 'ক্যাটাগরি', products: 'পণ্য ম্যানেজ', content: 'গ্যালারি / নোটিশ',
    gold_packages: 'গোল্ড প্যাকেজ', payments: 'পেমেন্ট ভেরিফাই', clubs: 'ক্লাব বন্টন',
    withdrawals: 'উইথড্রো', transactions: 'লেনদেন', orders: 'অর্ডার', reports: 'রিপোর্ট',
    dashTitle: 'এডমিন ড্যাশবোর্ড', dashSub: 'সকল কার্যক্রম পরিচালনা করুন',
    refresh: 'রিফ্রেশ', dailyTask: 'দৈনিক কাজ', running: 'চলছে...',
    totalMembers: 'মোট মেম্বার', activeMembers: 'সক্রিয় মেম্বার',
    totalIncome: 'মোট ইনকাম বন্টিত', totalWithdraw: 'মোট উইথড্রো',
    approve: 'অনুমোদন', reject: 'প্রত্যাখ্যান', edit: 'সম্পাদনা', delete: 'মুছুন',
    save: 'সংরক্ষণ', cancel: 'বাতিল', search: 'নাম, ইমেইল বা ফোন...',
    active: 'সক্রিয়', inactive: 'নিষ্ক্রিয়', locked: 'লক',
    pending: 'পেন্ডিং', approved: 'অনুমোদিত', rejected: 'প্রত্যাখ্যাত',
    dealer: 'ডিলার', gift: 'গিফট',
    systemOverview: 'সিস্টেম ওভারভিউ', clubMembers: 'ক্লাব সদস্য', pendingTasks: 'পেন্ডিং কাজ',
    pendingWithdraw: 'পেন্ডিং উইথড্রো', pendingPayment: 'পেন্ডিং পেমেন্ট', inactiveIds: 'নিষ্ক্রিয় আইডি',
    pvRanking: 'এ মাসের PV র‍্যাংকিং', noPv: 'এই মাসে কোনো PV নেই',
    clickList: 'ক্লিক করে তালিকা দেখুন →', ofTotal: '% মোট সদস্যের',
    memberMgmt: 'মেম্বার ম্যানেজমেন্ট',
    colName: 'নাম', colEmail: 'ইমেইল/ফোন', colPkg: 'প্যাকেজ', colBal: 'ব্যালেন্স',
    colPv: 'PV', colStatus: 'স্ট্যাটাস', colPass: 'পাসওয়ার্ড', colAction: 'অ্যাকশন',
    netCols: ['নাম','আপলাইন','লেভেল','টিম','আয়','ব্যালেন্স','ক্লাব'],
    imageGallery: 'ইমেজ গ্যালারি', galleryNote: 'ওয়েবসাইটে যে ছবিগুলো দেখাবে সেগুলো এখান থেকে আপলোড করুন',
    chooseFile: 'ছবি বেছে নিন', captionLabel: 'ক্যাপশন (ঐচ্ছিক)', noImages: 'কোনো ছবি নেই',
    noticeBoard: 'নোটিশ বোর্ড', noticeNote: 'ওয়েবসাইটের নোটিশ বার এ যা দেখাবে সেগুলো এখান থেকে পোস্ট করুন',
    noticeTitleLabel: 'শিরোনাম *', noticeExpiry: 'মেয়াদ শেষ (ঐচ্ছিক)', noticeDetail: 'বিস্তারিত (ঐচ্ছিক)',
    postNotice: 'নোটিশ প্রকাশ করুন', noNotice: 'কোনো নোটিশ নেই',
    goldPkgMgmt: 'গোল্ড প্যাকেজ ম্যানেজ',
    gpCols: ['#','ব্যবহারকারী','ফোন','বিনিয়োগ','কেনার তারিখ','মেয়াদ শেষ','বাকি দিন','দৈনিক ইনকাম','স্ট্যাটাস','সম্পাদনা'],
    catMgmt: 'ক্যাটাগরি ম্যানেজমেন্ট', newCat: 'নতুন ক্যাটাগরি',
    shopCollections: 'শপ কালেকশন', shopColNote: 'শপ নেভিগেশন ড্রপডাউনে যা দেখাবে',
    newCollection: '+ নতুন কালেকশন', colTitle: 'কালেকশন নাম', colDesc: 'বিবরণ (ঐচ্ছিক)',
    dealerReq: 'ডিলার রিকুইজিশন',
  },
  en: {
    sidebarTitle: 'Admin Panel',
    overview: 'Overview', users: 'Member Manage', network: 'Network Table',
    categories: 'Categories', products: 'Product Manage', content: 'Gallery / Notice',
    gold_packages: 'Gold Packages', payments: 'Payment Verify', clubs: 'Club Distribute',
    withdrawals: 'Withdrawals', transactions: 'Transactions', orders: 'Orders', reports: 'Reports',
    dashTitle: 'Admin Dashboard', dashSub: 'Manage all operations',
    refresh: 'Refresh', dailyTask: 'Daily Task', running: 'Running...',
    totalMembers: 'Total Members', activeMembers: 'Active Members',
    totalIncome: 'Total Income Distributed', totalWithdraw: 'Total Withdrawals',
    approve: 'Approve', reject: 'Reject', edit: 'Edit', delete: 'Delete',
    save: 'Save', cancel: 'Cancel', search: 'Name, email or phone...',
    active: 'Active', inactive: 'Inactive', locked: 'Locked',
    pending: 'Pending', approved: 'Approved', rejected: 'Rejected',
    dealer: 'Dealer', gift: 'Gift',
    systemOverview: 'System Overview', clubMembers: 'Club Members', pendingTasks: 'Pending Tasks',
    pendingWithdraw: 'Pending Withdrawals', pendingPayment: 'Pending Payments', inactiveIds: 'Inactive IDs',
    pvRanking: 'Monthly PV Ranking', noPv: 'No PV this month',
    clickList: 'Click to view list →', ofTotal: '% of total members',
    memberMgmt: 'Member Management',
    colName: 'Name', colEmail: 'Email/Phone', colPkg: 'Package', colBal: 'Balance',
    colPv: 'PV', colStatus: 'Status', colPass: 'Password', colAction: 'Action',
    netCols: ['Name','Upline','Level','Team','Income','Balance','Club'],
    imageGallery: 'Image Gallery', galleryNote: 'Upload images to display on the website',
    chooseFile: 'Choose Image', captionLabel: 'Caption (optional)', noImages: 'No images',
    noticeBoard: 'Notice Board', noticeNote: 'Post notices that appear on the website notice bar',
    noticeTitleLabel: 'Title *', noticeExpiry: 'Expiry (optional)', noticeDetail: 'Details (optional)',
    postNotice: 'Post Notice', noNotice: 'No notices',
    goldPkgMgmt: 'Gold Package Management',
    gpCols: ['#','User','Phone','Investment','Purchase Date','Expiry','Days Left','Daily Income','Status','Edit'],
    catMgmt: 'Category Management', newCat: 'New Category',
    shopCollections: 'Shop Collections', shopColNote: 'Appears in shop navigation dropdown',
    newCollection: '+ New Collection', colTitle: 'Collection Name', colDesc: 'Description (optional)',
    dealerReq: 'Dealer Requisitions',
  },
} as const;

export default function AdminDashboard() {
  const { user, subAdminAccount, loading: authLoading, isSuperAdmin, hasPermission, logout } = useAuth();
  const { lang } = useLang();
  const at = (key: keyof typeof adminT.bn): any => {
    const currentLang = (lang === 'en') ? 'en' : 'bn';
    const dict = adminT[currentLang] || adminT.bn;
    return dict[key] || adminT.bn[key] || key;
  };
  const navigate = useNavigate();
  const handleAdminLogout = () => { logout(); navigate('/admin/login'); };
  // Determine current admin display name
  const currentAdminName = user?.name || subAdminAccount?.name || 'Admin';
  const currentAdminRole = isSuperAdmin ? 'সুপার এডমিন' : 'সাব এডমিন';
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [clubPools, setClubPools] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [shopCollections, setShopCollections] = useState<any[]>([]);
  const [colForm, setColForm] = useState({ title: '', description: '' });
  const [showColForm, setShowColForm] = useState(false);
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
  const [manualGoldUserId,    setManualGoldUserId]    = useState('');
  const [manualGoldAmount,    setManualGoldAmount]    = useState('');
  const [manualGoldLoading,   setManualGoldLoading]   = useState(false);
  const [manualBakeyaUserId,  setManualBakeyaUserId]  = useState('');
  const [manualBakeyaAmount,  setManualBakeyaAmount]  = useState('');
  const [manualBakeyaLoading, setManualBakeyaLoading] = useState(false);

  // Gallery state
  const [galleryItems,     setGalleryItems]     = useState<any[]>([]);
  const [galleryCaption,   setGalleryCaption]   = useState('');
  const [galleryUploading, setGalleryUploading] = useState(false);
  const galleryFileRef = useRef<HTMLInputElement>(null);

  // Notice state
  const [notices,        setNotices]        = useState<any[]>([]);
  const [noticeTitle,    setNoticeTitle]    = useState('');
  const [noticeContent,  setNoticeContent]  = useState('');
  const [noticeExpiry,   setNoticeExpiry]   = useState('');
  const [noticeSaving,   setNoticeSaving]   = useState(false);

  // Overview extras
  const [pvLeaders,        setPvLeaders]        = useState<any[]>([]);
  const [pkgModalType,     setPkgModalType]     = useState<string|null>(null);
  const [pkgModalUsers,    setPkgModalUsers]    = useState<any[]>([]);
  const [overviewSearch,   setOverviewSearch]   = useState('');

  // Gift bonus state (#8)
  const [giftModalUser,  setGiftModalUser]  = useState<any>(null);
  const [giftAmount,     setGiftAmount]     = useState('');
  const [giftLoading,    setGiftLoading]    = useState(false);

  // Dealer form state (#16)
  const [dealerFormUser,  setDealerFormUser]  = useState<any>(null);
  const [dealerFormType,  setDealerFormType]  = useState('');
  const [dealerFormNotes, setDealerFormNotes] = useState('');
  const [requisitions,    setRequisitions]    = useState<any[]>([]);
  const [processingReqId, setProcessingReqId] = useState<string | null>(null);

  // Gold packages admin (#15)
  const [adminGoldPkgs,  setAdminGoldPkgs]  = useState<any[]>([]);
  const [goldEditPkg,    setGoldEditPkg]    = useState<any>(null);
  const [goldEditDate,   setGoldEditDate]   = useState('');
  const [goldEditLoading,setGoldEditLoading]= useState(false);

  // ── Sub Admin Management state ────────────────────────────────────────────
  const [subAdmins,      setSubAdmins]      = useState<any[]>([]);
  const [saModal,        setSaModal]        = useState<'add' | 'edit' | null>(null);
  const [editSa,         setEditSa]         = useState<any>(null);
  const [saForm,         setSaForm]         = useState({
    name: '', email: '', phone: '', password: '', notes: '',
    permissions: [] as string[], is_active: true,
  });
  const [saLoading,      setSaLoading]      = useState(false);
  const [showSaPass,     setShowSaPass]     = useState(false);

  useEffect(() => {
    if (authLoading) return;
    // Allow super admin (mlm_users role='admin') OR active sub admin
    const isAdminAccess = (user?.role === 'admin') || (!!subAdminAccount && subAdminAccount.is_active);
    if (!isAdminAccess) { navigate('/admin/login'); return; }
    fetchAll();
  }, [user, subAdminAccount, authLoading]);

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

    const { data: ordersRaw } = await supabase.from('ecom_orders')
      .select('*, user:mlm_users(name, phone, email)')
      .order('created_at', { ascending: false }).limit(50);

    if (ordersRaw && ordersRaw.length > 0) {
      const orderIds = ordersRaw.map((o: any) => o.id);
      const { data: itemsRaw } = await supabase.from('ecom_order_items')
        .select('*, product:ecom_products(title, image_url)')
        .in('order_id', orderIds);
      const merged = ordersRaw.map((o: any) => ({
        ...o,
        order_items: (itemsRaw || []).filter((i: any) => i.order_id === o.id),
      }));
      setOrders(merged);
    } else if (ordersRaw) {
      setOrders([]);
    }

    const { data: catsData } = await supabase.from('mlm_categories').select('*').order('sort_order');
    if (catsData) setCategories(catsData);

    const { data: colsData } = await supabase.from('ecom_collections').select('*').order('title');
    if (colsData) setShopCollections(colsData);

    const { data: prodsData } = await supabase.from('ecom_products').select('*').order('created_at', { ascending: false });
    if (prodsData) setProducts(prodsData);

    const { data: pvData } = await supabase.from('mlm_payment_verifications')
      .select('*, user_id, user:mlm_users(name, email, phone)').order('created_at', { ascending: false });
    if (pvData) setPV(pvData);

    const { data: galleryData } = await supabase.from('proyojon_gallery')
      .select('*').order('sort_order').order('created_at', { ascending: false });
    if (galleryData) setGalleryItems(galleryData);

    const { data: noticeData } = await supabase.from('proyojon_notices')
      .select('*').order('priority', { ascending: false }).order('created_at', { ascending: false });
    if (noticeData) setNotices(noticeData);

    const { data: leadersData } = await supabase.from('mlm_users')
      .select('id, name, phone, package_type, monthly_pv_purchased')
      .neq('role', 'admin')
      .order('monthly_pv_purchased', { ascending: false })
      .limit(15);
    if (leadersData) setPvLeaders(leadersData);

    const { data: goldPkgsData } = await supabase.from('mlm_gold_packages')
      .select('*, user:mlm_users(name,phone)')
      .order('purchased_at', { ascending: false });
    if (goldPkgsData) setAdminGoldPkgs(goldPkgsData);

    const { data: reqData } = await supabase
      .from('dealer_requisitions')
      .select('*, dealer:dealer_id(name, phone, dealer_area)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (reqData) setRequisitions(reqData);

    // Sub admin list (only for super admin or manage_sub_admins permission)
    if (hasPermission('manage_sub_admins')) {
      const { data: saData } = await supabase
        .from('admin_sub_accounts')
        .select('*')
        .order('created_at', { ascending: false });
      if (saData) setSubAdmins(saData);
    }
  };

  // ── Sub Admin CRUD ────────────────────────────────────────────────────────
  const openAddSa = () => {
    setSaForm({ name: '', email: '', phone: '', password: '', notes: '', permissions: [], is_active: true });
    setEditSa(null);
    setSaModal('add');
  };

  const openEditSa = (sa: any) => {
    setSaForm({
      name: sa.name || '', email: sa.email || '', phone: sa.phone || '',
      password: '', notes: sa.notes || '',
      permissions: sa.permissions || [], is_active: sa.is_active,
    });
    setEditSa(sa);
    setSaModal('edit');
  };

  const handleSaveSa = async () => {
    if (!saForm.name.trim() || !saForm.email.trim()) { toast.error('নাম ও ইমেইল বাধ্যতামূলক'); return; }
    if (saModal === 'add' && !saForm.password.trim()) { toast.error('পাসওয়ার্ড দিন'); return; }
    if (saForm.password && saForm.password.length < 4) { toast.error('পাসওয়ার্ড কমপক্ষে ৪ অক্ষর'); return; }
    setSaLoading(true);
    try {
      if (saModal === 'add') {
        // Check email uniqueness
        const { data: existing } = await supabase.from('admin_sub_accounts').select('id').eq('email', saForm.email.trim()).maybeSingle();
        if (existing) { toast.error('এই ইমেইল দিয়ে আগেই সাব এডমিন আছে'); setSaLoading(false); return; }
        const pwHash = await hashPassword(saForm.password);
        const { error } = await supabase.from('admin_sub_accounts').insert({
          name: saForm.name.trim(), email: saForm.email.trim().toLowerCase(),
          phone: saForm.phone.trim() || null, password_hash: pwHash,
          permissions: saForm.permissions, is_active: saForm.is_active,
          notes: saForm.notes.trim() || null,
        });
        if (error) { toast.error('সমস্যা: ' + error.message); } else { toast.success('✅ সাব এডমিন যোগ হয়েছে!'); }
      } else if (saModal === 'edit' && editSa) {
        const payload: any = {
          name: saForm.name.trim(), phone: saForm.phone.trim() || null,
          permissions: saForm.permissions, is_active: saForm.is_active,
          notes: saForm.notes.trim() || null, updated_at: new Date().toISOString(),
        };
        if (saForm.password.trim()) payload.password_hash = await hashPassword(saForm.password);
        const { error } = await supabase.from('admin_sub_accounts').update(payload).eq('id', editSa.id);
        if (error) { toast.error('সমস্যা: ' + error.message); } else { toast.success('✅ সাব এডমিন আপডেট হয়েছে!'); }
      }
      setSaModal(null); setEditSa(null); fetchAll();
    } finally { setSaLoading(false); }
  };

  const handleDeleteSa = async (id: string, name: string) => {
    if (!window.confirm(`${name} কে মুছতে চান?`)) return;
    const { error } = await supabase.from('admin_sub_accounts').delete().eq('id', id);
    if (error) { toast.error('সমস্যা: ' + error.message); } else { toast.success('মুছে ফেলা হয়েছে'); fetchAll(); }
  };

  const toggleSaPerm = (perm: string) => {
    setSaForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const toggleSaPermGroup = (perms: string[]) => {
    const allChecked = perms.every(p => saForm.permissions.includes(p));
    setSaForm(prev => ({
      ...prev,
      permissions: allChecked
        ? prev.permissions.filter(p => !perms.includes(p))
        : [...new Set([...prev.permissions, ...perms])],
    }));
  };

  // ── Daily cron ───────────────────────────────────────────────────────────────
  const handleRunDailyCron = async () => {
    setCronRunning(true);
    setCronResult(null);
    try {
      let goldCount = 0;
      const now = new Date();

      // Per-package gold referral daily release
      const { data: goldPkgs } = await supabase.from('mlm_gold_packages')
        .select('id, user_id, daily_income, daily_bakeya, referral_income_pending, bakeya_accumulated, income_released, expires_at')
        .eq('status', 'active').gt('referral_income_pending', 0);

      for (const pkg of (goldPkgs || [])) {
        if (pkg.expires_at && new Date(pkg.expires_at) <= now) {
          await supabase.from('mlm_gold_packages').update({ status: 'expired' }).eq('id', pkg.id);
          continue;
        }
        const { data: buyer } = await supabase.from('mlm_users').select('referrer_id').eq('id', pkg.user_id).single();
        if (!buyer?.referrer_id) continue;
        const { data: referrer } = await supabase.from('mlm_users')
          .select('id, current_balance, total_income, gold_referral_pending, is_active')
          .eq('id', buyer.referrer_id).eq('is_active', true).single();
        if (!referrer) continue;
        const release = parseFloat(Math.min(pkg.daily_income, pkg.referral_income_pending).toFixed(4));
        if (release <= 0) continue;
        await supabase.from('mlm_users').update({
          current_balance:       parseFloat(((referrer.current_balance||0) + release).toFixed(4)),
          total_income:          parseFloat(((referrer.total_income||0) + release).toFixed(4)),
          gold_referral_pending: parseFloat(Math.max(0,(referrer.gold_referral_pending||0) - release).toFixed(4)),
        }).eq('id', referrer.id);
        await supabase.from('mlm_gold_packages').update({
          referral_income_pending: parseFloat(Math.max(0, pkg.referral_income_pending - release).toFixed(4)),
          income_released:         parseFloat(((pkg.income_released||0) + release).toFixed(4)),
        }).eq('id', pkg.id);
        await supabase.from('mlm_transactions').insert({
          user_id: referrer.id, type: 'gold_daily', amount: release,
          description: `গোল্ড দৈনিক রিলিজ ৳${release.toFixed(4)}`,
        });
        goldCount++;
      }

      // Per-package bakeya accumulation for buyers
      const { data: allGoldPkgs } = await supabase.from('mlm_gold_packages')
        .select('id, user_id, daily_bakeya, bakeya_accumulated, expires_at').eq('status', 'active');
      const bakeyaUserMap: Record<string, number> = {};
      for (const pkg of (allGoldPkgs || [])) {
        if (pkg.expires_at && new Date(pkg.expires_at) <= now) {
          await supabase.from('mlm_gold_packages').update({ status: 'expired' }).eq('id', pkg.id);
          continue;
        }
        bakeyaUserMap[pkg.user_id] = (bakeyaUserMap[pkg.user_id]||0) + pkg.daily_bakeya;
        await supabase.from('mlm_gold_packages').update({
          bakeya_accumulated: parseFloat(((pkg.bakeya_accumulated||0)+pkg.daily_bakeya).toFixed(4)),
        }).eq('id', pkg.id);
      }
      for (const [uid, bakeyaAmt] of Object.entries(bakeyaUserMap)) {
        const { data: bu } = await supabase.from('mlm_users').select('bakeya_amount').eq('id', uid).single();
        if (bu) await supabase.from('mlm_users').update({ bakeya_amount: parseFloat(((bu.bakeya_amount||0)+bakeyaAmt).toFixed(4)) }).eq('id', uid);
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

      setCronResult({ success: true, results: { goldReferralDistributed: goldCount, bakeyaAccumulated: Object.keys(bakeyaUserMap).length, deactivatedUsers: deactivatedCount, monthlyPvReset: pvReset } });
      toast.success('দৈনিক কাজ সম্পন্ন!');
      fetchAll();
    } catch (e: any) {
      toast.error('সমস্যা: ' + e.message);
      setCronResult({ success: false, error: e.message });
    }
    setCronRunning(false);
  };

  const handleManualGoldCredit = async () => {
    const amount = parseFloat(manualGoldAmount);
    if (!manualGoldUserId.trim()||isNaN(amount)||amount<=0) { toast.error('User ID ও পরিমাণ দিন'); return; }
    setManualGoldLoading(true);
    const { data: target } = await supabase.from('mlm_users').select('id, name, current_balance, total_income').eq('id', manualGoldUserId.trim()).single();
    if (!target) { toast.error('User পাওয়া যায়নি'); setManualGoldLoading(false); return; }
    await supabase.from('mlm_users').update({ current_balance:(target.current_balance||0)+amount, total_income:(target.total_income||0)+amount }).eq('id', target.id);
    const { error: txErr } = await supabase.from('mlm_transactions').insert({ user_id:target.id, type:'admin_credit', amount, description:`এডমিন প্যানেল থেকে ৳${amount} ব্যালেন্স সংযুক্ত করা হয়েছে` });
    if (txErr) { toast.error(`Transaction log error: ${txErr.message}`); setManualGoldLoading(false); return; }
    toast.success(`✅ ৳${amount} → ${target.name} এ জমা হয়েছে`);
    setManualGoldUserId(''); setManualGoldAmount('');
    fetchAll(); setManualGoldLoading(false);
  };

  const handleManualBakeyaDeduct = async () => {
    const amount = parseFloat(manualBakeyaAmount);
    if (!manualBakeyaUserId.trim()||isNaN(amount)||amount<=0) { toast.error('User ID ও পরিমাণ দিন'); return; }
    setManualBakeyaLoading(true);
    const { data: target } = await supabase.from('mlm_users').select('id, name, bakeya_amount, gold_referral_pending').eq('id', manualBakeyaUserId.trim()).single();
    if (!target) { toast.error('User পাওয়া যায়নি'); setManualBakeyaLoading(false); return; }
    const newBakeya = Math.max(0, (target.bakeya_amount||0) - amount);
    const deductFromPending = Math.min(amount, target.gold_referral_pending||0);
    await supabase.from('mlm_users').update({
      bakeya_amount: parseFloat(newBakeya.toFixed(4)),
      gold_referral_pending: Math.max(0,(target.gold_referral_pending||0)-deductFromPending),
    }).eq('id', target.id);
    await supabase.from('mlm_transactions').insert({ user_id:target.id, type:'bakeya_deduct', amount:-amount, description:`Admin বকেয়া কর্তন ৳${amount}` });
    toast.success(`✅ ${target.name} এর বকেয়া ৳${amount} কমানো হয়েছে`);
    setManualBakeyaUserId(''); setManualBakeyaAmount('');
    fetchAll(); setManualBakeyaLoading(false);
  };

  const handleLockUser = async (userId: string, lock: boolean) => {
    await supabase.from('mlm_users').update({ is_locked: lock }).eq('id', userId);
    toast.success(lock ? 'আইডি লক' : 'আইডি আনলক');
    fetchAll();
  };

  const handleToggleDealer = async (userId: string, makeDealer: boolean, area?: string) => {
    const payload: any = { is_dealer: makeDealer };
    if (makeDealer) payload.dealer_area = area?.trim() || null;
    else payload.dealer_area = null;
    const { error } = await supabase.from('mlm_users').update(payload).eq('id', userId);
    if (error) { toast.error('সমস্যা: ' + error.message); return; }
    toast.success(makeDealer ? '✅ ডিলার মনোনীত করা হয়েছে' : '❌ ডিলার মর্যাদা বাতিল');
    setDealerFormUser(null); setDealerFormType(''); setDealerFormNotes('');
    fetchAll();
  };

  const handleAcceptRequisition = async (req: any) => {
    if (processingReqId === req.id) return; // double-click guard
    setProcessingReqId(req.id);
    try {
      // 1. Mark requisition accepted
      await supabase.from('dealer_requisitions').update({ status: 'accepted', processed_at: new Date().toISOString() }).eq('id', req.id);

      // 2. Upsert dealer_stock (increment or insert)
      const { data: existing } = await supabase.from('dealer_stock')
        .select('id, quantity').eq('dealer_id', req.dealer_id).eq('product_id', req.product_id).maybeSingle();
      if (existing) {
        await supabase.from('dealer_stock').update({ quantity: existing.quantity + req.quantity, updated_at: new Date().toISOString() }).eq('id', existing.id);
      } else {
        await supabase.from('dealer_stock').insert({ dealer_id: req.dealer_id, product_id: req.product_id, product_name: req.product_name, quantity: req.quantity });
      }

      // 3. Credit commission to dealer
      const commission = req.commission_amount || 0;
      if (commission > 0) {
        const { data: dealer } = await supabase.from('mlm_users').select('current_balance, total_income').eq('id', req.dealer_id).single();
        if (dealer) {
          await supabase.from('mlm_users').update({
            current_balance: Number(dealer.current_balance || 0) + commission,
            total_income:    Number(dealer.total_income    || 0) + commission,
          }).eq('id', req.dealer_id);
          await supabase.from('mlm_transactions').insert({
            user_id: req.dealer_id, type: 'dealer_commission', amount: commission,
            description: `ডিলার রিকুইজিশন কমিশন — ${req.product_name} (${req.quantity}টি, ৳${commission})`,
          });
        }
      }

      // PV chain: dealer's upline gets generation bonus + club pools contribution
      if (req.total_pv > 0) {
        await processDealerPurchasePv(req.dealer_id, req.total_pv);
      }

      toast.success(`✅ রিকুইজিশন গ্রহণ — ${req.product_name} (${req.quantity}টি) স্টকে যোগ হয়েছে`);
      await fetchAll();
    } finally {
      setProcessingReqId(null);
    }
  };

  const handleRejectRequisition = async (id: string) => {
    await supabase.from('dealer_requisitions').update({ status: 'rejected', processed_at: new Date().toISOString() }).eq('id', id);
    toast.success('রিকুইজিশন বাতিল করা হয়েছে');
    fetchAll();
  };

  const handleGiftBonus = async () => {
    if (!giftModalUser) return;
    const amt = parseInt(giftAmount, 10);
    if (isNaN(amt) || amt <= 0) { toast.error('সঠিক পরিমাণ দিন'); return; }
    setGiftLoading(true);
    const { data: u } = await supabase.from('mlm_users').select('current_balance,total_income').eq('id', giftModalUser.id).single();
    await supabase.from('mlm_users').update({
      current_balance: (u?.current_balance||0) + amt,
      total_income:    (u?.total_income||0) + amt,
    }).eq('id', giftModalUser.id);
    await supabase.from('mlm_transactions').insert({
      user_id: giftModalUser.id, type: 'gift_bonus', amount: amt,
      description: `মাসিক PV গিফট পুরস্কার — ৳${amt}`,
    });
    toast.success(`✅ ৳${amt} গিফট দেওয়া হয়েছে ${giftModalUser.name} কে`);
    setGiftModalUser(null); setGiftAmount('');
    setGiftLoading(false); fetchAll();
  };

  const handleGoldPkgDateSave = async () => {
    if (!goldEditPkg || !goldEditDate) return;
    setGoldEditLoading(true);
    const newExpiry = new Date(goldEditDate).toISOString();
    const remainingDays = Math.max(1, Math.ceil((new Date(goldEditDate).getTime() - Date.now()) / 86400000));
    const newDailyIncome = parseFloat(((goldEditPkg.referral_income_pending || 0) / remainingDays).toFixed(4));
    await supabase.from('mlm_gold_packages').update({
      expires_at: newExpiry,
      daily_income: newDailyIncome,
    }).eq('id', goldEditPkg.id);
    toast.success('✅ মেয়াদ আপডেট হয়েছে');
    setGoldEditPkg(null); setGoldEditDate('');
    setGoldEditLoading(false); fetchAll();
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('শুধু ছবি আপলোড করুন'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('ছবি ৫MB এর বেশি হওয়া যাবে না'); return; }
    setGalleryUploading(true);
    const ext      = file.name.split('.').pop();
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: upErr } = await supabase.storage.from('gallery-images').upload(`gallery/${filename}`, file);
    if (upErr) { toast.error('আপলোড সমস্যা: ' + upErr.message); setGalleryUploading(false); return; }
    const { data: urlData } = supabase.storage.from('gallery-images').getPublicUrl(`gallery/${filename}`);
    await supabase.from('proyojon_gallery').insert({ image_url: urlData.publicUrl, caption: galleryCaption.trim() || null, sort_order: 0, is_visible: true });
    toast.success('✅ ছবি গ্যালারিতে যোগ হয়েছে!');
    setGalleryCaption('');
    if (galleryFileRef.current) galleryFileRef.current.value = '';
    fetchAll(); setGalleryUploading(false);
  };

  const handleDeleteGallery = async (id: string, imageUrl: string) => {
    await supabase.from('proyojon_gallery').delete().eq('id', id);
    const path = imageUrl.split('/gallery-images/')[1];
    if (path) await supabase.storage.from('gallery-images').remove([path]);
    toast.success('মুছে ফেলা হয়েছে'); fetchAll();
  };

  const handleToggleGalleryVisibility = async (id: string, current: boolean) => {
    await supabase.from('proyojon_gallery').update({ is_visible: !current }).eq('id', id);
    fetchAll();
  };

  const handleSaveNotice = async () => {
    if (!noticeTitle.trim()) { toast.error('নোটিশের শিরোনাম দিন'); return; }
    setNoticeSaving(true);
    await supabase.from('proyojon_notices').insert({
      title:      noticeTitle.trim(),
      content:    noticeContent.trim() || null,
      expires_at: noticeExpiry || null,
      is_active:  true,
      priority:   0,
    });
    toast.success('✅ নোটিশ প্রকাশিত হয়েছে!');
    setNoticeTitle(''); setNoticeContent(''); setNoticeExpiry('');
    fetchAll(); setNoticeSaving(false);
  };

  const handleDeleteNotice = async (id: string) => {
    await supabase.from('proyojon_notices').delete().eq('id', id);
    toast.success('নোটিশ মুছে ফেলা হয়েছে'); fetchAll();
  };

  const handleToggleNotice = async (id: string, current: boolean) => {
    await supabase.from('proyojon_notices').update({ is_active: !current }).eq('id', id);
    fetchAll();
  };

  const openPackageModal = async (pkgType: string) => {
    setPkgModalType(pkgType);
    const pkgUsers = pkgType === 'dealer'
      ? users.filter(u => u.is_dealer && u.role !== 'admin')
      : users.filter(u => u.package_type === pkgType && u.role !== 'admin');
    setPkgModalUsers(pkgUsers);
  };

  const handleUpdateUser = async () => {
    if (!editUser) return;
    setLoading(true);
    await supabase.from('mlm_users').update({
      name: editUser.name, email: editUser.email, phone: editUser.phone,
      password_hash: editUser.password_hash,
      is_active: editUser.is_active, is_locked: editUser.is_locked,
      current_balance: editUser.current_balance,
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

  const handleAddCollection = async () => {
    if (!colForm.title) { toast.error('নাম দিন'); return; }
    const handle = colForm.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    await supabase.from('ecom_collections').insert({ title: colForm.title, handle, description: colForm.description || null, is_visible: true });
    toast.success('কালেকশন যোগ হয়েছে!');
    setColForm({ title: '', description: '' }); setShowColForm(false); fetchAll();
  };

  const handleDeleteCollection = async (id: string) => {
    await supabase.from('ecom_collections').delete().eq('id', id);
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

  // ── Payment approve ──────────────────────────────────────────────────────
  const handleApprovePayment = async (id: string, approve: boolean) => {
    const pv = paymentVerifications.find(p => p.id === id);
    if (!pv || pv.status !== 'pending') return;
    setLoading(true);

    // DB-level idempotency check — double-click বা race condition রোধ করে
    const { data: freshPv } = await supabase.from('mlm_payment_verifications').select('status').eq('id', id).single();
    if (freshPv?.status !== 'pending') {
      toast.error('এই পেমেন্ট ইতিমধ্যে প্রসেস হয়েছে');
      setLoading(false); fetchAll(); return;
    }

    if (approve) {
      await supabase.from('mlm_payment_verifications').update({ status: 'approved', processed_at: new Date().toISOString() }).eq('id', id);

      // ══ CASE 1: Product purchase ══════════════════════════════════════════
      if (pv.purpose === 'product_purchase') {
        // Check if this is a dealer order — if so, skip PV (PV deferred to dealer acceptance)
        const { data: dealerOrder } = await supabase
          .from('ecom_orders')
          .select('dealer_id')
          .ilike('stripe_payment_intent_id', `mobile_${pv.method}_${pv.trx_id}`)
          .maybeSingle();
        if (dealerOrder?.dealer_id) {
          await supabase.from('mlm_transactions').insert({
            user_id:     pv.user_id,
            type:        'payment_verified',
            amount:      pv.amount || 0,
            description: `পেমেন্ট যাচাই — ডিলার অর্ডার ৳${pv.amount}। PV ডিলার এক্সেপ্ট করলে বন্টন হবে।`,
          });
          await supabase.from('ecom_orders')
            .update({ status: 'paid' })
            .ilike('stripe_payment_intent_id', `mobile_${pv.method}_${pv.trx_id}`);
          toast.success('✅ পেমেন্ট অনুমোদিত। PV ডিলার এক্সেপ্ট করলে বন্টন হবে।');
          fetchAll(); setLoading(false); return;
        }

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

          // Generation bonus — all package types
          if (userData.referrer_id && pvToAdd > 0) {
            await distributeGenerationBonus(userData.referrer_id, pvToAdd, pv.user_id, 1);
          }

          // Club pools
          if (pvToAdd >= 1) await addToClubPools(pvToAdd);

          // Dealer commission: ডিলার নিজে কিনলে তার PV এর ৫% extra
          if (pvToAdd > 0) await processDealerCommission(pv.user_id, pvToAdd);
        }

        toast.success('✅ পণ্য পেমেন্ট অনুমোদিত! PV ও Club pool আপডেট হয়েছে।');
        fetchAll(); setLoading(false);
        return;
      }

      // ══ CASE 2: Customer registration ══
      if (pv.purpose === 'customer_registration') {
        toast.success('✅ রেজিস্ট্রেশন নিশ্চিত হয়েছে। আইডি সক্রিয় হবে ১,০০০ PV পণ্য কিনলে।');
        fetchAll(); setLoading(false);
        return;
      }

      // ══ CASE 2B: Bakeya payment ══
      if (pv.purpose === 'bakeya_payment') {
        const { data: bakeyaUser } = await supabase.from('mlm_users').select('bakeya_amount').eq('id', pv.user_id).single();
        if (bakeyaUser) {
          const newBakeya = Math.max(0, (bakeyaUser.bakeya_amount||0) - (pv.amount||0));
          await supabase.from('mlm_users').update({ bakeya_amount: parseFloat(newBakeya.toFixed(4)) }).eq('id', pv.user_id);
          await supabase.from('mlm_transactions').insert({ user_id:pv.user_id, type:'bakeya_payment', amount:-(pv.amount||0), description:`বকেয়া পরিশোধ ৳${pv.amount}` });
        }
        toast.success('✅ বকেয়া পরিশোধ অনুমোদিত!');
        fetchAll(); setLoading(false);
        return;
      }

      // ══ CASE 3: Package purchase ══════════════════════════════════════════
      const isCustomer    = pv.purpose === 'customer_package';
      const isShareholder = pv.purpose === 'shareholder_package';
      const isGold        = pv.purpose === 'gold_package';

      const quantity = pv.quantity || 1;

      // Fetch current buyer data for additive calculations
      const { data: buyerData } = await supabase.from('mlm_users')
        .select('pv_points, ps_points, gp_points, shareholder_count, is_weekly_club, is_insurance_club, is_pension_club, is_daily_club, is_shareholder_club')
        .eq('id', pv.user_id).single();

      let pvPoints = 0, psPoints = 0, gpPoints = 0;
      let goldStart = null;
      const expiry = new Date();

      if (isCustomer) {
        pvPoints = 1000;
        expiry.setDate(expiry.getDate() + 30);
      } else if (isShareholder) {
        psPoints = ((buyerData?.ps_points || 0) + quantity * 5000);
        expiry.setDate(expiry.getDate() + 30);
      } else if (isGold) {
        const amtPerPkg = (pv.amount||0) / quantity;
        gpPoints  = (buyerData?.gp_points || 0) + quantity * amtPerPkg;
        goldStart = new Date().toISOString();
        expiry.setDate(expiry.getDate() + 365);
      }

      const updatePayload: any = {
        is_active:            true,
        expires_at:           expiry.toISOString(),
        activated_at:         new Date().toISOString(),
        monthly_pv_purchased: isCustomer ? pvPoints : 0,
        // Preserve existing club flags — only set new ones
        is_daily_club:       isCustomer ? true : (buyerData?.is_daily_club ?? false),
        is_shareholder_club: isShareholder ? true : (buyerData?.is_shareholder_club ?? false),
        is_weekly_club:      buyerData?.is_weekly_club ?? false,
        is_insurance_club:   buyerData?.is_insurance_club ?? false,
        is_pension_club:     buyerData?.is_pension_club ?? false,
      };

      if (isGold) updatePayload.gold_package_start = goldStart;
      if (isCustomer)    updatePayload.pv_points = pvPoints;
      if (isShareholder) {
        updatePayload.ps_points         = psPoints;
        updatePayload.shareholder_count = (buyerData?.shareholder_count || 0) + quantity;
      }
      if (isGold) updatePayload.gp_points = gpPoints;

      await supabase.from('mlm_users').update(updatePayload).eq('id', pv.user_id);

      // Gold: insert one row per package to mlm_gold_packages (proportional)
      if (isGold) {
        const goldExpiry = new Date();
        goldExpiry.setDate(goldExpiry.getDate() + 365);
        const amtPerPkg      = (pv.amount||0) / quantity;
        const refIncomePkg   = parseFloat((amtPerPkg * 0.018).toFixed(4));
        const dailyIncomePkg = parseFloat((refIncomePkg / 365).toFixed(4));
        const dailyBakeyaPkg = parseFloat((amtPerPkg * 0.36 / 365).toFixed(4));
        for (let i = 0; i < quantity; i++) {
          const { error: gpInsertError } = await supabase.from('mlm_gold_packages').insert({
            user_id:                 pv.user_id,
            amount:                  amtPerPkg,
            purchased_at:            new Date().toISOString(),
            expires_at:              goldExpiry.toISOString(),
            daily_income:            dailyIncomePkg,
            daily_bakeya:            dailyBakeyaPkg,
            referral_income_pending: refIncomePkg,
            income_released:         0,
            bakeya_accumulated:      0,
            status:                  'active',
          });
          if (gpInsertError) { toast.error(`Gold package insert error: ${gpInsertError.message}`); setLoading(false); return; }
        }
      }

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
            commission = Math.floor(1000 * 0.05); // ৳50 fixed per customer
            desc       = 'কাস্টমার রেফার কমিশন (৫%)';
          } else if (isShareholder) {
            commission = quantity * Math.floor(5000 * 0.025); // ৳125 × quantity
            desc       = `শেয়ারহোল্ডার রেফার কমিশন (২.৫% × ${quantity}টি)`;
          } else if (isGold) {
            const amtPerPkg2   = (pv.amount||0) / quantity;
            const totalGold    = parseFloat((amtPerPkg2 * 0.018 * quantity).toFixed(4));
            await supabase.from('mlm_users').update({
              gold_referral_income:  parseFloat(((referrer.gold_referral_income || 0) + totalGold).toFixed(4)),
              gold_referral_pending: parseFloat(((referrer.gold_referral_pending || 0) + totalGold).toFixed(4)),
            }).eq('id', referrer.id);
            await supabase.from('mlm_transactions').insert({
              user_id: referrer.id, type: 'referral_income', amount: totalGold,
              description: `গোল্ড রেফার ইনকাম (৳${totalGold}, ${quantity}টি প্যাকেজ, ৩৬৫ দিনে বন্টন)`, related_user_id: pv.user_id,
            });
            // Bakeya accumulates per gold package via cron (mlm_gold_packages)
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

  const isAdminAccess = (user?.role === 'admin') || (!!subAdminAccount && subAdminAccount.is_active);

  useEffect(() => {
    if (!authLoading && !isAdminAccess) {
      navigate('/admin/login');
    }
  }, [authLoading, isAdminAccess, navigate]);

  if (authLoading || !isAdminAccess) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Loader2 size={32} className="animate-spin text-indigo-600" />
    </div>
  );

  const allSidebarItems = [
    { id: 'overview',      perm: 'view_overview',      label: at('overview'),      icon: <BarChart3 size={18} /> },
    { id: 'users',         perm: 'view_members',        label: at('users'),         icon: <Users size={18} /> },
    { id: 'network',       perm: 'view_network',        label: at('network'),       icon: <Network size={18} /> },
    { id: 'categories',    perm: 'view_categories',     label: at('categories'),    icon: <FolderTree size={18} /> },
    { id: 'products',      perm: 'view_products',       label: at('products'),      icon: <ShoppingBag size={18} /> },
    { id: 'content',       perm: 'view_gallery',        label: at('content'),       icon: <Image size={18} /> },
    { id: 'gold_packages', perm: 'view_gold_packages',  label: at('gold_packages'), icon: <Award size={18} /> },
    { id: 'payments',      perm: 'view_payments',       label: at('payments'),      icon: <CreditCard size={18} /> },
    { id: 'clubs',         perm: 'distribute_clubs',    label: at('clubs'),         icon: <Gift size={18} /> },
    { id: 'withdrawals',   perm: 'view_withdrawals',    label: at('withdrawals'),   icon: <Wallet size={18} /> },
    { id: 'transactions',  perm: 'view_transactions',   label: at('transactions'),  icon: <FileText size={18} /> },
    { id: 'orders',        perm: 'view_orders',         label: at('orders'),        icon: <Package size={18} /> },
    { id: 'dealer-req',    perm: 'view_dealer_req',     label: at('dealerReq'),     icon: <Star size={18} /> },
    { id: 'reports',       perm: 'view_reports',        label: at('reports'),       icon: <BarChart3 size={18} /> },
    { id: 'sub-admins',    perm: 'manage_sub_admins',   label: 'সাব এডমিন',       icon: <Shield size={18} /> },
  ];
  const sidebarItems = allSidebarItems.filter(item => hasPermission(item.perm));

  useEffect(() => {
    if (sidebarItems.length > 0 && !sidebarItems.some(item => item.id === activeTab)) {
      setActiveTab(sidebarItems[0].id);
    }
  }, [subAdminAccount, user]);

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
            {sidebarOpen && <p className="text-xs text-gray-500 uppercase tracking-wider px-3 mb-3">{at('sidebarTitle')}</p>}
            <nav className="space-y-1">
              {sidebarItems.map(item => (
                <button key={item.id} onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                  {item.icon}
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              ))}
            </nav>
            {/* Admin role badge at bottom of sidebar */}
            {sidebarOpen && (
              <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isSuperAdmin ? 'bg-yellow-500/20' : 'bg-indigo-500/20'}`}>
                    {isSuperAdmin ? <Shield size={14} className="text-yellow-400" /> : <UserCheck size={14} className="text-indigo-400" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-xs font-medium truncate">{currentAdminName}</p>
                    <p className={`text-[10px] ${isSuperAdmin ? 'text-yellow-400' : 'text-indigo-400'}`}>{currentAdminRole}</p>
                  </div>
                </div>
                <button onClick={handleAdminLogout} title="লগআউট" className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors ml-1">
                  <LogOut size={16} />
                </button>
              </div>
            )}
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
              <h1 className="text-xl font-bold text-gray-900">{at('dashTitle')}</h1>
              <p className="text-gray-500 text-xs">
                {at('dashSub')} ·
                <span className={`ml-1 font-medium ${isSuperAdmin ? 'text-yellow-600' : 'text-indigo-600'}`}>
                  {currentAdminName} ({currentAdminRole})
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchAll} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs hover:bg-gray-50">
                <RefreshCw size={14} /> {at('refresh')}
              </button>
              {hasPermission('run_daily_cron') && (
                <button onClick={handleRunDailyCron} disabled={cronRunning}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg text-xs hover:from-orange-600 hover:to-red-600 disabled:opacity-50 shadow-lg">
                  {cronRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                  {cronRunning ? at('running') : at('dailyTask')}
                </button>
              )}
              <button onClick={handleAdminLogout} className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs hover:bg-red-100 font-medium transition-colors">
                <LogOut size={14} /> লগআউট
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

          {activeTab === 'overview' && hasPermission('view_overview') && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {[
                { label: at('totalMembers'),  value: stats.totalUsers,                              icon: <Users size={20} />,      color: 'from-blue-500 to-cyan-500' },
                { label: at('activeMembers'), value: stats.activeUsers,                             icon: <CheckCircle size={20} />, color: 'from-green-500 to-emerald-500' },
                { label: at('totalIncome'),   value: `৳${stats.totalIncome.toLocaleString()}`,       icon: <TrendingUp size={20} />, color: 'from-purple-500 to-pink-500' },
                { label: at('totalWithdraw'), value: `৳${stats.totalWithdrawals.toLocaleString()}`, icon: <DollarSign size={20} />, color: 'from-orange-500 to-red-500' },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className={`w-10 h-10 bg-gradient-to-br ${s.color} rounded-lg flex items-center justify-center text-white mb-2`}>{s.icon}</div>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-lg font-bold text-gray-900">{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab !== 'sub-admins' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">

            {activeTab === 'overview' && hasPermission('view_overview') && (() => {
              const now    = new Date();
              const h24ago = new Date(now.getTime() - 24 * 60 * 60 * 1000);
              const d7ago  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
              const newLast24h  = users.filter(u => u.role !== 'admin' && new Date(u.created_at) >= h24ago).length;
              const newLast7d   = users.filter(u => u.role !== 'admin' && new Date(u.created_at) >= d7ago).length;
              const dealerCount = users.filter(u => u.is_dealer && u.role !== 'admin').length;

              const oq = overviewSearch.trim().toLowerCase();
              const overviewResults = oq.length >= 1
                ? users.filter(u =>
                    u.role !== 'admin' && (
                      u.name?.toLowerCase().includes(oq) ||
                      u.phone?.includes(oq) ||
                      u.email?.toLowerCase().includes(oq) ||
                      u.id?.toLowerCase().includes(oq)
                    )
                  ).slice(0, 20)
                : [];

              return (
              <div>
                <h2 className="text-lg font-bold mb-4">{at('systemOverview')}</h2>

                {/* ── গত ২৪ঘ / ৭দিন stat row ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-gray-400 mb-1">মোট সদস্য</p>
                    <p className="text-2xl font-extrabold text-gray-800">{stats.totalUsers}</p>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-gray-400 mb-1">সক্রিয় সদস্য</p>
                    <p className="text-2xl font-extrabold text-green-600">{stats.activeUsers}</p>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-indigo-400 mb-1">গত ২৪ ঘণ্টায় নতুন</p>
                    <p className="text-2xl font-extrabold text-indigo-600">{newLast24h}</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-purple-400 mb-1">গত ৭ দিনে নতুন</p>
                    <p className="text-2xl font-extrabold text-purple-600">{newLast7d}</p>
                  </div>
                </div>

                {/* ── Package + Dealer cards (4 কলাম) ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                  {[
                    { pkg: 'customer',    label: 'কাস্টমার',       color: 'from-blue-500 to-cyan-500',     bg: 'bg-blue-50 border-blue-200',     textColor: 'text-blue-700',   count: users.filter(u => u.package_type === 'customer'    && u.role !== 'admin').length },
                    { pkg: 'shareholder', label: 'শেয়ারহোল্ডার',  color: 'from-purple-500 to-violet-500', bg: 'bg-purple-50 border-purple-200', textColor: 'text-purple-700', count: users.filter(u => u.package_type === 'shareholder' && u.role !== 'admin').length },
                    { pkg: 'gold',        label: 'গোল্ড',           color: 'from-yellow-500 to-orange-500', bg: 'bg-yellow-50 border-yellow-200', textColor: 'text-yellow-700', count: users.filter(u => u.package_type === 'gold'        && u.role !== 'admin').length },
                    { pkg: 'dealer',      label: 'ডিলার',           color: 'from-orange-500 to-red-500',   bg: 'bg-orange-50 border-orange-200', textColor: 'text-orange-700', count: dealerCount },
                  ].map(({ pkg, label, color, bg, textColor, count }) => {
                    const pct = Math.round((count / (stats.totalUsers || 1)) * 100);
                    return (
                      <button key={pkg} onClick={() => openPackageModal(pkg)}
                        className={`${bg} border rounded-2xl p-4 text-left hover:shadow-md transition-all cursor-pointer`}>
                        <div className={`w-9 h-9 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center text-white mb-3`}>
                          <Users size={16} />
                        </div>
                        <p className="text-xs text-gray-500 mb-1">{label}</p>
                        <p className={`text-2xl font-extrabold ${textColor}`}>{count} জন</p>
                        <div className="w-full h-1.5 bg-white/60 rounded-full mt-2 overflow-hidden">
                          <div className={`h-full bg-gradient-to-r ${color} rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">{pct}{at('ofTotal')}</p>
                        <p className={`text-[10px] font-semibold ${textColor} mt-1`}>{at('clickList')}</p>
                      </button>
                    );
                  })}
                </div>

                {/* ── সার্চ বার ── */}
                <div className="mb-6">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={overviewSearch}
                      onChange={e => setOverviewSearch(e.target.value)}
                      placeholder="নাম, ফোন, ইমেইল বা আইডি দিয়ে সার্চ করুন..."
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none bg-white shadow-sm"
                    />
                    {overviewSearch && (
                      <button onClick={() => setOverviewSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
                    )}
                  </div>

                  {overviewResults.length > 0 && (
                    <div className="mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                      <p className="text-[11px] text-gray-400 px-3 py-1.5 border-b border-gray-100">{overviewResults.length} ফলাফল</p>
                      <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                        {overviewResults.map(u => (
                          <div key={u.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 bg-gradient-to-br ${u.package_type==='gold'?'from-yellow-500 to-orange-500':u.package_type==='shareholder'?'from-purple-500 to-violet-500':'from-blue-500 to-cyan-500'}`}>
                              {u.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-sm font-medium text-gray-800 truncate">{u.name}</p>
                                {u.is_dealer && <span className="text-[9px] px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded-full font-bold">ডিলার</span>}
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${u.is_active?'bg-green-100 text-green-700':'bg-red-100 text-red-500'}`}>{u.is_active?'সক্রিয়':'নিষ্ক্রিয়'}</span>
                              </div>
                              <p className="text-xs text-gray-400">{u.phone}{u.email ? ` · ${u.email}` : ''}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${u.package_type==='gold'?'bg-yellow-100 text-yellow-700':u.package_type==='shareholder'?'bg-purple-100 text-purple-700':'bg-blue-100 text-blue-700'}`}>
                                {u.package_type==='customer'?'কাস্টমার':u.package_type==='shareholder'?'শেয়ারহোল্ডার':'গোল্ড'}
                              </span>
                              <p className="text-[10px] text-gray-400 mt-0.5">৳{(u.current_balance||0).toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {oq.length >= 1 && overviewResults.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-3 bg-white border border-gray-100 rounded-xl mt-2">কোনো ফলাফল পাওয়া যায়নি</p>
                  )}
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="font-semibold text-sm text-gray-700 mb-3">{at('clubMembers')}</h3>
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
                    <h3 className="font-semibold text-sm text-gray-700 mb-3">{at('pendingTasks')}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-2 px-3 bg-yellow-50 rounded-lg border border-yellow-100">
                        <span className="text-sm text-yellow-800">{at('pendingWithdraw')}</span>
                        <span className="font-bold text-yellow-700">{withdrawals.filter(w=>w.status==='pending').length}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded-lg border border-blue-100">
                        <span className="text-sm text-blue-800">{at('pendingPayment')}</span>
                        <span className="font-bold text-blue-700">{paymentVerifications.filter(p=>p.status==='pending' && p.purpose!=='customer_registration').length}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-3 bg-red-50 rounded-lg border border-red-100">
                        <span className="text-sm text-red-800">{at('inactiveIds')}</span>
                        <span className="font-bold text-red-700">{users.filter(u=>!u.is_active&&u.role!=='admin').length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Monthly PV leaderboard */}
                  <div>
                    <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-1.5">
                      <Star size={14} className="text-yellow-500" /> {at('pvRanking')}
                    </h3>
                    <div className="space-y-1.5">
                      {pvLeaders.filter(u => (u.monthly_pv_purchased || 0) > 0).slice(0, 15).map((u, i) => (
                        <div key={u.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-gray-50 text-xs">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] text-white flex-shrink-0 ${i===0?'bg-yellow-500':i===1?'bg-gray-400':i===2?'bg-orange-400':'bg-gray-300'}`}>{i+1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{u.name}</p>
                            <p className="text-gray-400">{u.phone}</p>
                          </div>
                          <span className="font-bold text-green-600 flex-shrink-0">{(u.monthly_pv_purchased||0).toLocaleString()} PV</span>
                          {hasPermission('gift_bonus') && (
                            <button onClick={()=>{setGiftModalUser(u);setGiftAmount('');}} className="ml-1 px-2 py-1 bg-yellow-500 text-white text-[10px] font-bold rounded-lg hover:bg-yellow-600">{at('gift')}</button>
                          )}
                        </div>
                      ))}
                      {pvLeaders.filter(u => (u.monthly_pv_purchased || 0) > 0).length === 0 && (
                        <p className="text-xs text-gray-400 text-center py-4">{at('noPv')}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              );
            })()}

            {activeTab === 'users' && hasPermission('view_members') && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-lg font-bold">{at('memberMgmt')}</h2>
                  <div className="flex-1 max-w-sm relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      placeholder={at('search')}
                      className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-indigo-500 outline-none" />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50">
                      {[at('colName'),at('colEmail'),at('colPkg'),at('colBal'),at('colPv'),at('colStatus'),at('colPass'),at('colAction')].map(h => (
                        <th key={h} className="text-left py-2 px-3 text-xs font-medium text-gray-500">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {filteredUsers.filter(u => u.role !== 'admin').map(u => (
                        <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2 px-3 font-medium">
                            <div className="flex items-center gap-1.5">
                              {u.name}
                              {u.is_dealer && <span className="text-[9px] px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded-full font-bold">ডিলার</span>}
                            </div>
                          </td>
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
                          <td className="py-2 px-3 text-xs font-mono text-gray-400 max-w-[120px] truncate" title={u.password_hash}>{u.password_hash}</td>
                          <td className="py-2 px-3">
                            <div className="flex gap-1">
                              {hasPermission('edit_members') && (
                                <button onClick={() => setEditUser({...u})} className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600"><Edit size={14} /></button>
                              )}
                              {hasPermission('lock_members') && (
                                <button onClick={() => handleLockUser(u.id, !u.is_locked)}
                                  className={`p-1.5 rounded-lg ${u.is_locked?'hover:bg-green-50 text-green-600':'hover:bg-red-50 text-red-600'}`}>
                                  {u.is_locked?<Unlock size={14} />:<Lock size={14} />}
                                </button>
                              )}
                              {hasPermission('set_dealer') && (
                                <button
                                  onClick={() => u.is_dealer ? handleToggleDealer(u.id, false) : setDealerFormUser(u)}
                                  title={u.is_dealer ? 'ডিলার মর্যাদা বাতিল' : 'ডিলার বানান'}
                                  className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${u.is_dealer ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' : 'hover:bg-orange-50 text-gray-400 hover:text-orange-600'}`}>
                                  <Award size={14} />
                                </button>
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

            {activeTab === 'network' && hasPermission('view_network') && (
              <div>
                <h2 className="text-lg font-bold mb-4">{at('networkTable')}</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                      {[at('colName'),at('upline'),at('colPkg'),at('teamCount'),at('colIncome'),at('colBal'),at('clubsTitle')].map((h, i) => (
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

            {activeTab === 'categories' && hasPermission('view_categories') && (
              <div className="space-y-8">
                {/* ── Shop Collections ── */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <h2 className="text-lg font-bold flex items-center gap-2"><ShoppingBag size={18} className="text-indigo-600" /> {at('shopCollections')}</h2>
                      <p className="text-xs text-gray-500 mb-3">{at('shopColNote')}</p>
                    </div>
                    <button onClick={() => setShowColForm(!showColForm)} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700">
                      <Plus size={14} /> {at('newCollection')}
                    </button>
                  </div>
                  {showColForm && (
                    <div className="bg-indigo-50 rounded-xl p-4 mb-4 border border-indigo-100">
                      <div className="grid md:grid-cols-2 gap-3">
                        <input value={colForm.title} onChange={e => setColForm({...colForm, title: e.target.value})} placeholder={at('colTitle')} className="px-3 py-2 rounded-lg border text-sm" />
                        <input value={colForm.description} onChange={e => setColForm({...colForm, description: e.target.value})} placeholder={at('colDesc')} className="px-3 py-2 rounded-lg border text-sm" />
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button onClick={handleAddCollection} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700">
                          <Save size={14} className="inline mr-1" /> {at('save')}
                        </button>
                        <button onClick={() => setShowColForm(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-xs hover:bg-gray-50">{at('cancel')}</button>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    {shopCollections.map(col => (
                      <div key={col.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{col.title}</p>
                          <p className="text-xs text-gray-400">/{col.handle}</p>
                        </div>
                        <button onClick={() => handleDeleteCollection(col.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
                      </div>
                    ))}
                    {shopCollections.length === 0 && <p className="text-xs text-gray-400 text-center py-4">{lang === 'en' ? 'No collections yet' : 'কোনো কালেকশন নেই'}</p>}
                  </div>
                </div>

                {/* ── Product Categories ── */}
                <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">{at('catMgmt')}</h2>
                  <button onClick={() => setShowCatForm(!showCatForm)} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700">
                    <Plus size={14} /> {at('newCat')}
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
              </div>
            )}

            {activeTab === 'products' && (
              <AdminProductManager products={products} categories={categories} onRefresh={fetchAll} />
            )}

            {activeTab === 'content' && (hasPermission('view_gallery') || hasPermission('view_notices')) && (
              <div className="space-y-8">
                {/* ── Image Gallery ── */}
                {hasPermission('view_gallery') && (
                  <div>
                    <h2 className="text-lg font-bold mb-1 flex items-center gap-2"><Image size={20} className="text-indigo-600" /> {at('imageGallery')}</h2>
                    <p className="text-xs text-gray-500 mb-4">{at('galleryNote')}</p>
                    {hasPermission('manage_gallery') && (
                      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-4">
                        <div className="grid md:grid-cols-3 gap-3 items-end">
                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">{at('chooseFile')}</label>
                            <input ref={galleryFileRef} type="file" accept="image/*" onChange={handleGalleryUpload}
                              className="w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer" />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">{at('captionLabel')}</label>
                            <input value={galleryCaption} onChange={e => setGalleryCaption(e.target.value)}
                              placeholder="ছবির বিবরণ..." className="w-full px-3 py-2 rounded-lg border text-sm" />
                          </div>
                          <div>
                            {galleryUploading && <div className="flex items-center gap-2 text-indigo-600 text-sm"><Loader2 size={16} className="animate-spin" /> আপলোড হচ্ছে...</div>}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {galleryItems.map(item => (
                        <div key={item.id} className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                          <img src={item.image_url} alt={item.caption || ''} className="w-full aspect-square object-cover" />
                          {item.caption && <p className="text-[10px] text-gray-600 p-1.5 truncate">{item.caption}</p>}
                          {hasPermission('manage_gallery') && (
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button onClick={() => handleToggleGalleryVisibility(item.id, item.is_visible)}
                                className={`px-2 py-1 text-[10px] font-bold rounded-lg ${item.is_visible ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'}`}>
                                {item.is_visible ? 'লুকান' : 'দেখান'}
                              </button>
                              <button onClick={() => handleDeleteGallery(item.id, item.image_url)}
                                className="px-2 py-1 text-[10px] font-bold rounded-lg bg-red-500 text-white">মুছুন</button>
                            </div>
                          )}
                          {!item.is_visible && <div className="absolute top-1 right-1 bg-gray-700/70 text-white text-[9px] px-1.5 py-0.5 rounded">লুকানো</div>}
                        </div>
                      ))}
                      {galleryItems.length === 0 && <p className="col-span-4 text-center text-sm text-gray-400 py-8">{at('noImages')}</p>}
                    </div>
                  </div>
                )}

                {hasPermission('view_gallery') && hasPermission('view_notices') && <hr className="border-gray-200" />}

                {/* ── Notice Board ── */}
                {hasPermission('view_notices') && (
                  <div>
                    <h2 className="text-lg font-bold mb-1 flex items-center gap-2"><Bell size={20} className="text-orange-600" /> {at('noticeBoard')}</h2>
                    <p className="text-xs text-gray-500 mb-4">{at('noticeNote')}</p>
                    {hasPermission('manage_notices') && (
                      <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-4">
                        <div className="grid md:grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">{at('noticeTitleLabel')}</label>
                            <input value={noticeTitle} onChange={e => setNoticeTitle(e.target.value)}
                              placeholder="নোটিশের শিরোনাম..." className="w-full px-3 py-2 rounded-lg border text-sm" />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">{at('noticeExpiry')}</label>
                            <input type="datetime-local" value={noticeExpiry} onChange={e => setNoticeExpiry(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border text-sm" />
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className="text-xs font-medium text-gray-600 mb-1 block">{at('noticeDetail')}</label>
                          <textarea value={noticeContent} onChange={e => setNoticeContent(e.target.value)} rows={2}
                            placeholder="নোটিশের বিস্তারিত তথ্য..." className="w-full px-3 py-2 rounded-lg border text-sm resize-none" />
                        </div>
                        <button onClick={handleSaveNotice} disabled={noticeSaving}
                          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 disabled:opacity-50">
                          {noticeSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} {at('postNotice')}
                        </button>
                      </div>
                    )}
                    <div className="space-y-2">
                      {notices.map(notice => (
                        <div key={notice.id} className={`flex items-start justify-between p-3 rounded-xl border ${notice.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm">{notice.title}</p>
                            {notice.content && <p className="text-xs text-gray-500 mt-0.5">{notice.content}</p>}
                            {notice.expires_at && (
                              <p className="text-[10px] text-orange-500 mt-1">মেয়াদ শেষ: {new Date(notice.expires_at).toLocaleDateString('bn-BD')}</p>
                            )}
                          </div>
                          {hasPermission('manage_notices') && (
                            <div className="flex gap-1 ml-3 flex-shrink-0">
                              <button onClick={() => handleToggleNotice(notice.id, notice.is_active)}
                                className={`px-2 py-1 text-[10px] font-bold rounded-lg ${notice.is_active ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                {notice.is_active ? 'বন্ধ' : 'চালু'}
                              </button>
                              <button onClick={() => handleDeleteNotice(notice.id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={12} /></button>
                            </div>
                          )}
                        </div>
                      ))}
                      {notices.length === 0 && <p className="text-center text-sm text-gray-400 py-6">{at('noNotice')}</p>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'gold_packages' && hasPermission('view_gold_packages') && (
              <div>
                <h2 className="text-lg font-bold mb-4">{at('goldPkgMgmt')}</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-yellow-50">
                      {(at('gpCols') as readonly string[]).map(h=>(
                        <th key={h} className="text-left py-2 px-3 text-xs font-medium text-gray-600">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {adminGoldPkgs.map((pkg:any, i:number)=>{
                        const remaining = pkg.expires_at ? Math.max(0,Math.ceil((new Date(pkg.expires_at).getTime()-Date.now())/86400000)) : '—';
                        return (
                          <tr key={pkg.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-2 px-3 text-xs text-gray-400">{i+1}</td>
                            <td className="py-2 px-3 font-medium text-xs">{pkg.user?.name||'—'}</td>
                            <td className="py-2 px-3 text-xs text-gray-500">{pkg.user?.phone||'—'}</td>
                            <td className="py-2 px-3 text-xs font-bold text-indigo-700">৳{(pkg.amount||0).toLocaleString()}</td>
                            <td className="py-2 px-3 text-xs">{pkg.purchased_at?new Date(pkg.purchased_at).toLocaleDateString('bn-BD'):'—'}</td>
                            <td className="py-2 px-3 text-xs">{pkg.expires_at?new Date(pkg.expires_at).toLocaleDateString('bn-BD'):'—'}</td>
                            <td className="py-2 px-3 text-xs font-bold text-orange-600">{remaining}</td>
                            <td className="py-2 px-3 text-xs">৳{(pkg.daily_income||0).toFixed(4)}</td>
                            <td className="py-2 px-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${pkg.status==='active'?'bg-green-100 text-green-700':'bg-red-100 text-red-500'}`}>{pkg.status||'active'}</span></td>
                            <td className="py-2 px-3">
                              {hasPermission('manage_gold_packages') && (
                                <button onClick={()=>{setGoldEditPkg(pkg);setGoldEditDate(pkg.expires_at?new Date(pkg.expires_at).toISOString().split('T')[0]:'');}}
                                  className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs hover:bg-indigo-200">সম্পাদনা</button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {adminGoldPkgs.length===0&&<p className="text-center text-gray-400 py-8 text-sm">কোনো গোল্ড প্যাকেজ নেই</p>}
                </div>
              </div>
            )}

            {activeTab === 'payments' && hasPermission('view_payments') && (
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
                            <td className="py-2 px-3 font-bold">
                              <p>৳{(pv.amount||0).toLocaleString()}</p>
                              {(pv.quantity || 1) > 1 && <p className="text-[10px] text-gray-400">{pv.quantity}টি প্যাকেজ</p>}
                              {pv.purpose==='gold_package'&&pv.locker_image_url&&(
                                <img src={pv.locker_image_url} alt="locker" className="mt-1 h-10 w-10 rounded-lg object-cover border border-yellow-300"/>
                              )}
                            </td>
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
                              {pv.status==='pending' && hasPermission('approve_payments') && (
                                <div className="flex gap-1">
                                  <button onClick={() => handleApprovePayment(pv.id, true)} disabled={loading} className="p-1 rounded bg-green-100 text-green-600 hover:bg-green-200 disabled:opacity-40 disabled:cursor-not-allowed"><CheckCircle size={14} /></button>
                                  <button onClick={() => handleApprovePayment(pv.id, false)} disabled={loading} className="p-1 rounded bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-40 disabled:cursor-not-allowed"><XCircle size={14} /></button>
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

            {activeTab === 'clubs' && hasPermission('distribute_clubs') && (
              <div>
                <h2 className="text-lg font-bold mb-1">ক্লাব বোনাস বন্টন</h2>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-xs text-blue-800 space-y-1">
                  <p>📌 Customer package + PV sales → Daily 30% • Weekly 2.5% • Insurance 1.25% • Pension 1.25% • Shareholder 10%</p>
                  <p>📌 Shareholder club → শুধু shareholder package holders পাবেন</p>
                </div>
                {hasPermission('manual_credit') && (
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                      <h3 className="font-bold text-yellow-800 text-sm mb-3">গোল্ড ম্যানুয়াল ক্রেডিট</h3>
                      <div className="space-y-2">
                        <input value={manualGoldUserId} onChange={e=>setManualGoldUserId(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-xs font-mono" placeholder="User ID (UUID)"/>
                        <input type="number" value={manualGoldAmount} onChange={e=>setManualGoldAmount(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-xs" placeholder="পরিমাণ (৳)"/>
                        <button onClick={handleManualGoldCredit} disabled={manualGoldLoading} className="w-full py-2 bg-yellow-500 text-white text-sm font-bold rounded-lg hover:bg-yellow-600 disabled:opacity-50">
                          {manualGoldLoading?'প্রসেসিং...':'জমা করুন'}
                        </button>
                      </div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                      <h3 className="font-bold text-orange-800 text-sm mb-3">বকেয়া ম্যানুয়াল কর্তন</h3>
                      <div className="space-y-2">
                        <input value={manualBakeyaUserId} onChange={e=>setManualBakeyaUserId(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-xs font-mono" placeholder="User ID (UUID)"/>
                        <input type="number" value={manualBakeyaAmount} onChange={e=>setManualBakeyaAmount(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-xs" placeholder="কর্তনের পরিমাণ (৳)"/>
                        <button onClick={handleManualBakeyaDeduct} disabled={manualBakeyaLoading} className="w-full py-2 bg-orange-500 text-white text-sm font-bold rounded-lg hover:bg-orange-600 disabled:opacity-50">
                          {manualBakeyaLoading?'প্রসেসিং...':'বকেয়া কমান'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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

            {activeTab === 'withdrawals' && hasPermission('view_withdrawals') && (
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
                          <td className="py-2 px-3 text-xs">
                            <p>{wd.account_number}</p>
                            {wd.method === 'bank' && wd.bank_name && (
                              <p className="text-[10px] text-gray-400">{wd.account_holder_name} | {wd.bank_name} | রাউটিং: {wd.routing_number} | শাখা: {wd.branch_name}</p>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${wd.status==='approved'?'bg-green-100 text-green-700':wd.status==='rejected'?'bg-red-100 text-red-700':'bg-yellow-100 text-yellow-700'}`}>
                              {wd.status==='approved'?'অনুমোদিত':wd.status==='rejected'?'প্রত্যাখ্যাত':'পেন্ডিং'}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            {wd.status==='pending' && hasPermission('approve_withdrawals') && (
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

            {activeTab === 'transactions' && hasPermission('view_transactions') && (
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

            {activeTab === 'orders' && hasPermission('view_orders') && (
              <div>
                <h2 className="text-lg font-bold mb-4">অর্ডার সমূহ</h2>
                {orders.length===0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Package size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">কোনো অর্ডার নেই</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map(order => (
                      <div key={order.id} className="border border-gray-200 rounded-xl overflow-hidden">
                        {/* Order header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 px-4 py-3">
                          <div>
                            <p className="font-mono text-xs text-gray-500">#{order.id.slice(0,8).toUpperCase()}</p>
                            <p className="text-sm font-semibold">
                              {order.user?.name || order.shipping_address?.name || 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {order.user?.phone || order.shipping_address?.phone || order.user?.email || ''}
                            </p>
                            {order.shipping_address?.address && (
                              <p className="text-xs text-gray-400">📍 {order.shipping_address.address}</p>
                            )}
                            {order.notes && (
                              <p className="text-xs text-orange-600 mt-0.5">{order.notes}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-indigo-700">৳{(order.total||order.total_price||0).toLocaleString()}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${order.status==='paid'||order.financial_status==='paid'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>
                              {order.status==='paid'||order.financial_status==='paid'?'পেইড':'পেন্ডিং'}
                            </span>
                            <p className="text-xs text-gray-400 mt-1">{new Date(order.created_at).toLocaleString('bn-BD')}</p>
                          </div>
                        </div>
                        {/* Order items */}
                        {order.order_items && order.order_items.length > 0 ? (
                          <div className="divide-y divide-gray-100">
                            {order.order_items.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-3 px-4 py-2.5">
                                {(item.product?.image_url) && (
                                  <img src={item.product.image_url} alt={item.product_name}
                                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">
                                    {item.product_name || item.product?.title || 'পণ্য'}
                                  </p>
                                  {item.variant_title && (
                                    <p className="text-[10px] text-gray-400">{item.variant_title}</p>
                                  )}
                                  {item.sku && (
                                    <p className="text-[10px] text-gray-300">SKU: {item.sku}</p>
                                  )}
                                </div>
                                <div className="text-right text-xs flex-shrink-0">
                                  <span className="text-gray-500">×{item.quantity}</span>
                                  <span className="ml-2 font-semibold">৳{(item.unit_price||0).toLocaleString()}</span>
                                  <p className="text-gray-400">= ৳{((item.unit_price||0)*item.quantity).toLocaleString()}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="px-4 py-2 text-xs text-gray-400">পণ্যের তথ্য নেই</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'dealer-req' && hasPermission('view_dealer_req') && (
              <div>
                <h2 className="text-lg font-bold mb-4">ডিলার রিকুইজিশন (পেন্ডিং)</h2>
                {requisitions.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <Star size={40} className="mx-auto mb-3 opacity-30" />
                    <p>কোনো পেন্ডিং রিকুইজিশন নেই</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                          <th className="pb-2 pr-3">ডিলার</th>
                          <th className="pb-2 pr-3">অঞ্চল</th>
                          <th className="pb-2 pr-3">পণ্য</th>
                          <th className="pb-2 pr-3 text-right">পরিমাণ</th>
                          <th className="pb-2 pr-3 text-right">মোট PV</th>
                          <th className="pb-2 pr-3 text-right">কমিশন</th>
                          <th className="pb-2 pr-3">তারিখ</th>
                          <th className="pb-2">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requisitions.map(req => (
                          <tr key={req.id} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="py-3 pr-3 font-medium">{req.dealer?.name || '-'}</td>
                            <td className="py-3 pr-3 text-gray-500">{req.dealer?.dealer_area || '-'}</td>
                            <td className="py-3 pr-3">{req.product_name}</td>
                            <td className="py-3 pr-3 text-right">{req.quantity}</td>
                            <td className="py-3 pr-3 text-right text-indigo-600 font-medium">{req.total_pv}</td>
                            <td className="py-3 pr-3 text-right text-green-600 font-bold">৳{req.commission_amount}</td>
                            <td className="py-3 pr-3 text-gray-400 text-xs">{new Date(req.created_at).toLocaleDateString('bn-BD')}</td>
                            <td className="py-3">
                              {hasPermission('approve_dealer_req') && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleAcceptRequisition(req)}
                                    disabled={processingReqId === req.id}
                                    className="px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
                                    {processingReqId === req.id ? '⏳...' : '✅ গ্রহণ'}
                                  </button>
                                  <button
                                    onClick={() => handleRejectRequisition(req.id)}
                                    disabled={processingReqId === req.id}
                                    className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
                                    ❌ বাতিল
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reports' && hasPermission('view_reports') && (
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
        )}

        {/* ══════════════════════════════════════════════════
            SUB ADMIN MANAGEMENT TAB
        ══════════════════════════════════════════════════ */}
        {activeTab === 'sub-admins' && hasPermission('manage_sub_admins') && (
          <div className="space-y-6">
            {/* Stats cards */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'সক্রিয়', value: subAdmins.filter(s => s.is_active).length, color: 'bg-green-500', icon: <UserCheck size={18} /> },
                { label: 'নিষ্ক্রিয়', value: subAdmins.filter(s => !s.is_active).length, color: 'bg-gray-400', icon: <UserX size={18} /> },
                { label: 'মোট', value: subAdmins.length, color: 'bg-indigo-500', icon: <Shield size={18} /> },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
                  <div className={`w-10 h-10 ${s.color} rounded-lg flex items-center justify-center text-white`}>{s.icon}</div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                    <p className="text-xs text-gray-500">{s.label} এডমিন</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Header with Add button */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div>
                  <h2 className="text-base font-bold text-gray-900">সাব এডমিন তালিকা</h2>
                  <p className="text-xs text-gray-500 mt-0.5">এডমিন প্যানেলে সীমিত অ্যাক্সেস সহ ব্যবহারকারী</p>
                </div>
                <button onClick={openAddSa}
                  className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                  <UserPlus size={14} /> নতুন সাব এডমিন
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">নাম</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">ইমেইল</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">ফোন</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">স্ট্যাটাস</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Permissions</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">যোগ দিয়েছে</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {subAdmins.map(sa => (
                      <tr key={sa.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                              <Shield size={14} className="text-indigo-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-xs">{sa.name}</p>
                              <p className="text-[10px] text-gray-400">সাব এডমিন</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">{sa.email}</td>
                        <td className="px-4 py-3 text-xs text-gray-600 hidden md:table-cell">{sa.phone || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${sa.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {sa.is_active ? <><UserCheck size={10} /> সক্রিয়</> : <><UserX size={10} /> নিষ্ক্রিয়</>}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-xs text-indigo-600 font-medium">
                            {(sa.permissions || []).length} টি permission
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">
                          {sa.created_at ? new Date(sa.created_at).toLocaleDateString('bn-BD') : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => openEditSa(sa)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="সম্পাদনা">
                              <Edit size={14} />
                            </button>
                            <button onClick={() => handleDeleteSa(sa.id, sa.name)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="মুছুন">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {subAdmins.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                          <Shield size={32} className="mx-auto mb-2 opacity-30" />
                          <p>কোনো সাব এডমিন নেই। উপরের বোতাম থেকে যোগ করুন।</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        </main>
      </div>

      {editUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">ইউজার এডিট</h2>
            <div className="space-y-3">
              {[
                { label: 'নাম',        key: 'name',            type: 'text'   },
                { label: 'ইমেইল',     key: 'email',           type: 'email'  },
                { label: 'ফোন',       key: 'phone',           type: 'text'   },
                { label: 'পাসওয়ার্ড', key: 'password_hash',  type: 'text'   },
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
            {/* Package summary */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-600 mb-2">📦 প্যাকেজ সারাংশ</p>
              {editUser.package_type === 'customer' && (
                <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-800 space-y-1">
                  <p>কাস্টমার প্যাকেজ</p>
                  <p>এই মাসে PV: <span className="font-bold">{editUser.monthly_pv_purchased||0}</span> / 100</p>
                  <p>মোট PV: <span className="font-bold">{editUser.pv_points||0}</span></p>
                </div>
              )}
              {editUser.package_type === 'shareholder' && (
                <div className="bg-purple-50 rounded-xl p-3 text-xs text-purple-800 space-y-1">
                  <p>শেয়ারহোল্ডার: <span className="font-bold">{editUser.shareholder_count||1}টি</span> × ৳৫,০০০ = <span className="font-bold">৳{((editUser.shareholder_count||1)*5000).toLocaleString()}</span></p>
                </div>
              )}
              {editUser.package_type === 'gold' && (() => {
                const userGold = adminGoldPkgs.filter((g:any) => g.user_id === editUser.id);
                const totalInvest = userGold.reduce((s:number,g:any)=>s+(g.amount||0),0);
                return (
                  <div className="bg-yellow-50 rounded-xl p-3 text-xs space-y-1">
                    {userGold.length === 0 && <p className="text-yellow-700">কোনো গোল্ড প্যাকেজ নেই</p>}
                    {userGold.map((g:any, i:number) => (
                      <p key={g.id} className="text-yellow-700">
                        গোল্ড #{i+1}: <span className="font-bold">৳{(g.amount||0).toLocaleString()}</span>
                        {' — '}{Math.max(0,Math.ceil((new Date(g.expires_at).getTime()-Date.now())/86400000))} দিন বাকি
                      </p>
                    ))}
                    {userGold.length > 0 && (
                      <p className="font-semibold text-yellow-800 border-t border-yellow-200 pt-1 mt-1">
                        মোট: {userGold.length}টি | মোট বিনিয়োগ: ৳{totalInvest.toLocaleString()}
                      </p>
                    )}
                  </div>
                );
              })()}
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
      {/* Package distribution modal */}
      {pkgModalType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setPkgModalType(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">
                {pkgModalType === 'customer' ? 'কাস্টমার' : pkgModalType === 'shareholder' ? 'শেয়ারহোল্ডার' : pkgModalType === 'gold' ? 'গোল্ড' : 'ডিলার'} সদস্য তালিকা
              </h2>
              <span className="text-sm font-bold text-gray-500">{pkgModalUsers.length} জন</span>
            </div>
            <div className="space-y-2">
              {pkgModalUsers.map((u, i) => (
                <div key={u.id} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-gray-50 text-sm">
                  <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.phone}{u.email ? ` · ${u.email}` : ''}</p>
                    {pkgModalType === 'dealer' && u.dealer_area && (
                      <p className="text-[10px] text-orange-600 font-medium mt-0.5">📍 {u.dealer_area}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
                      {u.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                    </span>
                    {pkgModalType !== 'dealer' && (
                      <p className="text-[10px] text-gray-400 mt-0.5">{(u.monthly_pv_purchased||0)} PV</p>
                    )}
                    {pkgModalType === 'dealer' && (
                      <p className="text-[10px] text-gray-400 mt-0.5">{u.package_type}</p>
                    )}
                  </div>
                </div>
              ))}
              {pkgModalUsers.length === 0 && <p className="text-center text-gray-400 py-8">কোনো সদস্য নেই</p>}
            </div>
            <button onClick={() => setPkgModalType(null)} className="mt-4 w-full py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">বন্ধ করুন</button>
          </div>
        </div>
      )}

      {/* Dealer form modal (#16) */}
      {dealerFormUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={()=>setDealerFormUser(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={e=>e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">ডিলার নিয়োগ ফর্ম</h2>
            <div className="space-y-3 mb-4">
              {[['নাম', dealerFormUser.name],['ফোন', dealerFormUser.phone],['প্যাকেজ', dealerFormUser.package_type]].map(([l,v])=>(
                <div key={l} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-500">{l}</span>
                  <span className="text-sm font-semibold">{v}</span>
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">ডিলার অঞ্চল (ঐচ্ছিক)</label>
                <input value={dealerFormType} onChange={e=>setDealerFormType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-indigo-500 outline-none"
                  placeholder="যেমন: ঢাকা, চট্টগ্রাম, সিলেট"/>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">মন্তব্য (ঐচ্ছিক)</label>
                <textarea value={dealerFormNotes} onChange={e=>setDealerFormNotes(e.target.value)} rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-indigo-500 outline-none resize-none"
                  placeholder="অতিরিক্ত তথ্য"/>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={()=>setDealerFormUser(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">বাতিল</button>
              <button onClick={()=>handleToggleDealer(dealerFormUser.id, true, dealerFormType)}
                className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl text-sm font-bold hover:from-orange-600 hover:to-amber-700">
                ডিলার মনোনীত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gift bonus modal (#8) */}
      {giftModalUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={()=>setGiftModalUser(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={e=>e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-2">গিফট বোনাস</h2>
            <p className="text-sm text-gray-600 mb-4">{giftModalUser.name} ({giftModalUser.phone}) — {(giftModalUser.monthly_pv_purchased||0)} PV</p>
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-500 mb-1 block">পরিমাণ (৳)</label>
              <input type="number" value={giftAmount} onChange={e=>setGiftAmount(e.target.value)} min="1"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-yellow-500 outline-none"
                placeholder="গিফটের পরিমাণ"/>
            </div>
            <div className="flex gap-3">
              <button onClick={()=>setGiftModalUser(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">বাতিল</button>
              <button onClick={handleGiftBonus} disabled={giftLoading||!giftAmount}
                className="flex-1 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-xl text-sm font-bold hover:from-yellow-600 hover:to-amber-700 disabled:opacity-50">
                {giftLoading?'দেওয়া হচ্ছে...':'গিফট দিন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gold package edit modal (#15) */}
      {goldEditPkg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={()=>setGoldEditPkg(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={e=>e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-2">গোল্ড প্যাকেজ সম্পাদনা</h2>
            <p className="text-sm text-gray-500 mb-4">{goldEditPkg.user?.name} — দৈনিক: ৳{(goldEditPkg.daily_income||0).toFixed(4)}</p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[[-30,'−৩০'],[- 7,'−৭'],[7,'+৭'],[30,'+৩০']].map(([days,label])=>(
                <button key={days} onClick={()=>{const d=new Date(goldEditDate||goldEditPkg.expires_at);d.setDate(d.getDate()+(days as number));setGoldEditDate(d.toISOString().split('T')[0]);}}
                  className="py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">{label} দিন</button>
              ))}
            </div>
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-500 mb-1 block">মেয়াদ শেষ তারিখ</label>
              <input type="date" value={goldEditDate} onChange={e=>setGoldEditDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none"/>
            </div>
            {goldEditDate&&<p className="text-xs text-indigo-600 mb-4">নতুন দৈনিক ইনকাম: ৳{(Math.max(1,Math.ceil((new Date(goldEditDate).getTime()-Date.now())/86400000))>0?(goldEditPkg.referral_income_pending||0)/Math.max(1,Math.ceil((new Date(goldEditDate).getTime()-Date.now())/86400000)):0).toFixed(4)}/দিন (পুনঃগণনা)</p>}
            <div className="flex gap-3">
              <button onClick={()=>setGoldEditPkg(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">বাতিল</button>
              <button onClick={handleGoldPkgDateSave} disabled={goldEditLoading||!goldEditDate}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50">
                {goldEditLoading?'সেভ হচ্ছে...':'সেভ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}



      {/* ══════════════════════════════════════════════════
          SUB ADMIN ADD / EDIT MODAL
      ══════════════════════════════════════════════════ */}
      {saModal && (
        <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 overflow-y-auto" onClick={() => setSaModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl my-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div className={`p-5 rounded-t-2xl bg-gradient-to-r ${saModal === 'add' ? 'from-indigo-600 to-purple-600' : 'from-amber-500 to-orange-600'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    {saModal === 'add' ? <UserPlus size={20} className="text-white" /> : <Edit size={20} className="text-white" />}
                  </div>
                  <div>
                    <h2 className="text-white font-bold">{saModal === 'add' ? 'নতুন সাব এডমিন যোগ করুন' : 'সাব এডমিন সম্পাদনা'}</h2>
                    <p className="text-white/70 text-xs">{saModal === 'edit' ? editSa?.email : 'তথ্য ও অনুমতি সেট করুন'}</p>
                  </div>
                </div>
                <button onClick={() => setSaModal(null)} className="text-white/70 hover:text-white p-1">
                  <XCircle size={20} />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Basic info grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">নাম *</label>
                  <input value={saForm.name} onChange={e => setSaForm(p => ({...p, name: e.target.value}))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none"
                    placeholder="সম্পূর্ণ নাম" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">ইমেইল * {saModal === 'edit' && <span className="text-gray-400">(পরিবর্তনযোগ্য নয়)</span>}</label>
                  <input value={saForm.email} onChange={e => setSaForm(p => ({...p, email: e.target.value}))}
                    disabled={saModal === 'edit'}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none disabled:bg-gray-50 disabled:text-gray-400"
                    placeholder="example@email.com" type="email" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">ফোন</label>
                  <input value={saForm.phone} onChange={e => setSaForm(p => ({...p, phone: e.target.value}))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none"
                    placeholder="01XXXXXXXXX" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    পাসওয়ার্ড {saModal === 'edit' && <span className="text-gray-400">(ফাঁকা রাখলে পরিবর্তন হবে না)</span>}
                    {saModal === 'add' && <span className="text-red-500"> *</span>}
                  </label>
                  <div className="relative">
                    <input value={saForm.password} onChange={e => setSaForm(p => ({...p, password: e.target.value}))}
                      type={showSaPass ? 'text' : 'password'}
                      className="w-full px-3 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none"
                      placeholder={saModal === 'edit' ? 'নতুন পাসওয়ার্ড (ঐচ্ছিক)' : 'পাসওয়ার্ড সেট করুন'} />
                    <button type="button" onClick={() => setShowSaPass(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                      {showSaPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Status toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-gray-800">অ্যাকাউন্ট স্ট্যাটাস</p>
                  <p className="text-xs text-gray-500">নিষ্ক্রিয় করলে এই সাব এডমিন লগইন করতে পারবে না</p>
                </div>
                <button onClick={() => setSaForm(p => ({...p, is_active: !p.is_active}))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${saForm.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${saForm.is_active ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Permissions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Key size={16} className="text-indigo-600" />
                    <h3 className="text-sm font-bold text-gray-900">অনুমতিসমূহ (Permissions)</h3>
                    <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                      {saForm.permissions.length} / {PERMISSION_GROUPS.reduce((a, g) => a + g.perms.length, 0)} টি
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSaForm(p => ({...p, permissions: PERMISSION_GROUPS.flatMap(g => g.perms)}))}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">সব চালু</button>
                    <span className="text-gray-300">|</span>
                    <button onClick={() => setSaForm(p => ({...p, permissions: []}))}
                      className="text-xs text-red-500 hover:text-red-700 font-medium">সব বন্ধ</button>
                  </div>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {PERMISSION_GROUPS.map(group => {
                    const allChecked = group.perms.every(p => saForm.permissions.includes(p));
                    const someChecked = group.perms.some(p => saForm.permissions.includes(p));
                    return (
                      <div key={group.label} className="border border-gray-100 rounded-xl overflow-hidden">
                        {/* Group header */}
                        <button onClick={() => toggleSaPermGroup(group.perms)}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors ${allChecked ? 'bg-indigo-50 text-indigo-700' : someChecked ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-600'}`}>
                          <span>{group.label}</span>
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${allChecked ? 'bg-indigo-600 border-indigo-600' : someChecked ? 'border-amber-500' : 'border-gray-300'}`}>
                            {allChecked && <CheckCircle size={10} className="text-white" />}
                            {someChecked && !allChecked && <span className="w-2 h-0.5 bg-amber-500 rounded" />}
                          </div>
                        </button>
                        {/* Permissions grid */}
                        <div className="p-2 grid grid-cols-2 md:grid-cols-3 gap-1.5">
                          {group.perms.map(perm => (
                            <label key={perm}
                              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors text-xs ${saForm.permissions.includes(perm) ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50 text-gray-600'}`}>
                              <input type="checkbox" checked={saForm.permissions.includes(perm)}
                                onChange={() => toggleSaPerm(perm)} className="hidden" />
                              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${saForm.permissions.includes(perm) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                                {saForm.permissions.includes(perm) && <CheckCircle size={9} className="text-white" />}
                              </div>
                              <span className="truncate">{PERM_LABELS[perm] || perm}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">মন্তব্য (ঐচ্ছিক)</label>
                <textarea value={saForm.notes} onChange={e => setSaForm(p => ({...p, notes: e.target.value}))} rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none resize-none"
                  placeholder="এই সাব এডমিন সম্পর্কে নোট..." />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-1">
                <button onClick={() => setSaModal(null)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
                  বাতিল
                </button>
                <button onClick={handleSaveSa} disabled={saLoading}
                  className={`flex-1 py-2.5 text-white rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 ${saModal === 'add' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-amber-500 hover:bg-amber-600'}`}>
                  {saLoading ? <><Loader2 size={14} className="animate-spin" /> সংরক্ষণ হচ্ছে...</> : <><Save size={14} /> সংরক্ষণ করুন</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}