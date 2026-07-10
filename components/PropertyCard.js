import React, { useState, useEffect, useRef } from 'react'

// 1. Конфигурация приоритетов городов в формате чистого JavaScript
const cityPoiPriorities = {
  istanbul: {
    priorities: ['transport', 'business', 'infrastructure', 'leisure'],
    maxWalkingTimeMinutes: 15,
  },
  antalya: {
    priorities: ['leisure', 'infrastructure', 'transport', 'business'],
    maxWalkingTimeMinutes: 20,
  },
  mugla: {
    priorities: ['leisure', 'infrastructure', 'transport', 'business'],
    maxWalkingTimeMinutes: 20,
  },
  ankara: {
    priorities: ['transport', 'infrastructure', 'business', 'leisure'],
    maxWalkingTimeMinutes: 15,
  },
  default: {
    priorities: ['infrastructure', 'transport', 'leisure', 'business'],
    maxWalkingTimeMinutes: 15,
  }
};

// Функция определения класса цвета для турецких линий метро
const getMetroColorClass = (stationName) => {
  if (!stationName) return 'text-emerald-600';
  const nameUpper = stationName.toUpperCase();
  
  if (nameUpper.includes('M1')) return 'text-red-600';
  if (nameUpper.includes('M2')) return 'text-green-600';
  if (nameUpper.includes('M3')) return 'text-sky-500';
  if (nameUpper.includes('M4')) return 'text-pink-600';
  if (nameUpper.includes('M5')) return 'text-purple-600';
  if (nameUpper.includes('M7')) return 'text-fuchsia-400';
  if (nameUpper.includes('M11')) return 'text-indigo-700';
  
  return 'text-emerald-600'; // Базовый цвет метро по умолчанию
};

// Функция очистки первой буквы "M" у метро, чтобы избежать дублирования "MM4"
const cleanPoiName = (name, category) => {
  if (!name) return '';
  if (category === 'transport') {
    // Регулярное выражение убирает букву "M" в начале строки, если за ней идет цифра
    return name.replace(/^M(\d)/i, '$1');
  }
  return name;
};

// 2. Вспомогательная функция для получения структурированных POI-данных
function getBestPoi(property) {
  const poiData = property?.poi_data;
  
  if (!poiData || typeof poiData !== 'object' || Object.keys(poiData).length === 0) {
    return null;
  }

  const cityKey = (property?.city || 'default').toLowerCase().trim();
  const config = cityPoiPriorities[cityKey] || cityPoiPriorities['default'];

  for (const category of config.priorities) {
    const poi = poiData[category];
    if (poi) {
      if (poi.travel_mode === 'walking' && poi.travel_time_minutes <= config.maxWalkingTimeMinutes) {
        return {
          name: poi.name,
          duration: poi.travel_time_minutes,
          category,
          travel_mode: poi.travel_mode
        };
      }
      
      if (poi.travel_mode === 'driving' && poi.travel_time_minutes <= 15) {
        return {
          name: poi.name,
          duration: poi.travel_time_minutes,
          category,
          travel_mode: poi.travel_mode
        };
      }
    }
  }

  try {
    const allPois = Object.entries(poiData);
    if (allPois.length > 0) {
      const closest = allPois.reduce((prev, curr) => 
        prev[1].distance_meters < curr[1].distance_meters ? prev : curr
      );
      return {
        name: closest[1].name,
        duration: closest[1].travel_time_minutes,
        category: closest[0],
        travel_mode: closest[1].travel_mode
      };
    }
  } catch (e) {
    console.error(e);
  }

  return null;
}

