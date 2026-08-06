import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useLang } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { ShoppingCart, User, Menu, X, LogOut, LayoutDashboard, Store, ChevronDown } from 'lucide-react';

export default function Header({ isDashboard = false }: { isDashboard?: boolean }) {
  const { user, subAdminAccount, logout } = useAuth();
  const { cartCount } = useCart();
  const { lang, setLang, t } = useLang();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  const [shopDropdown, setShopDropdown] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);

  useEffect(() => {
    const fetchCollections = async () => {
      const { data } = await supabase
        .from('ecom_collections')
        .select('id, title, handle')
        .eq('is_visible', true);
      if (data) setCollections(data);
    };
    fetchCollections();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
    setUserDropdown(false);
  };

  const activeAccount = user || subAdminAccount;
  const accountName = user?.name || subAdminAccount?.name || 'Admin';
  const accountEmail = user?.email || subAdminAccount?.email || subAdminAccount?.phone || '';
  const isAnyAdmin = user?.role === 'admin' || !!subAdminAccount;

  return (
    <header className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 text-white shadow-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center font-bold text-indigo-900 text-lg shadow-lg group-hover:scale-110 transition-transform">
              P+
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              Proyojon Plus
            </span>
          </Link>

          {/* Desktop Nav */}
          {!isDashboard && (
            <nav className="hidden md:flex items-center gap-1">
              <Link to="/" className="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium">
                {t('home')}
              </Link>

              {/* Shop Dropdown */}
              <div className="relative" onMouseEnter={() => setShopDropdown(true)} onMouseLeave={() => setShopDropdown(false)}>
                <Link to="/shop" className="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium flex items-center gap-1">
                  <Store size={16} />
                  {t('shop')}
                  <ChevronDown size={14} />
                </Link>
                {shopDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white text-gray-800 rounded-xl shadow-2xl py-2 min-w-[200px] border border-gray-100">
                    {collections.map(col => (
                      <Link
                        key={col.id}
                        to={`/collections/${col.handle}`}
                        className="block px-4 py-2.5 hover:bg-indigo-50 text-sm transition-colors"
                        onClick={() => setShopDropdown(false)}
                      >
                        {col.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link to="/packages" className="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium">
                {t('packages')}
              </Link>
              <Link to="/gallery" className="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium">
                গ্যালারি
              </Link>
              <Link to="/about" className="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium">
                আমাদের পরিচয়
              </Link>
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Cart */}
            <Link to="/cart" className="relative p-2 rounded-lg hover:bg-white/10 transition-colors">
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User */}
            {activeAccount ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdown(!userDropdown)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-indigo-900 font-bold text-sm">
                    {accountName.charAt(0)}
                  </div>
                  <span className="hidden lg:block text-sm font-medium">{accountName}</span>
                  <ChevronDown size={14} />
                </button>
                {userDropdown && (
                  <div className="absolute right-0 top-full mt-1 bg-white text-gray-800 rounded-xl shadow-2xl py-2 min-w-[200px] border border-gray-100">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="font-semibold text-sm">{accountName}</p>
                      {accountEmail && <p className="text-xs text-gray-500">{accountEmail}</p>}
                      {user ? (
                        <p className="text-xs text-indigo-600 font-medium mt-1">
                          {t('balance')}: ৳{(user.current_balance || 0).toLocaleString()}
                        </p>
                      ) : (
                        <span className="inline-block text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold mt-1">
                          সাব এডমিন
                        </span>
                      )}
                    </div>
                    {isAnyAdmin ? (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2 px-4 py-2.5 hover:bg-indigo-50 text-sm transition-colors"
                        onClick={() => setUserDropdown(false)}
                      >
                        <LayoutDashboard size={16} />
                        এডমিন ড্যাশবোর্ড
                      </Link>
                    ) : (
                      <Link
                        to="/dashboard"
                        className="flex items-center gap-2 px-4 py-2.5 hover:bg-indigo-50 text-sm transition-colors"
                        onClick={() => setUserDropdown(false)}
                      >
                        <LayoutDashboard size={16} />
                        {t('dashboard')}
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2.5 hover:bg-red-50 text-sm transition-colors w-full text-left text-red-600 font-medium"
                    >
                      <LogOut size={16} />
                      {t('logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-white/10 transition-colors"
                >
                  {t('login')}
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-yellow-400 to-orange-500 text-indigo-900 rounded-lg hover:from-yellow-300 hover:to-orange-400 transition-all shadow-lg"
                >
                  {t('register')}
                </Link>
              </div>
            )}

            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold transition-all"
              title="Switch language"
            >
              {lang === 'bn' ? 'EN' : 'বাং'}
            </button>

            {/* Mobile menu */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-white/10 mt-2 pt-4 space-y-2">
            {!isDashboard && (
              <>
                <Link to="/" className="block px-3 py-2 rounded-lg hover:bg-white/10 text-sm" onClick={() => setMobileOpen(false)}>হোম</Link>
                <Link to="/shop" className="block px-3 py-2 rounded-lg hover:bg-white/10 text-sm" onClick={() => setMobileOpen(false)}>শপ</Link>
                {collections.map(col => (
                  <Link key={col.id} to={`/collections/${col.handle}`} className="block px-6 py-2 rounded-lg hover:bg-white/10 text-xs text-gray-300" onClick={() => setMobileOpen(false)}>
                    {col.title}
                  </Link>
                ))}
                <Link to="/packages" className="block px-3 py-2 rounded-lg hover:bg-white/10 text-sm" onClick={() => setMobileOpen(false)}>প্যাকেজ</Link>
                <Link to="/gallery" className="block px-3 py-2 rounded-lg hover:bg-white/10 text-sm" onClick={() => setMobileOpen(false)}>গ্যালারি</Link>
                <Link to="/about" className="block px-3 py-2 rounded-lg hover:bg-white/10 text-sm" onClick={() => setMobileOpen(false)}>আমাদের পরিচয়</Link>
              </>
            )}
          </div>
        )}
      </div>

      {/* Click outside to close dropdowns */}
      {(userDropdown || shopDropdown) && (
        <div className="fixed inset-0 z-[-1]" onClick={() => { setUserDropdown(false); setShopDropdown(false); }} />
      )}
    </header>
  );
}
