import React, { useState, useEffect, useMemo, useRef } from 'react'
import Head from 'next/head'
import Script from 'next/script'
import { useRouter } from 'next/router'
import { supabase } from '../supabase'

// Импортируем созданные компоненты
import Header from '../components/Header'
import Footer from '../components/Footer'
import PropertyCard from '../components/PropertyCard'

const mapProperty = (item) => {
  const f = item.fields || item
  return {
    id: item.id,
    title: f.title || f.testproje || '',
    price: f.price || f.Fiyat || 0,
    description: f.description || f["Açıklama"] || f.Aciklama || '',
    district: f.district || f["İlçe/Semt"] || '',
    rooms: f.rooms || f["card odalar"] || '',
    status: f.status || f.konutcesit || '',
    area: parseInt(f.area || f["card-area"]) || 0,
    images: f.images || f.Foto || f["Kapak Fotoğrafı"] || [],
    whatsapp: f.whatsapp || f.WhatsApp || '',
    amenities: f.amenities || f["Özellikler"] || [],
    coordinates: f.coordinates || f["Koordinat"] || '',
    kat_sayisi: parseInt(f.kat_sayisi || f["Kat Sayısı"] || f.Kat_Sayisi || f.KatSayisi) || 0,
    kredi: f.kredi || f["Kredi_Durumu"] || f.Kredi_Durumu || '',
    vade: f.vade || f["Vade_Secenegi"] || f.Vade_Secenegi || '',
    downPayment: f.downPayment || f["Ilk_Pesinat"] || f.Ilk_Pesinat || '',
  }
}

const SVGS = {
  location: <svg className="input-icon-svg icon-fill" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>,
  bed: <svg className="input-icon-svg icon-fill" viewBox="0 0 24 24"><path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"/></svg>,
  search: <svg className="dropdown-search-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  grid: <svg className="toggle-icon" viewBox="0 0 24 24"><path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"/></svg>,
  list: <svg className="toggle-icon" viewBox="0 0 24 24"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5s1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5S5.5 6.83 5.5 6S4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5s1.5-.68 1.5-1.5s-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-7v2h14V6H7z"/></svg>,
}

