import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Youtube } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-gray-900 to-black text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center font-bold text-indigo-900 text-lg">
                P+
              </div>
              <span className="text-xl font-bold text-white">Proyojon Plus</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              প্রয়োজন প্লাস - আপনার প্রয়োজনের সঠিক সমাধান। মানসম্মত পণ্য ও সেবা নিয়ে আমরা আপনার পাশে।
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-lg">দ্রুত লিংক</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-sm hover:text-yellow-400 transition-colors">হোম</Link></li>
              <li><Link to="/shop" className="text-sm hover:text-yellow-400 transition-colors">শপ</Link></li>
              <li><Link to="/packages" className="text-sm hover:text-yellow-400 transition-colors">প্যাকেজ</Link></li>
              <li><Link to="/register" className="text-sm hover:text-yellow-400 transition-colors">রেজিস্ট্রেশন</Link></li>
              <li><Link to="/login" className="text-sm hover:text-yellow-400 transition-colors">লগইন</Link></li>
            </ul>
          </div>

          {/* Packages */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-lg">প্যাকেজ সমূহ</h3>
            <ul className="space-y-2">
              <li><Link to="/packages" className="text-sm hover:text-yellow-400 transition-colors">কাস্টমার প্যাকেজ - ১,০০০ PV</Link></li>
              <li><Link to="/packages" className="text-sm hover:text-yellow-400 transition-colors">শেয়ারহোল্ডার প্যাকেজ - ৫,০০০ PS</Link></li>
              <li><Link to="/packages" className="text-sm hover:text-yellow-400 transition-colors">গোল্ড প্যাকেজ - ১,০০,০০০ GP</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-lg">যোগাযোগ</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm">
                <Phone size={16} className="text-yellow-400" />
                <span>+৮৮০ ১৭০০-০০০০০০</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Mail size={16} className="text-yellow-400" />
                <span>info@proyojonplus24.com</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <MapPin size={16} className="text-yellow-400 mt-0.5" />
                <span>ঢাকা, বাংলাদেশ</span>
              </li>
            </ul>
            <div className="flex gap-3 mt-4">
              <a href="#" className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
                <Facebook size={18} />
              </a>
              <a href="#" className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-red-600 transition-colors">
                <Youtube size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Proyojon Plus. সর্বস্বত্ব সংরক্ষিত।
        </div>
      </div>
    </footer>
  );
}
