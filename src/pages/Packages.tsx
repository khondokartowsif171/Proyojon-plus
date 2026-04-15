import React from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ShoppingBag, Crown, Award, Check, Users, Gift, Shield, Star, Zap, TrendingUp, ChevronRight, X } from 'lucide-react';

const packages = [
  {
    name: 'কাস্টমার প্যাকেজ',
    priceDisplay: null,
    pvLabel: '১,০০০ PV এর পণ্য কিনুন',
    pvSub: '',
    points: '১,০০০ PV',
    type: 'customer',
    icon: <ShoppingBag size={32} />,
    color: 'from-blue-500 to-cyan-600',
    shadow: 'shadow-blue-200',
    popular: false,
    features: [
      { text: '৫% রেফার কমিশন — আইডি সক্রিয় হলেই সাথে সাথে (৳৫০)', ok: true },
      { text: '১% জেনারেশন বোনাস (৫ লেভেল) — PV sales এ', ok: true },
      { text: 'ডেইলি ক্লাব বোনাস (PV এর ৩০%)', ok: true },
      { text: 'উইকলি ক্লাব (১৫ ডিরেক্ট রেফারে)', ok: true },
      { text: 'ইনসুরেন্স + পেনশন ক্লাব (১৫ রেফারি weekly হলে)', ok: true },
      { text: '৩০ দিনের মেয়াদ — মাসে ১০০ PV কিনলে রিনিউ', ok: true },
      { text: 'শেয়ারহোল্ডার ক্লাব নেই', ok: false },
    ],
    btnLabel: 'বিনামূল্যে শুরু করুন',
  },
  {
    name: 'শেয়ারহোল্ডার প্যাকেজ',
    priceDisplay: '৳৫,০০০',
    pvLabel: '৫,০০০ SP',
    pvSub: '',
    points: '৫,০০০ SP',
    type: 'shareholder',
    icon: <Crown size={32} />,
    color: 'from-purple-500 to-pink-600',
    shadow: 'shadow-purple-200',
    popular: true,
    features: [
      { text: '২.৫% রেফার কমিশন — আইডি সক্রিয় হলেই সাথে সাথে (৳১২৫)', ok: true },
      { text: 'শেয়ারহোল্ডার ক্লাব সদস্যপদ (PV এর ১০%)', ok: true },
      { text: '১% জেনারেশন বোনাস (৫ লেভেল) — PV sales এ', ok: true },
      { text: 'কোনো PV নেই — শুধু Shareholder club income', ok: true },
      { text: 'ডেইলি/উইকলি ক্লাব নেই', ok: false },
    ],
    btnLabel: 'এখনই জয়েন করুন',
  },
  {
    name: 'গোল্ড প্যাকেজ',
    priceDisplay: '৳১,০০,০০০',
    pvLabel: '১,০০,০০০ GP',
    pvSub: '',
    points: '১,০০,০০০ GP',
    type: 'gold',
    icon: <Award size={32} />,
    color: 'from-yellow-500 to-orange-600',
    shadow: 'shadow-yellow-200',
    popular: false,
    features: [
      { text: 'রেফারার পায় ৳১,৮০০ — ৩৬৫ দিনে (৳৪.৯৩/দিন)', ok: true },
      { text: 'বায়ারের বকেয়া জমে ৳৩৬,০০০ (৳৯৮.৬৩/দিন)', ok: true },
      { text: '১% জেনারেশন বোনাস (৫ লেভেল) — PV sales এ', ok: true },
      { text: '৩৬৫ দিনের কাউন্টডাউন টাইমার', ok: true },
      { text: 'কোনো ক্লাব নেই — শুধু active ID', ok: false },
    ],
    btnLabel: 'এখনই জয়েন করুন',
  },
];

