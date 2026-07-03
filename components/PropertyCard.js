import { useState, useMemo } from 'react'
import Link from 'next/link'

const SVGS = {
  location: <svg className="input-icon-svg icon-fill" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>,
  bed: <svg className="input-icon-svg icon-fill" viewBox="0 0 24 24"><path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"/></svg>,
  ruler: <svg className="card-svg-icon" viewBox="0 0 24 24"><path d="M10.5 9h3v1.5h-3V9zm0 3h3v1.5h-3V12zm0 3h3v1.5h-3V15zM19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/></svg>,
  whatsapp: <svg className="wa-icon-svg" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.156 5.156 0 11.487 0c3.067.001 5.95 1.196 8.114 3.363 2.164 2.167 3.357 5.053 3.355 8.12-.003 6.325-5.157 11.48-11.485 11.48-1.999-.001-3.968-.521-5.71-1.513L0 24zm6.59-4.846c1.642.975 3.251 1.489 4.84 1.49 4.996 0 9.06-4.061 9.062-9.058 0-2.42-1.014-4.701-2.731-6.418C16.035 3.45 13.84 2.502 11.487 2.502 6.49 2.502 2.428 6.564 2.426 11.56c-.001 1.638.484 3.235 1.401 4.7l-.955 3.486 3.575-.937z"/></svg>,
  havuz: <svg className="card-svg-icon" viewBox="0 0 24 24"><path d="M2 19a3 3 0 0 0 6 0a3 3 0 0 0 6 0a3 3 0 0 0 6 0a3 3 0 0 0 2 0v-2a3 3 0 0 1-2 0a3 3 0 0 1-6 0a3 3 0 0 1-6 0a3 3 0 0 1-2 0v2zM2 13a3 3 0 0 0 6 0a3 3 0 0 0 6 0a3 3 0 0 0 6 0a3 3 0 0 0 2 0v-2a3 3 0 0 1-2 0a3 3 0 0 1-6 0a3 3 0 0 1-6 0a3 3 0 0 1-2 0v2z"/></svg>,
  fitness: <svg className="card-svg-icon" viewBox="0 0 24 24"><path d="M20.57 14.86L22 13.43l-1.43-1.43l-1.43 1.43l-3.57-3.57l1.43-1.43L15.57 7L14.14 8.43l-1.43-1.43l-2.14 2.14l1.43 1.43l-1.43 1.43l-3.57-3.57l1.43-1.43L5 5.57L3.57 7l1.43 1.43l-2.14 2.14L4.29 12l1.43-1.43l3.57 3.57l-1.43 1.43L9.29 17l1.43-1.43l1.43 1.43l2.14-2.14l-1.43-1.43l1.43-1.43l3.57 3.57l-1.43 1.43L18.29 20l1.43-1.43z"/></svg>,
  otopark: <svg className="card-svg-icon" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-6 11h-3v4H8V6h5c1.66 0 3 1.34 3 3s-1.34 3-3 3zm0-5h-3v2h3c.55 0 1-.45 1-1s-.45-1-1-1z"/></svg>,
  security: <svg className="card-svg-icon" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12c5.16-12 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>,
  playground: <svg className="card-svg-icon" viewBox="0 0 24 24"><path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2s-2-.9-2-2s.9-2 2-2zm9 7h-6v13h-2v-6h-2v-6H9V9H3V7h18v2z"/></svg>,
  complex: <svg className="card-svg-icon" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4 6h-2V7h2v2zm-5 0H8V7h2v2zm5 5h-2v-2h2v2zm-5 0H8v-2h2v2zm5 5h-2v-2h2v2zm-5 0H8v-2h2v2z"/></svg>,
  globe: <svg className="card-svg-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>,
}

const AMENITY_ICONS = {
  'havuz': SVGS.havuz,
  'fitness': SVGS.fitness,
  'spor salonu': SVGS.fitness,
  'otopark': SVGS.otopark,
  'güvenlik': SVGS.security,
  'çocuk parkı': SVGS.playground,
  'çocuk oyun alanı': SVGS.playground,
  'site içerisinde': SVGS.complex,
  'sauna': SVGS.globe,
  'hamam': SVGS.globe
}

const formatPrice = (val) => {
  if (!val) return "Fiyat Sorun"
  let numOnly = String(val).replace(/[^0-9]/g, "")
  return numOnly === "" || numOnly === "0" ? val : Number(numOnly).toLocaleString('tr-TR') + " TL'den"
}

