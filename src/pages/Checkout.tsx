import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CreditCard, Truck, ShieldCheck, Smartphone, CheckCircle, Star } from 'lucide-react';
import { toast } from 'sonner';

const STRIPE_ACCOUNT_ID = 'acct_1TKKm8HLRkSRtFTN';
const stripePromise =
  STRIPE_ACCOUNT_ID && STRIPE_ACCOUNT_ID !== 'STRIPE_ACCOUNT_ID'
    ? loadStripe(
        'pk_live_51OJhJBHdGQpsHqInIzu7c6PzGPSH0yImD4xfpofvxvFZs0VFhPRXZCyEgYkkhOtBOXFWvssYASs851mflwQvjnrl00T6DbUwWZ',
        { stripeAccount: STRIPE_ACCOUNT_ID },
      )
    : null;

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
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full mt-4 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg"
      >
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
  const [paymentMethod,  setPaymentMethod]  = useState<'card' | 'mobile' | 'pv'>('mobile');
  const [mobileMethod,   setMobileMethod]   = useState('bkash');
  const [trxId,          setTrxId]          = useState('');
  const [senderNumber,   setSenderNumber]   = useState('');
  const [mobileLoading,  setMobileLoading]  = useState(false);
  const [mobileSuccess,  setMobileSuccess]  = useState(false);
  const [pvLoading,      setPvLoading]      = useState(false);

  const [shippingAddress, setShippingAddress] = useState({
    name:           user?.name  || '',
    email:          user?.email || '',
    phone:          user?.phone || '',
    address:        '',
    city:           '',
    state:          '',
    zip:            '',
    referrer_name:  '',
    referrer_phone: '',
  });

  // PV helpers
  const userPvPoints        = user?.pv_points || 0;
  const cartTotalPvRequired = cart.reduce(
    (sum, item) => sum + ((item.pv_points || 0) * item.quantity), 0,
  );
  const canPayWithPv = userPvPoints >= cartTotalPvRequired && cartTotalPvRequired > 0;

  useEffect(() => {
    if (cart.length === 0) { navigate('/cart'); return; }
    if (paymentMethod === 'card') {
      if (cartTotal > 0) {
        supabase.functions
          .invoke('create-payment-intent', { body: { amount: cartTotal, currency: 'bdt' } })
          .then(({ data, error }) => {
            if (error || !data?.clientSecret) {
              setPaymentError('পেমেন্ট সিস্টেম সেটআপ হচ্ছে।');
              return;
            }
            setClientSecret(data.clientSecret);
          });
      }
    }
  }, [paymentMethod]);

  // ── PV & Reactivation (সাথে সাথে PV দেওয়ার সময়) ───────────────────────────
  const processPvAndReactivation = async () => {
    if (!user) return;
    const newMonthly = (user.monthly_pv_purchased || 0) + totalPvPoints;

    await supabase.from('mlm_users').update({
      monthly_pv_purchased: newMonthly,
      pv_points:            (user.pv_points || 0) + totalPvPoints,
    }).eq('id', user.id);

    // PV log
    for (const item of cart) {
      if (item.pv_points && item.pv_points > 0) {
        await supabase.from('mlm_pv_log').insert({
          user_id:      user.id,
          amount:       item.pv_points * item.quantity,
          source:       'product_purchase',
          product_name: item.name,
        });
      }
    }

    // ১০০ PV হলে reactivate + generation bonus + club pool
    if (newMonthly >= 100) {
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 30);
      await supabase.from('mlm_users').update({
        is_active:  true,
        expires_at: newExpiry.toISOString(),
      }).eq('id', user.id);

      if (user.referrer_id) {
        await processGenerationBonusChain(user.referrer_id, totalPvPoints, user.id, 1);
      }
      if (totalPvPoints >= 100) {
        await distributeToClubPools(totalPvPoints);
      }
    }

    await refreshUser();
  };

  // ── Generation bonus chain (1st–5th gen, 1% each) ───────────────────────────
  const processGenerationBonusChain = async (
    userId: string, pvPoints: number, sourceId: string, gen: number,
  ) => {
    if (gen > 5) return;
    const { data: u } = await supabase
      .from('mlm_users')
      .select('id, referrer_id, is_active, current_balance, total_income')
      .eq('id', userId).single();
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

  // ── Club pool distribution ────────────────────────────────────────────────
  const distributeToClubPools = async (pvAmount: number) => {
    const pools = [
      { type: 'daily_club',       amount: Math.floor(pvAmount * 0.30)  },
      { type: 'weekly_club',      amount: Math.floor(pvAmount * 0.025) },
      { type: 'insurance_club',   amount: Math.floor(pvAmount * 0.025) },
      { type: 'pension_club',     amount: Math.floor(pvAmount * 0.025) },
      { type: 'shareholder_club', amount: Math.floor(pvAmount * 0.10)  },
    ];
    for (const pool of pools) {
      const { data } = await supabase
        .from('mlm_club_pools').select('id, total_amount')
        .eq('club_type', pool.type).single();
      if (data) {
        await supabase.from('mlm_club_pools')
          .update({ total_amount: (data.total_amount || 0) + pool.amount })
          .eq('id', data.id);
      }
    }
  };

  // ── Create order ─────────────────────────────────────────────────────────
  // addPvNow = true  → Card / PV payment (সাথে সাথে PV দাও)
  // addPvNow = false → Mobile payment (Admin approve এর পরে PV দেবে)
  const createOrder = async (paymentRef: string, addPvNow: boolean = false) => {
    // Customer upsert
    const { data: customer } = await supabase
      .from('ecom_customers')
      .upsert(
        { email: shippingAddress.email, name: shippingAddress.name, phone: shippingAddress.phone },
        { onConflict: 'email' },
      )
      .select('id').single();

    // Order insert
    const { data: order } = await supabase.from('ecom_orders').insert({
      customer_id:              customer?.id  || null,
      user_id:                  user?.id      || null,
      // ✅ Mobile payment → pending (Admin approve করবে)
      // Card / PV payment → paid (সাথে সাথে confirm)
      status:                   addPvNow ? 'paid' : 'pending',
      subtotal:                 cartTotal,
      tax:                      0,
      shipping:                 0,
      total:                    cartTotal,
      shipping_address:         shippingAddress,
      stripe_payment_intent_id: paymentRef,
      notes:                    shippingAddress.referrer_name
        ? `রেফারার: ${shippingAddress.referrer_name} (${shippingAddress.referrer_phone})`
        : null,
    }).select('id').single();

    // Order items
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

    // ✅ Card / PV payment → সাথে সাথে PV দাও
    // ✅ Mobile payment → PV দেবে না (Admin approve এর পরে AdminDashboard দেবে)
    if (addPvNow && user) {
      await processPvAndReactivation();
    }

    clearCart();
    navigate('/order-confirmation?id=' + (order?.id || ''));
  };

  // ── Card payment success ──────────────────────────────────────────────────
  const handlePaymentSuccess = async (paymentIntent: any) => {
    try {
      // ✅ Card payment — সাথে সাথে PV দাও
      await createOrder(paymentIntent.id, true);
    } catch (err) {
      console.error(err);
      toast.error('অর্ডার তৈরি করতে সমস্যা');
    }
  };

  // ── Mobile payment submit ─────────────────────────────────────────────────
  const handleMobilePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trxId.trim()) { toast.error('TRX ID দিন'); return; }
    if (!shippingAddress.name || !shippingAddress.phone || !shippingAddress.address) {
      toast.error('শিপিং তথ্য পূরণ করুন'); return;
    }
    setMobileLoading(true);

    // Payment verification record (Admin এখান থেকে approve করবে)
    if (user) {
      await supabase.from('mlm_payment_verifications').insert({
        user_id:       user.id,
        amount:        Math.round(cartTotal / 100),
        method:        mobileMethod,
        trx_id:        trxId.trim(),
        sender_number: senderNumber.trim() || null,
        purpose:       'product_purchase',
        // PV amount store করো যাতে Admin approve করার সময় জানতে পারে
        pv_points:     totalPvPoints,
        status:        'pending',
      });
    }

    // ✅ addPvNow = false — Admin approve না করা পর্যন্ত PV দেবে না
    await createOrder(`mobile_${mobileMethod}_${trxId.trim()}`, false);
    setMobileSuccess(true);
    setMobileLoading(false);
  };

  // ── PV payment ────────────────────────────────────────────────────────────
  const handlePvPayment = async () => {
    if (!user) { toast.error('লগইন করুন'); return; }
    if (!canPayWithPv) {
      toast.error(`PV যথেষ্ট নয়। দরকার: ${cartTotalPvRequired} PV, আছে: ${userPvPoints} PV`);
      return;
    }
    if (!shippingAddress.name || !shippingAddress.phone || !shippingAddress.address) {
      toast.error('শিপিং তথ্য পূরণ করুন'); return;
    }

    setPvLoading(true);
    try {
      // PV কাটো
      const { error: pvError } = await supabase.from('mlm_users')
        .update({ pv_points: userPvPoints - cartTotalPvRequired })
        .eq('id', user.id);

      if (pvError) {
        toast.error('PV কাটতে সমস্যা: ' + pvError.message);
        setPvLoading(false); return;
      }

      // PV transaction log
      await supabase.from('mlm_transactions').insert({
        user_id:     user.id,
        type:        'pv_payment',
        amount:      -cartTotalPvRequired,
        description: `PV দিয়ে পণ্য ক্রয় (${cartTotalPvRequired} PV)`,
      });

      // ✅ PV payment — সাথে সাথে PV দাও (order confirm)
      await createOrder(`pv_payment_${user.id}_${Date.now()}`, true);
      toast.success(`✅ ${cartTotalPvRequired} PV দিয়ে অর্ডার সম্পন্ন!`);
    } catch (err: any) {
      toast.error('সমস্যা হয়েছে: ' + err.message);
    }
    setPvLoading(false);
  };

  const mobilePaymentMethods = [
    { key: 'bkash',  label: 'বিকাশ', color: '#E2136E', number: '01XXXXXXXXX', bgClass: 'from-pink-500 to-pink-600' },
    { key: 'nagad',  label: 'নগদ',   color: '#F6921E', number: '01XXXXXXXXX', bgClass: 'from-orange-400 to-orange-500' },
    { key: 'rocket', label: 'রকেট',  color: '#8B2F8B', number: '01XXXXXXXXX', bgClass: 'from-purple-600 to-purple-700' },
  ];

  // ── Mobile success screen ─────────────────────────────────────────────────
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
            <p className="text-gray-400 text-sm mb-6">অনুমোদনের পর আপনার অর্ডার ও PV নিশ্চিত হবে।</p>
            <Link
              to="/dashboard"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
            >
              ড্যাশবোর্ডে যান
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Main UI ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">চেকআউট</h1>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left column */}
          <div className="space-y-6">

            {/* Shipping */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Truck size={20} className="text-indigo-600" /> শিপিং তথ্য
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">নাম *</label>
                  <input value={shippingAddress.name} onChange={e => setShippingAddress({ ...shippingAddress, name: e.target.value })} required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none" placeholder="আপনার নাম" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">ইমেইল *</label>
                  <input type="email" value={shippingAddress.email} onChange={e => setShippingAddress({ ...shippingAddress, email: e.target.value })} required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">ফোন *</label>
                  <input value={shippingAddress.phone} onChange={e => setShippingAddress({ ...shippingAddress, phone: e.target.value })} required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none" placeholder="০১XXXXXXXXX" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">ঠিকানা *</label>
                  <input value={shippingAddress.address} onChange={e => setShippingAddress({ ...shippingAddress, address: e.target.value })} required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none" placeholder="বিস্তারিত ঠিকানা" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">শহর</label>
                  <input value={shippingAddress.city} onChange={e => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">জেলা</label>
                  <input value={shippingAddress.state} onChange={e => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none" />
                </div>
              </div>

              {/* Referrer */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">রেফারকারীর তথ্য (ঐচ্ছিক)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input value={shippingAddress.referrer_name} onChange={e => setShippingAddress({ ...shippingAddress, referrer_name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none" placeholder="রেফারকারীর নাম" />
                  <input value={shippingAddress.referrer_phone} onChange={e => setShippingAddress({ ...shippingAddress, referrer_phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none" placeholder="রেফারকারীর ফোন" />
                </div>
              </div>
            </div>

            {/* Payment method */}
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

                {/* PV */}
                <button
                  onClick={() => setPaymentMethod('pv')}
                  disabled={cartTotalPvRequired === 0}
                  className={`p-4 rounded-xl border-2 text-center transition-all relative ${
                    paymentMethod === 'pv'
                      ? 'border-green-500 bg-green-50 shadow-md'
                      : cartTotalPvRequired === 0
                      ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                      : 'border-gray-200 hover:border-green-300'
                  }`}>
                  <Star size={22} className={`mx-auto mb-2 ${paymentMethod === 'pv' ? 'text-green-600' : 'text-green-500'}`} />
                  <p className="font-semibold text-xs">PV পয়েন্ট</p>
                  <p className="text-[10px] text-gray-500">{userPvPoints} PV আছে</p>
                  {canPayWithPv && (
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
                      ⚠️ মোবাইল পেমেন্টে Admin approve করার পরে PV ও অর্ডার নিশ্চিত হবে।
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
                    <p className="text-sm font-semibold text-gray-800 mb-2">পেমেন্ট নির্দেশনা:</p>
                    <ol className="text-xs text-gray-600 space-y-1 list-decimal pl-4">
                      <li>নিচের নম্বরে <span className="font-bold">৳{(cartTotal / 100).toLocaleString()}</span> পাঠান</li>
                      <li>{mobilePaymentMethods.find(m => m.key === mobileMethod)?.label} নম্বর:{' '}
                        <span className="font-bold font-mono">{mobilePaymentMethods.find(m => m.key === mobileMethod)?.number}</span>
                      </li>
                      <li>TRX ID এবং সেন্ডার নম্বর নিচে দিন</li>
                      <li>এডমিন যাচাই করলে অর্ডার ও PV নিশ্চিত হবে</li>
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

              {/* ── PV payment ── */}
              {paymentMethod === 'pv' && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-semibold text-green-800">আপনার PV ব্যালেন্স</span>
                      <span className="text-xl font-bold text-green-700">{userPvPoints} PV</span>
                    </div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-green-700">এই অর্ডারে লাগবে</span>
                      <span className="text-lg font-bold text-orange-600">{cartTotalPvRequired} PV</span>
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((userPvPoints / Math.max(cartTotalPvRequired, 1)) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-green-200">
                      <span className="text-sm text-green-700">কাটার পর বাকি</span>
                      <span className={`font-bold ${canPayWithPv ? 'text-green-700' : 'text-red-600'}`}>
                        {userPvPoints - cartTotalPvRequired} PV
                      </span>
                    </div>
                  </div>

                  {canPayWithPv ? (
                    <>
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                        <p className="text-xs text-green-700 font-medium">
                          ✅ যথেষ্ট PV আছে। অর্ডার করলে {cartTotalPvRequired} PV কেটে নেওয়া হবে এবং সাথে সাথে confirm হবে।
                        </p>
                      </div>
                      <button
                        onClick={handlePvPayment}
                        disabled={pvLoading}
                        className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2">
                        <Star size={18} />
                        {pvLoading ? 'প্রসেসিং...' : `${cartTotalPvRequired} PV দিয়ে অর্ডার করুন`}
                      </button>
                    </>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                      <p className="text-red-700 font-semibold text-sm mb-1">❌ PV যথেষ্ট নয়</p>
                      <p className="text-red-600 text-xs">
                        দরকার {cartTotalPvRequired} PV, আপনার আছে {userPvPoints} PV।
                        আরও {cartTotalPvRequired - userPvPoints} PV দরকার।
                      </p>
                      <p className="text-gray-500 text-xs mt-2">পণ্য কিনে বা প্যাকেজ নিয়ে PV অর্জন করুন।</p>
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
                    {item.pv_points && item.pv_points > 0 && (
                      <p className="text-xs text-green-600 font-medium">{item.pv_points * item.quantity} PV</p>
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
                <span>৳{(cartTotal / 100).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">শিপিং</span>
                <span className="text-green-600 font-medium">ফ্রি</span>
              </div>
              {totalPvPoints > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">অর্জিত হবে</span>
                  <span className="text-green-600 font-bold">{totalPvPoints} PV</span>
                </div>
              )}

              {paymentMethod === 'pv' ? (
                <div className="border-t border-gray-100 pt-3">
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-900">মোট (PV)</span>
                    <span className="font-bold text-xl text-green-700">{cartTotalPvRequired} PV</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 text-right">
                    টাকায়: ৳{(cartTotal / 100).toLocaleString()}
                  </p>
                </div>
              ) : (
                <div className="border-t border-gray-100 pt-3 flex justify-between">
                  <span className="font-bold text-gray-900">মোট</span>
                  <span className="font-bold text-xl text-indigo-700">৳{(cartTotal / 100).toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* PV info */}
            {user && totalPvPoints > 0 && paymentMethod !== 'pv' && (
              <div className="mt-4 bg-green-50 rounded-xl p-3 border border-green-100">
                <p className="text-xs text-green-700 font-medium">
                  এই ক্রয়ে {totalPvPoints} PV যোগ হবে। বর্তমান: {user.monthly_pv_purchased || 0}/100 PV
                </p>
                {(user.monthly_pv_purchased || 0) + totalPvPoints >= 100 && (
                  <p className="text-xs text-green-600 font-bold mt-1">
                    আপনার আইডি স্বয়ংক্রিয়ভাবে রিএকটিভ হবে!
                  </p>
                )}
              </div>
            )}

            {/* User PV balance */}
            {user && (
              <div className="mt-3 bg-gray-50 rounded-xl p-3 border border-gray-100 flex justify-between items-center">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Star size={12} className="text-green-500" /> আপনার PV ব্যালেন্স
                </span>
                <span className="text-sm font-bold text-green-700">{userPvPoints} PV</span>
              </div>
            )}

            {/* Mobile payment pending note */}
            {paymentMethod === 'mobile' && (
              <div className="mt-3 bg-yellow-50 rounded-xl p-3 border border-yellow-100">
                <p className="text-xs text-yellow-700">
                  ⏳ মোবাইল পেমেন্ট Admin approve করার পরে নিশ্চিত হবে।
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}