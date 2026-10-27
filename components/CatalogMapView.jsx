import { useEffect, useRef, useState } from 'react';

export default function CatalogMapView({ properties = [] }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [selectedProperty, setSelectedProperty] = useState(null);

  // Форматирование цены для метки на карте (например, "1.4 mn", "22 mn")
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
        // Если карта уже создана — уничтожаем перед перерисовкой
        if (mapInstanceRef.current) {
          mapInstanceRef.current.destroy();
          mapInstanceRef.current = null;
        }

        const map = new window.ymaps.Map(mapContainerRef.current, {
          center: [39.9334, 32.8597], // Центр Анкары
          zoom: 11,
          controls: ['zoomControl', 'fullscreenControl'],
        });

        mapInstanceRef.current = map;

        // Создаем собственный шаблон изумрудной метки с ценой
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

            placemark.events.add('click', () => {
              setSelectedProperty(property);
            });

            map.geoObjects.add(placemark);
            geoObjects.push(placemark);
          }
        });

        // Автоматически центрируем карту, чтобы были видны все объекты
        if (geoObjects.length > 0) {
          map.setBounds(map.geoObjects.getBounds(), {
            checkZoomRange: true,
            zoomMargin: 40,
          });
        }
      });
    }

    // Загрузка скрипта Яндекс.Карт с параметром tr_TR
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

  const waRaw = selectedProperty?.WhatsApp;
  const finalWaLink = (waRaw && String(waRaw).startsWith('http'))
    ? waRaw
    : 'https://wa.me/' + (waRaw ? String(waRaw).replace(/\D/g, '') : "905459418536");

  return (
    <div className="mapw">
      {/* Контейнер самой Яндекс.Карты */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }}></div>

      {/* Всплывающая мини-карточка (.mini) в правом верхнем углу карты */}
      {selectedProperty && (
        <div className="mini">
          <button 
            type="button" 
            className="x" 
            onClick={() => setSelectedProperty(null)}
            aria-label="Kapat"
          >
            ✕
          </button>
          <h3>{selectedProperty.testproje?.trim() ? selectedProperty.testproje : 'Yeni Konut Projesi'}</h3>
          <p className="ln">
            {selectedProperty.district || selectedProperty['İlçe/Semt'] || selectedProperty.city || 'Ankara'}
            {selectedProperty['card odalar'] ? ` · ${selectedProperty['card odalar']}` : ''}
          </p>
          <p className="pc">{formatPriceFull(selectedProperty.Fiyat)}</p>
          <a 
            href={finalWaLink} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="wa"
          >
            WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}
