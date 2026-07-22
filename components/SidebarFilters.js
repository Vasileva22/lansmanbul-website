import { useEffect, useRef, useState } from 'react';

export default function SidebarFilters({
  filteredProperties,
  totalCount,
  filters,
  setFilters,
  onClearFilters,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  isSidebarHidden,
  // === НАЧАЛО ВСТАВКИ ===
  isForeigner,
  setIsForeigner,
  usdRate
  // === КОНЕЦ ВСТАВКИ ===
}) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const mapLoaded = useRef(false);

  const areaSliderRef = useRef(null);
  const katSliderRef = useRef(null);
  const priceSliderRef = useRef(null);

  const areaSliderInst = useRef(null);
  const katSliderInst = useRef(null);
  const priceSliderInst = useRef(null);

  const [isTagsExpanded, setIsTagsExpanded] = useState(false);

  // Локальные состояния для Цены
  const [minPriceInput, setMinPriceInput] = useState(filters.priceRange[0]);
  const [maxPriceInput, setMaxPriceInput] = useState(filters.priceRange[1]);

  // Локальные состояния для Площади
  const [minAreaInput, setMinAreaInput] = useState(filters.areaRange[0]);
  const [maxAreaInput, setMaxAreaInput] = useState(filters.areaRange[1]);

  // Локальные состояния для Этажей
  const [minKatInput, setMinKatInput] = useState(filters.katRange[0]);
  const [maxKatInput, setMaxKatInput] = useState(filters.katRange[1]);

  // Синхронизация Цены при изменениях извне (например, при сбросе фильтров)
  useEffect(() => {
    setMinPriceInput(filters.priceRange[0]);
    setMaxPriceInput(filters.priceRange[1]);
  }, [filters.priceRange]);

  // Синхронизация Площади при изменениях извне
  useEffect(() => {
    setMinAreaInput(filters.areaRange[0]);
    setMaxAreaInput(filters.areaRange[1]);
  }, [filters.areaRange]);

  // Синхронизация Этажей при изменениях извне
  useEffect(() => {
    setMinKatInput(filters.katRange[0]);
    setMaxKatInput(filters.katRange[1]);
  }, [filters.katRange]);

  // Яндекс.Карты (выполняется строго на клиенте)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initMapInstance = () => {
      if (window.ymaps && !mapInstance.current && mapRef.current) {
        window.ymaps.ready(() => {
          mapInstance.current = new window.ymaps.Map(mapRef.current, {
            center: [39.9334, 32.8597],
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
      script.src = 'https://api-maps.yandex.ru/2.1/?apikey=' + (process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || '72709de3-d8bc-49c9-88c6-339937b3fa51') + '&lang=tr_TR';
      script.type = 'text/javascript';
      script.onload = initMapInstance;
      document.head.appendChild(script);
    } else {
      initMapInstance();
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy();
        mapInstance.current = null;
        mapLoaded.current = false;
      }
    };
  }, []);

  const drawMapPlacemarks = () => {
    if (!mapInstance.current || !mapLoaded.current) return;

    mapInstance.current.geoObjects.removeAll();

    filteredProperties.forEach((property) => {
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
          balloonContentHeader: '<strong>' + title + '</strong>',
          balloonContentBody: priceFormatted,
          hintContent: title,
        }, {
          preset: 'islands#dotIcon',
          iconColor: '#00A4A6',
        });

        mapInstance.current.geoObjects.add(placemark);
      }
    });

    if (mapInstance.current.geoObjects.getLength() > 0) {
      mapInstance.current.setBounds(mapInstance.current.geoObjects.getBounds(), {
        checkZoomRange: true,
        zoomMargin: 15,
      });
    }
  };

  useEffect(() => {
    drawMapPlacemarks();
  }, [filteredProperties]);

  // Клиентский импорт noUiSlider и привязка к событию 'slide'
  useEffect(() => {
    if (typeof window === 'undefined') return;

    import('nouislider').then((noUiSliderModule) => {
      const noUiSlider = noUiSliderModule.default || noUiSliderModule;

      // Инициализация слайдера площади
      if (areaSliderRef.current && !areaSliderInst.current) {
        areaSliderInst.current = noUiSlider.create(areaSliderRef.current, {
          start: [filters.areaRange[0], filters.areaRange[1]],
          connect: true,
          range: { min: 0, max: 500 },
          step: 1,
        });

        areaSliderInst.current.on('slide', (values) => {
          const range = values.map(Math.round);
          setFilters((prev) => ({ ...prev, areaRange: range }));
        });
      }

      // Инициализация слайдера этажей
      if (katSliderRef.current && !katSliderInst.current) {
        katSliderInst.current = noUiSlider.create(katSliderRef.current, {
          start: [filters.katRange[0], filters.katRange[1]],
          connect: true,
          range: { min: 0, max: 40 },
          step: 1,
        });

        katSliderInst.current.on('slide', (values) => {
          const range = values.map(Math.round);
          setFilters((prev) => ({ ...prev, katRange: range }));
        });
      }

      // Инициализация слайдера цен
      if (priceSliderRef.current && !priceSliderInst.current) {
        priceSliderInst.current = noUiSlider.create(priceSliderRef.current, {
          start: [filters.priceRange[0], filters.priceRange[1]],
          connect: true,
          range: { min: 0, max: 50000000 },
          step: 1000,
        });

        priceSliderInst.current.on('slide', (values) => {
          const range = values.map(Math.round);
          setFilters((prev) => ({ ...prev, priceRange: range }));
        });
      }
    }).catch(err => {
      console.error("nouislider yukleme hatasi:", err);
    });

    return () => {
      if (areaSliderInst.current) { areaSliderInst.current.destroy(); areaSliderInst.current = null; }
      if (katSliderInst.current) { katSliderInst.current.destroy(); katSliderInst.current = null; }
      if (priceSliderInst.current) { priceSliderInst.current.destroy(); priceSliderInst.current = null; }
    };
  }, []);

  // Синхронизация ползунков слайдеров с предохранителем от бесконечного цикла
  useEffect(() => {
    if (areaSliderInst.current) {
      const current = areaSliderInst.current.get().map(Math.round);
      if (current[0] !== filters.areaRange[0] || current[1] !== filters.areaRange[1]) {
        areaSliderInst.current.set(filters.areaRange);
      }
    }
    if (katSliderInst.current) {
      const current = katSliderInst.current.get().map(Math.round);
      if (current[0] !== filters.katRange[0] || current[1] !== filters.katRange[1]) {
        katSliderInst.current.set(filters.katRange);
      }
    }
    if (priceSliderInst.current) {
      const current = priceSliderInst.current.get().map(Math.round);
      if (current[0] !== filters.priceRange[0] || current[1] !== filters.priceRange[1]) {
        priceSliderInst.current.set(filters.priceRange);
      }
    }
  }, [filters.areaRange, filters.katRange, filters.priceRange]);

  const handleTagToggle = (tag) => {
    const isSelected = filters.activeFeatureFilters.includes(tag);
    const updated = isSelected
      ? filters.activeFeatureFilters.filter((t) => t !== tag)
      : [...filters.activeFeatureFilters, tag];
    
    setFilters((prev) => ({ ...prev, activeFeatureFilters: updated }));
  };

  const handlePaymentToggle = (payment) => {
    const isChecked = filters.activePaymentFilters.includes(payment);
    const updated = isChecked
      ? filters.activePaymentFilters.filter((p) => p !== payment)
      : [...filters.activePaymentFilters, payment];

    setFilters((prev) => ({ ...prev, activePaymentFilters: updated }));
  };

  const handleManualPriceApply = () => {
    setFilters((prev) => ({
      ...prev,
      priceRange: [minPriceInput, maxPriceInput],
    }));
  };

  return (
    <>
      <div 
        className={'sidebar-mobile-overlay ' + (isMobileSidebarOpen ? 'show' : '')}
        onClick={() => setIsMobileSidebarOpen(false)}
      ></div>

      <aside className={'luxe-sidebar ' + (isSidebarHidden ? 'sidebar-hidden' : '') + ' ' + (isMobileSidebarOpen ? 'sidebar-mobile-show' : '')} id="custom-sidebar">
        <span className="sidebar-mobile-close-btn" onClick={() => setIsMobileSidebarOpen(false)}>
          &times;
        </span>

        <div className="luxe-sidebar-scrollable-body">
          <div ref={mapRef} id="yandex-map-container" className="luxe-sidebar-map"></div>

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

          <div className="luxe-group">
            <span className="luxe-group-label c-filter__title fs-14 fw-600">Metrekare (m²)</span>
            <div className="luxe-range-inputs-row">
              <input 
                type="text" 
                className="luxe-oval-input" 
                value={minAreaInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, ''); // Разрешаем только цифры
                  setMinAreaInput(val);
                  const num = parseInt(val);
                  if (!isNaN(num)) {
                    setFilters((prev) => ({ ...prev, areaRange: [num, prev.areaRange[1]] }));
                  }
                }}
                onBlur={() => {
                  // Если поле оставили пустым при выходе из ячейки — страхуем и ставим 0
                  if (minAreaInput === "" || isNaN(parseInt(minAreaInput))) {
                    setMinAreaInput(0);
                    setFilters((prev) => ({ ...prev, areaRange: [0, prev.areaRange[1]] }));
                  }
                }}
              />
              <span className="luxe-range-separator">—</span>
              <input 
                type="text" 
                className="luxe-oval-input" 
                value={maxAreaInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setMaxAreaInput(val);
                  const num = parseInt(val);
                  if (!isNaN(num)) {
                    setFilters((prev) => ({ ...prev, areaRange: [prev.areaRange[0], num] }));
                  }
                }}
                onBlur={() => {
                  // Если поле оставили пустым при выходе — страхуем и возвращаем 500
                  if (maxAreaInput === "" || isNaN(parseInt(maxAreaInput))) {
                    setMaxAreaInput(500);
                    setFilters((prev) => ({ ...prev, areaRange: [prev.areaRange[0], 500] }));
                  }
                }}
              />
            </div>
            <div ref={areaSliderRef} className="luxe-slider-track"></div>
          </div>

          <div className="luxe-divider"></div>

          <div className="luxe-group">
            <span className="luxe-group-label c-filter__title fs-14 fw-600">Kat sayısı</span>
            <div className="luxe-range-inputs-row">
              <input 
                type="text" 
                className="luxe-oval-input" 
                value={minKatInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setMinKatInput(val);
                  const num = parseInt(val);
                  if (!isNaN(num)) {
                    setFilters((prev) => ({ ...prev, katRange: [num, prev.katRange[1]] }));
                  }
                }}
                onBlur={() => {
                  // Если поле пустое при выходе — страхуем и ставим 0
                  if (minKatInput === "" || isNaN(parseInt(minKatInput))) {
                    setMinKatInput(0);
                    setFilters((prev) => ({ ...prev, katRange: [0, prev.katRange[1]] }));
                  }
                }}
              />
              <span className="luxe-range-separator">—</span>
              <input 
                type="text" 
                className="luxe-oval-input" 
                value={maxKatInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setMaxKatInput(val);
                  const num = parseInt(val);
                  if (!isNaN(num)) {
                    setFilters((prev) => ({ ...prev, katRange: [prev.katRange[0], num] }));
                  }
                }}
                onBlur={() => {
                  // Если поле пустое при выходе — страхуем и возвращаем 40
                  if (maxKatInput === "" || isNaN(parseInt(maxKatInput))) {
                    setMaxKatInput(40);
                    setFilters((prev) => ({ ...prev, katRange: [prev.katRange[0], 40] }));
                  }
                }}
              />
            </div>
            <div ref={katSliderRef} className="luxe-slider-track"></div>
          </div>

          <div className="luxe-divider"></div>

          <div className="luxe-group">
            <span className="luxe-group-label c-filter__title fs-16 fw-600">Fiyat</span>
            <div className="price-live-display">
              <span>{filters.priceRange[0].toLocaleString('tr-TR')} TL</span> — <span>{filters.priceRange[1].toLocaleString('tr-TR')} TL</span>
            </div>
            <div ref={priceSliderRef} className="luxe-slider-track"></div>

            <div className="price-inputs-container">
              <div className="price-input-box">
                <span className="price-box-label">En Düşük</span>
                <div className="price-box-input-wrap">
                  <input 
                    type="text" 
                    className="price-box-input min priceInput py-0" 
                    value={minPriceInput.toLocaleString('tr-TR')}
                    onChange={(e) => {
                      const num = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                      setMinPriceInput(num);
                    }}
                  />
                  <span className="price-currency">TL</span>
                </div>
              </div>
              <div className="price-input-box">
                <span className="price-box-label">En Yüksek</span>
                <div className="price-box-input-wrap">
                  <input 
                    type="text" 
                    className="price-box-input max priceInput py-0" 
                    value={maxPriceInput.toLocaleString('tr-TR')}
                    onChange={(e) => {
                      const num = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                      setMaxPriceInput(num);
                    }}
                  />
                  <span className="price-currency">TL</span>
                </div>
              </div>
              <button className="price-go-btn" title="Filtrele" onClick={handleManualPriceApply}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>

          <div className="luxe-divider"></div>

          <div className="luxe-group">
            <span className="luxe-group-label c-filter__title fs-14 fw-600">Olanaklar</span>
            <div className={'luxe-tags ' + (isTagsExpanded ? 'expanded' : '')}>
              {[
                { label: 'Havuz', value: 'Havuz', svg: <svg className="card-svg-icon" viewBox="0 0 24 24"><path d="M2 19a3 3 0 0 0 6 0a3 3 0 0 0 6 0a3 3 0 0 0 6 0a3 3 0 0 0 2 0v-2a3 3 0 0 1-2 0a3 3 0 0 1-6 0a3 3 0 0 1-6 0a3 3 0 0 1-2 0v2zM2 13a3 3 0 0 0 6 0a3 3 0 0 0 6 0a3 3 0 0 0 6 0a3 3 0 0 0 2 0v-2a3 3 0 0 1-2 0a3 3 0 0 1-6 0a3 3 0 0 1-6 0a3 3 0 0 1-2 0v2z" /></svg> },
                { label: 'Fitness', value: 'Fitness', svg: <svg className="card-svg-icon" viewBox="0 0 24 24"><path d="M20.57 14.86L22 13.43l-1.43-1.43l-1.43 1.43l-3.57-3.57l1.43-1.43L15.57 7L14.14 8.43l-1.43-1.43l-2.14 2.14l1.43 1.43l-1.43 1.43l-3.57-3.57l1.43-1.43L5 5.57L3.57 7l1.43 1.43l-2.14 2.14L4.29 12l1.43-1.43l3.57 3.57l-1.43 1.43L9.29 17l1.43-1.43l1.43 1.43l2.14-2.14l-1.43-1.43l1.43-1.43l3.57 3.57l-1.43 1.43L18.29 20l1.43-1.43z" /></svg> },
                { label: 'Güvenlik', value: 'Güvenlik', svg: <svg className="card-svg-icon" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12c5.16-12 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" /></svg> },
                { label: 'Otopark', value: 'Otopark', svg: <svg className="card-svg-icon" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-6 11h-3v4H8V6h5c1.66 0 3 1.34 3 3s-1.34 3-3 3zm0-5h-3v2h3c.55 0 1-.45 1-1s-.45-1-1-1z" /></svg> },
                { label: 'Çocuk Parkı', value: 'Çocuk parkı', svg: <svg className="card-svg-icon" viewBox="0 0 24 24"><path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2s-2-.9-2-2s.9-2 2-2zm9 7h-6v13h-2v-6h-2v-6H9V9H3V7h18v2z" /></svg> },
                { label: 'Site İçerisinde', value: 'Site İçerisinde', svg: <svg className="card-svg-icon" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4 6h-2V7h2v2zm-5 0H8V7h2v2zm5 5h-2v-2h2v2zm-5 0H8v-2h2v2zm5 5h-2v-2h2v2zm-5 0H8v-2h2v2z" /></svg> },
                { label: 'Spor Salonu', value: 'Spor Salonu', svg: <svg className="card-svg-icon" viewBox="0 0 24 24"><path d="M20.57 14.86L22 13.43l-1.43-1.43l-1.43 1.43l-3.57-3.57l1.43-1.43L15.57 7L14.14 8.43l-1.43-1.43l-2.14 2.14l1.43 1.43l-1.43 1.43l-3.57-3.57l1.43-1.43L5 5.57L3.57 7l1.43 1.43l-2.14 2.14L4.29 12l1.43-1.43l3.57 3.57l-1.43 1.43L9.29 17l1.43-1.43l1.43 1.43l2.14-2.14l-1.43-1.43l1.43-1.43l3.57 3.57l-1.43 1.43L18.29 20l1.43-1.43z" /></svg> },
                { label: 'Sauna', value: 'Sauna', svg: <svg className="card-svg-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg> },
                { label: 'Hamam', value: 'Hamam', svg: <svg className="card-svg-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg> },
                { label: 'Oyun Parkı', value: 'Oyun Parkı', svg: <svg className="card-svg-icon" viewBox="0 0 24 24"><path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2s-2-.9-2-2s.9-2 2-2zm9 7h-6v13h-2v-6h-2v-6H9V9H3V7h18v2z" /></svg> }
              ].map((tag) => (
                <div 
                  key={tag.value} 
                  className={'luxe-tag-item ' + (filters.activeFeatureFilters.includes(tag.value) ? 'active' : '')}
                  onClick={() => handleTagToggle(tag.value)}
                >
                  {tag.svg}
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
                  className={'luxe-checkbox-item ' + (filters.activePaymentFilters.includes(pay.value) ? 'checked' : '')}
                  onClick={() => handlePaymentToggle(pay.value)}
                >
                  <div className="luxe-radio-dot"></div>
                  <label style={{ cursor: 'pointer', margin: 0 }}>{pay.label}</label>
                </div>
              ))}
            </div>
          </div>
        </div>

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
