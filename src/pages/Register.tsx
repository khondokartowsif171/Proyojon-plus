import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  UserPlus, Package, Crown, Award,
  Smartphone, CheckCircle, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Package definitions ────────────────────────────────────────────────────
const PACKAGES = [
  {
    value: 'customer',
    label: 'কাস্টমার প্যাকেজ',
    points: '১,০০০ PV',
    price: '৳১,০০০',
    amount: 1000,
    icon: <Package size={20} />,
    color: 'from-blue-500 to-cyan-600',
    description: 'সাধারণ সদস্যপদ, ৩০ দিনের মেয়াদ',
  },
  {
    value: 'shareholder',
    label: 'শেয়ারহোল্ডার প্যাকেজ',
    points: '৫,০০০ SP',
    price: '৳৫,০০০',
    amount: 5000,
    icon: <Crown size={20} />,
    color: 'from-purple-500 to-pink-600',
    description: 'শেয়ারহোল্ডার ক্লাব সুবিধা সহ',
  },
  {
    value: 'gold',
    label: 'গোল্ড প্যাকেজ',
    points: '১,০০,০০০ GP',
    price: '৳১,০০,০০০',
    amount: 100000,
    icon: <Award size={20} />,
    color: 'from-yellow-500 to-orange-600',
    description: '৩৬৫ দিন, সকল ক্লাব সুবিধা সহ',
  },
];

