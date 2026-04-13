import React from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Package, Crown, Award, Check, Users, Gift, Shield, Star, Zap, TrendingUp, ChevronRight } from 'lucide-react';

const packages = [
  {
    name: 'কাস্টমার প্যাকেজ',
    price: '৳১,০০০',
    priceNum: 1000,
    points: '১,০০০ PV',
    pointRate: '১ পয়েন্ট = ১ টাকা',
    type: 'customer',
    icon: <Package size={32} />,
    color: 'from-blue-500 to-cyan-500',
    border: 'border-blue-200',
    bg: 'bg-blue-50',
    btnColor: 'from-blue-500 to-cyan-600',
    popular: false,
    features: [
      '৫% রেফার ইনকাম (তাৎক্ষণিক)',
      'রেফার করলে সাথে সাথে ৫% কমিশন',
      '১% জেনারেশন বোনাস (৫ লেভেল পর্যন্ত)',
      'ডেইলি ক্লাব বোনাস (PV এর ৩০%)',
      '১৫ ডিরেক্ট রেফারে উইকলি ক্লাব সদস্য',
      '৩০ দিনের মেয়াদ (১০০ PV ক্রয়ে রিনিউ)',
      'মানসম্মত পণ্য ক্রয়ের সুবিধা',
    ],
  },
  {
    name: 'শেয়ারহোল্ডার প্যাকেজ',
    price: '৳৫,০০০',
    priceNum: 5000,
    points: '৫,০০০ PS',
    pointRate: '১ PS = ১ টাকা',
    type: 'shareholder',
    icon: <Crown size={32} />,
    color: 'from-purple-500 to-pink-500',
    border: 'border-purple-200',
    bg: 'bg-purple-50',
    btnColor: 'from-purple-500 to-pink-600',
    popular: true,
    features: [
      '২.৫% রেফার কমিশন (তাৎক্ষণিক)',
      'রেফার করলে সাথে সাথে ২.৫% কমিশন',
      '১% জেনারেশন বোনাস (৫ লেভেল পর্যন্ত)',
      'শেয়ারহোল্ডার ক্লাব সদস্যপদ',
      'ডেইলি ক্লাব বোনাস',
      'উইকলি ক্লাব যোগ্যতা',
      '৩০ দিনের মেয়াদ (১০০ PV ক্রয়ে রিনিউ)',
    ],
  },
  {
    name: 'গোল্ড প্যাকেজ',
    price: '৳১,০০,০০০',
    priceNum: 100000,
    points: '১,০০,০০০ GP',
    pointRate: '১ GP = ১ টাকা',
    type: 'gold',
    icon: <Award size={32} />,
    color: 'from-yellow-500 to-orange-500',
    border: 'border-yellow-200',
    bg: 'bg-yellow-50',
    btnColor: 'from-yellow-500 to-orange-600',
    popular: false,
    features: [
      '৫% গোল্ড রেফার ইনকাম (৩৬৫ দিনে বন্টিত)',
      '৫% রেফার ইনকাম (৩৬৫ দিনে দৈনিক বন্টন)',
      'প্রতিদিন ৳৩৬৫.৯৮ করে রেফারারের ব্যালেন্সে',
      '১% জেনারেশন বোনাস (৫ লেভেল)',
      '৩৬৫ দিনের কাউন্টডাউন টাইমার',
      'বকেয়া হিসাব (প্যাকেজ বাতিলে পরিশোধ)',
      'সকল ক্লাব সুবিধা',
    ],
  },
];

const commissionRows = [
  { label: 'প্যাকেজ মূল্য', customer: '৳১,০০০', shareholder: '৳৫,০০০', gold: '৳১,০০,০০০' },
  { label: 'পয়েন্ট', customer: '১,০০০ PV', shareholder: '৫,০০০ PS', gold: '১,০০,০০০ GP' },
  { label: 'রেফার কমিশন', customer: '৫% = ৳৫০', shareholder: '২.৫% = ৳১২৫', gold: '৳১,৮০০ (৩৬৫ দিন)' },
  { label: 'জেনারেশন বোনাস', customer: 'PV এর ১%', shareholder: 'PV এর ১%', gold: 'PV এর ১%' },
  { label: 'ডেইলি ক্লাব', customer: 'PV এর ৩০%', shareholder: 'PV এর ৩০%', gold: 'PV এর ৩০%' },
  { label: 'উইকলি ক্লাব', customer: '১৫ রেফারে', shareholder: '✓', gold: '✓' },
  { label: 'ইনসুরেন্স ক্লাব', customer: '১৫ রেফারি উইকলি হলে', shareholder: '১৫ রেফারি উইকলি হলে', gold: '✓' },
  { label: 'পেনশন ক্লাব', customer: '১৫ রেফারি উইকলি হলে', shareholder: '১৫ রেফারি উইকলি হলে', gold: '✓' },
  { label: 'শেয়ারহোল্ডার ক্লাব', customer: '✗', shareholder: '✓', gold: '✓' },
  { label: 'মেয়াদ', customer: '৩০ দিন', shareholder: '৩০ দিন', gold: '৩৬৫ দিন' },
  { label: 'রিনিউ শর্ত', customer: '১০০ PV ক্রয়', shareholder: '১০০ PV ক্রয়', gold: 'N/A' },
];

