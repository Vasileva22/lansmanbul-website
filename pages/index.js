import React, { useState, useEffect, useRef } from 'react'

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
  
  const pProxText = property?.proximity_text || '';
  const pProxType = property?.proximity_type || '';
  const pAddress = property?.address || property?.adress || '';

  // Подгружаем изображения из связи property_images
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
      case 'metro':
        return (
          <svg className="input-icon-svg" style={{ width: '13px', height: '13px', color: '#EF4444' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="4" y="3" width="16" height="14" rx="2" />
            <path d="M4 11h16M12 3v8M8 17l-2 4M16 17l2 4" />
            <circle cx="8" cy="14" r="1" fill="currentColor" />
            <circle cx="16" cy="14" r="1" fill="currentColor" />
          </svg>
        )
      case 'sea':
        return (
          <svg className="input-icon-svg" style={{ width: '13px', height: '13px', color: '#0284C7' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M2 12c3 0 3-3 6-3s3 3 6 3 3-3 6-3 3 3 6 3" />
            <path d="M2 16c3 0 3-3 6-3s3 3 6 3 3-3 6-3 3 3 6 3" />
          </svg>
        )
      case 'highway':
      case 'street':
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
      {/* Кнопка Лайка (40px * 40px) */}
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
        <span className="card-status-badge">
          {pStatus}
        </span>
      )}

      {/* Контейнер картинки (Ровно 51.2% от высоты адаптивной карточки) */}
      <div 
        className="cian-img-container" 
        onClick={() => onOpenLightbox && onOpenLightbox(property, currentIdx)}
      >
        {hasPhotos ? (
          <img src={photoUrls[currentIdx]} className="cian-img" alt={pTitle || ''} />
        ) : (
          <div style={{ width: '100%', height: '100%', backgroundColor: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#94a3b8' }}>
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span style={{ fontSize: '11px', fontWeight: '700' }}>Görsel Yok</span>
          </div>
        )}
        
        {hasPhotos && photoUrls.length > 1 && (
          <>
            <button className="slider-arrow arrow-left" onClick={handlePrevPhoto}>❮</button>
            <button className="slider-arrow arrow-right" onClick={handleNextPhoto}>❯</button>
          </>
        )}
      </div>

      {/* Текстовый блок (Ровно 48.8% от высоты адаптивной карточки) */}
      <div className="cian-info" onClick={() => onOpenLightbox && onOpenLightbox(property, currentIdx)}>
        <div>
          {/* Цена: 22px */}
          <div className="cian-price" title={formatPriceVal(pPrice)}>
            {formatPriceVal(pPrice)}
          </div>
          {/* Характеристики */}
          <div className="cian-specs">
            {pRooms ? `${pRooms} · ` : ''}
            {pArea ? `${pArea} m²` : ''}
            {pFloor ? ` · ${pFloor} Kat` : ''}
          </div>
        </div>
        
        <div>
          {/* Локация/Метро */}
          <div className="cian-location">
            {pProxText ? (
              <>
                {renderProximityIcon(pProxType)}
                <span style={{ marginLeft: '2px' }} title={pProxText}>{pProxText}</span>
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
