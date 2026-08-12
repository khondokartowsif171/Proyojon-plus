import React from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ShoppingBag, Crown, Award, Check, X } from 'lucide-react';

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
      { text: 'ডেইলি ক্লাব বোনাস (PV এর ২০%)', ok: true },
      { text: 'সেলারী ক্লাব (১৫ ডিরেক্ট রেফারে)', ok: true },
      { text: 'লটারি ওমরা হজ্জ ক্লাব বোনাস (PV এর ৫%)', ok: true },
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
      { text: 'আজীবন মেয়াদ — কোনো রিনিউ লাগে না', ok: true },
      { text: '১% জেনারেশন বোনাস (৫ লেভেল)', ok: true },
      { text: 'ডেইলি/সেলারী ক্লাব নেই', ok: false },
    ],
    btnLabel: 'এখনই জয়েন করুন',
  },
  {
    name: 'গোল্ড প্যাকেজ',
    priceDisplay: '৳৫,০০০+',
    pvLabel: 'বিনিয়োগ অনুযায়ী GP',
    pvSub: 'যত বিনিয়োগ, তত GP',
    points: '৫,০০০ GP থেকে',
    type: 'gold',
    icon: <Award size={32} />,
    color: 'from-yellow-500 to-orange-600',
    shadow: 'shadow-yellow-200',
    popular: false,
    features: [
      { text: 'রেফারার পায় বিনিয়োগের ১.৮% — ৩৬৫ দিনে (দৈনিক)', ok: true },
      { text: 'বায়ারের বকেয়া: বিনিয়োগের ৩৬% (দৈনিক জমে)', ok: true },
      { text: '৩৬৫ দিনের কাউন্টডাউন টাইমার — প্রতিটি আলাদা', ok: true },
      { text: 'একাধিক Gold package একই ID থেকে কেনা যায়', ok: true },
      { text: 'গোল্ড লকার ছবি আপলোড (মেয়াদে লক)', ok: true },
      { text: 'ক্লাব বোনাস নেই', ok: false },
    ],
    btnLabel: 'এখনই জয়েন করুন',
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
              <p className="text-3xl font-bold text-yellow-400">১.৮%</p>
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

      {/* CTA */}
      <section className="py-16 px-4 text-center bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900">
        <h2 className="text-3xl font-bold text-white mb-4">আজই শুরু করুন</h2>
        <p className="text-indigo-200 mb-8 text-lg max-w-xl mx-auto">
          সঠিক রেফারেল লিংক ব্যবহার করে রেজিস্ট্রেশন করুন এবং আপনার পছন্দের প্যাকেজটি সক্রিয় করুন
        </p>
        <Link to="/register" className="inline-block px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-indigo-900 font-bold rounded-xl text-lg hover:from-yellow-300 hover:to-orange-400 transition-all shadow-xl">
          রেজিস্ট্রেশন করুন
        </Link>
      </section>

      <Footer />
    </div>
  );
}