import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { ArrowRight, Users, Shield, TrendingUp, Gift, Star, Zap, Crown, Award, ChevronRight, Package } from 'lucide-react';

export default function AppLayout() {
  const [products, setProducts] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [productsRes, collectionsRes] = await Promise.all([
        supabase.from('ecom_products').select('*').eq('status', 'active').limit(8),
        supabase.from('ecom_collections').select('*').eq('is_visible', true),
      ]);
      if (productsRes.data) setProducts(productsRes.data);
      if (collectionsRes.data) setCollections(collectionsRes.data);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-400 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-purple-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-40 right-40 w-48 h-48 bg-orange-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 py-20 lg:py-32 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
                <span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
                  Proyojon Plus
                </span>
                <br />
                আপনার প্রয়োজনের সঠিক সমাধান
              </h1>
              <p className="text-lg text-gray-300 mb-8 leading-relaxed max-w-lg">
                মানসম্মত পণ্য ক্রয় করুন, রেফার করুন এবং আয় করুন। তিন ধরনের প্যাকেজ থেকে আপনার পছন্দের প্যাকেজটি বেছে নিন।
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/register"
                  className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-indigo-900 font-bold rounded-xl hover:from-yellow-300 hover:to-orange-400 transition-all shadow-2xl shadow-yellow-500/30 flex items-center gap-2"
                >
                  এখনই শুরু করুন
                  <ArrowRight size={20} />
                </Link>
                <Link
                  to="/packages"
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20"
                >
                  প্যাকেজ দেখুন
                </Link>
              </div>
              <div className="flex items-center gap-8 mt-10">
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-400">৫+</p>
                  <p className="text-xs text-gray-400">জেনারেশন বোনাস</p>
                </div>
                <div className="w-px h-10 bg-white/20" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-400">৩০%</p>
                  <p className="text-xs text-gray-400">ডেইলি ক্ল্যাব</p>
                </div>
                <div className="w-px h-10 bg-white/20" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-400">৫%</p>
                  <p className="text-xs text-gray-400">রেফার ইনকাম</p>
                </div>
              </div>
            </div>
            <div className="hidden lg:block relative">
              <div className="relative w-full aspect-square max-w-md mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-3xl rotate-6" />
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-3xl -rotate-3" />
                <div className="relative bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 h-full flex flex-col justify-center">
                  <div className="space-y-6">
                    {[
                      { icon: <Package size={24} />, label: 'কাস্টমার প্যাকেজ', value: '১,০০০ PV', color: 'from-blue-500 to-cyan-500' },
                      { icon: <Crown size={24} />, label: 'শেয়ারহোল্ডার প্যাকেজ', value: '৫,০০০ PS', color: 'from-purple-500 to-pink-500' },
                      { icon: <Award size={24} />, label: 'গোল্ড প্যাকেজ', value: '১,০০,০০০ GP', color: 'from-yellow-500 to-orange-500' },
                    ].map((pkg, i) => (
                      <div key={i} className="flex items-center gap-4 bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors">
                        <div className={`w-12 h-12 bg-gradient-to-br ${pkg.color} rounded-xl flex items-center justify-center text-white`}>
                          {pkg.icon}
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">{pkg.label}</p>
                          <p className="text-yellow-300 font-bold">{pkg.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Packages Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">জয়েনিং প্যাকেজ সমূহ</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">আপনার বাজেট ও লক্ষ্য অনুযায়ী প্যাকেজ বেছে নিন</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'কাস্টমার প্যাকেজ',
                points: '১,০০০',
                unit: 'PV',
                price: '১,০০০',
                color: 'from-blue-500 to-cyan-600',
                shadow: 'shadow-blue-500/20',
                icon: <Package size={32} />,
                features: ['৫% রেফার ইনকাম', '১% জেনারেশন বোনাস (৫ লেভেল)', 'ডেইলি ক্ল্যাব বোনাস', 'উইকলি ক্ল্যাব যোগ্যতা', '৩০ দিনের মেয়াদ'],
                popular: false,
              },
              {
                name: 'শেয়ারহোল্ডার প্যাকেজ',
                points: '৫,০০০',
                unit: 'PS',
                price: '৫,০০০',
                color: 'from-purple-500 to-pink-600',
                shadow: 'shadow-purple-500/20',
                icon: <Crown size={32} />,
                features: ['২.৫% রেফার কমিশন', '১% জেনারেশন বোনাস (৫ লেভেল)', 'শেয়ারহোল্ডার ক্ল্যাব', 'ডেইলি ক্ল্যাব বোনাস', '৩০ দিনের মেয়াদ'],
                popular: true,
              },
              {
                name: 'গোল্ড প্যাকেজ',
                points: '৩৬,০০০',
                unit: 'GP',
                price: '৩৬,০০০',
                color: 'from-yellow-500 to-orange-600',
                shadow: 'shadow-yellow-500/20',
                icon: <Award size={32} />,
                features: ['৫% গোল্ড রেফার ইনকাম', '৩৬৫ দিনে দৈনিক বন্টন', '১% জেনারেশন বোনাস', 'সকল ক্ল্যাব সুবিধা', '৩৬৫ দিনের কাউন্টডাউন'],
                popular: false,
              },
            ].map((pkg, i) => (
              <div
                key={i}
                className={`relative bg-white rounded-3xl p-8 border-2 ${pkg.popular ? 'border-purple-500 shadow-2xl ' + pkg.shadow : 'border-gray-100 shadow-lg'} hover:shadow-2xl transition-all duration-300 hover:-translate-y-2`}
              >
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                    সবচেয়ে জনপ্রিয়
                  </div>
                )}
                <div className={`w-16 h-16 bg-gradient-to-br ${pkg.color} rounded-2xl flex items-center justify-center text-white mb-6`}>
                  {pkg.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold text-gray-900">৳{pkg.price}</span>
                  <span className="text-gray-500 text-sm">/ {pkg.points} {pkg.unit}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {pkg.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className={`w-5 h-5 bg-gradient-to-br ${pkg.color} rounded-full flex items-center justify-center`}>
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
                  className={`block text-center py-3 rounded-xl font-bold transition-all ${
                    pkg.popular
                      ? `bg-gradient-to-r ${pkg.color} text-white hover:shadow-lg`
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  এখনই জয়েন করুন
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">কেন Proyojon Plus?</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">আমাদের প্ল্যাটফর্মের বিশেষ সুবিধাসমূহ</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <TrendingUp size={28} />, title: '৫ জেনারেশন বোনাস', desc: 'প্রতিটি জেনারেশনে PV এর ১% বোনাস পাবেন', color: 'from-blue-500 to-cyan-500' },
              { icon: <Gift size={28} />, title: 'ডেইলি ক্ল্যাব বোনাস', desc: 'PV এর ৩০% ডেইলি ক্ল্যাবে বন্টন', color: 'from-purple-500 to-pink-500' },
              { icon: <Shield size={28} />, title: 'ইনসুরেন্স ক্ল্যাব', desc: 'যোগ্য সদস্যদের জন্য বিশেষ সুবিধা', color: 'from-green-500 to-emerald-500' },
              { icon: <Users size={28} />, title: 'পেনশন ক্ল্যাব', desc: 'দীর্ঘমেয়াদী আয়ের নিশ্চয়তা', color: 'from-orange-500 to-red-500' },
              { icon: <Star size={28} />, title: 'শেয়ারহোল্ডার ক্ল্যাব', desc: 'PV এর ১০% শেয়ারহোল্ডারদের মাঝে বন্টন', color: 'from-yellow-500 to-orange-500' },
              { icon: <Zap size={28} />, title: 'তাৎক্ষণিক রেফার ইনকাম', desc: 'রেফার করলেই সাথে সাথে ইনকাম', color: 'from-indigo-500 to-purple-500' },
              { icon: <Crown size={28} />, title: 'গোল্ড প্যাকেজ', desc: '৩৬৫ দিনে দৈনিক ইনকাম বন্টন', color: 'from-amber-500 to-yellow-500' },
              { icon: <Award size={28} />, title: 'ফ্রি শিপিং', desc: 'সকল অর্ডারে বিনামূল্যে ডেলিভারি', color: 'from-teal-500 to-cyan-500' },
            ].map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100">
                <div className={`w-14 h-14 bg-gradient-to-br ${f.color} rounded-xl flex items-center justify-center text-white mb-4`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">আমাদের পণ্য সমূহ</h2>
              <p className="text-gray-500">মানসম্মত পণ্য ক্রয় করুন এবং PV পয়েন্ট অর্জন করুন</p>
            </div>
            <Link to="/shop" className="hidden md:flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
              সকল পণ্য দেখুন <ChevronRight size={18} />
            </Link>
          </div>

          {/* Collections */}
          {collections.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-8">
              {collections.map(col => (
                <Link
                  key={col.id}
                  to={`/collections/${col.handle}`}
                  className="px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium hover:bg-indigo-100 transition-colors"
                >
                  {col.title}
                </Link>
              ))}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-2xl h-80 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="text-center mt-10 md:hidden">
            <Link to="/shop" className="inline-flex items-center gap-2 text-indigo-600 font-semibold">
              সকল পণ্য দেখুন <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-64 h-64 bg-yellow-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-64 h-64 bg-purple-400 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center relative">
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            আজই শুরু করুন আপনার সফলতার যাত্রা
          </h2>
          <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
            Proyojon Plus এ যোগ দিন, মানসম্মত পণ্য বিক্রি করুন এবং প্রতিদিন আয় করুন। আমাদের ৫ জেনারেশন বোনাস সিস্টেম আপনাকে দেবে অসীম আয়ের সুযোগ।
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="px-10 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-indigo-900 font-bold rounded-xl hover:from-yellow-300 hover:to-orange-400 transition-all shadow-2xl shadow-yellow-500/30 text-lg"
            >
              বিনামূল্যে রেজিস্ট্রেশন করুন
            </Link>
            <Link
              to="/login"
              className="px-10 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20 text-lg"
            >
              লগইন করুন
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
