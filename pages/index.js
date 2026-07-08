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
  '/* Секция поиска с уменьшенным верхним отступом */',
  '.hero-search-container {',
  '  width: 100%;',
  '  padding: 35px 20px 25px 20px !important; /* Уменьшено со 125px для плотного прилегания */',
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
  '/* Карточка панели поиска */',
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
  '  overflow: hidden;',
  '  border-radius: 0 0 20px 20px;',
  '}',
  '',
  '/* Вкладки */',
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
  '/* Строки ввода */',
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
  '',
  '/* Поле ввода с фиксацией position: relative для выпадающих списков */',
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
  '  position: relative !important; /* Важнейшее свойство для фиксации выпадающих меню под кнопками */',
  '}',
  '.search-input-field:hover, .search-input-field.active-field {',
  '  border-color: var(--primary) !important;',
  '  background-color: #fff !important;',
  '  box-shadow: 0 10px 25px rgba(0, 164, 166, 0.08) !important;',
  '}',
  '.search-input-field.flex-wide {',
  '  flex: 1.5 !important;',
  '}',
  '.search-input-field.flex-standard {',
  '  flex: 1 !important;',
  '}',
  '',
  '.input-icon-svg {',
  '  width: 18px;',
  '  height: 18px;',
  '  flex-shrink: 0;',
  '  transition: stroke .2s, fill .2s;',
  '}',
  '.input-icon-svg.icon-fill {',
  '  fill: var(--text-muted);',
  '}',
  '.input-icon-svg.icon-stroke {',
  '  fill: none;',
  '  stroke: var(--text-muted);',
  '  stroke-width: 2;',
  '}',
  '.search-input-field:hover .input-icon-svg.icon-fill, .search-input-field.active-field .input-icon-svg.icon-fill {',
  '  fill: var(--primary) !important;',
  '}',
  '.search-input-field:hover .input-icon-svg.icon-stroke, .search-input-field.active-field .input-icon-svg.icon-stroke {',
  '  stroke: var(--primary) !important;',
  '}',
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
  '  letter-spacing: .5px;',
  '}',
  '.input-double-label .main-label {',
  '  font-size: 16px;',
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
  '  transition: background-color .2s, transform .1s, box-shadow .2s;',
  '  flex-shrink: 0;',
  '  box-shadow: 0 4px 14px rgba(0, 164, 166, 0.2);',
  '}',
  '.search-submit-btn:hover {',
  '  background-color: var(--primary-hover);',
  '  box-shadow: 0 6px 20px rgba(0, 164, 166, 0.35);',
  '}',
  '.search-submit-btn:active { transform: scale(.97); }',
  '',
  '/* Кастомные выпадающие меню */',
  '.custom-dropdown {',
  '  position: absolute !important;',
  '  background-color: #fff !important;',
  '  border-radius: 16px !important;',
  '  box-shadow: var(--shadow-dropdown) !important;',
  '  border: 1.5px solid var(--border-soft) !important;',
  '  padding: 0 !important;',
  '  z-index: 99999 !important;',
  '  display: block;',
  '  box-sizing: border-box !important;',
  '  overflow: hidden !important;',
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
  '  text-align: left !important;',
  '}',
  '.dropdown-item:hover {',
  '  background-color: #f8fafc !important;',
  '  color: var(--primary) !important;',
  '}',
  '',
  '/* ГРИД ЦИАН */',
  '.grid-layout {',
  '  display: grid !important;',
  '  grid-template-columns: repeat(auto-fill, 227.5px) !important; /* Строгая фиксация ширины ряда из ЦИАН */',
  '  justify-content: center !important;',
  '  gap: 20px !important;',
  '  width: 100% !important;',
  '}',
  '.cian-card {',
  '  width: 227.5px !important; /* Умный фикс размеров карточки */',
  '  height: 302.26px !important; /* Строгий размер карточки ЦИАН */',
  '  padding: 0 !important; /* Полное обнуление полей */',
  '  margin: 0 !important;',
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
  '  box-sizing: border-box !important;',
  '}',
  '.cian-img-container {',
  '  height: 155px !important; /* Высота ограничена строго до 155px, чтобы снизу гарантированно влезли все подписи */',
  '  width: 100% !important;',
  '  margin: 0 !important;',
  '  padding: 0 !important;',
  '  border-radius: 16px 16px 0 0 !important; /* Закругляются только верхние углы */',
  '  position: relative !important;',
  '  overflow: hidden !important;',
  '  flex-shrink: 0 !important; /* Запрещает картинке растягиваться и выталкивать текст */',
  '}',
  '.cian-info {',
  '  padding: 12px 14px !important;',
  '  display: flex !important;',
  '  flex-direction: column !important;',
  '  justify-content: space-between !important;',
  '  box-sizing: border-box !important;',
  '  flex: 1 !important; /* Занимает строго оставшееся пространство */',
  '  background-color: #ffffff !important;',
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
  '/* Тексты в карточке */',
  '.cian-price {',
  '  font-size: 20px !important;',
  '  font-weight: 800 !important;',
  '  color: #1E293B !important;',
  '  line-height: 1.1 !important;',
  '}',
  '.cian-specs {',
  '  font-size: 13px !important;',
  '  font-weight: 500 !important;',
  '  color: var(--text-muted) !important;',
  '  margin-top: 2px !important;',
  '}',
  '.cian-location {',
  '  font-size: 12px !important;',
  '  font-weight: 600 !important;',
  '  color: var(--text-muted) !important;',
  '  display: inline-flex !important;',
  '  align-items: center !important;',
  '  gap: 4px !important;',
  '  margin-top: 4px !important;',
  '}',
  '.cian-geo-dot {',
  '  width: 8px !important;',
  '  height: 8px !important;',
  '  border-radius: 50% !important;',
  '  background-color: var(--primary) !important;',
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
  '/* Выдвижная панель */',
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
  '/* Модальные окна */',
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
  '/* Мобильные фиксы для лейблов */',
  '@media (max-width: 1024px) {',
  '  .hero-search-container { padding: 100px 16px 40px 16px !important; }',
  '  .search-panel-card { border-radius: 16px !important; padding: 16px !important; }',
  '  .search-inputs-row-wrapper { flex-direction: column !important; width: 100% !important; gap: 12px !important; }',
  '  .search-inputs-row { flex-direction: column !important; width: 100% !important; gap: 12px !important; }',
  '  .search-input-field { width: 100% !important; border: 1.5px solid var(--border-soft) !important; border-radius: 10px !important; }',
  '  .search-submit-btn { width: 100% !important; border-radius: 12px !important; margin: 0 !important; }',
  '  .grid-layout { grid-template-columns: 1fr !important; gap: 24px !important; }',
  '  ',
  '  .input-double-label { position: relative !important; display: flex !important; flex-direction: column !important; justify-content: center !important; height: 100% !important; width: 100% !important; }',
  '  .input-double-label .sub-label { position: absolute !important; left: 0 !important; top: 50% !important; transform: translateY(-50%) !important; font-size: 15px !important; transition: opacity 0.25s !important; pointer-events: none !important; }',
  '  .input-double-label .main-label { position: absolute !important; left: 0 !important; top: 50% !important; transform: translateY(-50%) !important; font-size: 15px !important; opacity: 0 !important; transition: opacity 0.25s !important; pointer-events: none !important; }',
  '  .search-input-field.has-value .input-double-label .sub-label { opacity: 0 !important; }',
  '  .search-input-field.has-value .input-double-label .main-label { opacity: 1 !important; }',
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

  // Динамические списки для фильтров (поддерживают оригинальные названия колонок из БД)
  const districts = useMemo(() => {
    const set = new Set(properties.map((p) => p["İlçe/Semt"] || p.district).filter(Boolean))
    return Array.from(set)
  }, [properties])

  const roomsList = useMemo(() => {
    const set = new Set(properties.map((p) => p["card odalar"] || p.rooms).filter(Boolean))
    return Array.from(set).sort()
  }, [properties])

  // Фильтрация объектов
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      const pStatus = p["konutcesit"] || p.status || '';
      const pDistrict = p["İlçe/Semt"] || p.district || '';
      const pRooms = p["card odalar"] || p.rooms || '';

      if (activeStatusFilter && pStatus.toLowerCase() !== activeStatusFilter.toLowerCase()) {
        return false
      }
      if (selectedDistrict && pDistrict.toLowerCase() !== selectedDistrict.toLowerCase()) {
        return false
      }
      if (selectedRooms && String(pRooms) !== String(selectedRooms)) {
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
    const imgs = lightboxProperty.images || lightboxProperty["Foto"] || []
    setLightboxImageIdx((prev) => (prev + 1) % (imgs.length || 1))
  }

  const prevLightboxImage = () => {
    if (!lightboxProperty) return
    const imgs = lightboxProperty.images || lightboxProperty["Foto"] || []
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
          <div className="search-width-limiter">
            <h1 className="hero-search-title">Komisyonsuz, doğrudan müteahhitten konut keşfedin!</h1>
            
            {/* ТРИ отдельных интерактивных элемента на белом фоне с градиентной линией */}
            <div className="search-panel-card" ref={searchContainerRef}>
              
              {/* Города / Табы */}
              <div className="search-tabs-header">
                <div className="city-tab-item active" id="city-select-trigger">
                  <svg className="tab-icon-svg" viewBox="0 0 24 24" style={{ width: '16px', height: '16px', marginRight: '6px' }}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/></svg>
                  <span>Ankara Projeleri</span>
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

              {/* Поля */}
              <div className="search-inputs-row-wrapper">
                <div className="search-inputs-row">
                  
                  {/* 1. Элемент: Выбор региона */}
                  <div 
                    className={`search-input-field flex-wide field-trigger-location ${selectedDistrict ? 'has-value' : ''}`}
                    onClick={() => setOpenDropdown(openDropdown === 'district' ? null : 'district')} 
                  >
                    <svg className="input-icon-svg icon-fill" viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/></svg>
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

                  {/* 2. Элемент: Выбор комнат */}
                  <div 
                    className={`search-input-field flex-standard field-trigger-room ${selectedRooms ? 'has-value' : ''}`}
                    onClick={() => setOpenDropdown(openDropdown === 'rooms' ? null : 'rooms')} 
                  >
                    <svg className="input-icon-svg icon-fill" viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}><path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z" fill="currentColor"/></svg>
                    <div className="input-double-label">
                      <span className="sub-label">Oda sayısı</span>
                      <span className="main-label">{selectedRooms || 'Oda sayısı seçiniz'}</span>
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

                  {/* 3. Элемент: Статус проекта */}
                  <div 
                    className={`search-input-field flex-standard field-trigger-durum ${activeStatusFilter ? 'has-value' : ''}`}
                    onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')} 
                  >
                    <svg className="input-icon-svg icon-stroke" viewBox="0 0 24 24" style={{ width: '18px', height: '18px', fill: 'none', stroke: 'currentColor', strokeWidth: '2' }}><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" /></svg>
                    <div className="input-double-label">
                      <span className="sub-label">Proje durumu</span>
                      <span className="main-label">{activeStatusFilter || 'Durum seçiniz'}</span>
                    </div>

                    {openDropdown === 'status' && (
                      <div className="custom-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div className="dropdown-item" onClick={() => { setActiveStatusFilter(''); setOpenDropdown(null); }}>Tüm Durumlar</div>
                        <div className="dropdown-item" onClick={() => { setActiveStatusFilter('Lansman'); setOpenDropdown(null); }}>Lansman</div>
                        <div className="dropdown-item" onClick={() => { setActiveStatusFilter('Devam ediyor'); setOpenDropdown(null); }}>Devam ediyor</div>
                        <div className="dropdown-item" onClick={() => { setActiveStatusFilter('Tamamlandı'); setOpenDropdown(null); }}>Tamamlandı</div>
                      </div>
                    )}
                  </div>

                </div>

                <button className="search-submit-btn" onClick={() => setOpenDropdown(null)}>Ara</button>
              </div>

              {/* Фирменная градиентная линия под блоками */}
              <div className="panel-bottom-gradient"></div>
            </div>

          </div>
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
              {favoriteProperties.map((item) => {
                const titleVal = item.title || item["testproje"] || '';
                const priceVal = item.price || item["Fiyat"] || '';
                const imgVal = (item.images || item["Foto"] || [])[0] || '';
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

      {/* Подача объявлений */}
      <div className={`modal-overlay ${isPostModalOpen ? 'open' : ''}`}>
        <div className="modal-card-box">
          <button className="modal-close-btn" onClick={() => setIsPostModalOpen(false)}>&times;</button>
          <h3 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '16px', color: 'var(--text-main)' }}>Ücretsiz İlan Ver</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.5' }}>
            Projenizi или mülkünüzü sitemizde ücretsiz yayınlamak için WhatsApp üzerinden müşteri temsilcimizle doğrudan iletişime geçebilirsiniz.
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
          
          {(lightboxProperty.images || lightboxProperty["Foto"] || []).length > 1 && (
            <>
              <button onClick={prevLightboxImage} style={{ position: 'absolute', left: '20px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', width: '50px', height: '50px', borderRadius: '50%', fontSize: '24px', cursor: 'pointer' }}>❮</button>
              <button onClick={nextLightboxImage} style={{ position: 'absolute', right: '20px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', width: '50px', height: '50px', borderRadius: '50%', fontSize: '24px', cursor: 'pointer' }}>❯</button>
            </>
          )}

          <div style={{ maxWidth: '90%', maxHeight: '80%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img 
              src={(lightboxProperty.images || lightboxProperty["Foto"] || [])[lightboxImageIdx] || ''} 
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '12px' }} 
              alt="" 
            />
            <div style={{ marginTop: '20px', textAlign: 'center', color: '#fff', maxWidth: '600px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 8px 0', color: '#fff !important' }}>{lightboxProperty.price || lightboxProperty["Fiyat"]}</h2>
              <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 8px 0', color: '#fff !important' }}>{lightboxProperty.title || lightboxProperty["testproje"]}</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>{lightboxProperty.rooms || lightboxProperty["card odalar"]} · {lightboxProperty.area || lightboxProperty["card-area"]} m² · {lightboxProperty.district || lightboxProperty["İlçe/Semt"]}</p>
            </div>
          </div>

          <div className="lightbox-counter">
            {lightboxImageIdx + 1} / {(lightboxProperty.images || lightboxProperty["Foto"] || []).length || 1}
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
