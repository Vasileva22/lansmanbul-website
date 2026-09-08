import { useState, useEffect } from 'react';
import Link from 'next/link';

// Иконки транспорта
const transportIcons = {
  walk: <span className="text-base mr-1">🚶</span>,
  drive: <span className="text-base mr-1">🚗</span>
};

// Парсинг локации "Место | Время | walk"
const parseLocationText = (str) => {
  if (!str || str === 'EMPTY' || str.includes('::')) return [];
  return str.split(',').map(item => {
    const parts = item.split('|');
    if (parts.length < 2) return null;
    return {
      name: parts[0]?.trim(),
      time: parts[1]?.trim(),
      type: parts[2]?.trim().toLowerCase() === 'drive' ? 'drive' : 'walk'
    };
  }).filter(Boolean);
};

export default function PropertyCard({ property, onImageClick, selectedRooms = [] }) {
  // Безопасный парсинг фото
  const parseJsonbPhotos = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(v => v !== 'EMPTY');
    if (typeof value === 'string' && value.startsWith('[')) {
      try { return JSON.parse(value).filter(v => v !== 'EMPTY'); } catch(e) { return []; }
    }
    return typeof value === 'string' ? value.split(/[\s,]+/).filter(v => v !== 'EMPTY') : [];
  };

  const photos = property?.property_images
    ? property.property_images.flatMap(img => parseJsonbPhotos(img?.image_url))
    : [];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !property?.id) return;
    const favs = JSON.parse(localStorage.getItem('kb-favorites') || '[]');
    setIsFavorite(favs.includes(property.id));
  }, [property?.id]);

  const toggleFavorite = (e) => {
    e.preventDefault(); e.stopPropagation();
    const favs = JSON.parse(localStorage.getItem('kb-favorites') || '[]');
    const updated = favs.includes(property.id) ? favs.filter(id => id !== property.id) : [...favs, property.id];
    localStorage.setItem('kb-favorites', JSON.stringify(updated));
    setIsFavorite(!isFavorite);
    window.dispatchEvent(new Event('favorites-updated'));
  };

  const nextSlide = (e) => { e.preventDefault(); e.stopPropagation(); setCurrentSlide((prev) => (prev + 1) % photos.length); };
  const prevSlide = (e) => { e.preventDefault(); e.stopPropagation(); setCurrentSlide((prev) => (prev - 1 + photos.length) % photos.length); };

  const formatPrice = (val, isStart = false) => {
    if (!val) return "";
    const num = typeof val === 'number' ? val : parseInt(String(val).replace(/\D/g, ''));
    if (isNaN(num) || num === 0) return val;
    return num.toLocaleString('tr-TR') + " TL" + (isStart ? "'den" : "");
  };

  const detailLink = '/properties/' + property?.id;

  return (
    <div className="custom-card shadow-lg rounded-xl overflow-hidden bg-white border border-slate-100 h-full flex flex-col">
      <div className="img-container relative h-64 overflow-hidden" onClick={() => onImageClick && onImageClick(photos, currentSlide)}>
        <button onClick={toggleFavorite} className={`absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all bg-black/30 backdrop-blur-sm ${isFavorite ? 'bg-white' : ''}`}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill={isFavorite ? "#EF4444" : "none"} stroke={isFavorite ? "#EF4444" : "white"} strokeWidth="2.5">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>

        <div className="slider-track flex h-full transition-transform duration-300" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
          {photos.length > 0 ? photos.map((url, idx) => (
            <div key={idx} className="slider-item relative flex-shrink-0 w-full h-full">
              <img src={url} alt="Proje" referrerPolicy="no-referrer" className="absolute inset-0 w-full h-full object-cover" />
            </div>
          )) : <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">Görsel Yok</div>}
        </div>

        {photos.length > 1 && (
          <><button className="slider-arrow arrow-left absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 text-white p-2 rounded-full" onClick={prevSlide}>❮</button>
          <button className="slider-arrow arrow-right absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 text-white p-2 rounded-full" onClick={nextSlide}>❯</button></>
        )}
      </div>

      <div className="card-content p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{property?.testproje}</h3>
          <div className="text-blue-600 font-bold text-sm whitespace-nowrap ml-2">
            {formatPrice(property?.Fiyat, true)}
          </div>
        </div>

        <p className="text-xs text-slate-500 mb-4 line-clamp-3 leading-relaxed">
          {property?.Açıklama || "Detaylı bilgi için iletişime geçin."}
        </p>

        {/* Блок локации с иконками */}
        <div className="location-points space-y-2 mb-4">
          <div className="flex flex-wrap gap-2">
            {parseLocationText(property?.['Konum Mesafeler']).map((poi, idx) => (
              <div key={idx} className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-2 py-1 rounded text-[10px]">
                {transportIcons[poi.type]} <span className="font-bold text-slate-700">{poi.name}</span> <span className="text-slate-400">{poi.time}</span>
              </div>
            ))}
          </div>
          {property?.latitude && property?.longitude && (
            <a href={`https://yandex.com.tr/harita/?ll=${property.longitude},${property.latitude}&z=16&pt=${property.longitude},${property.latitude},pm2rdl`} 
               target="_blank" className="text-[10px] text-blue-500 font-bold uppercase hover:underline">📍 Haritada Göster (Yandex)</a>
          )}
        </div>

        <div className="actions mt-auto pt-4 flex gap-2">
          <Link href={detailLink} className="flex-1 text-center py-2 border border-blue-600 text-blue-600 rounded-lg font-bold text-sm hover:bg-blue-50">Detaylar</Link>
          <a href={'https://wa.me/905459418536'} target="_blank" className="flex-1 text-center py-2 bg-emerald-500 text-white rounded-lg font-bold text-sm hover:bg-emerald-600">WhatsApp</a>
        </div>
      </div>
    </div>
  );
}
