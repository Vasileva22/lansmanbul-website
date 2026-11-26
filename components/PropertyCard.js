import { useState, useEffect } from 'react';
import Link from 'next/link';

// Этапы стройки — шкала «как у заказа на маркетплейсе»
const STAGE_ORDER = ['lansman', 'temel', 'kaba_insaat', 'ince_isler', 'teslim'];
const STAGE_LABELS = { lansman: 'Lansman', temel: 'Temel', kaba_insaat: 'Kaba inşaat', ince_isler: 'İnce işler', teslim: 'Teslim' };

function daysAgoText(iso) {
  if (!iso) return '';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return 'bugün güncellendi';
  if (days === 1) return 'dün güncellendi';
  if (days < 30) return `${days} gün önce güncellendi`;
  const months = Math.floor(days / 30);
  return `${months} ay önce güncellendi`;
}

export function StageBar({ stage, updatedAt, deliveryText, projectStatus }) {
  let idx = STAGE_ORDER.indexOf(stage);
  let label = STAGE_LABELS[stage];
  let inProgress = false; // точный этап неизвестен, но стройка идёт
  if (idx < 0) {
    const st = String(projectStatus || '').toLowerCase();
    if (st.includes('tamam')) { idx = 4; label = 'Teslim edildi'; }
    else if (st.includes('lansman')) { idx = 0; label = 'Lansman'; }
    else if (st.includes('devam')) { idx = 0; inProgress = true; label = 'İnşaat devam ediyor'; }
    else return null;
    updatedAt = null;
  }
  const parts = [label, daysAgoText(updatedAt), deliveryText].filter(Boolean);
  return (
    <div style={{ margin: '8px 0 6px' }} title="İnşaat aşaması">
      <div style={{ display: 'flex', gap: 3 }}>
        {STAGE_ORDER.map((st, i) => (
          <div key={st} style={{ flex: 1, height: 5, borderRadius: 3, background: i <= idx ? '#0F6E56' : (inProgress && i < 4 ? 'repeating-linear-gradient(90deg, #9FE1CB 0 6px, #dfe5e3 6px 10px)' : '#dfe5e3') }} />
        ))}
      </div>
      <div style={{ fontSize: 12, color: '#5B6B68', marginTop: 4 }}>{parts.join(' · ')}</div>
    </div>
  );
}

// Заглушка вместо фото для справочной карточки
function ReferenceCover({ area, compact = false }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#E1F5EE', color: '#085041', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, textAlign: 'center', padding: 12 }}>
      <svg width={compact ? 26 : 30} height={compact ? 26 : 30} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v.01M9 12v.01M9 15v.01M9 18v.01" />
      </svg>
      <span style={{ fontSize: 12, fontWeight: 600 }}>{area}</span>
    </div>
  );
}

const refNoteStyle = { fontSize: 12.5, color: '#5B6B68', background: '#f1f5f4', borderRadius: 8, padding: '8px 10px', margin: '8px 0', lineHeight: 1.4 };
const CLAIM_WA = '905459418536';
function claimLink(name) {
  const text = `Merhaba, lansmanbul.com'daki "${name || ''}" projesinin yetkilisiyim. Sayfayı onaylamak ve fiyat/fotoğraf eklemek istiyorum.`;
  return `https://wa.me/${CLAIM_WA}?text=${encodeURIComponent(text)}`;
}

