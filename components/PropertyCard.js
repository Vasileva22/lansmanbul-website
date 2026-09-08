import { useState, useEffect } from 'react';
import Link from 'next/link';

// --- ДОПОЛНЕНИЕ: Иконки транспорта ---
const transportIcons = {
  walk: <span className="text-base mr-1">🚶</span>,
  drive: <span className="text-base mr-1">🚗</span>
};

// --- ДОПОЛНЕНИЕ: Парсинг новой строки локаций ---
const parseLocationData = (str) => {
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
  const parseJsonbPhotos = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(val => typeof val === 'string' && val.trim() !== '' && val !== 'EMPTY');
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return parsed.filter(val => typeof val === 'string' && val.trim() !== '' && val !== 'EMPTY');
        } catch (e) { console.error("JSON error:", e); }
      }
      return trimmed.split(/[\s,]+/).filter(val => val !== '' && val !== 'EMPTY');
    }
    return [];
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
    if (typeof window === 'undefined' || !property?.id) return;
    const favs = JSON.parse(localStorage.getItem('kb-favorites') || '[]');
    const updatedFavs = favs.includes(property.id) ? favs.filter(id => id !== property.id) : [...favs, property.id];
    setIsFavorite(!favs.includes(property.id));
    localStorage.setItem('kb-favorites', JSON.stringify(updatedFavs));
    window.dispatchEvent(new Event('favorites-updated'));
  };

  const nextSlide = (e) => { e.preventDefault(); e.stopPropagation(); if (photos.length > 1) setCurrentSlide((prev) => (prev + 1) % photos.length); };
  const prevSlide = (e) => { e.preventDefault(); e.stopPropagation(); if (photos.length > 1) setCurrentSlide((prev) => (prev - 1 + photos.length) % photos.length); };

  const layouts = (() => {
    if (!property?.layouts) return [];
    if (Array.isArray(property.layouts)) return property.layouts;
    if (typeof property.layouts === 'string') { try { return JSON.parse(property.layouts); } catch (e) { return []; } }
    return [];
  })();

  const isProject = property?.is_project === true;

  const formatPrice = (val, isStartPrice = false) => {
    if (!val) return "";
    const num = typeof val === 'number' ? val : parseInt(String(val).replace(/\D/g, ''));
    if (isNaN(num) || num === 0) return val;
    const formatted = num.toLocaleString('tr-TR') + " TL";
    return isStartPrice ? `${formatted}'den` : formatted;
  };

  let cardRooms = property?.['card odalar'] || '';
  let cardArea = property?.['card-area'] || '';
  let cardPrice = formatPrice(property?.Fiyat, isProject);

  if (isProject && layouts.length > 0) {
    const activeRoomFilter = selectedRooms.length === 1 ? selectedRooms[0] : null;
    if (activeRoomFilter) {
      const matchedLayout = layouts.find(l => String(l.rooms).trim() === activeRoomFilter.trim());
      if (matchedLayout) {
        cardRooms = matchedLayout.rooms;
        cardArea = `${matchedLayout.area} m²'den`;
        cardPrice = formatPrice(matchedLayout.price, true);
      }
    } else {
      const validRooms = layouts.map(l => l.rooms).filter(Boolean);
      cardRooms = validRooms[0] && validRooms[validRooms.length - 1] && validRooms[0] !== validRooms[validRooms.length - 1] 
        ? `${validRooms[0]} — ${validRooms[validRooms.length - 1]}` : (validRooms[0] || cardRooms);
      const areas = layouts.map(l => parseInt(l.area)).filter(Boolean);
      if (areas.length > 0) cardArea = Math.min(...areas) !== Math.max(...areas) ? `${Math.min(...areas)}–${Math.max(...areas)}` : `${Math.min(...areas)}`;
      const prices = layouts.map(l => parseInt(String(l.price).replace(/\D/g, ''))).filter(Boolean);
      if (prices.length > 0) cardPrice = Math.min(...prices) !== Math.max(...prices) ? `${formatPrice(Math.min(...prices))} - ${formatPrice(Math.max(...prices))}` : formatPrice(Math.min(...prices), true);
    }
  }

  const olanaklarList = property?.Özellikler ? (Array.isArray(property.Özellikler) ? property.Özellikler : property.Özellikler.split(/[\/,]/).map(s => s.trim()).filter(Boolean)) : [];

  const waRaw = property?.WhatsApp;
  const finalWaLink = (waRaw && String(waRaw).startsWith('http')) ? waRaw : 'https://wa.me/' + (waRaw ? String(waRaw).replace(/\D/g, '') : "905459418536");
  const detailLink = '/properties/' + property?.id + (selectedRooms.length === 1 ? `?room=${encodeURIComponent(selectedRooms[0])}` : '');

  return (
    <div className="custom-card" data-id={property?.id}>
      <div className="img-container relative" onClick={() => onImageClick && onImageClick(photos, currentSlide)}>
        <button className={`absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center transition-all ${isFavorite ? 'bg-white' : ''}`} onClick={toggleFavorite}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill={isFavorite ? "#EF4444" : "none"} stroke={isFavorite ? "#EF4444" : "#ffffff"} strokeWidth="2.5"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        </button>

        <div className="slider-track" style={{ transform: 'translateX(-' + (currentSlide * 100) + '%)' }}>
          {photos.length > 0 ? photos.map((url, idx) => (
            <div key={idx} className="slider-item relative h-full w-full">
              {/* --- ИСПРАВЛЕНИЕ:referrerPolicy оживляет фото --- */}
              <img src={url} referrerPolicy="no-referrer" className="absolute inset-0 w-full h-full object-cover" alt="Proje" />
            </div>
          )) : (
            <div className="slider-item" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=600&q=80')" }}></div>
          )}
        </div>

        {property?.konutcesit && <span className={'badge ' + (property.konutcesit.toLowerCase() === "lansman" ? 'status-lansman' : 'status-other')}>{property.konutcesit}</span>}
        {photos.length > 1 && <><button className="slider-arrow arrow-left" onClick={prevSlide}>❮</button><button className="slider-arrow arrow-right" onClick={nextSlide}>❯</button></>}
      </div>

      <div className="card-content">
        <div className="title-price-row">
          <h3 className="card-title">{property?.testproje || ''}</h3>
          <div className="card-price">{cardPrice}</div>
        </div>

        <p className="card-description line-clamp-2" style={{ display: 'block', fontSize: '12px', color: '#64748B', marginBottom: '8px' }}>
          {property?.Açıklama || "Detaylı bilgi için iletişime geçin."}
        </p>

        <div className="features-row">
          <div className="feat-badge">📍 {property?.district || property?.['İlçe/Semt'] || ''}</div>
          <div className="feat-badge">🛏 {cardRooms}</div>
          {cardArea && <div className="feat-badge">📐 {cardArea} m²</div>}
        </div>

        {/* --- ДОПОЛНЕНИЕ: Локации с иконками и Карта --- */}
        <div className="location-points mt-3 border-t border-slate-100 pt-2">
          <div className="flex flex-wrap gap-2">
            {parseLocationData(property?.['Konum Mesafeler']).map((poi, idx) => (
              <div key={idx} className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded text-[10px] text-slate-600">
                {transportIcons[poi.type]} <strong>{poi.name}:</strong> {poi.time}
              </div>
            ))}
          </div>
          {property?.latitude && property?.longitude && (
            <a href={`https://yandex.com.tr/harita/?ll=${property.longitude},${property.latitude}&z=16&pt=${property.longitude},${property.latitude},pm2rdl`} 
               target="_blank" className="inline-block mt-2 text-[10px] text-blue-600 font-bold uppercase hover:underline">
              📍 Haritada Göster (Yandex)
            </a>
          )}
        </div>

        <div className="actions mt-4">
          <Link href={detailLink} className="btn btn-outline detay-btn flex-1">Detaylar</Link>
          <a href={finalWaLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary wa-btn flex-1">WhatsApp</a>
        </div>
      </div>
    </div>
  );
}