const clubInfo = [
  { icon: <Gift size={22} />, name: 'ডেইলি ক্লাব', desc: 'প্রতিদিন PV এর ৩০% সকল সক্রিয় সদস্যের মধ্যে সমানভাবে বিতরণ হয়।', color: 'from-blue-500 to-cyan-500', who: 'সকল সক্রিয় সদস্য' },
  { icon: <Star size={22} />, name: 'উইকলি ক্লাব', desc: '১৫+ ডিরেক্ট কাস্টমার রেফার করলে বা গোল্ড প্যাকেজ হলে এই ক্লাবের সদস্য।', color: 'from-green-500 to-emerald-500', who: '১৫ ডিরেক্ট রেফার বা গোল্ড' },
  { icon: <Shield size={22} />, name: 'ইনসুরেন্স ক্লাব', desc: 'আপনার রেফারকৃত ১৫ জন উইকলি ক্লাব সদস্য হলে আপনি এই ক্লাবের সদস্য।', color: 'from-purple-500 to-pink-500', who: '১৫ রেফারি উইকলি হলে' },
  { icon: <TrendingUp size={22} />, name: 'পেনশন ক্লাব', desc: 'ইনসুরেন্স ক্লাবের মতো একই শর্ত। দীর্ঘমেয়াদী আয়ের নিশ্চয়তা দেয়।', color: 'from-orange-500 to-red-500', who: '১৫ রেফারি উইকলি হলে' },
  { icon: <Crown size={22} />, name: 'শেয়ারহোল্ডার ক্লাব', desc: 'শেয়ারহোল্ডার বা গোল্ড প্যাকেজ ধারীরা PV এর ১০% শেয়ার পান।', color: 'from-yellow-500 to-orange-500', who: 'শেয়ারহোল্ডার ও গোল্ড' },
];