export default function PropertyCard({ property, onImageClick, selectedRooms = [], layout = 'grid' }) {
  // 1. Функция безопасного парсинга картинок
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
          console.error("JSON parsing error inside PropertyCard:", e);
        }
      }
      
      return trimmed.split(/[\s,]+/).filter(val => val !== '' && val !== 'EMPTY');
    }
    
    return [];
  };

  const photos = property?.property_images
    ? property.property_images.flatMap(img => parseJsonbPhotos(img?.image_url))
    : [];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // Состояние раскрытия планировок

  // 2. Считываем состояние избранного при монтировании
  useEffect(() => {
    if (typeof window === 'undefined' || !property?.id) return;
    const favs = JSON.parse(localStorage.getItem('kb-favorites') || '[]');
    setIsFavorite(favs.includes(property.id));
  }, [property?.id]);

  // 3. Функция переключения избранного
  const toggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window === 'undefined' || !property?.id) return;
    
    const favs = JSON.parse(localStorage.getItem('kb-favorites') || '[]');
    let updatedFavs;
    
    if (favs.includes(property.id)) {
      updatedFavs = favs.filter(id => id !== property.id);
      setIsFavorite(false);
    } else {
      updatedFavs = [...favs, property.id];
      setIsFavorite(true);
    }
    
    localStorage.setItem('kb-favorites', JSON.stringify(updatedFavs));
    
    // Отправляем глобальное событие, чтобы шапка мгновенно обновила счетчик
    window.dispatchEvent(new Event('favorites-updated'));
  };

  const nextSlide = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (photos.length > 1) {
      setCurrentSlide((prev) => (prev + 1) % photos.length);
    }
  };

  const prevSlide = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (photos.length > 1) {
      setCurrentSlide((prev) => (prev - 1 + photos.length) % photos.length);
    }
  };

  // 4. Парсинг JSON-массива планировок layouts
  const layouts = (() => {
    if (!property?.layouts) return [];
    if (Array.isArray(property.layouts)) return property.layouts;
    if (typeof property.layouts === 'string') {
      try {
        return JSON.parse(property.layouts);
      } catch (e) {
        console.error("Layouts parse error in PropertyCard:", e);
      }
    }
    return [];
  })();

  const isProject = property?.is_project === true;
  const isReference = property?.is_reference === true;
  const projectName = property?.testproje?.trim() ? property.testproje : 'Yeni Konut Projesi';
  const locationText = property?.['İlçe/Semt'] || property?.district || property?.city || 'Ankara';

  // 5. Вспомогательная функция форматирования цены
  const formatPrice = (val, isStartPrice = false) => {
    if (!val) return "";
    const num = typeof val === 'number' ? val : parseInt(String(val).replace(/\D/g, ''));
    if (isNaN(num) || num === 0) return val;
    const formatted = num.toLocaleString('tr-TR') + " TL";
    return isStartPrice ? `${formatted}'den` : formatted;
  };

  // 6. Вычисляем динамические параметры для отображения
  let cardRooms = property?.['card odalar'] || '';
  let cardArea = property?.['card-area'] || '';
  let cardPrice = formatPrice(property?.Fiyat, isProject);

  if (isProject && layouts.length > 0) {
    const activeRoomFilter = selectedRooms.length === 1 ? selectedRooms[0] : null;

    if (activeRoomFilter) {
      const matchedLayout = layouts.find(l => String(l.rooms).trim() === activeRoomFilter.trim());
      if (matchedLayout) {
        cardRooms = matchedLayout.rooms;
        cardArea = `${matchedLayout.area} m²'den`;
        cardPrice = formatPrice(matchedLayout.price, true);
      }
    } else {
      // Собираем уникальные чистые типы комнат (1+1, 2+1...) через точку, как в прототипе
      const cleanRoomSet = new Set();
      layouts.forEach(l => {
        const raw = String(l.rooms || '').replace(/[\r\n]+/g, ' ').trim();
        const clean = raw.split(/[-–\s]/)[0].trim();
        if (clean) cleanRoomSet.add(clean);
      });
      const uniqueRoomList = Array.from(cleanRoomSet);
      if (uniqueRoomList.length > 0) {
        cardRooms = uniqueRoomList.join(' · ');
      }

      // Диапазон площадей
      const areas = layouts.map(l => parseInt(String(l.area || '').replace(/\D/g, ''))).filter(Boolean);
      if (areas.length > 0) {
        const minArea = Math.min(...areas);
        const maxArea = Math.max(...areas);
        cardArea = minArea !== maxArea ? `${minArea}–${maxArea}` : `${minArea}`;
      }

      const prices = layouts.map(l => parseInt(String(l.price).replace(/\D/g, ''))).filter(Boolean);
      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        cardPrice = formatPrice(minPrice, true);
      }
    }
  }

  const parseFeatures = (featuresString) => {
    if (!featuresString) return [];
    if (Array.isArray(featuresString)) return featuresString;
    return featuresString
      .split(/[\/,]/)
      .map(s => s.trim())
      .filter(Boolean);
  };

  const olanaklarList = parseFeatures(property?.Özellikler);

  const iconMap = {
    havuz: (
      <svg className="card-svg-icon" viewBox="0 0 24 24">
        <path d="M2 19a3 3 0 0 0 6 0a3 3 0 0 0 6 0a3 3 0 0 0 6 0a3 3 0 0 0 2 0v-2a3 3 0 0 1-2 0a3 3 0 0 1-6 0a3 3 0 0 1-6 0a3 3 0 0 1-6 0a3 3 0 0 1-2 0v2zM2 13a3 3 0 0 0 6 0a3 3 0 0 0 6 0a3 3 0 0 0 6 0a3 3 0 0 0 2 0v-2a3 3 0 0 1-2 0a3 3 0 0 1-6 0a3 3 0 0 1-6 0a3 3 0 0 1-2 0v2z" />
      </svg>
    ),
    fitness: (
      <svg className="card-svg-icon" viewBox="0 0 24 24">
        <path d="M20.57 14.86L22 13.43l-1.43-1.43l-1.43 1.43l-3.57-3.57l1.43-1.43L15.57 7L14.14 8.43l-1.43-1.43l-2.14 2.14l1.43 1.43l-1.43 1.43l-3.57-3.57l1.43-1.43L5 5.57L3.57 7l1.43 1.43l-2.14 2.14L4.29 12l1.43-1.43l3.57 3.57l-1.43 1.43L9.29 17l1.43-1.43l1.43 1.43l2.14-2.14l-1.43-1.43l1.43-1.43l3.57 3.57l-1.43 1.43L18.29 20l1.43-1.43z" />
      </svg>
    ),
    otopark: (
      <svg className="card-svg-icon" viewBox="0 0 24 24">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-6 11h-3v4H8V6h5c1.66 0 3 1.34 3 3s-1.34 3-3 3zm0-5h-3v2h3c.55 0 1-.45 1-1s-.45-1-1-1z" />
      </svg>
    ),
    güvenlik: (
      <svg className="card-svg-icon" viewBox="0 0 24 24">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12c5.16-12 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
      </svg>
    ),
    'çocuk parkı': (
      <svg className="card-svg-icon" viewBox="0 0 24 24">
        <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2s-2-.9-2-2s.9-2 2-2zm9 7h-6v13h-2v-6h-2v-6H9V9H3V7h18v2z" />
      </svg>
    ),
    'site içerisinde': (
      <svg className="card-svg-icon" viewBox="0 0 24 24">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4 6h-2V7h2v2zm-5 0H8V7h2v2zm5 5h-2v-2h2v2zm-5 0H8v-2h2v2zm5 5h-2v-2h2v2zm-5 0H8v-2h2v2z" />
      </svg>
    ),
  };

  const getOlanakIcon = (item) => {
    const norm = item.toLowerCase()
      .replace(/ı/g, 'i')
      .replace(/ş/g, 's')
      .replace(/ç/g, 'c')
      .replace(/ğ/g, 'g')
      .replace(/ö/g, 'o')
      .replace(/ü/g, 'u')
      .trim();
    
    for (let key in iconMap) {
      if (norm.includes(key)) return iconMap[key];
    }
    return null;
  };

  const waRaw = property?.WhatsApp;
  const finalWaLink = (waRaw && String(waRaw).startsWith('http'))
    ? waRaw
    : 'https://wa.me/' + (waRaw ? String(waRaw).replace(/\D/g, '') : "905459418536");

  // Передаем активную планировку в URL детальной страницы
  const detailLink = '/properties/' + property?.id + (selectedRooms.length === 1 ? `?room=${encodeURIComponent(selectedRooms[0])}` : '');
