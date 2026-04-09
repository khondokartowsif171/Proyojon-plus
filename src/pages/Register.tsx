import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { UserPlus, Package, Crown, Award, Eye, EyeOff, Smartphone, CreditCard, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1); // 1: form, 2: payment, 3: success
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    package_type: 'customer', referrer_id: searchParams.get('ref') || '',
  });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('bkash');
  const [trxId, setTrxId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [registeredUserId, setRegisteredUserId] = useState('');

  const packages = [
    { value: 'customer', label: 'কাস্টমার প্যাকেজ', points: '১,০০০ PV', price: '৳১,০০০', amount: 1000, icon: <Package size={20} />, color: 'from-blue-500 to-cyan-600' },
    { value: 'shareholder', label: 'শেয়ারহোল্ডার প্যাকেজ', points: '৫,০০০ PS', price: '৳৫,০০০', amount: 5000, icon: <Crown size={20} />, color: 'from-purple-500 to-pink-600' },
    { value: 'gold', label: 'গোল্ড প্যাকেজ', points: '৩৬,০০০ GP', price: '৳৩৬,০০০', amount: 36000, icon: <Award size={20} />, color: 'from-yellow-500 to-orange-600' },
  ];

  const selectedPkg = packages.find(p => p.value === form.package_type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('পাসওয়ার্ড মিলছে না'); return; }
    if (form.password.length < 4) { setError('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে'); return; }

    setLoading(true);
    const result = await register({
      name: form.name, email: form.email, phone: form.phone,
      password: form.password, package_type: form.package_type,
      referrer_id: form.referrer_id || undefined,
    });

    if (result.success) {
      setRegisteredUserId(result.userId || '');
      setStep(2); // Go to payment step
    } else {
      setError(result.error || 'রেজিস্ট্রেশন করতে সমস্যা হয়েছে');
    }
    setLoading(false);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trxId) { toast.error('TRX ID দিন'); return; }
    setLoading(true);

    await supabase.from('mlm_payment_verifications').insert({
      user_id: registeredUserId, amount: selectedPkg?.amount || 0,
      method: paymentMethod, trx_id: trxId, sender_number: senderNumber,
      purpose: 'package_purchase', package_type: form.package_type,
    });

    setStep(3);
    setLoading(false);
  };

  const mobilePaymentMethods = [
    { key: 'bkash', label: 'বিকাশ', color: '#E2136E', number: '01XXXXXXXXX', bgClass: 'from-pink-500 to-pink-600' },
    { key: 'nagad', label: 'নগদ', color: '#F6921E', number: '01XXXXXXXXX', bgClass: 'from-orange-400 to-orange-500' },
    { key: 'rocket', label: 'রকেট', color: '#8B2F8B', number: '01XXXXXXXXX', bgClass: 'from-purple-600 to-purple-700' },
  ];

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
              <p className="text-gray-500 mb-2">আপনার পেমেন্ট এডমিন কর্তৃক যাচাই করা হবে।</p>
              <p className="text-gray-500 text-sm mb-6">অনুমোদনের পর আপনার আইডি সক্রিয় হবে।</p>
              <Link to="/login" className="inline-block px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 shadow-lg">
                লগইন করুন
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Smartphone size={28} className="text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">পেমেন্ট করুন</h1>
                <p className="text-gray-500 text-sm mt-1">{selectedPkg?.label} - {selectedPkg?.price}</p>
              </div>

              {/* Payment Method Selection */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {mobilePaymentMethods.map(m => (
                  <button key={m.key} onClick={() => setPaymentMethod(m.key)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${paymentMethod === m.key ? 'shadow-lg' : 'border-gray-200'}`}
                    style={paymentMethod === m.key ? { borderColor: m.color, backgroundColor: m.color + '10' } : {}}>
                    <div className={`w-10 h-10 mx-auto mb-1.5 rounded-lg bg-gradient-to-br ${m.bgClass} flex items-center justify-center`}>
                      <span className="text-white font-bold text-xs">{m.label.charAt(0)}</span>
                    </div>
                    <p className="font-bold text-[10px]" style={{ color: m.color }}>{m.label}</p>
                  </button>
                ))}
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
                <p className="text-sm font-semibold text-gray-800 mb-2">পেমেন্ট নির্দেশনা:</p>
                <ol className="text-xs text-gray-600 space-y-1 list-decimal pl-4">
                  <li>{mobilePaymentMethods.find(m => m.key === paymentMethod)?.label} নম্বর: <span className="font-bold font-mono">{mobilePaymentMethods.find(m => m.key === paymentMethod)?.number}</span></li>
                  <li><span className="font-bold">{selectedPkg?.price}</span> পাঠান</li>
                  <li>TRX ID নিচে দিন</li>
                </ol>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">TRX ID *</label>
                  <input value={trxId} onChange={e => setTrxId(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none font-mono" placeholder="TXN123456789" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">সেন্ডার নম্বর</label>
                  <input value={senderNumber} onChange={e => setSenderNumber(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none" placeholder="০১XXXXXXXXX" />
                </div>
                <button type="submit" disabled={loading || !trxId}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg">
                  {loading ? 'প্রসেসিং...' : 'পেমেন্ট জমা দিন'}
                </button>
              </form>

              <button onClick={() => { setStep(3); }} className="w-full mt-3 text-xs text-gray-400 hover:text-gray-600 text-center">
                পরে পেমেন্ট করব
              </button>
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
      <div className="flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <UserPlus size={28} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">রেজিস্ট্রেশন</h1>
              <p className="text-gray-500 text-sm mt-2">নতুন একাউন্ট তৈরি করুন</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Package Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">প্যাকেজ নির্বাচন করুন</label>
                <div className="grid grid-cols-1 gap-3">
                  {packages.map(pkg => (
                    <button key={pkg.value} type="button" onClick={() => setForm({ ...form, package_type: pkg.value })}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${form.package_type === pkg.value ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className={`w-10 h-10 bg-gradient-to-br ${pkg.color} rounded-lg flex items-center justify-center text-white`}>{pkg.icon}</div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-900">{pkg.label}</p>
                        <p className="text-xs text-gray-500">{pkg.points} = {pkg.price}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${form.package_type === pkg.value ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'}`}>
                        {form.package_type === pkg.value && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">নাম</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm" placeholder="আপনার নাম" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">ফোন</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm" placeholder="০১XXXXXXXXX" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ইমেইল</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm" placeholder="your@email.com" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">পাসওয়ার্ড</label>
                  <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm" placeholder="পাসওয়ার্ড" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">পাসওয়ার্ড নিশ্চিত</label>
                  <input type={showPass ? 'text' : 'password'} value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm" placeholder="পুনরায় পাসওয়ার্ড" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">রেফারার আইডি (ঐচ্ছিক)</label>
                <input type="text" value={form.referrer_id} onChange={e => setForm({ ...form, referrer_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm" placeholder="রেফারার এর আইডি" />
              </div>

              {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100">{error}</div>}

              <button type="submit" disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/30">
                {loading ? 'রেজিস্ট্রেশন হচ্ছে...' : 'রেজিস্ট্রেশন করুন'}
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
