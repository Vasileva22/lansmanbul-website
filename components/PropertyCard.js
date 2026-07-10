import React, { useState, useEffect, useRef } from 'react'

// Встроенный конфигуратор приоритетов по городам Турции для solo-разработчика
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

// Функция подбора самого привлекательного инфраструктурного объекта на основе приоритетов города
function getBestPoiBadge(property) {
  const poiData = property?.poi_data;
  
  // Если данных по POI нет или они пустые, возвращаем null
  if (!poiData || typeof poiData !== 'object' || Object.keys(poiData).length === 0) {
    return null;
  }

  const cityKey = (property?.city || 'default').toLowerCase().trim();
  const config = cityPoiPriorities[cityKey] || cityPoiPriorities['default'];

  // Идем строго по цепочке приоритетов города
  for (const category of config.priorities) {
    const poi = poiData[category];
    if (poi) {
      const modeText = poi.travel_mode === 'walking' ? 'yürüme' : 'araçla';
      
      // Если это пешая доступность в пределах нормы
      if (poi.travel_mode === 'walking' && poi.travel_time_minutes <= config.maxWalkingTimeMinutes) {
        return {
          text: `${poi.name}'na ${poi.travel_time_minutes} dk ${modeText}`,
          type: category
        };
      }
      
      // Если поездка на машине, но объект близко (до 15 минут)
      if (poi.travel_mode === 'driving' && poi.travel_time_minutes <= 15) {
        return {
          text: `${poi.name}'na ${poi.travel_time_minutes} dk ${modeText}`,
          type: category
        };
      }
    }
  }

  // Если приоритетные объекты далеко, выводим физически самый близкий из всех найденных
  try {
    const allPois = Object.entries(poiData);
    if (allPois.length > 0) {
      const closest = allPois.reduce((prev, curr) => 
        (prev[1].distance_meters < curr[1].distance_meters) ? prev : curr
      );
      const modeText = closest[1].travel_mode === 'walking' ? 'yürüme' : 'araçla';
      return {
        text: `${closest[1].name}'na ${closest[1].travel_time_minutes} dk ${modeText}`,
        type: closest[0]
      };
    }
  } catch (e) {
    console.error(e);
  }

  return null;
}

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

  // Получаем приоритетный бейдж преимуществ инфраструктуры
  const poiBadge = getBestPoiBadge(property);

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

  const renderProximityIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'transport':
      case 'metro':
        return (
          <svg className="input-icon-svg" style={{ width: '13px', height: '13px', color: '#EF4444' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="4" y="3" width="16" height="14" rx="2" />
            <path d="M4 11h16M12 3v8M8 17l-2 4M16 17l2 4" />
            <circle cx="8" cy="14" r="1" fill="currentColor" />
            <circle cx="16" cy="14" r="1" fill="currentColor" />
          </svg>
        )
      case 'leisure':
      case 'sea':
        return (
          <svg className="input-icon-svg" style={{ width: '13px', height: '13px', color: '#0284C7' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M2 12c3 0 3-3 6-3s3 3 6 3 3-3 6-3 3 3 6 3" />
            <path d="M2 16c3 0 3-3 6-3s3 3 6 3 3-3 6-3 3 3 6 3" />
          </svg>
        )
      case 'infrastructure':
      case 'business':
      case 'default':
      default:
        return (
          <svg className="input-icon-svg" style={{ width: '13px', height: '13px', color: 'var(--primary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        )
    }
  }

  return (
    <div 
      className="cian-card"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button 
        className={"card-fav-btn" + (isLiked ? " liked" : "")}
        onClick={(e) => onToggleLike && onToggleLike(e, pId)}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      </button>

      {pStatus && (
        <span className="card-status-badge">
          {pStatus}
        </span>
      )}

      <div 
        className="cian-img-container" 
        onClick={() => onOpenLightbox && onOpenLightbox(property, currentIdx)}
      >
        {hasPhotos ? (
          <img src={photos[currentIdx]} className="cian-img" alt={pTitle || ''} />
        ) : (
          <div style={{ width: '100%', height: '100%', backgroundColor: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#94a3b8' }}>
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
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

      <div className="cian-info" onClick={() => onOpenLightbox && onOpenLightbox(property, currentIdx)}>
        <div>
          {/* Цена: 22px, шрифт и жирность точно как в ЦИАН */}
          <div className="cian-price" title={formatPriceVal(pPrice)}>
            {formatPriceVal(pPrice)}
          </div>
          {/* Характеристики: Крупнее (14px) и контрастнее */}
          <div className="cian-specs">
            {pRooms ? `${pRooms} · ` : ''}
            {pArea ? `${pArea} m²` : ''}
            {pFloor ? ` · ${pFloor} Kat` : ''}
          </div>
        </div>
        
        <div>
          {/* Умная инфраструктура (POI) с авто-приоритетом по городам */}
          <div className="cian-location">
            {poiBadge ? (
              <>
                {renderProximityIcon(poiBadge.type)}
                <span style={{ marginLeft: '2px' }} title={poiBadge.text}>{poiBadge.text}</span>
              </>
            ) : pAddress ? (
              <>
                {renderProximityIcon('default')}
                <span style={{ marginLeft: '2px' }} title={pAddress}>{pAddress}</span>
              </>
            ) : null}
          </div>
          <div className="cian-address" title={pTitle}>{pTitle}</div>
        </div>
      </div>
    </div>
  )
}
