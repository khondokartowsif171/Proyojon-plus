import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { Search, SlidersHorizontal } from 'lucide-react';

export default function Shop() {
  const [products, setProducts] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      const [productsRes, collectionsRes] = await Promise.all([
        supabase.from('ecom_products').select('*').eq('status', 'active'),
        supabase.from('ecom_collections').select('*').eq('is_visible', true),
      ]);
      if (productsRes.data) {
        setProducts(productsRes.data);
        setFiltered(productsRes.data);
      }
      if (collectionsRes.data) setCollections(collectionsRes.data);
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    let result = [...products];

    if (search) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (selectedType !== 'all') {
      result = result.filter(p => p.product_type === selectedType);
    }

    if (sortBy === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'price-asc') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') result.sort((a, b) => b.price - a.price);
    else if (sortBy === 'pv-desc') result.sort((a, b) => (b.metadata?.pv_points || 0) - (a.metadata?.pv_points || 0));

    setFiltered(result);
  }, [search, sortBy, selectedType, products]);

  const productTypes = [...new Set(products.map(p => p.product_type).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-purple-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl lg:text-4xl font-bold mb-3">আমাদের পণ্য সমূহ</h1>
          <p className="text-gray-300">মানসম্মত পণ্য ক্রয় করুন এবং PV পয়েন্ট অর্জন করুন</p>
          <div className="mt-4 inline-flex items-center gap-2 bg-green-500/20 text-green-300 px-4 py-2 rounded-full text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            ফ্রি শিপিং সকল অর্ডারে
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="পণ্য খুঁজুন..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none bg-white"
            >
              <option value="all">সকল ক্যাটাগরি</option>
              {productTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none bg-white"
            >
              <option value="name">নাম অনুযায়ী</option>
              <option value="price-asc">দাম: কম থেকে বেশি</option>
              <option value="price-desc">দাম: বেশি থেকে কম</option>
              <option value="pv-desc">PV: বেশি থেকে কম</option>
            </select>
          </div>
        </div>

        {/* Results */}
        <p className="text-sm text-gray-500 mb-4">{filtered.length} টি পণ্য পাওয়া গেছে</p>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl h-80 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">কোন পণ্য পাওয়া যায়নি</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
