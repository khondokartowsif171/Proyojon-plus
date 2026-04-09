import React from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Package, Crown, Award, ArrowRight, TrendingUp, Users, Gift, Shield, Clock } from 'lucide-react';

export default function Packages() {
  const packages = [
    {
      name: 'কাস্টমার প্যাকেজ',
      points: '১,০০০ PV',
      price: '৳১,০০০',
      unit: '১ পয়েন্ট = ১ টাকা',
      icon: <Package size={36} />,
      color: 'from-blue-500 to-cyan-600',
      shadow: 'shadow-blue-500/20',
      referral: '৫% রেফার ইনকাম (তাৎক্ষণিক)',
      features: [
        'রেফার করলে সাথে সাথে ৫% কমিশন',
        '১% জেনারেশন বোনাস (৫ লেভেল পর্যন্ত)',
        'ডেইলি ক্ল্যাব বোনাস (PV এর ৩০%)',
        '১৫ ডিরেক্ট রেফারে উইকলি ক্ল্যাব সদস্য',
        '৩০ দিনের মেয়াদ (১০০ PV ক্রয়ে রিনিউ)',
        'মানসম্মত পণ্য ক্রয়ের সুবিধা',
      ],
    },
    {
      name: 'শেয়ারহোল্ডার প্যাকেজ',
      points: '৫,০০০ PS',
      price: '৳৫,০০০',
      unit: '১ PS = ১ টাকা',
      icon: <Crown size={36} />,
      color: 'from-purple-500 to-pink-600',
      shadow: 'shadow-purple-500/20',
      referral: '২.৫% রেফার কমিশন (তাৎক্ষণিক)',
      popular: true,
      features: [
        'রেফার করলে সাথে সাথে ২.৫% কমিশন',
        '১% জেনারেশন বোনাস (৫ লেভেল পর্যন্ত)',
        'শেয়ারহোল্ডার ক্ল্যাব সদস্যপদ',
        'ডেইলি ক্ল্যাব বোনাস',
        'উইকলি ক্ল্যাব যোগ্যতা',
        '৩০ দিনের মেয়াদ (১০০ PV ক্রয়ে রিনিউ)',
      ],
    },
    {
      name: 'গোল্ড প্যাকেজ',
      points: '৩৬,০০০ GP',
      price: '৳৩৬,০০০',
      unit: '১ GP = ১ টাকা',
      icon: <Award size={36} />,
      color: 'from-yellow-500 to-orange-600',
      shadow: 'shadow-yellow-500/20',
      referral: '৫% গোল্ড রেফার ইনকাম (৩৬৫ দিনে বন্টিত)',
      features: [
        '৫% রেফার ইনকাম (৩৬৫ দিনে দৈনিক বন্টন)',
        'প্রতিদিন ৳৪.৯৩ করে রেফারারের ব্যালেন্সে',
        '১% জেনারেশন বোনাস (৫ লেভেল)',
        '৩৬৫ দিনের কাউন্টডাউন টাইমার',
        'বকেয়া হিসাব (প্যাকেজ বাতিলে পরিশোধ)',
        'সকল ক্ল্যাব সুবিধা',
      ],
    },
  ];

  const commissionStructure = [
    { label: 'ডেইলি ক্ল্যাব বোনাস', percentage: '৩০%', desc: 'PV থেকে ৩০% সকল সক্রিয় সদস্যদের মাঝে সমান বন্টন', icon: <Gift size={20} /> },
    { label: 'শেয়ারহোল্ডার ক্ল্যাব', percentage: '১০%', desc: 'PV থেকে ১০% শেয়ারহোল্ডার সদস্যদের মাঝে বন্টন', icon: <Crown size={20} /> },
    { label: 'উইকলি ক্ল্যাব', percentage: '২.৫%', desc: 'PV থেকে ২.৫% - ১৫ ডিরেক্ট রেফারে যোগ্য', icon: <Clock size={20} /> },
    { label: 'ইনসুরেন্স ক্ল্যাব', percentage: '২.৫%', desc: 'PV থেকে ২.৫% - ১৫ উইকলি মেম্বার রেফারে যোগ্য', icon: <Shield size={20} /> },
    { label: 'পেনশন ক্ল্যাব', percentage: '২.৫%', desc: 'PV থেকে ২.৫% - ইনসুরেন্স ক্ল্যাব মেম্বারদের জন্য', icon: <Users size={20} /> },
    { label: 'জেনারেশন বোনাস', percentage: '১%', desc: '৫ জেনারেশন পর্যন্ত PV এর ১% করে', icon: <TrendingUp size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero */}
      <div className="bg-gradient-to-r from-indigo-900 to-purple-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl lg:text-5xl font-bold mb-4">জয়েনিং প্যাকেজ সমূহ</h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg">
            আপনার বাজেট ও লক্ষ্য অনুযায়ী প্যাকেজ বেছে নিন এবং আয় শুরু করুন
          </p>
        </div>
      </div>

      {/* Packages */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {packages.map((pkg, i) => (
            <div
              key={i}
              className={`relative bg-white rounded-3xl p-8 border-2 ${
                pkg.popular ? 'border-purple-500 shadow-2xl ' + pkg.shadow : 'border-gray-100 shadow-lg'
              } hover:shadow-2xl transition-all duration-300 hover:-translate-y-2`}
            >
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                  সবচেয়ে জনপ্রিয়
                </div>
              )}
              <div className={`w-16 h-16 bg-gradient-to-br ${pkg.color} rounded-2xl flex items-center justify-center text-white mb-6`}>
                {pkg.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{pkg.name}</h3>
              <p className="text-xs text-gray-500 mb-4">{pkg.unit}</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-extrabold text-gray-900">{pkg.price}</span>
              </div>
              <p className="text-sm text-gray-500 mb-2">{pkg.points}</p>
              <div className="bg-indigo-50 rounded-lg p-3 mb-6">
                <p className="text-sm font-semibold text-indigo-700">{pkg.referral}</p>
              </div>
              <ul className="space-y-3 mb-8">
                {pkg.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                    <div className={`w-5 h-5 bg-gradient-to-br ${pkg.color} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className={`block text-center py-3.5 rounded-xl font-bold transition-all ${
                  pkg.popular
                    ? `bg-gradient-to-r ${pkg.color} text-white hover:shadow-lg`
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                এখনই জয়েন করুন <ArrowRight size={16} className="inline ml-1" />
              </Link>
            </div>
          ))}
        </div>

        {/* Commission Structure */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">কমিশন কাঠামো</h2>
          <p className="text-gray-500 text-center mb-10">PV (পয়েন্ট ভ্যালু) থেকে বিভিন্ন ক্ল্যাবে বন্টন</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {commissionStructure.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{item.label}</h3>
                    <span className="text-xl font-extrabold text-indigo-600">{item.percentage}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Rules */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">গুরুত্বপূর্ণ নিয়মাবলী</h2>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div className="space-y-4">
              <div className="flex gap-3">
                <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">১</span>
                <p>প্রতিটি আইডির মেয়াদ ৩০ দিন। মেয়াদ শেষে ১০০ পয়েন্টের পণ্য ক্রয় করে রিএকটিভ করতে হবে।</p>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">২</span>
                <p>ইনএকটিভ আইডিতে কোন ইনকাম ঢুকবে না।</p>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">৩</span>
                <p>১৫ টি ডিরেক্ট কাস্টমার আইডি বিক্রয় করলে উইকলি ক্ল্যাবের সদস্য হবে।</p>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">৪</span>
                <p>১৫ জন উইকলি ক্ল্যাব মেম্বার রেফার করলে ইনসুরেন্স ও পেনশন ক্ল্যাবের সদস্য হবে।</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">৫</span>
                <p>গোল্ড প্যাকেজের ৫% রেফার ইনকাম ৩৬৫ দিনে দৈনিক বন্টিত হবে (১৮০০÷৩৬৫ = ৳৪.৯৩/দিন)।</p>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">৬</span>
                <p>গোল্ড প্যাকেজ বাতিল করতে বকেয়া পরিমাণ এডমিনকে পরিশোধ করতে হবে।</p>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">৭</span>
                <p>উইথড্রো চার্জ ৫%। ব্যাংক, বিকাশ, নগদ, রকেটে উইথড্রো করা যাবে।</p>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">৮</span>
                <p>আইডি টু আইডি ব্যালেন্স ট্রান্সফার করা যাবে।</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
