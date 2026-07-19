import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '../../supabase';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function PropertyDetails({ property, error }) {
  const router = useRouter();
  
  // Состояния для Лайтбокса
  const [lightbox, setLightbox] = useState({
    isOpen: false,
    photos: [],
    activeIndex: 0,
  });

  if (error || !property) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
          <h2 className="text-2xl font-black text-gray-800">Proje Bulunamadı</h2>
          <p className="text-gray-500 mt-2 text-center">Aradığınız ilan mevcut olmayabilir veya silinmiş olabilir.</p>
          <button onClick={() => router.push('/')} className="mt-6 px-6 py-3 bg-[#00A4A6] text-white font-bold rounded-xl shadow-md hover:bg-[#00898B] transition">
            Kataloğa Dön
          </button>
        </div>
        <Footer />
      </>
    );
  }

  // Распределение медиафайлов из связанных строк таблицы property_images
  const propertyImages = property.property_images || [];
  const photoUrls = propertyImages.map(img => img.image_url).filter(Boolean);
  const constructionUrls = propertyImages.map(img => img.Construction).filter(Boolean);
  const planUrls = propertyImages.map(img => img.planfoto).filter(Boolean);
  const planPhotoUrl = planUrls[0] || null;

  // Парсинг характеристик (Özellikler)
  let features = [];
  if (property.Özellikler) {
    if (Array.isArray(property.Özellikler)) {
      features = property.Özellikler;
    } else {
      try {
        features = JSON.parse(property.Özellikler);
      } catch {
        features = String(property.Özellikler).split(',').map(f => f.trim()).filter(Boolean);
      }
    }
  }

  // Парсинг расстояний (Konum Mesafeler)
  const distancesRaw = property["Konum Mesafeler"] || property.distances_text || "";
  const distancesList = distancesRaw ? distancesRaw.split(',').map(item => {
    const parts = item.split(':');
    if (parts.length === 2) {
      return { label: parts[0].trim(), value: parts[1].trim() };
    }
    return null;
  }).filter(Boolean) : [];

  // Конфигурация кнопки "Назад"
  const backUrl = `/?scrollto=${property.id}`;

  // Форматирование цен
  const formatPrice = (val) => {
    if (!val) return "Fiyat Belirtilmemiş";
    let numOnly = String(val).replace(/[^0-9]/g, "");
    return (numOnly === "" || numOnly === "0") ? val : Number(numOnly).toLocaleString('tr-TR') + " TL'den";
  };

  // Иконки и эмодзи для расстояний
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

  // Иконки для характеристик
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

  // Открытие Лайтбокса
  const openLightbox = (photosList, index = 0) => {
    if (!photosList || photosList.length === 0) return;
    setLightbox({
      isOpen: true,
      photos: photosList,
      activeIndex: index,
    });
  };

  // Навигация внутри Лайтбокса
  const handleNext = (e) => {
    if (e) e.stopPropagation();
    setLightbox(prev => ({
      ...prev,
      activeIndex: (prev.activeIndex + 1) % prev.photos.length,
    }));
  };

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    setLightbox(prev => ({
      ...prev,
      activeIndex: (prev.activeIndex - 1 + prev.photos.length) % prev.photos.length,
    }));
  };

  // Слушатель клавиш для Лайтбокса
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightbox.isOpen) return;
      if (e.key === 'Escape') setLightbox(prev => ({ ...prev, isOpen: false }));
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightbox.isOpen, lightbox.photos]);

  // Формирование WhatsApp шаблонов
  const projectTitle = property.testproje || property.title || "";
  const roomType = property["card odalar"] || property.rooms_text || "daire";
  const rawWa = property.WhatsApp || "905459418536";
  const waNum = String(rawWa).replace(/\D/g, '');

  const mainMsg = `Merhaba, KonutBudur portalında yer alan ${projectTitle} projenizdeki ${roomType} daire tipi ile ilgileniyorum. Güncel boş kat listesini ve ödeme planını paylaşabilir misiniz?`;
  const floorMsg = `Merhaba, KonutBudur portalında yer alan ${projectTitle} projenizin ${roomType} planı için hangi katların şu an müsait olduğunu öğrenebilir miyim?`;

  const waMainUrl = `https://wa.me/${waNum}?text=${encodeURIComponent(mainMsg)}`;
  const waFloorUrl = `https://wa.me/${waNum}?text=${encodeURIComponent(floorMsg)}`;

  // Логика отображения статусов
  const statusValue = property.konutcesit || "";
  const badgeColor = statusValue.toLowerCase() === 'lansman' ? '#FF9800' : '#00A4A6';

  // Логика отображения этажности
  const katSayisiRaw = property["Kat Sayısı"] || property.Kat_Sayisi || property.katsayisi || "";
  const katSayisi = String(katSayisiRaw).trim();
  const showKatBadge = katSayisi && katSayisi !== "-";

  // Логика дат Шантийе (Construction)
  const constructionDate = property["Santiye Tarihi"] || property.Santiye_Tarihi || property.guncelleme || "";
  let formattedConstructionTitle = "Şantiye Günlüğü";
  if (constructionDate) {
    const dateParts = String(constructionDate).split('.');
    if (dateParts.length === 3) {
      const month = dateParts[1];
      const year = dateParts[2];
      const monthNames = {
        "01": "Ocak", "02": "Şubat", "03": "Mart", "04": "Nisan", 
        "05": "Mayıs", "06": "Haziran", "07": "Temmuz", "08": "Ağustos", 
        "09": "Eylül", "10": "Ekim", "11": "Kasım", "12": "Aralık"
      };
      if (monthNames[month]) {
        formattedConstructionTitle = `Şantiye Günlüğü (${monthNames[month]} ${year})`;
      }
    }
  }

  // Определение макета сетки галереи (Airbnb)
  const renderGallery = () => {
    if (photoUrls.length === 0) {
      return (
        <div className="w-full h-80 bg-gray-100 flex items-center justify-center text-gray-400 rounded-2xl">
          Fotoğraf Bulunamadı
        </div>
      );
    }

    if (photoUrls.length === 1) {
      return (
        <div className="gallery-layout-1">
          <div className="gallery-item" onClick={() => openLightbox(photoUrls, 0)} style={{ backgroundImage: `url('${photoUrls[0]}')` }}></div>
        </div>
      );
    }

    if (photoUrls.length === 2) {
      return (
        <div className="gallery-layout-2">
          {photoUrls.map((url, i) => (
            <div key={i} className="gallery-item" onClick={() => openLightbox(photoUrls, i)} style={{ backgroundImage: `url('${url}')` }}></div>
          ))}
        </div>
      );
    }

    if (photoUrls.length === 3) {
      return (
        <div className="gallery-layout-3">
          <div className="gallery-item" onClick={() => openLightbox(photoUrls, 0)} style={{ backgroundImage: `url('${photoUrls[0]}')` }}></div>
          <div className="gallery-item" onClick={() => openLightbox(photoUrls, 1)} style={{ backgroundImage: `url('${photoUrls[1]}')` }}></div>
          <div className="gallery-item" onClick={() => openLightbox(photoUrls, 2)} style={{ backgroundImage: `url('${photoUrls[2]}')` }}></div>
        </div>
      );
    }

    if (photoUrls.length === 4) {
      return (
        <div className="gallery-layout-4">
          {photoUrls.slice(0, 4).map((url, i) => (
            <div key={i} className="gallery-item" onClick={() => openLightbox(photoUrls, i)} style={{ backgroundImage: `url('${url}')` }}></div>
          ))}
        </div>
      );
    }

    // От 5 и более фотографий (Макет Airbnb с оверлеем)
    const hasMore = photoUrls.length > 5;
    const moreCount = photoUrls.length - 4;

    return (
      <div className="gallery-layout-5">
        <div className="gallery-item gallery-item-main" onClick={() => openLightbox(photoUrls, 0)} style={{ backgroundImage: `url('${photoUrls[0]}')` }}></div>
        <div className="gallery-item gallery-item-top-mid" onClick={() => openLightbox(photoUrls, 1)} style={{ backgroundImage: `url('${photoUrls[1]}')` }}></div>
        <div className="gallery-item gallery-item-top-right" onClick={() => openLightbox(photoUrls, 2)} style={{ backgroundImage: `url('${photoUrls[2]}')` }}></div>
        <div className="gallery-item gallery-item-bottom-mid" onClick={() => openLightbox(photoUrls, 3)} style={{ backgroundImage: `url('${photoUrls[3]}')` }}></div>
        <div className="gallery-item gallery-item-bottom-right" onClick={() => openLightbox(photoUrls, 4)} style={{ backgroundImage: `url('${photoUrls[4]}')` }}>
          {hasMore && (
            <div className="gallery-overlay" onClick={(e) => { e.stopPropagation(); openLightbox(photoUrls, 4); }}>
              <span className="gallery-overlay-text">+{moreCount}</span>
              <span className="gallery-overlay-subtext">Hepsini Gör</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>{projectTitle} | LANSMANBUL</title>
        <meta name="description" content={property.Açıklama || property.Aciklama || "Proje Detayları"} />
        <link href="https://fonts.googleapis.com/css2?family=Mulish:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      <Header />

      <div className="projeland-card-container bg-slate-50 text-slate-800 antialiased min-h-screen relative pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 pt-4 fade-in">
          
          {/* ШАПКА КАРТОЧКИ ОБЪЕКТА */}
          <header className="mb-6">
            <div className="flex justify-between items-start w-full">
              <div>
                {statusValue && (
                  <div className="mb-2">
                    <span className="text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider inline-block" style={{ backgroundColor: badgeColor }}>
                      {statusValue}
                    </span>
                  </div>
                )}
                <h1 className="text-3xl font-black text-slate-900 mt-2">{projectTitle}</h1>
                <div className="mt-1">
                  <p className="text-slate-500 mt-1 flex items-center gap-1 text-sm">
                    <svg className="w-4 h-4 text-[#00A4A6] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    <span className="break-words max-w-full">{property["Tam Adres"] || property["İlçe/Semt"] || "Ankara"}</span>
                  </p>
                </div>
              </div>
              
              <button onClick={() => router.push(backUrl)} className="text-slate-500 hover:text-slate-900 font-bold text-sm inline-flex items-center gap-1 transition">
                ◀ Kataloğa Dön
              </button>
            </div>
          </header>

          {/* ГАЛЕРЕЯ */}
          <section className="mb-8 overflow-hidden rounded-2xl shadow-sm airbnb-gallery-section">
            <div className="airbnb-gallery w-full relative">
              {renderGallery()}
            </div>
          </section>

          {/* СЕТКА С ДВУМЯ КОЛОНКАМИ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* ЛЕВАЯ КОЛОНКА (КОНТЕНТ) */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* ОПИСАНИЕ И ХАРАКТЕРИСТИКИ */}
              {(property.Açıklama || property.Aciklama) && (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <h2 className="border-b border-slate-200/60 pb-2 mb-4 text-xl font-bold text-slate-900">Proje Hakkında</h2>
                  <div className="text-slate-600 leading-relaxed whitespace-pre-line break-words text-sm md:text-base">
                    {property.Açıklama || property.Aciklama}
                  </div>
                  {features.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-6">
                      {features.map((feat, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full inline-block whitespace-nowrap">
                          {getFeatureIcon(feat)}{feat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* РАССТОЯНИЯ И КАРТА */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h2 className="border-b border-slate-200/60 pb-2 mb-4 text-xl font-bold text-slate-900">Konum ve Mesafeler</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="w-full h-48 bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                    {property.Harita_Link ? (
                      <iframe src={property.Harita_Link} width="100%" height="100%" style={{ border: 0 }} allowFullScreen="" loading="lazy"></iframe>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">📍 Konum bilgisi eklenmemiş</div>
                    )}
                  </div>
                  <div className="space-y-3 justify-center flex flex-col">
                    {distancesList.length > 0 ? (
                      distancesList.map((dist, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 font-medium flex items-center gap-1.5">
                            <span className="text-base leading-none">{getEmoji(dist.label)}</span>
                            <span>{dist.label}</span>
                          </span>
                          <span className="text-[#00A4A6] font-bold">{dist.value}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400">Konum mesafeleri belirtilmemiş.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ПЛАНИРОВКА (KAT PLANI) */}
              {planPhotoUrl && (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <h2 className="border-b border-slate-200/60 pb-2 mb-4 text-xl font-bold text-slate-900">Kat ve Daire Planları</h2>
                  <p className="text-sm text-slate-500 mb-4">Aşağıdaki plandan daire içi yerleşim detaylarını inceleyebilirsiniz:</p>
                  <div className="border border-slate-100 rounded-xl p-4 flex flex-col items-center bg-slate-50">
                    
                    {property["card odalar"] && (
                      <span className="bg-[#00A4A6] text-white text-xs font-bold px-3 py-1 rounded mb-4 inline-block">
                        Örnek {roomType} Planı {property["card-area"] ? `(${property["card-area"]} m²)` : ""}
                      </span>
                    )}

                    <div className="max-w-xs md:max-w-sm w-full">
                      <img 
                        src={planPhotoUrl} 
                        alt="Daire Planı" 
                        onClick={() => openLightbox(planUrls, 0)}
                        className="w-full h-auto object-contain max-h-64 rounded-lg mix-blend-multiply cursor-zoom-in hover:opacity-95 transition duration-200"
                      />
                    </div>
                    
                    {/* ТЕХНИЧЕСКИЕ БЭДЖИ */}
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-extrabold px-3 py-1.5 rounded-full flex items-center gap-1 uppercase tracking-wider">
                        🟢 Farklı Kat Seçenekleri Mevcut
                      </span>
                      {showKatBadge && (
                        <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 uppercase tracking-wider">
                          🏢 {isNaN(katSayisi) ? katSayisi : `${katSayisi} Katlı`}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-center text-xs text-slate-400 mt-4 max-w-md leading-relaxed border-t border-slate-200/60 pt-3">
                      Güncel boş dairelerin listesini, katlarını ve fiyatlarını doğrudan yapıcı firmadan (müteahhit) WhatsApp üzerinden öğrenebilirsiniz.
                    </p>

                    {/* WhatsApp планировки */}
                    <a href={waFloorUrl} target="_blank" rel="noopener noreferrer" className="whatsapp-action-btn mt-4 px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition w-full md:w-auto uppercase tracking-wider bg-[#00A4A6] hover:bg-[#00898B] text-white font-black text-xs">
                      <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.156 5.156 0 11.487 0c3.067.001 5.95 1.196 8.114 3.363 2.164 2.167 3.357 5.053 3.355 8.12-.003 6.325-5.157 11.48-11.485 11.48-1.999-.001-3.968-.521-5.71-1.513L0 24zm6.59-4.846c1.642.975 3.251 1.489 4.84 1.49 4.996 0 9.06-4.061 9.062-9.058 0-2.42-1.014-4.701-2.731-6.418C16.035 3.45 13.84 2.502 11.487 2.502 6.49 2.502 2.428 6.564 2.426 11.56c-.001 1.638.484 3.235 1.401 4.7l-.955 3.486 3.575-.937z"></path>
                      </svg>
                      Müsait Katları WhatsApp'tan Sor
                    </a>
                  </div>
                </div>
              )}

              {/* ШАНТИЙЕ (ДНЕВНИК СТРОИТЕЛЬСТВА) */}
              {constructionUrls.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-900 pb-2 border-b border-slate-200/60 mb-4">{formattedConstructionTitle}</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {constructionUrls.slice(0, 4).map((url, idx) => (
                      <div 
                        key={idx} 
                        className="h-32 bg-cover bg-center rounded-lg cursor-zoom-in hover:opacity-95 transition"
                        onClick={() => openLightbox(constructionUrls, idx)}
                        style={{ backgroundImage: `url('${url}')` }}
                      ></div>
                    ))}
                  </div>
                  {constructionDate && (
                    <p className="text-xs text-slate-400 mt-3 text-right">Son Güncelleme: {constructionDate}</p>
                  )}
                </div>
              )}

            </div>

            {/* ПРАВАЯ КОЛОНКА (СТОИМОСТЬ И КОНТАКТЫ) */}
            <div className="lg:col-span-1 lg:sticky lg:top-28 z-20">
              <div className="bg-white p-6 rounded-3xl border-2 border-[#00A4A6] shadow-lg space-y-6">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Başlangıç Fiyatı</span>
                  <div className="text-3xl font-black text-[#00A4A6] mt-1">
                    {formatPrice(property.Fiyat)}
                  </div>
                </div>

                {/* ФИНАНСОВЫЙ БЛОК */}
                <div className="space-y-3 pt-4 pb-4 border-t border-b border-slate-200/60">
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-slate-500 font-medium mr-2">İlk Peşinat</span>
                    <span className="text-slate-900 font-bold text-right shrink-0 whitespace-nowrap">
                      {property.Ilk_Pesinat || property.pesinat || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-slate-500 font-medium mr-2">Vade Seçeneği</span>
                    <span className="text-slate-900 font-bold text-right shrink-0 whitespace-nowrap">
                      {property.Vade_Secenegi || property.vade || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-slate-500 font-medium mr-2">Kredi Durumu</span>
                    <span className={`font-bold text-right shrink-0 whitespace-nowrap ${
                      String(property.Kredi_Durumu).toLowerCase().includes('değil') || !property.Kredi_Durumu
                        ? 'text-red-500' 
                        : 'text-emerald-600'
                    }`}>
                      {property.Kredi_Durumu || "Krediye Uygun Değil"}
                    </span>
                  </div>
                </div>

                {/* КНОПКА СВЯЗИ */}
                <div className="space-y-2">
                  <a href={waMainUrl} target="_blank" rel="noopener noreferrer" className="w-full py-4 px-4 rounded-xl flex items-center justify-center gap-3 shadow-sm transition bg-[#00A4A6] hover:bg-[#00898B] text-white">
                    <svg className="w-6 h-6 shrink-0 fill-current text-white" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.156 5.156 0 11.487 0c3.067.001 5.95 1.196 8.114 3.363 2.164 2.167 3.357 5.053 3.355 8.12-.003 6.325-5.157 11.48-11.485 11.48-1.999-.001-3.968-.521-5.71-1.513L0 24zm6.59-4.846c1.642.975 3.251 1.489 4.84 1.49 4.996 0 9.06-4.061 9.062-9.058 0-2.42-1.014-4.701-2.731-6.418C16.035 3.45 13.84 2.502 11.487 2.502 6.49 2.502 2.428 6.564 2.426 11.56c-.001 1.638.484 3.235 1.401 4.7l-.955 3.486 3.575-.937z"></path>
                    </svg>
                    <span className="flex flex-col text-center leading-tight tracking-wider uppercase">
                      <span className="font-black text-xs text-white">Doğrudan Müteahhitten</span>
                      <span className="font-bold opacity-90 text-[10px] mt-0.5 text-white">Bilgi Al</span>
                    </span>
                  </a>
                  <p className="text-center text-xs text-slate-400 mt-2">
                    Tıklama sayınız KonutBudur güvencesiyle kaydedilmektedir.
                  </p>
                </div>

              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ЛАЙТБОКС СЛАЙДЕР */}
      {lightbox.isOpen && (
        <div className="custom-lightbox-overlay active" onClick={() => setLightbox(prev => ({ ...prev, isOpen: false }))}>
          <span className="custom-lightbox-close" onClick={() => setLightbox(prev => ({ ...prev, isOpen: false }))}>&times;</span>
          
          <div className="lightbox-slider-container" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-slide">
              <img src={lightbox.photos[lightbox.activeIndex]} alt="Büyük Görsel" />
            </div>

            {lightbox.photos.length > 1 && (
              <>
                <button className="lightbox-arrow lightbox-arrow-left" onClick={handlePrev}>❮</button>
                <button className="lightbox-arrow lightbox-arrow-right" onClick={handleNext}>❯</button>
              </>
            )}
          </div>

          <div className="lightbox-counter">
            {(lightbox.activeIndex + 1) + ' / ' + lightbox.photos.length}
          </div>
        </div>
      )}

      <Footer />

      {/* ЛОКАЛЬНЫЕ СТИЛИ СТРАНИЦЫ КАРТОЧКИ */}
      <style jsx global>{`
        .fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Адаптивная галерея */
        .airbnb-gallery {
          width: 100%;
          height: 500px;
          box-sizing: border-box;
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
        .gallery-layout-1 .gallery-item { border-radius: 16px; }

        .gallery-layout-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: 100%; height: 100%; }
        .gallery-layout-2 .gallery-item:nth-child(1) { border-radius: 16px 0 0 16px; }
        .gallery-layout-2 .gallery-item:nth-child(2) { border-radius: 0 16px 16px 0; }

        .gallery-layout-3 { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px; width: 100%; height: 100%; }
        .gallery-layout-3 .gallery-item:nth-child(1) { border-radius: 16px 0 0 16px; }
        .gallery-layout-3 .gallery-item:nth-child(2) { border-radius: 0px; }
        .gallery-layout-3 .gallery-item:nth-child(3) { border-radius: 0 16px 16px 0; }

        .gallery-layout-4 { display: grid; grid-template-columns: 3fr 1fr 1fr 1fr; gap: 12px; width: 100%; height: 100%; }
        .gallery-layout-4 .gallery-item:nth-child(1) { border-radius: 16px 0 0 16px; }
        .gallery-layout-4 .gallery-item:nth-child(2), .gallery-layout-4 .gallery-item:nth-child(3) { border-radius: 0px; }
        .gallery-layout-4 .gallery-item:nth-child(4) { border-radius: 0 16px 16px 0; }

        .gallery-layout-5 {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          grid-template-rows: 1fr 1fr;
          gap: 12px;
          width: 100%;
          height: 100%;
        }
        .gallery-layout-5 .gallery-item-main { grid-row: span 2; border-radius: 16px 0 0 16px; }
        .gallery-layout-5 .gallery-item-top-mid, .gallery-layout-5 .gallery-item-bottom-mid { border-radius: 0px; }
        .gallery-layout-5 .gallery-item-top-right { border-radius: 0 16px 0 0; }
        .gallery-layout-5 .gallery-item-bottom-right { border-radius: 0 0 16px 0; position: relative; }

        /* Кнопка "+ ещё фото" */
        .gallery-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          color: #ffffff;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          transition: background 0.25s ease;
          border-radius: 0 0 16px 0;
          text-align: center;
          box-sizing: border-box;
          user-select: none;
        }
        .gallery-overlay:hover {
          background: rgba(0, 0, 0, 0.65);
        }
        .gallery-overlay-text {
          font-size: 1.5rem;
          font-weight: 800;
          color: #ffffff;
          line-height: 1;
        }
        .gallery-overlay-subtext {
          font-size: 0.75rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.9);
          margin-top: 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background-color: rgba(255, 255, 255, 0.15);
          padding: 4px 10px;
          border-radius: 9999px;
          display: inline-block;
        }

        /* Стилизация заголовков и линий */
        .projeland-card-container h2 {
          font-family: 'Mulish', sans-serif;
        }

        @media (max-width: 768px) {
          .airbnb-gallery {
            height: 250px;
          }
          .gallery-layout-2, .gallery-layout-3, .gallery-layout-4, .gallery-layout-5 {
            display: block;
          }
          .gallery-layout-2 .gallery-item:not(:first-child),
          .gallery-layout-3 .gallery-item:not(:first-child),
          .gallery-layout-4 .gallery-item:not(:first-child),
          .gallery-layout-5 .gallery-item:not(.gallery-item-main) {
            display: none;
          }
          .gallery-layout-2 .gallery-item:first-child,
          .gallery-layout-3 .gallery-item:first-child,
          .gallery-layout-4 .gallery-item:first-child,
          .gallery-layout-5 .gallery-item-main {
            border-radius: 16px;
          }

          /* Летающая плавающая кнопка в мобильном макете */
          .gallery-layout-2::after, 
          .gallery-layout-3::after, 
          .gallery-layout-4::after, 
          .gallery-layout-5::after {
            content: "📷 Tüm Fotoğraflar";
            position: absolute;
            bottom: 15px;
            right: 15px;
            background-color: rgba(30, 41, 59, 0.85);
            color: #ffffff;
            font-size: 11px;
            font-weight: 800;
            padding: 6px 14px;
            border-radius: 20px;
            backdrop-filter: blur(4px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            z-index: 10;
            pointer-events: none;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
        }
      `}</style>
    </>
  );
}

// Запрос данных на сервере для оптимального SEO и быстрой загрузки
export async function getServerSideProps(context) {
  const { id } = context.params;

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/^["']|["']$/g, '').trim();
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').replace(/^["']|["']$/g, '').trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      props: {
        property: null,
        error: "Supabase key missing",
      },
    };
  }

  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*, property_images(*)')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return {
      props: {
        property: data || null,
        error: null,
      },
    };
  } catch (err) {
    console.error("Fetch detailed property error:", err);
    return {
      props: {
        property: null,
        error: err.message || "Failed to load",
      },
    };
  }
}
