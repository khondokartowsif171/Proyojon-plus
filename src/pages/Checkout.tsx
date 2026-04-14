import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  ShoppingCart, Smartphone, CreditCard, Wallet, ChevronRight, CheckCircle,
  MapPin, User, Phone, ArrowLeft, Package, Loader2, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  addToClubPools,
  distributeGenerationBonus,
  processReferrerCommission,
  CUSTOMER_PV_TO_ACTIVATE,
  MONTHLY_PV_TO_RENEW,
} from '@/lib/mlm-business-logic';

interface CartItem {
  id: string;
  product_id: string;
  name: string;
  price: number;      // in taka (1 taka = 1 PV)
  pv_points: number;  // = price
  quantity: number;
  image?: string;
  variant_id?: string;
  variant_title?: string;
  sku?: string;
}

export default function Checkout() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'mobile' | 'balance' | 'cod'>('mobile');
  const [mobileMethod, setMobileMethod] = useState('bkash');
  const [trxId, setTrxId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'cart' | 'payment' | 'success'>('cart');
  const [orderId, setOrderId] = useState('');
  const [shippingInfo, setShippingInfo] = useState({
    name: '', phone: '', address: '', district: '', note: '',
  });

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadCart();
    setShippingInfo(prev => ({ ...prev, name: user.name || '', phone: user.phone || '' }));
  }, [user]);

  const loadCart = () => {
    try {
      const stored = localStorage.getItem('cart');
      if (stored) setCart(JSON.parse(stored));
    } catch { setCart([]); }
  };

  const totalPV      = cart.reduce((s, i) => s + (i.pv_points * i.quantity), 0);
  const totalTaka    = cart.reduce((s, i) => s + (i.price * i.quantity), 0);  // 1 PV = 1 ৳
  const totalItems   = cart.reduce((s, i) => s + i.quantity, 0);
  const canAfford    = (user?.current_balance || 0) >= totalTaka;

  const updateQty = (id: string, delta: number) => {
    setCart(prev => {
      const updated = prev.map(item =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item,
      );
      localStorage.setItem('cart', JSON.stringify(updated));
      return updated;
    });
  };

  const removeItem = (id: string) => {
    setCart(prev => {
      const updated = prev.filter(i => i.id !== id);
      localStorage.setItem('cart', JSON.stringify(updated));
      return updated;
    });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
  };

  // ── Helper: activate customer if enough PV ──────────────────────────────
  const tryActivateCustomer = async (userId: string, newMonthlyPv: number) => {
    if (!user) return;
    const isFirstActivation = !user.is_active && newMonthlyPv >= CUSTOMER_PV_TO_ACTIVATE;
    const isMonthlyRenew    = user.is_active && newMonthlyPv >= MONTHLY_PV_TO_RENEW;

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    if (isFirstActivation) {
      await supabase.from('mlm_users').update({
        is_active:            true,
        activated_at:         new Date().toISOString(),
        expires_at:           expiry.toISOString(),
        is_daily_club:        true,
        monthly_pv_purchased: newMonthlyPv,
      }).eq('id', userId);

      // ✅ Referral commission fires on first activation
      if (user.referrer_id) {
        await processReferrerCommission(userId, user.referrer_id, 'customer', CUSTOMER_PV_TO_ACTIVATE);
      }
      toast.success('🎉 আপনার আইডি সক্রিয় হয়েছে! রেফার কমিশন পাঠানো হয়েছে।');
    } else if (isMonthlyRenew) {
      await supabase.from('mlm_users').update({
        is_active:  true,
        expires_at: expiry.toISOString(),
        monthly_pv_purchased: newMonthlyPv,
      }).eq('id', userId);
      toast.success('✅ আইডি রিনিউ হয়েছে (৩০ দিন)!');
    } else {
      await supabase.from('mlm_users').update({ monthly_pv_purchased: newMonthlyPv }).eq('id', userId);
    }
  };

  // ── SUBMIT ORDER ───────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (!user) return;
    if (cart.length === 0) { toast.error('কার্ট খালি!'); return; }
    if (!shippingInfo.name || !shippingInfo.phone || !shippingInfo.address) {
      toast.error('ডেলিভারি তথ্য সম্পূর্ণ করুন'); return;
    }
    if (paymentMethod === 'mobile' && !trxId.trim()) {
      toast.error('TRX ID দিন'); return;
    }
    if (paymentMethod === 'balance' && !canAfford) {
      toast.error('পর্যাপ্ত ব্যালেন্স নেই'); return;
    }
    setLoading(true);

    try {
      // 1. Create order
      const { data: order, error: orderErr } = await supabase.from('ecom_orders').insert({
        user_id:          user.id,
        total:            totalTaka * 100, // stored in paisa
        subtotal:         totalTaka * 100,
        status:           paymentMethod === 'mobile' ? 'pending' : 'paid',
        payment_method:   paymentMethod,
        shipping_address: shippingInfo,
        notes:            shippingInfo.note || null,
      }).select().single();

      if (orderErr || !order) throw new Error(orderErr?.message || 'অর্ডার তৈরিতে সমস্যা');

      // 2. Save order items
      const orderItems = cart.map(item => ({
        order_id:      order.id,
        product_id:    item.product_id,
        variant_id:    item.variant_id || null,
        product_name:  item.name,
        variant_title: item.variant_title || null,
        sku:           item.sku || null,
        quantity:      item.quantity,
        unit_price:    item.price,
        total:         item.price * item.quantity,
        pv_points:     item.pv_points * item.quantity,
      }));
      await supabase.from('ecom_order_items').insert(orderItems);

      // ══════════════════════════════════════════════════════════════════════
      // CASE 1: MOBILE PAYMENT — Admin approval এর পরে PV দেবে
      // ══════════════════════════════════════════════════════════════════════
      if (paymentMethod === 'mobile') {
        await supabase.from('mlm_payment_verifications').insert({
          user_id:        user.id,
          amount:         totalTaka,
          method:         mobileMethod,
          trx_id:         trxId.trim(),
          sender_number:  senderNumber.trim() || null,
          purpose:        'product_purchase',
          pv_points:      totalPV,
          status:         'pending',
        });
        // PV দেওয়া হবে না এখন — admin approve করলে দেবে

        toast.success('✅ অর্ডার রাখা হয়েছে! Admin পেমেন্ট যাচাই করার পর PV যোগ হবে।');
        setOrderId(order.id);
        setStep('success');
        clearCart();
        await refreshUser();
        setLoading(false);
        return;
      }

      // ══════════════════════════════════════════════════════════════════════
      // CASE 2: BALANCE PAYMENT — সাথে সাথে PV দেয়
      // ══════════════════════════════════════════════════════════════════════
      if (paymentMethod === 'balance') {
        // Deduct balance
        const { data: freshUser } = await supabase.from('mlm_users')
          .select('current_balance, pv_points, monthly_pv_purchased, is_active, referrer_id, package_type')
          .eq('id', user.id).single();
        if (!freshUser) throw new Error('ইউজার ডেটা পাওয়া যায়নি');

        const newBalance   = (freshUser.current_balance || 0) - totalTaka;
        const newTotalPv   = (freshUser.pv_points || 0) + totalPV;
        const newMonthlyPv = (freshUser.monthly_pv_purchased || 0) + totalPV;

        await supabase.from('mlm_users').update({
          current_balance: newBalance,
          pv_points:       newTotalPv,
        }).eq('id', user.id);

        await supabase.from('mlm_transactions').insert({
          user_id:     user.id,
          type:        'product_purchase',
          amount:      -totalTaka,
          description: `পণ্য কেনা (ব্যালেন্স) — ${cart.map(i => i.name).join(', ')} — ${totalPV} PV`,
        });

        // PV log
        await supabase.from('mlm_pv_log').insert(cart.map(item => ({
          user_id:      user.id,
          amount:       item.pv_points * item.quantity,
          source:       'balance_purchase',
          product_name: item.name,
        })));

        // ✅ Club pools — PV sales থেকে
        if (totalPV > 0) await addToClubPools(totalPV);

        // ✅ Generation bonus — referrer থেকে শুরু, 5 level
        if (freshUser.referrer_id && totalPV > 0) {
          await distributeGenerationBonus(freshUser.referrer_id, totalPV, user.id, 1);
        }

        // ✅ Customer activation / renewal check
        if (freshUser.package_type === 'customer') {
          await tryActivateCustomer(user.id, newMonthlyPv);
        }

        toast.success(`✅ অর্ডার সম্পন্ন! ${totalPV} PV যোগ হয়েছে।`);
        setOrderId(order.id);
        setStep('success');
        clearCart();
        await refreshUser();
        setLoading(false);
        return;
      }

      // ══════════════════════════════════════════════════════════════════════
      // CASE 3: COD (Cash on Delivery) — pending, admin confirm করবে
      // ══════════════════════════════════════════════════════════════════════
      if (paymentMethod === 'cod') {
        toast.success('✅ অর্ডার নেওয়া হয়েছে! ডেলিভারির পর পেমেন্ট করুন।');
        setOrderId(order.id);
        setStep('success');
        clearCart();
        await refreshUser();
        setLoading(false);
        return;
      }

    } catch (err: any) {
      toast.error('সমস্যা হয়েছে: ' + err.message);
      setLoading(false);
    }
  };

  const mobilePaymentMethods = [
    { key: 'bkash',  label: 'বিকাশ', color: '#E2136E', number: '01XXXXXXXXX', bg: 'from-pink-500 to-pink-600' },
    { key: 'nagad',  label: 'নগদ',   color: '#F6921E', number: '01XXXXXXXXX', bg: 'from-orange-400 to-orange-500' },
    { key: 'rocket', label: 'রকেট',  color: '#8B2F8B', number: '01XXXXXXXXX', bg: 'from-purple-600 to-purple-700' },
  ];

  if (!user) return null;

  // ── Success screen ─────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-16 px-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-gray-100 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">অর্ডার সফল!</h1>
            <p className="text-gray-500 text-sm mb-4">অর্ডার ID: <span className="font-mono text-xs">{orderId.slice(0,8)}...</span></p>

            {paymentMethod === 'mobile' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-left">
                <p className="text-yellow-800 font-semibold text-sm mb-1">📋 পরবর্তী ধাপ:</p>
                <ul className="text-yellow-700 text-xs space-y-1">
                  <li>• Admin আপনার পেমেন্ট TRX যাচাই করবেন</li>
                  <li>• অনুমোদনের পর PV ও activation হবে</li>
                  <li>• সাধারণত ২৪ ঘন্টার মধ্যে সম্পন্ন হয়</li>
                </ul>
              </div>
            )}

            {paymentMethod === 'balance' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <p className="text-green-800 font-semibold text-sm">✅ {totalPV} PV সাথে সাথে যোগ হয়েছে!</p>
                {!user.is_active && totalPV >= CUSTOMER_PV_TO_ACTIVATE && (
                  <p className="text-green-700 text-xs mt-1">🎉 আপনার আইডি সক্রিয় হয়েছে!</p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3 mt-2">
              <Link to="/dashboard" className="block py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700">
                ড্যাশবোর্ডে যান
              </Link>
              <Link to="/shop" className="block py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200">
                আরও কেনাকাটা করুন
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-200">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">চেকআউট</h1>
          <span className="text-sm text-gray-500">({totalItems}টি পণ্য)</span>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">কার্ট খালি!</p>
            <Link to="/shop" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700">
              কেনাকাটা শুরু করুন
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: cart + shipping + payment */}
            <div className="lg:col-span-2 space-y-4">

              {/* Cart Items */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <ShoppingCart size={18} className="text-indigo-600" /> কার্ট আইটেম
                </h2>
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
                      <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                        {item.image
                          ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><Package size={20} className="text-gray-400" /></div>
                        }
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-800">{item.name}</p>
                        {item.variant_title && <p className="text-xs text-gray-400">{item.variant_title}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{item.pv_points * item.quantity} PV</span>
                          <span className="text-xs text-gray-500">= ৳{item.price * item.quantity}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-gray-100 rounded-lg">
                          <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-900 font-bold text-lg">−</button>
                          <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                          <button onClick={() => updateQty(item.id, +1)} className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-900 font-bold">+</button>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 text-xs p-1">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Info */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin size={18} className="text-indigo-600" /> ডেলিভারি তথ্য
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">নাম *</label>
                    <input value={shippingInfo.name} onChange={e => setShippingInfo({...shippingInfo,name:e.target.value})}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none" placeholder="সম্পূর্ণ নাম" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">ফোন *</label>
                    <input value={shippingInfo.phone} onChange={e => setShippingInfo({...shippingInfo,phone:e.target.value})}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none" placeholder="০১XXXXXXXXX" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">ঠিকানা *</label>
                    <input value={shippingInfo.address} onChange={e => setShippingInfo({...shippingInfo,address:e.target.value})}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none" placeholder="বিস্তারিত ঠিকানা" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">জেলা</label>
                    <input value={shippingInfo.district} onChange={e => setShippingInfo({...shippingInfo,district:e.target.value})}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none" placeholder="জেলার নাম" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">নোট (ঐচ্ছিক)</label>
                    <input value={shippingInfo.note} onChange={e => setShippingInfo({...shippingInfo,note:e.target.value})}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none" placeholder="বিশেষ নির্দেশনা" />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard size={18} className="text-indigo-600" /> পেমেন্ট পদ্ধতি
                </h2>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    {
                      key: 'mobile', label: 'মোবাইল পেমেন্ট', icon: <Smartphone size={20} />,
                      sub: 'বিকাশ / নগদ / রকেট', color: 'from-pink-500 to-orange-500',
                      note: 'Admin approve এর পর PV ও activation হবে',
                    },
                    {
                      key: 'balance', label: 'ব্যালেন্স',
                      icon: <Wallet size={20} />,
                      sub: `৳${(user.current_balance||0).toLocaleString()} উপলব্ধ`,
                      color: 'from-green-500 to-emerald-500',
                      note: 'সাথে সাথে PV যোগ হবে ও activation হবে',
                    },
                    {
                      key: 'cod', label: 'ক্যাশ অন ডেলিভারি', icon: <Package size={20} />,
                      sub: 'ডেলিভারিতে পেমেন্ট', color: 'from-blue-500 to-indigo-500',
                      note: 'PV ডেলিভারির পর Admin confirm করবেন',
                    },
                  ].map(pm => (
                    <button key={pm.key} type="button" onClick={() => setPaymentMethod(pm.key as any)}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all ${paymentMethod === pm.key ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${pm.color} flex items-center justify-center text-white mb-2`}>{pm.icon}</div>
                      <p className={`font-semibold text-xs mb-0.5 ${paymentMethod===pm.key?'text-indigo-700':'text-gray-800'}`}>{pm.label}</p>
                      <p className="text-[10px] text-gray-500">{pm.sub}</p>
                    </button>
                  ))}
                </div>

                {/* Payment note */}
                {paymentMethod === 'mobile' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800">
                    <p className="font-semibold mb-1">⚠️ মোবাইল পেমেন্ট নোট:</p>
                    <p>Admin পেমেন্ট verify করলে PV ও activation/renewal হবে। সাথে সাথে হবে না।</p>
                  </div>
                )}
                {paymentMethod === 'balance' && (
                  <div className={`rounded-xl p-3 text-xs border ${canAfford?'bg-green-50 border-green-200 text-green-800':'bg-red-50 border-red-200 text-red-800'}`}>
                    {canAfford
                      ? <p>✅ পেমেন্টের সাথে সাথে {totalPV} PV যোগ হবে এবং customer activation/renewal হবে।</p>
                      : <p>❌ আপনার ব্যালেন্স ৳{(user.current_balance||0).toLocaleString()}, প্রয়োজন ৳{totalTaka.toLocaleString()}। আরও ৳{(totalTaka-(user.current_balance||0)).toLocaleString()} প্রয়োজন।</p>
                    }
                  </div>
                )}
                {paymentMethod === 'cod' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
                    <p>ℹ️ পণ্য ডেলিভারির সময় ক্যাশ পেমেন্ট করুন। Admin confirm করলে PV যোগ হবে।</p>
                  </div>
                )}

                {/* Mobile payment form */}
                {paymentMethod === 'mobile' && (
                  <div className="mt-4">
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {mobilePaymentMethods.map(m => (
                        <button key={m.key} type="button" onClick={() => setMobileMethod(m.key)}
                          className={`p-2.5 rounded-xl border-2 text-center transition-all ${mobileMethod === m.key ? 'shadow-md' : 'border-gray-200'}`}
                          style={mobileMethod === m.key ? { borderColor: m.color, backgroundColor: m.color + '15' } : {}}>
                          <div className={`w-9 h-9 mx-auto mb-1 rounded-lg bg-gradient-to-br ${m.bg} flex items-center justify-center`}>
                            <span className="text-white font-bold text-xs">{m.label[0]}</span>
                          </div>
                          <p className="font-bold text-[11px]" style={{ color: m.color }}>{m.label}</p>
                          <p className="text-[9px] text-gray-400">{m.number}</p>
                        </button>
                      ))}
                    </div>
                    <div className="bg-indigo-50 rounded-xl p-3 mb-3 border border-indigo-100">
                      <p className="text-xs font-semibold text-indigo-800 mb-1">নির্দেশনা:</p>
                      <ol className="text-xs text-indigo-700 space-y-0.5 list-decimal pl-4">
                        <li>{mobilePaymentMethods.find(m=>m.key===mobileMethod)?.label} নম্বরে <span className="font-bold">৳{totalTaka}</span> পাঠান</li>
                        <li>TRX ID নিচে দিন এবং অর্ডার দিন</li>
                        <li>Admin verify করলে PV যোগ হবে</li>
                      </ol>
                    </div>
                    <div className="space-y-2">
                      <input value={trxId} onChange={e => setTrxId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:border-indigo-500 outline-none"
                        placeholder="TRX ID / Transaction ID *" />
                      <input value={senderNumber} onChange={e => setSenderNumber(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none"
                        placeholder="সেন্ডার নম্বর (ঐচ্ছিক)" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Summary */}
            <div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-4">
                <h2 className="font-bold text-gray-900 mb-4">অর্ডার সামারি</h2>
                <div className="space-y-2 mb-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600 flex-1">{item.name} × {item.quantity}</span>
                      <div className="text-right">
                        <span className="font-medium">৳{item.price * item.quantity}</span>
                        <span className="text-xs text-indigo-600 ml-1">({item.pv_points * item.quantity} PV)</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-100 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">মোট PV</span>
                    <span className="font-bold text-indigo-600">{totalPV} PV</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">সাবটোটাল</span>
                    <span className="font-medium">৳{totalTaka.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>ডেলিভারি</span>
                    <span className="font-bold">বিনামূল্যে</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t border-gray-100 pt-2">
                    <span>মোট</span>
                    <span className="text-indigo-700">৳{totalTaka.toLocaleString()}</span>
                  </div>
                </div>

                {/* Customer activation info */}
                {user.package_type === 'customer' && !user.is_active && (
                  <div className="mt-4 bg-blue-50 rounded-xl p-3 border border-blue-100">
                    <p className="text-xs font-semibold text-blue-800 mb-1">আইডি সক্রিয়করণ:</p>
                    <p className="text-xs text-blue-700">
                      {totalPV >= CUSTOMER_PV_TO_ACTIVATE
                        ? `✅ এই অর্ডারে ${totalPV} PV — আইডি সক্রিয় হবে!`
                        : `আরও ${CUSTOMER_PV_TO_ACTIVATE - (user.monthly_pv_purchased||0) - totalPV} PV প্রয়োজন`
                      }
                    </p>
                  </div>
                )}

                {user.package_type === 'customer' && user.is_active && (
                  <div className="mt-4 bg-green-50 rounded-xl p-3 border border-green-100">
                    <p className="text-xs font-semibold text-green-800 mb-1">মাসিক PV লক্ষ্যমাত্রা:</p>
                    <div className="w-full h-2 bg-green-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full"
                        style={{ width: `${Math.min(100, (((user.monthly_pv_purchased||0)+totalPV)/MONTHLY_PV_TO_RENEW)*100)}%` }} />
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                      {(user.monthly_pv_purchased||0)+totalPV}/{MONTHLY_PV_TO_RENEW} PV
                      {(user.monthly_pv_purchased||0)+totalPV >= MONTHLY_PV_TO_RENEW ? ' — রিনিউ হবে!' : ''}
                    </p>
                  </div>
                )}

                <button
                  onClick={handlePlaceOrder}
                  disabled={loading || (paymentMethod === 'balance' && !canAfford) || (paymentMethod === 'mobile' && !trxId.trim())}
                  className="w-full mt-4 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 shadow-lg flex items-center justify-center gap-2">
                  {loading ? (
                    <><Loader2 size={18} className="animate-spin" /> প্রসেসিং...</>
                  ) : (
                    <>অর্ডার দিন <ChevronRight size={18} /></>
                  )}
                </button>

                <p className="text-center text-xs text-gray-400 mt-3">
                  ১ PV = ১ টাকা | সকল অর্ডারে ফ্রি ডেলিভারি
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}