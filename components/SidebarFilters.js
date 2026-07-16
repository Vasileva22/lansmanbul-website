import { useEffect, useRef, useState } from 'react';
import noUiSlider from 'nouislider';
import 'nouislider/dist/nouislider.css';

export default function SidebarFilters({
  filteredProperties,
  totalCount,
  filters,
  setFilters,
  onClearFilters,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
}) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const mapLoaded = useRef(false);

  // Ссылки на DOM-элементы для инициализации noUiSlider
  const areaSliderRef = useRef(null);
  const katSliderRef = useRef(null);
  const priceSliderRef = useRef(null);

  // Локальные переменные для хранения инстансов слайдеров (чтобы вовремя уничтожать их)
  const areaSliderInst = useRef(null);
  const katSliderInst = useRef(null);
  const priceSliderInst = useRef(null);

  // Состояние для сворачивания/разворачивания удобств
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);

  // ==========================================================================
  // 1. ИНИЦИАЛИЗАЦИЯ И ОБНОВЛЕНИЕ ЯНДЕКС.КАРТ
  // ==========================================================================
  
  // Ленивая загрузка API Яндекс.Карт на клиенте
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initMapInstance = () => {
      if (window.ymaps && !mapInstance.current && mapRef.current) {
        window.ymaps.ready(() => {
          mapInstance.current = new window.ymaps.Map(mapRef.current, {
            center: [39.9334, 32.8597], // Центр по умолчанию (Анкара)
            zoom: 10,
            controls: [],
          });
          mapLoaded.current = true;
          drawMapPlacemarks();
        });
      }
    };

    if (!window.ymaps && !document.getElementById('yandex-maps-script')) {
      const script = document.createElement('script');
      script.id = 'yandex-maps-script';
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || '72709de3-d8bc-49c9-88c6-339937b3fa51'}&lang=tr_TR`;
      script.type = 'text/javascript';
      script.onload = initMapInstance;
      document.head.appendChild(script);
    } else {
      initMapInstance();
    }

    return () => {
      // При уничтожении компонента очищаем карту
      if (mapInstance.current) {
        mapInstance.current.destroy();
        mapInstance.current = null;
        mapLoaded.current = false;
      }
    };
  }, []);

  // Отрисовка гео-меток на карте на основе отфильтрованных свойств
  const drawMapPlacemarks = () => {
    if (!mapInstance.current || !mapLoaded.current) return;

    mapInstance.current.geoObjects.removeAll();

    filteredProperties.forEach((property) => {
      // Безопасно определяем координаты (из полей lat/lon или из строки Koordinat)
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
        const title = property.testproje || "Konut Projesi";
        const priceFormatted = property.Fiyat 
          ? String(property.Fiyat).replace(/[^0-9]/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " TL'den"
          : "Fiyat Belirtilmemiş";

        const placemark = new window.ymaps.Placemark([lat, lon], {
          balloonContentHeader: `<strong>${title}</strong>`,
          balloonContentBody: `${priceFormatted}`,
          hintContent: title,
        }, {
          preset: 'islands#dotIcon',
          iconColor: '#00A4A6',
        });

        mapInstance.current.geoObjects.add(placemark);
      }
    });

    // Автоматическое масштабирование карты по границам всех маркеров
    if (mapInstance.current.geoObjects.getLength() > 0) {
      mapInstance.current.setBounds(mapInstance.current.geoObjects.getBounds(), {
        checkZoomRange: true,
        zoomMargin: 15,
      });
    }
  };

  // Перерисовываем метки при каждом изменении отфильтрованного списка свойств
  useEffect(() => {
    drawMapPlacemarks();
  }, [filteredProperties]);

  // ==========================================================================
  // 2. ИНИЦИАЛИЗАЦИЯ ПОЛЗУНКОВ (noUiSlider)
  // ==========================================================================

  useEffect(() => {
    // А. Слайдер площади (0 - 500 m²)
    if (areaSliderRef.current && !areaSliderInst.current) {
      areaSliderInst.current = noUiSlider.create(areaSliderRef.current, {
        start: [filters.areaRange[0], filters.areaRange[1]],
        connect: true,
        range: { min: 0, max: 500 },
        step: 1,
      });

      areaSliderInst.current.on('update', (values) => {
        const range = values.map(Math.round);
        setFilters((prev) => ({ ...prev, areaRange: range }));
      });
    }

    // Б. Слайдер этажей (0 - 40)
    if (katSliderRef.current && !katSliderInst.current) {
      katSliderInst.current = noUiSlider.create(katSliderRef.current, {
        start: [filters.katRange[0], filters.katRange[1]],
        connect: true,
        range: { min: 0, max: 40 },
        step: 1,
      });

      katSliderInst.current.on('update', (values) => {
        const range = values.map(Math.round);
        setFilters((prev) => ({ ...prev, katRange: range }));
      });
    }

    // В. Слайдер цен (0 - 50.000.000 TL)
    if (priceSliderRef.current && !priceSliderInst.current) {
      priceSliderInst.current = noUiSlider.create(priceSliderRef.current, {
        start: [filters.priceRange[0], filters.priceRange[1]],
        connect: true,
        range: { min: 0, max: 50000000 },
        step: 1000,
      });

      priceSliderInst.current.on('update', (values) => {
        const range = values.map(Math.round);
        setFilters((prev) => ({ ...prev, priceRange: range }));
      });
    }

    return () => {
      // Очищаем слайдеры при размонтировании компонента для предотвращения утечек памяти
      if (areaSliderInst.current) {
        areaSliderInst.current.destroy();
        areaSliderInst.current = null;
      }
      if (katSliderInst.current) {
        katSliderInst.current.destroy();
        katSliderInst.current = null;
      }
      if (priceSliderInst.current) {
        priceSliderInst.current.destroy();
        priceSliderInst.current = null;
      }
    };
  }, []);

  // Синхронизируем положение слайдеров, если фильтры были сброшены извне
  useEffect(() => {
    if (areaSliderInst.current) areaSliderInst.current.set(filters.areaRange);
    if (katSliderInst.current) katSliderInst.current.set(filters.katRange);
    if (priceSliderInst.current) priceSliderInst.current.set(filters.priceRange);
  }, [filters.areaRange, filters.katRange, filters.priceRange]);

  // ==========================================================================
  // 3. ОБРАБОТЧИКИ ОПЦИЙ ФИЛЬТРАЦИИ
  // ==========================================================================

  // Выбор/Сброс Удобств (Amenities Tags)
  const handleTagToggle = (tag) => {
    const isSelected = filters.activeFeatureFilters.includes(tag);
    const updated = isSelected
      ? filters.activeFeatureFilters.filter((t) => t !== tag)
      : [...filters.activeFeatureFilters, tag];
    
    setFilters((prev) => ({ ...prev, activeFeatureFilters: updated }));
  };

  // Выбор/Сброс способов оплаты
  const handlePaymentToggle = (payment) => {
    const isChecked = filters.activePaymentFilters.includes(payment);
    const updated = isChecked
      ? filters.activePaymentFilters.filter((p) => p !== payment)
      : [...filters.activePaymentFilters, payment];

    setFilters((prev) => ({ ...prev, activePaymentFilters: updated }));
  };

  return (
    <>
      {/* ФОН ДЛЯ МОБИЛЬНОГО ФИЛЬТРА */}
      <div 
        className={`sidebar-mobile-overlay ${isMobileSidebarOpen ? 'show' : ''}`}
        onClick={() => setIsMobileSidebarOpen(false)}
      ></div>

      <aside className={`luxe-sidebar ${isMobileSidebarOpen ? 'sidebar-mobile-show' : ''}`} id="custom-sidebar">
        {/* Кнопка закрытия на мобильных */}
        <span className="sidebar-mobile-close-btn" onClick={() => setIsMobileSidebarOpen(false)}>
          &times;
        </span>

        <div className="luxe-sidebar-scrollable-body">
          {/* Контейнер Яндекс.Карты */}
          <div ref={mapRef} id="yandex-map-container" className="luxe-sidebar-map"></div>

          {/* Шапка фильтра со счетчиком */}
          <div className="luxe-sidebar-header">
            <div className="luxe-sidebar-mobile-title-container" style={{ display: 'none' }}>
              <span className="luxe-sidebar-mobile-title c-filter__title fs-20">Filtreleme</span>
            </div>
            <span className="luxe-sidebar-mobile-subtitle c-filter__title fs-14" style={{ display: 'none', marginBottom: '12px', color: 'var(--text-muted)' }}>
              Sonuçları Filtreleyin
            </span>
            <div className="luxe-sidebar-sub-count">
              <span className="orange-count"><span>{totalCount}</span> Proje</span> Listeleniyor
            </div>
            <span className="clear-filters-btn clear-link" onClick={onClearFilters}>
              Filtreleri Temizle
            </span>
          </div>

          <div className="luxe-divider"></div>

          {/* ГРУППА 1: ПЛОЩАДЬ */}
          <div className="luxe-group">
            <span className="luxe-group-label c-filter__title fs-14 fw-600">Metrekare (m²)</span>
            <div className="luxe-range-inputs-row">
              <input 
                type="number" 
                className="luxe-oval-input" 
                value={filters.areaRange[0]}
                onChange={(e) => setFilters((p) => ({ ...p, areaRange: [parseInt(e.target.value) || 0, p.areaRange[1]] }))}
              />
              <span className="luxe-range-separator">—</span>
              <input 
                type="number" 
                className="luxe-oval-input" 
                value={filters.areaRange[1]}
                onChange={(e) => setFilters((p) => ({ ...p, areaRange: [p.areaRange[0], parseInt(e.target.value) || 500] }))}
              />
            </div>
            <div ref={areaSliderRef} className="luxe-slider-track"></div>
          </div>

          <div className="luxe-divider"></div>

          {/* ГРУППА 2: ЭТАЖНОСТЬ */}
          <div className="luxe-group">
            <span className="luxe-group-label c-filter__title fs-14 fw-600">Kat sayısı</span>
            <div className="luxe-range-inputs-row">
              <input 
                type="number" 
                className="luxe-oval-input" 
                value={filters.katRange[0]}
                onChange={(e) => setFilters((p) => ({ ...p, katRange: [parseInt(e.target.value) || 0, p.katRange[1]] }))}
              />
              <span className="luxe-range-separator">—</span>
              <input 
                type="number" 
                className="luxe-oval-input" 
                value={filters.katRange[1]}
                onChange={(e) => setFilters((p) => ({ ...p, katRange: [p.katRange[0], parseInt(e.target.value) || 40] }))}
              />
            </div>
            <div ref={katSliderRef} className="luxe-slider-track"></div>
          </div>

          <div className="luxe-divider"></div>

          {/* ГРУППА 3: ЦЕНА */}
          <div className="luxe-group">
            <span className="luxe-group-label c-filter__title fs-16 fw-600">Fiyat</span>
            <div className="price-live-display">
              <span>{filters.priceRange[0].toLocaleString('tr-TR')} TL</span> — <span>{filters.priceRange[1].toLocaleString('tr-TR')} TL</span>
            </div>
            <div ref={priceSliderRef} className="luxe-slider-track"></div>
          </div>

          <div className="luxe-divider"></div>

          {/* ГРУППА 4: УДОБСТВА (TAGS) */}
          <div className="luxe-group">
            <span className="luxe-group-label c-filter__title fs-14 fw-600">Olanaklar</span>
            <div className={`luxe-tags ${isTagsExpanded ? 'expanded' : ''}`}>
              {[
                { label: 'Havuz', value: 'Havuz', iconPath: 'M2 19a3 3 0 0 0 6 0a3 3 0 0 0 6 0a3 3 0 0 0 6 0a3 3 0 0 0 2 0v-2a3 3 0 0 1-2 0a3 3 0 0 1-6 0a3 3 0 0 1-6 0a3 3 0 0 1-6 0a3 3 0 0 1-2 0v2z' },
                { label: 'Fitness', value: 'Fitness', iconPath: 'M20.57 14.86L22 13.43l-1.43-1.43l-1.43 1.43l-3.57-3.57l1.43-1.43L15.57 7L14.14 8.43l-1.43-1.43l-2.14 2.14l1.43 1.43l-1.43 1.43l-3.57-3.57l1.43-1.43L5 5.57L3.57 7l1.43 1.43l-2.14 2.14L4.29 12l1.43-1.43l3.57 3.57l-1.43 1.43L9.29 17l1.43-1.43l1.43 1.43l2.14-2.14l-1.43-1.43l1.43-1.43l3.57 3.57l-1.43 1.43L18.29 20l1.43-1.43z' },
                { label: 'Güvenlik', value: 'Güvenlik', iconPath: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12c5.16-12 9-6.45 9-12V5l-9-4z' },
                { label: 'Otopark', value: 'Otopark', iconPath: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z' },
                { label: 'Çocuk Parkı', value: 'Çocuk parkı', iconPath: 'M12 2c1.1 0 2 .9 2 2s-.9 2-2 2s-2-.9-2-2s.9-2 2-2z' },
                { label: 'Site İçerisinde', value: 'Site İçerisinde', iconPath: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z' },
                { label: 'Spor Salonu', value: 'Spor Salonu', iconPath: 'M20.57 14.86L22 13.43l-1.43-1.43' },
                { label: 'Sauna', value: 'Sauna', iconPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z' },
                { label: 'Hamam', value: 'Hamam', iconPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z' },
                { label: 'Oyun Parkı', value: 'Oyun Parkı', iconPath: 'M12 2c1.1 0 2 .9 2 2s-.9 2-2 2' }
              ].map((tag) => (
                <div 
                  key={tag.value} 
                  className={`luxe-tag-item ${filters.activeFeatureFilters.includes(tag.value) ? 'active' : ''}`}
                  onClick={() => handleTagToggle(tag.value)}
                >
                  <svg viewBox="0 0 24 24" style={{ strokeWidth: 2, fill: 'none' }}>
                    <path d={tag.iconPath} />
                  </svg>
                  <label style={{ cursor: 'pointer', margin: 0 }}>{tag.label}</label>
                </div>
              ))}
            </div>
            <span 
              className="luxe-more-filters-link" 
              onClick={() => setIsTagsExpanded(!isTagsExpanded)}
            >
              {isTagsExpanded ? 'Daha az göster' : 'Daha fazla göster'}
            </span>
          </div>

          <div className="luxe-divider"></div>

          {/* ГРУППА 5: ОПЛАТА (CHECKBOXES) */}
          <div className="luxe-group">
            <span className="luxe-group-label c-filter__title fs-14 fw-600">Ödeme durumu</span>
            <div className="luxe-checkboxes">
              {[
                { label: 'Krediye uygun', value: 'Krediye uygun' },
                { label: 'Taksit imkanı', value: 'Taksit imkanı' },
                { label: 'Peşin', value: 'Peşin' }
              ].map((pay) => (
                <div 
                  key={pay.value} 
                  className={`luxe-checkbox-item ${filters.activePaymentFilters.includes(pay.value) ? 'checked' : ''}`}
                  onClick={() => handlePaymentToggle(pay.value)}
                >
                  <div className="luxe-radio-dot"></div>
                  <label style={{ cursor: 'pointer', margin: 0 }}>{pay.label}</label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Мобильный футер с кнопкой применения */}
        <div className="luxe-sidebar-mobile-footer" style={{ display: 'none' }}>
          <button 
            className="showList c-button c-button--primary" 
            onClick={() => setIsMobileSidebarOpen(false)}
            style={{ border: 'none', cursor: 'pointer' }}
          >
            <span>{totalCount}</span> Sonucu Göster
          </button>
          <button 
            className="c-button c-button--transparent clearFilter clear-filters-btn" 
            onClick={() => { onClearFilters(); setIsMobileSidebarOpen(false); }}
            style={{ border: '1px solid #CBD5E1', cursor: 'pointer', background: 'none' }}
          >
            Temizle
          </button>
        </div>
      </aside>
    </>
  );
}
