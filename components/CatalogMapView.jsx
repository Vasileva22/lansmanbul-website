import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export default function CatalogMapView({ properties = [] }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Выбранный объект и флаг фиксации по клику
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isLocked, setIsLocked] = useState(false); // Зафиксирована ли карточка кликом
  const [isExpanded, setIsExpanded] = useState(false); // Раскрыта ли таблица планировок

  // Ref для доступа к актуальному состоянию isLocked внутри событий Яндекс.Карт
  const isLockedRef = useRef(false);
  isLockedRef.current = isLocked;

  // Форматирование короткой цены для кругляшка метки на карте (например, "1.4 mn", "22 mn")
  const formatShortPrice = (val) => {
    if (!val) return 'Fiyat sor';
    const num = parseInt(String(val).replace(/\D/g, ''));
    if (!num) return 'Fiyat sor';
    const mn = num / 1000000;
    return (mn % 1 === 0 ? mn : mn.toFixed(1).replace('.', ',')) + ' mn';
  };

  const formatPriceFull = (val) => {
    if (!val) return 'Fiyat Belirtilmemiş';
    const num = parseInt(String(val).replace(/\D/g, ''));
    if (!num) return String(val);
    return num.toLocaleString('tr-TR') + " TL'den";
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    function initMap() {
      if (!window.ymaps || !mapContainerRef.current) return;

      window.ymaps.ready(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.destroy();
          mapInstanceRef.current = null;
        }

        const map = new window.ymaps.Map(mapContainerRef.current, {
          center: [39.9334, 32.8597],
          zoom: 11,
          controls: ['zoomControl', 'fullscreenControl'],
        });

        mapInstanceRef.current = map;

        const PriceLayout = window.ymaps.templateLayoutFactory.createClass(
          '<div class="ymap-price-pin">$[properties.iconContent]</div>'
        );

        const geoObjects = [];

        properties.forEach((property) => {
          let lat = parseFloat(property.latitude);
          let lon = parseFloat(property.longitude);

          if (isNaN(lat) || isNaN(lon)) {
            const coordRaw = property.Koordinat || property['`Koordinat`'];
            if (coordRaw) {
              const parts = String(coordRaw).split(',');
              if (parts.length === 2) {
                lat = parseFloat(parts[0].trim());
                lon = parseFloat(parts[1].trim());
              }
            }
          }

          if (!isNaN(lat) && !isNaN(lon)) {
            const shortPrice = formatShortPrice(property.Fiyat);

            const placemark = new window.ymaps.Placemark(
              [lat, lon],
              {
                iconContent: shortPrice,
                hintContent: property.testproje || 'Konut Projesi',
              },
              {
                iconLayout: PriceLayout,
                iconPane: 'overlaps',
              }
            );

            // 1. При НАВЕДЕНИИ (Hover) — быстро показываем карточку, если она не зафиксирована кликом
            placemark.events.add('mouseenter', () => {
              if (!isLockedRef.current) {
                setSelectedProperty(property);
                setIsExpanded(false);
              }
            });

            // 2. При КЛИКЕ — жестко фиксируем карточку
            placemark.events.add('click', () => {
              setSelectedProperty(property);
              setIsLocked(true);
              isLockedRef.current = true;
              setIsExpanded(false);
            });

            map.geoObjects.add(placemark);
            geoObjects.push(placemark);
          }
        });

        if (geoObjects.length > 0) {
          map.setBounds(map.geoObjects.getBounds(), {
            checkZoomRange: true,
            zoomMargin: 40,
          });
        }
      });
    }

    if (!window.ymaps && !document.getElementById('yandex-maps-script')) {
      const script = document.createElement('script');
      script.id = 'yandex-maps-script';
      script.src = 'https://api-maps.yandex.ru/2.1/?apikey=72709de3-d8bc-49c9-88c6-339937b3fa51&lang=tr_TR';
      script.type = 'text/javascript';
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, [properties]);

  // Закрытие карточки по крестику
  const handleCloseCard = () => {
    setSelectedProperty(null);
    setIsLocked(false);
    isLockedRef.current = false;
    setIsExpanded(false);
  };

  // Парсинг фото
  let photoUrl = 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=600&q=80';
  if (selectedProperty?.property_images && selectedProperty.property_images.length > 0) {
    const raw = selectedProperty.property_images[0]?.image_url;
    if (Array.isArray(raw) && raw.length > 0) photoUrl = raw[0];
    else if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const arr = JSON.parse(trimmed);
          if (Array.isArray(arr) && arr.length > 0) photoUrl = arr[0];
        } catch (e) {}
      } else {
        const spl = trimmed.split(/[\s,]+/);
        if (spl.length > 0 && spl[0]) photoUrl = spl[0];
      }
    }
  }

  // Парсинг планировок для карточки на карте
  const layouts = (() => {
    if (!selectedProperty?.layouts) return [];
    if (Array.isArray(selectedProperty.layouts)) return selectedProperty.layouts;
    if (typeof selectedProperty.layouts === 'string') {
      try { return JSON.parse(selectedProperty.layouts); } catch (e) {}
    }
    return [];
  })();

  // Статус и срок сдачи
  const rawStatus = String(selectedProperty?.konutcesit || '').toLowerCase().trim();
  const isCompleted = rawStatus.includes('tamam');
  const badgeLabel = isCompleted ? 'Tamamlandı' : (rawStatus.includes('lansman') ? 'Lansman' : 'Devam ediyor');

  const rawYr = String(selectedProperty?.Teslim_Yili || selectedProperty?.teslim_yili || '').trim();
  const yrMatch = rawYr.match(/\b(20\d\d)\b/) || String(selectedProperty?.Açıklama || '').match(/\b(202\d)\b/);
  const deliveryText = yrMatch ? `Teslim ${yrMatch[1]}` : (isCompleted ? 'Teslim hazır' : 'Ankara');

  // Комнаты и метраж
  const cleanRoomSet = new Set();
  layouts.forEach(l => {
    const raw = String(l.rooms || '').replace(/[\r\n]+/g, ' ').trim();
    const clean = raw.split(/[-–\s]/)[0].trim();
    if (clean) cleanRoomSet.add(clean);
  });
  const roomLine = cleanRoomSet.size > 0 ? Array.from(cleanRoomSet).join(' · ') : (selectedProperty?.['card odalar'] || '');

  const areas = layouts.map(l => parseInt(String(l.area || '').replace(/\D/g, ''))).filter(Boolean);
  let areaLine = '';
  if (areas.length > 0) {
    const minA = Math.min(...areas);
    const maxA = Math.max(...areas);
    areaLine = minA === maxA ? `${minA} m²` : `${minA}–${maxA} m²`;
  } else if (selectedProperty?.['card-area']) {
    areaLine = `${selectedProperty['card-area']} m²`;
  }

  // Группировка для выпадающей таблицы планировок
  const groups = {};
  layouts.forEach((u) => {
    const rawRoom = String(u.rooms || '').replace(/[\r\n]+/g, ' ').trim();
    const roomType = rawRoom.split(/[-–\s]/)[0].trim() || rawRoom;
    const areaNum = parseInt(String(u.area || '').replace(/\D/g, '')) || 0;
    const priceNum = parseInt(String(u.price || '').replace(/\D/g, '')) || 0;

    if (!groups[roomType]) {
      groups[roomType] = { room: roomType, minArea: areaNum, maxArea: areaNum, minPrice: priceNum };
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

  const waRaw = selectedProperty?.WhatsApp;
  const finalWaLink = (waRaw && String(waRaw).startsWith('http'))
    ? waRaw
    : 'https://wa.me/' + (waRaw ? String(waRaw).replace(/\D/g, '') : "905459418536");

  const projectLink = selectedProperty ? `/properties/${selectedProperty.id}` : '#';

  return (
    <div className="mapw">
      {/* Контейнер карты */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }}></div>

      {/* Всплывающая карточка (.mini) */}
      {selectedProperty && (
        <div className="mini" style={{ maxHeight: '90%', overflowY: 'auto' }}>
          {/* Крестик закрытия */}
          <button 
            type="button" 
            className="x" 
            onClick={handleCloseCard}
            aria-label="Kapat"
            title="Kapat"
          >
            ✕
          </button>

          {/* Фото с бейджем статуса */}
          <div style={{ position: 'relative' }}>
            <a 
              href={projectLink} 
              className="mini-photo" 
              style={{ backgroundImage: `url('${photoUrl}')` }}
              title="Projeyi İncele"
            ></a>
            <span 
              className={`bdg-pill ${isCompleted ? 'bdg-completed' : 'bdg-active'}`} 
              style={{ top: 8, left: 8, fontSize: 11, padding: '3px 9px' }}
            >
              {badgeLabel}
            </span>
          </div>

          {/* Название ЖК */}
          <h3>
            <a href={projectLink} style={{ color: 'inherit', textDecoration: 'none' }}>
              {selectedProperty.testproje?.trim() ? selectedProperty.testproje : 'Yeni Konut Projesi'}
            </a>
          </h3>

          {/* Цена */}
          <p className="pc" style={{ margin: '4px 0 6px 0', fontSize: 19 }}>
            {formatPriceFull(selectedProperty.Fiyat)}
          </p>

          {/* Строка комнат + стрелочка планировок */}
          <div className="lay-row" style={{ minHeight: 26, marginBottom: 4 }}>
            <p className="card-line-meta" style={{ fontSize: 13.5 }}>
              {roomLine ? `${roomLine}` : ''}
              {areaLine ? ` · ${areaLine}` : ''}
            </p>

            {layouts.length >= 2 && (
              <button 
                type="button" 
                className="lay-btn" 
                aria-expanded={isExpanded}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                style={{ width: 24, height: 24 }}
                title="Planları göster"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>
            )}
          </div>

          {/* Раскрывающаяся таблица планировок прямо внутри карточки на карте! */}
          {isExpanded && groupList.length > 0 && (
            <div className="lay-panel" style={{ marginTop: 6, marginBottom: 6, paddingTop: 8 }}>
              <div className="lay-h">Planlar ve fiyatlar</div>
              {groupList.map((g, idx) => {
                let aStr = '';
                if (g.minArea > 0 && g.maxArea > 0) {
                  aStr = g.minArea === g.maxArea ? `${g.minArea} m²` : `${g.minArea}–${g.maxArea} m²`;
                }
                const pStr = g.minPrice > 0 ? `${g.minPrice.toLocaleString('tr-TR')} TL` : 'Fiyat sorunuz';

                return (
                  <div key={idx} className="tr" style={{ padding: '4px 8px', fontSize: 12 }}>
                    <b>{g.room}</b>
                    <span>{aStr}</span>
                    <span>{pStr}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Локация и срок сдачи */}
          <p className="ln" style={{ fontSize: 13, margin: '4px 0 0 0' }}>
            {selectedProperty.district || selectedProperty['İlçe/Semt'] || selectedProperty.city || 'Ankara'} · {deliveryText}
          </p>

          {/* Кнопка WhatsApp */}
          <a 
            href={finalWaLink} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="wa"
            style={{ marginTop: 10, padding: 9, fontSize: 13.5 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.7-5.2A8.5 8.5 0 1 1 21 12z"/>
            </svg>
            <span>WhatsApp</span>
          </a>
        </div>
      )}
    </div>
  );
}