export default function Packages() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 py-16 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-72 h-72 bg-yellow-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-72 h-72 bg-pink-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto">
          <span className="inline-block px-4 py-1.5 bg-white/10 border border-white/20 text-white text-xs font-semibold rounded-full mb-4 tracking-wider uppercase">জয়েনিং প্যাকেজ সমূহ</span>
          <h1 className="text-3xl lg:text-5xl font-extrabold text-white mb-4">আপনার বাজেট অনুযায়ী<br /><span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">প্যাকেজ বেছে নিন</span></h1>
          <p className="text-gray-300 text-lg max-w-xl mx-auto">তিনটি প্যাকেজ থেকে আপনার সামর্থ্য ও লক্ষ্য অনুযায়ী প্যাকেজ নির্বাচন করুন এবং আয় শুরু করুন।</p>
        </div>
      </section>

      {/* Packages */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {packages.map((pkg) => (
            <div key={pkg.type} className={`relative bg-white rounded-3xl border-2 ${pkg.popular ? 'border-purple-400 shadow-2xl shadow-purple-200 scale-105' : 'border-gray-100 shadow-lg'} transition-all hover:-translate-y-1 hover:shadow-xl`}>
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-lg">
                  ★ সবচেয়ে জনপ্রিয়
                </div>
              )}

              <div className="p-7">
                {/* Icon + Name */}
                <div className={`w-14 h-14 bg-gradient-to-br ${pkg.color} rounded-2xl flex items-center justify-center text-white mb-5 shadow-lg`}>
                  {pkg.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{pkg.name}</h3>
                <p className="text-xs text-gray-400 mb-1">{pkg.pointRate}</p>

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl font-extrabold text-gray-900">{pkg.price}</span>
                </div>
                <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r ${pkg.color} text-white mb-5`}>{pkg.points}</span>

                {/* Features */}
                <ul className="space-y-2.5 mb-7">
                  {pkg.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <div className={`mt-0.5 w-5 h-5 flex-shrink-0 bg-gradient-to-br ${pkg.color} rounded-full flex items-center justify-center`}>
                        <Check size={11} className="text-white" strokeWidth={3} />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register"
                  className={`block text-center py-3.5 rounded-xl font-bold text-white bg-gradient-to-r ${pkg.btnColor} hover:opacity-90 transition-all shadow-lg`}
                >
                  এখনই জয়েন করুন
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Commission Table */}
      <section className="py-12 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">কমিশন স্ট্রাকচার</h2>
          <p className="text-gray-500">প্রতিটি প্যাকেজের সুবিধা তুলনা করুন</p>
        </div>
        <div className="overflow-x-auto rounded-2xl shadow-lg border border-gray-100">
          <table className="w-full bg-white text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <th className="text-left py-4 px-5 font-semibold rounded-tl-2xl">বিভাগ</th>
                <th className="text-center py-4 px-5 font-semibold">
                  <div className="flex flex-col items-center gap-1">
                    <Package size={16} />কাস্টমার
                  </div>
                </th>
                <th className="text-center py-4 px-5 font-semibold">
                  <div className="flex flex-col items-center gap-1">
                    <Crown size={16} />শেয়ারহোল্ডার
                  </div>
                </th>
                <th className="text-center py-4 px-5 font-semibold rounded-tr-2xl">
                  <div className="flex flex-col items-center gap-1">
                    <Award size={16} />গোল্ড
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {commissionRows.map((row, i) => (
                <tr key={i} className={`border-b border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="py-3 px-5 font-medium text-gray-700">{row.label}</td>
                  <td className="py-3 px-5 text-center text-gray-600">
                    {row.customer === '✓' ? <span className="text-green-500 font-bold text-base">✓</span>
                     : row.customer === '✗' ? <span className="text-red-400 font-bold text-base">✗</span>
                     : row.customer}
                  </td>
                  <td className="py-3 px-5 text-center text-gray-600">
                    {row.shareholder === '✓' ? <span className="text-green-500 font-bold text-base">✓</span>
                     : row.shareholder === '✗' ? <span className="text-red-400 font-bold text-base">✗</span>
                     : row.shareholder}
                  </td>
                  <td className="py-3 px-5 text-center text-gray-600">
                    {row.gold === '✓' ? <span className="text-green-500 font-bold text-base">✓</span>
                     : row.gold === '✗' ? <span className="text-red-400 font-bold text-base">✗</span>
                     : row.gold}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Club System */}
      <section className="py-12 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">ক্লাব বোনাস সিস্টেম</h2>
          <p className="text-gray-500">প্রতিটি ক্লাবের সুবিধা ও যোগ্যতার শর্ত</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {clubInfo.map((club, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all">
              <div className={`w-12 h-12 bg-gradient-to-br ${club.color} rounded-xl flex items-center justify-center text-white mb-4`}>
                {club.icon}
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{club.name}</h3>
              <p className="text-sm text-gray-500 mb-3 leading-relaxed">{club.desc}</p>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${club.color} bg-opacity-10 text-xs font-semibold text-white bg-gradient-to-r`}>
                <Users size={12} /> {club.who}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Generation Bonus */}
      <section className="py-12 px-4 max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-8 border border-indigo-100">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">৫ জেনারেশন বোনাস সিস্টেম</h2>
            <p className="text-gray-500 text-sm">PV পণ্য ক্রয়ে উপরের ৫ লেভেলে ১% করে জেনারেশন বোনাস যায়</p>
          </div>
          <div className="flex items-center justify-center gap-0 flex-wrap">
            {[
              { gen: '১ম', pct: '১%', color: 'bg-indigo-600' },
              { gen: '২য়', pct: '১%', color: 'bg-purple-600' },
              { gen: '৩য়', pct: '১%', color: 'bg-pink-600' },
              { gen: '৪র্থ', pct: '১%', color: 'bg-orange-500' },
              { gen: '৫ম', pct: '১%', color: 'bg-yellow-500' },
            ].map((g, i) => (
              <React.Fragment key={i}>
                <div className={`${g.color} text-white rounded-2xl px-5 py-4 text-center shadow-lg min-w-[80px]`}>
                  <p className="text-xs opacity-80 mb-1">জেনারেশন</p>
                  <p className="text-lg font-extrabold">{g.gen}</p>
                  <p className="text-sm font-bold mt-1">{g.pct}</p>
                </div>
                {i < 4 && <ChevronRight size={20} className="text-gray-300 mx-1 flex-shrink-0" />}
              </React.Fragment>
            ))}
          </div>
          <p className="text-center text-xs text-gray-500 mt-6">* জেনারেশন বোনাস শুধুমাত্র PV পণ্য ক্রয়ে প্রযোজ্য, প্যাকেজ ক্রয়ে নয়</p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-4 text-center bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900">
        <h2 className="text-2xl lg:text-4xl font-bold text-white mb-4">আজই শুরু করুন!</h2>
        <p className="text-gray-300 mb-8 max-w-xl mx-auto">রেজিস্ট্রেশন করুন, প্যাকেজ নিন এবং আপনার আয়ের যাত্রা শুরু করুন।</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/register" className="px-10 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-indigo-900 font-bold rounded-xl hover:from-yellow-300 hover:to-orange-400 transition-all shadow-2xl shadow-yellow-500/30">
            এখনই রেজিস্ট্রেশন করুন
          </Link>
          <Link to="/login" className="px-10 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20">
            লগইন করুন
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}