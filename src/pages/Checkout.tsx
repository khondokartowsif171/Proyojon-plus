import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CreditCard, Truck, ShieldCheck, Smartphone, CheckCircle, Wallet } from 'lucide-react';
import { toast } from 'sonner';

const STRIPE_ACCOUNT_ID = 'acct_1TKKm8HLRkSRtFTN';
const stripePromise =
  STRIPE_ACCOUNT_ID && STRIPE_ACCOUNT_ID !== 'STRIPE_ACCOUNT_ID'
    ? loadStripe(
        'pk_live_51OJhJBHdGQpsHqInIzu7c6PzGPSH0yImD4xfpofvxvFZs0VFhPRXZCyEgYkkhOtBOXFWvssYASs851mflwQvjnrl00T6DbUwWZ',
        { stripeAccount: STRIPE_ACCOUNT_ID },
      )
    : null;

// ── Club pool percentages ────────────────────────────────────────────────────
const PV_CLUB_PCTS: Record<string, number> = {
  daily_club:       0.30,
  weekly_club:      0.025,
  insurance_club:   0.0125,
  pension_club:     0.0125,
  shareholder_club: 0.10,
};

// ── Stripe Payment Form ──────────────────────────────────────────────────────
function PaymentForm({ onSuccess }: { onSuccess: (pi: any) => void }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true); setError('');
    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements, redirect: 'if_required',
    });
    if (submitError) {
      setError(submitError.message || 'পেমেন্ট সমস্যা');
      setLoading(false);
    } else if (paymentIntent?.status === 'succeeded') {
      onSuccess(paymentIntent);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      <button type="submit" disabled={!stripe || loading}
        className="w-full mt-4 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg">
        {loading ? 'প্রসেসিং...' : 'পেমেন্ট করুন'}
      </button>
    </form>
  );
}

