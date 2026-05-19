import React from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function About() {
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
            আমাদের পরিচয়
          </span>
          <h1 className="text-3xl lg:text-5xl font-extrabold text-white mb-4 leading-tight">
            আমাদের দর্শন ও লক্ষ্য
          </h1>
          <p className="text-gray-300 text-lg max-w-xl mx-auto">
            প্রয়োজন প্লাস — বাংলাদেশের প্রতিটি পরিবারের পাশে
          </p>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 via-purple-50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-indigo-100 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <span className="text-2xl">🔭</span>
              </div>
              <h3 className="text-2xl font-bold text-indigo-900 mb-4">আমাদের দর্শন (Vision)</h3>
              <p className="text-gray-600 leading-relaxed text-base">
                প্রয়োজন প্লাস স্বপ্ন দেখে এমন একটি বাংলাদেশের, যেখানে প্রতিটি পরিবার সাশ্রয়ী মূল্যে মানসম্পন্ন পণ্য পাবে এবং সামুদায়িক বাণিজ্যের মাধ্যমে টেকসই আয় করতে পারবে। আমরা বিশ্বাস করি, সঠিক সুযোগ পেলে বাংলাদেশের প্রতিটি মানুষ আর্থিক স্বাধীনতা অর্জন করতে সক্ষম।
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-purple-100 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-2xl font-bold text-purple-900 mb-4">আমাদের লক্ষ্য (Mission)</h3>
              <p className="text-gray-600 leading-relaxed text-base">
                আমাদের লক্ষ্য হলো বাংলাদেশের পরিবারগুলোকে ক্ষমতায়িত করা — উন্নতমানের ভোগ্যপণ্য সরবরাহের পাশাপাশি একটি স্বচ্ছ ও নৈতিক আয়ের সুযোগ তৈরি করা। দলগত প্রচেষ্টা, পারস্পরিক বিশ্বাস এবং সততার ভিত্তিতে আমরা গড়ে তুলছি এমন একটি নেটওয়ার্ক যেখানে প্রতিটি সদস্যের সাফল্যই আমাদের সাফল্য।
              </p>
            </div>
          </div>

          {/* Values */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10">
            {[
              { icon: '🤝', title: 'বিশ্বাস', desc: 'পারস্পরিক আস্থা ও সততা' },
              { icon: '💎', title: 'গুণমান', desc: 'সর্বোচ্চ মানের পণ্য' },
              { icon: '🌱', title: 'বিকাশ', desc: 'প্রতিটি সদস্যের উন্নতি' },
              { icon: '🇧🇩', title: 'দেশপ্রেম', desc: 'দেশীয় অর্থনীতি মজবুত' },
            ].map(v => (
              <div key={v.title} className="bg-white rounded-xl p-5 text-center shadow border border-gray-100">
                <div className="text-3xl mb-2">{v.icon}</div>
                <p className="font-bold text-gray-800 text-sm">{v.title}</p>
                <p className="text-gray-500 text-xs mt-1">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900">
        <h2 className="text-3xl font-bold text-white mb-4">আজই যোগ দিন</h2>
        <p className="text-indigo-200 mb-8 text-lg max-w-xl mx-auto">
          Proyojon Plus পরিবারের একজন সদস্য হয়ে আপনার আর্থিক স্বাধীনতার যাত্রা শুরু করুন
        </p>
        <Link to="/register" className="inline-block px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-indigo-900 font-bold rounded-xl text-lg hover:from-yellow-300 hover:to-orange-400 transition-all shadow-xl">
          রেজিস্ট্রেশন করুন
        </Link>
      </section>

      <Footer />
    </div>
  );
}
