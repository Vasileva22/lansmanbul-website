import React, { useState, useEffect, useMemo, useRef } from 'react'
import Head from 'next/head'
import Script from 'next/script'
import { useRouter } from 'next/router'
import { supabase } from '../supabase'

import Header from '../components/Header'
import Footer from '../components/Footer'
import PropertyCard from '../components/PropertyCard'

const ensureArray = (val) => {
  if (!val) return []
  if (Array.isArray(val)) return val
  if (typeof val === 'string') {
    const clean = val.trim()
    if (clean.includes(',')) {
      return clean.split(',').map(s => s.trim()).filter(Boolean)
    }
    return clean.split(/\s+/).map(s => s.trim()).filter(Boolean)
  }
  return []
}

const mapProperty = (item) => {
  if (!item) return {}
  const f = item.fields || item
  return {
    id: item.id || item["Номер"] || '',
    title: f.title || f.testproje || f.adress || 'Başlıksız Proje', 
    price: f.price || f.Fiyat || 0,
    description: f.description || f["Açıklama"] || f.Aciklama || '',
    district: f.district || f.district_name || f["İlçe/Semt"] || '',
    rooms: f.rooms || f.card_odalar || f["card odalar"] || '',
    status: f.status || f.konutcesit || f.konut_cesit || '',
    area: parseInt(f.area || f.card_area || f["card-area"]) || 0, 
    images: ensureArray(f.images || f.Foto || f.kapak_fotografi || f["Kapak Fotoğrafı"]),
    whatsapp: f.whatsapp || f.WhatsApp || '',
    amenities: ensureArray(f.Siteiçerisinde || f.Siteicerisinde || f.amenities || f.ozellikler || f["Özellikler"]),
    coordinates: f.coordinates || f["Koordinat"] || '',
    kat_sayisi: parseInt(f.kat_sayisi || f["Kat Sayısı"] || f.Kat_Sayisi || f.KatSayisi) || 0,
    kredi: f.kredi || f.kredi_durumu || f["Kredi_Durumu"] || f.Kredi_Durumu || '',
    vade: f.vade || f.vade_secenegi || f["Vade_Secenegi"] || f.Vade_Secenegi || '',
    downPayment: f.downPayment || f.ilk_pesinat || f.down_payment || f["Ilk_Pesinat"] || f.Ilk_Pesinat || '',
  }
}

const SVGS = {
  location: <svg className="input-icon-svg icon-fill" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>,
  bed: <svg className="input-icon-svg icon-fill" viewBox="0 0 24 24"><path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"/></svg>,
  search: <svg className="dropdown-search-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  grid: <svg className="toggle-icon" viewBox="0 0 24 24"><path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"/></svg>,
  list: <svg className="toggle-icon" viewBox="0 0 24 24"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5s1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5S5.5 6.83 5.5 6S4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5s1.5-.68 1.5-1.5s-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-7v2h14V6H7z"/></svg>,
}

