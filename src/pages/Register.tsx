import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ShoppingBag, Crown, Award, Eye, EyeOff, Smartphone, CheckCircle, ArrowRight, Wallet } from 'lucide-react';
import { toast } from 'sonner';

export default function Register() {
  const { register, user: loggedInUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1); // 1: form, 2: payment, 3: success
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    package_type: 'customer',
    referrer_id: searchParams.get('ref') || '',
  });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('bkash');
  const [trxId, setTrxId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [registeredUserId, setRegisteredUserId] = useState('');

  const packages = [
    {
      value: 'customer',
      label: 'কাস্টমার প্যাকেজ',
      subtitle: '১,০০০ PV এর পণ্য কিনুন',
      badge: '১,০০০ PV',
      amount: 0, // No cash — product purchase activates
      icon: <ShoppingBag size={20} />,
      color: 'from-blue-500 to-cyan-600',
      note: '১,০০০ PV মূল্যের পণ্য কিনলেই আইডি স্বয়ংক্রিয়ভাবে সক্রিয় হবে',
    },
    {
      value: 'shareholder',
      label: 'শেয়ারহোল্ডার প্যাকেজ',
      subtitle: '৳৫,০০০',
      badge: '৫,০০০ SP',
      amount: 5000,
      icon: <Crown size={20} />,
      color: 'from-purple-500 to-pink-600',
      note: 'শেয়ারহোল্ডার ক্লাব ইনকাম পাবেন (PV এর ১০%)',
    },
    {
      value: 'gold',
      label: 'গোল্ড প্যাকেজ',
      subtitle: '৳১,০০,০০০',
      badge: '১,০০,০০০ GP',
      amount: 100000,
      icon: <Award size={20} />,
      color: 'from-yellow-500 to-orange-600',
      note: '৩৬৫ দিন মেয়াদ, রেফারার পায় ৳১৮০০ (৩৬৫ দিনে)',
    },
  ];

  const selectedPkg = packages.find(p => p.value === form.package_type);

  // ── Step 1: Register user ──────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('পাসওয়ার্ড মিলছে না'); return; }
    if (form.password.length < 4) { setError('পাসওয়ার্ড কমপক্ষে ৪ অক্ষর'); return; }
    if (!form.name.trim() || !form.phone.trim()) { setError('নাম ও ফোন নম্বর দিন'); return; }

    setLoading(true);
    const result = await register({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password,
      package_type: form.package_type,
      referrer_id: form.referrer_id.trim() || undefined,
    });

    if (result.success && result.userId) {
      setRegisteredUserId(result.userId);
      if (form.package_type === 'customer') {
        // Customer: no cash payment needed — product purchase activates ID
        // Insert pending record so admin can track, amount=0
        // Customer registration needs no payment — auto-approved immediately
        // Actual activation happens only after buying 1000 PV of products
        await supabase.from('mlm_payment_verifications').insert({
          user_id: result.userId,
          amount: 0,
          method: 'product',
          trx_id: 'AUTO_APPROVED',
          purpose: 'customer_registration',
          status: 'approved',
          processed_at: new Date().toISOString(),
        });
        setStep(3);
      } else {
        setStep(2);
      }
    } else {
      setError(result.error || 'রেজিস্ট্রেশন করতে সমস্যা হয়েছে');
    }
    setLoading(false);
  };

  // ── Step 2: Payment submit ─────────────────────────────────────────────────
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registeredUserId) { toast.error('রেজিস্ট্রেশন সমস্যা, আবার চেষ্টা করুন'); return; }

    setLoading(true);

    // ── Balance payment: auto-approve immediately ────────────────────────────
    if (paymentMethod === 'balance') {
      if (!loggedInUser) { toast.error('ব্যালেন্স পেমেন্টের জন্য লগইন করুন'); setLoading(false); return; }
      const required = selectedPkg?.amount || 0;
      if ((loggedInUser.current_balance || 0) < required) {
        toast.error(`অপর্যাপ্ত ব্যালেন্স। প্রয়োজন ৳${required.toLocaleString()}, আপনার ব্যালেন্স ৳${loggedInUser.current_balance.toLocaleString()}`);
        setLoading(false);
        return;
      }

      // Deduct from payer's balance
      const { error: deductErr } = await supabase.from('mlm_users').update({
        current_balance: (loggedInUser.current_balance || 0) - required,
      }).eq('id', loggedInUser.id);
      if (deductErr) { toast.error('ব্যালেন্স কাটতে সমস্যা: ' + deductErr.message); setLoading(false); return; }

      await supabase.from('mlm_transactions').insert({
        user_id: loggedInUser.id, type: 'transfer', amount: -required,
        description: `${selectedPkg?.label} ক্রয় (ব্যালেন্স পেমেন্ট) — নতুন আইডি: ${registeredUserId}`,
        related_user_id: registeredUserId,
      });

      // Activate registered user's package
      const isShareholder = form.package_type === 'shareholder';
      const isGold        = form.package_type === 'gold';
      const psPoints      = isShareholder ? 5000 : 0;
      const gpPoints      = isGold ? 100000 : 0;
      const pvPoints      = 1000;
      const now           = new Date().toISOString();
      const activatePayload: any = {
        is_active:        true,
        activated_at:     now,
        pv_points:        pvPoints,
        ps_points:        psPoints,
        gp_points:        gpPoints,
        is_daily_club:    false,
        is_shareholder_club: isShareholder,
        is_weekly_club:   false,
        is_insurance_club: false,
        is_pension_club:  false,
      };
      if (isGold) {
        activatePayload.gold_package_start = now;
        const dailyBakeya = Math.round((100000 * 0.36) / 365);
        activatePayload.bakeya_amount = dailyBakeya;
      }

      await supabase.from('mlm_users').update(activatePayload).eq('id', registeredUserId);

      // Referrer commission
      const { data: newUser } = await supabase.from('mlm_users').select('referrer_id').eq('id', registeredUserId).single();
      if (newUser?.referrer_id) {
        const { data: referrer } = await supabase.from('mlm_users').select('*').eq('id', newUser.referrer_id).single();
        if (referrer && referrer.is_active) {
          if (isShareholder) {
            const commission = Math.floor(psPoints * 0.025);
            if (commission > 0) {
              await supabase.from('mlm_users').update({
                current_balance: (referrer.current_balance || 0) + commission,
                total_income:    (referrer.total_income || 0) + commission,
              }).eq('id', referrer.id);
              await supabase.from('mlm_transactions').insert({
                user_id: referrer.id, type: 'referral_income', amount: commission,
                description: 'শেয়ারহোল্ডার রেফার কমিশন (২.৫%) — ব্যালেন্স পেমেন্ট', related_user_id: registeredUserId,
              });
            }
          } else if (isGold) {
            const totalGold = 1800;
            await supabase.from('mlm_users').update({
              gold_referral_income:  (referrer.gold_referral_income || 0) + totalGold,
              gold_referral_pending: (referrer.gold_referral_pending || 0) + totalGold,
            }).eq('id', referrer.id);
            await supabase.from('mlm_transactions').insert({
              user_id: referrer.id, type: 'referral_income', amount: totalGold,
              description: 'গোল্ড রেফার ইনকাম (৳১৮০০, ৩৬৫ দিনে বন্টন) — ব্যালেন্স পেমেন্ট', related_user_id: registeredUserId,
            });
          }

          // direct_referrals_count + weekly/insurance/pension promotion
          const { data: freshRef } = await supabase.from('mlm_users')
            .select('direct_referrals_count, is_weekly_club, is_insurance_club')
            .eq('id', referrer.id).single();
          const newCount = (freshRef?.direct_referrals_count || 0) + 1;
          const refUpdates: any = { direct_referrals_count: newCount };
          if (newCount >= 15 && !freshRef?.is_weekly_club) refUpdates.is_weekly_club = true;
          if (!freshRef?.is_insurance_club) {
            const { data: directRefs } = await supabase.from('mlm_users')
              .select('id, is_weekly_club').eq('referrer_id', referrer.id).eq('is_active', true);
            const weeklyCount = (directRefs || []).filter(r => r.is_weekly_club).length;
            if (weeklyCount >= 15) {
              refUpdates.is_insurance_club = true;
              refUpdates.is_pension_club   = true;
            }
          }
          await supabase.from('mlm_users').update(refUpdates).eq('id', referrer.id);
        }
      }

      // Save approved payment record
      await supabase.from('mlm_payment_verifications').insert({
        user_id: registeredUserId, amount: required, method: 'balance',
        trx_id: `BAL-${Date.now()}`, purpose: `${form.package_type}_package`,
        status: 'approved', processed_at: new Date().toISOString(),
      });

      toast.success('✅ ব্যালেন্স পেমেন্ট সফল! আইডি সক্রিয় হয়েছে।');
      setStep(3);
      setLoading(false);
      return;
    }

    // ── Mobile payment: pending admin approval ───────────────────────────────
    if (!trxId.trim()) { toast.error('TRX ID দিন'); setLoading(false); return; }

    const { error } = await supabase.from('mlm_payment_verifications').insert({
      user_id: registeredUserId,
      amount: selectedPkg?.amount || 0,
      method: paymentMethod,
      trx_id: trxId.trim(),
      sender_number: senderNumber.trim() || null,
      purpose: `${form.package_type}_package`,
      status: 'pending',
    });

    if (error) {
      toast.error('পেমেন্ট সংরক্ষণে সমস্যা: ' + error.message);
      setLoading(false);
      return;
    }

    setStep(3);
    setLoading(false);
  };

  const mobilePaymentMethods = [
    { key: 'bkash',  label: 'বিকাশ', color: '#E2136E', number: '01XXXXXXXXX', bg: 'from-pink-500 to-pink-600' },
    { key: 'nagad',  label: 'নগদ',   color: '#F6921E', number: '01XXXXXXXXX', bg: 'from-orange-400 to-orange-500' },
    { key: 'rocket', label: 'রকেট',  color: '#8B2F8B', number: '01XXXXXXXXX', bg: 'from-purple-600 to-purple-700' },
  ];
  const isBalanceSufficient = loggedInUser && (loggedInUser.current_balance || 0) >= (selectedPkg?.amount || 0);

  // ── Step 3: Success ────────────────────────────────────────────────────────
  if (step === 3) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-16 px-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-gray-100 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">রেজিস্ট্রেশন সফল!</h1>
            {form.package_type === 'customer' ? (
              <div>
                <p className="text-gray-600 mb-2">কাস্টমার আইডি সক্রিয় করতে</p>
                <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100">
                  <p className="text-blue-800 font-semibold text-sm">শপ থেকে ১,০০০ PV মূল্যের পণ্য কিনুন</p>
                  <p className="text-blue-600 text-xs mt-1">পণ্য কিনলেই আপনার আইডি স্বয়ংক্রিয়ভাবে সক্রিয় হবে (১ PV = ১ টাকা)</p>
                  <p className="text-blue-500 text-xs mt-1">মেয়াদ: ৩০ দিন | রিনিউ: মাসে ১০০ PV কিনলে</p>
                </div>
              </div>
            ) : paymentMethod === 'balance' ? (
              <div>
                <div className="bg-green-50 rounded-xl p-4 mb-6 border border-green-200">
                  <p className="text-green-800 font-semibold text-sm">আইডি তাৎক্ষণিক সক্রিয় হয়েছে!</p>
                  <p className="text-green-600 text-xs mt-1">ব্যালেন্স থেকে ৳{(selectedPkg?.amount || 0).toLocaleString()} কাটা হয়েছে। রেফারারের কমিশন প্রদান করা হয়েছে।</p>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">আপনার পেমেন্ট এডমিন যাচাই করবেন।</p>
                <p className="text-gray-500 text-sm mb-6">অনুমোদনের পর আইডি সক্রিয় হবে ও কমিশন বিতরণ শুরু হবে।</p>
              </div>
            )}
            <div className="flex flex-col gap-3">
              <Link to="/login" className="block px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700">
                লগইন করুন
              </Link>
              {form.package_type === 'customer' && (
                <Link to="/shop" className="block px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700">
                  শপে যান ও পণ্য কিনুন
                </Link>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Step 2: Payment ────────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
              <div className="text-center mb-6">
                <div className={`w-16 h-16 bg-gradient-to-br ${selectedPkg?.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <Smartphone size={28} className="text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">পেমেন্ট করুন</h1>
                <p className="text-gray-500 text-sm mt-1">{selectedPkg?.label} — {selectedPkg?.subtitle}</p>
              </div>

              {/* Payment method tabs */}
              <div className={`grid gap-3 mb-4 ${loggedInUser ? 'grid-cols-4' : 'grid-cols-3'}`}>
                {mobilePaymentMethods.map(m => (
                  <button key={m.key} type="button" onClick={() => setPaymentMethod(m.key)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${paymentMethod === m.key ? 'shadow-lg' : 'border-gray-200'}`}
                    style={paymentMethod === m.key ? { borderColor: m.color, backgroundColor: m.color + '15' } : {}}>
                    <div className={`w-10 h-10 mx-auto mb-1 rounded-lg bg-gradient-to-br ${m.bg} flex items-center justify-center`}>
                      <span className="text-white font-bold text-xs">{m.label[0]}</span>
                    </div>
                    <p className="font-bold text-[11px]" style={{ color: m.color }}>{m.label}</p>
                  </button>
                ))}
                {loggedInUser && (
                  <button type="button" onClick={() => setPaymentMethod('balance')}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${paymentMethod === 'balance' ? 'border-green-500 bg-green-50 shadow-lg' : 'border-gray-200'}`}>
                    <div className="w-10 h-10 mx-auto mb-1 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <Wallet size={16} className="text-white" />
                    </div>
                    <p className="font-bold text-[11px] text-green-700">ব্যালেন্স</p>
                  </button>
                )}
              </div>

              {paymentMethod === 'balance' ? (
                <div className="mb-4">
                  <div className={`rounded-xl p-4 border ${isBalanceSufficient ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">আপনার বর্তমান ব্যালেন্স</span>
                      <span className={`text-lg font-bold ${isBalanceSufficient ? 'text-green-700' : 'text-red-600'}`}>
                        ৳{(loggedInUser?.current_balance || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">প্রয়োজন</span>
                      <span className="text-sm font-semibold text-gray-700">৳{(selectedPkg?.amount || 0).toLocaleString()}</span>
                    </div>
                    {!isBalanceSufficient && (
                      <p className="text-xs text-red-600 mt-2 font-medium">অপর্যাপ্ত ব্যালেন্স। মোবাইল ব্যাংকিং ব্যবহার করুন।</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-indigo-50 rounded-xl p-4 mb-4 border border-indigo-100">
                  <p className="text-xs font-semibold text-indigo-800 mb-2">পেমেন্ট নির্দেশনা:</p>
                  <ol className="text-xs text-indigo-700 space-y-1 list-decimal pl-4">
                    <li>{mobilePaymentMethods.find(m => m.key === paymentMethod)?.label} নম্বর: <span className="font-mono font-bold">{mobilePaymentMethods.find(m => m.key === paymentMethod)?.number}</span></li>
                    <li><span className="font-bold">{selectedPkg?.subtitle}</span> পাঠান</li>
                    <li>TRX ID নিচে দিন</li>
                    <li>Admin approve করলে আইডি সক্রিয় হবে ও কমিশন যাবে</li>
                  </ol>
                </div>
              )}

              <form onSubmit={handlePaymentSubmit} className="space-y-3">
                {paymentMethod !== 'balance' && (
                  <>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">TRX ID *</label>
                      <input value={trxId} onChange={e => setTrxId(e.target.value)} required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none font-mono"
                        placeholder="TXN123456789" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">সেন্ডার নম্বর (ঐচ্ছিক)</label>
                      <input value={senderNumber} onChange={e => setSenderNumber(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none"
                        placeholder="০১XXXXXXXXX" />
                    </div>
                  </>
                )}
                <button type="submit" disabled={loading || (paymentMethod !== 'balance' && !trxId) || (paymentMethod === 'balance' && !isBalanceSufficient)}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg">
                  {loading ? 'প্রসেসিং...' : paymentMethod === 'balance' ? `৳${(selectedPkg?.amount || 0).toLocaleString()} ব্যালেন্স থেকে পেমেন্ট করুন` : 'পেমেন্ট জমা দিন'}
                </button>
              </form>

              <button onClick={() => setStep(3)} className="w-full mt-3 text-xs text-gray-400 hover:text-gray-600 text-center py-2">
                পরে পেমেন্ট করব
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Step 1: Registration Form ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShoppingBag size={28} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">রেজিস্ট্রেশন</h1>
              <p className="text-gray-500 text-sm mt-2">নতুন একাউন্ট তৈরি করুন</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Package Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">প্যাকেজ নির্বাচন করুন</label>
                <div className="space-y-2.5">
                  {packages.map(pkg => (
                    <button key={pkg.value} type="button" onClick={() => setForm({ ...form, package_type: pkg.value })}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${form.package_type === pkg.value ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className={`w-10 h-10 bg-gradient-to-br ${pkg.color} rounded-lg flex items-center justify-center text-white flex-shrink-0`}>
                        {pkg.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm text-gray-900">{pkg.label}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full text-white bg-gradient-to-r ${pkg.color}`}>{pkg.badge}</span>
                          {pkg.value !== 'customer' && (
                            <span className="text-xs font-bold text-gray-700">{pkg.subtitle}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{pkg.note}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${form.package_type === pkg.value ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'}`}>
                        {form.package_type === pkg.value && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">নাম *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none text-sm" placeholder="আপনার নাম" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">ফোন *</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none text-sm" placeholder="০১XXXXXXXXX" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ইমেইল *</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none text-sm" placeholder="your@email.com" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">পাসওয়ার্ড *</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required
                      className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none text-sm" placeholder="পাসওয়ার্ড" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3.5 text-gray-400">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">নিশ্চিত *</label>
                  <input type={showPass ? 'text' : 'password'} value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none text-sm" placeholder="পুনরায়" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">রেফারার আইডি (ঐচ্ছিক)</label>
                <input value={form.referrer_id} onChange={e => setForm({ ...form, referrer_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none text-sm" placeholder="রেফারারের আইডি" />
              </div>

              {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100">{error}</div>}

              {form.package_type === 'customer' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <p className="text-xs text-blue-700 font-medium">
                    ℹ️ কাস্টমার প্যাকেজে রেজিস্ট্রেশন বিনামূল্যে। শপ থেকে ১,০০০ PV মূল্যের পণ্য কিনলেই আইডি সক্রিয় হবে।
                  </p>
                  <p className="text-xs text-blue-600 mt-1">মাসে ১০০ PV কিনলে আইডি রিনিউ হবে (৩০ দিন)।</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 shadow-lg flex items-center justify-center gap-2">
                {loading ? 'প্রসেসিং...' : (
                  <>
                    {form.package_type === 'customer' ? 'রেজিস্ট্রেশন করুন' : 'পরবর্তী ধাপ — পেমেন্ট'}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                আগেই একাউন্ট আছে?{' '}
                <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-700">লগইন করুন</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}