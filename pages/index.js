import React, { useState, useEffect, useMemo, useRef } from 'react'
import Head from 'next/head'
import Script from 'next/script'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'

// Импортируем созданные компоненты
import Header from '../components/Header'
import Footer from '../components/Footer'
import PropertyCard from '../components/PropertyCard'

// Адаптер сопоставления полей из Supabase (для совместимости)
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
  location: <svg className="input-icon-svg icon-fill w-4 h-4 inline-block mr-1 align-middle" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>,
  bed: <svg className="input-icon-svg icon-fill w-4 h-4 inline-block mr-1 align-middle" viewBox="0 0 24 24"><path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"/></svg>,
  grid: <svg className="toggle-icon w-[18px] h-[18px] fill-current" viewBox="0 0 24 24"><path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"/></svg>,
  list: <svg className="toggle-icon w-[18px] h-[18px] fill-current" viewBox="0 0 24 24"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5s1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5S5.5 6.83 5.5 6S4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5s1.5-.68 1.5-1.5s-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-7v2h14V6H7z"/></svg>,
  arrowRight: <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
}

export default function Home({ properties, initialError }) {
  const router = useRouter()
  const { status } = router.query

  // Настройки отображения
  const [layout, setLayout] = useState('grid')

  // Фильтры и селекторы
  const [activeHeroDropdown, setActiveHeroDropdown] = useState(null)
  const [selectedDistricts, setSelectedDistricts] = useState([])
  const [selectedRooms, setSelectedRooms] = useState([])
  const [selectedStatuses, setSelectedStatuses] = useState([])

  // Слайдеры-диапазоны Сайдбара (Числа)
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

  // Карта
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

  // Реагирование на изменение URL (через Shallow Router Шапки/Подвала)
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
                  const placemark = new window.ymaps.Placemark([lat, lon], {
                    balloonContentHeader: `<strong>${p.title}</strong>`,
                    balloonContentBody: `${formatPrice(p.price)}`,
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

  // Вспомогательные хендлеры
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
                <div className="search-inputs-row grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                  
                  {/* Контур выбора района */}
                  <div 
                    className={`search-input-field flex items-center gap-3 relative ${activeHeroDropdown === 'location' ? 'active-field' : ''} ${selectedDistricts.length > 0 ? 'has-value' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setActiveHeroDropdown(activeHeroDropdown === 'location' ? null : 'location') }}
                  >
                    {SVGS.location}
                    <div className="input-double-label">
                      <span className="sub-label">Konum</span>
                      <span className="main-label">
                        {selectedDistricts.length === 0 ? 'İlçe / Semt seçiniz' : selectedDistricts.join(', ')}
                      </span>
                    </div>

                    {activeHeroDropdown === 'location' && (
                      <div className="absolute left-0 top-[65px] bg-white border border-gray-100 rounded-xl shadow-2xl p-4 z-[9999] w-full max-h-60 overflow-y-auto flex flex-col gap-1 text-left" onClick={(e) => e.stopPropagation()}>
                        <div 
                          className="dropdown-select-all flex justify-between py-1.5 px-2 hover:bg-slate-50 rounded cursor-pointer"
                          onClick={() => handleSelectAll(districtOptions, selectedDistricts, setSelectedDistricts)}
                        >
                          <span className="dropdown-select-all-text text-sm font-extrabold text-[#00A4A6]">Tümünü Seç</span>
                        </div>
                        {districtOptions.map((opt, i) => (
                          <label key={i} className="flex items-center gap-2 py-2 px-2 hover:bg-slate-50 rounded text-sm font-semibold cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={selectedDistricts.includes(opt)} 
                              onChange={() => handleToggleSelect(opt, selectedDistricts, setSelectedDistricts)}
                              className="accent-[#00A4A6]"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Контур выбора комнатности */}
                  <div 
                    className={`search-input-field flex items-center gap-3 relative ${activeHeroDropdown === 'room' ? 'active-field' : ''} ${selectedRooms.length > 0 ? 'has-value' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setActiveHeroDropdown(activeHeroDropdown === 'room' ? null : 'room') }}
                  >
                    {SVGS.bed}
                    <div className="input-double-label">
                      <span className="sub-label">Oda sayısı</span>
                      <span className="main-label">
                        {selectedRooms.length === 0 ? 'Oda sayısı seçiniz' : selectedRooms.join(', ')}
                      </span>
                    </div>

                    {activeHeroDropdown === 'room' && (
                      <div className="absolute left-0 top-[65px] bg-white border border-gray-100 rounded-xl shadow-2xl p-4 z-[9999] w-full max-h-60 overflow-y-auto flex flex-col gap-1 text-left" onClick={(e) => e.stopPropagation()}>
                        <div 
                          className="dropdown-select-all flex justify-between py-1.5 px-2 hover:bg-slate-50 rounded cursor-pointer"
                          onClick={() => handleSelectAll(roomOptions, selectedRooms, setSelectedRooms)}
                        >
                          <span className="dropdown-select-all-text text-sm font-extrabold text-[#00A4A6]">Tümünü Seç</span>
                        </div>
                        {roomOptions.map((opt, i) => (
                          <label key={i} className="flex items-center gap-2 py-2 px-2 hover:bg-slate-50 rounded text-sm font-semibold cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={selectedRooms.includes(opt)} 
                              onChange={() => handleToggleSelect(opt, selectedRooms, setSelectedRooms)}
                              className="accent-[#00A4A6]"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Контур выбора статуса */}
                  <div 
                    className={`search-input-field flex items-center gap-3 relative ${activeHeroDropdown === 'status' ? 'active-field' : ''} ${selectedStatuses.length > 0 ? 'has-value' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setActiveHeroDropdown(activeHeroDropdown === 'status' ? null : 'status') }}
                  >
                    <svg className="input-icon-svg icon-stroke w-5 h-5 fill-none stroke-slate-400 stroke-[2]" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
                    <div className="input-double-label">
                      <span className="sub-label">Proje durumu</span>
                      <span className="main-label">
                        {selectedStatuses.length === 0 ? 'Durum seçiniz' : selectedStatuses.join(', ')}
                      </span>
                    </div>

                    {activeHeroDropdown === 'status' && (
                      <div className="absolute left-0 top-[65px] bg-white border border-gray-100 rounded-xl shadow-2xl p-4 z-[9999] w-full max-h-60 overflow-y-auto flex flex-col gap-1 text-left" onClick={(e) => e.stopPropagation()}>
                        <div 
                          className="dropdown-select-all flex justify-between py-1.5 px-2 hover:bg-slate-50 rounded cursor-pointer"
                          onClick={() => handleSelectAll(statusOptions, selectedStatuses, setSelectedStatuses)}
                        >
                          <span className="dropdown-select-all-text text-sm font-extrabold text-[#00A4A6]">Tümünü Seç</span>
                        </div>
                        {statusOptions.map((opt, i) => (
                          <label key={i} className="flex items-center gap-2 py-2 px-2 hover:bg-slate-50 rounded text-sm font-semibold cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={selectedStatuses.includes(opt)} 
                              onChange={() => handleToggleSelect(opt, selectedStatuses, setSelectedStatuses)}
                              className="accent-[#00A4A6]"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

                <button onClick={handleSearchSubmit} className="search-submit-btn w-full md:w-auto shrink-0 py-4 px-8 bg-[#00A4A6] hover:bg-[#00898B] text-white rounded-full font-extrabold text-lg transition duration-200 shadow-md">
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
          <div id="catalog-content-wrapper" className="md:ml-[330px]">
            
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

            {/* СПИСОК КАРТОЧЕК ОБЪЕКТОВ ЧЕРЕЗ .MAP() */}
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
                    Türkiye'nin önde gelen inşaat firmalarını tek platformda topladık. Klasik emlakçı süreçlerini tamamen devre dışı bırakarak hayalinizdeki eve doğrudan, güvenle ulaşmanızı sağlıyoruz.
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

      {/* Глобальные стили для поддержки кастомной верстки */}
      <style jsx global>{`
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

        body {
          font-family: 'Mulish', sans-serif !important;
          background-color: #ffffff;
        }

        .modern-header {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 90px !important;
          background-color: #ffffff !important;
          border-bottom: 1px solid #E2E8F0 !important;
          z-index: 99999 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          box-sizing: border-box !important;
          box-shadow: 0 2px 10px rgba(0,0,0,0.02) !important;
        }
        .header-container {
          width: 100% !important;
          max-width: 1200px !important;
          padding: 0 20px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          box-sizing: border-box !important;
        }
        .modern-logo { display: flex !important; align-items: center !important; text-decoration: none !important; gap: 10px !important; cursor: pointer !important; }
        .logo-icon-box {
          width: 40px !important; height: 40px !important; background-color: rgba(0, 164, 166, 0.08) !important; border-radius: 10px !important;
          display: flex !important; align-items: center !important; justify-content: center !important; color: var(--primary) !important; transition: transform 0.2s ease !important;
        }
        .modern-logo:hover .logo-icon-box { transform: scale(1.05) !important; }
        .logo-icon-svg { width: 22px !important; height: 22px !important; fill: currentColor !important; }
        .logo-text { font-size: 20px !important; font-weight: 500 !important; color: var(--dark-slate) !important; letter-spacing: -0.5px !important; }
        .logo-text-accent { color: var(--primary) !important; font-weight: 900 !important; }

        .modern-nav { display: flex !important; align-items: center !important; gap: 32px !important; }
        .nav-item {
          font-size: 15px !important; font-weight: 600 !important; color: var(--dark-slate) !important; text-decoration: none !important;
          display: flex !important; align-items: center !important; gap: 6px !important; cursor: pointer !important; transition: color 0.2s ease !important;
          padding: 8px 0 !important; position: relative !important; user-select: none !important;
        }
        .nav-item::after {
          content: '' !important; position: absolute !important; bottom: 0 !important; left: 0 !important; width: 0 !important; height: 2px !important;
          background-color: var(--primary) !important; transition: width 0.25s ease !important;
        }
        .nav-item:hover { color: var(--primary) !important; }
        .nav-item:hover::after { width: 100% !important; }
        .nav-chevron-svg { width: 12px !important; height: 12px !important; stroke: currentColor !important; stroke-width: 2.5 !important; fill: none !important; transition: transform 0.2s ease !important; }
        .nav-item:hover .nav-chevron-svg { transform: translateY(2px) !important; }
        .new-ssapkaprojelerimiz.open .nav-chevron-svg { transform: rotate(180deg) !important; stroke: var(--primary) !important; }
        .new-ssapkaprojelerimiz.open { color: var(--primary) !important; }

        .header-contact { display: flex !important; align-items: center !important; gap: 20px !important; }
        .contact-phone {
          display: flex !important; align-items: center !important; gap: 8px !important; text-decoration: none !important;
          color: var(--dark-slate) !important; font-size: 15px !important; font-weight: 700 !important; transition: color 0.2s ease !important;
        }
        .contact-phone:hover { color: var(--primary) !important; }
        .phone-icon-svg { width: 16px !important; height: 16px !important; fill: currentColor !important; color: var(--primary) !important; }
        .contact-whatsapp {
          width: 42px !important; height: 42px !important; background-color: #25D366 !important; border-radius: 50% !important;
          display: flex !important; align-items: center !important; justify-content: center !important; color: #ffffff !important;
          text-decoration: none !important; box-shadow: 0 4px 10px rgba(37, 211, 102, 0.3) !important; transition: transform 0.2s ease, box-shadow 0.2s ease !important;
        }
        .contact-whatsapp:hover { transform: translateY(-2px) !important; box-shadow: 0 6px 15px rgba(37, 211, 102, 0.4) !important; }
        .wa-icon-svg { width: 22px !important; height: 22px !important; fill: currentColor !important; }

        /* HERO PANEL */
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
          box-sizing: border-box;
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
        .panel-bottom-gradient {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: linear-gradient(to right, #7b1fa2, var(--primary), #ffb300);
          overflow: hidden;
          border-radius: 0 0 20px 20px;
        }
        .search-tabs-header {
          display: flex;
          gap: 24px;
          border-bottom: 1px solid var(--border-soft);
          padding-bottom: 12px;
          margin-bottom: 4px;
          box-sizing: border-box;
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
          user-select: none;
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
        .tab-badge {
          font-size: 9px;
          background-color: #F3F4F6;
          color: #9CA3AF;
          padding: 2px 6px;
          border-radius: 20px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .5px;
        }
        .search-inputs-row-wrapper {
          display: flex;
          gap: 16px;
          width: 100%;
          align-items: center;
          box-sizing: border-box;
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

        /* SIDEBAR */
        .luxe-sidebar {
          position: absolute !important;
          top: 15px !important;
          left: 20px !important;
          width: 310px;
          background: #fff;
          border: 1.5px solid var(--border-soft);
          border-radius: 24px;
          padding: 24px;
          z-index: 999 !important;
          box-shadow: var(--shadow-premium);
          box-sizing: border-box;
        }
        .luxe-sidebar-map {
          width: 100%;
          height: 125px;
          border-radius: 14px;
          margin-bottom: 20px;
          overflow: hidden;
          border: 1px solid var(--border-soft);
        }
        .luxe-divider {
          height: 1px;
          background-color: var(--border-soft);
          margin: 20px 0;
        }
        .luxe-oval-input {
          width: 45%;
          height: 34px;
          border: 1px solid var(--border-soft);
          background-color: var(--bg-light);
          border-radius: 17px;
          font-size: 13px;
          font-weight: 700;
          color: #3F536C !important;
          text-align: center;
          outline: none;
          box-sizing: border-box;
          transition: border-color .2s, background-color .2s;
        }
        .luxe-oval-input:focus {
          border-color: var(--primary);
          background-color: #fff;
        }

        /* GRID / LIST LAYOUTS */
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
        @media (max-width: 768px) {
          .list-layout .custom-card {
            flex-direction: column !important;
          }
        }

        .custom-card .card-content {
          padding: 20px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }
        .custom-card .title-price-row {
          display: flex;
          flex-direction: column;
          margin-bottom: 8px;
        }
        .custom-card .features-row {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
          border-top: 1px solid var(--border-soft);
          padding-top: 12px;
        }
        .custom-card .feat-badge {
          background: var(--bg-light);
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .custom-card .olanaklar-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 20px;
          margin-top: auto;
        }
        .custom-card .actions {
          display: flex;
          gap: 10px;
          margin-top: auto;
          width: 100%;
        }
        .custom-card .actions .btn {
          flex: 1;
        }

        .btn {
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all .2s ease;
          box-sizing: border-box;
        }
        .btn-primary {
          background-color: var(--primary);
          color: #fff !important;
          border: 2px solid var(--primary);
        }
        .btn-primary:hover {
          background-color: var(--primary-hover);
          border-color: var(--primary-hover);
        }
        .btn-outline {
          background-color: transparent;
          color: #3F536C !important;
          border: 2px solid var(--border-soft);
        }
        .btn-outline:hover {
          border-color: var(--primary);
          color: var(--primary) !important;
        }

        .olanak-tag {
          font-size: 11px !important;
          font-weight: 700 !important;
          color: var(--primary) !important;
          background-color: rgba(0, 164, 166, 0.06) !important;
          padding: 4px 10px !important;
          border-radius: 6px !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 6px !important;
          box-sizing: border-box !important;
        }
        .olanak-tag svg {
          width: 14px !important;
          height: 14px !important;
          fill: currentColor !important;
          color: var(--primary) !important;
          flex-shrink: 0 !important;
        }

        /* ABOUT US */
        .v1-section {
          background-color: var(--bg-light);
          border-radius: var(--radius-bubble);
          padding: 70px 50px;
          box-shadow: var(--shadow-premium);
          border: 1.5px solid var(--border-soft);
          box-sizing: border-box;
          width: 100%;
          position: relative;
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
          transition: all .4s cubic-bezier(.165, .84, .44, 1);
          box-sizing: border-box;
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
        .v1-card-title {
          font-size: 20px;
          font-weight: 850;
          color: #3F536C;
          margin-bottom: 12px;
        }
        .v1-card-desc {
          font-size: 14px;
          color: var(--text-muted);
          line-height: 1.6;
        }
        .kb-btn-wa {
          background-color: #25D366;
          color: #fff !important;
          box-shadow: 0 6px 18px rgba(37, 211, 102, .2);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 30px;
          border-radius: 30px;
          font-size: 14px;
          font-weight: 800;
          text-decoration: none;
        }

        /* MOBILE FLOATING FILTER */
        .mobile-filter-floating-btn {
          display: none;
          position: fixed !important;
          bottom: 20px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          background-color: var(--primary) !important;
          color: #ffffff !important;
          font-weight: 800 !important;
          padding: 14px 28px !important;
          border-radius: 30px !important;
          box-shadow: 0 10px 25px rgba(0, 164, 166, 0.3) !important;
          z-index: 999999 !important;
          text-transform: uppercase !important;
          font-size: 13px !important;
          letter-spacing: 0.5px !important;
          align-items: center !important;
          gap: 8px !important;
          cursor: pointer;
          border: none !important;
          white-space: nowrap !important;
        }

        .mobile-only-title { display: none; }

        /* FOOTER */
        .v3-footer {
          font-family: 'Mulish', sans-serif !important;
          background-color: #f8fafc !important;
          border-top: 1px solid #e2e8f0 !important;
          padding: 60px 20px 30px 20px !important;
          box-sizing: border-box !important;
          width: 100% !important;
          color: #334155 !important;
        }
        .v3-container {
          max-width: 1200px !important;
          margin: 0 auto !important;
          width: 100% !important;
        }
        .v3-grid {
          display: grid !important;
          grid-template-columns: 1.5fr 1fr 1fr 1.2fr !important;
          gap: 30px !important;
          margin-bottom: 40px !important;
        }
        .v3-col {
          display: flex !important;
          flex-direction: column !important;
          align-items: flex-start !important;
          padding-right: 20px !important;
        }
        .v3-col:not(:last-child) {
          border-right: 1px solid #e2e8f0 !important;
        }
        .v3-logo {
          display: inline-flex !important;
          align-items: center !important;
          text-decoration: none !important;
          gap: 8px !important;
          margin-bottom: 18px !important;
        }
        .v3-logo-icon {
          width: 34px !important;
          height: 34px !important;
          background-color: #007a7c !important;
          border-radius: 6px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          color: #ffffff !important;
        }
        .v3-logo-svg {
          width: 18px !important;
          height: 18px !important;
          fill: currentColor !important;
        }
        .v3-logo-text {
          font-size: 17px !important;
          font-weight: 500 !important;
          color: #0f172a !important;
          letter-spacing: -0.3px !important;
        }
        .v3-logo-accent {
          color: #007a7c !important;
          font-weight: 900 !important;
        }
        .v3-description {
          font-size: 13px !important;
          line-height: 1.6 !important;
          color: #475569 !important;
        }
        .v3-title {
          font-size: 14px !important;
          font-weight: 800 !important;
          color: #0f172a !important;
          margin-top: 0 !important;
          margin-bottom: 18px !important;
        }
        .v3-links {
          list-style: none !important;
          padding: 0 !important;
          margin: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 12px !important;
        }
        .v3-links a {
          font-size: 13px !important;
          color: #475569 !important;
          text-decoration: none !important;
        }
        .v3-links a:hover {
          color: #007a7c !important;
        }
        .v3-contacts {
          display: flex !important;
          flex-direction: column !important;
          gap: 12px !important;
          width: 100% !important;
        }
        .v3-contact-item {
          display: inline-flex !important;
          align-items: center !important;
          gap: 8px !important;
          font-size: 13px !important;
          color: #475569 !important;
          text-decoration: none !important;
        }
        .v3-contact-icon {
          width: 15px !important;
          height: 15px !important;
          color: #007a7c !important;
        }
        .v3-wa-button {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 8px !important;
          background-color: #128c7e !important;
          color: #ffffff !important;
          text-decoration: none !important;
          font-size: 12.5px !important;
          font-weight: 700 !important;
          padding: 8px 16px !important;
          border-radius: 6px !important;
        }

        .luxe-radio-dot {
          width: 18px;
          height: 18px;
          border: 1.5px solid var(--border-soft);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #fff;
          transition: all .2s;
        }
        .luxe-checkbox-item.checked .luxe-radio-dot {
          border-color: var(--primary);
          background-color: var(--primary);
        }
        .luxe-radio-dot::after {
          content: '';
          width: 6px;
          height: 6px;
          background-color: #fff;
          border-radius: 50%;
          display: none;
        }
        .luxe-checkbox-item.checked .luxe-radio-dot::after {
          display: block;
        }

        .luxe-tag-item {
          display: inline-flex !important;
          align-items: center !important;
          gap: 6px !important;
          padding: 8px 14px !important;
          background-color: #fff !important;
          border: 1px solid var(--border-soft) !important;
          border-radius: 20px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          color: var(--dark-slate) !important;
          cursor: pointer !important;
          transition: all .2s ease !important;
          user-select: none !important;
          box-sizing: border-box !important;
        }
        .luxe-tag-item:hover, .luxe-tag-item.active {
          border-color: var(--primary) !important;
          background-color: var(--primary-light) !important;
          color: var(--primary) !important;
        }
        .luxe-tag-item.active {
          background-color: var(--primary) !important;
          color: #fff !important;
        }

        /* RESPONSIVE */
        @media (max-width: 1024px) {
          .modern-header {
            height: 70px !important;
          }
          .modern-logo .logo-text { font-size: 18px !important; }
          .modern-nav { display: none !important; }
          .mobile-burger-btn { display: flex !important; }
          .hero-search-title { display: none !important; }
          .mobile-only-title {
            display: block !important;
            font-size: 20px !important;
            font-weight: 800 !important;
            color: #ffffff !important;
            text-align: center !important;
            margin-bottom: 20px !important;
          }
          .hero-search-container {
            padding: 110px 20px 24px 20px !important;
            background: linear-gradient(180deg, #00A4A6 0%, #062228 100%) !important;
            border-radius: 0 !important;
          }
          .search-tabs-header {
            justify-content: center !important;
            gap: 8px !important;
          }
          .search-panel-card {
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
            padding: 0 !important;
          }
          .search-inputs-row-wrapper {
            flex-direction: column !important;
          }
          .search-input-field {
            background-color: #fff !important;
            width: 100% !important;
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
          .catalog-control-bar {
            display: none !important;
          }
          .v3-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .v3-col {
            border-right: none !important;
          }
        }

        @media (max-width: 576px) {
          .v3-grid {
            grid-template-columns: 1fr !important;
          }
          .v3-footer {
            padding: 40px 15px 25px 15px !important;
          }
          .v1-section {
            padding: 30px 20px !important;
          }
          .v1-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  )
}

// Запрос к Supabase
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
