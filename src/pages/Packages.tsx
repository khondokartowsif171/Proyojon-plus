import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Package, Crown, Award, Check, Star } from 'lucide-react';

export default function Packages() {
  const navigate = useNavigate();

  const packages = [
    {
      name: 'কাস্টমার প্যাকেজ',
      price: '৳১,০০০',
      points: '১,০০০ PV',
      pointRate: '১ পয়েন্ট = ১ টাকা',
      icon: <Package size={28} />,
      color: 'from-blue-500 to-cyan-600',
      bg: 'from-blue-50 to-cyan-50',
      border: 'border-blue-200',
      popular: false,
      type: 'customer',
      features: [
        '৫% রেফার ইনকাম (তাৎক্ষণিক)',
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
      price: '৳৫,০০০',
      points: '৫,০০০ PS',
      pointRate: '১ PS = ১ টাকা',
      icon: <Crown size={28} />,
      color: 'from-purple-500 to-pink-600',
      bg: 'from-purple-50 to-pink-50',
      border: 'border-purple-300',
      popular: true,
      type: 'shareholder',
      features: [
        '২.৫% রেফার কমিশন (তাৎক্ষণিক)',
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
      price: '৳১,০০,০০০',
      points: '১,০০,০০০ GP',
      pointRate: '১ GP = ১ টাকা',
      icon: <Award size={28} />,
      color: 'from-yellow-500 to-orange-600',
      bg: 'from-yellow-50 to-orange-50',
      border: 'border-yellow-300',
      popular: false,
      type: 'gold',
      features: [
        '৫% গোল্ড রেফার ইনকাম (৩৬৫ দিনে বন্টিত)',
        '৫% রেফার ইনকাম (৩৬৫ দিনে দৈনিক বন্টন)',
        'প্রতিদিন ৳১৩৬.৯৮ করে রেফারারের ব্যালেন্সে',
        '১% জেনারেশন বোনাস (৫ লেভেল)',
        '৩৬৫ দিনের কাউন্টডাউন টাইমার',
        'বকেয়া হিসাব (প্যাকেজ বাতিলে পরিশোধ)',
        'সকল ক্ল্যাব সুবিধা',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            জয়েনিং প্যাকেজ সমূহ
          </h1>
          <p className="text-gray-500 text-lg">
            আপনার বাজেট ও লক্ষ্য অনুযায়ী প্যাকেজ বেছে নিন
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {packages.map((pkg) => (
            <div
              key={pkg.type}
              className={`relative bg-gradient-to-br ${pkg.bg} rounded-3xl border-2 ${pkg.border} p-8 shadow-lg hover:shadow-xl transition-all duration-300`}
            >
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1">
                    <Star size={12} fill="white" /> সবচেয়ে জনপ্রিয়
                  </span>
                </div>
              )}

              <div className={`w-16 h-16 bg-gradient-to-br ${pkg.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg`}>
                {pkg.icon}
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-1">{pkg.name}</h2>
              <p className="text-sm text-gray-500 mb-2">{pkg.pointRate}</p>
              <p className="text-4xl font-bold text-gray-900 mb-1">{pkg.price}</p>
              <p className="text-sm font-semibold text-indigo-600 mb-6">{pkg.points}</p>

              <ul className="space-y-3 mb-8">
                {pkg.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <div className={`w-5 h-5 bg-gradient-to-br ${pkg.color} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Check size={12} className="text-white" strokeWidth={3} />
                    </div>
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => navigate(`/register?package=${pkg.type}`)}
                className={`w-full py-3.5 bg-gradient-to-r ${pkg.color} text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg`}
              >
                এখনই জয়েন করুন
              </button>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-white rounded-3xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            কমিশন স্ট্রাকচার
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                  <th className="text-left py-3 px-4 rounded-tl-xl">বিভাগ</th>
                  <th className="text-center py-3 px-4">কাস্টমার</th>
                  <th className="text-center py-3 px-4">শেয়ারহোল্ডার</th>
                  <th className="text-center py-3 px-4 rounded-tr-xl">গোল্ড</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['প্যাকেজ মূল্য', '৳১,০০০', '৳৫,০০০', '৳১,০০,০০০'],
                  ['পয়েন্ট', '১,০০০ PV', '৫,০০০ PS', '১,০০,০০০ GP'],
                  ['রেফার কমিশন', '৫% (তাৎক্ষণিক)', '২.৫% (তাৎক্ষণিক)', '৫% (৩৬৫ দিনে)'],
                  ['জেনারেশন বোনাস', '১% × ৫ লেভেল', '১% × ৫ লেভেল', '১% × ৫ লেভেল'],
                  ['ডেইলি ক্লাব', '✅ PV এর ৩০%', '✅', '✅'],
                  ['উইকলি ক্লাব', '১৫ রেফারে', '✅', '✅'],
                  ['শেয়ারহোল্ডার ক্লাব', '❌', '✅', '✅'],
                  ['ইনসুরেন্স ক্লাব', '❌', '❌', '✅'],
                  ['পেনশন ক্লাব', '❌', '❌', '✅'],
                  ['মেয়াদ', '৩০ দিন', '৩০ দিন', '৩৬৫ দিন'],
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="py-3 px-4 font-medium text-gray-700">{row[0]}</td>
                    <td className="py-3 px-4 text-center text-blue-700">{row[1]}</td>
                    <td className="py-3 px-4 text-center text-purple-700">{row[2]}</td>
                    <td className="py-3 px-4 text-center text-yellow-700">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