// 3. Сам компонент карточки
export default function PropertyCard({ property, isLiked, onToggleLike, onOpenLightbox }) {
  const [currentIdx, setCurrentImageIndex] = useState(0)
  const autoplayTimer = useRef(null)

  const pId = property?.id || '';
  const pRooms = property?.rooms || property?.["card odalar"] || '';
  const pArea = property?.area || property?.["card-area"] || '';
  const pFloor = property?.kat_sayisi || property?.["Kat Sayısı"] || '';
  const pPrice = property?.price || property?.["Fiyat"] || '';
  const pTitle = property?.title || property?.["testproje"] || '';
  const pStatus = property?.status || property?.["konutcesit"] || '';
  const pAddress = property?.address || property?.adress || '';

  // Получаем приоритетный объект инфраструктуры
  const poi = getBestPoi(property);

  // Изображения забираем из связанной таблицы property_images
  const imagesList = property?.property_images || [];
  const photoUrls = imagesList.map(img => img.image_url).filter(Boolean);

  const hasPhotos = photoUrls.length > 0;
  const photos = hasPhotos ? photoUrls : [''];

  const handleMouseEnter = () => {
    if (photos.length <= 1 || !hasPhotos) return
    autoplayTimer.current = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % photos.length)
    }, 2000)
  }

  const handleMouseLeave = () => {
    if (autoplayTimer.current) {
      clearInterval(autoplayTimer.current)
      autoplayTimer.current = null
    }
  }

  useEffect(() => {
    return () => {
      if (autoplayTimer.current) clearInterval(autoplayTimer.current)
    }
  }, [])

  const handleNextPhoto = (e) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev + 1) % photos.length)
  }

  const handlePrevPhoto = (e) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev + photos.length - 1) % photos.length)
  }

  const formatPriceVal = (val) => {
    if (!val) return "";
    let numOnly = String(val).replace(/[^0-9]/g, "");
    return (numOnly === "" || numOnly === "0") ? val : Number(numOnly).toLocaleString('tr-TR') + " TL";
  }

  // Форматируем параметры (комнаты, площадь, этаж) в одну красивую строку через среднюю точку
  const specsArray = [];
  if (pRooms) specsArray.push(pRooms);
  if (pArea) specsArray.push(`${pArea} m²`);
  if (pFloor) specsArray.push(`${pFloor} Kat`);
  const specsString = specsArray.join(' · ');

  return (
    <div 
      className="cian-card"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Кнопка "избранное" поверх фото */}
      <button 
        className={"card-fav-btn" + (isLiked ? " liked" : "")}
        onClick={(e) => onToggleLike && onToggleLike(e, pId)}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      </button>

      {/* Обертка контейнера с изображением */}
      <div 
        className="cian-img-container relative" 
        onClick={() => onOpenLightbox && onOpenLightbox(property, currentIdx)}
      >
        {/* Аккуратный тег-статус объекта исключительно в верхнем углу фотографии */}
        {pStatus && (
          <span className="absolute top-2.5 left-2.5 z-10 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-semibold px-2.5 py-1 rounded shadow-sm select-none">
            {pStatus}
          </span>
        )}

        {hasPhotos ? (
          <img src={photos[currentIdx]} className="cian-img" alt={pTitle || ''} />
        ) : (
          <div style={{ width: '100%', height: '100%', backgroundColor: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#94a3b8' }}>
            <svg viewBox="0 0 24 24" style={{ width: '32px', height: '32px' }} fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span style={{ fontSize: '11px', fontWeight: '700' }}>Görsel Yok</span>
          </div>
        )}
        
        {hasPhotos && photos.length > 1 && (
          <>
            <button className="slider-arrow arrow-left" onClick={handlePrevPhoto}>❮</button>
            <button className="slider-arrow arrow-right" onClick={handleNextPhoto}>❯</button>
          </>
        )}
      </div>

      {/* Контентная область под фото */}
      <div 
        className="cian-info p-4 flex flex-col gap-1 cursor-pointer" 
        onClick={() => onOpenLightbox && onOpenLightbox(property, currentIdx)}
      >
        {/* 1. Цена (крупная, четкая, снижена жирность) */}
        <div className="text-xl font-semibold text-gray-900 tracking-tight" title={formatPriceVal(pPrice)}>
          {formatPriceVal(pPrice)}
        </div>

        {/* 2. Основные параметры (ровно 16px) */}
        {specsString && (
          <div className="text-base font-normal text-gray-800 leading-tight">
            {specsString}
          </div>
        )}
        
        {/* 3. Строка инфраструктуры POI (ровно 16px) */}
        {poi ? (
          <div className="flex items-center text-base text-gray-800 gap-1.5 mt-0.5 truncate">
            {/* Иконки по категориям */}
            {poi.category === 'transport' ? (
              <span className={`font-black ${getMetroColorClass(poi.name)} shrink-0 leading-none select-none`}>
                M
              </span>
            ) : poi.category === 'leisure' ? (
              <span className="shrink-0 select-none">🌴</span>
            ) : (
              <svg viewBox="0 0 24 24" style={{ width: '15px', height: '15px', display: 'inline-block' }} className="text-emerald-600 shrink-0 fill-none stroke-current" strokeWidth="2.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            )}

            {/* Название станции / объекта (с очисткой дублирующей буквы M) */}
            <span className="truncate text-gray-800 font-medium" title={poi.name}>
              {cleanPoiName(poi.name, poi.category)}
            </span>

            {/* Иконка способа передвижения и только числовое значение минут */}
            <span className="inline-flex items-center gap-0.5 text-gray-400 shrink-0 ml-0.5">
              {poi.travel_mode === 'driving' ? (
                <svg viewBox="0 0 24 24" style={{ width: '15px', height: '15px', display: 'inline-block' }} className="fill-current">
                  <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" style={{ width: '15px', height: '15px', display: 'inline-block' }} className="fill-current">
                  <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 21.5h2.1l1.9-8.2 2.1 2v6.2h2v-7.5l-2.1-2 .6-3c1 1.15 2.41 1.9 4 1.9v-2c-1.15 0-2.17-.58-2.8-1.5l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.6.1-.9.2L6 8.3V13h2V9.6l1.8-.7z"/>
                </svg>
              )}
              <span className="text-gray-500 font-normal">{poi.duration}</span>
            </span>
          </div>
        ) : pAddress ? (
          /* Обычный адрес (если нет POI) */
          <div className="flex items-center text-base text-gray-500 gap-1.5 mt-0.5 truncate" title={pAddress}>
            <svg viewBox="0 0 24 24" style={{ width: '15px', height: '15px', display: 'inline-block' }} className="text-gray-400 shrink-0 fill-none stroke-current" strokeWidth="2.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="truncate">{pAddress}</span>
          </div>
        ) : null}

        {/* Название проекта / объявления (неяркий вспомогательный текст снизу) */}
        {pTitle && (
          <div className="text-sm text-gray-400 mt-0.5 truncate" title={pTitle}>
            {pTitle}
          </div>
        )}
      </div>
    </div>
  )
}
