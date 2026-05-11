import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Image, X } from 'lucide-react';

export default function Gallery() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('proyojon_gallery')
      .select('*')
      .eq('is_visible', true)
      .order('sort_order')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setItems(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-medium mb-3">
              <Image size={16} /> গ্যালারি
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">আমাদের গ্যালারি</h1>
            <p className="text-gray-500">Proyojon Plus এর মুহূর্তগুলো</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[4/3] rounded-2xl bg-gray-200 animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Image size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-lg">কোনো গ্যালারি ছবি নেই</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {items.map(item => (
                <button
                  key={item.id}
                  onClick={() => setLightboxImg(item.image_url)}
                  className="group relative rounded-2xl overflow-hidden aspect-[4/3] bg-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <img
                    src={item.image_url}
                    alt={item.caption || ''}
                    className="w-full h-full object-cover"
                  />
                  {item.caption && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <p className="text-white text-sm font-medium">{item.caption}</p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 rounded-full p-2"
            onClick={() => setLightboxImg(null)}
          >
            <X size={24} />
          </button>
          <img
            src={lightboxImg}
            alt=""
            className="max-w-full max-h-[90vh] rounded-xl shadow-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      <Footer />
    </div>
  );
}
