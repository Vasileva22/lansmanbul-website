import React, { useState, useEffect, useRef } from 'react'

// Распределение цветов по веткам метро Турции (M1-M11)
function getMetroColor(stationName) {
  if (!stationName) return '#E11D48'; 
  const name = stationName.toLowerCase().trim();
  
  if (name.includes('m1')) return '#E11D48'; 
  if (name.includes('m2') || name.includes('taksim') || name.includes('levent') || name.includes('şişli')) return '#10B981'; 
  if (name.includes('m3')) return '#0EA5E9'; 
  if (name.includes('m4') || name.includes('kadıköy') || name.includes('kartal')) return '#EC4899'; 
  if (name.includes('m5') || name.includes('üsküdar') || name.includes('altunizade')) return '#8B5CF6'; 
  if (name.includes('m7') || name.includes('mecidiyeköy')) return '#06B6D4'; 
  if (name.includes('m8')) return '#6366F1'; 
  if (name.includes('m11')) return '#D946EF'; 
  
  return '#E11D48'; 
}

// Умный выбор POI с поддержкой обратной совместимости
function getBestPoiBadge(property) {
  let poiPayload = property?.poi_data;
  if (!poiPayload) return null;

  if (typeof poiPayload === 'string') {
    try {
      poiPayload = JSON.parse(poiPayload);
    } catch (e) {
      console.error("Ошибка чтения poi_data:", e);
      return null;
    }
  }

  // Сценарий 1: Берем строго готовый featured_poi, рассчитанный на бэкенде
  if (poiPayload.featured_poi && poiPayload.featured_poi.name) {
    return {
      name: poiPayload.featured_poi.name,
      time: poiPayload.featured_poi.travel_time_minutes,
      mode: poiPayload.featured_poi.travel_mode,
      type: poiPayload.featured_poi.type
    };
  }

  // Сценарий 2 (Обратная совместимость): Если бэкенд еще не запускался, фильтруем на клиенте
  const pois = poiPayload.pois || {};
  if (Array.isArray(pois) || Object.keys(pois).length === 0) return null;

  const city = (property?.city || 'istanbul').toLowerCase().trim();
  const isResortCity = ['antalya', 'mugla', 'bodrum', 'fethiye', 'alanya', 'kas', 'kemer'].includes(city);

  const allowedPois = Object.entries(pois).filter(([type, poi]) => {
    if (!poi || poi.raw_score <= 0) return false;
    const transportTypes = ['metro', 'metrobus', 'marmaray', 'tram', 'ferry', 'bus', 'dolmus'];
    
    if (isResortCity) {
      return type.toLowerCase() === 'beach' || transportTypes.includes(type.toLowerCase());
    } else {
      return transportTypes.includes(type.toLowerCase());
    }
  });

  if (allowedPois.length === 0) return null;

  try {
    const best = allowedPois.reduce((prev, curr) => 
      prev[1].weighted_score > curr[1].weighted_score ? prev : curr
    );

    return {
      name: best[1].name,
      time: best[1].travel_time_minutes,
      mode: best[1].travel_mode,
      type: best[0]
    };
  } catch (e) {
    console.error("Ошибка в getBestPoiBadge (fallback):", e);
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
  const pStatus = property?.status || property?.["konutcesit"] || '';
  const pAddress = property?.address || property?.adress || '';

  const poiBadge = getBestPoiBadge(property);

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
    if (numOnly === "" || numOnly === "0") return val;
    return Number(numOnly).toLocaleString('tr-TR').replace(/\./g, '\u00A0') + " TL";
  }

  const renderProximityIcon = (type) => {
    const iconStyle = { width: '15px', height: '15px', flexShrink: 0 };
    
    switch (type?.toLowerCase()) {
      case 'beach':
        return (
          <svg style={{ ...iconStyle, color: '#06B6D4' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M2 12c3 0 3-3 6-3s3 3 6 3 3-3 6-3 3 3 6 3" />
            <path d="M2 16c3 0 3-3 6-3s3 3 6 3 3-3 6-3 3 3 6 3" />
          </svg>
        )
      case 'ferry':
        return (
          <svg style={{ ...iconStyle, color: '#0EA5E9' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M2 17h20M2 13h20M5 13V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5" />
            <path d="M12 2v4" />
          </svg>
        )
      case 'bus':
      case 'dolmus':
        return (
          <svg style={{ ...iconStyle, color: '#4F46E5' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <circle cx="8" cy="18" r="1.5" />
            <circle cx="16" cy="18" r="1.5" />
            <path d="M6 8h12M6 13h12" />
          </svg>
        )
      case 'tram':
      case 'marmaray':
        return (
          <svg style={{ ...iconStyle, color: '#0284C7' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="4" y="3" width="16" height="15" rx="2" />
            <path d="M4 11h16M12 3v15M8 21l-2 3M16 21l2 3" />
          </svg>
        )
      case 'infrastructure':
      default:
        return (
          <svg style={{ ...iconStyle, color: '#64748B' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
          <img src={photos[currentIdx]} className="cian-img" alt="" />
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
        <div className="cian-price" title={formatPriceVal(pPrice)}>
          {formatPriceVal(pPrice)}
        </div>

        <div className="cian-specs">
          {[
            pRooms ? `${pRooms}` : null,
            pArea ? `${pArea} m²` : null,
            pFloor ? `${pFloor} Kat` : null
          ].filter(Boolean).join(' · ')}
        </div>
        
        <div className="cian-location">
          {poiBadge ? (
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '6px' }}>
              {poiBadge.type === 'metro' || poiBadge.type === 'metrobus' ? (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '18px',
                  height: '18px',
                  borderRadius: '3px',
                  backgroundColor: getMetroColor(poiBadge.name),
                  color: '#FFFFFF',
                  fontWeight: '900',
                  fontSize: '11px',
                  lineHeight: '1',
                  fontFamily: 'var(--font-main)',
                  flexShrink: 0
                }}>
                  {poiBadge.type === 'metrobus' ? 'MB' : 'M'}
                </span>
              ) : (
                renderProximityIcon(poiBadge.type)
              )}
              
              <span style={{
                color: '#1E293B',
                fontWeight: '500',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flexShrink: 1
              }} title={poiBadge.name}>
                {poiBadge.name}
              </span>

              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                color: '#64748B',
                fontSize: '15px',
                fontWeight: '500',
                flexShrink: 0
              }}>
                {poiBadge.mode === 'walking' ? (
                  <svg style={{ width: '14px', height: '14px', fill: 'currentColor' }} viewBox="0 0 24 24">
                    <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C15.6 11.7 18 13 18 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7" />
                  </svg>
                ) : (
                  <svg style={{ width: '14px', height: '14px', fill: 'currentColor' }} viewBox="0 0 24 24">
                    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.27-3.82c.14-.4.52-.68.96-.68h9.54c.44 0 .82.28.96.68L19 11H5z" />
                  </svg>
                )}
                <span>{poiBadge.time}</span>
              </span>
            </div>
          ) : pAddress ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }}>
              {renderProximityIcon('default')}
              <span style={{
                color: '#64748B',
                fontWeight: '500',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontSize: '15px'
              }} title={pAddress}>
                {pAddress}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
