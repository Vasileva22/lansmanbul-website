import { useState, useEffect, useRef } from 'react';

export default function HeroSearch({
  filters,
  setFilters,
  uniqueLocations,
  uniqueRooms,
  uniqueStatuses,
  onSearch,
}) {
  // Активные выпадающие списки (десктоп/мобильный)
  const [activeDropdown, setActiveDropdown] = useState(null); // 'location', 'room', 'status', 'city'
  const [searchQuery, setSearchQuery] = useState('');
  
  const dropdownRef = useRef(null);

  // Закрываем выпадающие списки при клике за их пределами на десктопе
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Блокируем скролл страницы на мобилках, если открыта модалка выпадающего списка
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

  // Обработчик выбора конкретного района
  const handleLocationToggle = (loc) => {
    const isSelected = filters.selectedLocations.includes(loc);
    const updated = isSelected
      ? filters.selectedLocations.filter((item) => item !== loc)
      : [...filters.selectedLocations, loc];
    
    setFilters((prev) => ({ ...prev, selectedLocations: updated }));
  };

  // Обработчик выбора комнат
  const handleRoomToggle = (room) => {
    const isSelected = filters.selectedRooms.includes(room);
    const updated = isSelected
      ? filters.selectedRooms.filter((item) => item !== room)
      : [...filters.selectedRooms, room];

    setFilters((prev) => ({ ...prev, selectedRooms: updated }));
  };

  // Обработчик выбора статуса проекта
  const handleStatusToggle = (status) => {
    const isSelected = filters.selectedStatuses.includes(status);
    const updated = isSelected
      ? filters.selectedStatuses.filter((item) => item !== status)
      : [...filters.selectedStatuses, status];

    setFilters((prev) => ({ ...prev, selectedStatuses: updated }));
  };

  // Метод получения текста для кнопки (например, "3 Bölge Seçildi")
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
        <h1 className="mobile-only-title">Komisyonsuz, doğrudan müteahhitten konut keşfedin!</h1>
        <h1 className="hero-search-title">Komisyonsuz, doğrudan müteahhitten konut keşfedin!</h1>

        <div className="search-panel-card" ref={dropdownRef}>
          {/* СЕЛЕКТОР ГОРОДОВ */}
          <div className="search-tabs-header">
            <div 
              className={`city-tab-item ${activeDropdown === 'city' ? 'active' : ''}`}
              onClick={() => setActiveDropdown(activeDropdown === 'city' ? null : 'city')}
            >
              <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: 'currentColor' }}>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <span>Ankara Projeleri</span>
              <svg viewBox="0 0 24 24" style={{ width: 12, height: 12, fill: 'none', stroke: 'currentColor', strokeWidth: 3, marginLeft: 4 }}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>

            <div className="city-tab-item disabled">
              <span>İstanbul</span>
              <span className="tab-badge">Yakında</span>
            </div>
            <div className="city-tab-item disabled">
              <span>İzmir</span>
              <span className="tab-badge">Yakında</span>
            </div>
          </div>

          {/* ПОЛЯ ВВОДА ДЛЯ ФИЛЬТРАЦИИ */}
          <div className="search-inputs-row-wrapper">
            <div className="search-inputs-row">
              
              {/* Район (Location) */}
              <div 
                className={`search-input-field flex-wide field-trigger-location ${filters.selectedLocations.length > 0 ? 'has-value' : ''} ${activeDropdown === 'location' ? 'active-field' : ''}`}
                onClick={() => { setActiveDropdown(activeDropdown === 'location' ? null : 'location'); setSearchQuery(''); }}
              >
                <svg className="input-icon-svg icon-fill" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <div className="input-double-label">
                  <span className="sub-label">Konum</span>
                  <span className="main-label">{getDropdownLabel('location')}</span>
                </div>
              </div>

              {/* Комнаты (Rooms) */}
              <div 
                className={`search-input-field flex-standard field-trigger-room ${filters.selectedRooms.length > 0 ? 'has-value' : ''} ${activeDropdown === 'room' ? 'active-field' : ''}`}
                onClick={() => setActiveDropdown(activeDropdown === 'room' ? null : 'room')}
              >
                <svg className="input-icon-svg icon-fill" viewBox="0 0 24 24">
                  <path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"/>
                </svg>
                <div className="input-double-label">
                  <span className="sub-label">Oda sayısı</span>
                  <span className="main-label">{getDropdownLabel('room')}</span>
                </div>
              </div>

              {/* Статус проекта (Status) */}
              <div 
                className={`search-input-field flex-standard field-trigger-durum ${filters.selectedStatuses.length > 0 ? 'has-value' : ''} ${activeDropdown === 'status' ? 'active-field' : ''}`}
                onClick={() => setActiveDropdown(activeDropdown === 'status' ? null : 'status')}
              >
                <svg className="input-icon-svg icon-stroke" viewBox="0 0 24 24">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                </svg>
                <div className="input-double-label">
                  <span className="sub-label">Proje durumu</span>
                  <span className="main-label">{getDropdownLabel('status')}</span>
                </div>
              </div>

            </div>

            <button className="search-submit-btn" onClick={onSearch}>
              Ara
            </button>
          </div>

          <div className="panel-bottom-gradient"></div>
        </div>
      </div>

      {/* ==========================================================================
         РЕАКТИВНЫЕ ВЫПАДАЮЩИЕ СПИСКИ (DROPDOWNS)
         ========================================================================== */}

      {/* Выпадающий список выбора ГОРОДОВ */}
      {activeDropdown === 'city' && (
        <div className="custom-dropdown active-mobile-modal" style={{ display: 'flex' }}>
          <div className="dropdown-mobile-header">
            <span className="dropdown-mobile-title">Şehir Seçiniz</span>
            <span className="dropdown-mobile-close" onClick={() => setActiveDropdown(null)}>&times;</span>
          </div>
          <div className="dropdown-items-scroll">
            <div className="dropdown-item selected">
              <div className="dropdown-item-left">
                <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: 'none', stroke: 'currentColor', strokeWidth: 2 }}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
              </div>
              <div className="dropdown-item-content">
                <span className="dropdown-item-title">Ankara</span>
                <span className="dropdown-item-subtitle">Aktif Projeler</span>
              </div>
            </div>
            {['İstanbul', 'İzmir'].map((city) => (
              <div key={city} className="dropdown-item city-yakinda" style={{ opacity: 0.75 }} onClick={() => alert(`${city} projelerimiz çok yakında sizlerle!`)}>
                <div className="dropdown-item-left">
                  <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: 'none', stroke: 'currentColor', strokeWidth: 2 }}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
                </div>
                <div className="dropdown-item-content">
                  <span className="dropdown-item-title">{city} <span className="tab-badge" style={{ backgroundColor: '#FF9800', color: '#fff' }}>Yakında</span></span>
                  <span className="dropdown-item-subtitle">Çok yakında hizmetinizde</span>
                </div>
              </div>
            ))}
          </div>
          <div className="dropdown-mobile-footer">
            <button className="dropdown-sec-btn" onClick={() => setActiveDropdown(null)}>Kapat</button>
          </div>
        </div>
      )}

      {/* Выпадающий список выбора РАЙОНА */}
      {activeDropdown === 'location' && (
        <div className="custom-dropdown active-mobile-modal" style={{ display: 'flex' }}>
          <div className="dropdown-mobile-header">
            <span className="dropdown-mobile-title">Konum Seçiniz</span>
            <span className="dropdown-mobile-close" onClick={() => setActiveDropdown(null)}>&times;</span>
          </div>
          <div className="dropdown-search-wrapper">
            <input 
              type="text" 
              className="dropdown-search-input" 
              placeholder="İlçe veya Semt ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg className="dropdown-search-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
          <div className="dropdown-items-scroll">
            {uniqueLocations
              .filter(loc => loc.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((loc) => (
                <div 
                  key={loc} 
                  className={`dropdown-item ${filters.selectedLocations.includes(loc) ? 'selected' : ''}`}
                  onClick={() => handleLocationToggle(loc)}
                >
                  <div className="dropdown-item-left">
                    <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: 'none', stroke: 'currentColor', strokeWidth: 2 }}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
                  </div>
                  <div className="dropdown-item-content">
                    <span className="dropdown-item-title">{loc}</span>
                    <span className="dropdown-item-subtitle">Ankara, Türkiye</span>
                  </div>
                </div>
              ))}
          </div>
          <div className="dropdown-mobile-footer">
            <button className="dropdown-sec-btn" onClick={() => setActiveDropdown(null)}>Seç</button>
          </div>
        </div>
      )}

      {/* Выпадающий список выбора КОЛИЧЕСТВА КОМНАТ */}
      {activeDropdown === 'room' && (
        <div className="custom-dropdown active-mobile-modal" style={{ display: 'flex' }}>
          <div className="dropdown-mobile-header">
            <span className="dropdown-mobile-title">Oda Sayısı</span>
            <span className="dropdown-mobile-close" onClick={() => setActiveDropdown(null)}>&times;</span>
          </div>
          <div className="dropdown-items-scroll">
            {uniqueRooms.map((room) => (
              <div 
                key={room} 
                className={`dropdown-item ${filters.selectedRooms.includes(room) ? 'selected' : ''}`}
                onClick={() => handleRoomToggle(room)}
              >
                <div className="dropdown-item-left">
                  <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: 'none', stroke: 'currentColor', strokeWidth: 2 }}><path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"/></svg>
                </div>
                <div className="dropdown-item-content">
                  <span className="dropdown-item-title">{room}</span>
                  <span className="dropdown-item-subtitle">Oda Tipi ve Planı</span>
                </div>
              </div>
            ))}
          </div>
          <div className="dropdown-mobile-footer">
            <button className="dropdown-sec-btn" onClick={() => setActiveDropdown(null)}>Seç</button>
          </div>
        </div>
      )}

      {/* Выпадающий список выбора СТАТУСА ПРОЕКТА */}
      {activeDropdown === 'status' && (
        <div className="custom-dropdown active-mobile-modal" style={{ display: 'flex' }}>
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
                <div className="dropdown-item-left">
                  <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: 'none', stroke: 'currentColor', strokeWidth: 2 }}><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
                </div>
                <div className="dropdown-item-content">
                  <span className="dropdown-item-title">{status}</span>
                  <span className="dropdown-item-subtitle">Proje Yapım Durumu</span>
                </div>
              </div>
            ))}
          </div>
          <div className="dropdown-mobile-footer">
            <button className="dropdown-sec-btn" onClick={() => setActiveDropdown(null)}>Seç</button>
          </div>
        </div>
      )}
    </section>
  );
}
