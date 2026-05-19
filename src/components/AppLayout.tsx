import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { ArrowRight, Crown, Award, ChevronRight, ShoppingBag } from 'lucide-react';

export default function AppLayout() {
  const [products,    setProducts]    = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [notices,     setNotices]     = useState<any[]>([]);
  const [gallery,     setGallery]     = useState<any[]>([]);
  const [lightboxImg, setLightboxImg] = useState<string|null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const now = new Date().toISOString();
      const [productsRes, collectionsRes, noticesRes, galleryRes] = await Promise.all([
        supabase.from('ecom_products').select('*').eq('status', 'active').limit(8),
        supabase.from('ecom_collections').select('*').eq('is_visible', true),
        supabase.from('proyojon_notices').select('*').eq('is_active', true)
          .or(`expires_at.is.null,expires_at.gt.${now}`)
          .order('priority', { ascending: false }).limit(5),
        supabase.from('proyojon_gallery').select('*').eq('is_visible', true)
          .order('sort_order').order('created_at', { ascending: false }),
      ]);
      if (productsRes.data)    setProducts(productsRes.data);
      if (collectionsRes.data) setCollections(collectionsRes.data);
      if (noticesRes.data)     setNotices(noticesRes.data);
      if (galleryRes.data)     setGallery(galleryRes.data);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Notice Bar */}
      {notices.length > 0 && (
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white py-2 px-4 overflow-hidden">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <span className="flex-shrink-0 text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">📢 নোটিশ</span>
            <div className="overflow-hidden flex-1">
              <div className="flex gap-8 animate-marquee whitespace-nowrap">
                {[...notices, ...notices].map((n, i) => (
                  <span key={i} className="text-sm font-medium flex-shrink-0">
                    {n.title}{n.content ? ` — ${n.content}` : ''}
                    <span className="mx-4 opacity-40">|</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-400 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-purple-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 py-20 lg:py-32 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
                <span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">Proyojon Plus</span>
                <br />আপনার প্রয়োজনের সঠিক সমাধান
              </h1>
              <p className="text-lg text-gray-300 mb-8 leading-relaxed max-w-lg">
                মানসম্মত পণ্য ক্রয় করুন, রেফার করুন এবং আয় করুন।
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register" className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-indigo-900 font-bold rounded-xl hover:from-yellow-300 hover:to-orange-400 transition-all shadow-2xl shadow-yellow-500/30 flex items-center gap-2">
                  এখনই শুরু করুন <ArrowRight size={20} />
                </Link>
                <Link to="/packages" className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20">
                  প্যাকেজ দেখুন
                </Link>
              </div>
              <div className="flex items-center gap-8 mt-10">
                <div className="text-center"><p className="text-3xl font-bold text-yellow-400">৫+</p><p className="text-xs text-gray-400">জেনারেশন বোনাস</p></div>
                <div className="w-px h-10 bg-white/20" />
                <div className="text-center"><p className="text-3xl font-bold text-yellow-400">৩০%</p><p className="text-xs text-gray-400">ডেইলি ক্লাব</p></div>
                <div className="w-px h-10 bg-white/20" />
                <div className="text-center"><p className="text-3xl font-bold text-yellow-400">৫%</p><p className="text-xs text-gray-400">রেফার ইনকাম</p></div>
              </div>
            </div>

            {/* Package Cards */}
            <div className="relative mt-10 lg:mt-0">
              <div className="relative w-full aspect-square max-w-md mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-3xl rotate-6" />
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-3xl -rotate-3" />
                <div className="relative bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 h-full flex flex-col justify-center">
                  <div className="space-y-5">
                    {/* Customer — PV product */}
                    <div className="flex items-center gap-4 bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white">
                        <ShoppingBag size={22} />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">কাস্টমার প্যাকেজ</p>
                        <p className="text-yellow-300 font-bold text-xs">১,০০০ PV পণ্য কিনুন</p>
                      </div>
                    </div>
                    {/* Shareholder */}
                    <div className="flex items-center gap-4 bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white">
                        <Crown size={22} />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">শেয়ারহোল্ডার প্যাকেজ</p>
                        <p className="text-yellow-300 font-bold">৳৫,০০০ / ৫,০০০ SP</p>
                      </div>
                    </div>
                    {/* Gold */}
                    <div className="flex items-center gap-4 bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center text-white">
                        <Award size={22} />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">গোল্ড প্যাকেজ</p>
                        <p className="text-yellow-300 font-bold">৳৫,০০০+ / বিনিয়োগ অনুযায়ী GP</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Notice Board */}
      {notices.length > 0 && (
        <section className="bg-amber-50 border-t-4 border-amber-400">
          <div className="max-w-7xl mx-auto py-10 px-4">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-amber-800">📋 নোটিশ বোর্ড</h2>
              <p className="text-amber-600 text-sm mt-1">সর্বশেষ বিজ্ঞপ্তি</p>
            </div>
            <div className="space-y-3">
              {notices.map((n) => (
                <div key={n.id} className="bg-white rounded-xl border border-amber-200 px-5 py-4 flex items-start justify-between gap-4 shadow-sm">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full mt-0.5 ${n.priority >= 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {n.priority >= 5 ? '🔴 জরুরি' : '🟢 সাধারণ'}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-sm leading-snug">{n.title}</p>
                      {n.content && (
                        <p className="text-gray-600 text-sm mt-1 leading-relaxed">{n.content}</p>
                      )}
                    </div>
                  </div>
                  <span className="flex-shrink-0 text-xs text-amber-700 font-medium whitespace-nowrap mt-0.5">
                    {new Date(n.created_at).toLocaleDateString('bn-BD')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Products */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">আমাদের পণ্য সমূহ</h2>
              <p className="text-gray-500">মানসম্মত পণ্য কিনুন ও PV পয়েন্ট অর্জন করুন</p>
            </div>
            <Link to="/shop" className="hidden md:flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700">
              সকল পণ্য <ChevronRight size={18} />
            </Link>
          </div>

          {collections.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-8">
              {collections.map(col => (
                <Link key={col.id} to={`/collections/${col.handle}`} className="px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium hover:bg-indigo-100">
                  {col.title}
                </Link>
              ))}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => <div key={i} className="bg-gray-100 rounded-2xl h-80 animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map(product => <ProductCard key={product.id} product={product} />)}
            </div>
          )}
        </div>
      </section>

      {/* Gallery */}
      {gallery.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">আমাদের গ্যালারি</h2>
              <p className="text-gray-500">Proyojon Plus এর মুহূর্তগুলো</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {gallery.map(item => (
                <button key={item.id} onClick={() => setLightboxImg(item.image_url)}
                  className="group relative rounded-2xl overflow-hidden aspect-[4/3] bg-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <img src={item.image_url} alt={item.caption || ''} className="w-full h-full object-cover" />
                  {item.caption && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <p className="text-white text-xs font-medium">{item.caption}</p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Lightbox */}
      {lightboxImg && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setLightboxImg(null)}>
          <img src={lightboxImg} alt="" className="max-w-full max-h-[90vh] rounded-2xl object-contain" onClick={e => e.stopPropagation()} />
          <button onClick={() => setLightboxImg(null)} className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl font-light">✕</button>
        </div>
      )}

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center relative">
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">আজই শুরু করুন আপনার সফলতার যাত্রা</h2>
          <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
            Proyojon Plus এ যোগ দিন, মানসম্মত পণ্য বিক্রি করুন এবং প্রতিদিন আয় করুন।
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register" className="px-10 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-indigo-900 font-bold rounded-xl hover:from-yellow-300 hover:to-orange-400 transition-all shadow-2xl shadow-yellow-500/30 text-lg">
              বিনামূল্যে রেজিস্ট্রেশন করুন
            </Link>
            <Link to="/login" className="px-10 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20 text-lg">
              লগইন করুন
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}