```jsx
import React, { useState, useMemo } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { supabase } from '../../supabase'

// Переиспользуемые компоненты Шапки и Подвала
import Header from '../../components/Header'
import Footer from '../../components/Footer'

// Адаптер сопоставления полей из Supabase для детального отображения
const mapPropertyDetail = (item) => {
  if (!item) return null
  const f = item.fields || item
  return {
    id: item.id,
    title: f.title || f.testproje || '',
    price: f.price || f.Fiyat || 0,
    description: f.description || f["Açıklama"] || f.Aciklama || '',
    district: f.district || f["İlçe/Semt"] || '',
    rooms: f.rooms || f["card odalar"] || '',
    status: f.status || f.konutcesit || '',
    area: parseInt(f.area || f["card-area"]) || 0,
    images: f.images || f.Foto || f["Kapak Fotoğrafı"] || [],
    whatsapp: f.whatsapp || f.WhatsApp || '',
    amenities: f.amenities || f["Özellikler"] || [],
    coordinates: f.coordinates || f["Koordinat"] || '',
    kat_sayisi: parseInt(f.kat_sayisi || f["Kat Sayısı"] || f.Kat_Sayisi || f.KatSayisi) || 0,
    kredi: f.kredi || f["Kredi_Durumu"] || f.Kredi_Durumu || '',
    vade: f.vade || f["Vade_Secenegi"] || f.Vade_Secenegi || '',
    downPayment: f.downPayment || f["Ilk_Pesinat"] || f.Ilk_Pesinat || '',
    address: f.address || f["Tam Adres"] || '',
    distances: f.distances || f["Konum Mesafeler"] || '',
    mapLink: f.mapLink || f["Harita_Link"] || '',
    planPhoto: f.planPhoto || f["Planfoto"] || '',
    santiyePhotos: f.santiyePhotos || f["Santiye_Fotolari"] || f["Şantiye"] || f["Foto"] || [],
    santiyeTarihi: f.santiyeTarihi || f["Santiye Tarihi"] || f["Santiye_Tarihi"] || ''
  }
}

const getEmoji = (label) => {
  const lower = label.toLowerCase()
  if (lower.includes('metro') || lower.includes('tramvay') || lower.includes('istasyon')) return '🚇'
  if (lower.includes('park') || lower.includes('bahçe') || lower.includes('orman')) return '🌳'
  if (lower.includes('avm') || lower.includes('market') || lower.includes('mağaza') || lower.includes('alışveriş')) return '🛍️'
  if (lower.includes('hastane') || lower.includes('klinik') || lower.includes('tıp') || lower.includes('eczane')) return '🏥'
  if (lower.includes('okul') || lower.includes('kolej') || lower.includes('üniversite')) return '🎓'
  if (lower.includes('durak') || lower.includes('otobüs')) return '🚌'
  return '📍'
}

const getFeatureIcon = (feat) => {
  const lower = feat.toLowerCase().trim()
  if (lower.includes('havuz')) return '🏊‍♂️ '
  if (lower.includes('fitness') || lower.includes('spor') || lower.includes('salon')) return '🏋️‍♀️ '
  if (lower.includes('güvenlik') || lower.includes('guvenlik')) return '🛡️ '
  if (lower.includes('otopark') || lower.includes('park yeri')) return '🚗 '
  if (lower.includes('çocuk') || lower.includes('cocuk') || lower.includes('oyun') || lower.includes('parkı')) return '🛝 '
  if (lower.includes('site')) return '🏡 '
  if (lower.includes('asansör') || lower.includes('asansor')) return '🛗 '
  if (lower.includes('jeneratör') || lower.includes('jenerator')) return '⚡ '
  if (lower.includes('yeşil') || lower.includes('bahçe') || lower.includes('peyzaj')) return '🌳 ';
  if (lower.includes('sauna') || lower.includes('hamam')) return '🧖‍♀️ '
  return '✨ '
}

const formatPrice = (val) => {
  if (!val) return ""
  let numOnly = String(val).replace(/[^0-9]/g, "")
  return (numOnly === "" || numOnly === "0") ? val : Number(numOnly).toLocaleString('tr-TR') + " TL'den"
}

export default function PropertyDetail({ property, initialError }) {
  const router = useRouter()
  const [lightboxIndex, setLightboxIndex] = useState(null)

  if (router.isFallback) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-slate-500 font-bold animate-pulse">Yükleniyor...</p>
      </div>
    )
  }

  if (initialError || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <p className="text-red-500 font-bold">Öğe Bulunamadı</p>
          <p className="text-gray-500 text-sm mt-1">Aradığınız ilan mevcut olmayabilir veya silinmiş olabilir.</p>
          <button onClick={() => router.push('/')} className="mt-4 px-4 py-2 bg-[#00A4A6] text-white rounded-lg text-sm font-bold">
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    )
  }

  const p = mapPropertyDetail(property)

  const photoUrls = useMemo(() => {
    let raw = p.images
    let list = Array.isArray(raw) ? raw : (typeof raw === 'string' ? raw.split(',') : [])
    return list.map(img => typeof img === 'object' ? (img.url || '') : String(img).trim()).filter(Boolean)
  }, [p.images])

  const constructionUrls = useMemo(() => {
    let raw = p.santiyePhotos
    let list = Array.isArray(raw) ? raw : (typeof raw === 'string' ? raw.split(',') : [])
    return list.map(img => typeof img === 'object' ? (img.url || '') : String(img).trim()).filter(Boolean)
  }, [p.santiyePhotos])

  const parsedDistances = useMemo(() => {
    if (!p.distances) return []
    return p.distances.split(',').map(item => {
      const parts = item.split(':')
      if (parts.length === 2) {
        return { label: parts[0].trim(), value: parts[1].trim() }
      }
      return null
    }).filter(Boolean)
  }, [p.distances])

  const waNum = p.whatsapp ? p.whatsapp.replace(/\D/g, '') : "905459418536"
  const mainWaMessage = `Merhaba, LansmanBul platformunda yer alan ${p.title} projenizdeki ${p.rooms || 'daire'} tipi ile ilgileniyorum. Güncel boş kat listesini ve ödeme planını paylaşabilir misiniz?`
  const planWaMessage = `Merhaba, LansmanBul platformunda yer alan ${p.title} projenizin ${p.rooms || 'daire'} planı için hangi katların şu an müsait olduğunu öğrenebilir miyim?`

  const badgeColor = p.status?.toLowerCase() === 'lansman' ? '#FF9800' : '#00A4A6'

  const handlePhotoClick = (index) => {
    setLightboxIndex(index)
  }

  const handlePrevLightbox = (e) => {
    e.stopPropagation()
    setLightboxIndex(prev => (prev === 0 ? photoUrls.length - 1 : prev - 1))
  }

  const handleNextLightbox = (e) => {
    e.stopPropagation()
    setLightboxIndex(prev => (prev === photoUrls.length - 1 ? 0 : prev + 1))
  }

  return (
    <>
      <Head>
        <title>{p.title} — LansmanBul Proje Detayı</title>
        <meta name="description" content={`${p.title} projesi Çankaya/Ankara. Detaylı bilgi, fiyatlar, kat planları og ödeme seçenekleri.`} />
      </Head>

      <div className="projeland-card-container bg-gray-50 text-gray-800 antialiased min-h-screen relative pt-[90px] md:pt-[70px]">
        
        {/* ШАПКА */}
        <Header />

        <div className="max-w-7xl mx-auto px-4 py-8 fade-in">
          
          <header className="mb-6">
            <div className="flex justify-between items-start w-full gap-4">
              <div>
                {p.status && (
                  <div className="mb-2">
                    <span className="text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider inline-block" style={{ backgroundColor: badgeColor }}>
                      {p.status}
                    </span>
                  </div>
                )}
                <h1 className="text-3xl font-black text-gray-900 mt-2">{p.title}</h1>
                <p className="text-gray-500 mt-1 flex items-center gap-1 text-sm">
                  <svg className="w-4 h-4 text-[#00A4A6] shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  <span className="break-words max-w-full">{p.address || `${p.district || 'Ankara'}`}</span>
                </p>
              </div>
              
              <button onClick={() => router.push('/')} id="back-button" className="shrink-0 flex items-center gap-1 font-bold text-sm text-slate-500 hover:text-slate-900 transition">
                ◀ Kataloğa Dön
              </button>
            </div>
          </header>

          {/* ГАЛЕРЕЯ */}
          <section className="mb-8 overflow-hidden rounded-2xl shadow-sm">
            <div id="airbnb-gallery" className="airbnb-gallery w-full relative">
              {photoUrls.length === 1 && (
                <div className="gallery-layout-1">
                  <div onClick={() => handlePhotoClick(0)} className="gallery-item" style={{ backgroundImage: `url('${photoUrls[0]}')` }} />
                </div>
              )}

              {photoUrls.length === 2 && (
                <div className="gallery-layout-2">
                  <div onClick={() => handlePhotoClick(0)} className="gallery-item" style={{ backgroundImage: `url('${photoUrls[0]}')` }} />
                  <div onClick={() => handlePhotoClick(1)} className="gallery-item" style={{ backgroundImage: `url('${photoUrls[1]}')` }} />
                </div>
              )}

              {photoUrls.length === 3 && (
                <div className="gallery-layout-3">
                  <div onClick={() => handlePhotoClick(0)} className="gallery-item" style={{ backgroundImage: `url('${photoUrls[0]}')` }} />
                  <div onClick={() => handlePhotoClick(1)} className="gallery-item" style={{ backgroundImage: `url('${photoUrls[1]}')` }} />
                  <div onClick={() => handlePhotoClick(2)} className="gallery-item" style={{ backgroundImage: `url('${photoUrls[2]}')` }} />
                </div>
              )}

              {photoUrls.length === 4 && (
                <div className="gallery-layout-4">
                  <div onClick={() => handlePhotoClick(0)} className="gallery-item" style={{ backgroundImage: `url('${photoUrls[0]}')` }} />
                  <div onClick={() => handlePhotoClick(1)} className="gallery-item" style={{ backgroundImage: `url('${photoUrls[1]}')` }} />
                  <div onClick={() => handlePhotoClick(2)} className="gallery-item" style={{ backgroundImage: `url('${photoUrls[2]}')` }} />
                  <div onClick={() => handlePhotoClick(3)} className="gallery-item" style={{ backgroundImage: `url('${photoUrls[3]}')` }} />
                </div>
              )}

              {photoUrls.length >= 5 && (
                <div className="gallery-layout-5">
                  <div onClick={() => handlePhotoClick(0)} className="gallery-item gallery-item-main" style={{ backgroundImage: `url('${photoUrls[0]}')` }} />
                  <div onClick={() => handlePhotoClick(1)} className="gallery-item gallery-item-top-mid" style={{ backgroundImage: `url('${photoUrls[1]}')` }} />
                  <div onClick={() => handlePhotoClick(2)} className="gallery-item gallery-item-top-right" style={{ backgroundImage: `url('${photoUrls[2]}')` }} />
                  <div onClick={() => handlePhotoClick(3)} className="gallery-item gallery-item-bottom-mid" style={{ backgroundImage: `url('${photoUrls[3]}')` }} />
                  <div onClick={() => handlePhotoClick(4)} className="gallery-item gallery-item-bottom-right relative" style={{ backgroundImage: `url('${photoUrls[4]}')` }}>
                    {photoUrls.length > 5 && (
                      <div className="gallery-overlay" onClick={(e) => { e.stopPropagation(); handlePhotoClick(4); }}>
                        <span className="gallery-overlay-text">+{photoUrls.length - 4}</span>
                        <span className="gallery-overlay-subtext">Hepsini Gör</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ДВЕ КОЛОНКИ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            <div className="lg:col-span-2 space-y-8">
              
              {p.description && (
                <div id="block-desc" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h2>Proje Hakkında</h2>
                  <div id="project-desc" className="text-gray-600 leading-relaxed whitespace-pre-line break-words">
                    {p.description}
                  </div>
                  {p.amenities?.length > 0 && (
                    <div id="project-features" className="flex flex-wrap gap-2 mt-6">
                      {p.amenities.slice(0, 8).map((feat, idx) => (
                        <span key={idx} className="bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full inline-block whitespace-nowrap">
                          {getFeatureIcon(feat)}{feat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div id="block-location" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h2>Konum ve Mesafeler</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {p.mapLink ? (
                    <div id="project-map-container" className="w-full h-48 bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                      <iframe src={p.mapLink} width="100%" height="100%" style={{ border: 0 }} allowFullScreen="" loading="lazy"></iframe>
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-slate-100 rounded-xl flex items-center justify-center text-gray-400 text-xs">
                      Harita belirtilmedi.
                    </div>
                  )}
                  <div id="project-distances" className="space-y-3 justify-center flex flex-col">
                    {parsedDistances.length > 0 ? (
                      parsedDistances.slice(0, 5).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm border-b border-slate-50 pb-1">
                          <span className="text-gray-600 font-medium flex items-center gap-1.5">
                            <span className="text-base leading-none">{getEmoji(item.label)}</span>
                            <span>{item.label}</span>
                          </span>
                          <span className="text-[#00A4A6] font-bold">{item.value}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400 text-center">Uzaklık bilgileri belirtilmedi.</p>
                    )}
                  </div>
                </div>
              </div>

              {p.planPhoto && (
                <div id="block-plan" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h2>Kat ve Daire Planları</h2>
                  <p className="text-sm text-gray-500 mb-4">Aşağıdaki plandan daire içi yerleşim detaylarını inceleyebilirsiniz:</p>
                  <div className="border border-gray-100 rounded-xl p-4 flex flex-col items-center bg-gray-50">
                    <div id="project-plan-badge" className="mb-4">
                      <span className="bg-[#00A4A6] text-white text-xs font-bold px-3 py-1 rounded-full mb-4 inline-block">
                        Örnek {p.rooms || 'Planı'} {p.area > 0 ? `(${p.area} m²)` : ''}
                      </span>
                    </div>
                    <div className="max-w-xs md:max-w-sm w-full">
                      <img 
                        id="project-plan-img" 
                        src={p.planPhoto} 
                        alt="Daire Planı" 
                        className="w-full h-auto object-contain max-h-64 rounded-lg mix-blend-multiply cursor-zoom-in hover:opacity-95 transition duration-200"
                        onClick={() => handlePhotoClick(-1)}
                      />
                    </div>
                    
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-extrabold px-3 py-1.5 rounded-full flex items-center gap-1 uppercase tracking-wider">
                        Farklı Kat Seçenekleri Mevcut
                      </span>
                      {p.kat_sayisi > 0 && (
                        <span className="bg-gray-100 text-gray-600 border border-gray-200 text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 uppercase tracking-wider">
                          🏢 {p.kat_sayisi} Katlı
                        </span>
                      )}
                    </div>
                    
                    <p className="text-center text-xs text-gray-400 mt-4 max-w-md leading-relaxed border-t border-gray-200/60 pt-3">
                      Güncel boş dairelerin listesini, katlarını ve fiyatlarını doğrudan yapıcı firmadan (müteahhit) WhatsApp üzerinden öğrenebilirsiniz.
                    </p>

                    <a 
                      id="whatsapp-plan-btn" 
                      href={`https://wa.me/${waNum}?text=${encodeURIComponent(planWaMessage)}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-4 px-6 py-3.5 bg-[#00A4A6] hover:bg-[#00898B] rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all duration-200 w-full md:w-auto uppercase tracking-wider"
                    >
                      <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.156 5.156 0 11.487 0c3.067.001 5.95 1.196 8.114 3.363 2.164 2.167 3.357 5.053 3.355 8.12-.003 6.325-5.157 11.48-11.485 11.48-1.999-.001-3.968-.521-5.71-1.513L0 24zm6.59-4.846c1.642.975 3.251 1.489 4.84 1.49 4.996 0 9.06-4.061 9.062-9.058 0-2.42-1.014-4.701-2.731-6.418C16.035 3.45 13.84 2.502 11.487 2.502 6.49 2.502 2.428 6.564 2.426 11.56c-.001 1.638.484 3.235 1.401 4.7l-.955 3.486 3.575-.937z"></path>
                      </svg>
                      <span className="font-black text-xs text-white">Müsait Katları WhatsApp'tan Sor</span>
                    </a>
                  </div>
                </div>
              )}

              {constructionUrls.length > 0 && (
                <div id="block-construction" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h2 id="construction-title">Şantiye Günlüğü {p.santiyeTarihi ? `(${p.santiyeTarihi})` : ''}</h2>
                  <div className="grid grid-cols-2 gap-3" id="construction-photos">
                    {constructionUrls.slice(0, 2).map((url, idx) => (
                      <div 
                        key={idx} 
                        className="h-32 bg-cover bg-center rounded-lg cursor-zoom-in hover:opacity-95 transition construction-photo-item" 
                        style={{ backgroundImage: `url('${url}')` }}
                        onClick={() => handlePhotoClick(-2 - idx)}
                      />
                    ))}
                  </div>
                  {p.santiyeTarihi && (
                    <p id="construction-update-text" className="text-xs text-gray-400 mt-3 text-right">
                      Son Güncelleme: {p.santiyeTarihi}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ПРАВАЯ КОЛОНКА (САЙДБАР ОПЛАТЫ) */}
            <div className="lg:col-span-1 lg:sticky lg:top-28 z-20">
              <div className="bg-white p-6 rounded-3xl border-2 border-[#00A4A6] shadow-lg space-y-6">
                <div>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Başlangıç Fiyatı</span>
                  <div id="project-price" className="text-3xl font-black text-[#00A4A6] mt-1">
                    {formatPrice(p.price)}
                  </div>
                </div>

                <div id="block-finance" className="space-y-3">
                  <div className="flex justify-between text-sm items-center" id="row-pesinat">
                    <span className="text-gray-500 font-medium mr-2">İlk Peşinat</span>
                    <span id="project-down-payment" className="text-slate-800 font-bold text-right shrink-0">
                      {p.downPayment || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm items-center" id="row-vade">
                    <span className="text-gray-500 font-medium mr-2">Vade Seçeneği</span>
                    <span id="project-vade" className="text-slate-800 font-bold text-right shrink-0">
                      {p.vade || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm items-center" id="row-credit">
                    <span className="text-gray-500 font-medium mr-2">Kredi Durumu</span>
                    <span 
                      id="project-credit-status" 
                      className={`font-bold text-right shrink-0 ${p.kredi?.toLowerCase().includes('uygun değil') ? 'text-red-500' : 'text-emerald-600'}`}
                    >
                      {p.kredi || "Krediye Uygun Değil"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <a 
                    id="whatsapp-btn" 
                    href={`https://wa.me/${waNum}?text=${encodeURIComponent(mainWaMessage)}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full py-4 px-4 bg-[#00A4A6] hover:bg-[#00898B] rounded-xl flex items-center justify-center gap-3 shadow-sm transition-all duration-200"
                  >
                    <svg className="w-6 h-6 shrink-0 fill-current text-white" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.156 5.156 0 11.487 0c3.067.001 5.95 1.196 8.114 3.363 2.164 2.167 3.357 5.053 3.355 8.12-.003 6.325-5.157 11.48-11.485 11.48-1.999-.001-3.968-.521-5.71-1.513L0 24zm6.59-4.846c1.642.975 3.251 1.489 4.84 1.49 4.996 0 9.06-4.061 9.062-9.058 0-2.42-1.014-4.701-2.731-6.418C16.035 3.45 13.84 2.502 11.487 2.502 6.49 2.502 2.428 6.564 2.426 11.56c-.001 1.638.484 3.235 1.401 4.7l-.955 3.486 3.575-.937z"></path>
                    </svg>
                    <span className="flex flex-col text-center leading-tight tracking-wider uppercase text-white">
                      <span className="font-black text-xs text-white">Doğrudan Müteahhitten</span>
                      <span className="font-bold opacity-90 text-[10px] mt-0.5 text-white">Bilgi Al</span>
                    </span>
                  </a>
                  <p className="text-center text-xs text-gray-400 mt-2">
                    Tıklama sayınız KonutBudur güvencesiyle kaydedilmektedir.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ПОДВАЛ */}
        <Footer />

        {/* СЛАЙДЕР С ЛАЙТБОКСОМ */}
        {lightboxIndex !== null && (
          <div 
            id="custom-lightbox" 
            className="flex"
            onClick={() => setLightboxIndex(null)}
          >
            <button className="lightbox-close absolute top-6 right-6 text-white text-4xl font-light hover:scale-110 transition" onClick={() => setLightboxIndex(null)}>&times;</button>
            
            {lightboxIndex >= 0 && photoUrls.length > 1 && (
              <>
                <button 
                  className="lightbox-arrow l-prev absolute left-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl transition"
                  onClick={handlePrevLightbox}
                >
                  &#10094;
                </button>
                <button 
                  className="lightbox-arrow l-next absolute right-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl transition"
                  onClick={handleNextLightbox}
                >
                  &#10095;
                </button>
              </>
            )}

            <div className="lightbox-content max-w-[85vw] max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
              <img 
                id="lightbox-img" 
                src={
                  lightboxIndex === -1 ? p.planPhoto :
                  lightboxIndex === -2 ? constructionUrls[0] :
                  lightboxIndex === -3 ? constructionUrls[1] :
                  photoUrls[lightboxIndex]
                } 
                className="object-contain max-w-full max-h-[80vh] rounded-lg shadow-2xl"
                alt="Detay Görseli"
              />
            </div>
            {lightboxIndex >= 0 && (
              <div id="lightbox-counter" className="absolute bottom-6 text-white/70 text-sm font-medium">
                {lightboxIndex + 1} / {photoUrls.length}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ОРИГИНАЛЬНЫЕ УНИВЕРСАЛЬНЫЕ СТИЛИ TILDA ДЛЯ КАРТОЧКИ ОБЪЕКТА */}
      <style dangerouslySetInnerHTML={{ __html: `
        .projeland-card-container {
          font-family: 'Mulish', sans-serif !important;
        }

        .airbnb-gallery {
          height: 500px !important;
          box-sizing: border-box !important;
        }

        .gallery-item {
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          width: 100%;
          height: 100%;
          cursor: pointer;
          transition: filter 0.25s ease;
        }
        .gallery-item:hover { filter: brightness(0.9); }

        .gallery-layout-1 { display: block; width: 100%; height: 100%; }
        .gallery-layout-1 .gallery-item { border-radius: 16px !important; }

        .gallery-layout-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: 100%; height: 100%; }
        .gallery-layout-2 .gallery-item:nth-child(1) { border-radius: 16px 0 0 16px !important; }
        .gallery-layout-2 .gallery-item:nth-child(2) { border-radius: 0 16px 16px 0 !important; }

        .gallery-layout-3 { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px; width: 100%; height: 100%; }
        .gallery-layout-3 .gallery-item:nth-child(1) { border-radius: 16px 0 0 16px !important; }
        .gallery-layout-3 .gallery-item:nth-child(2) { border-radius: 0px !important; }
        .gallery-layout-3 .gallery-item:nth-child(3) { border-radius: 0 16px 16px 0 !important; }

        .gallery-layout-4 { display: grid; grid-template-columns: 3fr 1fr 1fr 1fr; gap: 12px; width: 100%; height: 100%; }
        .gallery-layout-4 .gallery-item:nth-child(1) { border-radius: 16px 0 0 16px !important; }
        .gallery-layout-4 .gallery-item:nth-child(2), .gallery-layout-4 .gallery-item:nth-child(3) { border-radius: 0px !important; }
        .gallery-layout-4 .gallery-item:nth-child(4) { border-radius: 0 16px 16px 0 !important; }

        .gallery-layout-5 {
          display: grid !important;
          grid-template-columns: 2fr 1fr 1fr !important;
          grid-template-rows: 1fr 1fr !important;
          gap: 12px !important;
          width: 100% !important;
          height: 100% !important;
        }
        .gallery-layout-5 .gallery-item-main { grid-row: span 2; border-radius: 16px 0 0 16px !important; }
        .gallery-layout-5 .gallery-item-top-mid, .gallery-layout-5 .gallery-item-bottom-mid { border-radius: 0px !important; }
        .gallery-layout-5 .gallery-item-top-right { border-radius: 0 16px 0 0 !important; }
        .gallery-layout-5 .gallery-item-bottom-right { border-radius: 0 0 16px 0 !important; position: relative; }

        .gallery-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5) !important;
          color: #ffffff !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
          align-items: center !important;
          transition: background 0.25s ease !important;
          border-radius: 0 0 16px 0 !important;
          text-align: center !important;
          user-select: none;
        }
        .gallery-overlay:hover {
          background: rgba(0, 0, 0, 0.65) !important;
        }
        .gallery-overlay-text {
          font-size: 1.5rem !important;
          font-weight: 800 !important;
          color: #ffffff !important;
          line-height: 1 !important;
        }
        .gallery-overlay-subtext {
          font-size: 0.75rem !important;
          font-weight: 700 !important;
          color: rgba(255, 255, 255, 0.9) !important;
          margin-top: 6px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          background-color: rgba(255, 255, 255, 0.15) !important;
          padding: 4px 10px !important;
          border-radius: 9999px !important;
          display: inline-block !important;
        }

        #custom-lightbox {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0, 0, 0, 0.95); z-index: 9999999999; justify-content: center; align-items: center; user-select: none;
        }

        .projeland-card-container h2 {
          border-bottom: 1px solid #E5E7EB !important;
          padding-bottom: 8px !important;
          margin-bottom: 16px !important;
          font-size: 1.25rem !important;
          font-weight: 700 !important;
          color: #111827 !important;
        }

        #block-finance {
          border-top: 1px solid #E5E7EB !important;
          border-bottom: 1px solid #E5E7EB !important;
          padding-top: 16px !important;
          padding-bottom: 16px !important;
        }

        @media (max-width: 768px) {
          .airbnb-gallery {
            height: 250px !important;
          }
          .gallery-layout-2, .gallery-layout-3, .gallery-layout-4, .gallery-layout-5 {
            display: block !important;
          }
          .gallery-layout-2 .gallery-item:not(:first-child),
          .gallery-layout-3 .gallery-item:not(:first-child),
          .gallery-layout-4 .gallery-item:not(:first-child),
          .gallery-layout-5 .gallery-item:not(.gallery-item-main) {
            display: none !important;
          }
          .gallery-layout-2 .gallery-item:first-child,
          .gallery-layout-3 .gallery-item:first-child,
          .gallery-layout-4 .gallery-item:first-child,
          .gallery-layout-5 .gallery-item-main {
            border-radius: 16px !important;
          }

          .gallery-layout-2::after, 
          .gallery-layout-3::after, 
          .gallery-layout-4::after, 
          .gallery-layout-5::after {
            content: "📷 Tüm Fotoğraflar" !important;
            position: absolute !important;
            bottom: 15px !important;
            right: 15px !important;
            background-color: rgba(30, 41, 59, 0.8) !important;
            color: #ffffff !important;
            font-size: 11px !important;
            font-weight: 800 !important;
            padding: 6px 14px !important;
            border-radius: 20px !important;
            backdrop-filter: blur(4px) !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            z-index: 10 !important;
            pointer-events: none;
            letter-spacing: 0.05em !important;
            text-transform: uppercase !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
          }
        }
      `}} />
    </>
  )
}

export async function getServerSideProps(context) {
  const { id } = context.params

  try {
    const { data: property, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !property) {
      return {
        notFound: true,
      }
    }

    return {
      props: {
        property,
        initialError: null,
      },
    }
  } catch (err) {
    console.error('❌ Supabase Detay Verisi Hatasi:', err.message)
    return {
      props: {
        property: null,
        initialError: err.message || 'Supabase error',
      },
    }
  }
}
```