const commissionRows = [
  { label: 'জয়েনিং', customer: '১,০০০ PV পণ্য কিনুন', shareholder: '৳৫,০০০', gold: '৳১,০০,০০০' },
  { label: 'পয়েন্ট', customer: '১,০০০ PV', shareholder: '৫,০০০ SP', gold: '১,০০,০০০ GP' },
  { label: 'রেফার কমিশন', customer: '৫% = ৳৫০', shareholder: '২.৫% = ৳১২৫', gold: '৳১,৮০০ / ৩৬৫ দিন' },
  { label: 'জেনারেশন বোনাস', customer: 'PV এর ১% × ৫', shareholder: 'PV এর ১% × ৫', gold: 'PV এর ১% × ৫' },
  { label: 'ডেইলি ক্লাব (৩০%)', customer: '✓', shareholder: '✗', gold: '✗' },
  { label: 'উইকলি ক্লাব (২.৫%)', customer: '১৫ রেফারে', shareholder: '✗', gold: '✗' },
  { label: 'ইনসুরেন্স ক্লাব (১.২৫%)', customer: '১৫ weekly refs', shareholder: '✗', gold: '✗' },
  { label: 'পেনশন ক্লাব (১.২৫%)', customer: '১৫ weekly refs', shareholder: '✗', gold: '✗' },
  { label: 'শেয়ারহোল্ডার ক্লাব (১০%)', customer: '✗', shareholder: '✓', gold: '✗' },
  { label: 'মেয়াদ', customer: '৩০ দিন', shareholder: 'আজীবন', gold: '৩৬৫ দিন' },
  { label: 'রিনিউ শর্ত', customer: 'মাসে ১০০ PV', shareholder: 'রিনিউ লাগে না', gold: 'N/A' },
];

const clubInfo = [
  {
    icon: <Gift size={22} />,
    name: 'ডেইলি ক্লাব',
    pct: '৩০%',
    desc: 'প্রতিটি PV product sale এর ৩০% সকল active customer এর মধ্যে সমানভাবে বিতরণ।',
    color: 'from-blue-500 to-cyan-500',
    who: 'সকল active customer',
    badge: 'Customer only',
  },
  {
    icon: <Star size={22} />,
    name: 'উইকলি ক্লাব',
    pct: '২.৫%',
    desc: '১৫+ ডিরেক্ট customer রেফার করলে এই ক্লাবের সদস্য হওয়া যায়।',
    color: 'from-green-500 to-emerald-500',
    who: '১৫ ডিরেক্ট রেফার',
    badge: 'Customer',
  },
  {
    icon: <Shield size={22} />,
    name: 'ইনসুরেন্স ক্লাব',
    pct: '১.২৫%',
    desc: 'আপনার রেফার করা ১৫ জন weekly club সদস্য হলে আপনি এই ক্লাবে যোগ দিতে পারবেন।',
    color: 'from-purple-500 to-pink-500',
    who: '১৫ রেফারি weekly হলে',
    badge: 'Customer',
  },
  {
    icon: <TrendingUp size={22} />,
    name: 'পেনশন ক্লাব',
    pct: '১.২৫%',
    desc: 'ইনসুরেন্স ক্লাবের মতো একই শর্ত — দুটো একসাথে পাওয়া যায়।',
    color: 'from-orange-500 to-red-500',
    who: '১৫ রেফারি weekly হলে',
    badge: 'Customer',
  },
  {
    icon: <Crown size={22} />,
    name: 'শেয়ারহোল্ডার ক্লাব',
    pct: '১০%',
    desc: 'শুধুমাত্র Shareholder package holders এই ক্লাবের সদস্য এবং PV এর ১০% পান।',
    color: 'from-yellow-500 to-orange-500',
    who: 'Shareholder package only',
    badge: 'Shareholder only',
  },
];

