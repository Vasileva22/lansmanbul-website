import React, { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { supabase } from '../supabase'

import Header from '../components/Header'
import Footer from '../components/Footer'
import PropertyCard from '../components/PropertyCard'

// Новые точные стили: укороченная карточка, крупное квадратное фото, чистые шрифты
const cssStyles = [
  ':root {',
  '  --primary: #00A4A6;',
  '  --primary-hover: #00898B;',
  '  --dark-slate: #1E293B;',
  '  --text-main: #334155 !important;',
  '  --text-secondary: #475569 !important;',
  '  --text-muted: #64748B !important;',
  '  --border-soft: #CBD5E1;',
  '  --bg-light: #F1F5F9;',
  '  --shadow-premium: 0 10px 30px rgba(0, 164, 166, 0.06), 0 1px 3px rgba(0, 0, 0, 0.02);',
  '  --shadow-dropdown: 0 12px 32px rgba(15, 23, 42, 0.18);',
  '  --primary-light: rgba(0, 164, 166, 0.06);',
  '  --radius-bubble: 36px;',
  '  --font-main: "Mulish", sans-serif !important;',
  '}',
  '',
  'html, body, *, input, select, button, textarea {',
  '  font-family: var(--font-main) !important;',
  '  box-sizing: border-box !important;',
  '}',
  '',
  '/* Секция поиска */',
  '.hero-search-container {',
  '  width: 100%;',
  '  padding: 35px 20px 25px 20px !important;',
  '  background-color: var(--bg-light);',
  '  display: flex;',
  '  justify-content: center;',
  '  box-sizing: border-box;',
  '}',
  '.search-width-limiter {',
  '  width: 100%;',
  '  max-width: 1140px;',
  '  display: flex;',
  '  flex-direction: column;',
  '  align-items: center;',
  '  box-sizing: border-box;',
  '}',
  '.hero-search-title {',
  '  font-size: 36px;',
  '  font-weight: 900;',
  '  color: #3F536C;',
  '  margin: 0 0 25px 0;',
  '  line-height: 1.3;',
  '  text-align: center;',
  '}',
  '',
  '.search-panel-card {',
  '  width: 100%;',
  '  background-color: #fff;',
  '  border-radius: 20px;',
  '  border: 1px solid var(--border-soft);',
  '  box-shadow: var(--shadow-premium);',
  '  padding: 24px 30px 32px 30px;',
  '  display: flex;',
  '  flex-direction: column;',
  '  gap: 20px;',
  '  position: relative;',
  '  box-sizing: border-box;',
  '}',
  '.panel-bottom-gradient {',
  '  position: absolute;',
  '  bottom: 0;',
  '  left: 0;',
  '  width: 100%;',
  '  height: 4px;',
  '  background: linear-gradient(to right, #7b1fa2, var(--primary), #ffb300);',
  '  border-radius: 0 0 20px 20px;',
  '}',
  '',
  '/* Табы городов */',
  '.search-tabs-header {',
  '  display: flex;',
  '  gap: 24px;',
  '  border-bottom: 1px solid var(--border-soft);',
  '  padding-bottom: 12px;',
  '  margin-bottom: 4px;',
  '  box-sizing: border-box;',
  '}',
  '.city-tab-item {',
  '  display: flex;',
  '  align-items: center;',
  '  gap: 8px;',
  '  font-size: 16px;',
  '  font-weight: 800;',
  '  color: var(--text-muted);',
  '  cursor: pointer;',
  '  position: relative;',
  '  padding-bottom: 12px;',
  '  margin-bottom: -13px;',
  '  transition: color .2s ease;',
  '  user-select: none;',
  '}',
  '.city-tab-item.active {',
  '  color: var(--primary);',
  '}',
  '.city-tab-item.active::after {',
  '  content: "";',
  '  position: absolute;',
  '  bottom: 0;',
  '  left: 0;',
  '  width: 100%;',
  '  height: 3px;',
  '  background-color: var(--primary);',
  '  border-radius: 3px 3px 0 0;',
  '}',
  '.city-tab-item.disabled {',
  '  color: #9CA3AF;',
  '  cursor: pointer;',
  '}',
  '.tab-badge {',
  '  font-size: 9px;',
  '  background-color: #F3F4F6;',
  '  color: #9CA3AF;',
  '  padding: 2px 6px;',
  '  border-radius: 20px;',
  '  font-weight: 700;',
  '  text-transform: uppercase;',
  '  letter-spacing: .5px;',
  '}',
  '',
  '/* Поля поиска */',
  '.search-inputs-row-wrapper {',
  '  display: flex;',
  '  gap: 16px;',
  '  width: 100%;',
  '  align-items: center;',
  '  box-sizing: border-box;',
  '}',
  '.search-inputs-row {',
  '  display: flex;',
  '  gap: 16px;',
  '  align-items: center;',
  '  flex: 1;',
  '  box-sizing: border-box;',
  '}',
  '.search-input-field {',
  '  display: flex;',
  '  align-items: center;',
  '  gap: 12px;',
  '  border: 1.5px solid var(--border-soft);',
  '  border-radius: 10px;',
  '  height: 60px;',
  '  padding: 0 16px;',
  '  background-color: #F8FAFC;',
  '  transition: border-color .2s, background-color .2s, box-shadow .2s;',
  '  cursor: pointer;',
  '  user-select: none;',
  '  box-sizing: border-box;',
  '  position: relative !important;',
  '}',
  '.search-input-field:hover, .search-input-field.active-field {',
  '  border-color: var(--primary) !important;',
  '  background-color: #fff !important;',
  '  box-shadow: 0 10px 25px rgba(0, 164, 166, 0.08) !important;',
  '}',
  '.search-input-field.flex-wide { flex: 1.5 !important; }',
  '.search-input-field.flex-standard { flex: 1 !important; }',
  '',
  '.input-icon-svg {',
  '  width: 18px;',
  '  height: 18px;',
  '  flex-shrink: 0;',
  '}',
  '.input-icon-svg.icon-fill { fill: var(--text-muted); }',
  '.input-icon-svg.icon-stroke { fill: none; stroke: var(--text-muted); stroke-width: 2; }',
  '',
  '.input-double-label {',
  '  display: flex;',
  '  flex-direction: column;',
  '  gap: 2px;',
  '  text-align: left;',
  '  overflow: hidden;',
  '  width: 100%;',
  '}',
  '.input-double-label .sub-label {',
  '  font-size: 11px;',
  '  font-weight: 800;',
  '  color: var(--text-muted);',
  '  text-transform: uppercase;',
  '}',
  '.input-double-label .main-label {',
  '  font-size: 14px;',
  '  font-weight: 800;',
  '  color: #3F536C;',
  '  white-space: nowrap;',
  '  overflow: hidden;',
  '  text-overflow: ellipsis;',
  '}',
  '',
  '.search-submit-btn {',
  '  background-color: var(--primary);',
  '  color: #fff;',
  '  border: none;',
  '  height: 60px;',
  '  padding: 0 40px;',
  '  border-radius: 30px;',
  '  font-size: 18px;',
  '  font-weight: 800;',
  '  cursor: pointer;',
  '  transition: background-color .2s, transform .1s;',
  '  flex-shrink: 0;',
  '}',
  '.search-submit-btn:hover { background-color: var(--primary-hover); }',
  '',
  '.custom-dropdown {',
  '  position: absolute !important;',
  '  background-color: #fff !important;',
  '  border-radius: 16px !important;',
  '  box-shadow: var(--shadow-dropdown) !important;',
  '  border: 1.5px solid var(--border-soft) !important;',
  '  padding: 0 !important;',
  '  z-index: 99999 !important;',
  '  display: block;',
  '  overflow-y: auto !important;',
  '  max-height: 250px !important;',
  '  top: 105% !important;',
  '  left: 0 !important;',
  '  width: 100% !important;',
  '}',
  '.dropdown-item {',
  '  padding: 12px 20px !important;',
  '  font-size: 14px !important;',
  '  font-weight: 700 !important;',
  '  color: #3F536C !important;',
  '  cursor: pointer !important;',
  '  transition: all 0.15s ease !important;',
  '}',
  '.dropdown-item:hover { background-color: #f8fafc !important; color: var(--primary) !important; }',
  '',
  '/* СЕТКА ГРИДА: Ровно 4 колонки в ряд на ширине 1440px */',
  '.grid-layout {',
  '  display: grid !important;',
  '  grid-template-columns: repeat(4, 1fr) !important;',
  '  width: 100% !important;',
  '  max-width: 1440px !important; /* Увеличено для максимальной сочности */',
  '  margin: 24px auto !important;',
  '  column-gap: 16px !important;',
  '  row-gap: 24px !important;',
  '  box-sizing: border-box !important;',
  '}',
  '',
  '/* КАРТОЧКА ОБЪЯВЛЕНИЯ: Новые пропорции за вычетом 20px высоты */',
  '.cian-card {',
  '  width: 100% !important;',
  '  aspect-ratio: 227.5 / 282.26 !important; /* Компактный и эстетичный вид */',
  '  height: auto !important;',
  '  padding: 0 !important;',
  '  margin: 0 !important;',
  '  background: #ffffff !important;',
  '  border-radius: 8px !important;',
  '  border: 0.666667px solid rgb(208, 216, 233) !important;',
  '  overflow: hidden !important;',
  '  display: flex !important;',
  '  flex-direction: column !important;',
  '  transition: transform .2s ease, box-shadow .2s ease !important;',
  '  position: relative !important;',
  '  cursor: pointer !important;',
  '  box-sizing: border-box !important;',
  '}',
  '.cian-card:hover {',
  '  transform: translateY(-4px) !important;',
  '  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08) !important;',
  '}',
  '',
  '/* КОНТЕЙНЕР КАРТИНКИ: Ровно 69.3% высоты (почти квадрат) */',
  '.cian-img-container {',
  '  width: 100% !important;',
  '  height: 69.3% !important; /* Увеличено, чтобы фото доминировало */',
  '  margin: 0 !important;',
  '  border-radius: 8px 8px 0 0 !important;',
  '  position: relative !important;',
  '  overflow: hidden !important;',
  '  flex-shrink: 0 !important;',
  '}',
  '.cian-img {',
  '  width: 100% !important;',
  '  height: 100% !important;',
  '  object-fit: cover !important;',
  '}',
  '',
  '/* БЛОК ИНФОРМАЦИИ: Ровно 30.7% высоты для плотного текста */',
  '.cian-info {',
  '  width: 100% !important;',
  '  height: 30.7% !important; /* Сокращено для исключения пустоты */',
  '  margin: 0 auto !important;',
  '  padding: 8px 14px 10px 14px !important; /* Плотный вертикальный padding */',
  '  display: flex !important;',
  '  flex-direction: column !important;',
  '  justify-content: space-between !important;',
  '  box-sizing: border-box !important;',
  '}',
  '',
  '/* КНОПКА ИЗБРАННОГО: 40px * 40px */',
  '.card-fav-btn {',
  '  position: absolute !important;',
  '  top: 12px !important;',
  '  right: 12px !important;',
  '  width: 40px !important;',
  '  height: 40px !important;',
  '  border-radius: 50% !important;',
  '  background: rgba(15, 23, 42, 0.4) !important;',
  '  backdrop-filter: blur(6px) !important;',
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
  '  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;',
  '}',
  '',
  '/* Статус-плашка */',
  '.card-status-badge {',
  '  position: absolute !important;',
  '  top: 12px !important;',
  '  left: 12px !important;',
  '  background-color: var(--primary) !important;',
  '  color: #ffffff !important;',
  '  padding: 4px 10px !important;',
  '  border-radius: 6px !important;',
  '  font-size: 11px !important;',
  '  font-weight: 800 !important;',
  '  text-transform: uppercase !important;',
  '  z-index: 10 !important;',
  '  box-shadow: 0 2px 8px rgba(0, 164, 166, 0.3) !important;',
  '}',
  '',
  '/* ЦЕНА ЦИАН: Шрифт Segoe UI / Apple-system, вес 700 (более строгий и аккуратный) */',
  '.cian-price {',
  '  width: 100% !important;',
  '  font-size: 22px !important; /* Крупный и сочный размер */',
  '  font-weight: 700 !important; /* Уменьшено с 800 до 700 для чистоты начертания */',
  '  font-family: system-ui, -apple-system, sans-serif !important; /* Шрифт ЦИАН */',
  '  color: #11162e !important;',
  '  white-space: nowrap !important;',
  '  overflow: hidden !important;',
  '  text-overflow: ellipsis !important;',
  '  letter-spacing: -0.5px !important;',
  '  line-height: 1.1 !important;',
  '}',
  '',
  '/* Характеристики: Крупнее (14px) и контрастнее */',
  '.cian-specs {',
  '  font-size: 14px !important; /* Увеличено с 13px */',
  '  font-weight: 500 !important;',
  '  color: #475569 !important; /* Более темный, читаемый серый цвет */',
  '  margin-top: 3px !important;',
  '  white-space: nowrap !important;',
  '  overflow: hidden !important;',
  '  text-overflow: ellipsis !important;',
  '}',
  '.cian-location {',
  '  font-size: 12px !important;',
  '  font-weight: 600 !important;',
  '  color: var(--text-muted) !important;',
  '  display: inline-flex !important;',
  '  align-items: center !important;',
  '  gap: 4px !important;',
  '  max-width: 100% !important;',
  '  overflow: hidden !important;',
  '  white-space: nowrap !important;',
  '  text-overflow: ellipsis !important;',
  '}',
  '.cian-address {',
  '  font-size: 11px !important;',
  '  font-weight: 500 !important;',
  '  color: var(--text-muted) !important;',
  '  white-space: nowrap !important;',
  '  overflow: hidden !important;',
  '  text-overflow: ellipsis !important;',
  '  margin-top: 2px !important;',
  '}',
  '',
  '/* Навигационные стрелочки */',
  '.slider-arrow {',
  '  position: absolute !important;',
  '  top: 50% !important;',
  '  transform: translateY(-50%) !important;',
  '  background: rgba(15, 23, 42, 0.4) !important;',
  '  color: #fff !important;',
  '  border: none !important;',
  '  width: 24px !important;',
  '  height: 24px !important;',
  '  border-radius: 50% !important;',
  '  cursor: pointer !important;',
  '  display: flex !important;',
  '  align-items: center !important;',
  '  justify-content: center !important;',
  '  font-size: 10px !important;',
  '  z-index: 5 !important;',
  '  opacity: 0;',
  '  transition: opacity 0.2s !important;',
  '}',
  '.cian-img-container:hover .slider-arrow { opacity: 1; }',
  '.arrow-left { left: 8px !important; }',
  '.arrow-right { right: 8px !important; }',
  '',
  '/* Пагинация */',
  '.pagination-container {',
  '  display: flex;',
  '  justify-content: center;',
  '  align-items: center;',
  '  gap: 8px;',
  '  margin-top: 40px;',
  '}',
  '.pagination-btn {',
  '  min-width: 40px;',
  '  height: 40px;',
  '  padding: 0 12px;',
  '  border-radius: 8px;',
  '  border: 1px solid var(--border-soft);',
  '  background-color: #fff;',
  '  color: var(--text-main);',
  '  font-size: 14px;',
  '  font-weight: 700;',
  '  cursor: pointer;',
  '  display: flex;',
  '  align-items: center;',
  '  justify-content: center;',
  '  transition: all 0.2s ease;',
  '}',
  '.pagination-btn:hover { border-color: var(--primary); color: var(--primary); }',
  '.pagination-btn.active { background-color: var(--primary); border-color: var(--primary); color: #fff; }',
  '.pagination-btn.disabled { opacity: 0.5; cursor: not-allowed; }',
  '',
  '/* Drawer */',
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
  '.cabinet-drawer.open { right: 0 !important; }',
  '.drawer-header { padding: 24px !important; border-bottom: 1px solid var(--border-soft) !important; display: flex !important; align-items: center !important; justify-content: space-between !important; }',
  '.drawer-title { font-size: 20px !important; font-weight: 900 !important; }',
  '.drawer-close { background: none !important; border: none !important; font-size: 28px !important; color: var(--text-muted) !important; cursor: pointer !important; }',
  '.drawer-content { flex: 1 !important; overflow-y: auto !important; padding: 24px !important; }',
  '',
  '/* АДАПТИВНОСТЬ (Mobile Friendly) */',
  '@media (max-width: 1024px) {',
  '  .hero-search-container { padding: 100px 16px 40px 16px !important; }',
  '  .search-panel-card { border-radius: 16px !important; padding: 16px !important; }',
  '  .search-inputs-row-wrapper { flex-direction: column !important; width: 100% !important; gap: 12px !important; }',
  '  .search-inputs-row { flex-direction: column !important; width: 100% !important; gap: 12px !important; }',
  '  .search-input-field { width: 100% !important; border: 1.5px solid var(--border-soft) !important; border-radius: 10px !important; }',
  '  .search-submit-btn { width: 100% !important; border-radius: 12px !important; margin: 0 !important; }',
  '}',
  '@media (max-width: 500px) {',
  '  .grid-layout {',
  '    grid-template-columns: 1fr !important;',
  '    padding: 0 16px !important;',
  '  }',
  '  .cian-card {',
  '    width: 100% !important;',
  '    aspect-ratio: auto !important;',
  '    height: auto !important;',
  '  }',
  '  .cian-img-container {',
  '    width: 100% !important;',
  '    height: 220px !important;',
  '    margin: 0 !important;',
  '    border-radius: 8px 8px 0 0 !important;',
  '  }',
  '  .cian-info {',
  '    width: calc(100% - 24px) !important;',
  '    height: auto !important;',
  '    padding: 12px 0 !important;',
  '    gap: 8px !important;',
  '  }',
  '}'
].join('\n');

export default function Home({ 
  properties = [], 
  totalCount = 0, 
  currentPage = 1, 
  totalPages = 1,
  cities = [],
  districts = [],
  roomsList = [],
  statuses = [],
  initialError 
}) {
  const router = useRouter()

  const [favorites, setFavorites] = useState([])
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false)
  const [isPostModalOpen, setIsPostModalOpen] = useState(false)
  
  const [selectedCity, setSelectedCity] = useState(router.query.city || '')
  const [selectedDistrict, setSelectedDistrict] = useState(router.query.district || '')
  const [selectedRooms, setSelectedRooms] = useState(router.query.rooms || '')
  const [activeStatusFilter, setActiveStatusFilter] = useState(router.query.status || '')

  const [openDropdown, setOpenDropdown] = useState(null)
  const [lightboxProperty, setLightboxProperty] = useState(null)
  const [lightboxImageIdx, setLightboxImageIdx] = useState(0)

  const searchContainerRef = useRef(null)

  useEffect(() => {
    setSelectedCity(router.query.city || '')
    setSelectedDistrict(router.query.district || '')
    setSelectedRooms(router.query.rooms || '')
    setActiveStatusFilter(router.query.status || '')
  }, [router.query])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('lansmanbul_favorites')
    if (stored) {
      try { setFavorites(JSON.parse(stored)) } catch (err) { console.error(err) }
    }
  }, [])

  const toggleLike = (e, id) => {
    if (e) e.stopPropagation()
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      localStorage.setItem('lansmanbul_favorites', JSON.stringify(next))
      return next
    })
  }

  const handleSearch = () => {
    setOpenDropdown(null)
    router.push({
      pathname: '/',
      query: {
        ...router.query,
        city: selectedCity,
        district: selectedDistrict,
        rooms: selectedRooms,
        status: activeStatusFilter,
        page: 1
      }
    }, undefined, { shallow: false })
  }

  const handlePageChange = (pageNum) => {
    if (pageNum < 1 || pageNum > totalPages) return
    router.push({
      pathname: '/',
      query: {
        ...router.query,
        page: pageNum
      }
    }, undefined, { shallow: false })
  }

  const handleResetFilters = () => {
    setSelectedCity('')
    setSelectedDistrict('')
    setSelectedRooms('')
    setActiveStatusFilter('')
    router.push('/', undefined, { shallow: false })
  }

  const openLightbox = (property, index = 0) => {
    setLightboxProperty(property)
    setLightboxImageIdx(index)
  }

  const nextLightboxImage = () => {
    if (!lightboxProperty) return
    const imgs = lightboxProperty.property_images || []
    setLightboxImageIdx((prev) => (prev + 1) % (imgs.length || 1))
  }

  const prevLightboxImage = () => {
    if (!lightboxProperty) return
    const imgs = lightboxProperty.property_images || []
    setLightboxImageIdx((prev) => (prev + imgs.length - 1) % (imgs.length || 1))
  }

  const favoriteProperties = properties.filter((p) => favorites.includes(p.id))

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
        
        <div className="hero-search-container">
          <div className="search-width-limiter">
            <h1 className="hero-search-title">Komisyonsuz, doğrudan müteahhitten konut keşfedin!</h1>
            
            <div className="search-panel-card" ref={searchContainerRef}>
              
              <div className="search-tabs-header">
                <div 
                  className={`city-tab-item ${selectedCity === '' ? 'active' : ''}`}
                  onClick={() => { setSelectedCity(''); setSelectedDistrict(''); }}
                >
                  <span>Tüm Türkiye</span>
                </div>
                {cities.filter(Boolean).map(c => (
                  <div 
                    key={c}
                    className={`city-tab-item ${selectedCity.toLowerCase() === c.toLowerCase() ? 'active' : ''}`}
                    onClick={() => { setSelectedCity(c); setSelectedDistrict(''); }}
                  >
                    <span>{c}</span>
                  </div>
                ))}
              </div>

              <div className="search-inputs-row-wrapper">
                <div className="search-inputs-row">
                  
                  <div 
                    className={`search-input-field flex-wide ${selectedDistrict ? 'has-value' : ''}`}
                    onClick={() => setOpenDropdown(openDropdown === 'district' ? null : 'district')} 
                  >
                    <svg className="input-icon-svg icon-fill" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/></svg>
                    <div className="input-double-label">
                      <span className="sub-label">Konum</span>
                      <span className="main-label">{selectedDistrict || 'İlçe / Semt seçiniz'}</span>
                    </div>
                    
                    {openDropdown === 'district' && (
                      <div className="custom-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div className="dropdown-item" onClick={() => { setSelectedDistrict(''); setOpenDropdown(null); }}>Tüm Bölgeler</div>
                        {districts.map((d) => (
                          <div key={d} className="dropdown-item" onClick={() => { setSelectedDistrict(d); setOpenDropdown(null); }}>{d}</div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div 
                    className={`search-input-field flex-standard ${selectedRooms ? 'has-value' : ''}`}
                    onClick={() => setOpenDropdown(openDropdown === 'rooms' ? null : 'rooms')} 
                  >
                    <svg className="input-icon-svg icon-fill" viewBox="0 0 24 24"><path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z" fill="currentColor"/></svg>
                    <div className="input-double-label">
                      <span className="sub-label">Oda sayısı</span>
                      <span className="main-label">{selectedRooms || 'Seçiniz'}</span>
                    </div>

                    {openDropdown === 'rooms' && (
                      <div className="custom-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div className="dropdown-item" onClick={() => { setSelectedRooms(''); setOpenDropdown(null); }}>Tüm Odalar</div>
                        {roomsList.map((r) => (
                          <div key={r} className="dropdown-item" onClick={() => { setSelectedRooms(r); setOpenDropdown(null); }}>{r}</div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div 
                    className={`search-input-field flex-standard ${activeStatusFilter ? 'has-value' : ''}`}
                    onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')} 
                  >
                    <svg className="input-icon-svg icon-stroke" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" /></svg>
                    <div className="input-double-label">
                      <span className="sub-label">Proje durumu</span>
                      <span className="main-label">{activeStatusFilter || 'Seçiniz'}</span>
                    </div>

                    {openDropdown === 'status' && (
                      <div className="custom-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div className="dropdown-item" onClick={() => { setActiveStatusFilter(''); setOpenDropdown(null); }}>Tüm Durumlar</div>
                        {statuses.map((s) => (
                          <div key={s} className="dropdown-item" onClick={() => { setActiveStatusFilter(s); setOpenDropdown(null); }}>{s}</div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

                <button className="search-submit-btn" onClick={handleSearch}>Ara</button>
              </div>

              <div className="panel-bottom-gradient"></div>
            </div>

          </div>
        </div>

        {/* Сетка объявлений: ширина 1440px для максимальной сочности */}
        <div style={{ width: '100%', maxWidth: '1440px', margin: '40px auto 0 auto', padding: '0 20px', boxSizing: 'border-box' }}>
          {initialError && (
            <div style={{ padding: '20px', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '12px', marginBottom: '20px', fontWeight: 'bold' }}>
              Hata: {initialError}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', padding: '0' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)', margin: '0' }}>
              {activeStatusFilter ? `${activeStatusFilter} Projeleri` : 'Tüm Projeler'} ({totalCount})
            </h2>
            {(selectedCity || selectedDistrict || selectedRooms || activeStatusFilter) && (
              <button 
                onClick={handleResetFilters}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '800', cursor: 'pointer' }}
              >
                Filtreleri Temizle
              </button>
            )}
          </div>

          {properties.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '18px', fontWeight: '700' }}>Aradığınız критериям uygun ilan bulunamadı.</p>
            </div>
          ) : (
            <>
              <div className="grid-layout">
                {properties.map((item) => (
                  <PropertyCard 
                    key={item.id}
                    property={item}
                    isLiked={favorites.includes(item.id)}
                    onToggleLike={toggleLike}
                    onOpenLightbox={openLightbox}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination-container">
                  <button 
                    className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    ❮ Geri
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button 
                    className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    İleri ❯
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <div className={`cabinet-drawer ${isFavoritesOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <span className="drawer-title" style={{ color: 'var(--text-main)' }}>Favorilerim ({favorites.length})</span>
          <button className="drawer-close" onClick={() => setIsFavoritesOpen(false)}>&times;</button>
        </div>
        <div className="drawer-content">
          {favoriteProperties.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Favori ilanınız bulunmuyor.</div>
          ) : (
            <div className="fav-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {favoriteProperties.map((item) => {
                const titleVal = item.title || item["testproje"] || '';
                const priceVal = item.price || item["Fiyat"] || '';
                const imgs = item.property_images || [];
                const imgVal = imgs[0]?.image_url || '';
                return (
                  <div key={item.id} style={{ display: 'flex', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border-soft)', cursor: 'pointer' }} onClick={() => { setIsFavoritesOpen(false); openLightbox(item); }}>
                    {imgVal ? (
                      <img src={imgVal} style={{ width: '80px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} alt="" />
                    ) : (
                      <div style={{ width: '80px', height: '60px', borderRadius: '8px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '10px', fontWeight: 'bold' }}>Yok</div>
                    )}
                    <div>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>{titleVal}</h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--primary)', fontWeight: '900' }}>{priceVal}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
      <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
    </>
  )
}

export async function getServerSideProps(context) {
  try {
    const { query } = context
    const currentPage = parseInt(query.page || '1', 10)
    const limit = 30
    const from = (currentPage - 1) * limit
    const to = currentPage * limit - 1

    const { data: metaData } = await supabase
      .from('properties')
      .select('city, district, "İlçe/Semt", rooms, "card odalar", status, konutcesit')

    const cities = Array.from(new Set(metaData?.map(x => x.city).filter(Boolean))).sort()
    const districts = Array.from(new Set(metaData?.map(x => x.district || x["İlçe/Semt"]).filter(Boolean))).sort()
    const roomsList = Array.from(new Set(metaData?.map(x => x.rooms || x["card odalar"]).filter(Boolean))).sort()
    const statuses = Array.from(new Set(metaData?.map(x => x.status || x["konutcesit"]).filter(Boolean))).sort()

    let dbQuery = supabase
      .from('properties')
      .select('*, property_images(image_url)', { count: 'exact' })

    if (query.city) {
      dbQuery = dbQuery.ilike('city', `%${query.city}%`)
    }
    if (query.district) {
      dbQuery = dbQuery.or(`district.ilike.%${query.district}%,"İlçe/Semt".ilike.%${query.district}%`)
    }
    if (query.rooms) {
      dbQuery = dbQuery.or(`rooms.eq.${query.rooms},"card odalar".eq.${query.rooms}`)
    }
    if (query.status) {
      dbQuery = dbQuery.or(`status.ilike.%${query.status}%,konutcesit.ilike.%${query.status}%`)
    }

    dbQuery = dbQuery.order('id', { ascending: false }).range(from, to)

    const { data: properties, count, error } = await dbQuery

    if (error) throw error

    const totalPages = count ? Math.ceil(count / limit) : 1

    return {
      props: {
        properties: properties || [],
        totalCount: count || 0,
        currentPage,
        totalPages,
        cities,
        districts,
        roomsList,
        statuses,
        initialError: null,
      },
    }
  } catch (err) {
    console.error('❌ Supabase Veri Cekme Hatasi:', err)
    return {
      props: {
        properties: [],
        totalCount: 0,
        currentPage: 1,
        totalPages: 1,
        cities: [],
        districts: [],
        roomsList: [],
        statuses: [],
        initialError: err.message || 'Supabase connection failed',
      },
    }
  }
}
