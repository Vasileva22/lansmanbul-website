import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';

export default function HeroSearch({
  filters,
  setFilters,
  uniqueRooms = [],
  uniqueStatuses = [],
  properties = [],
  onSearch,
}) {
  const router = useRouter();
  const [activeDropdown, setActiveDropdown] = useState(null); // 'location', 'room', 'status'
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDistricts, setExpandedDistricts] = useState([]); // <--- ДОБАВИТЬ ЭТУ СТРОЧКУ
  const dropdownRef = useRef(null);

  // Текущий выбранный город из фильтра (по умолчанию Ankara)
  const currentCity = filters.selectedCity || 'Ankara';

  // Закрытие выпадающего окна при клике вне его
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Блокировка фонового скролла на мобильных при открытом меню
  useEffect(() => {
    if (activeDropdown && window.innerWidth <= 1024) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeDropdown]);

  // Фильтр от спама и мусорных строк парсера
  const isCleanString = (str) => {
    if (!str || typeof str !== 'string') return false;
    const lower = str.toLowerCase().trim();
    if (lower.length < 2) return false;
    const spamWords = ['müşteri', 'hizmet', 'sahibinden', 'emlakjet', 'telefon', 'call', 'center', '054', '055', 'danışman'];
    return !spamWords.some(w => lower.includes(w));
  };