export default function Packages() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 py-20 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-80 h-80 bg-yellow-400 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-pink-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="relative max-w-3xl mx-auto">
          <span className="inline-block px-4 py-1.5 bg-white/10 border border-white/20 text-white text-xs font-semibold rounded-full mb-5 tracking-wider uppercase">
            জয়েনিং প্যাকেজ সমূহ
          </span>
          <h1 className="text-3xl lg:text-5xl font-extrabold text-white mb-4 leading-tight">
            আপনার বাজেট অনুযায়ী<br />
            <span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
              প্যাকেজ বেছে নিন
            </span>
          </h1>
          <p className="text-gray-300 text-lg max-w-xl mx-auto">
            তিনটি প্যাকেজ থেকে আপনার সামর্থ্য ও লক্ষ্য অনুযায়ী প্যাকেজ নির্বাচন করুন।
          </p>
          {/* Quick stats */}
          <div className="flex items-center justify-center gap-8 mt-10 flex-wrap">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-400">৫%</p>
              <p className="text-xs text-gray-400 mt-1">Customer রেফার</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-400">২.৫%</p>
              <p className="text-xs text-gray-400 mt-1">Shareholder রেফার</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-400">৳১,৮০০</p>
              <p className="text-xs text-gray-400 mt-1">Gold রেফার ইনকাম</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-400">৫ লেভেল</p>
              <p className="text-xs text-gray-400 mt-1">Generation বোনাস</p>
            </div>
          </div>
        </div>
      </section>

      {/* Package Cards */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 items-start">
          {packages.map((pkg) => (
            <div key={pkg.type}
              className={`relative bg-white rounded-3xl border-2 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl
                ${pkg.popular
                  ? `border-purple-400 shadow-2xl ${pkg.shadow} md:scale-105`
                  : 'border-gray-100 shadow-lg'}`}>

              {pkg.popular && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
              )}
              {pkg.popular && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold px-3 py-1 rounded-full">
                  ★ সবচেয়ে জনপ্রিয়
                </div>
              )}

              <div className="p-7">
                {/* Icon */}
                <div className={`w-14 h-14 bg-gradient-to-br ${pkg.color} rounded-2xl flex items-center justify-center text-white mb-5 shadow-lg`}>
                  {pkg.icon}
                </div>

                {/* Name */}
                <h3 className="text-xl font-bold text-gray-900 mb-1">{pkg.name}</h3>
                {pkg.pvSub && <p className="text-xs text-gray-400 mb-4">{pkg.pvSub}</p>}

                {/* ✅ Customer: no cash price */}
                {pkg.priceDisplay ? (
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-4xl font-extrabold text-gray-900">{pkg.priceDisplay}</span>
                    </div>
                    <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r ${pkg.color} text-white`}>
                      {pkg.points}
                    </span>
                  </div>
                ) : (
                  <div className="mb-4">
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 mb-2">
                      <p className="text-blue-800 font-bold text-base">{pkg.pvLabel}</p>
                      <p className="text-blue-600 text-xs mt-1">পণ্য কিনলেই আইডি সক্রিয় — কোনো নগদ নয়!</p>
                    </div>
                    <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r ${pkg.color} text-white`}>
                      {pkg.points}
                    </span>
                  </div>
                )}

                {/* Features */}
                <ul className="space-y-2.5 mb-7">
                  {pkg.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <div className={`mt-0.5 w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center
                        ${f.ok ? `bg-gradient-to-br ${pkg.color}` : 'bg-gray-100'}`}>
                        {f.ok
                          ? <Check size={11} className="text-white" strokeWidth={3} />
                          : <X size={11} className="text-gray-400" strokeWidth={3} />
                        }
                      </div>
                      <span className={f.ok ? 'text-gray-700' : 'text-gray-400'}>{f.text}</span>
                    </li>
                  ))}
                </ul>

                <Link to="/register"
                  className={`block text-center py-3.5 rounded-xl font-bold text-white bg-gradient-to-r ${pkg.color} hover:opacity-90 transition-all shadow-lg`}>
                  {pkg.btnLabel}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Customer note */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-5 flex gap-4 items-start">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <ShoppingBag size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="font-bold text-blue-800 mb-1">কাস্টমার প্যাকেজ সম্পর্কে বিস্তারিত</p>
            <p className="text-sm text-blue-700">
              কাস্টমার প্যাকেজে রেজিস্ট্রেশন <strong>বিনামূল্যে</strong>। শপ থেকে ১,০০০ PV মূল্যের পণ্য কিনলেই আইডি স্বয়ংক্রিয়ভাবে সক্রিয় হবে।
              মাসে মাসে ১০০ PV এর পণ্য কিনলে আইডি রিনিউ হবে (৩০ দিন)। <strong>১ PV = ১ টাকা</strong> মূল্যের পণ্য।
            </p>
          </div>
        </div>
      </section>

      {/* Commission Comparison Table */}
      <section className="py-12 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full mb-3">তুলনামূলক বিশ্লেষণ</span>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">কমিশন স্ট্রাকচার</h2>
          <p className="text-gray-500">প্রতিটি প্যাকেজের সুবিধা পাশাপাশি দেখুন</p>
        </div>
        <div className="overflow-x-auto rounded-2xl shadow-lg border border-gray-100">
          <table className="w-full bg-white text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <th className="text-left py-4 px-5 font-semibold rounded-tl-2xl w-40">বিভাগ</th>
                <th className="text-center py-4 px-5 font-semibold">
                  <div className="flex flex-col items-center gap-1.5">
                    <ShoppingBag size={16} />
                    <span>কাস্টমার</span>
                    <span className="text-[10px] opacity-70 font-normal">১,০০০ PV পণ্য</span>
                  </div>
                </th>
                <th className="text-center py-4 px-5 font-semibold">
                  <div className="flex flex-col items-center gap-1.5">
                    <Crown size={16} />
                    <span>শেয়ারহোল্ডার</span>
                    <span className="text-[10px] opacity-70 font-normal">৳৫,০০০</span>
                  </div>
                </th>
                <th className="text-center py-4 px-5 font-semibold rounded-tr-2xl">
                  <div className="flex flex-col items-center gap-1.5">
                    <Award size={16} />
                    <span>গোল্ড</span>
                    <span className="text-[10px] opacity-70 font-normal">৳১,০০,০০০</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {commissionRows.map((row, i) => (
                <tr key={i} className={`border-b border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <td className="py-3 px-5 font-semibold text-gray-700 text-xs">{row.label}</td>
                  {[row.customer, row.shareholder, row.gold].map((val, j) => (
                    <td key={j} className="py-3 px-5 text-center text-gray-600 text-xs">
                      {val === '✓'
                        ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 font-bold text-sm">✓</span>
                        : val === '✗'
                        ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-50 text-red-400 font-bold text-sm">✗</span>
                        : <span>{val}</span>
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-3 text-center">* Club pool distribution: শুধুমাত্র PV product sales থেকে | ১ PV = ১ টাকা</p>
      </section>

      {/* Club System */}
      <section className="py-12 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full mb-3">ক্লাব বোনাস</span>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">ক্লাব বোনাস সিস্টেম</h2>
          <p className="text-gray-500">PV sales থেকে ৫টি ক্লাব পুলে টাকা জমে — যোগ্য সদস্যরা ভাগ পান</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {clubInfo.map((club, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${club.color} rounded-xl flex items-center justify-center text-white shadow-sm`}>
                  {club.icon}
                </div>
                <span className={`text-lg font-extrabold bg-gradient-to-r ${club.color} bg-clip-text text-transparent`}>
                  {club.pct}
                </span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{club.name}</h3>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">{club.desc}</p>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${club.color}`}>
                <Users size={11} /> {club.who}
              </div>
            </div>
          ))}
        </div>

        {/* Pool total */}
        <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100">
          <p className="text-center text-sm font-semibold text-indigo-800 mb-3">প্রতিটি PV sale এ কীভাবে ক্লাব pool এ টাকা যায়:</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { label: 'ডেইলি', pct: '৩০%', color: 'bg-blue-100 text-blue-700' },
              { label: 'উইকলি', pct: '২.৫%', color: 'bg-green-100 text-green-700' },
              { label: 'ইনসুরেন্স', pct: '১.২৫%', color: 'bg-purple-100 text-purple-700' },
              { label: 'পেনশন', pct: '১.২৫%', color: 'bg-orange-100 text-orange-700' },
              { label: 'শেয়ারহোল্ডার', pct: '১০%', color: 'bg-yellow-100 text-yellow-700' },
            ].map((p, i) => (
              <div key={i} className={`${p.color} rounded-xl px-4 py-2 text-center`}>
                <p className="text-xs font-medium">{p.label}</p>
                <p className="text-lg font-extrabold">{p.pct}</p>
              </div>
            ))}
            <div className="bg-indigo-100 text-indigo-700 rounded-xl px-4 py-2 text-center">
              <p className="text-xs font-medium">মোট</p>
              <p className="text-lg font-extrabold">৪৫%</p>
            </div>
          </div>
        </div>
      </section>

      {/* Generation Bonus */}
      <section className="py-12 px-4 max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-8 border border-indigo-100">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">৫ জেনারেশন বোনাস সিস্টেম</h2>
            <p className="text-gray-500 text-sm">PV পণ্য ক্রয়ে উপরের ৫ লেভেলে ১% করে বোনাস যায় — সাথে সাথে</p>
          </div>
          <div className="flex items-center justify-center gap-1 flex-wrap">
            {[
              { gen: '১ম', pct: '১%', color: 'from-indigo-600 to-indigo-700' },
              { gen: '২য়', pct: '১%', color: 'from-purple-600 to-purple-700' },
              { gen: '৩য়', pct: '১%', color: 'from-pink-600 to-pink-700' },
              { gen: '৪র্থ', pct: '১%', color: 'from-orange-500 to-orange-600' },
              { gen: '৫ম', pct: '১%', color: 'from-yellow-500 to-yellow-600' },
            ].map((g, i) => (
              <React.Fragment key={i}>
                <div className={`bg-gradient-to-br ${g.color} text-white rounded-2xl px-5 py-4 text-center shadow-lg min-w-[80px]`}>
                  <p className="text-[10px] opacity-80 mb-1">জেনারেশন</p>
                  <p className="text-xl font-extrabold">{g.gen}</p>
                  <p className="text-sm font-bold mt-1 bg-white/20 rounded-full px-2 py-0.5">{g.pct}</p>
                </div>
                {i < 4 && <ChevronRight size={20} className="text-gray-300 mx-0.5 flex-shrink-0" />}
              </React.Fragment>
            ))}
          </div>
          <div className="mt-6 bg-white rounded-xl p-4 border border-indigo-100">
            <p className="text-center text-xs text-gray-600 font-medium">
              উদাহরণ: কেউ ১,০০০ PV পণ্য কিনলে → ১ম লেভেল পায় ৳১০ → ২য় পায় ৳১০ → ... → ৫ম পায় ৳১০
            </p>
            <p className="text-center text-xs text-gray-400 mt-1">* শুধুমাত্র PV product purchase এ প্রযোজ্য, package ক্রয়ে নয়</p>
          </div>
        </div>
      </section>

      {/* Gold Package detail */}
      <section className="py-12 px-4 max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl p-8 border border-yellow-200">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Award size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">গোল্ড প্যাকেজ — বিস্তারিত</h2>
              <p className="text-sm text-gray-500">৳১,০০,০০০ বিনিয়োগে ৩৬৫ দিনের সুবিধা</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-yellow-100">
              <p className="text-xs font-semibold text-yellow-700 mb-2 uppercase tracking-wider">রেফারার পায়</p>
              <p className="text-3xl font-extrabold text-yellow-600">৳১,৮০০</p>
              <p className="text-sm text-gray-500 mt-1">৳৪.৯৩/দিন × ৩৬৫ দিন</p>
              <div className="mt-3 w-full h-2 bg-yellow-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full w-full animate-pulse" />
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-orange-100">
              <p className="text-xs font-semibold text-orange-700 mb-2 uppercase tracking-wider">বায়ারের বকেয়া জমে</p>
              <p className="text-3xl font-extrabold text-orange-600">৳৩৬,০০০</p>
              <p className="text-sm text-gray-500 mt-1">৳৯৮.৬৩/দিন × ৩৬৫ দিন</p>
              <p className="text-xs text-orange-500 mt-2">প্যাকেজ বাতিল করতে এই পরিমাণ পরিশোধ করতে হবে</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900">
        <h2 className="text-2xl lg:text-4xl font-bold text-white mb-4">আজই শুরু করুন!</h2>
        <p className="text-gray-300 mb-8 max-w-xl mx-auto text-sm">
          কাস্টমার প্যাকেজে বিনামূল্যে রেজিস্ট্রেশন করুন, পণ্য কিনুন এবং আয়ের যাত্রা শুরু করুন।
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/register" className="px-10 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-indigo-900 font-bold rounded-xl hover:from-yellow-300 hover:to-orange-400 transition-all shadow-2xl shadow-yellow-500/30 text-lg">
            বিনামূল্যে শুরু করুন
          </Link>
          <Link to="/login" className="px-10 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20 text-lg">
            লগইন করুন
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}