const cleanStatus = property?.konutcesit ? property.konutcesit.trim().toLowerCase() : "";
  const isLansman = cleanStatus === "lansman";
  const isCompleted = cleanStatus.includes('tamam');
  const badgeLabel = isCompleted ? 'Tamamlandı' : (cleanStatus.includes('lansman') ? 'Lansman' : 'Devam ediyor');

  // Умный поиск года сдачи
  const rawYr = String(property?.Teslim_Yili || property?.teslim_yili || '').trim();
  const deliveryText = rawYr ? `Teslim ${rawYr}` : (isCompleted ? 'Teslim hazır' : '');

  // Сбор планировок для таблицы списка
  const listGroups = {};
  layouts.forEach((u) => {
    const rawRoom = String(u.rooms || '').replace(/[\r\n]+/g, ' ').trim();
    const roomType = rawRoom.split(/[-–\s]/)[0].trim() || rawRoom;
    const areaNum = parseInt(String(u.area || '').replace(/\D/g, '')) || 0;
    const priceNum = parseInt(String(u.price || '').replace(/\D/g, '')) || 0;

    if (!listGroups[roomType]) {
      listGroups[roomType] = { room: roomType, minArea: areaNum, maxArea: areaNum, minPrice: priceNum };
    } else {
      if (areaNum > 0) {
        if (listGroups[roomType].minArea === 0 || areaNum < listGroups[roomType].minArea) listGroups[roomType].minArea = areaNum;
        if (areaNum > listGroups[roomType].maxArea) listGroups[roomType].maxArea = areaNum;
      }
      if (priceNum > 0) {
        if (listGroups[roomType].minPrice === 0 || priceNum < listGroups[roomType].minPrice) listGroups[roomType].minPrice = priceNum;
      }
    }
  });
  const listGroupArray = Object.values(listGroups);

  // === 1. РЕЖИМ СПИСКА (LISTE) ТОЧЬ-В-ТОЧЬ ИЗ ПРОТОТИПА ===
  if (layout === 'list') {
    return (
      <article className="lc" data-id={property?.id} style={isReference ? undefined : { outline: '2px solid #0F6E56', outlineOffset: -2 }}>
        {/* Колонка 1: Фотография (320px) */}
        <div 
          className="ph" 
          onClick={() => !isReference && onImageClick && onImageClick(photos, currentSlide)}
          title={isReference ? undefined : 'Büyük görseli incele'}
          style={isReference ? { cursor: 'default' } : undefined}
        >
          {isReference ? (
            <ReferenceCover area={locationText} compact />
          ) : photos.length > 0 ? (
            <div className="slider-track" style={{ transform: 'translateX(-' + (currentSlide * 100) + '%)' }}>
              {photos.map((url, idx) => (
                <div key={idx} className="slider-item" style={{ backgroundImage: "url('" + url + "')" }}></div>
              ))}
            </div>
          ) : (
            <div className="slider-track">
              <div className="slider-item" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=600&q=80')" }}></div>
            </div>
          )}

          <span className={`bdg ${isCompleted ? 'ok' : 'go'}`}>{isReference ? 'Bilgi kartı' : '✓ Onaylı proje'}</span>

          <button type="button" className="hrt" onClick={toggleFavorite} title={isFavorite ? "Favorilerden Çıkar" : "Favorilere Ekle"}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorite ? "#EF4444" : "none"} stroke={isFavorite ? "#EF4444" : "#5B6B68"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19.5 12.6 12 20l-7.5-7.4a5 5 0 0 1 7.5-6.6 5 5 0 0 1 7.5 6.6z"/>
            </svg>
          </button>

          {photos.length > 1 && (
            <>
              <button type="button" className="slider-arrow arrow-left" onClick={prevSlide}>❮</button>
              <button type="button" className="slider-arrow arrow-right" onClick={nextSlide}>❯</button>
            </>
          )}
        </div>

        {/* Колонка 2: Заголовок, район и таблица планировок */}
        <div className="lm" onClick={() => { window.location.href = detailLink; }}>
          <h3>
            <Link href={detailLink} onClick={(e) => e.stopPropagation()}>
              {projectName}
            </Link>
          </h3>
          <p className="ln">
            {[locationText, badgeLabel, deliveryText].filter(Boolean).join(' · ')}
          </p>
          <StageBar stage={property?.construction_stage} updatedAt={property?.stage_updated_at} projectStatus={property?.konutcesit} />

          {listGroupArray.length > 0 && (
            <div className="tbl">
              {listGroupArray.slice(0, 4).map((g, idx) => {
                const areaStr = g.minArea > 0 ? (g.minArea === g.maxArea ? `${g.minArea} m²` : `${g.minArea}–${g.maxArea} m²`) : '';
                const prcStr = isReference ? 'Onay bekliyor' : (g.minPrice > 0 ? `${g.minPrice.toLocaleString('tr-TR')} TL'den` : 'Fiyat sorunuz');
                const isMatched = selectedRooms.some(r => g.room.includes(r.replace(' ve üzeri', '').trim()));

                return (
                  <div key={idx} className={`tr ${isMatched ? 'on' : ''}`}>
                    <b>{g.room}</b>
                    <span>{areaStr}</span>
                    <span>{prcStr}</span>
                  </div>
                );
              })}
            </div>
          )}

          {listGroupArray.length > 4 && (
            <p className="more">+{listGroupArray.length - 4} plan daha</p>
          )}
        </div>

        {/* Колонка 3: Цена и кнопка WhatsApp (220px) */}
        <div className="lr">
          {isReference ? (
            <>
              <p style={refNoteStyle}>Fiyat bilgisi geliştiriciden onay bekliyor</p>
              <Link href={detailLink} className="wa" style={{ background: '#fff', color: '#0F6E56', border: '1.5px solid #0F6E56' }}>
                <span>Detaylar</span>
              </Link>
              <a href={claimLink(projectName)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#0F6E56', textAlign: 'center', marginTop: 6 }}>
                Projenin sahibi misiniz?
              </a>
            </>
          ) : (
            <>
              <div>
                <p className="ln" style={{ fontSize: 13, fontWeight: 600, margin: '0 0 2px 0' }}>
                  {selectedRooms.length === 1 ? `${selectedRooms[0]} için` : 'başlangıç'}
                </p>
                <p className="pc">{cardPrice || 'Fiyat sorunuz'}</p>
              </div>
              <a href={finalWaLink} target="_blank" rel="noopener noreferrer" className="wa" onClick={(e) => e.stopPropagation()}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.7-5.2A8.5 8.5 0 1 1 21 12z"/>
                </svg>
                <span>WhatsApp</span>
              </a>
            </>
          )}
        </div>
      </article>
    );
  }

  // === 2. РЕЖИМ ПЛИТКИ (GRID) ===
  return (
    <article className="custom-card" data-id={property?.id} style={isReference ? undefined : { outline: '2px solid #0F6E56', outlineOffset: -2 }}>
      {/* 1. БЛОК ФОТОГРАФИИ (клик открывает полноэкранный просмотр фото) */}
      <div 
        className="img-container" 
        onClick={() => !isReference && onImageClick && onImageClick(photos, currentSlide)}
        title={isReference ? undefined : 'Büyük görseli incele'}
        style={isReference ? { cursor: 'default' } : undefined}
      >
        {/* Кнопка Избранного (сердечко в белом кругляшке как в прототипе) */}
        <button 
          type="button"
          className="hrt-btn"
          onClick={toggleFavorite}
          title={isFavorite ? "Favorilerden Çıkar" : "Favorilere Ekle"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorite ? "#EF4444" : "none"} stroke={isFavorite ? "#EF4444" : "#5B6B68"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19.5 12.6 12 20l-7.5-7.4a5 5 0 0 1 7.5-6.6 5 5 0 0 1 7.5 6.6z"/>
          </svg>
        </button>

        {/* Слайдер фотографий прямо в карточке */}
        {isReference ? (
          <ReferenceCover area={locationText} />
        ) : photos.length > 0 ? (
          <div className="slider-track" style={{ transform: 'translateX(-' + (currentSlide * 100) + '%)' }}>
            {photos.map((url, idx) => (
              <div 
                key={idx} 
                className="slider-item" 
                style={{ backgroundImage: "url('" + url + "')" }}
              ></div>
            ))}
          </div>
        ) : (
          <div className="slider-track">
            <div 
              className="slider-item" 
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=600&q=80')" }}
            ></div>
          </div>
        )}

       {/* Бейдж статуса (Золотой для Devam ediyor / Изумрудный для Tamamlandı) */}
        <span className={`bdg-pill ${isCompleted ? 'bdg-completed' : 'bdg-active'}`}>
          {badgeLabel}
        </span>
        {!isReference && (
          <span style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 3, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: '#04342C', color: '#E1F5EE' }}>
            ✓ Onaylı proje
          </span>
        )}

        {/* Стрелочки переключения фото в изумрудных цветах сайта */}
        {photos.length > 1 && (
          <>
            <button 
              type="button" 
              className="slider-arrow arrow-left" 
              onClick={prevSlide}
              title="Önceki fotoğraf"
            >
              ❮
            </button>
            <button 
              type="button" 
              className="slider-arrow arrow-right" 
              onClick={nextSlide}
              title="Sonraki fotoğraf"
            >
              ❯
            </button>
          </>
        )}
      </div>

      {/* 2. ТЕЛО КАРТОЧКИ (по утверждённому макету; клик по карточке открывает проект) */}
      <div 
        className="card-content-modern"
        onClick={() => {
          window.location.href = detailLink;
        }}
      >
        {/* Название */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <h3 className="card-title-modern" style={{ margin: 0 }}>
            {projectName}
          </h3>
          {isReference && (
            <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 999, background: '#f1f5f4', color: '#5B6B68', marginTop: 2 }}>Bilgi kartı</span>
          )}
        </div>

        {/* Застройщик */}
        <p style={{ fontSize: 13, color: '#5B6B68', margin: '2px 0 0' }}>
          {property?.developer?.name ? (
            <>
              {property.developer.name}
              {property.developer.is_verified && (
                <span style={{ color: '#0F6E56', fontWeight: 700, marginLeft: 6, whiteSpace: 'nowrap' }}>✓ Doğrulanmış firma</span>
              )}
            </>
          ) : (
            'Geliştirici: belirtilmemiş'
          )}
        </p>

        {/* Шкала стройки + срок сдачи */}
        <StageBar stage={property?.construction_stage} updatedAt={property?.stage_updated_at} deliveryText={deliveryText} projectStatus={property?.konutcesit} />

        {/* Планировки и площадь — плашками; стрелка раскрывает все планы */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', margin: '4px 0 8px' }}>
          {(selectedRooms.length === 1 ? [cardRooms] : String(cardRooms || '').split(/\s*[·,]\s*/)).filter(Boolean).map((r) => (
            <span key={r} style={{ fontSize: 12, padding: '3px 8px', border: '1px solid #d6dedc', borderRadius: 6, color: '#1f2d2a' }}>{r}</span>
          ))}
          {cardArea && (
            <span style={{ fontSize: 12, padding: '3px 8px', border: '1px solid #d6dedc', borderRadius: 6, color: '#1f2d2a' }}>
              {String(cardArea).replace(" m²'den", '')}{!String(cardArea).includes('m²') ? ' m²' : ''}
            </span>
          )}
          {!isReference && (property?.Ilk_Pesinat || property?.Vade_Secenegi || property?.Kredi_Durumu) && (
            <span style={{ fontSize: 12, padding: '3px 8px', borderRadius: 6, background: '#FAEEDA', color: '#633806' }}>
              {[property.Ilk_Pesinat && `${property.Ilk_Pesinat} peşin`, property.Vade_Secenegi && property.Vade_Secenegi.replace(' Vade', ''), property.Kredi_Durumu].filter(Boolean).join(' · ').replace(/Ay/g, 'ay').replace(/Faiz/g, 'faiz')}
            </span>
          )}
          {layouts && layouts.length >= 2 && (
            <button 
              type="button" 
              className="lay-btn" 
              aria-expanded={isExpanded}
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              title={isReference ? 'Planları göster' : 'Planları ve fiyatları göster'}
              style={{ marginLeft: 'auto' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
          )}
        </div>

        {/* Раскрывающаяся таблица планировок */}
        {isExpanded && layouts && layouts.length >= 2 && (
          <div className="lay-panel" onClick={(e) => e.stopPropagation()}>
            <div className="lay-h">{isReference ? 'Planlar' : 'Planlar ve fiyatlar (başlangıç)'}</div>
            {listGroupArray.map((g, idx) => {
              const areaString = g.minArea > 0 ? (g.minArea === g.maxArea ? `${g.minArea} m²` : `${g.minArea}–${g.maxArea} m²`) : '';
              const priceString = isReference ? 'Onay bekliyor' : (g.minPrice > 0 ? `${g.minPrice.toLocaleString('tr-TR')} TL` : 'Fiyat sorunuz');
              const isMatched = selectedRooms.some(r => g.room.includes(r.replace(' ve üzeri', '').trim()));
              return (
                <div key={idx} className={`tr ${isMatched ? 'on' : ''}`}>
                  <b>{g.room}</b>
                  <span>{areaString}</span>
                  <span>{priceString}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Цена или честная плашка */}
        {isReference ? (
          <p style={refNoteStyle}>Fiyat bilgisi geliştiriciden onay bekliyor</p>
        ) : (
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, margin: '6px 0 8px' }}>
            <span className="card-price-modern" style={{ margin: 0 }}>{cardPrice || 'Fiyat sorunuz'}</span>
            {selectedRooms.length === 1 && <span style={{ fontSize: 12, color: '#0F6E56' }}>{selectedRooms[0]} için</span>}
          </div>
        )}

        {/* Кнопки */}
        {isReference ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 'auto' }}>
            <Link href={detailLink} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '10px 12px', borderRadius: 10, background: '#fff', color: '#0F6E56', border: '1.5px solid #0F6E56', fontWeight: 700, fontSize: 14, textDecoration: 'none' }} onClick={(e) => e.stopPropagation()}>
              Detaylar
            </Link>
            <a href={claimLink(projectName)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ fontSize: 12, color: '#0F6E56', whiteSpace: 'nowrap' }}>
              Projenin sahibi misiniz?
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
            <a 
              href={finalWaLink} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="card-wa-full-btn"
              style={{ flex: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.7-5.2A8.5 8.5 0 1 1 21 12z"/>
              </svg>
              <span>WhatsApp</span>
            </a>
            <Link href={detailLink} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '10px 12px', borderRadius: 10, background: '#fff', color: '#1f2d2a', border: '1px solid #d6dedc', fontWeight: 700, fontSize: 14, textDecoration: 'none' }} onClick={(e) => e.stopPropagation()}>
              Detaylar
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
