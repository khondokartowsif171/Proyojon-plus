import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Eye } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

interface ProductCardProps {
  product: any;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const price = product.price || 0;
  const pvPoints = product.metadata?.pv_points || 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      product_id: product.id,
      name: product.name,
      sku: product.sku || product.handle,
      price: price,
      image: product.images?.[0],
      pv_points: pvPoints,
    });
    toast.success(`${product.name} কার্টে যোগ করা হয়েছে`);
  };

  return (
    <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
      <Link to={`/product/${product.handle}`}>
        <div className="relative overflow-hidden aspect-square bg-gray-50">
          <img
            src={product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {pvPoints > 0 && (
            <div className="absolute top-3 left-3 bg-indigo-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {pvPoints} PV
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex gap-2">
              <button
                onClick={handleAddToCart}
                className="bg-white text-indigo-900 p-3 rounded-full shadow-lg hover:bg-indigo-600 hover:text-white transition-colors"
              >
                <ShoppingCart size={18} />
              </button>
              <Link
                to={`/product/${product.handle}`}
                className="bg-white text-indigo-900 p-3 rounded-full shadow-lg hover:bg-indigo-600 hover:text-white transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Eye size={18} />
              </Link>
            </div>
          </div>
        </div>
      </Link>
      <div className="p-4">
        <Link to={`/product/${product.handle}`}>
          <h3 className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
            {product.name}
          </h3>
        </Link>
        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{product.description}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-lg font-bold text-indigo-700">
            ৳{(price / 100).toLocaleString()}
          </span>
          <button
            onClick={handleAddToCart}
            className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            কার্টে যোগ করুন
          </button>
        </div>
      </div>
    </div>
  );
}