// Определение типа жилья проекта
  const getPropertyType = (p) => {
    const rawType = String(p.property_type || '').toLowerCase();
    const rawTitle = String(p.testproje || '').toLowerCase();
    const rawRooms = String(p['card odalar'] || '').toLowerCase();
    const rawDesc = String(p.Açıklama || '').toLowerCase();

    if (rawType.includes('villa') || rawTitle.includes('villa') || rawRooms.includes('villa')) return 'Villa';
    if (rawType.includes('penthouse') || rawTitle.includes('penthouse') || rawDesc.includes('penthouse')) return 'Penthouse';
    return 'Daire';
  };

  // Сбор только тех комнат, которые РЕАЛЬНО есть в базе для выбранного типа
  const availableRoomsForType = useMemo(() => {
    const currentType = filters.selectedPropertyType || 'Daire';

    // 1. Проекты текущего города и текущего типа
    const matchedProps = properties.filter((p) => {
      const pCity = (p.city || 'Ankara').toLowerCase();
      if (currentCity !== 'Tümü' && !pCity.includes(currentCity.toLowerCase())) return false;
      return getPropertyType(p) === currentType;
    });

    if (matchedProps.length === 0) {
      return { hasProjects: false, salons1: [], salons2: [] };
    }

    // 2. Собираем все строки комнат из карточки и планировок
    const rawRooms = matchedProps.flatMap((p) => {
      const list = [p['card odalar']];
      if (Array.isArray(p.layouts)) {
        p.layouts.forEach((l) => list.push(l.rooms));
      }
      return list.filter(Boolean).map((r) => String(r).toLowerCase());
    });

    // 3. Проверяем наличие стандартных типов
    const standard1Salon = ['1+0', '1+1', '2+1', '3+1', '4+1', '5+1 ve üzeri'];
    const standard2Salon = ['2+2', '3+2', '4+2', '5+2 ve üzeri'];

    const salons1 = standard1Salon.filter((std) => {
      const clean = std.replace(' ve üzeri', '').trim().toLowerCase();
      return rawRooms.some((r) => r.includes(clean));
    });

    const salons2 = standard2Salon.filter((std) => {
      const clean = std.replace(' ve üzeri', '').trim().toLowerCase();
      return rawRooms.some((r) => r.includes(clean));
    });

    return { hasProjects: true, salons1, salons2 };
  }, [properties, currentCity, filters.selectedPropertyType]);
  // 1. ДИНАМИЧЕСКИЙ РАСЧЕТ ГОРОДОВ И КОЛИЧЕСТВА ПРОЕКТОВ ИЗ БАЗЫ
  const availableCities = useMemo(() => {
    const targetCities = ['Ankara', 'İstanbul', 'Antalya'];
    
    return targetCities.map((cityName) => {
      const count = properties.filter((p) => {
        const c = (p.city || 'Ankara').toLowerCase();
        return c.includes(cityName.toLowerCase());
      }).length;

      return {
        name: cityName,
        count: count,
        isAvailable: count > 0,
      };
    });
  }, [properties]);

  // 2. ДИНАМИЧЕСКИЙ СПИСОК РАЙОНОВ ТЕКУЩЕГО ГОРОДА (В АЛФАВИТНОМ ПОРЯДКЕ С ПОДСЧЕТОМ)
 const cityDistrictsWithCount = useMemo(() => {
    const map = new Map();

    properties.forEach((p) => {
      const pCity = (p.city || 'Ankara').toLowerCase();
      if (currentCity !== 'Tümü' && !pCity.includes(currentCity.toLowerCase())) {
        return;
      }

      const rawDistrict = p.district || (p['İlçe/Semt'] ? p['İlçe/Semt'].split(/\s+/)[0] : '');
      if (!isCleanString(rawDistrict)) return;

      // Извлекаем микрорайон
      let subArea = p.mahalle || '';
      if (!subArea && p['İlçe/Semt'] && p['İlçe/Semt'].includes(rawDistrict)) {
        subArea = p['İlçe/Semt'].replace(rawDistrict, '').trim();
      }

      // Отсекаем дубли (если микрорайон называется так же, как и район)
      if (subArea.toLowerCase() === rawDistrict.toLowerCase()) {
        subArea = '';
      }

      if (!map.has(rawDistrict)) {
        map.set(rawDistrict, { name: rawDistrict, count: 0, subMap: new Map() });
      }

      const item = map.get(rawDistrict);
      item.count += 1;
      if (subArea && isCleanString(subArea)) {
        item.subMap.set(subArea, (item.subMap.get(subArea) || 0) + 1);
      }
    });

    return Array.from(map.values())
      .map((item) => ({
        name: item.name,
        count: item.count,
        subAreas: Array.from(item.subMap.entries()).map(([subName, subCount]) => ({ name: subName, count: subCount })),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  }, [properties, currentCity]);

  // 3. УМНЫЙ ПОИСК (OMNIBOX) ПРИ ВВОДЕ ТЕКСТА
  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    if (!q) {
      return {
        matchedCities: [],
        matchedDistricts: cityDistrictsWithCount,
        matchedMahalles: [],
        matchedProjects: [],
      };
    }

    // Совпадения по городам
    const matchedCities = availableCities.filter(c => c.name.toLowerCase().includes(q));

    // Совпадения по районам
    const matchedDistricts = cityDistrictsWithCount.filter(d => d.name.toLowerCase().includes(q));

    // Совпадения по махалле (микрорайонам)
    const mahalleMap = new Map();
    properties.forEach(p => {
      const m = p.mahalle;
      if (isCleanString(m) && m.toLowerCase().includes(q)) {
        const districtName = p.district || p['İlçe/Semt'] || '';
        const cityName = p.city || 'Ankara';
        const key = `${m} (${districtName} / ${cityName})`;
        mahalleMap.set(key, { mahalle: m, district: districtName, city: cityName });
      }
    });
    const matchedMahalles = Array.from(mahalleMap.values()).slice(0, 4);

    // Совпадения по названиям конкретных ЖК
    const matchedProjects = properties
      .filter(p => (p.testproje || '').toLowerCase().includes(q))
      .slice(0, 4);

    return {
      matchedCities,
      matchedDistricts,
      matchedMahalles,
      matchedProjects,
    };
  }, [searchQuery, cityDistrictsWithCount, availableCities, properties]);

  // Переключение города
  const handleCitySelect = (cityName) => {
    setFilters((prev) => ({
      ...prev,
      selectedCity: cityName,
      selectedLocations: [], // сбрасываем старые районы при смене города
    }));
    setSearchQuery('');
  };

  // Переключение выбора района
  const handleLocationToggle = (locName) => {
    const isSelected = filters.selectedLocations.includes(locName);
    const updated = isSelected
      ? filters.selectedLocations.filter((item) => item !== locName)
      : [...filters.selectedLocations, locName];

    setFilters((prev) => ({ ...prev, selectedLocations: updated }));
  };

  const handleRoomToggle = (room) => {
    const isSelected = filters.selectedRooms.includes(room);
    const updated = isSelected
      ? filters.selectedRooms.filter((item) => item !== room)
      : [...filters.selectedRooms, room];

    setFilters((prev) => ({ ...prev, selectedRooms: updated }));
  };

  const handleStatusToggle = (status) => {
    const isSelected = filters.selectedStatuses.includes(status);
    const updated = isSelected
      ? filters.selectedStatuses.filter((item) => item !== status)
      : [...filters.selectedStatuses, status];

    setFilters((prev) => ({ ...prev, selectedStatuses: updated }));
  };

  const formatPriceMini = (val) => {
    if (!val) return '';
    const num = parseInt(String(val).replace(/\D/g, ''));
    if (isNaN(num) || num === 0) return '';
    return num.toLocaleString('tr-TR') + " TL'den";
  };

  const getDropdownLabel = (type) => {
    if (type === 'location') {
      const count = filters.selectedLocations.length;
      if (count === 0) return 'İlçe / Semt seçiniz';
      if (count === 1) return filters.selectedLocations[0];
      return `${count} Bölge Seçildi`;
    }
    if (type === 'room') {
      const count = filters.selectedRooms.length;
      if (count === 0) return 'Oda sayısı seçiniz';
      if (count === 1) return filters.selectedRooms[0];
      return `${count} Oda Tipi Seçildi`;
    }
    if (type === 'status') {
      const count = filters.selectedStatuses.length;
      if (count === 0) return 'Durum seçiniz';
      if (count === 1) return filters.selectedStatuses[0];
      return `${count} Durum Seçildi`;
    }
  };

return (
    <>
      {/* 1. БАННЕР ТОЛЬКО С ЗАГОЛОВКОМ (плюсы отсюда убраны) */}
      <section className="hero">
        <div className="w">
          <h1>Doğrudan müteahhitten komisyonsuz yeni konut projeleri</h1>
        </div>
      </section>

      {/* 2. ПОИСКОВАЯ ПАНЕЛЬ */}
      <div className="pinwrap" ref={dropdownRef}>
        <div className="w">
          <div className="panel" role="search">
            
            {/* ОТСЕК 1: ЛОКАЦИЯ (ВСПЛЫВАЮЩЕЕ ОКНО .pop) */}
            <div 
              className="fld" 
              id="locBox"
              onClick={(e) => {
                e.stopPropagation();
                setActiveDropdown(activeDropdown === 'location' ? null : 'location');
              }}
            >
              <button type="button" className="locbtn" aria-expanded={activeDropdown === 'location'}>
                <small>Konum veya proje adı</small>
                <span>{getDropdownLabel('location')}</span>
              </button>

              {activeDropdown === 'location' && (
                <div className="pop" onClick={(e) => e.stopPropagation()}>
                  <input 
                    type="search" 
                    placeholder="Örn: Çankaya, Skyline" 
                    aria-label="Konum veya proje ara" 
                    autoComplete="off"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  <div className="plist">
                    {searchResults.matchedDistricts.length > 0 && (
                      <div>
                        <div className="gh">{currentCity} · İlçeler</div>
                        {searchResults.matchedDistricts.map((d) => {
                          const isChecked = filters.selectedLocations.includes(d.name);
                          return (
                            <label key={d.name} className="row" onClick={() => handleLocationToggle(d.name)}>
                              <input 
                                type="checkbox" 
                                checked={isChecked}
                                onChange={() => {}}
                              />
                              <span>{d.name}</span>
                              <em>{d.count} proje</em>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {searchResults.matchedProjects.length > 0 && (
                      <div>
                        <div className="gh">Projeler</div>
                        {searchResults.matchedProjects.map((p) => (
                          <div 
                            key={p.id} 
                            className="row"
                            onClick={() => router.push(`/properties/${p.id}`)}
                          >
                            <span>{p.testproje}</span>
                            <em>{p.district || p['İlçe/Semt']}</em>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ОТСЕК 2: ПЛАНИРОВКИ В СТРОКУ + КНОПКА + TÜMÜ С ТАБЛИЦЕЙ */}
            <div className="fld" style={{ position: 'relative' }}>
              <small>Plan (birden fazla seçilebilir)</small>
              <div className="chips" id="pl">
                {['1+1', '2+1', '3+1', '4+1', '5+1'].map((plan) => {
                  const isSelected = (filters.selectedRooms || []).includes(plan);
                  return (
                    <button
                      key={plan}
                      type="button"
                      className="chip"
                      aria-pressed={isSelected}
                      onClick={() => handleRoomToggle(plan)}
                    >
                      {plan}
                    </button>
                  );
                })}

                <button
                  type="button"
                  className="chip"
                  aria-pressed={activeDropdown === 'room' || (filters.selectedPropertyType && filters.selectedPropertyType !== 'Daire')}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDropdown(activeDropdown === 'room' ? null : 'room');
                  }}
                  title="Tüm konut tipleri ve geniş planlar"
                >
                  {filters.selectedPropertyType && filters.selectedPropertyType !== 'Daire'
                    ? filters.selectedPropertyType
                    : '+ Tümü'}
                </button>
              </div>

              {/* ПОЛНАЯ ТАБЛИЦА В ГАРМОНИИ С ДИЗАЙНОМ ПРОТОТИПА */}
              {activeDropdown === 'room' && (
                <div 
                  className="pop" 
                  style={{ width: '420px', maxWidth: '90vw', padding: '16px' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Konut ve Oda Seçimi</span>
                    <button 
                      type="button"
                      style={{ background: 'none', border: 0, fontSize: 12, color: 'var(--muted)', cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => setFilters(prev => ({ ...prev, selectedRooms: [], selectedPropertyType: 'Daire' }))}
                    >
                      Sıfırla
                    </button>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div className="chips" style={{ gap: 4 }}>
                      {[
                        { id: 'Daire', label: 'Daire' },
                        { id: 'Villa', label: 'Villa' },
                        { id: 'Penthouse', label: 'Penthouse' }
                      ].map((t) => {
                        const isSelected = (filters.selectedPropertyType || 'Daire') === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            className="chip"
                            aria-pressed={isSelected}
                            onClick={() => {
                              setFilters(prev => ({ ...prev, selectedPropertyType: t.id, selectedRooms: [] }));
                            }}
                          >
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {availableRoomsForType.salons1.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div className="gh" style={{ padding: '0 0 6px 0' }}>1 Salonlu Planlar</div>
                      <div className="chips">
                        {availableRoomsForType.salons1.map((room) => (
                          <button
                            key={room}
                            type="button"
                            className="chip"
                            aria-pressed={(filters.selectedRooms || []).includes(room)}
                            onClick={() => handleRoomToggle(room)}
                          >
                            {room}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {availableRoomsForType.salons2.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div className="gh" style={{ padding: '0 0 6px 0' }}>2 Salonlu Geniş Planlar</div>
                      <div className="chips">
                        {availableRoomsForType.salons2.map((room) => (
                          <button
                            key={room}
                            type="button"
                            className="chip"
                            aria-pressed={(filters.selectedRooms || []).includes(room)}
                            onClick={() => handleRoomToggle(room)}
                          >
                            {room}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    style={{ width: '100%', padding: '10px', background: 'var(--btn)', color: 'var(--btn-text)', border: 0, borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                    onClick={() => setActiveDropdown(null)}
                  >
                    Uygula
                  </button>
                </div>
              )}
            </div>

            {/* ОТСЕК 3: БЮДЖЕТ (ВЫПАДАЮЩИЙ СПИСОК С РЕАЛЬНЫМИ ШАГАМИ ЦЕН ОТ 2 МЛН) */}
            <div className="fld">
              <small>Bütçe</small>
              <select
                id="budget"
                aria-label="Bütçe"
                value={(() => {
                  const maxP = filters.priceRange[1];
                  const minP = filters.priceRange[0];
                  if (maxP <= 2000000) return 'a';
                  if (minP >= 2000000 && maxP <= 4000000) return 'b';
                  if (minP >= 4000000 && maxP <= 7000000) return 'c';
                  if (minP >= 7000000 && maxP <= 12000000) return 'd';
                  if (minP >= 12000000) return 'e';
                  return '';
                })()}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'a') setFilters(prev => ({ ...prev, priceRange: [0, 2000000] }));
                  else if (val === 'b') setFilters(prev => ({ ...prev, priceRange: [2000000, 4000000] }));
                  else if (val === 'c') setFilters(prev => ({ ...prev, priceRange: [4000000, 7000000] }));
                  else if (val === 'd') setFilters(prev => ({ ...prev, priceRange: [7000000, 12000000] }));
                  else if (val === 'e') setFilters(prev => ({ ...prev, priceRange: [12000000, 50000000] }));
                  else setFilters(prev => ({ ...prev, priceRange: [0, 50000000] }));
                }}
              >
                <option value="">Hepsi</option>
                <option value="a">2 milyon TL'ye kadar</option>
                <option value="b">2 – 4 milyon TL</option>
                <option value="c">4 – 7 milyon TL</option>
                <option value="d">7 – 12 milyon TL</option>
                <option value="e">12 milyon TL üstü</option>
              </select>
            </div>

          </div>
        </div>
      </div>

      {/* 3. ТРИ ПЛЮСА (УТП) ТЕПЕРЬ СТРОГО ПОД ПОИСКОВОЙ ПАНЕЛЬЮ! */}
      <div className="hero-usp-strip">
        <div className="w">
          <div className="usp-banner-row">
            <div className="usp-item">
              <div className="usp-icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="9"/>
                  <path d="M8.5 12.5l2.5 2.5 4.5-5"/>
                </svg>
              </div>
              <div className="usp-text">
                <span className="usp-title">Komisyon yok</span>
                <span className="usp-sub">Müteahhitle doğrudan görüşün</span>
              </div>
            </div>

            <div className="usp-item">
              <div className="usp-icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M3 10.5L12 3l9 7.5v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-10z"/>
                  <path d="M9 21v-7h6v7"/>
                </svg>
              </div>
              <div className="usp-text">
                <span className="usp-title">Yeni projeler</span>
                <span className="usp-sub">{currentCity}'da {properties.filter(p => (p.city || 'Ankara').toLowerCase().includes(currentCity.toLowerCase())).length || properties.length} proje listeleniyor</span>
              </div>
            </div>

            <div className="usp-item">
              <div className="usp-icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.7-5.2A8.5 8.5 0 1 1 21 12z"/>
                </svg>
              </div>
              <div className="usp-text">
                <span className="usp-title">WhatsApp ile hızlı yanıt</span>
                <span className="usp-sub">Fiyat ve planları hemen öğrenin</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
