import React, { useState, useEffect, useMemo, useRef } from 'react'
import Head from 'next/head'
import Script from 'next/script'
import { useRouter } from 'next/router'
import { supabase } from '../supabase'

import Header from '../components/Header'
import Footer from '../components/Footer'
import PropertyCard from '../components/PropertyCard'

// Стили CSS
const cssStyles = [
  ':root {',
  '  --primary: #00A4A6;',
  '  --primary-hover: #00898B;',
  '  --dark-slate: #1E293B;',
  '  --text-main: #1E293B !important;',
  '  --text-secondary: #475569 !important;',
  '  --text-muted: #64748B !important;',
  '  --border-soft: #E2E8F0;',
  '  --bg-light: #F8FAFC;',
  '  --shadow-premium: 0 10px 30px rgba(0, 164, 166, 0.06), 0 1px 3px rgba(0, 0, 0, 0.02);',
  '  --shadow-dropdown: 0 12px 32px rgba(15, 23, 42, 0.15);',
  '  --primary-light: rgba(0, 164, 166, 0.06);',
  '  --radius-bubble: 36px;',
  '  --font-main: "Mulish", sans-serif !important;',
  '}',
  '',
  'html, body, *, input, select, button, textarea {',
  '  font-family: var(--font-main) !important;',
  '  color: var(--text-secondary);',
  '  box-sizing: border-box !important;',
  '}',
  '',
  '/* Секция поиска */',
  '.hero-search-container {',
  '  background-color: var(--primary) !important;',
  '  padding: 60px 20px 70px 20px !important;',
  '  text-align: center !important;',
  '  position: relative !important;',
  '}',
  '.hero-search-title {',
  '  color: #ffffff !important;',
  '  font-size: 34px !important;',
  '  font-weight: 900 !important;',
  '  margin-bottom: 30px !important;',
  '  letter-spacing: -0.5px !important;',
  '}',
  '',
  '/* Дропдауны фильтрации */',
  '.custom-dropdown {',
  '  position: absolute !important;',
  '  background-color: #ffffff !important;',
  '  border-radius: 16px !important;',
  '  box-shadow: var(--shadow-dropdown) !important;',
  '  border: 1.5px solid var(--border-soft) !important;',
  '  padding: 8px 0 !important;',
  '  z-index: 99999 !important;',
  '  top: 105% !important;',
  '  left: 0 !important;',
  '  width: 100% !important;',
  '}',
  '.dropdown-item {',
  '  padding: 10px 16px !important;',
  '  font-size: 14px !important;',
  '  font-weight: 700 !important;',
  '  color: var(--text-secondary) !important;',
  '  cursor: pointer !important;',
  '  transition: all 0.15s ease !important;',
  '}',
  '.dropdown-item:hover {',
  '  background-color: var(--primary-light) !important;',
  '  color: var(--primary) !important;',
  '}',
  '',
  '/* Сетка ЦИАН с заполнением по ширине */',
  '.grid-layout {',
  '  display: grid !important;',
  '  grid-template-columns: repeat(auto-fill, minmax(227.5px, 1fr)) !important;',
  '  gap: 20px !important;',
  '  width: 100% !important;',
  '}',
  '.cian-card {',
  '  padding: 0 !important;',
  '  background: #ffffff !important;',
  '  border-radius: 16px !important;',
  '  border: 1px solid rgba(226, 232, 240, 0.8) !important;',
  '  overflow: hidden !important;',
  '  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.02) !important;',
  '  display: flex !important;',
  '  flex-direction: column !important;',
  '  transition: transform .25s ease, box-shadow .25s ease !important;',
  '  position: relative !important;',
  '  cursor: pointer !important;',
  '  text-decoration: none !important;',
  '}',
  '@media (min-width: 1025px) {',
  '  .grid-layout .cian-card {',
  '    width: 100% !important; /* Убрано фиксированное сжатие 227px, теперь карточка заполняет сетку */',
  '    height: 302.26px !important;',
  '  }',
  '  .cian-img-container {',
  '    height: 180.93px !important;',
  '    width: 100% !important;',
  '    margin: 0 !important;',
  '    padding: 0 !important;',
  '    border-radius: 16px 16px 0 0 !important; /* Скругление только вверху */',
  '  }',
  '  .cian-info {',
  '    padding: 12px 14px !important;',
  '    display: flex !important;',
  '    flex-direction: column !important;',
  '    justify-content: space-between !important;',
  '    box-sizing: border-box !important;',
  '    flex: 1 !important;',
  '  }',
  '}',
  '',
  '.cian-img {',
  '  position: absolute !important;',
  '  top: 0 !important;',
  '  left: 0 !important;',
  '  width: 100% !important;',
  '  height: 100% !important;',
  '  object-fit: cover !important;',
  '}',
  '.cian-card:hover {',
  '  transform: translateY(-5px) !important;',
  '  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.06) !important;',
  '}',
  '',
  '/* Сердечко */',
  '.card-fav-btn {',
  '  position: absolute !important;',
  '  top: 12px !important;',
  '  right: 12px !important;',
  '  width: 36px !important;',
  '  height: 36px !important;',
  '  border-radius: 50% !important;',
  '  background: rgba(15, 23, 42, 0.35) !important;',
  '  backdrop-filter: blur(4px) !important;',
  '  border: none !important;',
  '  color: #ffffff !important;',
  '  display: flex !important;',
  '  align-items: center !important;',
  '  justify-content: center !important;',
  '  cursor: pointer !important;',
  '  z-index: 10 !important;',
  '  transition: all 0.2s ease !important;',
  '}',
  '.card-fav-btn.liked {',
  '  color: #ff3b30 !important;',
  '  background: #ffffff !important;',
  '  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;',
  '}',
  '',
  '/* Текстовые поля в карточке */',
  '.cian-price {',
  '  font-size: 20px !important;',
  '  font-weight: 800 !important;',
  '  color: var(--text-main) !important;',
  '  line-height: 1.1 !important;',
  '}',
  '.cian-specs {',
  '  font-size: 13.5px !important;',
  '  font-weight: 500 !important;',
  '  color: var(--text-secondary) !important;',
  '  margin-top: 2px !important;',
  '}',
  '.cian-location {',
  '  font-size: 12.5px !important;',
  '  font-weight: 600 !important;',
  '  color: var(--text-secondary) !important;',
  '  display: inline-flex !important;',
  '  align-items: center !important;',
  '  gap: 6px !important;',
  '  margin-top: 4px !important;',
  '}',
  '.cian-geo-dot {',
  '  width: 8px !important;',
  '  height: 8px !important;',
  '  border-radius: 50% !important;',
  '  background-color: var(--primary) !important;',
  '}',
  '.cian-address {',
  '  font-size: 11.5px !important;',
  '  font-weight: 500 !important;',
  '  color: var(--text-muted) !important;',
  '  white-space: nowrap !important;',
  '  overflow: hidden !important;',
  '  text-overflow: ellipsis !important;',
  '  margin-top: 2px !important;',
  '}',
  '',
  '/* Личный кабинет */',
  '.cabinet-drawer {',
  '  position: fixed !important;',
  '  top: 0 !important;',
  '  right: -420px !important;',
  '  width: 400px !important;',
  '  height: 100vh !important;',
  '  background: #ffffff !important;',
  '  box-shadow: -10px 0 40px rgba(0, 0, 0, 0.15) !important;',
  '  z-index: 10000005 !important;',
  '  transition: right 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;',
  '  display: flex !important;',
  '  flex-direction: column !important;',
  '}',
  '.cabinet-drawer.open {',
  '  right: 0 !important;',
  '}',
  '.drawer-header {',
  '  padding: 24px !important;',
  '  border-bottom: 1px solid var(--border-soft) !important;',
  '  display: flex !important;',
  '  align-items: center !important;',
  '  justify-content: space-between !important;',
  '}',
  '.drawer-title {',
  '  font-size: 20px !important;',
  '  font-weight: 900 !important;',
  '  color: var(--text-main) !important;',
  '}',
  '.drawer-close {',
  '  background: none !important;',
  '  border: none !important;',
  '  font-size: 28px !important;',
  '  color: var(--text-muted) !important;',
  '  cursor: pointer !important;',
  '}',
  '.drawer-content {',
  '  flex: 1 !important;',
  '  overflow-y: auto !important;',
  '  padding: 24px !important;',
  '}',
  '',
  '/* Модалки */',
  '.modal-overlay {',
  '  position: fixed !important;',
  '  top: 0 !important;',
  '  left: 0 !important;',
  '  width: 100vw !important;',
  '  height: 100vh !important;',
  '  background: rgba(15, 23, 42, 0.6) !important;',
  '  backdrop-filter: blur(4px) !important;',
  '  z-index: 10000010 !important;',
  '  display: none !important;',
  '  align-items: center !important;',
  '  justify-content: center !important;',
  '}',
  '.modal-overlay.open {',
  '  display: flex !important;',
  '}',
  '.modal-card-box {',
  '  background: #ffffff !important;',
  '  width: 450px !important;',
  '  max-width: 90% !important;',
  '  border-radius: 20px !important;',
  '  padding: 32px !important;',
  '  box-shadow: 0 20px 50px rgba(0,0,0,0.15) !important;',
  '  position: relative !important;',
  '  text-align: center !important;',
  '}',
  '.modal-close-btn {',
  '  position: absolute !important;',
  '  top: 20px !important;',
  '  right: 20px !important;',
  '  background: none !important;',
  '  border: none !important;',
  '  font-size: 24px !important;',
  '  color: var(--text-muted) !important;',
  '  cursor: pointer !important;',
  '}',
  '.phone-highlight-block {',
  '  font-size: 20px !important;',
  '  font-weight: 800 !important;',
  '  color: var(--primary) !important;',
  '  background: rgba(0, 164, 166, 0.05) !important;',
  '  padding: 12px !important;',
  '  border-radius: 12px !important;',
  '  display: inline-block !important;',
  '  margin-bottom: 20px !important;',
  '}',
  '.modal-green-btn {',
  '  display: block !important;',
  '  width: 100% !important;',
  '  background: #25D366 !important;',
  '  color: #ffffff !important;',
  '  text-decoration: none !important;',
  '  padding: 14px !important;',
  '  border-radius: 12px !important;',
  '  font-weight: 800 !important;',
  '  font-size: 15px !important;',
  '}',
  '.lightbox-counter {',
  '  position: absolute !important;',
  '  bottom: 40px !important;',
  '  left: 50% !important;',
  '  transform: translateX(-50%) !important;',
  '  color: #fff !important;',
  '  font-size: 15px !important;',
  '  font-weight: 800 !important;',
  '  z-index: 101 !important;',
  '  background-color: rgba(30, 41, 59, 0.85) !important;',
  '  padding: 8px 18px !important;',
  '  border-radius: 30px !important;',
  '  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;',
  '  backdrop-filter: blur(4px) !important;',
  '}',
  '',
  '/* Адаптивность */',
  '@media (max-width: 1024px) {',
  '  .hero-search-container { padding: 100px 16px 40px 16px !important; }',
  '  .grid-layout { grid-template-columns: 1fr !important; gap: 24px !important; }',
  '}'
].join('\n');

