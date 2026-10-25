import { useEffect, useRef, useState, useMemo } from 'react';

export default function SidebarFilters({
  filteredProperties,
  totalCount,
  filters,
  setFilters,
  onClearFilters,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  isSidebarHidden,
  isForeigner,
  setIsForeigner,
  usdRate,
  uniqueYears = [],
  uniqueFeatures = []
}) {const sidebarContainerRef = useRef(null);
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

  // Автоматический расчет прилипания низа сайдбара к низу экрана
  useEffect(() => {
    if (typeof window === 'undefined') return;

    function calcSticky() {
      if (!sidebarContainerRef.current || window.innerWidth <= 1024) return;
      const wH = window.innerHeight;
      const sH = sidebarContainerRef.current.offsetHeight || 0;

      if (sH > wH - 110) {
        sidebarContainerRef.current.style.setProperty('--sidebar-sticky-top', `${wH - sH - 20}px`);
      } else {
        sidebarContainerRef.current.style.setProperty('--sidebar-sticky-top', '100px');
      }
    }

    const timer = setTimeout(calcSticky, 100);
    window.addEventListener('resize', calcSticky);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calcSticky);
    };
  }, [isTagsExpanded]);

  // === Безопасный Emlakjet Smart Sticky (после объявления всех useState) ===
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateStickyPosition = () => {
      if (!sidebarContainerRef.current || window.innerWidth <= 1024) return;
      const windowHeight = window.innerHeight;
      const sidebarHeight = sidebarContainerRef.current.offsetHeight || 0;

      if (sidebarHeight > windowHeight - 110) {
        const bottomStickyTop = windowHeight - sidebarHeight - 15;
        sidebarContainerRef.current.style.setProperty('--sidebar-sticky-top', `${bottomStickyTop}px`);
      } else {
        sidebarContainerRef.current.style.setProperty('--sidebar-sticky-top', '100px');
      }
    };

    // Запускаем через requestAnimationFrame, чтобы DOM успел полностью отрисоваться
    const rafId = requestAnimationFrame(updateStickyPosition);
    window.addEventListener('resize', updateStickyPosition);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateStickyPosition);
    };
  }, [filteredProperties?.length, isTagsExpanded]);
  // СВЕРХБЫСТРЫЙ КЭШ ПОДСЧЕТА ВСЕХ УДОБСТВ ЗА ОДИН ПРОХОД
  const featureCounts = useMemo(() => {
    const featureStems = {
      'Kapalı Otopark': ['kapalı otopark', 'yeraltı otopark', 'otopark'],
      '24 Saat Güvenlik': ['güvenlik', 'kamera', '7/24'],
      'Yüzme Havuzu': ['havuz', 'yüzme'],
      'Çocuk Oyun Alanı': ['çocuk oyun', 'çocuk park', 'oyun park'],
      'Spor Salonu': ['fitness', 'spor salonu', 'gym', 'spor alanı'],
      'Sauna': ['sauna', 'hamam', 'buhar', 'spa'],
      'Jeneratör': ['jeneratör', 'kesintisiz jeneratör'],
      'Peyzaj': ['peyzaj', 'yeşil alan', 'yürüyüş parkuru', 'park'],
      'Deprem': ['deprem', 'radye', 'zemin etüd'],
      'Şarj İstasyonu': ['şarj', 'elektrikli araç'],
      'Yerden Isıtma': ['yerden ısıtma', 'zeminden ısıtma', 'alttan ısıtma'],
      'Ankastre Mutfak': ['ankastre', 'beyaz eşya', 'fırın', 'ocak'],
      'Manzara': ['deniz', 'doğa', 'manzara', 'göl', 'orman'],
      'Akıllı Ev': ['akıllı ev', 'smart home', 'otomasyon']
    };

    const counts = {};
    Object.keys(featureStems).forEach(k => counts[k] = 0);

    if (!filteredProperties || filteredProperties.length === 0) return counts;

    for (let i = 0; i < filteredProperties.length; i++) {
      const p = filteredProperties[i];
      const text = ((p.Özellikler || '') + ' ' + (p.Açıklama || '')).toLowerCase();

      for (const [id, stems] of Object.entries(featureStems)) {
        for (let s = 0; s < stems.length; s++) {
          if (text.includes(stems[s])) {
            counts[id]++;
            break;
          }
        }
      }
    }

    return counts;
  }, [filteredProperties]);
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

  // Обработчик выбора года
  const handleYearToggle = (year) => {
    const activeYears = filters.selectedYears || [];
    const updated = activeYears.includes(year)
      ? activeYears.filter((y) => y !== year)
      : [...activeYears, year];
    
    setFilters((prev) => ({ ...prev, selectedYears: updated }));
  };

