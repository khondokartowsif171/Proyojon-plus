import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { ArrowLeft } from 'lucide-react';

export default function CollectionPage() {
  const { handle } = useParams<{ handle: string }>();
  const [collection, setCollection] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollectionProducts = async () => {
      if (!handle) return;
      setLoading(true);

      const { data: collectionData } = await supabase
        .from('ecom_collections')
        .select('*')
        .eq('handle', handle)
        .single();

      if (!collectionData) {
        setLoading(false);
        return;
      }
      setCollection(collectionData);

      const { data: productLinks } = await supabase
        .from('ecom_product_collections')
        .select('product_id, position')
        .eq('collection_id', collectionData.id)
        .order('position');

      if (!productLinks || productLinks.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const productIds = productLinks.map(pl => pl.product_id);
      const { data: productsData } = await supabase
        .from('ecom_products')
        .select('*')
        .in('id', productIds)
        .eq('status', 'active');

      const sortedProducts = productIds
        .map(id => productsData?.find(p => p.id === id))
        .filter(Boolean);

      setProducts(sortedProducts as any[]);
      setLoading(false);
    };

    fetchCollectionProducts();
  }, [handle]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-purple-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <Link to="/shop" className="inline-flex items-center gap-1 text-gray-300 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft size={16} />
            সকল পণ্য
          </Link>
          <h1 className="text-3xl lg:text-4xl font-bold">
            {collection?.title || 'কালেকশন'}
          </h1>
          {collection?.description && (
            <p className="text-gray-300 mt-2">{collection.description}</p>
          )}
          <p className="text-gray-400 text-sm mt-2">{products.length} টি পণ্য</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl h-80 animate-pulse" />
            ))}
          </div>
        ) : !collection ? (
          <div className="text-center py-16">
            <h2 className="text-xl font-bold text-gray-600 mb-2">কালেকশন পাওয়া যায়নি</h2>
            <Link to="/shop" className="text-indigo-600 font-semibold">শপে ফিরে যান</Link>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">এই কালেকশনে কোন পণ্য নেই</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