export default function Home({ properties = [], initialError }) {
  const router = useRouter()

  // Избранное и модалки
  const [favorites, setFavorites] = useState([])
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false)
  const [isPostModalOpen, setIsPostModalOpen] = useState(false)
  
  // Параметры поиска
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedRooms, setSelectedRooms] = useState('')
  const [activeStatusFilter, setActiveStatusFilter] = useState('')

  // Активный дропдаун
  const [openDropdown, setOpenDropdown] = useState(null)

  // Lightbox
  const [lightboxProperty, setLightboxProperty] = useState(null)
  const [lightboxImageIdx, setLightboxImageIdx] = useState(0)

  const searchContainerRef = useRef(null)

  // Клик вне меню закрывает выпадающие списки
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Синхронизация избранного из localStorage
  useEffect(() => {
    const stored = localStorage.getItem('lansmanbul_favorites')
    if (stored) {
      try {
        setFavorites(JSON.parse(stored))
      } catch (err) {
        console.error(err)
      }
    }
  }, [])

  // Изменение статуса через URL query
  useEffect(() => {
    if (router.query.status) {
      setActiveStatusFilter(String(router.query.status))
    } else {
      setActiveStatusFilter('')
    }
  }, [router.query.status])

  const toggleLike = (e, id) => {
    if (e) e.stopPropagation()
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      localStorage.setItem('lansmanbul_favorites', JSON.stringify(next))
      return next
    })
  }

  // Динамические списки для фильтров
  const districts = useMemo(() => {
    const set = new Set(properties.map((p) => p.district).filter(Boolean))
    return Array.from(set)
  }, [properties])

  const roomsList = useMemo(() => {
    const set = new Set(properties.map((p) => p.rooms).filter(Boolean))
    return Array.from(set).sort()
  }, [properties])

  // Фильтрация объектов
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      if (activeStatusFilter && p.status?.toLowerCase() !== activeStatusFilter.toLowerCase()) {
        return false
      }
      if (selectedDistrict && p.district?.toLowerCase() !== selectedDistrict.toLowerCase()) {
        return false
      }
      if (selectedRooms && String(p.rooms) !== String(selectedRooms)) {
        return false
      }
      return true
    })
  }, [properties, activeStatusFilter, selectedDistrict, selectedRooms])

  const favoriteProperties = useMemo(() => {
    return properties.filter((p) => favorites.includes(p.id))
  }, [properties, favorites])

  const openLightbox = (property, index = 0) => {
    setLightboxProperty(property)
    setLightboxImageIdx(index)
  }

  const nextLightboxImage = () => {
    if (!lightboxProperty) return
    const imgs = lightboxProperty.images || []
    setLightboxImageIdx((prev) => (prev + 1) % (imgs.length || 1))
  }

  const prevLightboxImage = () => {
    if (!lightboxProperty) return
    const imgs = lightboxProperty.images || []
    setLightboxImageIdx((prev) => (prev + imgs.length - 1) % (imgs.length || 1))
  }

  return (
    <>
      <Head>
        <title>Lansmanbul - Konut Projeleri Platformu</title>
        <meta name="description" content="En yeni konut projelerini doğrudan geliştiriciden bulun." />
        <link href="https://fonts.googleapis.com/css2?family=Mulish:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      <Header 
        favoritesCount={favorites.length}
        onOpenFavorites={() => setIsFavoritesOpen(true)}
        onOpenPostModal={() => setIsPostModalOpen(true)}
      />

      <main className="tilda-catalog-wrapper" style={{ marginTop: '90px', minHeight: '80vh', backgroundColor: '#f8fafc', paddingBottom: '80px' }}>
        
        {/* ХЕРО-блок */}
        <div className="hero-search-container">
          <h1 className="hero-search-title">Hayalinizdeki Evi Keşfedin</h1>
          
          {/* ТРИ отдельных интерактивных элемента на белом фоне */}
          <div ref={searchContainerRef} style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', maxWidth: '900px', margin: '0 auto' }}>
            
            {/* 1. Элемент: Выбор региона */}
            <div 
              onClick={() => setOpenDropdown(openDropdown === 'district' ? null : 'district')} 
              style={{ flex: '1', minWidth: '220px', backgroundColor: '#fff', borderRadius: '12px', border: '1.5px solid var(--border-soft)', padding: '12px 16px', position: 'relative', boxShadow: 'var(--shadow-premium)', cursor: 'pointer', textAlign: 'left' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>📍</span>
                <div className="input-double-label">
                  <span className="sub-label">Bölge Seçiniz</span>
                  <span className="main-label">{selectedDistrict || 'Tüm Bölgeler'}</span>
                </div>
              </div>
              
              {openDropdown === 'district' && (
                <div className="custom-dropdown">
                  <div className="dropdown-item" onClick={(e) => { e.stopPropagation(); setSelectedDistrict(''); setOpenDropdown(null); }}>Tüm Bölgeler</div>
                  {districts.map((d) => (
                    <div key={d} className="dropdown-item" onClick={(e) => { e.stopPropagation(); setSelectedDistrict(d); setOpenDropdown(null); }}>{d}</div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Элемент: Выбор комнат */}
            <div 
              onClick={() => setOpenDropdown(openDropdown === 'rooms' ? null : 'rooms')} 
              style={{ flex: '1', minWidth: '220px', backgroundColor: '#fff', borderRadius: '12px', border: '1.5px solid var(--border-soft)', padding: '12px 16px', position: 'relative', boxShadow: 'var(--shadow-premium)', cursor: 'pointer', textAlign: 'left' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>🔑</span>
                <div className="input-double-label">
                  <span className="sub-label">Oda Sayısı</span>
                  <span className="main-label">{selectedRooms || 'Tüm Odalar'}</span>
                </div>
              </div>

              {openDropdown === 'rooms' && (
                <div className="custom-dropdown">
                  <div className="dropdown-item" onClick={(e) => { e.stopPropagation(); setSelectedRooms(''); setOpenDropdown(null); }}>Tüm Odalar</div>
                  {roomsList.map((r) => (
                    <div key={r} className="dropdown-item" onClick={(e) => { e.stopPropagation(); setSelectedRooms(r); setOpenDropdown(null); }}>{r}</div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Элемент: Статус проекта */}
            <div 
              onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')} 
              style={{ flex: '1', minWidth: '220px', backgroundColor: '#fff', borderRadius: '12px', border: '1.5px solid var(--border-soft)', padding: '12px 16px', position: 'relative', boxShadow: 'var(--shadow-premium)', cursor: 'pointer', textAlign: 'left' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>📊</span>
                <div className="input-double-label">
                  <span className="sub-label">Proje Durumu</span>
                  <span className="main-label">{activeStatusFilter || 'Tüm Durumlar'}</span>
                </div>
              </div>

              {openDropdown === 'status' && (
                <div className="custom-dropdown">
                  <div className="dropdown-item" onClick={(e) => { e.stopPropagation(); setActiveStatusFilter(''); setOpenDropdown(null); }}>Tüm Durumlar</div>
                  <div className="dropdown-item" onClick={(e) => { e.stopPropagation(); setActiveStatusFilter('Lansman'); setOpenDropdown(null); }}>Lansman</div>
                  <div className="dropdown-item" onClick={(e) => { e.stopPropagation(); setActiveStatusFilter('Devam ediyor'); setOpenDropdown(null); }}>Devam ediyor</div>
                  <div className="dropdown-item" onClick={(e) => { e.stopPropagation(); setActiveStatusFilter('Tamamlandı'); setOpenDropdown(null); }}>Tamamlandı</div>
                </div>
              )}
            </div>

          </div>

          {/* Фирменная градиентная линия под блоками */}
          <div style={{ maxWidth: '900px', margin: '24px auto 0 auto', height: '4px', background: 'linear-gradient(90deg, #B2EBF2 0%, #00A4A6 100%)', borderRadius: '2px' }} />

        </div>

        {/* Сетка объявлений */}
        <div style={{ maxWidth: '1200px', margin: '40px auto 0 auto', padding: '0 20px' }}>
          {initialError && (
            <div style={{ padding: '20px', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '12px', marginBottom: '20px', fontWeight: 'bold' }}>
              Hata: {initialError}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)' }}>
              {activeStatusFilter ? `${activeStatusFilter} Projeleri` : 'Tüm Projeler'} ({filteredProperties.length})
            </h2>
            {(selectedDistrict || selectedRooms || activeStatusFilter) && (
              <button 
                onClick={() => {
                  setSelectedDistrict('')
                  setSelectedRooms('')
                  router.push('/', undefined, { shallow: true })
                }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '800', cursor: 'pointer' }}
              >
                Filtreleri Temizle
              </button>
            )}
          </div>

          {filteredProperties.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '18px', fontWeight: '700' }}>Aradığınız kriterlere uygun ilan bulunamadı.</p>
            </div>
          ) : (
            <div className="grid-layout">
              {filteredProperties.map((item) => (
                <PropertyCard 
                  key={item.id}
                  property={item}
                  isLiked={favorites.includes(item.id)}
                  onToggleLike={toggleLike}
                  onOpenLightbox={openLightbox}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Ящик избранного */}
      <div className={`cabinet-drawer ${isFavoritesOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <span className="drawer-title" style={{ color: 'var(--text-main)' }}>Favorilerim ({favorites.length})</span>
          <button className="drawer-close" onClick={() => setIsFavoritesOpen(false)}>&times;</button>
        </div>
        <div className="drawer-content">
          {favoriteProperties.length === 0 ? (
            <div className="drawer-empty-placeholder">
              <p style={{ color: 'var(--text-muted)' }}>Favori ilanınız bulunmuyor.</p>
            </div>
          ) : (
            <div className="fav-list">
              {favoriteProperties.map((item) => (
                <div key={item.id} style={{ display: 'flex', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border-soft)', cursor: 'pointer' }} onClick={() => { setIsFavoritesOpen(false); openLightbox(item); }}>
                  <img src={item.images?.[0] || 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=150&q=80'} style={{ width: '80px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} alt="" />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>{item.title}</h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--primary)', fontWeight: '900' }}>{item.price}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Подача объявлений */}
      <div className={`modal-overlay ${isPostModalOpen ? 'open' : ''}`}>
        <div className="modal-card-box">
          <button className="modal-close-btn" onClick={() => setIsPostModalOpen(false)}>&times;</button>
          <h3 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '16px', color: 'var(--text-main)' }}>Ücretsiz İlan Ver</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.5' }}>
            Projenizi veya mülkünüzü sitemizde ücretsiz yayınlamak için WhatsApp üzerinden müşteri temsilcimizle doğrudan iletişime geçebilirsiniz.
          </p>
          <div className="phone-highlight-block">+90 545 941 85 36</div>
          <a href="https://wa.me/905459418536" target="_blank" rel="noopener noreferrer" className="modal-green-btn">
            WhatsApp ile İletişime Geç
          </a>
        </div>
      </div>

      {/* Lightbox слайдер */}
      {lightboxProperty && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.95)', zIndex: 100000000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#fff', fontSize: '36px', cursor: 'pointer' }} onClick={() => setLightboxProperty(null)}>&times;</button>
          
          {(lightboxProperty.images?.length || 0) > 1 && (
            <>
              <button onClick={prevLightboxImage} style={{ position: 'absolute', left: '20px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', width: '50px', height: '50px', borderRadius: '50%', fontSize: '24px', cursor: 'pointer' }}>❮</button>
              <button onClick={nextLightboxImage} style={{ position: 'absolute', right: '20px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', width: '50px', height: '50px', borderRadius: '50%', fontSize: '24px', cursor: 'pointer' }}>❯</button>
            </>
          )}

          <div style={{ maxWidth: '90%', maxHeight: '80%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img 
              src={(lightboxProperty.images || [])[lightboxImageIdx] || 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80'} 
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '12px' }} 
              alt="" 
            />
            <div style={{ marginTop: '20px', textAlign: 'center', color: '#fff', maxWidth: '600px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 8px 0', color: '#fff !important' }}>{lightboxProperty.price}</h2>
              <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 8px 0', color: '#fff !important' }}>{lightboxProperty.title}</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>{lightboxProperty.rooms} · {lightboxProperty.area} m² · {lightboxProperty.district}</p>
            </div>
          </div>

          <div className="lightbox-counter">
            {lightboxImageIdx + 1} / {lightboxProperty.images?.length || 1}
          </div>
        </div>
      )}

      <Footer />
      <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
    </>
  )
}

export async function getServerSideProps() {
  try {
    const { data: properties, error } = await supabase
      .from('properties')
      .select('*')

    if (error) throw error

    const sortedProperties = Array.isArray(properties) ? [...properties].sort((a, b) => {
      const idA = parseInt(a.id || a["Номер"]) || 0;
      const idB = parseInt(b.id || b["Номер"]) || 0;
      return idB - idA;
    }) : [];

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