// ── Main Checkout ────────────────────────────────────────────────────────────
export default function Checkout() {
  const navigate = useNavigate();
  const { cart, cartTotal, totalPvPoints, clearCart } = useCart();
  const { user, refreshUser } = useAuth();

  const [clientSecret,   setClientSecret]   = useState('');
  const [paymentError,   setPaymentError]   = useState('');
  const [paymentMethod,  setPaymentMethod]  = useState<'card' | 'mobile' | 'balance'>('mobile');
  const [mobileMethod,   setMobileMethod]   = useState('bkash');
  const [trxId,          setTrxId]          = useState('');
  const [senderNumber,   setSenderNumber]   = useState('');
  const [mobileLoading,  setMobileLoading]  = useState(false);
  const [mobileSuccess,  setMobileSuccess]  = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const [shippingAddress, setShippingAddress] = useState({
    name:           user?.name  || '',
    email:          user?.email || '',
    phone:          user?.phone || '',
    address:        '',
    city:           '',
    state:          '',
    referrer_name:  '',
    referrer_phone: '',
  });

  // User balance
  const userBalance        = user?.current_balance || 0;
  const cartTotalInTaka    = Math.round(cartTotal / 100); // cart total টাকায়
  const canPayWithBalance  = userBalance >= cartTotalInTaka && cartTotalInTaka > 0;

  useEffect(() => {
    if (cart.length === 0) { navigate('/cart'); return; }
    if (paymentMethod === 'card') {
      if (cartTotal > 0) {
        supabase.functions
          .invoke('create-payment-intent', { body: { amount: cartTotal, currency: 'bdt' } })
          .then(({ data, error }) => {
            if (error || !data?.clientSecret) {
              setPaymentError('পেমেন্ট সিস্টেম সেটআপ হচ্ছে।'); return;
            }
            setClientSecret(data.clientSecret);
          });
      }
    }
  }, [paymentMethod]);

  // ── Club pool helper ──────────────────────────────────────────────────────
  const addToClubPools = async (pvAmount: number) => {
    for (const [clubType, pct] of Object.entries(PV_CLUB_PCTS)) {
      const amt = Math.floor(pvAmount * pct);
      if (amt <= 0) continue;
      const { data: pool } = await supabase
        .from('mlm_club_pools').select('id, total_amount')
        .eq('club_type', clubType).single();
      if (pool) {
        await supabase.from('mlm_club_pools')
          .update({ total_amount: (pool.total_amount || 0) + amt })
          .eq('id', pool.id);
      }
    }
  };

  // ── Generation bonus chain — শুধু customer package এর PV sales এ ──────────
  const processGenerationBonusChain = async (
    userId: string, pvPoints: number, sourceId: string, gen: number,
  ) => {
    if (gen > 5) return;
    const { data: u } = await supabase
      .from('mlm_users')
      .select('id, referrer_id, is_active, current_balance, total_income, package_type')
      .eq('id', userId).single();
    // ✅ Fix 4: Generation bonus শুধু active users পাবে
    if (!u || !u.is_active) return;
    const bonus = Math.floor(pvPoints * 0.01);
    if (bonus > 0) {
      await supabase.from('mlm_users').update({
        current_balance: (u.current_balance || 0) + bonus,
        total_income:    (u.total_income || 0) + bonus,
      }).eq('id', u.id);
      await supabase.from('mlm_transactions').insert({
        user_id:         u.id,
        type:            'generation_bonus',
        amount:          bonus,
        description:     `জেনারেশন ${gen} বোনাস (PV: ${pvPoints})`,
        related_user_id: sourceId,
      });
    }
    if (u.referrer_id) {
      await processGenerationBonusChain(u.referrer_id, pvPoints, sourceId, gen + 1);
    }
  };

  // ── PV processing — শুধু customer package এর ক্ষেত্রে ────────────────────
  const processPvForCustomer = async (pvToAdd: number) => {
    if (!user || user.package_type !== 'customer') return;

    const currentMonthly = user.monthly_pv_purchased || 0;
    const newMonthly     = currentMonthly + pvToAdd;

    const updates: any = {
      pv_points:            (user.pv_points || 0) + pvToAdd,
      monthly_pv_purchased: newMonthly,
    };

    // First activation: 1000 PV required (activated_at is null)
    // Re-activation after expiry: 100 PV per month (activated_at is set)
    const isFirstTime = !user.activated_at;
    const pvThreshold = isFirstTime ? 1000 : 100;

    if (!user.is_active && newMonthly >= pvThreshold) {
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 30);
      updates.is_active    = true;
      updates.expires_at   = newExpiry.toISOString();
      updates.activated_at = new Date().toISOString();
      updates.is_daily_club = true; // 1000 PV activation → auto Daily club
    } else if (user.is_active && newMonthly >= 100) {
      // Already active — extend expiry, ensure daily club stays on
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 30);
      updates.expires_at   = newExpiry.toISOString();
      updates.is_daily_club = true;
    }

    const wasInactive = !user.is_active;
    await supabase.from('mlm_users').update(updates).eq('id', user.id);

    // PV log
    await supabase.from('mlm_pv_log').insert({
      user_id: user.id,
      amount:  pvToAdd,
      source:  'product_purchase',
    }).catch(() => {});

    // ── First activation: 5% referral commission + direct count + club promotions ──
    const justActivated = wasInactive && isFirstTime && updates.is_active === true;
    if (justActivated && user.referrer_id) {
      const commission = Math.floor(pvToAdd * 0.05);
      const { data: referrer } = await supabase.from('mlm_users')
        .select('id, current_balance, total_income, is_active, direct_referrals_count, is_weekly_club, is_insurance_club')
        .eq('id', user.referrer_id).single();

      if (referrer && referrer.is_active) {
        const newCount = (referrer.direct_referrals_count || 0) + 1;
        const refUpdates: any = { direct_referrals_count: newCount };

        if (commission > 0) {
          refUpdates.current_balance = Number(referrer.current_balance || 0) + commission;
          refUpdates.total_income    = Number(referrer.total_income    || 0) + commission;
          await supabase.from('mlm_transactions').insert({
            user_id:         referrer.id,
            type:            'referral_income',
            amount:          commission,
            description:     `কাস্টমার রেফার কমিশন ৫% — ${user.name || ''} (PV: ${pvToAdd})`,
            related_user_id: user.id,
          });
        }

        // Weekly club promotion: ১৫ সক্রিয় রেফারাল হলে
        if (newCount >= 15 && !referrer.is_weekly_club) {
          refUpdates.is_weekly_club = true;
        }

        // Insurance + Pension: ১৫ জন weekly club member direct referral হলে
        if (!referrer.is_insurance_club) {
          const { data: directs } = await supabase.from('mlm_users')
            .select('id, is_weekly_club').eq('referrer_id', referrer.id).eq('is_active', true);
          const weeklyCount = (directs || []).filter(r => r.is_weekly_club).length;
          if (weeklyCount >= 15) {
            refUpdates.is_insurance_club = true;
            refUpdates.is_pension_club   = true;
          }
        }

        await supabase.from('mlm_users').update(refUpdates).eq('id', referrer.id);
      }
    }

    // ── Generation bonus — শুধু active customer এর PV purchase এ, active upline পাবে ──
    const isNowActive = user.is_active || updates.is_active === true;
    if (isNowActive && user.referrer_id && pvToAdd > 0) {
      await processGenerationBonusChain(user.referrer_id, pvToAdd, user.id, 1);
    }

    // ── Club pools — সব PV purchase এ যোগ হবে ──
    if (pvToAdd >= 1) {
      await addToClubPools(pvToAdd);
    }

    await refreshUser();
  };

  // ── Create order ──────────────────────────────────────────────────────────
  // addPvNow = true → Card / Balance payment (সাথে সাথে PV দাও)
  // addPvNow = false → Mobile payment (Admin approve এর পরে PV দেবে)
  const createOrder = async (paymentRef: string, addPvNow: boolean = false) => {
    const { data: customer } = await supabase
      .from('ecom_customers')
      .upsert(
        { email: shippingAddress.email, name: shippingAddress.name, phone: shippingAddress.phone },
        { onConflict: 'email' },
      )
      .select('id').single();

    const { data: order } = await supabase.from('ecom_orders').insert({
      customer_id:              customer?.id  || null,
      user_id:                  user?.id      || null,
      status:                   addPvNow ? 'paid' : 'pending',
      subtotal:                 cartTotal,
      tax:                      0,
      shipping:                 0,
      total:                    cartTotal,
      shipping_address:         shippingAddress,
      stripe_payment_intent_id: paymentRef,
      notes: shippingAddress.referrer_name
        ? `রেফারার: ${shippingAddress.referrer_name} (${shippingAddress.referrer_phone})`
        : null,
    }).select('id').single();

    if (order) {
      await supabase.from('ecom_order_items').insert(
        cart.map(item => ({
          order_id:      order.id,
          product_id:    item.product_id,
          variant_id:    item.variant_id    || null,
          product_name:  item.name,
          variant_title: item.variant_title || null,
          sku:           item.sku           || null,
          quantity:      item.quantity,
          unit_price:    item.price,
          total:         item.price * item.quantity,
        })),
      );
    }

    // ✅ Fix 4: শুধু customer package এর জন্য PV process করো
    if (addPvNow && user && user.package_type === 'customer' && totalPvPoints > 0) {
      await processPvForCustomer(totalPvPoints);
    } else if (addPvNow) {
      await refreshUser();
    }

    clearCart();
    navigate('/order-confirmation?id=' + (order?.id || ''));
  };

  // ── Card payment ──────────────────────────────────────────────────────────
  const handlePaymentSuccess = async (paymentIntent: any) => {
    try {
      await createOrder(paymentIntent.id, true);
    } catch (err) {
      console.error(err);
      toast.error('অর্ডার তৈরি করতে সমস্যা');
    }
  };

  // ── Mobile payment ────────────────────────────────────────────────────────
  const handleMobilePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trxId.trim()) { toast.error('TRX ID দিন'); return; }
    if (!shippingAddress.name || !shippingAddress.phone || !shippingAddress.address) {
      toast.error('শিপিং তথ্য পূরণ করুন'); return;
    }
    setMobileLoading(true);

    if (user) {
      await supabase.from('mlm_payment_verifications').insert({
        user_id:       user.id,
        amount:        cartTotalInTaka,
        method:        mobileMethod,
        trx_id:        trxId.trim(),
        sender_number: senderNumber.trim() || null,
        purpose:       'product_purchase',
        pv_points:     user.package_type === 'customer' ? totalPvPoints : 0,
        status:        'pending',
      });
    }

    // Mobile payment → PV দেবে না সাথে সাথে
    await createOrder(`mobile_${mobileMethod}_${trxId.trim()}`, false);
    setMobileSuccess(true);
    setMobileLoading(false);
  };

  // ── ✅ Balance payment — নতুন ────────────────────────────────────────────
  const handleBalancePayment = async () => {
    if (!user) { toast.error('লগইন করুন'); return; }
    if (!canPayWithBalance) {
      toast.error(`ব্যালেন্স যথেষ্ট নয়। দরকার: ৳${cartTotalInTaka}, আছে: ৳${userBalance}`);
      return;
    }
    if (!shippingAddress.name || !shippingAddress.phone || !shippingAddress.address) {
      toast.error('শিপিং তথ্য পূরণ করুন'); return;
    }

    setBalanceLoading(true);
    try {
      // Balance কাটো
      const { error: balErr } = await supabase.from('mlm_users')
        .update({ current_balance: userBalance - cartTotalInTaka })
        .eq('id', user.id);

      if (balErr) {
        toast.error('ব্যালেন্স কাটতে সমস্যা: ' + balErr.message);
        setBalanceLoading(false); return;
      }

      // Transaction log
      await supabase.from('mlm_transactions').insert({
        user_id:     user.id,
        type:        'product_purchase',
        amount:      -cartTotalInTaka,
        description: `ব্যালেন্স থেকে পণ্য ক্রয় (৳${cartTotalInTaka})`,
      });

      // Order তৈরি করো + PV দাও
      await createOrder(`balance_payment_${user.id}_${Date.now()}`, true);
      toast.success('✅ ব্যালেন্স থেকে অর্ডার সম্পন্ন!');
    } catch (err: any) {
      toast.error('সমস্যা হয়েছে: ' + err.message);
    }
    setBalanceLoading(false);
  };

  const mobilePaymentMethods = [
    { key: 'bkash',  label: 'বিকাশ', color: '#E2136E', number: '01XXXXXXXXX', bgClass: 'from-pink-500 to-pink-600' },
    { key: 'nagad',  label: 'নগদ',   color: '#F6921E', number: '01XXXXXXXXX', bgClass: 'from-orange-400 to-orange-500' },
    { key: 'rocket', label: 'রকেট',  color: '#8B2F8B', number: '01XXXXXXXXX', bgClass: 'from-purple-600 to-purple-700' },
  ];

  // ── Mobile success ────────────────────────────────────────────────────────
  if (mobileSuccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">পেমেন্ট অনুরোধ সফল!</h1>
            <p className="text-gray-500 mb-2">আপনার পেমেন্ট এডমিন কর্তৃক যাচাই করা হবে।</p>
            <p className="text-gray-400 text-sm mb-6">অনুমোদনের পর অর্ডার নিশ্চিত হবে।</p>
            <Link to="/dashboard" className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700">
              ড্যাশবোর্ডে যান
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">চেকআউট</h1>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left */}
          <div className="space-y-6">

            {/* Shipping */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Truck size={20} className="text-indigo-600" /> শিপিং তথ্য
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">নাম *</label>
                  <input value={shippingAddress.name} onChange={e => setShippingAddress({...shippingAddress, name: e.target.value})} required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none" placeholder="আপনার নাম" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">ইমেইল *</label>
                  <input type="email" value={shippingAddress.email} onChange={e => setShippingAddress({...shippingAddress, email: e.target.value})} required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">ফোন *</label>
                  <input value={shippingAddress.phone} onChange={e => setShippingAddress({...shippingAddress, phone: e.target.value})} required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none" placeholder="০১XXXXXXXXX" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">ঠিকানা *</label>
                  <input value={shippingAddress.address} onChange={e => setShippingAddress({...shippingAddress, address: e.target.value})} required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none" placeholder="বিস্তারিত ঠিকানা" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">শহর</label>
                  <input value={shippingAddress.city} onChange={e => setShippingAddress({...shippingAddress, city: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">জেলা</label>
                  <input value={shippingAddress.state} onChange={e => setShippingAddress({...shippingAddress, state: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none" />
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">রেফারকারীর তথ্য (ঐচ্ছিক)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input value={shippingAddress.referrer_name} onChange={e => setShippingAddress({...shippingAddress, referrer_name: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none" placeholder="রেফারকারীর নাম" />
                  <input value={shippingAddress.referrer_phone} onChange={e => setShippingAddress({...shippingAddress, referrer_phone: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none" placeholder="রেফারকারীর ফোন" />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard size={20} className="text-indigo-600" /> পেমেন্ট মাধ্যম
              </h2>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {/* Mobile */}
                <button onClick={() => setPaymentMethod('mobile')}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${paymentMethod === 'mobile' ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
                  <Smartphone size={22} className="mx-auto mb-2 text-indigo-600" />
                  <p className="font-semibold text-xs">মোবাইল</p>
                  <p className="text-[10px] text-gray-500">বিকাশ/নগদ</p>
                </button>

                {/* Card */}
                <button onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${paymentMethod === 'card' ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
                  <CreditCard size={22} className="mx-auto mb-2 text-indigo-600" />
                  <p className="font-semibold text-xs">কার্ড</p>
                  <p className="text-[10px] text-gray-500">Visa/Master</p>
                </button>

                {/* ✅ Balance — PV এর বদলে Balance */}
                <button
                  onClick={() => setPaymentMethod('balance')}
                  disabled={cartTotalInTaka === 0}
                  className={`p-4 rounded-xl border-2 text-center transition-all relative ${
                    paymentMethod === 'balance'
                      ? 'border-green-500 bg-green-50 shadow-md'
                      : 'border-gray-200 hover:border-green-300'
                  }`}>
                  <Wallet size={22} className={`mx-auto mb-2 ${paymentMethod === 'balance' ? 'text-green-600' : 'text-green-500'}`} />
                  <p className="font-semibold text-xs">ব্যালেন্স</p>
                  <p className="text-[10px] text-gray-500">৳{userBalance.toLocaleString()}</p>
                  {canPayWithBalance && (
                    <span className="absolute -top-1.5 -right-1.5 bg-green-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">✓</span>
                  )}
                </button>
              </div>

              {/* ── Mobile payment form ── */}
              {paymentMethod === 'mobile' && (
                <div>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {mobilePaymentMethods.map(m => (
                      <button key={m.key} onClick={() => setMobileMethod(m.key)}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${mobileMethod === m.key ? 'shadow-lg' : 'border-gray-200'}`}
                        style={mobileMethod === m.key ? { borderColor: m.color, backgroundColor: m.color + '10' } : {}}>
                        <div className={`w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br ${m.bgClass} flex items-center justify-center`}>
                          <span className="text-white font-bold text-xs">{m.label.charAt(0)}</span>
                        </div>
                        <p className="font-bold text-xs" style={{ color: m.color }}>{m.label}</p>
                      </button>
                    ))}
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
                    <p className="text-xs text-yellow-800 font-medium">
                      ⚠️ মোবাইল পেমেন্টে Admin approve করার পরে অর্ডার নিশ্চিত হবে।
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
                    <p className="text-sm font-semibold text-gray-800 mb-2">পেমেন্ট নির্দেশনা:</p>
                    <ol className="text-xs text-gray-600 space-y-1 list-decimal pl-4">
                      <li>নিচের নম্বরে <span className="font-bold">৳{cartTotalInTaka.toLocaleString()}</span> পাঠান</li>
                      <li>{mobilePaymentMethods.find(m => m.key === mobileMethod)?.label} নম্বর:{' '}
                        <span className="font-bold font-mono">{mobilePaymentMethods.find(m => m.key === mobileMethod)?.number}</span>
                      </li>
                      <li>TRX ID ও সেন্ডার নম্বর নিচে দিন</li>
                    </ol>
                  </div>

                  <form onSubmit={handleMobilePayment} className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">TRX ID *</label>
                      <input value={trxId} onChange={e => setTrxId(e.target.value)} required
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none font-mono" placeholder="TXN123456789" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">সেন্ডার নম্বর</label>
                      <input value={senderNumber} onChange={e => setSenderNumber(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none" placeholder="০১XXXXXXXXX" />
                    </div>
                    <button type="submit" disabled={mobileLoading || !trxId}
                      className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg">
                      {mobileLoading ? 'প্রসেসিং...' : 'পেমেন্ট জমা দিন'}
                    </button>
                  </form>
                </div>
              )}

              {/* ── Card payment ── */}
              {paymentMethod === 'card' && (
                <div>
                  {!stripePromise ? (
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
                      <p className="text-yellow-800 text-sm">কার্ড পেমেন্ট সিস্টেম সেটআপ হচ্ছে।</p>
                    </div>
                  ) : paymentError ? (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
                      <p className="text-red-800 text-sm">{paymentError}</p>
                    </div>
                  ) : clientSecret ? (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <PaymentForm onSuccess={handlePaymentSuccess} />
                    </Elements>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full" />
                      <span className="ml-3 text-gray-500 text-sm">লোড হচ্ছে...</span>
                    </div>
                  )}
                </div>
              )}

              {/* ── ✅ Balance payment ── */}
              {paymentMethod === 'balance' && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-semibold text-green-800">আপনার ব্যালেন্স</span>
                      <span className="text-xl font-bold text-green-700">৳{userBalance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-green-700">এই অর্ডারে লাগবে</span>
                      <span className="text-lg font-bold text-orange-600">৳{cartTotalInTaka.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((userBalance / Math.max(cartTotalInTaka, 1)) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-green-200">
                      <span className="text-sm text-green-700">কাটার পর বাকি</span>
                      <span className={`font-bold ${canPayWithBalance ? 'text-green-700' : 'text-red-600'}`}>
                        ৳{(userBalance - cartTotalInTaka).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {canPayWithBalance ? (
                    <>
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                        <p className="text-xs text-green-700 font-medium">
                          ✅ যথেষ্ট ব্যালেন্স আছে। অর্ডার করলে ৳{cartTotalInTaka} কেটে নেওয়া হবে।
                        </p>
                      </div>
                      <button
                        onClick={handleBalancePayment}
                        disabled={balanceLoading}
                        className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2">
                        <Wallet size={18} />
                        {balanceLoading ? 'প্রসেসিং...' : `৳${cartTotalInTaka} ব্যালেন্স থেকে অর্ডার করুন`}
                      </button>
                    </>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                      <p className="text-red-700 font-semibold text-sm mb-1">❌ ব্যালেন্স যথেষ্ট নয়</p>
                      <p className="text-red-600 text-xs">
                        দরকার ৳{cartTotalInTaka}, আছে ৳{userBalance}।
                        আরও ৳{cartTotalInTaka - userBalance} প্রয়োজন।
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right — Order summary */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-fit sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ShieldCheck size={20} className="text-indigo-600" /> অর্ডার সারাংশ
            </h2>
            <div className="space-y-3 mb-6">
              {cart.map(item => (
                <div key={item.product_id + (item.variant_id || '')} className="flex items-center gap-3 py-2">
                  <img src={item.image || '/placeholder.svg'} alt={item.name} className="w-14 h-14 object-cover rounded-lg" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 line-clamp-1">{item.name}</p>
                    <p className="text-xs text-gray-400">x{item.quantity}</p>
                    {item.pv_points && item.pv_points > 0 && user?.package_type === 'customer' && (
                      <p className="text-xs text-green-600 font-medium">+{item.pv_points * item.quantity} PV অর্জন হবে</p>
                    )}
                  </div>
                  <span className="text-sm font-bold text-gray-700">
                    ৳{((item.price * item.quantity) / 100).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">সাবটোটাল</span>
                <span>৳{cartTotalInTaka.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">শিপিং</span>
                <span className="text-green-600 font-medium">ফ্রি</span>
              </div>
              {totalPvPoints > 0 && user?.package_type === 'customer' && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">অর্জিত হবে</span>
                  <span className="text-green-600 font-bold">+{totalPvPoints} PV</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-3 flex justify-between">
                <span className="font-bold text-gray-900">মোট</span>
                <span className="font-bold text-xl text-indigo-700">৳{cartTotalInTaka.toLocaleString()}</span>
              </div>
            </div>

            {/* User balance info */}
            {user && (
              <div className="mt-3 bg-gray-50 rounded-xl p-3 border border-gray-100 flex justify-between items-center">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Wallet size={12} className="text-green-500" /> আপনার ব্যালেন্স
                </span>
                <span className="text-sm font-bold text-green-700">৳{userBalance.toLocaleString()}</span>
              </div>
            )}

            {paymentMethod === 'mobile' && (
              <div className="mt-3 bg-yellow-50 rounded-xl p-3 border border-yellow-100">
                <p className="text-xs text-yellow-700">⏳ মোবাইল পেমেন্ট Admin approve এর পরে নিশ্চিত হবে।</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}