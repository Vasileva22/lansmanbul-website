import { useState } from 'react';
import Link from 'next/link';

export default function PropertyCard({ property }) {
  // 1. Безопасно получаем и фильтруем изображения проекта из связанной таблицы property_images
  const photos = property.property_images
    ? property.property_images.map(img => img.image_url).filter(Boolean)
    : [];

  // 2. Состояние для локального слайдера изображений в этой конкретной карточке
  const [currentSlide, setCurrentSlide] = useState(0);

  // Перелистывание слайдов
  const nextSlide = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (photos.length > 1) {
      setCurrentSlide((prev) => (prev + 1) % photos.length);
    }
  };

  const prevSlide = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (photos.length > 1) {
      setCurrentSlide((prev) => (prev - 1 + photos.length) % photos.length);
    }
  };

  // 3. Форматирование цены (например, "12.500.000 TL'den" на турецком)
  const formatPrice = (val) => {
    if (!val) return "";
    let numOnly = String(val).replace(/[^0-9]/g, "");
    return numOnly === "" || numOnly === "0"
      ? val
      : Number(numOnly).toLocaleString('tr-TR') + " TL'den";
  };

  // 4. Безопасно парсим строку с удобствами (Özellikler) из Supabase
  const parseFeatures = (featuresString) => {
    if (!featuresString) return [];
    if (Array.isArray(featuresString)) return featuresString;
    return featuresString
      .split(/[\/,]/)
      .map(s => s.trim())
      .filter(Boolean);
  };

  const olanaklarList = parseFeatures(property.Özellikler);

  // 5. Карта иконок удобств (SVGS) для карточки
  const iconMap = {
    havuz: (
      <svg className="card-svg-icon" viewBox="0 0 24 24">
        <path d="M2 19a3 3 0 0 0 6 0a3 3 0 0 0 6 0a3 3 0 0 0 6 0a3 3 0 0 0 2 0v-2a3 3 0 0 1-2 0a3 3 0 0 1-6 0a3 3 0 0 1-6 0a3 3 0 0 1-6 0a3 3 0 0 1-2 0v2zM2 13a3 3 0 0 0 6 0a3 3 0 0 0 6 0a3 3 0 0 0 6 0a3 3 0 0 0 2 0v-2a3 3 0 0 1-2 0a3 3 0 0 1-6 0a3 3 0 0 1-6 0a3 3 0 0 1-2 0v2z" />
      </svg>
    ),
    fitness: (
      <svg className="card-svg-icon" viewBox="0 0 24 24">
        <path d="M20.57 14.86L22 13.43l-1.43-1.43l-1.43 1.43l-3.57-3.57l1.43-1.43L15.57 7L14.14 8.43l-1.43-1.43l-2.14 2.14l1.43 1.43l-1.43 1.43l-3.57-3.57l1.43-1.43L5 5.57L3.57 7l1.43 1.43l-2.14 2.14L4.29 12l1.43-1.43l3.57 3.57l-1.43 1.43L9.29 17l1.43-1.43l1.43 1.43l2.14-2.14l-1.43-1.43l1.43-1.43l3.57 3.57l-1.43 1.43L18.29 20l1.43-1.43z" />
      </svg>
    ),
    otopark: (
      <svg className="card-svg-icon" viewBox="0 0 24 24">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-6 11h-3v4H8V6h5c1.66 0 3 1.34 3 3s-1.34 3-3 3zm0-5h-3v2h3c.55 0 1-.45 1-1s-.45-1-1-1z" />
      </svg>
    ),
    güvenlik: (
      <svg className="card-svg-icon" viewBox="0 0 24 24">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12c5.16-12 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
      </svg>
    ),
    'çocuk parkı': (
      <svg className="card-svg-icon" viewBox="0 0 24 24">
        <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2s-2-.9-2-2s.9-2 2-2zm9 7h-6v13h-2v-6h-2v-6H9V9H3V7h18v2z" />
      </svg>
    ),
    'site içerisinde': (
      <svg className="card-svg-icon" viewBox="0 0 24 24">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4 6h-2V7h2v2zm-5 0H8V7h2v2zm5 5h-2v-2h2v2zm-5 0H8v-2h2v2zm5 5h-2v-2h2v2zm-5 0H8v-2h2v2z" />
      </svg>
    ),
  };

  // Метод для получения SVG-иконки для конкретного удобства по совпадению ключевого слова
  const getOlanakIcon = (item) => {
    const norm = item.toLowerCase()
      .replace(/ı/g, 'i')
      .replace(/ş/g, 's')
      .replace(/ç/g, 'c')
      .replace(/ğ/g, 'g')
      .replace(/ö/g, 'o')
      .replace(/ü/g, 'u')
      .trim();
    
    // Проверяем частичное совпадение (например "havuz" или "açık havuz")
    for (let key in iconMap) {
      if (norm.includes(key)) return iconMap[key];
    }
    return null;
  };

  // 6. Формирование ссылки в WhatsApp
  const waRaw = property.WhatsApp;
  const finalWaLink = (waRaw && String(waRaw).startsWith('http'))
    ? waRaw
    : `https://wa.me/${waRaw ? String(waRaw).replace(/\D/g, '') : "905459418536"}`;

  // Ссылки на детальную страницу объекта (согласно Next.js dynamic routing)
  const detailLink = `/properties/${property.id}`;

  return (
    <div className="custom-card" data-id={property.id}>
      
      {/* 1. БЛОК СЛАЙДЕРА ИЗОБРАЖЕНИЙ С БЕЙДЖЕМ */}
      <div className="img-container">
        {photos.length > 0 ? (
          <div className="slider-track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
            {photos.map((url, idx) => (
              <div 
                key={idx} 
                className="slider-item" 
                style={{ backgroundImage: `url('${url}')` }}
              ></div>
            ))}
          </div>
        ) : (
          <div className="slider-track">
            <div 
              className="slider-item" 
              style={{ backgroundImage: `url('https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=600&q=80')` }}
            ></div>
          </div>
        )}

        {/* Бейдж Лансман/Другой статус */}
        {property.konutcesit && (
          <span className={`badge ${property.konutcesit.toLowerCase() === "lansman" ? "status-lansman" : "status-other"}`}>
            {property.konutcesit}
          </span>
        )}

        {/* Стрелки навигации слайдера (рендерим только если картинок больше одной) */}
        {photos.length > 1 && (
          <>
            <button className="slider-arrow arrow-left" onClick={prevSlide}>❮</button>
            <button className="slider-arrow arrow-right" onClick={nextSlide}>❯</button>
          </>
        )}
      </div>

      {/* 2. СОДЕРЖИМОЕ КАРТОЧКИ */}
      <div className="card-content">
        <div className="title-price-row">
          <h3 className="card-title">{property.testproje || ''}</h3>
          <div className="card-price">{formatPrice(property.Fiyat)}</div>
        </div>

        <p className="card-description">
          {property.Açıklama || "Detaylı bilgi ve randevu için lütfen bizimle iletişime geçin."}
        </p>

        {/* Технические особенности: Локация, Комнаты, Площадь */}
        <div className="features-row">
          <div className="feat-badge">
            <svg className="input-icon-svg icon-fill" viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: '#64748B' }}>
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            {property['İlçe/Semt'] || ''}
          </div>
          <div className="feat-badge">
            <svg className="input-icon-svg icon-fill" viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: '#64748B' }}>
              <path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z" />
            </svg>
            {property['card odalar'] || ''}
          </div>
          {property['card-area'] && (
            <div className="feat-badge">
              <svg className="card-svg-icon" viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: '#64748B' }}>
                <path d="M10.5 9h3v1.5h-3V9zm0 3h3v1.5h-3V12zm0 3h3v1.5h-3V15zM19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
              </svg>
              <span>{property['card-area']}</span>
              <span className="area-unit-grid" style={{ marginLeft: 2 }}>m²</span>
              <span className="area-unit-list" style={{ marginLeft: 2 }}>Metrekare</span>
            </div>
          )}
        </div>

        {/* Удобства объекта */}
        {olanaklarList.length > 0 && (
          <div className="olanaklar-row">
            {olanaklarList.map((item, idx) => {
              const icon = getOlanakIcon(item);
              return (
                <span key={idx} className="olanak-tag">
                  {icon}
                  {item}
                </span>
              );
            })}
          </div>
        )}

        {/* Действия: Детали и WhatsApp */}
        <div className="actions">
          <Link href={detailLink} className="btn btn-outline detay-btn">
            Detaylar
          </Link>
          <a href={finalWaLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary wa-btn">
            <svg className="wa-icon-svg" viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: 'currentColor', marginRight: 5 }}>
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.488 1.977 14.02 1.953 12.01 1.953c-5.439 0-9.865 4.371-9.87 9.8-.002 1.714.453 3.39 1.317 4.883l-.994 3.634 3.791-.983z" />
            </svg>
            WhatsApp
          </a>
        </div>
      </div>

    </div>
  );
}
