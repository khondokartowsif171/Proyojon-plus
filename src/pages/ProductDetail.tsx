import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/contexts/CartContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ShoppingCart, Minus, Plus, ArrowLeft, Truck, Shield, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductDetail() {
  const { handle } = useParams<{ handle: string }>();
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!handle) return;
      setLoading(true);
      const { data } = await supabase
        .from('ecom_products')
        .select('*, variants:ecom_product_variants(*)')
        .eq('handle', handle)
        .single();

      if (data) {
        setProduct(data);
      }
      setLoading(false);
    };
    fetchProduct();
  }, [handle]);

  const handleAddToCart = () => {
    if (!product) return;
    const pvPoints = product.metadata?.pv_points || 0;

    addToCart({
      product_id: product.id,
      name: product.name,
      sku: product.sku || product.handle,
      price: product.price,
      image: product.images?.[0],
      pv_points: pvPoints,
    }, quantity);
    toast.success(`${product.name} কার্টে যোগ করা হয়েছে`);
  };

  const getInStock = (): boolean => {
    if (!product) return false;
    if (product.inventory_qty == null) return true;
    return product.inventory_qty > 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-gray-100 rounded-2xl aspect-square animate-pulse" />
            <div className="space-y-4">
              <div className="bg-gray-100 h-8 rounded-lg w-3/4 animate-pulse" />
              <div className="bg-gray-100 h-6 rounded-lg w-1/4 animate-pulse" />
              <div className="bg-gray-100 h-24 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">পণ্য পাওয়া যায়নি</h1>
          <Link to="/shop" className="text-indigo-600 font-semibold hover:text-indigo-700">
            শপে ফিরে যান
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const inStock = getInStock();
  const pvPoints = product.metadata?.pv_points || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-sm text-gray-500">
          <Link to="/shop" className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
            <ArrowLeft size={16} />
            শপ
          </Link>
          <span>/</span>
          <span className="text-gray-700">{product.name}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Image */}
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
            <img
              src={product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'}
              alt={product.name}
              className="w-full aspect-square object-cover"
            />
          </div>

          {/* Details */}
          <div>
            {product.product_type && (
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                {product.product_type}
              </span>
            )}
            <h1 className="text-3xl font-bold text-gray-900 mt-3 mb-2">{product.name}</h1>
            
            <div className="flex items-center gap-4 mb-6">
              <span className="text-3xl font-extrabold text-indigo-700">
                ৳{(product.price / 100).toLocaleString()}
              </span>
              {pvPoints > 0 && (
                <span className="bg-green-100 text-green-700 text-sm font-bold px-3 py-1 rounded-full">
                  {pvPoints} PV পয়েন্ট
                </span>
              )}
            </div>

            <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>

            {/* Metadata */}
            {product.metadata && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
                {product.metadata.weight && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">পরিমাণ</span>
                    <span className="font-medium">{product.metadata.weight}</span>
                  </div>
                )}
                {product.metadata.pv_points && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">PV পয়েন্ট</span>
                    <span className="font-medium text-green-600">{product.metadata.pv_points}</span>
                  </div>
                )}
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-medium text-gray-700">পরিমাণ:</span>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:bg-gray-100 transition-colors"
                >
                  <Minus size={16} />
                </button>
                <span className="px-6 py-3 font-bold text-center min-w-[60px]">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-3 hover:bg-gray-100 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={!inStock}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-3 text-lg"
            >
              <ShoppingCart size={22} />
              {inStock ? 'কার্টে যোগ করুন' : 'স্টক শেষ'}
            </button>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              {[
                { icon: <Truck size={20} />, label: 'ফ্রি শিপিং' },
                { icon: <Shield size={20} />, label: 'গুণগত মান' },
                { icon: <RotateCcw size={20} />, label: 'রিটার্ন পলিসি' },
              ].map((f, i) => (
                <div key={i} className="text-center p-3 bg-gray-50 rounded-xl">
                  <div className="text-indigo-600 flex justify-center mb-1">{f.icon}</div>
                  <p className="text-xs text-gray-600 font-medium">{f.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
