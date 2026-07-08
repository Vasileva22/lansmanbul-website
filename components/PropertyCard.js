import React, { useState, useEffect, useRef } from 'react'

export default function PropertyCard({ property, isLiked, onToggleLike, onOpenLightbox }) {
  const [currentIdx, setCurrentImageIndex] = useState(0)
  const autoplayTimer = useRef(null)

  const photos = property?.images && property.images.length > 0 ? property.images : [
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=600&q=80'
  ]

  const handleMouseEnter = () => {
    if (photos.length <= 1) return
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
        onClick={(e) => onToggleLike && onToggleLike(e, property?.id)}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      </button>

      {/* Бейдж Статуса */}
      {property?.status && (
        <span className={"card-badge status-" + (property.status.toLowerCase() === "lansman" ? "lansman" : "other")}>
          {property.status}
        </span>
      )}

      {/* Контейнер картинки без лишних рамок */}
      <div 
        className="cian-img-container" 
        onClick={() => onOpenLightbox && onOpenLightbox(property, currentIdx)}
      >
        <img src={photos[currentIdx]} className="cian-img" alt={property?.title || ''} />
        
        {/* Ручные скрытые стрелочки */}
        {photos.length > 1 && (
          <>
            <button className="slider-arrow arrow-left" onClick={handlePrevPhoto}>❮</button>
            <button className="slider-arrow arrow-right" onClick={handleNextPhoto}>❯</button>
          </>
        )}
      </div>

      {/* Информация о проекте */}
      <div className="cian-info" onClick={() => onOpenLightbox && onOpenLightbox(property, currentIdx)}>
        <div>
          <div className="cian-price">{formatPriceVal(property?.price)}</div>
          <div className="cian-specs">
            {property?.rooms ? `${property.rooms} · ` : ''}
            {property?.area ? `${property.area} m²` : ''}
            {property?.kat_sayisi ? ` · ${property.kat_sayisi} Kat` : ''}
          </div>
        </div>
        <div>
          <div className="cian-location">
            <span className="cian-geo-dot cyan"></span>
            {property?.district || ''}
          </div>
          <div className="cian-address" title={property?.title + ", " + property?.description}>{property?.title || ''}</div>
        </div>
      </div>
    </div>
  )
}
