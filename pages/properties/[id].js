import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../../supabase';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function PropertyDetail({ property, error }) {
  const router = useRouter();

  // Извлекаем и типизируем фотографии по вашей структуре в Supabase
  const images = property?.property_images || [];
  
  // 1. Основная галерея проекта
  const galleryPhotos = images
    .filter(img => img.image_url && !img.planfoto && !img.Construction && img.image_url !== 'EMPTY')
    .map(img => img.image_url);

  // 2. Чертеж планировки
  const planPhoto = images.find(img => img.planfoto)?.planfoto || null;

  // 3. Фотографии стройки
  const constructionPhotos = images
    .filter(img => img.Construction)
    .map(img => img.Construction);

  // Состояния для Лайтбокса
  const [lightboxState, setLightboxState] = useState({
    isOpen: false,
    photos: [],
    activeIndex: 0,
  });

  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  // Инициализация Yandex Карты на стороне клиента
  useEffect(() => {
    if (typeof window === 'undefined' || !property) return;
    const lat = parseFloat(property.latitude);
    const lng = parseFloat(property.longitude);

    if (isNaN(lat) || isNaN(lng)) return;

    const initMap = () => {
      if (window.ymaps && !mapInstance.current && mapRef.current) {
        window.ymaps.ready(() => {
          mapInstance.current = new window.ymaps.Map(mapRef.current, {
            center: [lat, lng],
            zoom: 14,
            controls: ['zoomControl'],
          });

          const placemark = new window.ymaps.Placemark([lat, lng], {
            hintContent: property.testproje || 'Konut Projesi',
            balloonContent: property.testproje || 'Proje Konumu',
          }, {
            preset: 'islands#dotIcon',
            iconColor: '#00A4A6',
          });

          mapInstance.current.geoObjects.add(placemark);
        });
      }
    };

    if (!window.ymaps && !document.getElementById('yandex-maps-script')) {
      const script = document.createElement('script');
      script.id = 'yandex-maps-script';
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || '72709de3-d8bc-49c9-88c6-339937b3fa51'}&lang=tr_TR`;
      script.type = 'text/javascript';
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy();
        mapInstance.current = null;
      }
    };
  }, [property]);

  if (error || !property) {
    return (
      <>
        <Header setFilters={() => {}} />
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-2xl font-black text-slate-800 mb-2">Proje Bulunamadı</h2>
          <p className="text-slate-500 mb-6">Aradığınız ilan yayından kaldırılmış veya silinmiş olabilir.</p>
          <Link href="/" className="px-6 py-3 bg-[#00A4A6] text-white rounded-xl font-bold hover:bg-[#00898B] transition">
            Anasayfaya Dön
          </Link>
        </div>
        <Footer setFilters={() => {}} />
      </>
    );
  }

  // Форматирование цены
  const formatPrice = (val) => {
    if (!val) return 'Fiyat Belirtilmemiş';
    let numOnly = String(val).replace(/[^0-9]/g, '');
    return numOnly === '' || numOnly === '0'
      ? val
      : Number(numOnly).toLocaleString('tr-TR') + " TL'den";
  };

  // Эмодзи для ручного списка инфраструктуры
  const getEmoji = (label) => {
    const lower = label.toLowerCase();
    if (lower.includes('metro') || lower.includes('tramvay') || lower.includes('istasyon')) return '🚇';
    if (lower.includes('park') || lower.includes('bahçe') || lower.includes('orman')) return '🌳';
    if (lower.includes('avm') || lower.includes('market') || lower.includes('mağaza') || lower.includes('alışveriş')) return '🛍️';
    if (lower.includes('hastane') || lower.includes('klinik') || lower.includes('tıp') || lower.includes('eczane')) return '🏥';
    if (lower.includes('okul') || lower.includes('kolej') || lower.includes('üniversite')) return '🎓';
    if (lower.includes('durak') || lower.includes('otobüs')) return '🚌';
    return '📍';
  };

  const getFeatureIcon = (feat) => {
    const lower = feat.toLowerCase().trim();
    if (lower.includes('havuz')) return '🏊‍♂️ ';
    if (lower.includes('fitness') || lower.includes('spor') || lower.includes('salon')) return '🏋️‍♀️ ';
    if (lower.includes('güvenlik') || lower.includes('guvenlik')) return '🛡️ ';
    if (lower.includes('otopark') || lower.includes('park yeri')) return '🚗 ';
    if (lower.includes('çocuk') || lower.includes('cocuk') || lower.includes('oyun') || lower.includes('parkı')) return '🛝 ';
    if (lower.includes('site')) return '🏡 ';
    if (lower.includes('asansör') || lower.includes('asansor')) return '🛗 ';
    if (lower.includes('jeneratör') || lower.includes('jenerator')) return '⚡ ';
    if (lower.includes('yeşil') || lower.includes('bahçe') || lower.includes('peyzaj')) return '🌳 ';
    if (lower.includes('sauna') || lower.includes('hamam')) return '🧖‍♀️ ';
    return '✨ ';
  };

  const parseFeatures = (featuresVal) => {
    if (!featuresVal) return [];
    if (Array.isArray(featuresVal)) return featuresVal;
    return String(featuresVal).split(/[\/,]/).map(s => s.trim()).filter(Boolean);
  };

  const featuresList = parseFeatures(property.Özellikler);

  // Парсинг ручной инфраструктуры (Конфиг "Konum Mesafeler")
  const distancesRaw = property['Konum Mesafeler'] || property['Konum_Mesafeler'] || '';
  const parsedDistances = distancesRaw
    ? distancesRaw.split(',').map(item => {
        const parts = item.split(':');
        if (parts.length === 2) {
          return { label: parts[0].trim(), value: parts[1].trim() };
        }
        return null;
      }).filter(Boolean)
    : [];

  // Ссылки на WhatsApp (без реферальных приписок)
  const waNum = property.WhatsApp ? String(property.WhatsApp).replace(/\D/g, '') : '905459418536';
  const formattedRoomType = property['card odalar'] || 'daire';
  
  const mainWaMsg = `Merhaba, lansmanbul.com portalında yer alan ${property.testproje || ''} projenizdeki ${formattedRoomType} daire tipi ile ilgileniyorum. Güncel boş kat listesini ve ödeme planını paylaşabilir misiniz?`;
  const planWaMsg = `Merhaba, lansmanbul.com portalında yer alan ${property.testproje || ''} projenizin ${formattedRoomType} planı için hangi katların şu an müsait olduğunu öğrenebilir miyim?`;

  const waBtnLink = `https://wa.me/${waNum}?text=${encodeURIComponent(mainWaMsg)}`;
  const waPlanBtnLink = `https://wa.me/${waNum}?text=${encodeURIComponent(planWaMsg)}`;

  // Открытие лайтбокса
  const openLightbox = (photoArray, index) => {
    setLightboxState({
      isOpen: true,
      photos: photoArray,
      activeIndex: index,
    });
  };

  // SEO Описание
  const seoDesc = property.Açıklama 
    ? property.Açıklama.substring(0, 160) 
    : `${property.testproje || 'Lansman'} projesi detayları, fiyatları ve doğrudan müteahhit iletişim bilgileri.`;

  return (
    <>
      <Head>
        <title>{`${property.testproje || 'Proje Detayı'} | lansmanbul.com`}</title>
        <meta name="description" content={seoDesc} />
        <meta property="og:title" content={`${property.testproje || 'Proje Detayı'} | lansmanbul.com`} />
        <meta property="og:description" content={seoDesc} />
        {galleryPhotos.length > 0 && <meta property="og:image" content={galleryPhotos[0]} />}
      </Head>

      <Header setFilters={() => {}} />

      <div className="projeland-card-container bg-slate-50 text-slate-800 antialiased min-h-screen relative pt-28 pb-12 font-sans">
        <div className="max-w-7xl mx-auto px-4">
          
          {/* ШАПКА КАРТОЧКИ */}
          <header className="mb-6">
            <div className="flex justify-between items-start w-full">
              <div>
                {property.konutcesit && (
                  <span 
                    className="text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider inline-block"
                    style={{ backgroundColor: property.konutcesit.toLowerCase() === 'lansman' ? '#FF9800' : '#00A4A6' }}
                  >
                    {property.konutcesit}
                  </span>
                )}
                <h1 className="text-3xl font-black text-gray-900 mt-2">
                  {property.testproje || ''}
                </h1>
                <p className="text-gray-500 mt-1 flex items-center gap-1 text-sm">
                  <svg className="w-4 h-4 text-[#00A4A6] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  <span className="break-words max-w-full">
                    {property['İlçe/Semt'] ? `${property['İlçe/Semt']}, Ankara` : 'Ankara, Türkiye'}
                  </span>
                </p>
              </div>

              {/* Кнопка плавного возврата на главную с параметром скролла */}
              <Link href={`/?scrollto=${property.id}`} className="back-button" id="back-button">
                ◀ Kataloğa Dön
              </Link>
            </div>
          </header>

          {/* СЕТКА ГАЛЕРЕИ (AIRBNB STYLE) */}
          <section className="mb-8 overflow-hidden rounded-2xl shadow-sm h-[250px] md:h-[500px]">
            {galleryPhotos.length === 1 && (
              <div className="gallery-layout-1">
                <div className="gallery-item" onClick={() => openLightbox(galleryPhotos, 0)} style={{ backgroundImage: `url('${galleryPhotos[0]}')` }}></div>
              </div>
            )}
            
            {galleryPhotos.length === 2 && (
              <div className="gallery-layout-2">
                {galleryPhotos.map((url, i) => (
                  <div key={i} className="gallery-item" onClick={() => openLightbox(galleryPhotos, i)} style={{ backgroundImage: `url('${url}')` }}></div>
                ))}
              </div>
            )}

            {galleryPhotos.length === 3 && (
              <div className="gallery-layout-3">
                <div className="gallery-item" onClick={() => openLightbox(galleryPhotos, 0)} style={{ backgroundImage: `url('${galleryPhotos[0]}')` }}></div>
                <div className="gallery-item" onClick={() => openLightbox(galleryPhotos, 1)} style={{ backgroundImage: `url('${galleryPhotos[1]}')` }}></div>
                <div className="gallery-item" onClick={() => openLightbox(galleryPhotos, 2)} style={{ backgroundImage: `url('${galleryPhotos[2]}')` }}></div>
              </div>
            )}

            {galleryPhotos.length === 4 && (
              <div className="gallery-layout-4">
                <div className="gallery-item" onClick={() => openLightbox(galleryPhotos, 0)} style={{ backgroundImage: `url('${galleryPhotos[0]}')` }}></div>
                <div className="gallery-item" onClick={() => openLightbox(galleryPhotos, 1)} style={{ backgroundImage: `url('${galleryPhotos[1]}')` }}></div>
                <div className="gallery-item" onClick={() => openLightbox(galleryPhotos, 2)} style={{ backgroundImage: `url('${galleryPhotos[2]}')` }}></div>
                <div className="gallery-item" onClick={() => openLightbox(galleryPhotos, 3)} style={{ backgroundImage: `url('${galleryPhotos[3]}')` }}></div>
              </div>
            )}

            {galleryPhotos.length >= 5 && (
              <div className="gallery-layout-5">
                <div className="gallery-item gallery-item-main" onClick={() => openLightbox(galleryPhotos, 0)} style={{ backgroundImage: `url('${galleryPhotos[0]}')` }}></div>
                <div className="gallery-item gallery-item-top-mid" onClick={() => openLightbox(galleryPhotos, 1)} style={{ backgroundImage: `url('${galleryPhotos[1]}')` }}></div>
                <div className="gallery-item gallery-item-top-right" onClick={() => openLightbox(galleryPhotos, 2)} style={{ backgroundImage: `url('${galleryPhotos[2]}')` }}></div>
                <div className="gallery-item gallery-item-bottom-mid" onClick={() => openLightbox(galleryPhotos, 3)} style={{ backgroundImage: `url('${galleryPhotos[3]}')` }}></div>
                <div className="gallery-item gallery-item-bottom-right" onClick={() => openLightbox(galleryPhotos, 4)} style={{ backgroundImage: `url('${galleryPhotos[4]}')` }}>
                  {galleryPhotos.length > 5 && (
                    <div className="gallery-overlay">
                      <span className="gallery-overlay-text">+{galleryPhotos.length - 4}</span>
                      <span className="gallery-overlay-subtext">Hepsini Gör</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* КОЛОНКИ КОНТЕНТА */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* ЛЕВАЯ КОЛОНКА (ОПИСАНИЕ И ДЕТАЛИ) */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Описание */}
              {property.Açıklama && (
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h2 className="title-section">Proje Hakkında</h2>
                  <div className="text-gray-600 leading-relaxed whitespace-pre-line break-words">
                    {property.Açıklama}
                  </div>
                  {featuresList.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-6">
                      {featuresList.map((feat, index) => (
                        <span key={index} className="bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full inline-block whitespace-nowrap">
                          {getFeatureIcon(feat)}{feat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Местоположение и Расстояния */}
              {(parsedDistances.length > 0 || property.latitude || property.Harita_Link) && (
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h2 className="title-section">Konum ve Mesafeler</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Карта */}
                    <div className="w-full h-48 bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                      {property.latitude && property.longitude ? (
                        <div ref={mapRef} className="w-full h-full" />
                      ) : property.Harita_Link ? (
                        <iframe src={property.Harita_Link} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy"></iframe>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">📍 Harita Alanı</div>
                      )}
                    </div>

                    {/* Расстояния ручного ввода */}
                    {parsedDistances.length > 0 ? (
                      <div className="space-y-3 justify-center flex flex-col">
                        {parsedDistances.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 font-medium flex items-center gap-1.5">
                              <span className="text-base leading-none">{getEmoji(item.label)}</span>
                              <span>{item.label}</span>
                            </span>
                            <span className="text-[#00A4A6] font-bold">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center text-sm text-gray-400">
                        Konum mesafeleri belirtilmemiş.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Чертеж планировки */}
              {planPhoto && (
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h2 className="title-section font-bold">Kat ve Daire Planları</h2>
                  <p className="text-sm text-gray-500 mb-4">Aşağıdaki plandan daire içi yerleşim detaylarını inceleyebilirsiniz:</p>
                  <div className="border border-gray-100 rounded-xl p-4 flex flex-col items-center bg-gray-50">
                    
                    {property['card odalar'] && (
                      <span className="bg-[#00A4A6] text-white text-xs font-bold px-3 py-1 rounded mb-4 inline-block">
                        Örnek {property['card odalar']} Planı {property['card-area'] ? `(${property['card-area']} m²)` : ''}
                      </span>
                    )}

                    <div className="max-w-xs md:max-w-sm w-full">
                      <img 
                        src={planPhoto} 
                        alt="Daire Planı" 
                        onClick={() => openLightbox([planPhoto], 0)}
                        className="w-full h-auto object-contain max-h-64 rounded-lg mix-blend-multiply cursor-zoom-in hover:opacity-95 transition duration-200" 
                      />
                    </div>
                    
                    {/* Баджи этажей */}
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-extrabold px-3 py-1.5 rounded-full flex items-center gap-1 uppercase tracking-wider">
                        🟢 Farklı Kat Seçenekleri Mevcut
                      </span>
                      
                      {(property['Kat Sayısı'] || property.Kat_Sayisi || property.katsayisi) && (
                        <span className="bg-gray-100 text-gray-600 border border-gray-200 text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 uppercase tracking-wider">
                          🏢 {property['Kat Sayısı'] || property.Kat_Sayisi || property.katsayisi} Katlı
                        </span>
                      )}
                    </div>
                    
                    <p className="text-center text-xs text-gray-400 mt-4 max-w-md leading-relaxed border-t border-gray-200/60 pt-3">
                      Güncel boş dairelerin listesini, katlarını ve fiyatlarını doğrudan yapıcı firmadan (müteahhit) WhatsApp üzerinden öğrenebilirsiniz.
                    </p>

                    <a href={waPlanBtnLink} target="_blank" rel="noopener noreferrer" className="mt-4 px-6 py-3.5 bg-[#00A4A6] text-white rounded-xl flex items-center justify-center gap-2 shadow-sm hover:bg-[#00898B] transition duration-200 w-full md:w-auto uppercase tracking-wider font-bold text-xs">
                      <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.156 5.156 0 11.487 0c3.067.001 5.95 1.196 8.114 3.363 2.164 2.167 3.357 5.053 3.355 8.12-.003 6.325-5.157 11.48-11.485 11.48-1.999-.001-3.968-.521-5.71-1.513L0 24zm6.59-4.846c1.642.975 3.251 1.489 4.84 1.49 4.996 0 9.06-4.061 9.062-9.058 0-2.42-1.014-4.701-2.731-6.418C16.035 3.45 13.84 2.502 11.487 2.502 6.49 2.502 2.428 6.564 2.426 11.56c-.001 1.638.484 3.235 1.401 4.7l-.955 3.486 3.575-.937z"></path>
                      </svg>
                      Müsait Katları WhatsApp'tan Sor
                    </a>
                  </div>
                </div>
              )}

              {/* Дневник Стройки */}
              {constructionPhotos.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h2 className="title-section">Şantiye Günlüğü</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {constructionPhotos.map((url, index) => (
                      <div 
                        key={index} 
                        onClick={() => openLightbox(constructionPhotos, index)}
                        className="h-32 bg-cover bg-center rounded-lg cursor-zoom-in hover:opacity-95 transition" 
                        style={{ backgroundImage: `url('${url}')` }}
                      ></div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ПРАВАЯ СТИКИ-КОЛОНКА (САЙДБАР С ЦЕНОЙ) */}
            <div className="lg:col-span-1 lg:sticky lg:top-28 z-20">
              <div className="bg-white p-6 rounded-3xl border-2 border-[#00A4A6] shadow-lg space-y-6">
                <div>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Başlangıç Fiyatı</span>
                  <div className="text-3xl font-black text-[#00A4A6] mt-1">
                    {formatPrice(property.Fiyat)}
                  </div>
                </div>

                {/* Баланс и кредиты */}
                <div className="space-y-3 py-4 border-t border-b border-gray-200">
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-500 font-medium mr-2">İlk Peşinat</span>
                    <span className="text-gray-900 font-bold text-right shrink-0 whitespace-nowrap">
                      {property.Ilk_Pesinat || property.pesinat || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-500 font-medium mr-2">Vade Seçeneği</span>
                    <span className="text-gray-900 font-bold text-right shrink-0 whitespace-nowrap">
                      {property.Vade_Secenegi || property.vade || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-500 font-medium mr-2">Kredi Durumu</span>
                    <span className={`font-bold text-right shrink-0 whitespace-nowrap ${
                      property.Kredi_Durumu?.toLowerCase().includes('uygun değil') || property.Kredi_Durumu?.toLowerCase().includes('değil')
                        ? 'text-red-500' 
                        : 'text-green-600'
                    }`}>
                      {property.Kredi_Durumu || 'Krediye Uygun Değil'}
                    </span>
                  </div>
                </div>

                {/* Главная кнопка WhatsApp */}
                <div className="space-y-2">
                  <a href={waBtnLink} target="_blank" rel="noopener noreferrer" className="w-full py-4 px-4 bg-[#00A4A6] text-white rounded-xl flex items-center justify-center gap-3 shadow-sm hover:bg-[#00898B] transition duration-200">
                    <svg className="w-6 h-6 shrink-0 fill-current text-white" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.156 5.156 0 11.487 0c3.067.001 5.95 1.196 8.114 3.363 2.164 2.167 3.357 5.053 3.355 8.12-.003 6.325-5.157 11.48-11.485 11.48-1.999-.001-3.968-.521-5.71-1.513L0 24zm6.59-4.846c1.642.975 3.251 1.489 4.84 1.49 4.996 0 9.06-4.061 9.062-9.058 0-2.42-1.014-4.701-2.731-6.418C16.035 3.45 13.84 2.502 11.487 2.502 6.49 2.502 2.428 6.564 2.426 11.56c-.001 1.638.484 3.235 1.401 4.7l-.955 3.486 3.575-.937z"></path>
                    </svg>
                    <span className="flex flex-col text-center leading-tight tracking-wider uppercase font-black">
                      <span className="text-xs text-white">Doğrudan Müteahhitten</span>
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
      </div>

      {/* ЛАЙТБОКС СЛАЙДЕР ДЛЯ ГАЛЕРЕИ */}
      {lightboxState.isOpen && (
        <div id="custom-lightbox" className="active-lightbox" onClick={() => setLightboxState(prev => ({ ...prev, isOpen: false }))}>
          <button 
            className="lightbox-close absolute top-6 right-6 text-white text-4xl font-light hover:scale-110 transition"
            onClick={() => setLightboxState(prev => ({ ...prev, isOpen: false }))}
          >
            &times;
          </button>
          
          {lightboxState.photos.length > 1 && (
            <button 
              className="lightbox-arrow l-prev absolute left-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl transition"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxState(prev => ({
                  ...prev,
                  activeIndex: (prev.activeIndex - 1 + prev.photos.length) % prev.photos.length
                }));
              }}
            >
              &#10094;
            </button>
          )}

          <div className="lightbox-content max-w-[85vw] max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxState.photos[lightboxState.activeIndex]} className="object-contain max-w-full max-h-[80vh] rounded-lg shadow-2xl" alt="Mülk Görseli" />
          </div>

          {lightboxState.photos.length > 1 && (
            <button 
              className="lightbox-arrow l-next absolute right-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl transition"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxState(prev => ({
                  ...prev,
                  activeIndex: (prev.activeIndex + 1) % prev.photos.length
                }));
              }}
            >
              &#10095;
            </button>
          )}

          <div className="absolute bottom-6 text-white/70 text-sm font-medium">
            {lightboxState.activeIndex + 1} / {lightboxState.photos.length}
          </div>
        </div>
      )}

      <Footer setFilters={() => {}} />

      {/* СТИЛИ ИЗ ТИЛЬДЫ, ИЗОЛИРОВАННЫЕ В STYLE JSX */}
      <style jsx global>{`
        .title-section {
          border-bottom: 1px solid #E5E7EB !important;
          padding-bottom: 8px !important;
          margin-bottom: 16px !important;
          font-size: 1.25rem !important;
          font-weight: 700 !important;
          color: #111827 !important;
        }

        .back-button {
          color: #64748B !important;
          font-weight: 700 !important;
          font-size: 0.875rem !important;
          text-decoration: none !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 0.25rem !important;
          transition: color 0.2s ease !important;
        }
        .back-button:hover {
          color: #111827 !important;
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
          box-sizing: border-box !important;
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

        .active-lightbox {
          display: flex !important;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.95);
          z-index: 9999999999;
          justify-content: center;
          align-items: center;
          user-select: none;
        }

        @media (max-width: 768px) {
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
            pointer-events: none !important;
            letter-spacing: 0.05em !important;
            text-transform: uppercase !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
          }
        }
      `}</style>
    </>
  );
}

// Данные запрашиваются на сервере (SSR)
export async function getServerSideProps(context) {
  const { id } = context.params;

  try {
    const { data: property, error } = await supabase
      .from('properties')
      .select('*, property_images(*)')
      .eq('id', id)
      .single();

    if (error || !property) {
      return {
        props: {
          property: null,
          error: true,
        },
      };
    }

    return {
      props: {
        property,
        error: false,
      },
    };
  } catch (err) {
    console.error('Server side props error:', err);
    return {
      props: {
        property: null,
        error: true,
      },
    };
  }
}
