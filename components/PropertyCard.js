import React, { useState, useEffect, useRef } from 'react'

export default function PropertyCard({ property, isLiked, onToggleLike, onOpenLightbox }) {
  const [currentIdx, setCurrentImageIndex] = useState(0)
  const autoplayTimer = useRef(null)

  // Универсальный маппинг колонок (поддерживает любые вариации из Airtable и Supabase)
  const pId = property?.id || '';
  const pRooms = property?.["card odalar"] || property?.rooms || '';
  const pArea = property?.["card-area"] || property?.area || '';
  const pFloor = property?.["Kat Sayısı"] || property?.["Kat_Sayisi"] || property?.["katsayisi"] || property?.kat_sayisi || '';
  const pPrice = property?.["Fiyat"] || property?.price || '';
  const pDistrict = property?.["İlçe/Semt"] || property?.district || '';
  const pTitle = property?.["testproje"] || property?.title || '';
  const pStatus = property?.["konutcesit"] || property?.status || '';
  const pDescription = property?.["Açıklama"] || property?.description || '';

  // Умный поиск колонки с фотографиями в вашей базе данных
  const getPhotosFromDB = (item) => {
    if (!item) return [];
    const possibleKeys = ["Foto", "Kapak Fotoğrafı", "images", "Images", "photo", "photos", "Resim", "resim", "Görsel"];
    for (const key of possibleKeys) {
      if (item[key] !== undefined && item[key] !== null) {
        return item[key];
      }
    }
    return [];
  };

  let dbImages = getPhotosFromDB(property);
  if (typeof dbImages === 'string') {
    try {
      dbImages = JSON.parse(dbImages);
    } catch {
      dbImages = dbImages.split(',').map(s => s.trim()).filter(Boolean);
    }
  }

  const photoUrls = (Array.isArray(dbImages) ? dbImages : []).map(p => {
    if (!p) return '';
    if (typeof p === 'string') return p;
    return p.url || p.URL || (p.thumbnails?.large?.url) || '';
  }).filter(Boolean);

  // Если фото нет в вашей базе, выводим стильную пустую серую плашку, а не чужую виллу с бассейном
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
    return (numOnly === "" || numOnly === "0") ? val : Number(numOnly).toLocaleString('tr-TR') + " TL'den";
  }

  return (
    <div 
      className="cian-card"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Кнопка Лайка */}
      <button 
        className={"card-fav-btn" + (isLiked ? " liked" : "")}
        onClick={(e) => onToggleLike && onToggleLike(e, pId)}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      </button>

      {/* Бейдж Статуса */}
      {pStatus && (
        <span className={"card-badge status-" + (pStatus.toLowerCase() === "lansman" ? "lansman" : "other")}>
          {pStatus}
        </span>
      )}

      {/* Контейнер картинки */}
      <div 
        className="cian-img-container" 
        onClick={() => onOpenLightbox && onOpenLightbox(property, currentIdx)}
      >
        {hasPhotos ? (
          <img src={photos[currentIdx]} className="cian-img" alt={pTitle || ''} />
        ) : (
          <div style={{ width: '100%', height: '100%', backgroundColor: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#94a3b8' }}>
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span style={{ fontSize: '12px', fontWeight: '700' }}>Görsel Yok</span>
          </div>
        )}
        
        {hasPhotos && photos.length > 1 && (
          <>
            <button className="slider-arrow arrow-left" onClick={handlePrevPhoto}>❮</button>
            <button className="slider-arrow arrow-right" onClick={handleNextPhoto}>❯</button>
          </>
        )}
      </div>

      {/* Информация о проекте */}
      <div className="cian-info" onClick={() => onOpenLightbox && onOpenLightbox(property, currentIdx)}>
        <div>
          <div className="cian-price">{formatPriceVal(pPrice)}</div>
          <div className="cian-specs">
            {pRooms ? `${pRooms} · ` : ''}
            {pArea ? `${pArea} m²` : ''}
            {pFloor ? ` · ${pFloor} Kat` : ''}
          </div>
        </div>
        <div>
          <div className="cian-location">
            <span className="cian-geo-dot"></span>
            {pDistrict}
          </div>
          <div className="cian-address" title={pTitle + ", " + pDescription}>{pTitle}</div>
        </div>
      </div>
    </div>
  )
}
