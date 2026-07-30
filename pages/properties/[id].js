import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../../supabase'; // Путь к вашему клиенту Supabase
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function PropertyDetail({ property, error }) {
  const router = useRouter();

  // Безопасный парсинг фото
  const parseJsonbPhotos = (value) => {
    if (!value) return [];
    
    if (Array.isArray(value)) {
      return value.filter(val => typeof val === 'string' && val.trim() !== '' && val !== 'EMPTY');
    }
    
    if (typeof value === 'string') {
      const trimmed = value.trim();
      
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            return parsed.filter(val => typeof val === 'string' && val.trim() !== '' && val !== 'EMPTY');
          }
        } catch (e) {
          console.error("JSON parsing error inside PropertyDetail:", e);
        }
      }
      
      return trimmed.split(/[\s,]+/).filter(val => val !== '' && val !== 'EMPTY');
    }
    
    return [];
  };

  // Вспомогательная функция сопоставления иконок у удобств
  const getFeatureIcon = (feat) => {
    const lower = feat.toLowerCase().trim()
      .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ç/g, 'c')
      .replace(/ğ/g, 'g').replace(/ö/g, 'o').replace(/ü/g, 'u');
    if (lower.includes('havuz')) return '🏊‍♂️';
    if (lower.includes('fitness') || lower.includes('spor') || lower.includes('salon')) return '🏋️‍♀️';
    if (lower.includes('guvenlik')) return '🛡️';
    if (lower.includes('otopark') || lower.includes('park yeri')) return '🚗';
    if (lower.includes('cocuk') || lower.includes('oyun') || lower.includes('parki')) return '🌳';
    if (lower.includes('site')) return '🏡';
    if (lower.includes('asansor')) return '🛗';
    if (lower.includes('jenerator')) return '⚡';
    if (lower.includes('yesil') || lower.includes('bahce') || lower.includes('peyzaj')) return '🌳';
    if (lower.includes('sauna') || lower.includes('hamam')) return '🧖‍♀️';
    return '✨';
  };

  // Состояния для интерактивной галереи и лайтбокса
 const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [lightboxState, setLightboxState] = useState({
    isOpen: false,
    photos: [],
    activeIndex: 0,
  });

  // === НОВОЕ: Получаем активную планировку из URL для авто-раскрытия ===
  const { room: queryRoom } = router.query;
  const [activeAccordion, setActiveAccordion] = useState('');

  useEffect(() => {
    if (queryRoom) {
      setActiveAccordion(String(queryRoom).trim());
    }
  }, [queryRoom]);
  // ===================================================================

  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  // Карта Яндекса
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

  // --- БЛОК БЕЗОПАСНОСТИ ---
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

 // --- ВЫЧИСЛЕНИЯ ПЕРЕМЕННЫХ ИЗ БАЗЫ ---
  const images = property.property_images || [];
  const galleryPhotos = images.flatMap(img => parseJsonbPhotos(img?.image_url));
  const planPhotosList = images.flatMap(img => parseJsonbPhotos(img?.planfoto));
  const planPhoto = planPhotosList.length > 0 ? planPhotosList[0] : null;
  const constructionPhotos = images.flatMap(img => parseJsonbPhotos(img?.Construction));

  // === НОВОЕ: Чтение JSON планировок из базы ===
  const layouts = (() => {
    if (!property?.layouts) return [];
    if (Array.isArray(property.layouts)) return property.layouts;
    if (typeof property.layouts === 'string') {
      try {
        return JSON.parse(property.layouts);
      } catch (e) {
        console.error("Layouts parsing error inside Detail page:", e);
      }
    }
    return [];
  })();
  // ============================================

  const formatPrice = (val) => {
    if (!val) return 'Fiyat Belirtilmemiş';
    let numOnly = String(val).replace(/[^0-9]/g, '');
    return numOnly === '' || numOnly === '0'
      ? val
      : Number(numOnly).toLocaleString('tr-TR') + " TL'den";
  };

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

  const parseFeatures = (featuresVal) => {
    if (!featuresVal) return [];
    if (Array.isArray(featuresVal)) return featuresVal;
    return String(featuresVal).split(/[\/,]/).map(s => s.trim()).filter(Boolean);
  };

  const featuresList = parseFeatures(property.Özellikler);

  const distancesRaw = property['Konum Mesafeler'] || property['Konum_Mesafeler'] || '';
  const parsedDistances = distancesRaw
    ? distancesRaw.split(',').map(item => {
        const trimmedItem = item.trim();
        if (trimmedItem.includes(':')) {
          const parts = trimmedItem.split(':');
          return { label: parts[0].trim(), value: parts[1].trim() };
        }
        // Если двоеточия нет, делим строку по первой встретившейся цифре времени
        const match = trimmedItem.match(/^(.*?)\s*(\d+.*)$/);
        if (match) {
          return { label: match[1].trim(), value: match[2].trim() };
        }
        return null;
      }).filter(Boolean)
    : [];

  const waNum = property.WhatsApp ? String(property.WhatsApp).replace(/\D/g, '') : '905459418536';
  const formattedRoomType = property['card odalar'] || 'daire';
  
  const mainWaMsg = `Merhaba, lansmanbul.com portalında yer alan ${property.testproje || ''} projenizdeki ${formattedRoomType} daire tipi ile ilgileniyorum. Güncel boş kat listesini ve ödeme planını paylaşabilir misiniz?`;
  const planWaMsg = `Merhaba, lansmanbul.com portalında yer alan ${property.testproje || ''} projenizin ${formattedRoomType} planı için hangi katların şu an müsait olduğunu öğrenebilir miyim?`;

  const waBtnLink = `https://wa.me/${waNum}?text=${encodeURIComponent(mainWaMsg)}`;
  const waPlanBtnLink = `https://wa.me/${waNum}?text=${encodeURIComponent(planWaMsg)}`;

  const openLightbox = (photoArray, index) => {
    setLightboxState({
      isOpen: true,
      photos: photoArray,
      activeIndex: index,
    });
  };

  const nextPhoto = () => {
    if (galleryPhotos.length > 1) {
      setActivePhotoIndex((prev) => (prev + 1) % galleryPhotos.length);
    }
  };

  const prevPhoto = () => {
    if (galleryPhotos.length > 1) {
      setActivePhotoIndex((prev) => (prev - 1 + galleryPhotos.length) % galleryPhotos.length);
    }
  };

  // Парсинг и форматирование даты стройки (например, "21.11.2026" -> "Kasım 2026")
  const rawSantiyeDate = property['Santiye Tarihi'] || property.Santiye_Tarihi || '';
  const formattedSantiyeDate = (() => {
    if (!rawSantiyeDate) return '';
    const parts = String(rawSantiyeDate).split('.');
    if (parts.length >= 3) {
      const monthIdx = parseInt(parts[1]) - 1;
      const year = parts[2].replace(/\D/g, ''); // очищаем от возможных точек на конце
      const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${months[monthIdx]} ${year}`;
      }
    }
    return rawSantiyeDate;
  })();

  const seoDesc = property.Açıklama 
    ? property.Açıklama.substring(0, 160) 
    : `${property.testproje || 'Lansman'} projesi detayları, fiyatları.`;

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

      <div className="projeland-card-container bg-slate-50 text-slate-800 antialiased min-h-screen relative pt-28 pb-12">
        <div className="max-w-[1400px] mx-auto px-5">
          
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
                  <span className="text-[#00A4A6] text-base leading-none">📍</span>
                  <span className="break-words max-w-full">
                    {property['İlçe/Semt'] ? `${property['İlçe/Semt']}, Ankara` : 'Ankara, Türkiye'}
                  </span>
                </p>
              </div>

              <Link href={`/?scrollto=${property.id}`} className="back-button" id="back-button">
                ◀ Kataloğa Dön
              </Link>
            </div>
          </header>

          {/* КОЛОНКИ КОНТЕНТА */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* ЛЕВАЯ КОЛОНКА */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* СЛАЙДЕР С ТАМБНЕЙЛАМИ */}
              {galleryPhotos.length > 0 && (
                <section className="space-y-3">
                  <div className="relative w-full h-[500px] rounded-2xl overflow-hidden bg-slate-950 group shadow-sm border border-slate-100">
                    <img 
                      src={galleryPhotos[activePhotoIndex]} 
                      className="w-full h-full object-cover cursor-zoom-in" 
                      alt="Proje Görseli" 
                      onClick={() => openLightbox(galleryPhotos, activePhotoIndex)}
                    />

                    {/* Кнопка во весь экран */}
                    <button 
                      onClick={() => openLightbox(galleryPhotos, activePhotoIndex)}
                      className="absolute top-4 right-4 bg-black/40 backdrop-blur-md hover:bg-black/60 text-white p-3 rounded-full transition shadow-md"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 20.25v-4.5m0 4.5h-4.5m4.5 0L15 15" />
                      </svg>
                    </button>

                    {/* Стрелки */}
                    {galleryPhotos.length > 1 && (
                      <>
                        <button onClick={prevPhoto} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg transition opacity-0 group-hover:opacity-100 shadow-md">❮</button>
                        <button onClick={nextPhoto} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg transition opacity-0 group-hover:opacity-100 shadow-md">❯</button>
                      </>
                    )}

                    {/* Плавающие капсулы по центру внизу фото */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-full border border-white/10 shadow-lg text-xs font-bold text-white whitespace-nowrap">
                      {planPhoto && (
                        <button 
                          onClick={() => openLightbox(planPhotosList, 0)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 transition"
                        >
                          <span>📋</span>
                          <span>Plan</span>
                        </button>
                      )}
                      <button 
                        onClick={() => openLightbox(galleryPhotos, activePhotoIndex)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-full hover:bg-slate-800 transition text-slate-300"
                      >
                        <span>📷</span>
                        <span>{galleryPhotos.length} Fotoğraf</span>
                      </button>
                    </div>
                  </div>

                  {/* Горизонтальная лента миниатюр */}
                  {galleryPhotos.length > 1 && (
                    <div className="flex items-center gap-3 overflow-x-auto py-1 px-1 no-scrollbar">
                      {galleryPhotos.map((url, idx) => (
                        <div 
                          key={idx}
                          onClick={() => setActivePhotoIndex(idx)}
                          className={`w-20 h-14 rounded-xl overflow-hidden cursor-pointer shrink-0 transition-all ${idx === activePhotoIndex ? 'border-2 border-[#00A4A6] scale-102' : 'border border-transparent opacity-70 hover:opacity-100'}`}
                        >
                          <img src={url} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* ХАРАКТЕРИСТИКИ ЖК С КРАСИВЫМИ ИКОНКАМИ */}
              <section className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm">
                <h2 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-3 mb-6">Öne Çıkan Özellikler</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6">
                  
                  <div className="flex items-start gap-3">
                    <div className="text-2xl text-slate-400 mt-0.5">📐</div>
                    <div>
                      <div className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wide">Toplam Alan</div>
                      <div className="text-base font-black text-slate-800">{property['card-area'] ? `${property['card-area']} m²` : 'Esnek'}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="text-2xl text-slate-400 mt-0.5">🚪</div>
                    <div>
                      <div className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wide">Oda Sayısı</div>
                      <div className="text-base font-black text-slate-800">{property['card odalar'] || 'Belirtilmemiş'}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="text-2xl text-slate-400 mt-0.5">🪜</div>
                    <div>
                      <div className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wide">Toplam Kat</div>
                      <div className="text-base font-black text-slate-800">
                        {property['Kat Sayısı'] || property.Kat_Sayisi || property.katsayisi ? `${property['Kat Sayısı'] || property.Kat_Sayisi || property.katsayisi} Katlı` : 'Belirtilmemiş'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="text-2xl text-slate-400 mt-0.5">🔑</div>
                    <div>
                      <div className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wide">Teslim Yılı</div>
                      <div className="text-base font-black text-slate-800">{property.Teslim_Yili || property.teslim_yili || '2027'}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="text-2xl text-slate-400 mt-0.5">🏢</div>
                    <div>
                      <div className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wide">Proje Durumu</div>
                      <div className="text-base font-black text-slate-800">{property.konutcesit || 'Devam Ediyor'}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="text-2xl text-slate-400 mt-0.5">🖌️</div>
                    <div>
                      <div className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wide">İç Dekorasyon</div>
                      <div className="text-base font-black text-slate-800">{property.Dekorasyon || 'Anahtar Teslim'}</div>
                    </div>
                  </div>

                </div>
              </section>

             {/* === НОВОЕ: Динамический Блок Планировок (Аккордеон) для ЖК === */}
              {property.is_project && layouts.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h2 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-3 mb-4">Kullanılabilir Daire Tipleri</h2>
                  <p className="text-sm text-slate-500 mb-5">Projede sunulan tüm daire seçenekleri и планировки:</p>
                  
                  <div className="space-y-3">
                    {layouts.map((layout, idx) => {
                      const isExpanded = activeAccordion === String(layout.rooms).trim();
                      const isSold = layout.status === 'sold';
                      const planImage = layout.plan_image;

                      return (
                        <div 
                          key={idx} 
                          className={`border rounded-xl transition-all ${
                            isExpanded 
                              ? 'border-[#00A4A6] bg-slate-50/50 shadow-sm' 
                              : 'border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          {/* Заголовок вкладки */}
                          <div 
                            onClick={() => !isSold && setActiveAccordion(isExpanded ? '' : String(layout.rooms).trim())}
                            className={`p-4 flex items-center justify-between select-none ${isSold ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-base font-extrabold text-slate-800">{layout.rooms}</span>
                              <span className="text-xs text-slate-400 font-semibold">• {layout.area} m²'den</span>
                            </div>

                            <div className="flex items-center gap-4">
                              <span className={`text-sm font-black ${isSold ? 'text-red-500' : 'text-[#00A4A6]'}`}>
                                {isSold ? 'Satıldı' : formatPrice(layout.price, true)}
                              </span>
                              {!isSold && (
                                <svg 
                                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-[#00A4A6]' : ''}`} 
                                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"
                                >
                                  <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                              )}
                            </div>
                          </div>

                          {/* Контент вкладки (Схема планировки Kat Planı) */}
                          {isExpanded && !isSold && (
                            <div className="p-4 border-t border-dashed border-slate-200 bg-white rounded-b-xl flex flex-col md:flex-row gap-6 items-center">
                              {planImage ? (
                                <div className="max-w-[180px] shrink-0">
                                  <img 
                                    src={planImage} 
                                    alt={`${layout.rooms} Planı`}
                                    onClick={() => openLightbox([planImage], 0)}
                                    className="w-full h-auto max-h-40 object-contain rounded-lg cursor-zoom-in mix-blend-multiply"
                                  />
                                </div>
                              ) : (
                                <div className="w-32 h-24 bg-slate-50 border border-dashed rounded-lg flex items-center justify-center text-[10px] text-slate-400">
                                  Plan Görseli Yok
                                </div>
                              )}
                              
                              <div className="flex-1 space-y-3">
                                <h4 className="text-sm font-extrabold text-slate-800">{layout.rooms} Daire Plan Detayları</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                  Bu daire tipi {layout.area} m² kullanım alanına sahiptir. Fiyatlar {formatPrice(layout.price, true)} başlamaktadır. Güncel boş kat listesi için doğrudan müteahhit ile WhatsApp üzerinden iletişime geçebilirsiniz.
                                </p>
                                <a 
                                  href={`https://wa.me/${waNum}?text=${encodeURIComponent(`Merhaba, ${property.testproje || ''} projesindeki ${layout.rooms} tipi daireler hakkında detaylı bilgi alabilir miyim?`)}`}
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#25D366] text-white text-xs font-bold rounded-lg hover:bg-[#20ba5a] transition text-decoration-none uppercase tracking-wider shadow-sm"
                                >
                                  WhatsApp'tan Kat Sor
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Kat ve Daire Planları (Отображается только для одиночных готовых квартир Tek Daireler) */}
              {!property.is_project && planPhoto && (
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h2>Kat ve Daire Planları</h2>
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
                    
                    <p className="text-center text-xs text-gray-400 mt-4 max-w-md leading-relaxed border-t border-gray-200/60 pt-3">
                      Güncel boş dairelerin listesini, katlarını ve fiyatlarını doğrudan yapıcı firmadan (müteahhit) WhatsApp üzerinden öğrenebilirsiniz.
                    </p>

                    <a id="whatsapp-plan-btn" href={waPlanBtnLink} target="_blank" rel="noopener noreferrer" className="mt-4 px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition duration-200 w-full md:w-auto uppercase tracking-wider font-bold text-xs">
                      Müsait Katları WhatsApp'tan Sor
                    </a>
                  </div>
                </div>
              )}

              {/* Местоположение и Расстояния */}
              {(parsedDistances.length > 0 || property.latitude || property.Harita_Link) && (
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h2>Konum ve Mesafeler</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="w-full h-48 bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                      {property.latitude && property.longitude ? (
                        <div ref={mapRef} className="w-full h-full" />
                      ) : property.Harita_Link ? (
                        <iframe src={property.Harita_Link} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy"></iframe>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">📍 Harita Alanı</div>
                      )}
                    </div>

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

              {/* Описание */}
              {property.Açıklama && (
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h2>Proje Hakkında</h2>
                  <div className="text-gray-600 leading-relaxed whitespace-pre-line break-words text-sm md:text-base">
                    {property.Açıklama}
                  </div>
                  {featuresList.length > 0 && (
                    <div className="flex flex-wrap gap-2.5 mt-6">
                      {featuresList.map((feat, index) => (
                        <span key={index} className="bg-slate-100 text-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-full inline-flex items-center gap-1.5 whitespace-nowrap shadow-sm border border-slate-200/40">
                          <span>{getFeatureIcon(feat)}</span>
                          <span>{feat}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Дневник Стройки */}
              {constructionPhotos.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h2>Şantiye Günlüğü {formattedSantiyeDate ? `(${formattedSantiyeDate})` : ''}</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {constructionPhotos.map((url, index) => (
                      <div 
                        key={index} 
                        onClick={() => openLightbox(constructionPhotos, index)}
                        className="h-32 bg-cover bg-center rounded-lg cursor-zoom-in hover:opacity-95 transition shadow-sm" 
                        style={{ backgroundImage: `url('${url}')` }}
                      ></div>
                    ))}
                  </div>
                  {rawSantiyeDate && (
                    <p className="text-[11px] text-slate-400 mt-3 font-semibold flex items-center gap-1">
                      📅 Son güncelleme: {rawSantiyeDate}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ПРАВАЯ СТИКИ-КОЛОНКА (САЙДБАР) */}
            <div className="lg:col-span-1 luxe-sticky-sidebar">
              <div className="bg-white p-6 rounded-3xl shadow-[0_15px_45px_rgba(0,0,0,0.06)] border border-slate-100 space-y-6">
                <div>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Başlangıç Fiyatı</span>
                  <div className="text-3xl font-black text-[#00A4A6] mt-1">
                    {formatPrice(property.Fiyat)}
                  </div>
                </div>

                {/* Финансовый блок */}
                <div id="block-finance" className="space-y-3 border-t border-b border-gray-100 py-4">
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-500 font-medium mr-2">İlk Peşinat</span>
                    <span className="text-slate-900 font-bold">
                      {property.Ilk_Pesinat || property.pesinat || 'Esnek Plan'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-500 font-medium mr-2">Vade Seçeneği</span>
                    <span className="text-slate-900 font-bold">
                      {property.Vade_Secenegi || property.vade || 'Kişiye Özel'}
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

                <div className="space-y-2">
                  <a id="whatsapp-btn" href={waBtnLink} target="_blank" rel="noopener noreferrer" className="w-full py-4 px-4 rounded-xl flex items-center justify-center gap-3 shadow-sm">
                    <span className="flex flex-col text-center leading-tight tracking-wider uppercase font-black">
                      <span className="text-xs text-white">Doğrudan Müteahhitten</span>
                      <span className="font-bold opacity-90 text-[10px] mt-0.5 text-white">Bilgi Al</span>
                    </span>
                  </a>
                  
                  {/* ИСПРАВЛЕННЫЙ БРЕНД СНОСКИ LANSMANBUL */}
                  <p className="text-center text-[10px] text-gray-400 mt-2 leading-relaxed">
                    Tıklama sayınız <strong className="text-slate-500 font-bold">LansmanBul</strong> güvencesiyle kaydedilmektedir.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ЛАЙТБОКС */}
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

      {/* ЛОКАЛЬНЫЕ ИЗОЛИРОВАННЫЕ СТИЛИ СТРАНИЦЫ */}
      <style jsx global>{`
        .projeland-card-container {
          font-family: 'Mulish', sans-serif !important;
        }

        .projeland-card-container h2 {
          border-bottom: 1px solid #E5E7EB !important;
          padding-bottom: 8px !important;
          margin-bottom: 16px !important;
          font-size: 1.25rem !important;
          font-weight: 700 !important;
          color: #111827 !important;
        }

        #back-button {
          color: #64748B !important;
          font-weight: 700 !important;
          font-size: 0.875rem !important;
          text-decoration: none !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 0.25rem !important;
          transition: color 0.2s ease !important;
        }
        #back-button:hover {
          color: #111827 !important;
        }
        
        .luxe-sticky-sidebar {
          position: sticky !important;
          top: 130px !important;
          z-index: 20 !important;
        }

        html, body, .projeland-card-container {
          overflow: visible !important;
        }

        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        #whatsapp-btn {
          background-color: #00A4A6 !important;
          border: 2px solid #00A4A6 !important;
          color: #ffffff !important;
          transition: all 0.25s ease !important;
        }
        #whatsapp-btn:hover {
          background-color: #00898B !important;
          border-color: #00898B !important;
          color: #ffffff !important;
        }

        #whatsapp-plan-btn {
          background-color: #00A4A6 !important;
          border: 2px solid #00A4A6 !important;
          color: #ffffff !important;
          transition: all 0.25s ease !important;
        }
        #whatsapp-plan-btn:hover {
          background-color: #00898B !important;
          border-color: #00898B !important;
          color: #ffffff !important;
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
      `}</style>
    </>
  );
}

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
