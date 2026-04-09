import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, cartTotal, cartCount, totalPvPoints } = useCart();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">শপিং কার্ট ({cartCount} আইটেম)</h1>

        {cart.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-600 mb-2">আপনার কার্ট খালি</h2>
            <p className="text-gray-400 mb-6">পণ্য যোগ করতে শপে যান</p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              শপে যান <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map(item => (
                <div key={item.product_id + (item.variant_id || '')} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex gap-4">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded-xl"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-800">{item.name}</h3>
                        {item.variant_title && (
                          <p className="text-xs text-gray-500">{item.variant_title}</p>
                        )}
                        {item.pv_points && item.pv_points > 0 && (
                          <span className="text-xs text-green-600 font-medium">{item.pv_points} PV</span>
                        )}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product_id, item.variant_id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1, item.variant_id)}
                          className="p-2 hover:bg-gray-100 transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="px-4 py-2 font-medium text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1, item.variant_id)}
                          className="p-2 hover:bg-gray-100 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="font-bold text-indigo-700">
                        ৳{((item.price * item.quantity) / 100).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-fit sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4">অর্ডার সারাংশ</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">সাবটোটাল</span>
                  <span className="font-medium">৳{(cartTotal / 100).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">শিপিং</span>
                  <span className="font-medium text-green-600">ফ্রি</span>
                </div>
                {totalPvPoints > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">মোট PV পয়েন্ট</span>
                    <span className="font-bold text-green-600">{totalPvPoints} PV</span>
                  </div>
                )}
                <div className="border-t border-gray-100 pt-3 flex justify-between">
                  <span className="font-bold text-gray-900">মোট</span>
                  <span className="font-bold text-xl text-indigo-700">৳{(cartTotal / 100).toLocaleString()}</span>
                </div>
              </div>
              <Link
                to="/checkout"
                className="block text-center py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/30"
              >
                চেকআউট করুন
              </Link>
              <Link to="/shop" className="block text-center text-sm text-indigo-600 font-medium mt-3 hover:text-indigo-700">
                আরও শপিং করুন
              </Link>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
