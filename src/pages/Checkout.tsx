import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  ShoppingCart, Smartphone, CreditCard, Wallet, ChevronRight, CheckCircle,
  MapPin, ArrowLeft, Package, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  addToClubPools,
  distributeGenerationBonus,
  processReferrerCommission,
  CUSTOMER_PV_TO_ACTIVATE,
  MONTHLY_PV_TO_RENEW,
} from '@/lib/mlm-business-logic';

export default function Checkout() {
  const { user, refreshUser } = useAuth();
  const { cart, cartTotal, totalPvPoints, clearCart } = useCart();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<'mobile' | 'balance' | 'cod'>('mobile');
  const [mobileMethod, setMobileMethod] = useState('bkash');
  const [trxId, setTrxId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderDone, setOrderDone] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [shippingInfo, setShippingInfo] = useState({
    name: '', phone: '', address: '', district: '', note: '',
  });

  // ✅ cartTotal is in paisa → convert to taka
  const totalTaka = Math.round(cartTotal / 100);
  const totalPV   = totalPvPoints;
  const canAfford = (user?.current_balance || 0) >= totalTaka;

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    setShippingInfo(prev => ({ ...prev, name: user.name || '', phone: user.phone || '' }));
  }, [user]);

  // ── Customer activation ────────────────────────────────────────────────────
  const tryActivateCustomer = async (
    userId: string,
    newMonthlyPv: number,
    freshIsActive: boolean,
    freshReferrerId: string | null,
  ) => {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    if (!freshIsActive && newMonthlyPv >= CUSTOMER_PV_TO_ACTIVATE) {
      await supabase.from('mlm_users').update({
        is_active: true, activated_at: new Date().toISOString(),
        expires_at: expiry.toISOString(), is_daily_club: true,
        monthly_pv_purchased: newMonthlyPv,
      }).eq('id', userId);
      toast.success('🎉 আইডি সক্রিয় হয়েছে!');
    } else if (freshIsActive && newMonthlyPv >= MONTHLY_PV_TO_RENEW) {
      await supabase.from('mlm_users').update({
        is_active: true, expires_at: expiry.toISOString(),
        monthly_pv_purchased: newMonthlyPv,
      }).eq('id', userId);
      toast.success('✅ আইডি রিনিউ হয়েছে (৩০ দিন)!');
    } else {
      await supabase.from('mlm_users').update({ monthly_pv_purchased: newMonthlyPv }).eq('id', userId);
    }
  };

  // ── Place order ────────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (!user) return;
    if (cart.length === 0) { toast.error('কার্ট খালি!'); return; }
    if (!shippingInfo.name || !shippingInfo.phone || !shippingInfo.address) { toast.error('ডেলিভারি তথ্য পূরণ করুন'); return; }
    if (paymentMethod === 'mobile' && !trxId.trim()) { toast.error('TRX ID দিন'); return; }
    if (paymentMethod === 'balance' && !canAfford)   { toast.error('পর্যাপ্ত ব্যালেন্স নেই'); return; }

    setLoading(true);
    try {
      // 1. Create order (store as paisa)
      const { data: order, error: oErr } = await supabase.from('ecom_orders').insert({
        user_id:          user.id,
        total:            cartTotal,   // paisa
        subtotal:         cartTotal,
        status:           paymentMethod === 'balance' ? 'paid' : 'pending',
        payment_method:   paymentMethod,
        shipping_address: shippingInfo,
        notes:            shippingInfo.note || null,
      }).select().single();
      if (oErr || !order) throw new Error(oErr?.message || 'অর্ডার তৈরিতে সমস্যা');

      // 2. Order items
      await supabase.from('ecom_order_items').insert(
        cart.map(item => ({
          order_id:      order.id,
          product_id:    item.product_id,
          variant_id:    item.variant_id || null,
          product_name:  item.name,
          variant_title: item.variant_title || null,
          sku:           item.sku || null,
          quantity:      item.quantity,
          unit_price:    item.price,
          total:         item.price * item.quantity,
          pv_points:     (item.pv_points || 0) * item.quantity,
        }))
      );

      // ══ MOBILE: Admin approve এর পর PV ══
      if (paymentMethod === 'mobile') {
        await supabase.from('mlm_payment_verifications').insert({
          user_id: user.id, amount: totalTaka, method: mobileMethod,
          trx_id: trxId.trim(), sender_number: senderNumber.trim() || null,
          purpose: 'product_purchase', pv_points: totalPV, status: 'pending',
        });
        toast.success('✅ অর্ডার হয়েছে! Admin verify করলে PV যোগ হবে।');
        setOrderId(order.id); setOrderDone(true); clearCart();
        await refreshUser(); setLoading(false); return;
      }

      // ══ BALANCE: সাথে সাথে PV ══
      if (paymentMethod === 'balance') {
        const { data: fresh } = await supabase.from('mlm_users')
          .select('current_balance, pv_points, monthly_pv_purchased, is_active, referrer_id, package_type')
          .eq('id', user.id).single();
        if (!fresh) throw new Error('ইউজার ডেটা পাওয়া যায়নি');

        await supabase.from('mlm_users').update({
          current_balance: (fresh.current_balance || 0) - totalTaka,
          pv_points:       (fresh.pv_points || 0) + totalPV,
        }).eq('id', user.id);

        await supabase.from('mlm_transactions').insert({
          user_id: user.id, type: 'product_purchase', amount: -totalTaka,
          description: `পণ্য কেনা (ব্যালেন্স) — ${totalPV} PV`,
        });
        await supabase.from('mlm_pv_log').insert(
          cart.map(item => ({
            user_id: user.id, amount: (item.pv_points || 0) * item.quantity,
            source: 'balance_purchase', product_name: item.name,
          }))
        );

        if (totalPV > 0) await addToClubPools(totalPV);
        if (fresh.referrer_id && totalPV > 0) {
          // ৫% রেফার কমিশন — প্রতিটি PV কেনায়
          await processReferrerCommission(user.id, fresh.referrer_id, 'customer', totalPV);
          // ১% জেনারেশন বোনাস — ৫ লেভেল
          await distributeGenerationBonus(fresh.referrer_id, totalPV, user.id, 1);
        }
        if (fresh.package_type === 'customer') {
          await tryActivateCustomer(user.id, (fresh.monthly_pv_purchased || 0) + totalPV, fresh.is_active, fresh.referrer_id);
        }

        toast.success(`✅ অর্ডার সম্পন্ন! ${totalPV} PV যোগ হয়েছে।`);
        setOrderId(order.id); setOrderDone(true); clearCart();
        await refreshUser(); setLoading(false); return;
      }

      // ══ COD ══
      toast.success('✅ অর্ডার নেওয়া হয়েছে! ডেলিভারির সময় পেমেন্ট করুন।');
      setOrderId(order.id); setOrderDone(true); clearCart();
      setLoading(false);

    } catch (err: any) {
      toast.error('সমস্যা: ' + err.message);
      setLoading(false);
    }
  };

  const mobilePaymentMethods = [
    { key: 'bkash',  label: 'বিকাশ', color: '#E2136E', number: '01XXXXXXXXX', bg: 'from-pink-500 to-pink-600' },
    { key: 'nagad',  label: 'নগদ',   color: '#F6921E', number: '01XXXXXXXXX', bg: 'from-orange-400 to-orange-500' },
    { key: 'rocket', label: 'রকেট',  color: '#8B2F8B', number: '01XXXXXXXXX', bg: 'from-purple-600 to-purple-700' },
  ];

  if (!user) return null;

  // ── Success ────────────────────────────────────────────────────────────────
  if (orderDone) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-16 px-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-gray-100 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">অর্ডার সফল!</h1>
            <p className="text-gray-400 text-xs mb-6 font-mono">#{orderId.slice(0, 8).toUpperCase()}</p>
            {paymentMethod === 'mobile' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-5 text-left">
                <p className="text-yellow-800 font-semibold text-sm mb-1">⏳ পরবর্তী ধাপ:</p>
                <p className="text-yellow-700 text-xs">Admin পেমেন্ট TRX verify করলে {totalPV} PV ও activation হবে।</p>
              </div>
            )}
            {paymentMethod === 'balance' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5">
                <p className="text-green-800 font-semibold text-sm">✅ {totalPV} PV সাথে সাথে যোগ হয়েছে!</p>
              </div>
            )}
            {paymentMethod === 'cod' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
                <p className="text-blue-800 font-semibold text-sm">📦 ডেলিভারির সময় পেমেন্ট করুন।</p>
              </div>
            )}
            <div className="flex flex-col gap-3">
              <Link to="/dashboard" className="py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:opacity-90">ড্যাশবোর্ডে যান</Link>
              <Link to="/shop" className="py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200">আরও কেনাকাটা</Link>
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
          <h1 className="text-xl font-bold text-gray-900">চেকআউট ({cart.length}টি পণ্য)</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left */}
          <div className="lg:col-span-2 space-y-4">

            {/* Cart items */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ShoppingCart size={18} className="text-indigo-600" /> অর্ডার আইটেম
              </h2>
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.product_id + (item.variant_id || '')} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      {item.image
                        ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Package size={16} className="text-gray-400" /></div>
                      }
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-800">{item.name}</p>
                      {item.variant_title && <p className="text-xs text-gray-400">{item.variant_title}</p>}
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-medium">
                          {(item.pv_points || 0) * item.quantity} PV
                        </span>
                        <span className="text-xs text-gray-400">× {item.quantity}</span>
                      </div>
                    </div>
                    <span className="font-bold text-sm">৳{((item.price * item.quantity) / 100).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin size={18} className="text-indigo-600" /> ডেলিভারি তথ্য
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">নাম *</label>
                  <input value={shippingInfo.name} onChange={e => setShippingInfo({...shippingInfo, name: e.target.value})}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none" placeholder="সম্পূর্ণ নাম" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">ফোন *</label>
                  <input value={shippingInfo.phone} onChange={e => setShippingInfo({...shippingInfo, phone: e.target.value})}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none" placeholder="০১XXXXXXXXX" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">ঠিকানা *</label>
                  <input value={shippingInfo.address} onChange={e => setShippingInfo({...shippingInfo, address: e.target.value})}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none" placeholder="বিস্তারিত ঠিকানা" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">জেলা</label>
                  <input value={shippingInfo.district} onChange={e => setShippingInfo({...shippingInfo, district: e.target.value})}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none" placeholder="জেলার নাম" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">নোট</label>
                  <input value={shippingInfo.note} onChange={e => setShippingInfo({...shippingInfo, note: e.target.value})}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none" placeholder="বিশেষ নির্দেশনা" />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard size={18} className="text-indigo-600" /> পেমেন্ট পদ্ধতি
              </h2>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { key: 'mobile',  label: 'মোবাইল',    icon: <Smartphone size={18} />, sub: 'বিকাশ/নগদ/রকেট',                          color: 'from-pink-500 to-orange-400' },
                  { key: 'balance', label: 'ব্যালেন্স', icon: <Wallet size={18} />,     sub: `৳${(user.current_balance||0).toLocaleString()} আছে`, color: 'from-green-500 to-emerald-500' },
                  { key: 'cod',     label: 'COD',        icon: <Package size={18} />,    sub: 'ডেলিভারিতে',                              color: 'from-blue-500 to-indigo-500' },
                ].map(pm => (
                  <button key={pm.key} type="button" onClick={() => setPaymentMethod(pm.key as any)}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all ${paymentMethod === pm.key ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${pm.color} flex items-center justify-center text-white mb-2`}>{pm.icon}</div>
                    <p className={`font-semibold text-xs mb-0.5 ${paymentMethod===pm.key?'text-indigo-700':'text-gray-800'}`}>{pm.label}</p>
                    <p className="text-[10px] text-gray-400">{pm.sub}</p>
                  </button>
                ))}
              </div>

              {paymentMethod === 'mobile' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800 mb-3">
                  ⚠️ Admin verify করলে {totalPV} PV যোগ হবে।
                </div>
              )}
              {paymentMethod === 'balance' && (
                <div className={`rounded-xl p-3 text-xs border mb-3 ${canAfford?'bg-green-50 border-green-200 text-green-800':'bg-red-50 border-red-200 text-red-800'}`}>
                  {canAfford ? `✅ সাথে সাথে ${totalPV} PV যোগ হবে।` : `❌ ব্যালেন্স কম। প্রয়োজন ৳${totalTaka}`}
                </div>
              )}

              {paymentMethod === 'mobile' && (
                <div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {mobilePaymentMethods.map(m => (
                      <button key={m.key} type="button" onClick={() => setMobileMethod(m.key)}
                        className={`p-2.5 rounded-xl border-2 text-center transition-all ${mobileMethod===m.key?'shadow-md':'border-gray-200'}`}
                        style={mobileMethod===m.key?{borderColor:m.color,backgroundColor:m.color+'18'}:{}}>
                        <div className={`w-9 h-9 mx-auto mb-1 rounded-lg bg-gradient-to-br ${m.bg} flex items-center justify-center`}>
                          <span className="text-white font-bold text-xs">{m.label[0]}</span>
                        </div>
                        <p className="font-bold text-[11px]" style={{color:m.color}}>{m.label}</p>
                        <p className="text-[9px] text-gray-400">{m.number}</p>
                      </button>
                    ))}
                  </div>
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 mb-3 text-xs text-indigo-700">
                    <ol className="list-decimal pl-4 space-y-0.5">
                      <li>{mobilePaymentMethods.find(m=>m.key===mobileMethod)?.label} নম্বরে <strong>৳{totalTaka.toLocaleString()}</strong> পাঠান</li>
                      <li>TRX ID নিচে দিন এবং অর্ডার দিন</li>
                    </ol>
                  </div>
                  <div className="space-y-2">
                    <input value={trxId} onChange={e=>setTrxId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:border-indigo-500 outline-none"
                      placeholder="TRX ID *" />
                    <input value={senderNumber} onChange={e=>setSenderNumber(e.target.value)}
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
              <h2 className="font-bold text-gray-900 mb-4">অর্ডার সারাংশ</h2>
              <div className="space-y-1.5 mb-4">
                {cart.map(item => (
                  <div key={item.product_id+(item.variant_id||'')} className="flex justify-between text-xs text-gray-600">
                    <span className="flex-1 truncate">{item.name} ×{item.quantity}</span>
                    <span className="font-medium ml-2">৳{((item.price*item.quantity)/100).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">মোট PV</span>
                  <span className="font-bold text-indigo-600">{totalPV} PV</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>ডেলিভারি</span>
                  <span className="font-bold">ফ্রি</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t border-gray-100 pt-2">
                  <span>মোট</span>
                  <span className="text-indigo-700">৳{totalTaka.toLocaleString()}</span>
                </div>
              </div>

              {user.package_type === 'customer' && !user.is_active && totalPV > 0 && (
                <div className="mt-3 bg-blue-50 rounded-xl p-3 border border-blue-100 text-xs text-blue-700 font-medium">
                  {(user.monthly_pv_purchased||0)+totalPV >= CUSTOMER_PV_TO_ACTIVATE
                    ? '🎉 এই অর্ডারে আইডি সক্রিয় হবে!'
                    : `আরও ${CUSTOMER_PV_TO_ACTIVATE-(user.monthly_pv_purchased||0)-totalPV} PV দরকার`
                  }
                </div>
              )}

              <button onClick={handlePlaceOrder}
                disabled={loading||(paymentMethod==='balance'&&!canAfford)||(paymentMethod==='mobile'&&!trxId.trim())}
                className="w-full mt-4 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 shadow-lg flex items-center justify-center gap-2">
                {loading
                  ? <><Loader2 size={18} className="animate-spin" /> প্রসেসিং...</>
                  : <>অর্ডার দিন <ChevronRight size={18} /></>
                }
              </button>
              <p className="text-center text-xs text-gray-400 mt-2">ফ্রি ডেলিভারি | ১ PV = ১ টাকা</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}