export default function PropertyCard({ property, layout }) {
  const [currentSlide, setCurrentSlide] = useState(0)

  const photoUrls = useMemo(() => {
    let raw = property.images
    let list = Array.isArray(raw) ? raw : (typeof raw === 'string' ? raw.split(',') : [])
    return list.map(p => typeof p === 'object' ? (p.url || '') : String(p).trim()).filter(Boolean)
  }, [property.images])

  const handlePrev = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentSlide(prev => (prev === 0 ? photoUrls.length - 1 : prev - 1))
  }

  const handleNext = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentSlide(prev => (prev === photoUrls.length - 1 ? 0 : prev + 1))
  }

  const badgeColor = property.status?.toLowerCase() === 'lansman' ? '#FF9800' : 'var(--primary)'

  // ИСПРАВЛЕНО: Безопасное формирование ссылок вместо обратных кавычек
  const waCleanNum = property.whatsapp ? property.whatsapp.replace(/\D/g, "") : "905459418536"
  const waMsgText = "Merhaba, LansmanBul platformunda yer alan " + property.title + " projenizdeki " + (property.rooms || "daire") + " tipi ile ilgileniyorum. Bilgi alabilir miyim?"
  const waLink = "https://wa.me/" + waCleanNum + "?text=" + encodeURIComponent(waMsgText)

  return (
    <>
      <div className="custom-card" data-id={property.id}>
        <div className="img-container relative overflow-hidden h-[200px]">
          {photoUrls.length > 0 ? (
            <div className="w-full h-full relative group">
              <div 
                className="w-full h-full bg-cover bg-center transition-all duration-300"
                style={{ backgroundImage: "url('" + photoUrls[currentSlide] + "')" }}
              />
              {photoUrls.length > 1 && (
                <>
                  <button onClick={handlePrev} className="slider-arrow arrow-left">❮</button>
                  <button onClick={handleNext} className="slider-arrow arrow-right">❯</button>
                </>
              )}
            </div>
          ) : (
            <div 
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=600&q=80')" }}
            />
          )}
          
          {property.status && (
            <span 
              className="badge absolute top-3 left-3 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider z-10"
              style={{ backgroundColor: badgeColor }}
            >
              {property.status}
            </span>
          )}
        </div>

        <div className="card-content">
          <div className="title-price-row">
            <h3 className="card-title font-extrabold text-[#3F536C] text-lg leading-snug truncate">
              {property.title}
            </h3>
            <div className="card-price font-black text-[#00A4A6] text-xl">
              {formatPrice(property.price)}
            </div>
          </div>
          
          <p className="card-description text-sm text-gray-500 hidden">
            {property.description}
          </p>

          <div className="features-row">
            <div className="feat-badge">
              {SVGS.location} {property.district || 'Ankara'}
            </div>
            <div className="feat-badge">
              {SVGS.bed} {property.rooms || 'Belirtilmedi'}
            </div>
            {property.area > 0 && (
              <div className="feat-badge">
                {SVGS.ruler} {property.area} {layout === 'grid' ? 'm²' : 'Metrekare'}
              </div>
            )}
          </div>

          <div className="olanaklar-row">
            {property.amenities?.slice(0, 4).map((amenity, idx) => {
              const normKey = amenity.toLowerCase().replace(/ı/g,'i').replace(/ş/g,'s').replace(/ç/g,'c').replace(/ğ/g,'g').replace(/ö/g,'o').replace(/ü/g,'u').trim()
              const iconSvg = AMENITY_ICONS[normKey] || null
              return (
                <span key={idx} className="olanak-tag">
                  {iconSvg}
                  {amenity}
                </span>
              )
            })}
          </div>

          <div className="actions">
            <Link href={"/properties/" + property.id} className="btn btn-outline detay-btn">
              Detaylar
            </Link>
            <a 
              href={waLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-primary wa-btn"
            >
              {SVGS.whatsapp} WhatsApp
            </a>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: ".custom-card .slider-arrow { position: absolute !important; top: 50% !important; transform: translateY(-50%) !important; background: rgba(0, 164, 166, 0.85) !important; color: #fff !important; border: none !important; width: 34px !important; height: 34px !important; border-radius: 50% !important; cursor: pointer !important; opacity: 0.8 !important; transition: opacity 0.2s ease, background-color 0.2s ease !important; z-index: 99 !important; display: flex !important; align-items: center !important; justify-content: center !important; font-size: 15px !important; font-weight: 900 !important; user-select: none; } .custom-card .slider-arrow.arrow-left { left: 8px !important; } .custom-card .slider-arrow.arrow-right { right: 8px !important; } .custom-card:hover .slider-arrow { opacity: 1 !important; background: var(--primary) !important; } .card-svg-icon { width: 14px !important; height: 14px !important; fill: currentColor !important; display: inline-block !important; vertical-align: middle !important; margin-right: 5px !important; flex-shrink: 0 !important; }" }} />
    </>
  )
}
