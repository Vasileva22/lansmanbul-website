import { useState, useEffect } from 'react';
import Link from 'next/link';

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
  const yrMatch = rawYr.match(/\b(20\d\d)\b/) || String(property?.Açıklama || '').match(/\b(202\d)\b/);
  const deliveryText = yrMatch ? `Teslim ${yrMatch[1]}` : (isCompleted ? 'Teslim hazır' : 'Ankara');

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
      <article className="lc" data-id={property?.id}>
        {/* Колонка 1: Фотография (320px) */}
        <div 
          className="ph" 
          onClick={() => onImageClick && onImageClick(photos, currentSlide)}
          title="Büyük görseli incele"
        >
          {photos.length > 0 ? (
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

          <span className={`bdg ${isCompleted ? 'ok' : 'go'}`}>{badgeLabel}</span>

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
              {property?.testproje?.trim() ? property.testproje : 'Yeni Konut Projesi'}
            </Link>
          </h3>
          <p className="ln">
            {property?.district || property?.['İlçe/Semt'] || property?.city || 'Ankara'} · {deliveryText}
          </p>

          {listGroupArray.length > 0 && (
            <div className="tbl">
              {listGroupArray.slice(0, 4).map((g, idx) => {
                const areaStr = g.minArea > 0 ? (g.minArea === g.maxArea ? `${g.minArea} m²` : `${g.minArea}–${g.maxArea} m²`) : '';
                const prcStr = g.minPrice > 0 ? `${g.minPrice.toLocaleString('tr-TR')} TL'den` : 'Fiyat sorunuz';
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
          <div>
            <p className="ln" style={{ fontSize: 13, fontWeight: 600, margin: '0 0 2px 0' }}>
              {selectedRooms.length === 1 ? `${selectedRooms[0]} için` : 'başlangıç'}
            </p>
            <p className="pc">{cardPrice || 'Fiyat Belirtilmemiş'}</p>
          </div>
          <a href={finalWaLink} target="_blank" rel="noopener noreferrer" className="wa" onClick={(e) => e.stopPropagation()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.7-5.2A8.5 8.5 0 1 1 21 12z"/>
            </svg>
            <span>WhatsApp</span>
          </a>
        </div>
      </article>
    );
  }

  // === 2. РЕЖИМ ПЛИТКИ (GRID) ===
  return (
    <article className="custom-card" data-id={property?.id}>
      {/* 1. БЛОК ФОТОГРАФИИ (клик открывает полноэкранный просмотр фото) */}
      <div 
        className="img-container" 
        onClick={() => onImageClick && onImageClick(photos, currentSlide)}
        title="Büyük görseli incele"
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
        {photos.length > 0 ? (
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

      {/* 2. ТЕЛО КАРТОЧКИ (КЛИКАБЕЛЬНО ПОЛНОСТЬЮ: КЛИК ПО ЛЮБОМУ МЕСТУ ОТКРЫВАЕТ ПРОЕКТ) */}
      <div 
        className="card-content-modern"
        onClick={() => {
          window.location.href = detailLink;
        }}
      >
        {/* Название проекта (ровно 2 строки, не пляшет по высоте) */}
       <h3 className="card-title-modern">
          {property?.testproje?.trim() ? property.testproje : 'Yeni Konut Projesi'}
        </h3>

        {/* Цена (крупная изумрудная 22px) */}
        <p className="card-price-modern">
          {cardPrice || 'Fiyat Belirtilmemiş'}
        </p>

        {/* Подстрочник для комнат (зеленый 13px как в прототипе) */}
        <p className="card-price-note">
          {selectedRooms.length === 1 ? `${selectedRooms[0]} için başlangıç fiyatı` : ''}
        </p>

        {/* Строка планировок и квадратуры */}
        {/* Строка планировок + кнопка со стрелочкой (если 2 и более планировки) */}
        <div className="lay-row">
          <p className="card-line-meta">
            {cardRooms ? `${cardRooms}` : ''}
            {cardArea ? ` · ${cardArea}${!String(cardArea).includes('m²') ? ' m²' : ''}` : ''}
          </p>

          {layouts && layouts.length >= 2 && (
            <button 
              type="button" 
              className="lay-btn" 
              aria-expanded={isExpanded}
              onClick={(e) => {
                e.stopPropagation(); // Не переходить на страницу проекта
                setIsExpanded(!isExpanded);
              }}
              title="Planları ve fiyatları göster"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
          )}
        </div>

       {/* Раскрывающаяся таблица планировок строго по прототипу */}
        {isExpanded && layouts && layouts.length >= 2 && (() => {
          // 1. Группируем планировки по типу комнат (1+1, 2+1, 3+1...), собирая min/max площадь и min цену
          const groups = {};
          layouts.forEach((u) => {
            const rawRoom = String(u.rooms || '').replace(/[\r\n]+/g, ' ').trim();
            const roomType = rawRoom.split(/[-–\s]/)[0].trim() || rawRoom; // Извлекаем "2+1"
            const areaNum = parseInt(String(u.area || '').replace(/\D/g, '')) || 0;
            const priceNum = parseInt(String(u.price || '').replace(/\D/g, '')) || 0;

            if (!groups[roomType]) {
              groups[roomType] = {
                room: roomType,
                minArea: areaNum,
                maxArea: areaNum,
                minPrice: priceNum
              };
            } else {
              if (areaNum > 0) {
                if (groups[roomType].minArea === 0 || areaNum < groups[roomType].minArea) groups[roomType].minArea = areaNum;
                if (areaNum > groups[roomType].maxArea) groups[roomType].maxArea = areaNum;
              }
              if (priceNum > 0) {
                if (groups[roomType].minPrice === 0 || priceNum < groups[roomType].minPrice) groups[roomType].minPrice = priceNum;
              }
            }
          });

          const groupList = Object.values(groups);

          return (
            <div className="lay-panel" onClick={(e) => e.stopPropagation()}>
              <div className="lay-h">Planlar ve fiyatlar (başlangıç)</div>
              {groupList.map((g, idx) => {
                // Метраж в формате "52–94 m²" или "85 m²"
                let areaString = '';
                if (g.minArea > 0 && g.maxArea > 0) {
                  areaString = g.minArea === g.maxArea ? `${g.minArea} m²` : `${g.minArea}–${g.maxArea} m²`;
                }

                // Цена без 'den строго в TL (как в прототипе)
                const priceString = g.minPrice > 0 ? `${g.minPrice.toLocaleString('tr-TR')} TL` : 'Fiyat sorunuz';

                // Подсветка строки, если комната выбрана в фильтре
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
          );
        })()}

       {/* Строка района и срока сдачи */}
        <p className="card-line-sub">
          <span>{property?.district || property?.['İlçe/Semt'] || property?.city || 'Ankara'}</span>
          <span> · </span>
          <span>
            {(() => {
              const rawYr = String(property?.Teslim_Yili || property?.teslim_yili || '').trim();
              const yrMatch = rawYr.match(/\b(20\d\d)\b/) || String(property?.Açıklama || '').match(/\b(202\d)\b/);
              if (yrMatch) return `Teslim ${yrMatch[1]}`;
              if (cleanStatus === 'tamamlandı') return 'Teslim hazır';
              return 'Ankara';
            })()}
          </span>
        </p>
        {/* Кнопка WhatsApp на всю ширину (клик по ней открывает чат, а не страницу проекта) */}
        <a 
          href={finalWaLink} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="card-wa-full-btn"
          onClick={(e) => e.stopPropagation()}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.7-5.2A8.5 8.5 0 1 1 21 12z"/>
          </svg>
          <span>WhatsApp</span>
        </a>
      </div>
    </article>
  );
}
