import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Eye, EyeOff } from 'lucide-react';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const result = await login(email, password);
    if (result.success) {
      navigate('/admin');
    } else {
      setError(result.error || 'লগইন করতে সমস্যা হয়েছে');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-400 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-20 w-96 h-96 bg-purple-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-yellow-500/30">
              <Shield size={36} className="text-indigo-900" />
            </div>
            <h1 className="text-2xl font-bold text-white">এডমিন লগইন</h1>
            <p className="text-gray-400 text-sm mt-2">Proyojon Plus এডমিন প্যানেল</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">ইমেইল</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none text-sm"
                placeholder="admin@proyojonplus.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">পাসওয়ার্ড</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none text-sm pr-12"
                  placeholder="পাসওয়ার্ড" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 text-red-300 text-sm p-3 rounded-xl border border-red-500/30">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-indigo-900 font-bold rounded-xl hover:from-yellow-300 hover:to-orange-400 transition-all disabled:opacity-50 shadow-2xl shadow-yellow-500/30">
              {loading ? 'লগইন হচ্ছে...' : 'এডমিন লগইন'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-gray-400 hover:text-yellow-400 transition-colors">
              হোমপেজে ফিরে যান
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