export default function Home({ properties = [], initialError }) {
  const router = useRouter()
  const { status } = router.query

  const [layout, setLayout] = useState('grid')

  const [activeHeroDropdown, setActiveHeroDropdown] = useState(null)
  const [selectedDistricts, setSelectedDistricts] = useState([])
  const [selectedRooms, setSelectedRooms] = useState([])
  const [selectedStatuses, setSelectedStatuses] = useState([])

  const [searchDistrictQuery, setSearchDistrictQuery] = useState('')

  const [minArea, setMinArea] = useState(0)
  const [maxArea, setMaxArea] = useState(500)
  const [minFloor, setMinFloor] = useState(0)
  const [maxFloor, setMaxFloor] = useState(40)
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(50000000)

  const [selectedAmenities, setSelectedAmenities] = useState([])
  const [selectedPayments, setSelectedPayments] = useState([])

  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false)
  const [isSidebarHidden, setIsSidebarHidden] = useState(false)
  
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = useMemo(() => (layout === 'grid' ? 12 : 8), [layout])

  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  const mappedList = useMemo(() => (properties || []).map(mapProperty), [properties])

  const districtOptions = useMemo(() => [...new Set(mappedList.map(p => p.district).filter(Boolean))].sort(), [mappedList])
  const roomOptions = useMemo(() => [...new Set(mappedList.map(p => p.rooms).filter(Boolean))].sort(), [mappedList])
  const statusOptions = useMemo(() => {
    const customOrder = ["Lansman", "Devam ediyor", "Tamamlandı"]
    const databaseStatuses = [...new Set(mappedList.map(p => p.status).filter(Boolean))]
    return customOrder.filter(v => databaseStatuses.includes(v))
  }, [mappedList])

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

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.search-input-field')) {
        setActiveHeroDropdown(null)
      }
    }
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [])

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-center" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
        <div style={{ padding: '24px', maxWidth: '600px', fontFamily: 'sans-serif' }}>
          <p className="font-bold" style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '22px', marginBottom: '8px' }}>Veri Yükleme Hatası</p>
          <p style={{ color: '#4b5563', fontSize: '15px', lineHeight: '1.6', marginBottom: '16px' }}>{initialError}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>LansmanBul — Ankara Konut Projeleri</title>
        <meta name="description" content="Komisyonsuz, doğrudan müteahhitten konut keşfedin." />
      </Head>

      <Script 
        src="https://api-maps.yandex.ru/2.1/?apikey=72709de3-d8bc-49c9-88c6-339937b3fa51&lang=tr_TR"
        strategy="afterInteractive"
        onLoad={initMap}
      />

      <div className="bg-white min-h-screen relative text-slate-800 pt-[90px] md:pt-[90px] tilda-catalog-wrapper">
        
        <Header />

        {/* Gray Backdrop Overlay */}
        <div 
          className={"modal-backdrop-overlay" + (activeHeroDropdown !== null || isSidebarMobileOpen ? " show" : "")} 
          onClick={() => { setActiveHeroDropdown(null); setIsSidebarMobileOpen(false); }} 
        />

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
                    className={"search-input-field flex-wide field-trigger-location" + (activeHeroDropdown === 'location' ? " active-field" : "") + (selectedDistricts.length > 0 ? " has-value" : "")}
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
                      className={"custom-dropdown" + (activeHeroDropdown === 'location' ? " active-desktop active-mobile-modal shadow-2xl" : "")}
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
                        className="dropdown-select-all"
                        onClick={() => handleSelectAll(districtOptions, selectedDistricts, setSelectedDistricts)}
                      >
                        <span className="dropdown-select-all-text">Tümünü Seç</span>
                      </div>
                      <div className="dropdown-items-scroll">
                        {filteredDistrictOptions.length > 0 ? (
                          filteredDistrictOptions.map((opt, i) => (
                            <div 
                              key={i} 
                              className={"dropdown-item" + (selectedDistricts.includes(opt) ? " selected" : "")}
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
                          ))
                        ) : (
                          <div className="p-5 text-center text-xs text-gray-400 font-bold">Veri bulunamadı.</div>
                        )}
                      </div>
                      <div className="dropdown-mobile-footer">
                        <button className="dropdown-sec-btn" onClick={() => setActiveHeroDropdown(null)}>Seç</button>
                      </div>
                    </div>
                  </div>

                  {/* Комнатность */}
                  <div 
                    className={"search-input-field flex-standard field-trigger-room" + (activeHeroDropdown === 'room' ? " active-field" : "") + (selectedRooms.length > 0 ? " has-value" : "")}
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
                      className={"custom-dropdown" + (activeHeroDropdown === 'room' ? " active-desktop active-mobile-modal shadow-2xl" : "")}
                      data-field="card odalar"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="dropdown-mobile-header">
                        <span className="dropdown-mobile-title">Oda sayısı seçiniz</span>
                        <span className="dropdown-mobile-close" onClick={() => setActiveHeroDropdown(null)}>&times;</span>
                      </div>
                      <div 
                        className="dropdown-select-all"
                        onClick={() => handleSelectAll(roomOptions, selectedRooms, setSelectedRooms)}
                      >
                        <span className="dropdown-select-all-text">Tümünü Seç</span>
                      </div>
                      <div className="dropdown-items-scroll">
                        {roomOptions.length > 0 ? (
                          roomOptions.map((opt, i) => (
                            <div 
                              key={i} 
                              className={"dropdown-item" + (selectedRooms.includes(opt) ? " selected" : "")}
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
                          ))
                        ) : (
                          <div className="p-5 text-center text-xs text-gray-400 font-bold">Veri bulunamadı.</div>
                        )}
                      </div>
                      <div className="dropdown-mobile-footer">
                        <button className="dropdown-sec-btn" onClick={() => setActiveHeroDropdown(null)}>Seç</button>
                      </div>
                    </div>
                  </div>

                  {/* Статус */}
                  <div 
                    className={"search-input-field flex-standard field-trigger-durum" + (activeHeroDropdown === 'status' ? " active-field" : "") + (selectedStatuses.length > 0 ? " has-value" : "")}
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
                      className={"custom-dropdown" + (activeHeroDropdown === 'status' ? " active-desktop active-mobile-modal shadow-2xl" : "")}
                      data-field="konutcesit"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="dropdown-mobile-header">
                        <span className="dropdown-mobile-title">Durum seçiniz</span>
                        <span className="dropdown-mobile-close" onClick={() => setActiveHeroDropdown(null)}>&times;</span>
                      </div>
                      <div 
                        className="dropdown-select-all"
                        onClick={() => handleSelectAll(statusOptions, selectedStatuses, setSelectedStatuses)}
                      >
                        <span className="dropdown-select-all-text">Tümünü Seç</span>
                      </div>
                      <div className="dropdown-items-scroll">
                        {statusOptions.length > 0 ? (
                          statusOptions.map((opt, i) => (
                            <div 
                              key={i} 
                              className={"dropdown-item" + (selectedStatuses.includes(opt) ? " selected" : "")}
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
                          ))
                        ) : (
                          <div className="p-5 text-center text-xs text-gray-400 font-bold">Veri bulunamadı.</div>
                        )}
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
          
          <button className="mobile-filter-floating-btn shadow-lg" onClick={() => setIsSidebarMobileOpen(true)}>
            <svg style={{ width: '16px', height: '16px', fill: 'currentColor' }} viewBox="0 0 24 24"><path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/></svg>
            <span>Filtreleme</span>
          </button>

          <div className={"sidebar-mobile-overlay" + (isSidebarMobileOpen ? " show" : "")} onClick={() => setIsSidebarMobileOpen(false)} />

          {/* САЙДБАP (ФИЛЬТРЫ) */}
          <aside className={"luxe-sidebar" + (isSidebarMobileOpen ? " sidebar-mobile-show" : "") + (isSidebarHidden ? " sidebar-hidden" : "")} id="custom-sidebar">
            <span className="sidebar-mobile-close-btn" onClick={() => setIsSidebarMobileOpen(false)}>&times;</span>
            
            <div className="luxe-sidebar-scrollable-body">
              <div ref={mapRef} id="yandex-map-container" className="luxe-sidebar-map mb-4 bg-slate-100 rounded-xl" />
              
              <div className="luxe-sidebar-header">
                <div className="luxe-sidebar-sub-count">
                  <span className="orange-count"><span id="live-proj-count">{filteredProperties.length}</span> Proje</span> Listeleniyor
                </div>
                <span onClick={() => handleResetFilters()} className="clear-link clear-filters-btn">
                  Filtreleri Temizle
                </span>
              </div>
              <div className="luxe-divider" />

              {/* МЕТРАЖ С ДВОЙНЫМ СЛАЙДЕРОМ */}
              <div className="luxe-group">
                <span className="luxe-group-label">Metrekare (m²)</span>
                <div className="luxe-range-inputs-row">
                  <input 
                    type="number" 
                    value={minArea} 
                    onChange={(e) => { setMinArea(Math.max(0, parseInt(e.target.value) || 0)); setCurrentPage(1); }}
                    className="luxe-oval-input"
                  />
                  <span className="luxe-range-separator">—</span>
                  <input 
                    type="number" 
                    value={maxArea} 
                    onChange={(e) => { setMaxArea(Math.min(500, parseInt(e.target.value) || 500)); setCurrentPage(1); }}
                    className="luxe-oval-input"
                  />
                </div>
                
                <div className="dual-range-slider-container">
                  <div 
                    className="dual-range-track"
                    style={{
                      left: `${(minArea / 500) * 100}%`,
                      width: `${((maxArea - minArea) / 500) * 100}%`
                    }}
                  />
                  <input 
                    type="range" 
                    min="0" 
                    max="500" 
                    value={minArea}
                    onChange={(e) => {
                      const val = Math.min(Number(e.target.value), maxArea);
                      setMinArea(val);
                      setCurrentPage(1);
                    }}
                  />
                  <input 
                    type="range" 
                    min="0" 
                    max="500" 
                    value={maxArea}
                    onChange={(e) => {
                      const val = Math.max(Number(e.target.value), minArea);
                      setMaxArea(val);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              </div>
              <div className="luxe-divider" />

              {/* ЭТАЖНОСТЬ */}
              <div className="luxe-group">
                <span className="luxe-group-label">Kat sayısı</span>
                <div className="luxe-range-inputs-row">
                  <input 
                    type="number" 
                    value={minFloor} 
                    onChange={(e) => { setMinFloor(Math.max(0, parseInt(e.target.value) || 0)); setCurrentPage(1); }}
                    className="luxe-oval-input"
                  />
                  <span className="luxe-range-separator">—</span>
                  <input 
                    type="number" 
                    value={maxFloor} 
                    onChange={(e) => { setMaxFloor(Math.min(40, parseInt(e.target.value) || 40)); setCurrentPage(1); }}
                    className="luxe-oval-input"
                  />
                </div>
                
                <div className="dual-range-slider-container">
                  <div 
                    className="dual-range-track"
                    style={{
                      left: `${(minFloor / 40) * 100}%`,
                      width: `${((maxFloor - minFloor) / 40) * 100}%`
                    }}
                  />
                  <input 
                    type="range" 
                    min="0" 
                    max="40" 
                    value={minFloor}
                    onChange={(e) => {
                      const val = Math.min(Number(e.target.value), maxFloor);
                      setMinFloor(val);
                      setCurrentPage(1);
                    }}
                  />
                  <input 
                    type="range" 
                    min="0" 
                    max="40" 
                    value={maxFloor}
                    onChange={(e) => {
                      const val = Math.max(Number(e.target.value), minFloor);
                      setMaxFloor(val);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              </div>
              <div className="luxe-divider" />

              {/* ЦЕНЫ */}
              <div className="luxe-group">
                <span className="luxe-group-label">Fiyat</span>
                <div className="price-live-display">
                  <span>{minPrice.toLocaleString('tr-TR')} TL</span> — <span>{maxPrice.toLocaleString('tr-TR')} TL</span>
                </div>
                
                <div className="dual-range-slider-container">
                  <div 
                    className="dual-range-track"
                    style={{
                      left: `${(minPrice / 50000000) * 100}%`,
                      width: `${((maxPrice - minPrice) / 50000000) * 100}%`
                    }}
                  />
                  <input 
                    type="range" 
                    min="0" 
                    max="50000000" 
                    step="100000"
                    value={minPrice}
                    onChange={(e) => {
                      const val = Math.min(Number(e.target.value), maxPrice);
                      setMinPrice(val);
                      setCurrentPage(1);
                    }}
                  />
                  <input 
                    type="range" 
                    min="0" 
                    max="50000000" 
                    step="100000"
                    value={maxPrice}
                    onChange={(e) => {
                      const val = Math.max(Number(e.target.value), minPrice);
                      setMaxPrice(val);
                      setCurrentPage(1);
                    }}
                  />
                </div>

                <div className="price-inputs-container">
                  <div className="price-input-box">
                    <span className="price-box-label">En Düşük</span>
                    <div className="price-box-input-wrap">
                      <input 
                        type="text" 
                        value={minPrice.toLocaleString('tr-TR')} 
                        onChange={(e) => { 
                          const val = Math.max(0, parseInt(e.target.value.replace(/\D/g, '')) || 0);
                          setMinPrice(val); 
                          setCurrentPage(1); 
                        }}
                        className="price-box-input"
                      />
                      <span className="price-currency">TL</span>
                    </div>
                  </div>
                  <div className="price-input-box">
                    <span className="price-box-label">En Yüksek</span>
                    <div className="price-box-input-wrap">
                      <input 
                        type="text" 
                        value={maxPrice.toLocaleString('tr-TR')} 
                        onChange={(e) => { 
                          const val = Math.max(0, parseInt(e.target.value.replace(/\D/g, '')) || 0);
                          setMaxPrice(val); 
                          setCurrentPage(1); 
                        }}
                        className="price-box-input"
                      />
                      <span className="price-currency">TL</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="luxe-divider" />

              {/* УДОБСТВА */}
              <div className="luxe-group">
                <span className="luxe-group-label">Olanaklar</span>
                <div className="luxe-tags">
                  {['Havuz', 'Fitness', 'Güvenlik', 'Otopark', 'Çocuk parkı', 'Site İçerisinde', 'Spor Salonu', 'Sauna', 'Hamam', 'Oyun Parkı'].map((amenity, idx) => (
                    <div 
                      key={idx}
                      className={"luxe-tag-item" + (selectedAmenities.includes(amenity) ? " active" : "")}
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
                <span className="luxe-group-label">Ödeme durumu</span>
                <div className="luxe-checkboxes">
                  {['Krediye uygun', 'Taksit imkanı', 'Peşin'].map((payType, idx) => (
                    <div 
                      key={idx}
                      className={"luxe-checkbox-item" + (selectedPayments.includes(payType) ? " checked" : "")}
                      onClick={() => handleToggleSelect(payType, selectedPayments, setSelectedPayments)}
                    >
                      <div className="luxe-radio-dot" />
                      <label className="mb-0 cursor-pointer">{payType}</label>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Мобильные кнопки в футере */}
            <div className="luxe-sidebar-mobile-footer" style={{ display: 'flex' }}>
              <button 
                onClick={() => setIsSidebarMobileOpen(false)} 
                className="showList c-button c-button--primary"
                style={{ border: 'none', outline: 'none', cursor: 'pointer' }}
              >
                {filteredProperties.length} Sonucu Göster
              </button>
              <button 
                onClick={() => handleResetFilters()} 
                className="c-button c-button--transparent"
                style={{ outline: 'none', cursor: 'pointer' }}
              >
                Temizle
              </button>
            </div>
          </aside>

          {/* Десктопный значок скрытия/показа сайдбара */}
          <div 
            id="sidebar-toggle-btn" 
            className="hidden lg:flex" 
            style={{ border: 'none', outline: 'none' }}
            onClick={() => {
              setIsSidebarHidden(!isSidebarHidden);
              setCurrentPage(1);
            }}
          >
            {isSidebarHidden ? '❯' : '❮'}
          </div>

          {/* КОНТЕНТ С КАРТОЧКАМИ */}
          <div id="catalog-content-wrapper">
            
            <div className="catalog-control-bar">
              <div className="layout-toggle bg-slate-100 p-1 rounded-lg flex">
                <button 
                  onClick={() => { setLayout('grid'); setCurrentPage(1); }} 
                  className={"toggle-btn p-2 rounded-md transition" + (layout === 'grid' ? " active bg-white shadow-sm text-[#00A4A6]" : " text-slate-400")}
                >
                  {SVGS.grid}
                </button>
                <button 
                  onClick={() => { setLayout('list'); setCurrentPage(1); }} 
                  className={"toggle-btn p-2 rounded-md transition" + (layout === 'list' ? " active bg-white shadow-sm text-[#00A4A6]" : " text-slate-400")}
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
                  className={"pagination-item px-3 border rounded text-sm font-bold" + (currentPage === 1 ? " opacity-40 cursor-not-allowed" : "")}
                >
                  ❮
                </button>
                
                {[...Array(totalPages)].map((_, idx) => (
                  <button 
                    key={idx}
                    onClick={() => { setCurrentPage(idx + 1); window.scrollTo({ top: 380, behavior: 'smooth' }) }}
                    className={"pagination-item w-10 h-10 flex items-center justify-center border rounded text-sm font-bold transition" + (currentPage === idx + 1 ? " active bg-[#00A4A6] text-white border-[#00A4A6]" : " text-slate-500 hover:bg-slate-50")}
                  >
                    {idx + 1}
                  </button>
                ))}

                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => { setCurrentPage(prev => Math.min(totalPages, prev + 1)); window.scrollTo({ top: 380, behavior: 'smooth' }) }}
                  className={"pagination-item px-3 border rounded text-sm font-bold" + (currentPage === totalPages ? " opacity-40 cursor-not-allowed" : "")}
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
                    <svg className="wa-icon-svg w-5 h-5 fill-current text-white inline-block mr-1" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.156 5.156 0 11.487 0c3.067.001 5.95 1.196 8.114 3.363 2.164 2.167 3.357 5.053 3.355 8.12-.003 6.325-5.157 11.48-11.485 11.48-1.999-.001-3.968-.521-5.71-1.513L0 24zm6.59-4.846c1.642.975 3.251 1.489 4.84 1.49 4.996 0 9.06-4.061 9.062-9.058 0-2.42-1.014-4.701-2.731-6.418C16.035 3.45 13.84 2.502 11.487 2.502 6.49 2.502 2.428 6.564 2.426 11.56c-.001 1.638.484 3.235 1.401 4.7 l-.955 3.486 3.575-.937z" /></svg>
                    Bize WhatsApp'tan Ulaşın
                  </a>
                </div>
              </section>
            </div>

          </div>
        </section>

        <Footer />

      </div>

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

        .tilda-catalog-wrapper, .tilda-catalog-wrapper * {
          font-family: 'Mulish', sans-serif !important;
          box-sizing: border-box !important;
        }

        .dropdown-mobile-header, .dropdown-mobile-footer {
          display: none !important;
        }
        .mobile-filter-floating-btn {
          display: none !important;
        }

        .input-icon-svg {
          width: 18px !important;
          height: 18px !important;
          flex-shrink: 0 !important;
          transition: stroke .2s, fill .2s !important;
          display: inline-block !important;
        }
        .input-icon-svg.icon-stroke {
          fill: none !important;
          stroke: var(--text-muted) !important;
          stroke-width: 2 !important;
        }
        .input-icon-svg.icon-fill {
          fill: var(--text-muted) !important;
        }
        .search-input-field:hover .input-icon-svg.icon-stroke,
        .search-input-field.active-field .input-icon-svg.icon-stroke {
          stroke: var(--primary) !important;
        }
        .search-input-field:hover .input-icon-svg.icon-fill,
        .search-input-field.active-field .input-icon-svg.icon-fill {
          fill: var(--primary) !important;
        }

        .search-input-field {
          position: relative !important;
        }

        /* ВЫПАДАЮЩИЕ МЕНЮ */
        .custom-dropdown {
          position: absolute !important;
          background-color: #ffffff !important;
          border-radius: 16px !important;
          box-shadow: var(--shadow-dropdown) !important;
          border: 1.5px solid var(--border-soft) !important;
          padding: 0 !important;
          z-index: 99999 !important;
          display: none !important;
          overflow: hidden !important;
          top: 100% !important;
          left: 0 !important;
          width: 100% !important;
          margin-top: 4px !important;
        }

        .custom-dropdown.active-desktop {
          display: block !important;
        }

        /* Gray Backdrop Overlay */
        .modal-backdrop-overlay {
          display: none !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          background: rgba(15, 23, 42, .6) !important;
          z-index: 99999998 !important;
          opacity: 0 !important;
          transition: opacity .3s ease-in-out !important;
          pointer-events: none !important;
        }
        .modal-backdrop-overlay.show {
          display: block !important;
          opacity: 1 !important;
          pointer-events: auto !important;
        }

        /* СТИЛИ ДВОЙНОГО ПОЛЗУНКА */
        .dual-range-slider-container {
          position: relative !important;
          width: calc(100% - 20px) !important;
          height: 4px !important;
          background-color: var(--border-soft) !important;
          margin: 15px 10px 25px 10px !important;
          border-radius: 2px !important;
        }
        .dual-range-track {
          position: absolute !important;
          height: 100% !important;
          background: linear-gradient(90deg, #B2EBF2 0%, #00A4A6 100%) !important;
          border-radius: 2px !important;
          z-index: 1 !important;
        }
        .dual-range-slider-container input[type="range"] {
          position: absolute !important;
          width: 100% !important;
          height: 4px !important;
          background: transparent !important;
          appearance: none !important;
          -webkit-appearance: none !important;
          pointer-events: none !important;
          outline: none !important;
          margin: 0 !important;
          top: 0 !important;
          left: 0 !important;
          z-index: 2 !important;
        }
        .dual-range-slider-container input[type="range"]::-webkit-slider-thumb {
          appearance: none !important;
          -webkit-appearance: none !important;
          pointer-events: auto !important;
          width: 18px !important;
          height: 18px !important;
          border-radius: 50% !important;
          border: 2.5px solid var(--primary) !important;
          background-color: #fff !important;
          box-shadow: 0 2px 5px rgba(0,0,0,.1) !important;
          cursor: pointer !important;
          transition: transform .15s, box-shadow .15s !important;
          position: relative !important;
          z-index: 3 !important;
        }
        .dual-range-slider-container input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.1) !important;
          box-shadow: 0 0 0 6px rgba(0,164,166,.12) !important;
        }
        .dual-range-slider-container input[type="range"]::-moz-range-thumb {
          pointer-events: auto !important;
          width: 18px !important;
          height: 18px !important;
          border-radius: 50% !important;
          border: 2.5px solid var(--primary) !important;
          background-color: #fff !important;
          box-shadow: 0 2px 5px rgba(0,0,0,.1) !important;
          cursor: pointer !important;
          position: relative !important;
          z-index: 3 !important;
        }

        /* КНОПКА СКРЫТИЯ САЙДБАРА НА ДЕСКТОПЕ */
        #sidebar-toggle-btn {
          position: fixed !important;
          top: 50% !important;
          left: 0 !important;
          transform: translateY(-50%) !important;
          width: 24px !important;
          height: 60px !important;
          background: var(--primary) !important;
          color: #fff !important;
          border-radius: 0 8px 8px 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          z-index: 99999999 !important;
          box-shadow: 2px 0 10px rgba(0,0,0,.1) !important;
          font-size: 14px !important;
          font-weight: 700 !important;
          user-select: none !important;
          transition: background .2s ease !important;
        }
        #sidebar-toggle-btn:hover {
          background: var(--primary-hover) !important;
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
            z-index: 90 !important;
            transition: transform 0.3s ease, margin-left 0.3s ease, padding 0.3s ease, width 0.3s ease !important;
          }
          
          /* Обработка скрытого сайдбара на ПК */
          .luxe-sidebar.sidebar-hidden {
            display: none !important;
          }
          .luxe-sidebar.sidebar-hidden ~ #catalog-content-wrapper {
            margin-left: 0 !important;
          }

          #catalog-content-wrapper {
            margin-left: 0 !important;
            flex-grow: 1 !important;
            width: auto !important;
          }
          .mobile-filter-floating-btn {
            display: none !important;
          }
          .sidebar-mobile-close-btn {
            display: none !important;
          }
          .dropdown-mobile-header, .dropdown-mobile-footer {
            display: none !important;
          }
          .modal-backdrop-overlay {
            display: none !important;
          }
        }

        .mobile-only-title {
          display: none !important;
        }

        .hero-search-container {
          width: 100% !important;
          padding: 125px 20px 25px 20px !important;
          background-color: var(--bg-light) !important;
          display: flex !important;
          justify-content: center !important;
          box-sizing: border-box !important;
        }
        .search-width-limiter {
          width: 100% !important;
          max-width: 1140px !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          box-sizing: border-box !important;
        }
        .hero-search-title {
          font-size: 36px !important;
          font-weight: 900 !important;
          color: #3F536C !important;
          margin: 0 0 25px 0 !important;
          line-height: 1.3 !important;
          text-align: center !important;
        }
        .search-panel-card {
          width: 100% !important;
          background-color: #fff !important;
          border-radius: 20px !important;
          border: 1px solid var(--border-soft) !important;
          box-shadow: var(--shadow-premium) !important;
          padding: 24px 30px 32px 30px !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 20px !important;
          position: relative !important;
          box-sizing: border-box !important;
        }
        .panel-bottom-gradient {
          position: absolute !important;
          bottom: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 4px !important;
          background: linear-gradient(to right, #7b1fa2, var(--primary), #ffb300) !important;
          overflow: hidden !important;
          border-radius: 0 0 20px 20px !important;
        }
        .search-tabs-header {
          display: flex !important;
          gap: 24px !important;
          border-bottom: 1px solid var(--border-soft) !important;
          padding-bottom: 12px !important;
          margin-bottom: 4px !important;
          box-sizing: border-box !important;
        }
        .city-tab-item {
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          font-size: 16px !important;
          font-weight: 800 !important;
          color: var(--text-muted) !important;
          cursor: pointer !important;
          position: relative !important;
          padding-bottom: 12px !important;
          margin-bottom: -13px !important;
          transition: color .2s ease !important;
          user-select: none !important;
        }
        .city-tab-item.active {
          color: var(--primary) !important;
        }
        .city-tab-item.active::after {
          content: '' !important;
          position: absolute !important;
          bottom: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 3px !important;
          background-color: var(--primary) !important;
          border-radius: 3px 3px 0 0 !important;
        }
        .tab-badge {
          font-size: 9px !important;
          background-color: #F3F4F6 !important;
          color: #9CA3AF !important;
          padding: 2px 6px !important;
          border-radius: 20px !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: .5px !important;
        }
        .search-inputs-row-wrapper {
          display: flex !important;
          gap: 16px !important;
          width: 100% !important;
          align-items: center !important;
          box-sizing: border-box !important;
        }
        .search-inputs-row {
          display: flex !important;
          gap: 16px !important;
          align-items: center !important;
          flex: 1 !important;
          box-sizing: border-box !important;
        }
        .search-input-field {
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
          border: 1.5px solid var(--border-soft) !important;
          border-radius: 10px !important;
          height: 60px !important;
          padding: 0 16px !important;
          background-color: #F8FAFC !important;
          transition: border-color .2s, background-color .2s, box-shadow .2s !important;
          cursor: pointer !important;
          user-select: none !important;
          box-sizing: border-box !important;
        }
        .search-input-field:hover, .search-input-field.active-field {
          border-color: var(--primary) !important;
          background-color: #fff !important;
          box-shadow: 0 10px 25px rgba(0, 164, 166, 0.08) !important;
        }
        .search-input-field.flex-wide { flex: 1.5 !important; }
        .search-input-field.flex-standard { flex: 1 !important; }

        .input-double-label {
          display: flex !important;
          flex-direction: column !important;
          gap: 2px !important;
          text-align: left !important;
          overflow: hidden !important;
          width: 100% !important;
        }
        .input-double-label .sub-label {
          font-size: 11px !important;
          font-weight: 800 !important;
          color: var(--text-muted) !important;
          text-transform: uppercase !important;
          letter-spacing: .5px !important;
        }
        .input-double-label .main-label {
          font-size: 16px !important;
          font-weight: 800 !important;
          color: #3F536C !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }
        .search-submit-btn {
          background-color: var(--primary) !important;
          color: #fff !important;
          border: none !important;
          height: 60px !important;
          padding: 0 40px !important;
          border-radius: 30px !important;
          font-size: 18px !important;
          font-weight: 800 !important;
          cursor: pointer !important;
          transition: background-color .2s, transform .1s, box-shadow .2s !important;
          flex-shrink: 0 !important;
          box-shadow: 0 4px 14px rgba(0, 164, 166, 0.2) !important;
        }
        .search-submit-btn:hover {
          background-color: var(--primary-hover) !important;
        }

        .dropdown-items-scroll {
          max-height: 290px !important;
          overflow-y: auto !important;
          box-sizing: border-box !important;
        }
        .dropdown-search-wrapper {
          position: relative !important;
          padding: 12px 16px !important;
          border-bottom: 1.5px solid var(--border-soft) !important;
          background-color: #fff !important;
        }
        .dropdown-search-input {
          width: 100% !important;
          height: 40px !important;
          border: 1.5px solid var(--border-soft) !important;
          border-radius: 10px !important;
          padding: 0 16px 0 40px !important;
          font-size: 14px !important;
          color: #0f172a !important;
          outline: none !important;
          box-sizing: border-box !important;
        }
        .dropdown-select-all {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          padding: 0 20px !important;
          height: 48px !important;
          cursor: pointer !important;
          border-bottom: 1.5px solid var(--border-soft) !important;
          box-sizing: border-box !important;
        }
        .dropdown-select-all-text {
          font-size: 13px !important;
          font-weight: 800 !important;
          color: var(--primary) !important;
        }
        .dropdown-item {
          display: flex !important;
          align-items: center !important;
          padding: 12px 20px !important;
          cursor: pointer !important;
          border-bottom: 1px solid #e2e8f0 !important;
          width: 100% !important;
          box-sizing: border-box !important;
          gap: 14px !important;
        }
        .dropdown-item-left {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          color: #475569 !important;
          flex-shrink: 0 !important;
        }
        .dropdown-item-left svg {
          width: 20px !important;
          height: 20px !important;
          fill: none !important;
          stroke: currentColor !important;
          stroke-width: 2 !important;
        }
        .dropdown-item-content {
          display: flex !important;
          flex-direction: column !important;
          gap: 2px !important;
          text-align: left !important;
        }
        .dropdown-item-title {
          font-size: 14px !important;
          font-weight: 700 !important;
          color: #3F536C !important;
        }
        .dropdown-item-subtitle {
          font-size: 11px !important;
          font-weight: 500 !important;
          color: #64748b !important;
        }
        .dropdown-item.selected, .dropdown-select-all.selected {
          background-color: var(--primary-light) !important;
        }
        .dropdown-item.selected .dropdown-item-title, .dropdown-select-all.selected .dropdown-select-all-text {
          color: var(--primary) !important;
          font-weight: 800 !important;
        }

        /* СТИЛИ САЙДБАРА */
        .luxe-sidebar-map {
          width: 100% !important;
          height: 125px !important;
          border-radius: 14px !important;
          margin-bottom: 20px !important;
          overflow: hidden !important;
          border: 1px solid var(--border-soft) !important;
        }
        .luxe-sidebar-header {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          margin-bottom: 18px !important;
        }
        .luxe-sidebar-sub-count {
          font-size: 13px !important;
          font-weight: 600 !important;
          color: #64748b !important;
        }
        .luxe-sidebar-sub-count .orange-count {
          color: #FF9800 !important;
          font-weight: 800 !important;
        }
        
        /* СТИЛЬ КНОПКИ TEMIZLE В ШАПКЕ САЙДБАРА */
        .luxe-sidebar-header .clear-link {
          font-size: 12px !important;
          font-weight: 800 !important;
          color: var(--primary) !important;
          cursor: pointer !important;
          text-decoration: underline !important;
          transition: color .2s !important;
        }
        .luxe-sidebar-header .clear-link:hover {
          color: var(--primary-hover) !important;
        }

        .luxe-divider {
          height: 1px !important;
          background-color: var(--border-soft) !important;
          margin: 20px 0 !important;
        }
        .luxe-group {
          margin-bottom: 20px !important;
        }
        .luxe-group-label {
          font-size: 13px !important;
          font-weight: 950 !important;
          color: #3F536C !important;
          margin-bottom: 12px !important;
          display: block !important;
        }
        .luxe-range-inputs-row {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          gap: 8px !important;
          margin-bottom: 14px !important;
        }
        .luxe-oval-input {
          width: 45% !important;
          height: 34px !important;
          border: 1px solid var(--border-soft) !important;
          background-color: var(--bg-light) !important;
          border-radius: 17px !important;
          font-size: 13px !important;
          font-weight: 700 !important;
          color: #3F536C !important;
          text-align: center !important;
          outline: none !important;
          box-sizing: border-box !important;
          transition: border-color .2s, background-color .2s !important;
        }
        .luxe-oval-input:hover, .luxe-oval-input:focus {
          border-color: var(--primary) !important;
          background-color: #fff !important;
        }
        .luxe-range-separator {
          font-size: 14px !important;
          font-weight: 700 !important;
          color: var(--text-muted) !important;
        }
        
        /* СТИЛЬ БЛОКОВ ПОЛЕЙ ВВОДА ЦЕНЫ */
        .price-live-display {
          font-size: 13.5px !important;
          font-weight: 700 !important;
          color: var(--primary) !important;
          margin-bottom: 12px !important;
          display: block !important;
        }
        .price-inputs-container {
          display: flex !important;
          gap: 6px !important;
          align-items: stretch !important;
          width: 100% !important;
          margin-top: 15px !important;
        }
        .price-input-box {
          flex: 1 !important;
          background-color: var(--bg-light) !important;
          border: 1px solid var(--border-soft) !important;
          border-radius: 10px !important;
          padding: 6px 12px !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 2px !important;
          box-sizing: border-box !important;
        }
        .price-box-label {
          font-size: 10px !important;
          font-weight: 800 !important;
          color: var(--text-muted) !important;
          text-transform: uppercase !important;
        }
        .price-box-input-wrap {
          display: flex !important;
          align-items: center !important;
          gap: 4px !important;
          width: 100% !important;
        }
        .price-box-input {
          width: 100% !important;
          border: none !important;
          background: transparent !important;
          font-size: 13px !important;
          font-weight: 800 !important;
          color: #3F536C !important;
          padding: 0 !important;
          outline: none !important;
        }
        .price-currency {
          font-size: 11px !important;
          font-weight: 800 !important;
          color: var(--text-muted) !important;
        }

        /* ТЕГИ И ЧЕКБОКСЫ */
        .luxe-tags {
          display: flex !important;
          flex-direction: row !important;
          flex-wrap: wrap !important;
          gap: 8px !important;
          width: 100% !important;
          box-sizing: border-box !important;
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
          font-weight: 700 !important;
        }
        .luxe-checkboxes {
          display: flex !important;
          flex-direction: column !important;
          gap: 12px !important;
        }
        .luxe-checkbox-item {
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
          cursor: pointer !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          color: var(--text-main) !important;
          user-select: none !important;
        }
        .luxe-radio-dot {
          width: 18px !important;
          height: 18px !important;
          border: 1.5px solid var(--border-soft) !important;
          border-radius: 50% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          background-color: #fff !important;
          transition: all .2s !important;
        }
        .luxe-checkbox-item:hover .luxe-radio-dot, .luxe-checkbox-item.checked .luxe-radio-dot {
          border-color: var(--primary) !important;
        }
        .luxe-checkbox-item.checked .luxe-radio-dot {
          background-color: var(--primary) !important;
        }
        .luxe-radio-dot::after {
          content: '' !important;
          width: 6px !important;
          height: 6px !important;
          background-color: #fff !important;
          border-radius: 50% !important;
          display: none !important;
        }
        .luxe-checkbox-item.checked .luxe-radio-dot::after {
          display: block !important;
        }

        /* КАТАЛОГ И КАРТОЧКИ ОБЪЕКТОВ */
        #catalog-content-wrapper {
          position: relative !important;
          display: block !important;
          width: auto !important;
          z-index: 10 !important;
        }
        .catalog-control-bar {
          display: flex !important;
          justify-content: flex-end !important;
          align-items: center !important;
          margin-bottom: 25px !important;
          width: 100% !important;
          border-bottom: 1px solid var(--border-soft) !important;
          padding-bottom: 12px !important;
        }
        .layout-toggle {
          display: flex !important;
          background-color: #f3f4f6 !important;
          padding: 4px !important;
          border-radius: 8px !important;
          gap: 2px !important;
        }
        .layout-toggle .toggle-btn {
          background: none !important;
          border: none !important;
          padding: 6px 12px !important;
          border-radius: 6px !important;
          cursor: pointer !important;
          color: #9ca3af !important;
          transition: all .2s ease !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .layout-toggle .toggle-btn.active {
          background-color: #fff !important;
          color: var(--primary) !important;
          box-shadow: 0 1px 3px rgba(45,55,72,.1) !important;
        }
        .toggle-icon {
          width: 18px !important;
          height: 18px !important;
          fill: currentColor !important;
        }

        .btn {
          padding: 10px 14px !important;
          border-radius: 8px !important;
          font-size: 13px !important;
          font-weight: 700 !important;
          text-decoration: none !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 6px !important;
          transition: all .2s ease !important;
          box-sizing: border-box !important;
        }
        .btn-primary {
          background-color: var(--primary) !important;
          color: #fff !important;
          border: 2px solid var(--primary) !important;
        }
        .btn-primary:hover {
          background-color: var(--primary-hover) !important;
          border-color: var(--primary-hover) !important;
        }
        .btn-outline {
          background-color: transparent !important;
          color: #3F536C !important;
          border: 2px solid var(--border-soft) !important;
        }
        .btn-outline:hover {
          border-color: var(--primary) !important;
          color: var(--primary) !important;
        }

        /* GRID / LIST LAYOUTS */
        .grid-layout {
          display: grid !important;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)) !important;
          gap: 30px !important;
          width: 100% !important;
        }
        .list-layout {
          display: flex !important;
          flex-direction: column !important;
          gap: 24px !important;
          width: 100% !important;
        }

        .custom-card {
          background: #fff !important;
          border-radius: 16px !important;
          border: 1.5px solid var(--border-soft) !important;
          overflow: hidden !important;
          box-shadow: var(--shadow-premium) !important;
          display: flex !important;
          transition: transform .3s ease, box-shadow .3s ease !important;
        }
        .grid-layout .custom-card {
          flex-direction: column !important;
          height: 100% !important;
        }
        .list-layout .custom-card {
          flex-direction: row !important;
          width: 100% !important;
        }
        .custom-card:hover {
          transform: translateY(-5px) !important;
          box-shadow: 0 12px 25px rgba(0,164,166,.45) !important;
        }
        .custom-card .img-container {
          position: relative !important;
          overflow: hidden !important;
          cursor: zoom-in !important;
        }
        .grid-layout .custom-card .img-container {
          height: 200px !important;
          width: 100% !important;
        }
        .list-layout .custom-card .img-container {
          width: 320px !important;
          min-width: 320px !important;
          height: 250px !important;
        }

        .custom-card .badge {
          position: absolute !important;
          top: 15px !important;
          left: 15px !important;
          color: #fff !important;
          padding: 6px 12px !important;
          border-radius: 20px !important;
          font-size: 10px !important;
          font-weight: 800 !important;
          text-transform: uppercase !important;
          z-index: 10 !important;
          box-shadow: 0 4px 10px rgba(0,0,0,.15) !important;
        }

        .custom-card .card-content {
          padding: 20px !important;
          display: flex !important;
          flex-direction: column !important;
          flex-grow: 1 !important;
        }
        .custom-card .title-price-row {
          display: flex !important;
          flex-direction: column !important;
          margin-bottom: 8px !important;
        }
        .list-layout .custom-card .title-price-row {
          flex-direction: row !important;
          justify-content: space-between !important;
          align-items: flex-start !important;
          width: 100% !important;
          gap: 16px !important;
          box-sizing: border-box !important;
        }
        .custom-card .card-title {
          font-size: 18px !important;
          font-weight: 800 !important;
          margin: 0 0 6px 0 !important;
          color: #3F536C !important;
        }
        .custom-card .card-price {
          font-size: 20px !important;
          font-weight: 950 !important;
          color: var(--primary) !important;
          margin-bottom: 12px !important;
        }
        
        .list-layout .custom-card .card-description {
          display: block !important;
          font-size: 13.5px !important;
          color: var(--text-muted) !important;
          margin-bottom: 12px !important;
          line-height: 1.5 !important;
        }

        .custom-card .features-row {
          display: flex !important;
          gap: 10px !important;
          margin-bottom: 10px !important;
          border-top: 1px solid var(--border-soft) !important;
          padding-top: 12px !important;
        }
        .custom-card .feat-badge {
          background: var(--bg-light) !important;
          padding: 6px 10px !important;
          border-radius: 8px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          color: var(--text-muted) !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 6px !important;
        }
        .custom-card .feat-badge svg {
          width: 14px !important;
          height: 14px !important;
        }
        .custom-card .olanaklar-row {
          display: flex !important;
          flex-wrap: wrap !important;
          gap: 6px !important;
          margin-bottom: 20px !important;
          margin-top: auto !important;
        }
        .olanak-tag {
          font-size: 11px !important;
          font-weight: 700 !important;
          color: var(--primary) !important;
          background-color: rgba(0,164,166,0.06) !important;
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
        }
        .custom-card .actions {
          display: flex !important;
          gap: 10px !important;
          margin-top: auto !important;
          width: 100% !important;
        }
        .custom-card .actions .btn {
          flex: 1 !important;
        }

        /* ПАГИНАЦИЯ */
        .pagination-container {
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          gap: 8px !important;
          margin-top: 40px !important;
          margin-bottom: 30px !important;
          width: 100% !important;
          user-select: none !important;
        }
        .pagination-item {
          min-width: 40px !important;
          height: 40px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border: 1px solid #00A4A6 !important;
          border-radius: 5px !important;
          color: #00A4A6 !important;
          background: #fff !important;
          cursor: pointer !important;
          font-weight: 600 !important;
          font-size: 14px !important;
        }
        .pagination-item:hover, .pagination-item.active {
          background: #00A4A6 !important;
          color: #fff !important;
        }

        /* ABOUT US (V1) */
        #about-us-container {
          margin-top: 50px !important;
          width: 100% !important;
          overflow: hidden !important;
          border-radius: var(--radius-bubble) !important;
        }
        .v1-section {
          background-color: var(--bg-light) !important;
          border-radius: var(--radius-bubble) !important;
          padding: 70px 50px !important;
          box-shadow: var(--shadow-premium) !important;
          border: 1.5px solid var(--border-soft) !important;
          box-sizing: border-box !important;
          width: 100% !important;
        }
        .v1-intro {
          text-align: center !important;
          max-width: 850px !important;
          margin: 0 auto 60px auto !important;
        }
        .v1-badge {
          color: var(--primary) !important;
          font-weight: 900 !important;
          font-size: 12px !important;
          text-transform: uppercase !important;
          letter-spacing: 2px !important;
          display: inline-block !important;
          background-color: rgba(0,164,166,.06) !important;
          padding: 6px 18px !important;
          border-radius: 30px !important;
          margin-bottom: 15px !important;
        }
        .v1-title {
          font-size: 38px !important;
          font-weight: 900 !important;
          color: #3F536C !important;
          margin: 0 0 20px 0 !important;
          line-height: 1.2 !important;
        }
        .v1-title span { color: var(--primary) !important; }
        .v1-desc {
          font-size: 16px !important;
          color: var(--text-muted) !important;
          line-height: 1.6 !important;
        }
        .v1-grid {
          display: grid !important;
          grid-template-columns: repeat(3, 1fr) !important;
          gap: 30px !important;
          margin-bottom: 50px !important;
        }
        .v1-card {
          background-color: #fff !important;
          border: 1.5px solid var(--border-soft) !important;
          border-radius: var(--radius-bubble) !important;
          padding: 40px 30px !important;
          box-sizing: border-box !important;
        }
        .v1-icon-box {
          width: 64px !important;
          height: 64px !important;
          background-color: var(--bg-light) !important;
          border-radius: 50% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          color: var(--primary) !important;
          margin-bottom: 25px !important;
        }
        .v1-icon-box svg {
          width: 28px !important;
          height: 28px !important;
          fill: none !important;
          stroke: currentColor !important;
          stroke-width: 2.5 !important;
        }
        .v1-card-title {
          font-size: 20px !important;
          font-weight: 850 !important;
          color: #3F536C !important;
          margin: 0 0 12px 0 !important;
        }
        .v1-card-desc {
          font-size: 14px !important;
          color: var(--text-muted) !important;
          line-height: 1.6 !important;
        }
        .v1-footer-panel {
          background-color: #fff !important;
          border-radius: var(--radius-bubble) !important;
          padding: 35px 40px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          gap: 30px !important;
          border: 1px dashed var(--border-soft) !important;
        }
        .v1-footer-text h4 {
          font-size: 18px !important;
          font-weight: 850 !important;
          color: #3F536C !important;
          margin: 0 0 6px 0 !important;
        }
        .v1-footer-text p {
          font-size: 14px !important;
          color: var(--text-muted) !important;
        }
        .kb-btn {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 8px !important;
          padding: 14px 30px !important;
          border-radius: 30px !important;
          font-size: 14px !important;
          font-weight: 800 !important;
          text-decoration: none !important;
          cursor: pointer !important;
        }
        .kb-btn-wa {
          background-color: #25D366 !important;
          color: #fff !important;
          box-shadow: 0 6px 18px rgba(37,211,102,.2) !important;
        }
        .kb-btn-wa:hover {
          background-color: #20ba5a !important;
        }

        /* МЕДИА-ЗАПРОСЫ */
        @media (max-width: 1024px) {
          .hero-search-title { display: none !important; }
          .mobile-only-title {
            display: block !important;
            font-size: 20px !important;
            font-weight: 800 !important;
            color: #ffffff !important;
            text-align: center !important;
            margin: 0 auto 20px auto !important;
            line-height: 1.3 !important;
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
          }
          .search-inputs-row {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            grid-template-rows: auto auto !important;
            gap: 0 !important;
            border: 1px solid var(--border-soft) !important;
            border-radius: 16px !important;
            overflow: visible !important;
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
            width: 100% !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
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

          /* МОБИЛЬНЫЕ ШТОРКИ ВЫПАДАЮЩИХ СПИСКОВ */
          .custom-dropdown {
            position: fixed !important;
            bottom: 0 !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            height: 100vh !important;
            border-radius: 0 !important;
            box-shadow: 0 -10px 40px rgba(15,23,42,0.15) !important;
            z-index: 100000005 !important;
            display: none !important;
            flex-direction: column !important;
            background-color: #fff !important;
            border: none !important;
            transform: translateY(100%);
            transition: transform .3s cubic-bezier(.16,1,.3,1) !important;
          }

          .custom-dropdown.active-mobile-modal {
            display: flex !important;
            transform: translateY(0) !important;
            z-index: 100000005 !important;
          }

          .custom-dropdown::before {
            content: '' !important;
            display: block !important;
            width: 40px !important;
            height: 4px !important;
            background-color: #cbd5e1 !important;
            border-radius: 2px !important;
            margin: 12px auto 8px auto !important;
            flex-shrink: 0 !important;
          }

          .dropdown-mobile-header {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            padding: 12px 20px !important;
            border-bottom: 1px solid var(--border-soft) !important;
            flex-shrink: 0 !important;
          }
          .dropdown-mobile-title {
            font-size: 16px !important;
            font-weight: 900 !important;
            color: #3F536C !important;
          }
          .dropdown-mobile-close {
            font-size: 24px !important;
            color: var(--text-muted) !important;
            cursor: pointer !important;
          }

          /* МОБИЛЬНЫЙ САЙДБАР */
          .luxe-sidebar {
            position: fixed !important;
            top: 0 !important;
            left: -320px !important;
            width: 300px !important;
            height: 100% !important;
            border-radius: 0 24px 24px 0 !important;
            z-index: 9999999 !important;
            box-shadow: 10px 0 30px rgba(15, 23, 42, .15) !important;
            display: flex !important;
            flex-direction: column !important;
            overflow: hidden !important;
            padding: 0 !important;
            transition: left .3s ease !important;
            background: #fff !important;
          }
          .luxe-sidebar.sidebar-mobile-show {
            left: 0 !important;
          }
          
          /* Мобильный футер */
          .luxe-sidebar-mobile-footer {
            display: flex !important;
            position: absolute !important;
            bottom: 0 !important;
            left: 0 !important;
            width: 100% !important;
            background-color: #fff !important;
            border-top: 1px solid var(--border-soft) !important;
            padding: 12px 20px !important;
            box-sizing: border-box !important;
            z-index: 110 !important;
            gap: 10px !important;
          }
          .luxe-sidebar-mobile-footer .c-button {
            flex: 1 !important;
            height: 42px !important;
            border-radius: 8px !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 13px !important;
            font-weight: 800 !important;
            text-decoration: none !important;
            box-sizing: border-box !important;
            border: none !important;
          }
          .luxe-sidebar-mobile-footer .c-button--primary {
            background-color: var(--primary) !important;
            color: #fff !important;
          }
          .luxe-sidebar-mobile-footer .c-button--transparent {
            background-color: transparent !important;
            color: var(--text-muted) !important;
            border: 1px solid var(--border-soft) !important;
          }

          .mobile-filter-floating-btn {
            display: flex !important;
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
            z-index: 99999 !important;
            text-transform: uppercase !important;
            font-size: 13px !important;
            letter-spacing: 0.5px !important;
            align-items: center !important;
            gap: 8px !important;
            cursor: pointer !important;
            border: none !important;
            white-space: nowrap !important;
          }
          .sidebar-mobile-close-btn {
            display: flex !important;
            width: 36px !important;
            height: 36px !important;
            background-color: rgba(207,212,218,0.3) !important;
            border-radius: 50% !important;
            align-items: center !important;
            justify-content: center !important;
            position: absolute !important;
            top: 15px !important;
            right: 20px !important;
            z-index: 101 !important;
            cursor: pointer !important;
            color: #3F536C !important;
            font-size: 22px !important;
          }
          .luxe-sidebar-scrollable-body {
            flex: 1 !important;
            overflow-y: auto !important;
            padding: 24px 20px 80px 20px !important;
            width: 100% !important;
          }
          #catalog-content-wrapper {
            margin-left: 0 !important;
          }
          
          .v1-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .v1-card {
            padding: 30px 20px !important;
            border-radius: 24px !important;
          }
          .v1-footer-panel {
            flex-direction: column !important;
            padding: 24px 20px !important;
          }

          .grid-layout, .list-layout {
            display: flex !important;
            flex-direction: column !important;
            gap: 24px !important;
            width: 100% !important;
          }
          .list-layout .custom-card {
            flex-direction: column !important;
          }
          .list-layout .custom-card .img-container {
            width: 100% !important;
            height: 200px !important;
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

    const sortedProperties = properties ? [...properties].sort((a, b) => {
      const idA = parseInt(a.id || a["Номер"]) || 0;
      const idB = parseInt(b.id || b["Номер"]) || 0;
      return idB - idA;
    }) : [];

    if (error) throw error

    return {
      props: {
        properties: sortedProperties,
        initialError: null,
      },
    }
  } catch (err) {
    console.error('❌ Supabase Veri Cekme Hatasi:', err);
    const errMsg = err && typeof err === 'object' ? err.message || JSON.stringify(err) : String(err);
    return {
      props: {
        properties: [],
        initialError: errMsg || 'Supabase connection failed',
      },
    }
  }
}
