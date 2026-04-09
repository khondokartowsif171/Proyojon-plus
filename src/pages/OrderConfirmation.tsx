import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';

export default function OrderConfirmation() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('id');
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    const { data: orderData } = await supabase
      .from('ecom_orders')
      .select('*')
      .eq('id', orderId)
      .single();
    if (orderData) setOrder(orderData);

    const { data: itemsData } = await supabase
      .from('ecom_order_items')
      .select('*')
      .eq('order_id', orderId);
    if (itemsData) setItems(itemsData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl p-10 shadow-sm border border-gray-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">অর্ডার সফল!</h1>
          <p className="text-gray-500 mb-8">আপনার অর্ডার সফলভাবে সম্পন্ন হয়েছে। ধন্যবাদ!</p>

          {order && (
            <div className="bg-gray-50 rounded-2xl p-6 text-left mb-8">
              <h2 className="font-bold text-gray-900 mb-4">অর্ডার বিবরণ</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">অর্ডার ID</span>
                  <span className="font-mono text-xs">{order.id.slice(0, 12)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">স্ট্যাটাস</span>
                  <span className="text-green-600 font-semibold">{order.status === 'paid' ? 'পরিশোধিত' : order.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">মোট</span>
                  <span className="font-bold text-indigo-700">৳{((order.total || 0) / 100).toLocaleString()}</span>
                </div>
              </div>

              {items.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="font-semibold text-sm mb-2">পণ্য সমূহ</h3>
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between py-1.5 text-sm">
                      <span className="text-gray-600">{item.product_name} x{item.quantity}</span>
                      <span className="font-medium">৳{((item.total || 0) / 100).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/shop"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <Package size={18} />
              আরও শপিং করুন
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              ড্যাশবোর্ডে যান
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