const PAYMENT_METHODS = [
  {
    key: 'bkash',
    label: 'বিকাশ',
    color: '#E2136E',
    number: '01XXXXXXXXX',
    bgClass: 'from-pink-500 to-pink-600',
  },
  {
    key: 'nagad',
    label: 'নগদ',
    color: '#F6921E',
    number: '01XXXXXXXXX',
    bgClass: 'from-orange-400 to-orange-500',
  },
  {
    key: 'rocket',
    label: 'রকেট',
    color: '#8B2F8B',
    number: '01XXXXXXXXX',
    bgClass: 'from-purple-600 to-purple-700',
  },
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function Register() {
  const { register } = useAuth();
  const [searchParams] = useSearchParams();

  // step: 1 = form, 2 = payment, 3 = success
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    package_type: 'customer',
    referrer_id: searchParams.get('ref') || '',
  });

  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Payment step state
  const [paymentMethod, setPaymentMethod] = useState('bkash');
  const [trxId, setTrxId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');

  // Saved after step-1 registration
  const [registeredUserId, setRegisteredUserId] = useState('');

  const selectedPkg = PACKAGES.find(p => p.value === form.package_type)!;
  const selectedPayment = PAYMENT_METHODS.find(m => m.key === paymentMethod)!;

  // ── STEP 1: Register user (no payment yet) ──────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('পাসওয়ার্ড মিলছে না');
      return;
    }
    if (form.password.length < 4) {
      setError('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে');
      return;
    }

    setLoading(true);
    const result = await register({
      name: form.name,
      email: form.email,
      phone: form.phone,
      password: form.password,
      package_type: form.package_type,
      referrer_id: form.referrer_id || undefined,
    });

    if (result.success && result.userId) {
      // ✅ Save userId, then go to payment step (NOT step 3)
      setRegisteredUserId(result.userId);
      setStep(2);
    } else {
      setError(result.error || 'রেজিস্ট্রেশন করতে সমস্যা হয়েছে');
    }
    setLoading(false);
  };

  // ── STEP 2: Submit payment info ─────────────────────────────────────────
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trxId.trim()) {
      toast.error('TRX ID দিন');
      return;
    }
    if (!registeredUserId) {
      toast.error('ইউজার আইডি পাওয়া যায়নি, পুনরায় চেষ্টা করুন');
      return;
    }

    setLoading(true);
    try {
      const { error: pvError } = await supabase
        .from('mlm_payment_verifications')
        .insert({
          user_id: registeredUserId,
          amount: selectedPkg.amount,
          method: paymentMethod,
          trx_id: trxId.trim(),
          sender_number: senderNumber.trim() || null,
          // ✅ Consistent purpose naming: matches AdminDashboard handleApprovePayment
          purpose: `${form.package_type}_package`,
          status: 'pending',
        });

      if (pvError) throw pvError;

      setStep(3);
    } catch (err: any) {
      toast.error('পেমেন্ট জমা দিতে সমস্যা হয়েছে: ' + err.message);
    }
    setLoading(false);
  };

  // ── STEP 3: Success ─────────────────────────────────────────────────────
  if (step === 3) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-16 px-4">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">রেজিস্ট্রেশন সফল!</h1>
              <p className="text-gray-600 mb-2">আপনার পেমেন্ট এডমিন কর্তৃক যাচাই করা হবে।</p>
              <p className="text-gray-500 text-sm mb-2">
                প্যাকেজ: <span className="font-semibold">{selectedPkg.label}</span>
              </p>
              <p className="text-gray-500 text-sm mb-6">
                অনুমোদনের পর আপনার আইডি সক্রিয় হবে।
              </p>
              <Link
                to="/login"
                className="inline-block px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 shadow-lg transition-all"
              >
                লগইন করুন
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── STEP 2: Payment form ────────────────────────────────────────────────
  if (step === 2) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">

              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Smartphone size={28} className="text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">পেমেন্ট করুন</h1>
                <p className="text-gray-500 text-sm mt-1">
                  {selectedPkg.label} — {selectedPkg.price}
                </p>
              </div>

              {/* Method selector */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setPaymentMethod(m.key)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      paymentMethod === m.key
                        ? 'shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={
                      paymentMethod === m.key
                        ? { borderColor: m.color, backgroundColor: m.color + '15' }
                        : {}
                    }
                  >
                    <div
                      className={`w-10 h-10 mx-auto mb-1.5 rounded-lg bg-gradient-to-br ${m.bgClass} flex items-center justify-center`}
                    >
                      <span className="text-white font-bold text-xs">
                        {m.label.charAt(0)}
                      </span>
                    </div>
                    <p
                      className="font-bold text-[11px]"
                      style={{ color: m.color }}
                    >
                      {m.label}
                    </p>
                  </button>
                ))}
              </div>

              {/* Instructions */}
              <div className="bg-gray-50 rounded-xl p-4 mb-5 border border-gray-200">
                <p className="text-sm font-semibold text-gray-800 mb-2">
                  পেমেন্ট নির্দেশনা:
                </p>
                <ol className="text-xs text-gray-600 space-y-1.5 list-decimal pl-4">
                  <li>
                    {selectedPayment.label} নম্বরে পাঠান:{' '}
                    <span className="font-bold font-mono">
                      {selectedPayment.number}
                    </span>
                  </li>
                  <li>
                    পরিমাণ:{' '}
                    <span className="font-bold">{selectedPkg.price}</span>
                  </li>
                  <li>নিচে TRX ID ও সেন্ডার নম্বর দিন</li>
                  <li>জমা দেওয়ার পর এডমিন যাচাই করবেন</li>
                </ol>
              </div>

              {/* Payment form */}
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    TRX ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={trxId}
                    onChange={e => setTrxId(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-mono"
                    placeholder="TXN123456789"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    সেন্ডার নম্বর (ঐচ্ছিক)
                  </label>
                  <input
                    value={senderNumber}
                    onChange={e => setSenderNumber(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                    placeholder="০১XXXXXXXXX"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !trxId.trim()}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg"
                >
                  {loading ? 'প্রসেসিং...' : 'পেমেন্ট জমা দিন'}
                </button>
              </form>

              {/* Warning note */}
              <div className="mt-4 flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                <AlertCircle size={14} className="text-yellow-600 mt-0.5 shrink-0" />
                <p className="text-xs text-yellow-700">
                  পেমেন্ট না করলে আইডি সক্রিয় হবে না। পরে লগইন করে পেমেন্ট করা যাবে।
                </p>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── STEP 1: Registration form ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">

            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <UserPlus size={28} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">রেজিস্ট্রেশন</h1>
              <p className="text-gray-500 text-sm mt-2">নতুন একাউন্ট তৈরি করুন</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Package selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  প্যাকেজ নির্বাচন করুন
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {PACKAGES.map(pkg => (
                    <button
                      key={pkg.value}
                      type="button"
                      onClick={() => setForm({ ...form, package_type: pkg.value })}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                        form.package_type === pkg.value
                          ? 'border-indigo-500 bg-indigo-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 bg-gradient-to-br ${pkg.color} rounded-lg flex items-center justify-center text-white shrink-0`}
                      >
                        {pkg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900">
                          {pkg.label}
                        </p>
                        <p className="text-xs text-gray-500">
                          {pkg.points} = {pkg.price}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {pkg.description}
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          form.package_type === pkg.value
                            ? 'border-indigo-500 bg-indigo-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {form.package_type === pkg.value && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    নাম <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
                    placeholder="আপনার নাম"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    ফোন <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
                    placeholder="০১XXXXXXXXX"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  ইমেইল <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
                  placeholder="your@email.com"
                />
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    পাসওয়ার্ড <span className="text-red-500">*</span>
                  </label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
                    placeholder="পাসওয়ার্ড"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    নিশ্চিত করুন <span className="text-red-500">*</span>
                  </label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={e =>
                      setForm({ ...form, confirmPassword: e.target.value })
                    }
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
                    placeholder="পুনরায় পাসওয়ার্ড"
                  />
                </div>
              </div>

              {/* Show password toggle */}
              <label className="flex items-center gap-2 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={showPass}
                  onChange={e => setShowPass(e.target.checked)}
                  className="rounded"
                />
                <span className="text-xs text-gray-500">পাসওয়ার্ড দেখুন</span>
              </label>

              {/* Referrer ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  রেফারার আইডি (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={form.referrer_id}
                  onChange={e =>
                    setForm({ ...form, referrer_id: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
                  placeholder="রেফারার এর আইডি"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100 flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/30"
              >
                {loading ? 'রেজিস্ট্রেশন হচ্ছে...' : 'পরবর্তী → পেমেন্ট'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                আগেই একাউন্ট আছে?{' '}
                <Link
                  to="/login"
                  className="text-indigo-600 font-semibold hover:text-indigo-700"
                >
                  লগইন করুন
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}