import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PropertyCard from '../components/PropertyCard';
import { supabase } from '../supabase';

export default function FavoritesPage() {
  const [favoriteProperties, setFavoriteProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Загружаем список избранного из localStorage и запрашиваем данные из Supabase
  const loadFavorites = async () => {
    if (typeof window === 'undefined') return;
    
    const favIds = JSON.parse(localStorage.getItem('kb-favorites') || '[]');
    
    if (favIds.length === 0) {
      setFavoriteProperties([]);
      setIsLoading(false);
      return;
    }

    try {
      // Запрашиваем только те проекты, чьи ID находятся в массиве избранного
      const { data, error } = await supabase
        .from('properties')
        .select('*, property_images(*)')
        .in('id', favIds);

      if (!error && data) {
        setFavoriteProperties(data);
      }
    } catch (err) {
      console.error("Error fetching favorites from Supabase:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();

    // Подписываемся на событие изменений, чтобы страница перерисовывалась, 
    // если пользователь убирает лайки прямо со страницы Избранного
    window.addEventListener('favorites-updated', loadFavorites);
    return () => {
      window.removeEventListener('favorites-updated', loadFavorites);
    };
  }, []);

  return (
    <>
      <Head>
        <title>Favori Projelerim | lansmanbul.com</title>
        <meta name="description" content="Kaydettiğiniz favori konut projeleri" />
      </Head>

      <Header setFilters={() => {}} />

      <main className="bg-slate-50 min-h-screen pt-28 pb-16 text-slate-800 antialiased font-mulish">
        <div className="max-w-[1440px] mx-auto px-6">
          
          {/* ЗАГОЛОВОК СТРАНИЦЫ */}
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-8">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-wide">
              Favori Projelerim
            </h1>
            <Link href="/" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition flex items-center gap-1">
              ◀ Tüm Projelere Dön
            </Link>
          </div>

          {/* КОНТЕНТ */}
          {isLoading ? (
            <div className="flex justify-center items-center py-24 text-slate-400">
              <span className="animate-pulse">Projeler yükleniyor...</span>
            </div>
          ) : favoriteProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favoriteProperties.map((property) => (
                <PropertyCard 
                  key={property.id} 
                  property={property} 
                  onImageClick={null} 
                />
              ))}
            </div>
          ) : (
            /* ЗАГЛУШКА, ЕСЛИ СПИСОК ПУСТ */
            <div className="text-center py-24 bg-white rounded-2xl border border-slate-100 shadow-sm max-w-lg mx-auto px-6">
              <div className="text-4xl mb-4">❤️</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Henüz favori proje eklemediniz</h3>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Beğendiğiniz konut projelerini kaydetmek için kartların üzerindeki kalp ikonuna tıklayabilirsiniz.
              </p>
              <Link href="/" className="px-6 py-3 bg-[#00A4A6] hover:bg-[#00898B] text-white rounded-xl font-bold transition inline-block">
                Projeleri Keşfet
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer setFilters={() => {}} />
    </>
  );
}
