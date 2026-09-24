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
    <section className="hero-search-container">
      <div className="search-width-limiter">
        <h1 className="mobile-only-title">Doğrudan Müteahhitten Komisyonsuz Yeni Konut Projeleri</h1>
        <h1 className="hero-search-title">Doğrudan Müteahhitten Komisyonsuz Yeni Konut Projeleri</h1>

        <div className="search-panel-card" ref={dropdownRef}>
          
          {/* ДИНАМИЧЕСКИЕ ТАБЫ ГОРОДОВ */}
          <div className="search-tabs-header">
            {availableCities.map((city) => (
              <div
                key={city.name}
                className={`city-tab-item ${currentCity === city.name ? 'active' : ''} ${!city.isAvailable ? 'disabled' : ''}`}
                onClick={() => {
                  if (city.isAvailable) {
                    handleCitySelect(city.name);
                  }
                }}
              >
                <span>{city.name} Projeleri</span>
                {!city.isAvailable ? (
                  <span className="tab-badge" style={{ backgroundColor: '#FF9800', color: '#fff', marginLeft: '6px' }}>Yakında</span>
                ) : (
                  <span className="text-[11px] font-bold text-slate-400 ml-1">({city.count})</span>
                )}
              </div>
            ))}
          </div>

          <div className="search-inputs-row-wrapper">
            <div className="search-inputs-row">
              
              {/* ПОЛЕ УМНОГО ПОИСКА: OMNIBOX */}
              <div 
                className={`search-input-field flex-wide field-trigger-location ${filters.selectedLocations.length > 0 ? 'has-value' : ''} ${activeDropdown === 'location' ? 'active-field' : ''}`}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setActiveDropdown(activeDropdown === 'location' ? null : 'location'); 
                }}
                style={{ position: 'relative' }}
              >
                <svg className="input-icon-svg icon-fill" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <div className="input-double-label">
                  <span className="sub-label">Konum veya Proje Adı</span>
                  <span className="main-label">{getDropdownLabel('location')}</span>
                </div>

                {activeDropdown === 'location' && (
                  <div 
                    className="custom-dropdown" 
                    style={{ display: 'flex', flexDirection: 'column', position: 'absolute', top: '100%', left: 0, width: '100%', minWidth: '380px', marginTop: '6px' }} 
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="dropdown-mobile-header">
                      <span className="dropdown-mobile-title">İlçe, Mahalle veya Proje Ara</span>
                      <span className="dropdown-mobile-close" onClick={() => setActiveDropdown(null)}>&times;</span>
                    </div>

                    <div className="dropdown-search-wrapper">
                      <input 
                        type="text" 
                        className="dropdown-search-input" 
                        placeholder="Örn: Çankaya, BağLife, Hürriyet..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                      />
                      <svg className="dropdown-search-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>

                    <div className="dropdown-items-scroll">
                      
                      {/* СЕКЦИЯ 1: СОВПАДЕНИЕ ПО ГОРОДУ */}
                      {searchResults.matchedCities.length > 0 && (
                        <div className="bg-slate-50/80 px-3 py-1.5 border-b border-slate-100">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Şehirler</span>
                          {searchResults.matchedCities.map((c) => (
                            <div
                              key={c.name}
                              className="dropdown-item py-2 px-2 hover:bg-white rounded-lg cursor-pointer"
                              onClick={() => {
                                handleCitySelect(c.name);
                                setActiveDropdown(null);
                              }}
                            >
                              <span className="text-base mr-2">🏙️</span>
                              <div className="dropdown-item-content">
                                <span className="dropdown-item-title">{c.name}</span>
                                <span className="dropdown-item-subtitle">{c.count} Proje listeleniyor</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* СЕКЦИЯ 2: КОНКРЕТНЫЕ ЖК (ПЕРЕХОД В ПРОЕКТ) */}
                      {searchResults.matchedProjects.length > 0 && (
                        <div className="bg-slate-50/80 px-3 py-1.5 border-b border-slate-100">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#00A4A6]">🏢 Projeler (Doğrudan İncele)</span>
                          {searchResults.matchedProjects.map((p) => (
                            <div
                              key={p.id}
                              className="dropdown-item py-2 px-2 hover:bg-white rounded-lg cursor-pointer"
                              onClick={() => router.push(`/properties/${p.id}`)}
                            >
                              <div className="dropdown-item-content">
                                <span className="dropdown-item-title font-extrabold text-slate-800">{p.testproje}</span>
                                <span className="dropdown-item-subtitle text-[11px] text-slate-500">
                                  {p.district || p['İlçe/Semt']}, {p.city || 'Ankara'} 
                                  {formatPriceMini(p.Fiyat) ? ` • ${formatPriceMini(p.Fiyat)}` : ''}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* СЕКЦИЯ 3: МИКРОРАЙОНЫ (MAHALLELER) */}
                      {searchResults.matchedMahalles.length > 0 && (
                        <div className="bg-slate-50/80 px-3 py-1.5 border-b border-slate-100">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">🏘️ Mahalleler</span>
                          {searchResults.matchedMahalles.map((m, idx) => (
                            <div
                              key={idx}
                              className="dropdown-item py-2 px-2 hover:bg-white rounded-lg cursor-pointer"
                              onClick={() => {
                                handleLocationToggle(m.district);
                                setActiveDropdown(null);
                              }}
                            >
                              <div className="dropdown-item-content">
                                <span className="dropdown-item-title">{m.mahalle}</span>
                                <span className="dropdown-item-subtitle">{m.district}, {m.city}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* СЕКЦИЯ 4: РАЙОНЫ (İLCELER) В АЛФАВИТНОМ ПОРЯДКЕ */}
                      <div className="px-3 py-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">📍 İlçeler ({currentCity})</span>
                        {searchResults.matchedDistricts.length > 0 ? (
                          searchResults.matchedDistricts.map((d) => {
                            const isExpanded = expandedDistricts.includes(d.name);
                            const hasSubAreas = d.subAreas && d.subAreas.length > 0;
                            const isDistrictSelected = filters.selectedLocations.includes(d.name);

                            return (
                              <div key={d.name} className="border-b border-slate-50 last:border-0">
                                {/* Основная строка района */}
                                <div 
                                  className={`dropdown-item flex items-center justify-between py-2 px-3 hover:bg-slate-50 cursor-pointer ${isDistrictSelected ? 'bg-teal-50/50' : ''}`}
                                  onClick={() => handleLocationToggle(d.name)}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: 'none', stroke: isDistrictSelected ? '#00A4A6' : 'currentColor', strokeWidth: 2 }}>
                                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                    </svg>
                                    <div className="flex flex-col text-left">
                                      <span className={`text-sm font-bold ${isDistrictSelected ? 'text-[#00A4A6]' : 'text-slate-700'}`}>{d.name}</span>
                                      <span className="text-[11px] text-slate-400">{d.count} Proje</span>
                                    </div>
                                  </div>

                                  {/* Стрелочка раскрытия микрорайонов */}
                                  {hasSubAreas && (
                                    <button
                                      type="button"
                                      className="p-1.5 hover:bg-slate-200/60 rounded-md transition text-slate-400 hover:text-slate-700"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedDistricts(prev => 
                                          prev.includes(d.name) ? prev.filter(x => x !== d.name) : [...prev, d.name]
                                        );
                                      }}
                                    >
                                      <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                      </svg>
                                    </button>
                                  )}
                                </div>

                                {/* Раскрывающийся микро-список махалле */}
                                {hasSubAreas && isExpanded && (
                                  <div className="pl-8 pr-3 py-1 bg-slate-50/60 space-y-1">
                                    {d.subAreas.map((sub) => {
                                      const isSubSelected = filters.selectedLocations.includes(sub.name);
                                      return (
                                        <div
                                          key={sub.name}
                                          className={`flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs cursor-pointer transition ${isSubSelected ? 'bg-[#00A4A6] text-white font-bold' : 'text-slate-600 hover:bg-white'}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleLocationToggle(sub.name);
                                          }}
                                        >
                                          <span>🏘️ {sub.name}</span>
                                          <span className={isSubSelected ? 'text-white/80' : 'text-slate-400'}>{sub.count} Proje</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-4 text-center text-xs text-slate-400">Aradığınız kriterde bölge bulunamadı.</div>
                        )}
                      </div>

                    </div>

                    <div className="dropdown-mobile-footer">
                      <button className="dropdown-sec-btn" onClick={() => setActiveDropdown(null)}>Tamam</button>
                    </div>
                  </div>
                )}
              </div>

             {/* ПОЛЕ: ТИП ЖИЛЬЯ И КОМНАТНОСТЬ */}
              <div 
                className={`search-input-field flex-standard field-trigger-room ${(filters.selectedRooms?.length > 0 || filters.selectedPropertyType) ? 'has-value' : ''} ${activeDropdown === 'room' ? 'active-field' : ''}`}
                onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === 'room' ? null : 'room'); }}
                style={{ position: 'relative' }}
              >
                <svg className="input-icon-svg icon-fill" viewBox="0 0 24 24">
                  <path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"/>
                </svg>
                <div className="input-double-label">
                  <span className="sub-label">Konut ve Oda Tipi</span>
                  <span className="main-label">
                    {(() => {
                      const typeName = filters.selectedPropertyType === 'Villa' ? 'Villa' : filters.selectedPropertyType === 'Penthouse' ? 'Penthouse' : 'Daire';
                      const count = filters.selectedRooms?.length || 0;
                      if (count === 0) return `${typeName}`;
                      if (count === 1) return `${filters.selectedRooms[0]} ${typeName}`;
                      return `${count} Plan • ${typeName}`;
                    })()}
                  </span>
                </div>

                {activeDropdown === 'room' && (
                  <div 
                    className="room-dropdown-wide p-6 bg-white shadow-2xl border border-slate-200/90 rounded-3xl" 
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      position: 'absolute', 
                      top: '100%', 
                      left: 0, 
                      width: '480px !important', 
                      minWidth: '460px !important', 
                      maxWidth: '90vw', 
                      marginTop: '12px', 
                      zIndex: 1000 
                    }} 
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* ШАПКА */}
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-5">
                      <span className="text-xs font-black tracking-wider text-slate-800 uppercase">Konut ve Oda Seçimi</span>
                      <span 
                        className="text-xs font-bold text-slate-400 hover:text-slate-800 transition cursor-pointer"
                        onClick={() => setFilters(prev => ({ ...prev, selectedRooms: [], selectedPropertyType: 'Daire' }))}
                      >
                        Sıfırla
                      </span>
                    </div>

                    {/* 1. ПЕРЕКЛЮЧАТЕЛЬ ТИПОВ ЖИЛЬЯ (БЕЗ ЭМОДЗИ, С АВТО-ОБНУЛЕНИЕМ КОМНАТ) */}
                    <div className="mb-5">
                      <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">Konut Tipi</span>
                      <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 border border-slate-200/50">
                        {[
                          { id: 'Daire', label: 'Daire & Rezidans' },
                          { id: 'Villa', label: 'Villa & Townhouse' },
                          { id: 'Penthouse', label: 'Penthouse' }
                        ].map((t) => {
                          const isSelected = (filters.selectedPropertyType || 'Daire') === t.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all text-center ${
                                isSelected 
                                  ? 'bg-white text-slate-900 shadow-sm' 
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                              style={{ border: 'none', cursor: 'pointer' }}
                              onClick={() => {
                                setFilters(prev => ({
                                  ...prev,
                                  selectedPropertyType: t.id,
                                  selectedRooms: [] // <--- ПРИ СМЕНЕ ТИПА ОБНУЛЯЕМ СПИСОК ПЛАНИРОВОК!
                                }));
                              }}
                            >
                              {t.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* ЕСЛИ ПРОЕКТОВ ЭТОГО ТИПА НЕТ В БАЗЕ */}
                    {!availableRoomsForType.hasProjects ? (
                      <div className="py-8 px-4 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 my-2">
                        <span className="text-sm font-bold text-slate-600 block mb-1">Henüz Aktif İlan Bulunmuyor</span>
                        <p className="text-xs text-slate-400 m-0">
                          {currentCity} bölgesinde şu an kayıtlı {filters.selectedPropertyType === 'Villa' ? 'villa' : 'penthouse'} projesi yer almamaktadır.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* 2. БЛОК 1 САЛОН (ТОЛЬКО РЕАЛЬНО СУЩЕСТВУЮЩИЕ КОМНАТЫ) */}
                        {availableRoomsForType.salons1.length > 0 && (
                          <div className="mb-4">
                            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">1 Salonlu Planlar</span>
                            <div className="grid grid-cols-3 gap-2">
                              {availableRoomsForType.salons1.map((room) => {
                                const isSelected = (filters.selectedRooms || []).includes(room);
                                return (
                                  <button
                                    key={room}
                                    type="button"
                                    className={`py-2 px-2 text-xs font-black rounded-xl border transition-all ${
                                      isSelected 
                                        ? 'bg-[#00A4A6] text-white border-[#00A4A6] shadow-sm' 
                                        : 'bg-slate-50 text-slate-700 border-slate-200/60 hover:bg-slate-100 hover:border-slate-300'
                                    }`}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleRoomToggle(room)}
                                  >
                                    {room}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* 3. БЛОК 2 САЛОНА (ТОЛЬКО РЕАЛЬНО СУЩЕСТВУЮЩИЕ КОМНАТЫ) */}
                        {availableRoomsForType.salons2.length > 0 && (
                          <div className="mb-5">
                            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">2 Salonlu Geniş Planlar</span>
                            <div className="grid grid-cols-3 gap-2">
                              {availableRoomsForType.salons2.map((room) => {
                                const isSelected = (filters.selectedRooms || []).includes(room);
                                return (
                                  <button
                                    key={room}
                                    type="button"
                                    className={`py-2 px-2 text-xs font-black rounded-xl border transition-all text-center ${
                                      isSelected 
                                        ? 'bg-[#00A4A6] text-white border-[#00A4A6] shadow-sm' 
                                        : 'bg-slate-50 text-slate-700 border-slate-200/60 hover:bg-slate-100 hover:border-slate-300'
                                    }`}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleRoomToggle(room)}
                                  >
                                    {room}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* КНОПКА ПРИМЕНИТЬ */}
                    <button
                      type="button"
                      className="w-full py-3 bg-[#00A4A6] hover:bg-[#00898B] text-white text-xs font-black rounded-xl transition shadow-md tracking-wider uppercase mt-2"
                      style={{ border: 'none', cursor: 'pointer' }}
                      onClick={() => setActiveDropdown(null)}
                    >
                      Uygula
                    </button>
                  </div>
                )}
              </div>

              {/* ПОЛЕ СТАТУСА ПРОЕКТА */}
              <div 
                className={`search-input-field flex-standard field-trigger-durum ${filters.selectedStatuses.length > 0 ? 'has-value' : ''} ${activeDropdown === 'status' ? 'active-field' : ''}`}
                onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === 'status' ? null : 'status'); }}
                style={{ position: 'relative' }}
              >
                <svg className="input-icon-svg icon-stroke" viewBox="0 0 24 24">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                </svg>
                <div className="input-double-label">
                  <span className="sub-label">Proje durumu</span>
                  <span className="main-label">{getDropdownLabel('status')}</span>
                </div>

                {activeDropdown === 'status' && (
                  <div className="custom-dropdown" style={{ display: 'flex', flexDirection: 'column', position: 'absolute', top: '100%', left: 0, width: '100%', minWidth: '280px', marginTop: '6px' }} onClick={(e) => e.stopPropagation()}>
                    <div className="dropdown-mobile-header">
                      <span className="dropdown-mobile-title">Proje Durumu</span>
                      <span className="dropdown-mobile-close" onClick={() => setActiveDropdown(null)}>&times;</span>
                    </div>
                    <div className="dropdown-items-scroll">
                      {uniqueStatuses.map((status) => (
                        <div 
                          key={status} 
                          className={`dropdown-item ${filters.selectedStatuses.includes(status) ? 'selected' : ''}`}
                          onClick={() => handleStatusToggle(status)}
                        >
                          <div className="dropdown-item-content">
                            <span className="dropdown-item-title">{status}</span>
                            <span className="dropdown-item-subtitle">Yapım Durumu</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="dropdown-mobile-footer">
                      <button className="dropdown-sec-btn" onClick={() => setActiveDropdown(null)}>Seç</button>
                    </div>
                  </div>
                )}
              </div>

            </div>

            <button className="search-submit-btn" onClick={onSearch}>
              Ara
            </button>
          </div>

          <div className="panel-bottom-gradient"></div>
        </div>
      </div>
    </section>
  );
}