// Яндекс.Карты (отложенная мягкая загрузка, освобождающая главный поток)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const timer = setTimeout(() => {
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
    }, 400); // 400ms задержка дает странице мгновенно отрисоваться без фризов!

    return () => {
      clearTimeout(timer);
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

  // Синхронизация ползунков слайдеров
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

  useEffect(() => {
    if (!priceSliderInst.current) return;
    
    let minLimit = 0;
    
    if (isForeigner) {
      const isVatandaslik = filters.activeFeatureFilters.includes('Vatandaşlığa Uygun');
      const isIkamet = filters.activeFeatureFilters.includes('İkamete Uygun');
      
      if (isVatandaslik && isIkamet) {
        minLimit = Math.round(200000 * usdRate);
      } else if (isVatandaslik && !isIkamet) {
        minLimit = Math.round(400000 * usdRate);
      } else if (isIkamet && !isVatandaslik) {
        minLimit = Math.round(200000 * usdRate);
      }
    }
    
    priceSliderInst.current.updateOptions({
      range: {
        min: minLimit,
        max: 50000000
      }
    });

    if (isForeigner) {
      setFilters(prev => ({ ...prev, priceRange: [minLimit, prev.priceRange[1]] }));
    }
  }, [isForeigner, usdRate, filters.activeFeatureFilters]);

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

      <aside 
        ref={sidebarContainerRef}
        className={'luxe-sidebar ' + (isSidebarHidden ? 'sidebar-hidden' : '') + ' ' + (isMobileSidebarOpen ? 'sidebar-mobile-show' : '')} 
        id="custom-sidebar"
      >
        <span className="sidebar-mobile-close-btn" onClick={() => setIsMobileSidebarOpen(false)}>
          &times;
        </span>

       <div className="luxe-sidebar-scrollable-body">

          {/* ШАПКА ФИЛЬТРА СТРОГО ПО ВАШЕМУ СКРИНШОТУ */}
          <div className="sb-header-clean">
            <h2 className="sb-title">Detaylı filtreler</h2>
            <div className="sb-subtitle-row">
              <span className="sb-count-info">
                <strong>{totalCount}</strong> proje listeleniyor
              </span>
              <span className="sb-sep">·</span>
              <button type="button" className="sb-clear-link" onClick={onClearFilters}>
                Temizle
              </button>
            </div>
          </div>

          <div className="sb-emerald-divider"></div>

          {/* 1. СТАТУС ПРОЕКТА (PROJE DURUMU) */}
          <div className="sb-section">
            <span className="sb-section-title">Proje durumu</span>
            <div className="chips">
              {['Lansman', 'Devam ediyor', 'Tamamlandı'].map((st) => {
                const isSelected = (filters.selectedStatuses || []).includes(st);
                return (
                  <button
                    key={st}
                    type="button"
                    className="chip"
                    aria-pressed={isSelected}
                    onClick={() => {
                      const updated = isSelected
                        ? (filters.selectedStatuses || []).filter((s) => s !== st)
                        : [...(filters.selectedStatuses || []), st];
                      setFilters((prev) => ({ ...prev, selectedStatuses: updated }));
                    }}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="sb-divider"></div>

          {/* 2. ГОД СДАЧИ (TESLİM YILI) */}
          {uniqueYears.length > 0 && (
            <>
              <div className="sb-section">
                <span className="sb-section-title">Teslim Yılı</span>
                <div className="chips">
                  {uniqueYears.map((year) => {
                    const isActive = (filters.selectedYears || []).includes(year);
                    return (
                      <button
                        key={year}
                        type="button"
                        className="chip"
                        aria-pressed={isActive}
                        onClick={() => handleYearToggle(year)}
                      >
                        {year}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="sb-divider"></div>
            </>
          )}

          {/* 3. МЕТРАЖ (METREKARE) */}
          <div className="sb-section">
            <span className="sb-section-title">Metrekare (m²)</span>
            <div className="rng">
              <input 
                type="text" 
                value={minAreaInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setMinAreaInput(val);
                  const num = parseInt(val);
                  if (!isNaN(num)) setFilters((prev) => ({ ...prev, areaRange: [num, prev.areaRange[1]] }));
                }}
                onBlur={() => {
                  if (minAreaInput === "" || isNaN(parseInt(minAreaInput))) {
                    setMinAreaInput(0);
                    setFilters((prev) => ({ ...prev, areaRange: [0, prev.areaRange[1]] }));
                  }
                }}
              />
              <span>–</span>
              <input 
                type="text" 
                value={maxAreaInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setMaxAreaInput(val);
                  const num = parseInt(val);
                  if (!isNaN(num)) setFilters((prev) => ({ ...prev, areaRange: [prev.areaRange[0], num] }));
                }}
                onBlur={() => {
                  if (maxAreaInput === "" || isNaN(parseInt(maxAreaInput))) {
                    setMaxAreaInput(500);
                    setFilters((prev) => ({ ...prev, areaRange: [prev.areaRange[0], 500] }));
                  }
                }}
              />
            </div>
            <div ref={areaSliderRef} className="luxe-slider-track"></div>
          </div>

          <div className="sb-divider"></div>

          {/* 4. ЭТАЖНОСТЬ (KAT SAYISI) */}
          <div className="sb-section">
            <span className="sb-section-title">Kat sayısı</span>
            <div className="rng">
              <input 
                type="text" 
                value={minKatInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setMinKatInput(val);
                  const num = parseInt(val);
                  if (!isNaN(num)) setFilters((prev) => ({ ...prev, katRange: [num, prev.katRange[1]] }));
                }}
                onBlur={() => {
                  if (minKatInput === "" || isNaN(parseInt(minKatInput))) {
                    setMinKatInput(0);
                    setFilters((prev) => ({ ...prev, katRange: [0, prev.katRange[1]] }));
                  }
                }}
              />
              <span>–</span>
              <input 
                type="text" 
                value={maxKatInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setMaxKatInput(val);
                  const num = parseInt(val);
                  if (!isNaN(num)) setFilters((prev) => ({ ...prev, katRange: [prev.katRange[0], num] }));
                }}
                onBlur={() => {
                  if (maxKatInput === "" || isNaN(parseInt(maxKatInput))) {
                    setMaxKatInput(40);
                    setFilters((prev) => ({ ...prev, katRange: [prev.katRange[0], 40] }));
                  }
                }}
              />
            </div>
            <div ref={katSliderRef} className="luxe-slider-track"></div>
          </div>

          <div className="sb-divider"></div>

          {/* 5. ЦЕНА (FİYAT) */}
          <div className="sb-section">
            <span className="sb-section-title">Fiyat</span>
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

          <div className="sb-divider"></div>

          {/* 6. УДОБСТВА ЖК (SİTE & SOSYAL ÖZELLİKLER) */}
          <div className="sb-section">
            <span className="sb-section-title">Site & Sosyal Özellikler</span>
            <div className={`space-y-1.5 mt-2 ${isTagsExpanded ? 'emlakjet-features-scroll' : ''}`}>
              {[
                { id: 'Kapalı Otopark', label: 'Kapalı Otopark' },
                { id: '24 Saat Güvenlik', label: '24 Saat Güvenlik' },
                { id: 'Yüzme Havuzu', label: 'Yüzme Havuzu' },
                { id: 'Çocuk Oyun Alanı', label: 'Çocuk Oyun Parkı' },
                { id: 'Spor Salonu', label: 'Fitness & Spor Salonu' },
                ...(isTagsExpanded ? [
                  { id: 'Sauna', label: 'Sauna & Hamam' },
                  { id: 'Jeneratör', label: 'Jeneratör' },
                  { id: 'Peyzaj', label: 'Peyzaj & Yürüyüş Parkuru' },
                  { id: 'Deprem', label: 'Deprem Yönetmeliğine Uygun' },
                  { id: 'Şarj İstasyonu', label: 'Araç Şarj İstasyonu' }
                ] : [])
              ].map((item) => {
                const isChecked = filters.activeFeatureFilters.includes(item.id);
                const matchCount = featureCounts[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-1.5 px-1 cursor-pointer select-none hover:opacity-80 transition"
                    onClick={() => handleTagToggle(item.id)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isChecked ? 'bg-[#00A4A6] border-[#00A4A6]' : 'border-slate-400 bg-transparent'}`}>
                        {isChecked && (
                          <svg className="w-2.5 h-2.5 text-white stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                      </div>
                      <span className={`text-xs font-semibold ${isChecked ? 'font-bold' : ''}`} style={{ color: 'var(--text)' }}>
                        {item.label}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold" style={{ color: 'var(--muted)' }}>({matchCount})</span>
                  </div>
                );
              })}
            </div>

            <span 
              className="luxe-more-filters-link text-xs font-bold cursor-pointer inline-block mt-2.5" 
              onClick={() => setIsTagsExpanded(!isTagsExpanded)}
            >
              {isTagsExpanded ? 'Daha az göster ▴' : 'Daha fazla göster (5) ▾'}
            </span>
          </div>

          <div className="sb-divider"></div>

          {/* 7. ВНУТРЕННИЕ УДОБСТВА (DAİRE İÇİ ÖZELLİKLER) */}
          <div className="sb-section">
            <span className="sb-section-title">Daire İçi Özellikler</span>
            <div className="space-y-1.5 mt-2">
              {[
                { id: 'Yerden Isıtma', label: 'Yerden Isıtma' },
                { id: 'Ankastre Mutfak', label: 'Ankastre Mutfak Seti' },
                { id: 'Manzara', label: 'Deniz / Doğa Manzarası' },
                { id: 'Akıllı Ev', label: 'Akıllı Ev Sistemi' }
              ].map((item) => {
                const isChecked = filters.activeFeatureFilters.includes(item.id);
                const matchCount = featureCounts[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-1.5 px-1 cursor-pointer select-none hover:opacity-80 transition"
                    onClick={() => handleTagToggle(item.id)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isChecked ? 'bg-[#00A4A6] border-[#00A4A6]' : 'border-slate-400 bg-transparent'}`}>
                        {isChecked && (
                          <svg className="w-2.5 h-2.5 text-white stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                      </div>
                      <span className={`text-xs font-semibold ${isChecked ? 'font-bold' : ''}`} style={{ color: 'var(--text)' }}>
                        {item.label}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold" style={{ color: 'var(--muted)' }}>({matchCount})</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="sb-divider"></div>

          {/* 8. ОПЛАТА (ÖDEME DURUMU) */}
          <div className="sb-section">
            <span className="sb-section-title">Ödeme durumu</span>
            <div className="luxe-checkboxes mt-2">
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
                  <label style={{ cursor: 'pointer', margin: 0, color: 'var(--text)' }}>{pay.label}</label>
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
