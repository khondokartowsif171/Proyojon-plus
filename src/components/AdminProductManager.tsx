import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Plus, Save, X, Edit, Trash2, Upload, Image as ImageIcon,
  Search, Package, Eye, EyeOff, Loader2, AlertCircle, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface ProductForm {
  name: string;
  description: string;
  price: string;
  pv_points: string;
  sku: string;
  category_id: string;
  product_type: string;
  status: string;
  weight: string;
  inventory_qty: string;
  image_url: string;
}

const emptyForm: ProductForm = {
  name: '', description: '', price: '', pv_points: '', sku: '',
  category_id: '', product_type: '', status: 'active', weight: '',
  inventory_qty: '100', image_url: '',
};

function generateHandle(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .replace(/^-|-$/g, '')
    || 'product-' + Date.now();
}

interface Props {
  products: any[];
  categories: any[];
  onRefresh: () => void;
}

export default function AdminProductManager({ products, categories, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parentCategories = categories.filter(c => !c.parent_id);
  const getSubCategories = (parentId: string) => categories.filter(c => c.parent_id === parentId);

  // Build flat category list with hierarchy labels
  const categoryOptions: { id: string; name: string; isChild: boolean }[] = [];
  parentCategories.forEach(parent => {
    categoryOptions.push({ id: parent.id, name: parent.name, isChild: false });
    getSubCategories(parent.id).forEach(sub => {
      categoryOptions.push({ id: sub.id, name: `  └ ${sub.name}`, isChild: true });
    });
  });

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.product_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('শুধুমাত্র ইমেজ ফাইল আপলোড করুন');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('ফাইল সাইজ ৫MB এর বেশি হতে পারবে না');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        toast.error('ইমেজ আপলোড করতে সমস্যা: ' + error.message);
        setUploading(false);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      setForm(prev => ({ ...prev, image_url: publicUrl }));
      setPreviewImage(publicUrl);
      toast.success('ইমেজ আপলোড সফল!');
    } catch (err: any) {
      toast.error('ইমেজ আপলোড করতে সমস্যা: ' + err.message);
    }
    setUploading(false);
  };

  const handleOpenAdd = () => {
    setForm(emptyForm);
    setPreviewImage('');
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleOpenEdit = (product: any) => {
    const cat = categories.find(c => c.name === product.product_type);
    setForm({
      name: product.name || '',
      description: product.description || '',
      price: String(Math.round((product.price || 0) / 100)),
      pv_points: String(product.metadata?.pv_points || 0),
      sku: product.sku || '',
      category_id: cat?.id || '',
      product_type: product.product_type || '',
      status: product.status || 'active',
      weight: product.metadata?.weight || '',
      inventory_qty: String(product.inventory_qty || 0),
      image_url: product.images?.[0] || '',
    });
    setPreviewImage(product.images?.[0] || '');
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('পণ্যের নাম দিন'); return; }
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) { toast.error('সঠিক দাম দিন'); return; }
    if (!form.sku.trim()) { toast.error('SKU দিন'); return; }

    setLoading(true);

    // Determine product_type from selected category
    let productType = form.product_type;
    if (form.category_id) {
      const selectedCat = categories.find(c => c.id === form.category_id);
      if (selectedCat) {
        // If it's a subcategory, use parent name as product_type
        if (selectedCat.parent_id) {
          const parentCat = categories.find(c => c.id === selectedCat.parent_id);
          productType = parentCat?.name || selectedCat.name;
        } else {
          productType = selectedCat.name;
        }
      }
    }

    const priceInCents = Math.round(Number(form.price) * 100);
    const pvPoints = parseInt(form.pv_points) || 0;
    const handle = editingProduct?.handle || generateHandle(form.name);

    const productData: any = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: priceInCents,
      sku: form.sku.trim(),
      handle: handle,
      status: form.status,
      product_type: productType || null,
      inventory_qty: parseInt(form.inventory_qty) || 0,
      has_variants: false,
      images: form.image_url ? [form.image_url] : [],
      metadata: {
        pv_points: pvPoints,
        weight: form.weight || null,
        category_id: form.category_id || null,
      },
    };

    try {
      if (editingProduct) {
        // Update existing product
        const { error } = await supabase
          .from('ecom_products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) {
          // Handle unique handle conflict
          if (error.message.includes('duplicate') || error.message.includes('unique')) {
            productData.handle = handle + '-' + Date.now();
            const { error: retryError } = await supabase
              .from('ecom_products')
              .update(productData)
              .eq('id', editingProduct.id);
            if (retryError) throw retryError;
          } else {
            throw error;
          }
        }
        toast.success('পণ্য আপডেট সফল!');
      } else {
        // Insert new product
        const { error } = await supabase
          .from('ecom_products')
          .insert(productData);

        if (error) {
          // Handle unique handle conflict
          if (error.message.includes('duplicate') || error.message.includes('unique')) {
            productData.handle = handle + '-' + Date.now();
            const { error: retryError } = await supabase
              .from('ecom_products')
              .insert(productData);
            if (retryError) throw retryError;
          } else {
            throw error;
          }
        }
        toast.success('নতুন পণ্য যোগ করা হয়েছে!');
      }

      setShowForm(false);
      setEditingProduct(null);
      setForm(emptyForm);
      setPreviewImage('');
      onRefresh();
    } catch (err: any) {
      toast.error('সমস্যা হয়েছে: ' + err.message);
    }
    setLoading(false);
  };

  const handleDelete = async (productId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('ecom_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast.success('পণ্য মুছে ফেলা হয়েছে');
      setDeleteConfirm(null);
      onRefresh();
    } catch (err: any) {
      toast.error('মুছতে সমস্যা: ' + err.message);
    }
    setLoading(false);
  };

  const handleToggleStatus = async (product: any) => {
    const newStatus = product.status === 'active' ? 'archived' : 'active';
    await supabase.from('ecom_products').update({ status: newStatus }).eq('id', product.id);
    toast.success(newStatus === 'active' ? 'পণ্য সক্রিয় করা হয়েছে' : 'পণ্য নিষ্ক্রিয় করা হয়েছে');
    onRefresh();
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900">পণ্য ম্যানেজমেন্ট</h2>
          <p className="text-xs text-gray-500">মোট {products.length} টি পণ্য</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-200 transition-all"
        >
          <Plus size={16} /> নতুন পণ্য যোগ করুন
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="পণ্য খুঁজুন (নাম, SKU, ক্যাটাগরি)..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
        />
      </div>

      {/* Product Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 rounded-tl-xl">পণ্য</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">SKU</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">ক্যাটাগরি</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600">দাম</th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600">PV</th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600">স্টক</th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600">স্ট্যাটাস</th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 rounded-tr-xl">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400">
                  <Package size={40} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">কোন পণ্য পাওয়া যায়নি</p>
                </td>
              </tr>
            ) : (
              filteredProducts.map((product, idx) => (
                <tr key={product.id} className={`border-b border-gray-50 hover:bg-indigo-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <ImageIcon size={20} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate max-w-[200px]">{product.name}</p>
                        <p className="text-[10px] text-gray-400 truncate max-w-[200px]">{product.handle}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">{product.sku || '-'}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs text-gray-600">{product.product_type || '-'}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-bold text-gray-800">৳{((product.price || 0) / 100).toLocaleString()}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                      {product.metadata?.pv_points || 0}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-xs font-medium ${(product.inventory_qty || 0) > 0 ? 'text-blue-600' : 'text-red-500'}`}>
                      {product.inventory_qty || 0}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleToggleStatus(product)}
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                        product.status === 'active'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {product.status === 'active' ? <Eye size={12} /> : <EyeOff size={12} />}
                      {product.status === 'active' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(product)}
                        className="p-2 rounded-lg hover:bg-indigo-100 text-indigo-600 transition-colors"
                        title="এডিট"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(product.id)}
                        className="p-2 rounded-lg hover:bg-red-100 text-red-500 transition-colors"
                        title="মুছুন"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Product Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { setShowForm(false); setEditingProduct(null); }}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {editingProduct ? 'পণ্য এডিট করুন' : 'নতুন পণ্য যোগ করুন'}
                </h3>
                <p className="text-xs text-gray-500">সকল তথ্য সঠিকভাবে পূরণ করুন</p>
              </div>
              <button
                onClick={() => { setShowForm(false); setEditingProduct(null); }}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-5">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">পণ্যের ছবি</label>
                <div className="flex items-start gap-4">
                  <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden bg-gray-50 flex items-center justify-center flex-shrink-0">
                    {previewImage || form.image_url ? (
                      <img src={previewImage || form.image_url} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-gray-400">
                        <ImageIcon size={28} className="mx-auto mb-1" />
                        <p className="text-[10px]">ছবি নেই</p>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors disabled:opacity-50 w-full justify-center border border-indigo-200"
                    >
                      {uploading ? (
                        <><Loader2 size={16} className="animate-spin" /> আপলোড হচ্ছে...</>
                      ) : (
                        <><Upload size={16} /> ছবি আপলোড করুন</>
                      )}
                    </button>
                    <p className="text-[10px] text-gray-400">সর্বোচ্চ ৫MB, JPG/PNG/WebP</p>
                    <div>
                      <label className="text-[10px] text-gray-500 mb-0.5 block">অথবা ইমেজ URL দিন:</label>
                      <input
                        type="url"
                        value={form.image_url}
                        onChange={e => { setForm(prev => ({ ...prev, image_url: e.target.value })); setPreviewImage(e.target.value); }}
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Name & SKU */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">পণ্যের নাম <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="যেমন: নিম ফেস ওয়াশ"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">SKU <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={e => setForm(prev => ({ ...prev, sku: e.target.value.toUpperCase() }))}
                    placeholder="যেমন: NFW-001"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">বিবরণ</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="পণ্যের বিস্তারিত বিবরণ লিখুন..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none resize-none"
                />
              </div>

              {/* Price & PV */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">দাম (৳) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">৳</span>
                    <input
                      type="number"
                      value={form.price}
                      onChange={e => setForm(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="350"
                      min="0"
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">PV পয়েন্ট <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 font-bold text-xs">PV</span>
                    <input
                      type="number"
                      value={form.pv_points}
                      onChange={e => setForm(prev => ({ ...prev, pv_points: e.target.value }))}
                      placeholder="100"
                      min="0"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">স্টক সংখ্যা</label>
                  <input
                    type="number"
                    value={form.inventory_qty}
                    onChange={e => setForm(prev => ({ ...prev, inventory_qty: e.target.value }))}
                    placeholder="100"
                    min="0"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                </div>
              </div>

              {/* Category & Weight */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">ক্যাটাগরি</label>
                  <select
                    value={form.category_id}
                    onChange={e => setForm(prev => ({ ...prev, category_id: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none bg-white"
                  >
                    <option value="">ক্যাটাগরি নির্বাচন করুন</option>
                    {categoryOptions.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">ওজন / পরিমাণ</label>
                  <input
                    type="text"
                    value={form.weight}
                    onChange={e => setForm(prev => ({ ...prev, weight: e.target.value }))}
                    placeholder="যেমন: 200ml, 500g, 60 capsules"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">স্ট্যাটাস</label>
                <div className="flex gap-3">
                  {[
                    { value: 'active', label: 'সক্রিয়', color: 'bg-green-50 border-green-200 text-green-700' },
                    { value: 'draft', label: 'ড্রাফট', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
                    { value: 'archived', label: 'আর্কাইভ', color: 'bg-gray-50 border-gray-200 text-gray-600' },
                  ].map(s => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, status: s.value }))}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                        form.status === s.value
                          ? s.color + ' shadow-sm'
                          : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 rounded-b-2xl flex items-center justify-between">
              <button
                onClick={() => { setShowForm(false); setEditingProduct(null); }}
                className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                বাতিল
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 shadow-lg shadow-indigo-200 transition-all"
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> সেভ হচ্ছে...</>
                ) : (
                  <><Save size={16} /> {editingProduct ? 'আপডেট করুন' : 'পণ্য যোগ করুন'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={28} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">পণ্য মুছে ফেলবেন?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              এই পণ্যটি স্থায়ীভাবে মুছে ফেলা হবে। এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                বাতিল
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={loading}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {loading ? 'মুছছে...' : 'হ্যাঁ, মুছুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
