import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { LogIn, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    if (result.success) {
      // Check if admin - redirect accordingly
      navigate('/dashboard');
    } else {
      setError(result.error || 'লগইন করতে সমস্যা হয়েছে');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <LogIn size={28} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">লগইন করুন</h1>
              <p className="text-gray-500 text-sm mt-2">আপনার একাউন্টে প্রবেশ করুন</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ইমেইল</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
                  placeholder="your@email.com" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">পাসওয়ার্ড</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm pr-12"
                    placeholder="আপনার পাসওয়ার্ড" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100">{error}</div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/30">
                {loading ? 'লগইন হচ্ছে...' : 'লগইন'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                একাউন্ট নেই?{' '}
                <Link to="/register" className="text-indigo-600 font-semibold hover:text-indigo-700">রেজিস্ট্রেশন করুন</Link>
              </p>
            </div>

            <div className="mt-4 text-center">
              <Link to="/admin/login" className="text-xs text-gray-400 hover:text-indigo-600 transition-colors">
                এডমিন লগইন
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