export default function Home({ properties, initialError }) {
  const router = useRouter()
  const { status } = router.query

  const [layout, setLayout] = useState('grid')

  // Фильтры и селекторы поиска в Hero
  const [activeHeroDropdown, setActiveHeroDropdown] = useState(null)
  const [selectedDistricts, setSelectedDistricts] = useState([])
  const [selectedRooms, setSelectedRooms] = useState([])
  const [selectedStatuses, setSelectedStatuses] = useState([])

  // Строка поиска внутри выпадающего списка районов
  const [searchDistrictQuery, setSearchDistrictQuery] = useState('')

  // Слайдеры-диапазоны Сайдбара
  const [minArea, setMinArea] = useState(0)
  const [maxArea, setMaxArea] = useState(500)
  const [minFloor, setMinFloor] = useState(0)
  const [maxFloor, setMaxFloor] = useState(40)
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(50000000)

  // Теги и Опции оплаты
  const [selectedAmenities, setSelectedAmenities] = useState([])
  const [selectedPayments, setSelectedPayments] = useState([])

  // Мобильный Сайдбар
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false)

  // Пагинация
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = useMemo(() => (layout === 'grid' ? 12 : 8), [layout])

  // Карта Яндекса
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  const mappedList = useMemo(() => properties.map(mapProperty), [properties])

  // Динамические списки опций на основе реальных данных из базы
  const districtOptions = useMemo(() => [...new Set(mappedList.map(p => p.district).filter(Boolean))].sort(), [mappedList])
  const roomOptions = useMemo(() => [...new Set(mappedList.map(p => p.rooms).filter(Boolean))].sort(), [mappedList])
  const statusOptions = useMemo(() => {
    const customOrder = ["Lansman", "Devam ediyor", "Tamamlandı"]
    const databaseStatuses = [...new Set(mappedList.map(p => p.status).filter(Boolean))]
    return customOrder.filter(v => databaseStatuses.includes(v))
  }, [mappedList])

  // Сброс фильтров
  const handleResetFilters = (initialStatus = null) => {
    setSelectedDistricts([])
    setSelectedRooms([])
    setSelectedStatuses(initialStatus ? [initialStatus] : [])
    setMinArea(0)
    setMaxArea(500)
    setMinFloor(0)
    setMaxFloor(40)
    setMinPrice(0)
    setMaxPrice(50000000)
    setSelectedAmenities([])
    setSelectedPayments([])
    setCurrentPage(1)
  }

  // Закрытие выпадающих списков по клику в пустую область экрана
  useEffect(() => {
    const handleOutsideClick = () => setActiveHeroDropdown(null)
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [])

  // Реагирование на изменение URL
  useEffect(() => {
    if (status) {
      setSelectedStatuses([status])
      setCurrentPage(1)
      const catalogEl = document.getElementById('custom-catalog-search')
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [status])

  // Фильтрация свойств
  const filteredProperties = useMemo(() => {
    return mappedList.filter(p => {
      if (selectedDistricts.length > 0 && !selectedDistricts.includes(p.district)) return false
      if (selectedRooms.length > 0 && !selectedRooms.includes(p.rooms)) return false
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(p.status)) return false
      if (p.area < minArea || p.area > maxArea) return false
      if (p.kat_sayisi < minFloor || p.kat_sayisi > maxFloor) return false
      
      const priceVal = parseInt(String(p.price).replace(/\D/g, '')) || 0
      if (priceVal < minPrice || priceVal > maxPrice) return false

      if (selectedAmenities.length > 0) {
        const pAmenities = (p.amenities || []).map(a => a.toLowerCase().replace(/ı/g,'i').replace(/ş/g,'s').replace(/ç/g,'c').trim())
        const match = selectedAmenities.every(a => pAmenities.some(pa => pa.includes(a.toLowerCase().replace(/ı/g,'i').replace(/ş/g,'s').replace(/ç/g,'c').trim())))
        if (!match) return false
      }

      if (selectedPayments.length > 0) {
        const matchPayment = selectedPayments.some(payOpt => {
          const norm = payOpt.toLowerCase()
          const hasCredit = p.kredi && p.kredi !== "" && p.kredi !== "-"
          const hasInstallment = (p.vade && p.vade !== "" && p.vade !== "-") || (p.downPayment && p.downPayment !== "" && p.downPayment !== "-")
          
          if (norm.includes("kredi")) return hasCredit
          if (norm.includes("taksit")) return hasInstallment
          if (norm.includes("peşin") || norm.includes("pesin")) return !hasInstallment
          return false
        })
        if (!matchPayment) return false
      }

      return true
    })
  }, [mappedList, selectedDistricts, selectedRooms, selectedStatuses, minArea, maxArea, minFloor, maxFloor, minPrice, maxPrice, selectedAmenities, selectedPayments])

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredProperties.slice(start, start + itemsPerPage)
  }, [filteredProperties, currentPage, itemsPerPage])

  const totalPages = useMemo(() => Math.ceil(filteredProperties.length / itemsPerPage), [filteredProperties, itemsPerPage])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setActiveHeroDropdown(null)
    setCurrentPage(1)
    const catalogEl = document.getElementById('custom-catalog-search')
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const formatPriceVal = (val) => {
    if (!val) return "";
    let numOnly = String(val).replace(/[^0-9]/g, "");
    return (numOnly === "" || numOnly === "0") ? val : Number(numOnly).toLocaleString('tr-TR') + " TL'den";
  }

  // Обновление Яндекс Карт
  const initMap = () => {
    if (typeof window !== 'undefined' && window.ymaps) {
      window.ymaps.ready(() => {
        if (!mapInstanceRef.current && mapRef.current) {
          mapInstanceRef.current = new window.ymaps.Map(mapRef.current, {
            center: [39.9334, 32.8597],
            zoom: 10,
            controls: []
          })
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.geoObjects.removeAll()
          filteredProperties.forEach(p => {
            if (p.coordinates) {
              const parts = p.coordinates.split(',')
              if (parts.length === 2) {
                const lat = parseFloat(parts[0].trim())
                const lon = parseFloat(parts[1].trim())
                if (!isNaN(lat) && !isNaN(lon)) {
                  // ИСПРАВЛЕНО: Безопасное сложение строк вместо обратных кавычек
                  const placemark = new window.ymaps.Placemark([lat, lon], {
                    balloonContentHeader: "<strong>" + p.title + "</strong>",
                    balloonContentBody: formatPriceVal(p.price),
                    hintContent: p.title
                  }, {
                    preset: 'islands#dotIcon',
                    iconColor: '#00A4A6'
                  })
                  mapInstanceRef.current.geoObjects.add(placemark)
                }
              }
            }
          })
          if (mapInstanceRef.current.geoObjects.getLength() > 0) {
            mapInstanceRef.current.setBounds(mapInstanceRef.current.geoObjects.getBounds(), {
              checkZoomRange: true,
              zoomMargin: 15
            })
          }
        }
      })
    }
  }

  useEffect(() => {
    initMap()
  }, [filteredProperties])

  const handleToggleSelect = (item, list, setList) => {
    if (list.includes(item)) {
      setList(list.filter(x => x !== item))
    } else {
      setList([...list, item])
    }
    setCurrentPage(1)
  }

  const handleSelectAll = (options, list, setList) => {
    if (list.length === options.length) {
      setList([])
    } else {
      setList([...options])
    }
    setCurrentPage(1)
  }

  const filteredDistrictOptions = useMemo(() => {
    return districtOptions.filter(opt => opt.toLowerCase().includes(searchDistrictQuery.toLowerCase()))
  }, [districtOptions, searchDistrictQuery])

  if (initialError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-center">
        <div>
          <p className="text-red-500 font-bold">Veri Yükleme Hatası</p>
          <p className="text-gray-500 text-sm mt-1">{initialError}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>LansmanBul — Агрегатор недвижимости в Анкаре</title>
        <meta name="description" content="Поиск и анализ запусков недвижимости в Анкаре напрямую от застройщиков." />
      </Head>

      <Script 
        src="https://api-maps.yandex.ru/2.1/?apikey=72709de3-d8bc-49c9-88c6-339937b3fa51&lang=tr_TR"
        strategy="afterInteractive"
        onLoad={initMap}
      />

      <div className="bg-white min-h-screen relative text-slate-800 pt-[90px] md:pt-[70px]">
        
        {/* ШАПКА */}
        <Header />

        {/* HERO ПОИСК */}
        <section id="custom-hero-search" className="hero-search-container">
          <div className="search-width-limiter">
            <h1 className="mobile-only-title">Komisyonsuz, doğrudan müteahhitten konut keşfedin!</h1>
            <h1 className="hero-search-title">Komisyonsuz, doğrudan müteahhitten konut keşfedin!</h1>
            
            <div className="search-panel-card relative">
              
              <div className="search-tabs-header">
                <div className="city-tab-item active cursor-pointer flex items-center gap-1.5">
                  {SVGS.location}
                  <span>Ankara Projeleri</span>
                </div>
                <div className="city-tab-item disabled opacity-50 flex items-center gap-1 cursor-not-allowed">
                  <span>İstanbul</span>
                  <span className="tab-badge bg-orange-100 text-orange-600">Yakında</span>
                </div>
                <div className="city-tab-item disabled opacity-50 flex items-center gap-1 cursor-not-allowed">
                  <span>İzmir</span>
                  <span className="tab-badge bg-orange-100 text-orange-600">Yakında</span>
                </div>
              </div>

              <div className="search-inputs-row-wrapper mt-4">
                <div className="search-inputs-row">
                  
                  {/* Район */}
                  <div 
                    className={`search-input-field flex-wide field-trigger-location ${activeHeroDropdown === 'location' ? 'active-field' : ''} ${selectedDistricts.length > 0 ? 'has-value' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setActiveHeroDropdown(activeHeroDropdown === 'location' ? null : 'location') }}
                  >
                    {SVGS.location}
                    <div className="input-double-label">
                      <span className="sub-label">Konum</span>
                      <span className="main-label">
                        {selectedDistricts.length === 0 ? 'İlçe / Semt seçiniz' : selectedDistricts.join(', ')}
                      </span>
                    </div>

                    {/* Выпадающий список Районов */}
                    <div 
                      className={`custom-dropdown ${activeHeroDropdown === 'location' ? 'active-desktop active-mobile-modal shadow-2xl' : ''}`}
                      data-field="İlçe/Semt"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="dropdown-mobile-header">
                        <span className="dropdown-mobile-title">İlçe / Semt seçiniz</span>
                        <span className="dropdown-mobile-close" onClick={() => setActiveHeroDropdown(null)}>&times;</span>
                      </div>
                      <div className="dropdown-search-wrapper relative">
                        <input 
                          type="text" 
                          className="dropdown-search-input" 
                          placeholder="İlçe veya Semt ara..."
                          value={searchDistrictQuery}
                          onChange={(e) => setSearchDistrictQuery(e.target.value)}
                        />
                        {SVGS.search}
                      </div>
                      <div 
                        className="dropdown-select-all flex justify-between py-1.5 px-2 hover:bg-slate-50 rounded cursor-pointer"
                        onClick={() => handleSelectAll(districtOptions, selectedDistricts, setSelectedDistricts)}
                      >
                        <span className="dropdown-select-all-text text-sm font-extrabold text-[#00A4A6]">Tümünü Seç</span>
                      </div>
                      <div className="dropdown-items-scroll">
                        {filteredDistrictOptions.map((opt, i) => (
                          <div 
                            key={i} 
                            className={`dropdown-item ${selectedDistricts.includes(opt) ? 'selected' : ''}`}
                            onClick={() => handleToggleSelect(opt, selectedDistricts, setSelectedDistricts)}
                          >
                            <div className="dropdown-item-left">
                              <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                            </div>
                            <div className="dropdown-item-content">
                              <span className="dropdown-item-title">{opt}</span>
                              <span className="dropdown-item-subtitle">Ankara, Türkiye</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="dropdown-mobile-footer">
                        <button className="dropdown-sec-btn" onClick={() => setActiveHeroDropdown(null)}>Seç</button>
                      </div>
                    </div>
                  </div>

                  {/* Комнатность */}
                  <div 
                    className={`search-input-field flex-standard field-trigger-room ${activeHeroDropdown === 'room' ? 'active-field' : ''} ${selectedRooms.length > 0 ? 'has-value' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setActiveHeroDropdown(activeHeroDropdown === 'room' ? null : 'room') }}
                  >
                    {SVGS.bed}
                    <div className="input-double-label">
                      <span className="sub-label">Oda sayısı</span>
                      <span className="main-label">
                        {selectedRooms.length === 0 ? 'Oda sayısı seçiniz' : selectedRooms.join(', ')}
                      </span>
                    </div>

                    {/* Выпадающий список комнатности */}
                    <div 
                      className={`custom-dropdown ${activeHeroDropdown === 'room' ? 'active-desktop active-mobile-modal shadow-2xl' : ''}`}
                      data-field="card odalar"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="dropdown-mobile-header">
                        <span className="dropdown-mobile-title">Oda sayısı seçiniz</span>
                        <span className="dropdown-mobile-close" onClick={() => setActiveHeroDropdown(null)}>&times;</span>
                      </div>
                      <div 
                        className="dropdown-select-all flex justify-between py-1.5 px-2 hover:bg-slate-50 rounded cursor-pointer"
                        onClick={() => handleSelectAll(roomOptions, selectedRooms, setSelectedRooms)}
                      >
                        <span className="dropdown-select-all-text text-sm font-extrabold text-[#00A4A6]">Tümünü Seç</span>
                      </div>
                      <div className="dropdown-items-scroll">
                        {roomOptions.map((opt, i) => (
                          <div 
                            key={i} 
                            className={`dropdown-item ${selectedRooms.includes(opt) ? 'selected' : ''}`}
                            onClick={() => handleToggleSelect(opt, selectedRooms, setSelectedRooms)}
                          >
                            <div className="dropdown-item-left">
                              <svg viewBox="0 0 24 24"><path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"/></svg>
                            </div>
                            <div className="dropdown-item-content">
                              <span className="dropdown-item-title">{opt}</span>
                              <span className="dropdown-item-subtitle">Oda sayısı</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="dropdown-mobile-footer">
                        <button className="dropdown-sec-btn" onClick={() => setActiveHeroDropdown(null)}>Seç</button>
                      </div>
                    </div>
                  </div>

                  {/* Статус */}
                  <div 
                    className={`search-input-field flex-standard field-trigger-durum ${activeHeroDropdown === 'status' ? 'active-field' : ''} ${selectedStatuses.length > 0 ? 'has-value' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setActiveHeroDropdown(activeHeroDropdown === 'status' ? null : 'status') }}
                  >
                    <svg className="input-icon-svg icon-stroke w-5 h-5 fill-none stroke-slate-400 stroke-[2]" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
                    <div className="input-double-label">
                      <span className="sub-label">Proje durumu</span>
                      <span className="main-label">
                        {selectedStatuses.length === 0 ? 'Durum seçiniz' : selectedStatuses.join(', ')}
                      </span>
                    </div>

                    {/* Выпадающий список статуса */}
                    <div 
                      className={`custom-dropdown ${activeHeroDropdown === 'status' ? 'active-desktop active-mobile-modal shadow-2xl' : ''}`}
                      data-field="konutcesit"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="dropdown-mobile-header">
                        <span className="dropdown-mobile-title">Durum seçiniz</span>
                        <span className="dropdown-mobile-close" onClick={() => setActiveHeroDropdown(null)}>&times;</span>
                      </div>
                      <div 
                        className="dropdown-select-all flex justify-between py-1.5 px-2 hover:bg-slate-50 rounded cursor-pointer"
                        onClick={() => handleSelectAll(statusOptions, selectedStatuses, setSelectedStatuses)}
                      >
                        <span className="dropdown-select-all-text text-sm font-extrabold text-[#00A4A6]">Tümünü Seç</span>
                      </div>
                      <div className="dropdown-items-scroll">
                        {statusOptions.map((opt, i) => (
                          <div 
                            key={i} 
                            className={`dropdown-item ${selectedStatuses.includes(opt) ? 'selected' : ''}`}
                            onClick={() => handleToggleSelect(opt, selectedStatuses, setSelectedStatuses)}
                          >
                            <div className="dropdown-item-left">
                              <svg viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
                            </div>
                            <div className="dropdown-item-content">
                              <span className="dropdown-item-title">{opt}</span>
                              <span className="dropdown-item-subtitle">Yapım Durumu</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="dropdown-mobile-footer">
                        <button className="dropdown-sec-btn" onClick={() => setActiveHeroDropdown(null)}>Seç</button>
                      </div>
                    </div>
                  </div>

                </div>

                <button onClick={handleSearchSubmit} className="search-submit-btn">
                  Ara
                </button>
              </div>

              <div className="panel-bottom-gradient"></div>
            </div>
          </div>
        </section>

        {/* СЕКЦИЯ КАТАЛОГА С ФИЛЬТРАМИ И САЙДБАРОМ */}
        <section id="custom-catalog-search" className="max-w-7xl mx-auto px-4 py-8 relative">
          
          <button className="mobile-filter-floating-btn shadow-lg md:hidden" onClick={() => setIsSidebarMobileOpen(true)}>
            <svg style={{ width: '16px', height: '16px', fill: 'currentColor' }} viewBox="0 0 24 24"><path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/></svg>
            <span>Filtreleme</span>
          </button>

          <div className={`sidebar-mobile-overlay ${isSidebarMobileOpen ? 'show' : ''}`} onClick={() => setIsSidebarMobileOpen(false)} />

          {/* САЙДБАР (С ФИЛЬТРАМИ) */}
          <aside className={`luxe-sidebar ${isSidebarMobileOpen ? 'sidebar-mobile-show' : ''}`} id="custom-sidebar">
            <span className="sidebar-mobile-close-btn" onClick={() => setIsSidebarMobileOpen(false)}>&times;</span>
            
            <div className="luxe-sidebar-scrollable-body">
              <div ref={mapRef} id="yandex-map-container" className="luxe-sidebar-map mb-4 bg-slate-100 rounded-xl" />
              
              <div className="luxe-sidebar-header flex justify-between items-center">
                <div className="luxe-sidebar-sub-count text-sm text-slate-500 font-semibold">
                  <span className="orange-count text-orange-500 font-black">{filteredProperties.length} Proje</span> Listeleniyor
                </div>
                <span onClick={() => handleResetFilters()} className="clear-filters-btn clear-link text-xs font-bold text-[#00A4A6] hover:text-[#00898B] underline cursor-pointer">
                  Temizle
                </span>
              </div>
              <div className="luxe-divider" />

              {/* МЕТРАЖ */}
              <div className="luxe-group">
                <span className="luxe-group-label c-filter__title font-bold block mb-2 text-sm">Metrekare (m²)</span>
                <div className="luxe-range-inputs-row flex gap-2 items-center">
                  <input 
                    type="number" 
                    value={minArea} 
                    onChange={(e) => { setMinArea(Math.max(0, parseInt(e.target.value) || 0)); setCurrentPage(1); }}
                    className="luxe-oval-input w-24 text-center border rounded-full py-1 text-sm font-semibold"
                  />
                  <span className="luxe-range-separator text-gray-400">—</span>
                  <input 
                    type="number" 
                    value={maxArea} 
                    onChange={(e) => { setMaxArea(Math.min(1000, parseInt(e.target.value) || 1000)); setCurrentPage(1); }}
                    className="luxe-oval-input w-24 text-center border rounded-full py-1 text-sm font-semibold"
                  />
                </div>
              </div>
              <div className="luxe-divider" />

              {/* ЭТАЖНОСТЬ */}
              <div className="luxe-group">
                <span className="luxe-group-label c-filter__title font-bold block mb-2 text-sm">Kat sayısı</span>
                <div className="luxe-range-inputs-row flex gap-2 items-center">
                  <input 
                    type="number" 
                    value={minFloor} 
                    onChange={(e) => { setMinFloor(Math.max(0, parseInt(e.target.value) || 0)); setCurrentPage(1); }}
                    className="luxe-oval-input w-24 text-center border rounded-full py-1 text-sm font-semibold"
                  />
                  <span className="luxe-range-separator text-gray-400">—</span>
                  <input 
                    type="number" 
                    value={maxFloor} 
                    onChange={(e) => { setMaxFloor(Math.min(100, parseInt(e.target.value) || 100)); setCurrentPage(1); }}
                    className="luxe-oval-input w-24 text-center border rounded-full py-1 text-sm font-semibold"
                  />
                </div>
              </div>
              <div className="luxe-divider" />

              {/* ЦЕНЫ */}
              <div className="luxe-group">
                <span className="luxe-group-label c-filter__title font-bold block mb-2 text-sm">Fiyat</span>
                <div className="price-inputs-container flex flex-col gap-3">
                  <div className="price-input-box border rounded-lg p-2 bg-slate-50 flex flex-col gap-1">
                    <span className="price-box-label text-[10px] text-slate-400 font-bold">En Düşük</span>
                    <div className="price-box-input-wrap flex justify-between items-center text-sm font-bold text-slate-600">
                      <input 
                        type="number" 
                        value={minPrice} 
                        onChange={(e) => { setMinPrice(Math.max(0, parseInt(e.target.value) || 0)); setCurrentPage(1); }}
                        className="price-box-input w-full bg-transparent outline-none"
                      />
                      <span className="price-currency">TL</span>
                    </div>
                  </div>
                  <div className="price-input-box border rounded-lg p-2 bg-slate-50 flex flex-col gap-1">
                    <span className="price-box-label text-[10px] text-slate-400 font-bold">En Yüksek</span>
                    <div className="price-box-input-wrap flex justify-between items-center text-sm font-bold text-slate-600">
                      <input 
                        type="number" 
                        value={maxPrice} 
                        onChange={(e) => { setMaxPrice(Math.max(0, parseInt(e.target.value) || 0)); setCurrentPage(1); }}
                        className="price-box-input w-full bg-transparent outline-none"
                      />
                      <span className="price-currency">TL</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="luxe-divider" />

              {/* УДОБСТВА */}
              <div className="luxe-group">
                <span className="luxe-group-label c-filter__title font-bold block mb-2 text-sm">Olanaklar</span>
                <div className="luxe-tags flex flex-wrap gap-1.5">
                  {['Havuz', 'Fitness', 'Güvenlik', 'Otopark', 'Çocuk parkı', 'Site İçerisinde', 'Spor Salonu', 'Sauna', 'Hamam', 'Oyun Parkı'].map((amenity, idx) => (
                    <div 
                      key={idx}
                      className={`luxe-tag-item ${selectedAmenities.includes(amenity) ? 'active' : ''}`}
                      onClick={() => handleToggleSelect(amenity, selectedAmenities, setSelectedAmenities)}
                    >
                      <label className="mb-0 cursor-pointer">{amenity}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="luxe-divider" />

              {/* УСЛОВИЯ ОПЛАТЫ */}
              <div className="luxe-group">
                <span className="luxe-group-label c-filter__title font-bold block mb-2 text-sm">Ödeme durumu</span>
                <div className="luxe-checkboxes flex flex-col gap-2">
                  {['Krediye uygun', 'Taksit imkanı', 'Peşin'].map((payType, idx) => (
                    <div 
                      key={idx}
                      className={`luxe-checkbox-item flex items-center gap-2 cursor-pointer ${selectedPayments.includes(payType) ? 'checked' : ''}`}
                      onClick={() => handleToggleSelect(payType, selectedPayments, setSelectedPayments)}
                    >
                      <div className="luxe-radio-dot" />
                      <label className="mb-0 cursor-pointer">{payType}</label>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="luxe-sidebar-mobile-footer md:hidden flex gap-2 p-4 border-t bg-white">
              <button onClick={() => setIsSidebarMobileOpen(false)} className="showList c-button c-button--primary flex-1 py-3 bg-[#00A4A6] text-white rounded-lg font-bold text-center text-sm">
                {filteredProperties.length} Sonucu Göster
              </button>
              <button onClick={() => handleResetFilters()} className="c-button c-button--transparent px-4 border rounded-lg font-bold text-sm">
                Temizle
              </button>
            </div>
          </aside>

          {/* КОНТЕНТ С КАРТОЧКАМИ */}
          <div id="catalog-content-wrapper">
            
            <div className="catalog-control-bar flex justify-end gap-2 mb-6 pb-3 border-b">
              <div className="layout-toggle bg-slate-100 p-1 rounded-lg flex">
                <button 
                  onClick={() => { setLayout('grid'); setCurrentPage(1); }} 
                  className={`toggle-btn p-2 rounded-md transition ${layout === 'grid' ? 'active bg-white shadow-sm text-[#00A4A6]' : 'text-slate-400'}`}
                >
                  {SVGS.grid}
                </button>
                <button 
                  onClick={() => { setLayout('list'); setCurrentPage(1); }} 
                  className={`toggle-btn p-2 rounded-md transition ${layout === 'list' ? 'active bg-white shadow-sm text-[#00A4A6]' : 'text-slate-400'}`}
                >
                  {SVGS.list}
                </button>
              </div>
            </div>

            {/* СПИСОК КАРТОЧЕК */}
            <div id="catalog-list" className={layout === 'grid' ? 'grid-layout' : 'list-layout'}>
              {pageItems.length > 0 ? (
                pageItems.map((property) => (
                  <PropertyCard 
                    key={property.id} 
                    property={property} 
                    layout={layout}
                  />
                ))
              ) : (
                <div className="text-center py-20 text-gray-400 font-bold text-lg col-span-3">
                  Aramanıza uygun sonuç bulunamadı.
                </div>
              )}
            </div>

            {/* ПАГИНАЦИЯ */}
            {totalPages > 1 && (
              <div className="pagination-container flex justify-center gap-2 mt-8">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => { setCurrentPage(prev => Math.max(1, prev - 1)); window.scrollTo({ top: 380, behavior: 'smooth' }) }}
                  className={`pagination-item px-3 border rounded text-sm font-bold ${currentPage === 1 ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  ❮
                </button>
                
                {[...Array(totalPages)].map((_, idx) => (
                  <button 
                    key={idx}
                    onClick={() => { setCurrentPage(idx + 1); window.scrollTo({ top: 380, behavior: 'smooth' }) }}
                    className={`pagination-item w-10 h-10 flex items-center justify-center border rounded text-sm font-bold transition ${currentPage === idx + 1 ? 'active bg-[#00A4A6] text-white border-[#00A4A6]' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    {idx + 1}
                  </button>
                ))}

                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => { setCurrentPage(prev => Math.min(totalPages, prev + 1)); window.scrollTo({ top: 380, behavior: 'smooth' }) }}
                  className={`pagination-item px-3 border rounded text-sm font-bold ${currentPage === totalPages ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  ❯
                </button>
              </div>
            )}

            {/* О ПРОЕКТЕ (ABOUT US) */}
            <div id="about-us-container" className="mt-16">
              <section className="v1-section">
                <div className="v1-intro text-center max-w-3xl mx-auto mb-10">
                  <span className="v1-badge">Aracısız • Komisyonsuz • Doğrudan</span>
                  <h2 className="v1-title text-3xl font-black text-[#3F536C] mt-2">
                    LansmanBul ile <span>Yeni Nesil</span> Konut Keşfi
                  </h2>
                  <p className="v1-desc text-slate-500 text-sm mt-3 leading-relaxed">
                    Türkiye'nin önde gelen inşaat firmalarını tek platformда topladık. Klasik emlakçı süreçlerini tamamen devre dışı bırakarak hayalinizdeki eve doğrudan, güvenle ulaşmanızı sağlıyoruz.
                  </p>
                </div>

                <div className="v1-grid grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  <div className="v1-card">
                    <div className="v1-icon-box">
                      <svg viewBox="0 0 24 24" className="w-7 h-7"><line x1="19" y1="5" x2="5" y2="19"></line><circle cx="6.5" cy="6.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle></svg>
                    </div>
                    <h3 className="v1-card-title">%0 Emlakçı Komisyonu</h3>
                    <p className="v1-card-desc">Sıfır aracı, sıfır komisyon. Satın alım bütçenizin tek bir kuruşu bile emlakçı komisyonuna gitmez, doğrudan kendi yatırımınızda kalır.</p>
                  </div>
                  
                  <div className="v1-card">
                    <div className="v1-icon-box">
                      <svg viewBox="0 0 24 24" className="w-7 h-7"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    </div>
                    <h3 className="v1-card-title">Müteahhitle Birebir İletişim</h3>
                    <p className="v1-card-desc">Hiçbir engel yok. Tek tıkla doğrudan inşaat projesinin resmi temsilcisine bağlanır, tüm teknik ve mali detayları birinci elden öğrenirsiniz.</p>
                  </div>

                  <div className="v1-card">
                    <div className="v1-icon-box">
                      <svg viewBox="0 0 24 24" className="w-7 h-7"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    </div>
                    <h3 className="v1-card-title">Referanslı İnşaat Firmaları</h3>
                    <p className="v1-card-desc">Güvenliğiniz önceliğimizdir. Platformumuzda sadece rüştünü ispatlamış, geçmişte başarılı projeler tamamlamış ve güçlü referanslara sahip olan güvenilir inşaat firmalarının projelerine yer veriyoruz.</p>
                  </div>
                </div>

                <div className="v1-footer-panel flex flex-col md:flex-row items-center justify-between p-6 bg-white border border-dashed rounded-3xl gap-4">
                  <div className="v1-footer-text">
                    <h4 className="font-extrabold text-[#3F536C] text-lg">Doğrudan rehberliğe mi ihtiyacınız var?</h4>
                    <p className="text-slate-400 text-sm">Hangi projenin bütçenize en uygun olduğuna karar veremediyseniz, doğrudan bizimle iletişime geçebilirsiniz.</p>
                  </div>
                  <a href="https://wa.me/905459418536" target="_blank" rel="noopener noreferrer" className="kb-btn kb-btn-wa">
                    <svg className="wa-icon-svg w-5 h-5 fill-current text-white inline-block mr-1" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.156 5.156 0 11.487 0c3.067.001 5.95 1.196 8.114 3.363 2.164 2.167 3.357 5.053 3.355 8.12-.003 6.325-5.157 11.48-11.485 11.48-1.999-.001-3.968-.521-5.71-1.513L0 24zm6.59-4.846c1.642.975 3.251 1.489 4.84 1.49 4.996 0 9.06-4.061 9.062-9.058 0-2.42-1.014-4.701-2.731-6.418C16.035 3.45 13.84 2.502 11.487 2.502 6.49 2.502 2.428 6.564 2.426 11.56c-.001 1.638.484 3.235 1.401 4.7l-.955 3.486 3.575-.937z" /></svg>
                    Bize WhatsApp'tan Ulaşın
                  </a>
                </div>
              </section>
            </div>

          </div>
        </section>

        {/* ПОДВАЛ */}
        <Footer />

      </div>

      {/* ОРИГИНАЛЬНЫЙ CSS С ПЛАТФОРМЫ TILDA С ПОЛНОЙ АДАПТИВНОСТЬЮ И СЕТКАМИ */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --primary: #00A4A6;
          --primary-hover: #00898B;
          --dark-slate: #1E293B;
          --text-main: #334155;
          --text-muted: #64748B;
          --border-soft: #CBD5E1;
          --bg-light: #F1F5F9;
          --shadow-premium: 0 10px 30px rgba(0, 164, 166, 0.06), 0 1px 3px rgba(0, 0, 0, 0.02);
          --shadow-dropdown: 0 12px 32px rgba(15, 23, 42, 0.18);
          --primary-light: rgba(0, 164, 166, 0.06);
          --radius-bubble: 36px;
        }

        body, html {
          font-family: 'Mulish', sans-serif !important;
          background-color: #ffffff;
          overflow-x: hidden !important;
          width: 100% !important;
        }

        @media (min-width: 1025px) {
          #custom-catalog-search {
            display: flex !important;
            flex-direction: row !important;
            gap: 30px !important;
            align-items: flex-start !important;
            position: relative !important;
          }
          .luxe-sidebar {
            position: sticky !important;
            top: 110px !important;
            left: auto !important;
            margin: 0 !important;
            flex-shrink: 0 !important;
            width: 310px !important;
            display: block !important;
            box-sizing: border-box !important;
            background: #fff !important;
            border: 1.5px solid var(--border-soft) !important;
            border-radius: 24px !important;
            padding: 24px !important;
            box-shadow: var(--shadow-premium) !important;
          }
          #catalog-content-wrapper {
            margin-left: 0 !important;
            flex-grow: 1 !important;
            width: auto !important;
          }
        }

        @media (min-width: 1025px) {
          .search-panel-card, 
          .search-inputs-row-wrapper, 
          .search-inputs-row {
            overflow: visible !important;
            position: relative !important;
          }
          .custom-dropdown.active-desktop {
            display: block !important;
            position: absolute !important;
            top: 65px !important;
            left: 0 !important;
            width: 100% !important;
            z-index: 1000000 !important;
          }
        }

        @media (max-width: 1024px) {
          .custom-dropdown {
            position: fixed !important;
            bottom: 0 !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            height: 100vh !important;
            border-radius: 0 !important;
            box-shadow: 0 -10px 40px rgba(15,23,42,0.15) !important;
            z-index: 100000005 !important;
            display: none;
            flex-direction: column !important;
            background-color: #fff !important;
            border: none !important;
            transform: translateY(100%);
            transition: transform .3s cubic-bezier(.16,1,.3,1) !important;
          }
          .custom-dropdown.active-mobile-modal {
            display: flex !important;
            transform: translateY(0) !important;
          }
        }

        .hero-search-container {
          width: 100%;
          padding: 125px 20px 25px 20px;
          background-color: var(--bg-light);
          display: flex;
          justify-content: center;
          box-sizing: border-box;
        }
        .search-width-limiter {
          width: 100%;
          max-width: 1140px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .hero-search-title {
          font-size: 36px;
          font-weight: 900;
          color: #3F536C;
          margin: 0 0 25px 0;
          line-height: 1.3;
          text-align: center;
        }
        .search-panel-card {
          width: 100%;
          background-color: #fff;
          border-radius: 20px;
          border: 1px solid var(--border-soft);
          box-shadow: var(--shadow-premium);
          padding: 24px 30px 32px 30px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          box-sizing: border-box;
        }
        .search-tabs-header {
          display: flex;
          gap: 24px;
          border-bottom: 1px solid var(--border-soft);
          padding-bottom: 12px;
          margin-bottom: 4px;
        }
        .city-tab-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 800;
          color: var(--text-muted);
          cursor: pointer;
          position: relative;
          padding-bottom: 12px;
          margin-bottom: -13px;
          transition: color .2s ease;
        }
        .city-tab-item.active {
          color: var(--primary);
        }
        .city-tab-item.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background-color: var(--primary);
          border-radius: 3px 3px 0 0;
        }
        .search-inputs-row-wrapper {
          display: flex;
          gap: 16px;
          width: 100%;
          align-items: center;
        }
        .search-inputs-row {
          display: flex;
          gap: 16px;
          align-items: center;
          flex: 1;
        }
        .search-input-field {
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1.5px solid var(--border-soft);
          border-radius: 10px;
          height: 60px;
          padding: 0 16px;
          background-color: #F8FAFC;
          transition: border-color .2s, background-color .2s, box-shadow .2s;
          cursor: pointer;
          user-select: none;
          box-sizing: border-box;
        }
        .search-input-field:hover, .search-input-field.active-field {
          border-color: var(--primary) !important;
          background-color: #fff !important;
          box-shadow: 0 10px 25px rgba(0, 164, 166, 0.08) !important;
        }
        .search-input-field.flex-wide { flex: 1.5 !important; }
        .search-input-field.flex-standard { flex: 1 !important; }

        .input-double-label {
          display: flex;
          flex-direction: column;
          gap: 2px;
          text-align: left;
          overflow: hidden;
          width: 100%;
        }
        .input-double-label .sub-label {
          font-size: 11px;
          font-weight: 800;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: .5px;
        }
        .input-double-label .main-label {
          font-size: 16px;
          font-weight: 800;
          color: #3F536C;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .search-submit-btn {
          background-color: var(--primary);
          color: #fff;
          border: none;
          height: 60px;
          padding: 0 40px;
          border-radius: 30px;
          font-size: 18px;
          font-weight: 800;
          cursor: pointer;
          transition: background-color .2s, transform .1s, box-shadow .2s;
          flex-shrink: 0;
          box-shadow: 0 4px 14px rgba(0, 164, 166, 0.2);
        }
        .search-submit-btn:hover {
          background-color: var(--primary-hover);
        }

        .custom-dropdown {
          background-color: #fff;
          border: 1px solid var(--border-soft);
          border-radius: 12px;
          box-shadow: var(--shadow-dropdown);
          box-sizing: border-box;
          display: none;
        }
        .dropdown-mobile-header {
          display: none;
        }
        .dropdown-search-wrapper {
          padding: 12px;
          border-bottom: 1px solid var(--border-soft);
          position: relative;
        }
        .dropdown-search-input {
          width: 100%;
          height: 40px;
          border: 1px solid var(--border-soft);
          border-radius: 8px;
          padding: 0 12px 0 40px;
          font-size: 14px;
          outline: none;
        }
        .dropdown-select-all {
          padding: 10px 16px;
          border-bottom: 1px solid var(--border-soft);
          cursor: pointer;
        }
        .dropdown-select-all-text {
          font-size: 12px;
          font-weight: 800;
          color: var(--primary);
        }
        .dropdown-items-scroll {
          max-height: 240px;
          overflow-y: auto;
        }
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          cursor: pointer;
          border-bottom: 1px solid #F1F5F9;
        }
        .dropdown-item:hover, .dropdown-item.selected {
          background-color: #F8FAFC;
        }
        .dropdown-item-left svg {
          width: 18px;
          height: 18px;
          fill: var(--text-muted);
        }
        .dropdown-item.selected .dropdown-item-left svg {
          fill: var(--primary);
        }
        .dropdown-item-content {
          display: flex;
          flex-direction: column;
          text-align: left;
        }
        .dropdown-item-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--dark-slate);
        }
        .dropdown-item-subtitle {
          font-size: 11px;
          color: var(--text-muted);
        }
        .dropdown-mobile-footer {
          display: none;
        }

        /* GRID / LIST */
        .grid-layout {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 30px;
          width: 100%;
        }
        .grid-layout .custom-card {
          background: #fff;
          border-radius: 16px;
          border: 1.5px solid var(--border-soft);
          overflow: hidden;
          box-shadow: var(--shadow-premium);
          display: flex;
          flex-direction: column;
          transition: transform .3s ease, box-shadow .3s ease;
          height: 100%;
        }
        .grid-layout .custom-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 25px rgba(0, 164, 166, 0.45) !important;
        }

        .list-layout {
          display: flex;
          flex-direction: column;
          gap: 24px;
          width: 100%;
        }
        .list-layout .custom-card {
          background: #fff;
          border-radius: 16px;
          border: 1.5px solid var(--border-soft);
          overflow: hidden;
          box-shadow: var(--shadow-premium);
          display: flex;
          flex-direction: row;
          transition: transform .3s ease, box-shadow .3s ease;
          width: 100%;
        }

        .v1-section {
          background-color: var(--bg-light);
          border-radius: var(--radius-bubble);
          padding: 70px 50px;
          box-shadow: var(--shadow-premium);
          border: 1.5px solid var(--border-soft);
        }
        .v1-badge {
          color: var(--primary);
          font-weight: 900;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 2px;
          display: inline-block;
          background-color: rgba(0, 164, 166, .06);
          padding: 6px 18px;
          border-radius: 30px;
          margin-bottom: 15px;
        }
        .v1-card {
          background-color: #fff;
          border: 1.5px solid var(--border-soft);
          border-radius: var(--radius-bubble);
          padding: 40px 30px;
        }
        .v1-icon-box {
          width: 64px;
          height: 64px;
          background-color: var(--bg-light);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          margin-bottom: 25px;
        }

        @media (max-width: 1024px) {
          .modern-header {
            height: 70px !important;
          }
          .modern-logo .logo-text { font-size: 18px !important; }
          .hero-search-title { display: none !important; }
          .mobile-only-title {
            display: block !important;
            font-size: 20px !important;
            font-weight: 800 !important;
            color: #ffffff !important;
            text-align: center;
            margin-bottom: 20px;
          }
          .hero-search-container {
            padding: 110px 20px 24px 20px !important;
            background: linear-gradient(180deg, #00A4A6 0%, #062228 100%) !important;
          }
          .search-tabs-header {
            justify-content: center !important;
            gap: 8px !important;
            margin-bottom: 16px !important;
            border-bottom: none !important;
            padding-bottom: 0 !important;
          }
          .city-tab-item {
            padding: 8px 16px !important;
            border-radius: 20px !important;
            background-color: rgba(255,255,255,0.12) !important;
            color: #fff !important;
            font-size: 14px !important;
            font-weight: 800 !important;
            margin-bottom: 0 !important;
          }
          .city-tab-item.active {
            background-color: #fff !important;
            color: var(--primary) !important;
          }
          .city-tab-item.active::after { display: none !important; }
          .city-tab-item.disabled { display: none !important; }

          .search-panel-card {
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
            padding: 0 !important;
          }
          .search-inputs-row-wrapper {
            flex-direction: column !important;
            gap: 12px !important;
          }
          .search-inputs-row {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            grid-template-rows: auto auto !important;
            gap: 0 !important;
            border: 1px solid var(--border-soft) !important;
            border-radius: 16px !important;
            overflow: hidden !important;
            background-color: #fff !important;
            width: 368px !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            margin: 0 auto !important;
          }
          .search-input-field {
            background-color: #fff !important;
            border: none !important;
            border-radius: 0 !important;
            height: 44px !important;
            padding: 0 12px !important;
            width: 100% !important;
            box-shadow: none !important;
          }
          .field-trigger-location {
            grid-column: span 2 !important;
            border-bottom: 1px solid var(--border-soft) !important;
          }
          .field-trigger-room {
            grid-column: span 1 !important;
            border-right: 1px solid var(--border-soft) !important;
          }
          .field-trigger-durum {
            grid-column: span 1 !important;
          }

          .input-double-label {
            position: relative !important;
            height: 100% !important;
          }
          .input-double-label .sub-label {
            position: absolute !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
            font-size: 15px !important;
            text-transform: none !important;
            font-weight: 600 !important;
            transition: opacity 0.25s ease !important;
          }
          .input-double-label .main-label {
            position: absolute !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
            font-size: 15px !important;
            font-weight: 700 !important;
            opacity: 0 !important;
            transition: opacity 0.25s ease !important;
          }
          .search-input-field.has-value .input-double-label .sub-label {
            opacity: 0 !important;
          }
          .search-input-field.has-value .input-double-label .main-label {
            opacity: 1 !important;
          }

          .search-submit-btn {
            width: 368px !important;
            max-width: 100% !important;
            height: 48px !important;
            margin-top: 12px !important;
            border-radius: 12px !important;
          }

          .luxe-sidebar {
            position: fixed !important;
            top: 0 !important;
            left: -320px !important;
            width: 300px !important;
            height: 100% !important;
            border-radius: 0 24px 24px 0 !important;
            z-index: 100000000 !important;
            box-shadow: 10px 0 30px rgba(15, 23, 42, .15) !important;
            display: flex !important;
            flex-direction: column !important;
            overflow: hidden !important;
            padding: 0 !important;
            transition: left .3s ease !important;
          }
          .luxe-sidebar.sidebar-mobile-show {
            left: 0 !important;
          }
          .mobile-filter-floating-btn {
            display: flex !important;
          }
          #catalog-content-wrapper {
            margin-left: 0 !important;
          }
        }
      `}} />
    </>
  )
}

export async function getServerSideProps() {
  try {
    const { data: properties, error } = await supabase
      .from('properties')
      .select('*')
      .order('id', { ascending: false })

    if (error) throw error

    return {
      props: {
        properties: properties || [],
        initialError: null,
      },
    }
  } catch (err) {
    console.error('❌ Supabase Veri Cekme Hatasi:', err.message)
    return {
      props: {
        properties: [],
        initialError: err.message || 'Supabase connection failed',
      },
    }
  }
}
