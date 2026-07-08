import React, { useState, useEffect, useMemo, useRef } from 'react'
import Head from 'next/head'
import Script from 'next/script'
import { useRouter } from 'next/router'
import { supabase } from '../supabase'

import Header from '../components/Header'
import Footer from '../components/Footer'
import PropertyCard from '../components/PropertyCard'

// Стили CSS объявлены в самом верху файла в виде массива строк
const cssStyles = [
  ':root {',
  '  --primary: #00A4A6;',
  '  --primary-hover: #00898B;',
  '  --dark-slate: #1E293B;',
  '  --text-main: #334155;',
  '  --text-muted: #64748B;',
  '  --border-soft: #CBD5E1;',
  '  --bg-light: #F1F5F9;',
  '  --shadow-premium: 0 10px 30px rgba(0, 164, 166, 0.06), 0 1px 3px rgba(0, 0, 0, 0.02);',
  '  --shadow-dropdown: 0 12px 32px rgba(15, 23, 42, 0.18);',
  '  --primary-light: rgba(0, 164, 166, 0.06);',
  '  --radius-bubble: 36px;',
  '}',
  '',
  '.tilda-catalog-wrapper, .tilda-catalog-wrapper * {',
  '  font-family: "Mulish", sans-serif !important;',
  '  box-sizing: border-box !important;',
  '}',
  '',
  '.dropdown-mobile-header, .dropdown-mobile-footer {',
  '  display: none !important;',
  '}',
  '.mobile-filter-floating-btn {',
  '  display: none !important;',
  '}',
  '',
  '.input-icon-svg {',
  '  width: 18px !important;',
  '  height: 18px !important;',
  '  flex-shrink: 0 !important;',
  '  transition: stroke .2s, fill .2s !important;',
  '  display: inline-block !important;',
  '}',
  '.input-icon-svg.icon-stroke {',
  '  fill: none !important;',
  '  stroke: var(--text-muted) !important;',
  '  stroke-width: 2 !important;',
  '}',
  '.input-icon-svg.icon-fill {',
  '  fill: var(--text-muted) !important;',
  '}',
  '.search-input-field:hover .input-icon-svg.icon-stroke,',
  '.search-input-field.active-field .input-icon-svg.icon-stroke {',
  '  stroke: var(--primary) !important;',
  '}',
  '.search-input-field:hover .input-icon-svg.icon-fill,',
  '.search-input-field.active-field .input-icon-svg.icon-fill {',
  '  fill: var(--primary) !important;',
  '}',
  '',
  '.search-input-field {',
  '  position: relative !important;',
  '}',
  '',
  '/* ВЫПАДАЮЩИЕ МЕНЮ */',
  '.custom-dropdown {',
  '  position: absolute !important;',
  '  background-color: #ffffff !important;',
  '  border-radius: 16px !important;',
  '  box-shadow: var(--shadow-dropdown) !important;',
  '  border: 1.5px solid var(--border-soft) !important;',
  '  padding: 0 !important;',
  '  z-index: 99999 !important;',
  '  display: none !important;',
  '  overflow: hidden !important;',
  '  top: 100% !important;',
  '  left: 0 !important;',
  '  width: 100% !important;',
  '  margin-top: 4px !important;',
  '}',
  '',
  '.custom-dropdown.active-desktop {',
  '  display: block !important;',
  '}',
  '',
  '/* Gray Backdrop Overlay */',
  '.modal-backdrop-overlay {',
  '  display: none !important;',
  '  position: fixed !important;',
  '  top: 0 !important;',
  '  left: 0 !important;',
  '  width: 100% !important;',
  '  height: 100% !important;',
  '  background: rgba(15, 23, 42, .6) !important;',
  '  z-index: 99999998 !important;',
  '  opacity: 0 !important;',
  '  transition: opacity .3s ease-in-out !important;',
  '  pointer-events: none !important;',
  '}',
  '.modal-backdrop-overlay.show {',
  '  display: block !important;',
  '  opacity: 1 !important;',
  '  pointer-events: auto !important;',
  '}',
  '',
  '/* СТИЛИ ДВОЙНОГО ПОЛЗУНКА */',
  '.dual-range-slider-container {',
  '  position: relative !important;',
  '  width: calc(100% - 20px) !important;',
  '  height: 4px !important;',
  '  background-color: var(--border-soft) !important;',
  '  margin: 15px 10px 25px 10px !important;',
  '  border-radius: 2px !important;',
  '}',
  '.dual-range-track {',
  '  position: absolute !important;',
  '  height: 100% !important;',
  '  background: linear-gradient(90deg, #B2EBF2 0%, #00A4A6 100%) !important;',
  '  border-radius: 2px !important;',
  '  z-index: 1 !important;',
  '}',
  '.dual-range-slider-container input[type="range"] {',
  '  position: absolute !important;',
  '  width: 100% !important;',
  '  height: 4px !important;',
  '  background: transparent !important;',
  '  appearance: none !important;',
  '  -webkit-appearance: none !important;',
  '  pointer-events: none !important;',
  '  outline: none !important;',
  '  margin: 0 !important;',
  '  top: 0 !important;',
  '  left: 0 !important;',
  '  z-index: 2 !important;',
  '}',
  '.dual-range-slider-container input[type="range"]::-webkit-slider-thumb {',
  '  appearance: none !important;',
  '  -webkit-appearance: none !important;',
  '  pointer-events: auto !important;',
  '  width: 18px !important;',
  '  height: 18px !important;',
  '  border-radius: 50% !important;',
  '  border: 2.5px solid var(--primary) !important;',
  '  background-color: #fff !important;',
  '  box-shadow: 0 2px 5px rgba(0,0,0,.1) !important;',
  '  cursor: pointer !important;',
  '  transition: transform .15s, box-shadow .15s !important;',
  '  position: relative !important;',
  '  z-index: 3 !important;',
  '}',
  '.dual-range-slider-container input[type="range"]::-webkit-slider-thumb:hover {',
  '  transform: scale(1.1) !important;',
  '  box-shadow: 0 0 0 6px rgba(0,164,166,.12) !important;',
  '}',
  '.dual-range-slider-container input[type="range"]::-moz-range-thumb {',
  '  pointer-events: auto !important;',
  '  width: 18px !important;',
  '  height: 18px !important;',
  '  border-radius: 50% !important;',
  '  border: 2.5px solid var(--primary) !important;',
  '  background-color: #fff !important;',
  '  box-shadow: 0 2px 5px rgba(0,0,0,.1) !important;',
  '  cursor: pointer !important;',
  '  position: relative !important;',
  '  z-index: 3 !important;',
  '}',
  '',
  '/* КНОПКА СКРЫТИЯ САЙДБАРА НА ДЕСКТОПЕ */',
  '#sidebar-toggle-btn {',
  '  position: fixed !important;',
  '  top: 50% !important;',
  '  left: 0 !important;',
  '  transform: translateY(-50%) !important;',
  '  width: 24px !important;',
  '  height: 60px !important;',
  '  background: var(--primary) !important;',
  '  color: #fff !important;',
  '  border-radius: 0 8px 8px 0 !important;',
  '  display: flex !important;',
  '  align-items: center !important;',
  '  justify-content: center !important;',
  '  cursor: pointer !important;',
  '  z-index: 99999999 !important;',
  '  box-shadow: 2px 0 10px rgba(0,0,0,.1) !important;',
  '  font-size: 14px !important;',
  '  font-weight: 700 !important;',
  '  user-select: none !important;',
  '  transition: background .2s ease !important;',
  '}',
  '#sidebar-toggle-btn:hover {',
  '  background: var(--primary-hover) !important;',
  '}',
  '',
  '/* ЖЕСТКИЙ ЦИАН ГРИД 4Х С ТОЧНЫМИ РАЗМЕРАМИ */',
  '.grid-layout {',
  '  display: grid !important;',
  '  grid-template-columns: repeat(auto-fill, minmax(227.5px, 1fr)) !important;',
  '  gap: 20px !important;',
  '  width: 100% !important;',
  '}',
  '',
  '.cian-card {',
  '  background: #ffffff !important;',
  '  border-radius: 16px !important;',
  '  border: 1px solid rgba(226, 232, 240, 0.6) !important;',
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
  '    width: 227.5px !important;',
  '    height: 302.26px !important;',
  '  }',
  '}',
  '.cian-card:hover {',
  '  transform: translateY(-5px) !important;',
  '  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.06) !important;',
  '}',
  '',
  '.cian-img-container {',
  '  position: relative !important;',
  '  overflow: hidden !important;',
  '  border-radius: 12px !important;',
  '  width: 100% !important;',
  '}',
  '@media (min-width: 1025px) {',
  '  .cian-img-container {',
  '    height: 184.93px !important;',
  '  }',
  '}',
  '@media (max-width: 1024px) {',
  '  .cian-img-container {',
  '    aspect-ratio: 1.22 !important;',
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
  '  transition: transform 0.4s ease !important;',
  '}',
  '.cian-card:hover .cian-img {',
  '  transform: scale(1.04) !important;',
  '}',
  '',
  '/* Кнопка сердечка на карточках */',
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
  '  padding: 0 !important;',
  '}',
  '.card-fav-btn:hover {',
  '  background: rgba(15, 23, 42, 0.55) !important;',
  '  transform: scale(1.08) !important;',
  '}',
  '.card-fav-btn.liked {',
  '  color: #ff3b30 !important;',
  '  background: #ffffff !important;',
  '  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;',
  '}',
  '',
  '/* Скрытые стрелки на картинке (проявляются белым при наведении) */',
  '.slider-arrow {',
  '  position: absolute !important;',
  '  top: 50% !important;',
  '  transform: translateY(-50%) !important;',
  '  background: rgba(255, 255, 255, 0) !important;',
  '  color: rgba(255, 255, 255, 0) !important;',
  '  border: none !important;',
  '  width: 30px !important;',
  '  height: 30px !important;',
  '  border-radius: 50% !important;',
  '  cursor: pointer !important;',
  '  transition: all 0.2s ease !important;',
  '  z-index: 8 !important;',
  '  display: flex !important;',
  '  align-items: center !important;',
  '  justify-content: center !important;',
  '  font-weight: 900 !important;',
  '  user-select: none !important;',
  '}',
  '.arrow-left { left: 8px !important; }',
  '.arrow-right { right: 8px !important; }',
  '.cian-card:hover .slider-arrow {',
  '  background: rgba(255, 255, 255, 0.8) !important;',
  '  color: var(--dark-slate) !important;',
  '}',
  '.cian-card:hover .slider-arrow:hover {',
  '  background: rgba(255, 255, 255, 1) !important;',
  '}',
  '',
  '.card-badge {',
  '  position: absolute !important;',
  '  top: 12px !important;',
  '  left: 12px !important;',
  '  color: #ffffff !important;',
  '  font-size: 10px !important;',
  '  font-weight: 800 !important;',
  '  text-transform: uppercase !important;',
  '  padding: 5px 12px !important;',
  '  border-radius: 20px !important;',
  '  z-index: 5 !important;',
  '  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;',
  '  letter-spacing: 0.5px !important;',
  '}',
  '.status-lansman { background-color: #ff9800 !important; }',
  '.status-other { background-color: var(--primary) !important; }',
  '',
  '/* Текстовая область */',
  '.cian-info {',
  '  padding: 12px 6px 14px 6px !important;',
  '  display: flex !important;',
  '  flex-direction: column !important;',
  '  gap: 4px !important;',
  '  min-height: 117.33px !important;',
  '}',
  '.cian-price {',
  '  font-size: 21px !important;',
  '  font-weight: 900 !important;',
  '  color: var(--text-main) !important;',
  '  line-height: 1.2 !important;',
  '}',
  '.cian-specs {',
  '  font-size: 14.5px !important;',
  '  font-weight: 700 !important;',
  '  color: #334155 !important;',
  '  line-height: 1.4 !important;',
  '}',
  '.cian-location {',
  '  font-size: 13px !important;',
  '  font-weight: 600 !important;',
  '  color: #475569 !important;',
  '  display: inline-flex !important;',
  '  align-items: center !important;',
  '  gap: 6px !important;',
  '  line-height: 1.4 !important;',
  '}',
  '.cian-geo-dot {',
  '  width: 8px !important;',
  '  height: 8px !important;',
  '  border-radius: 50% !important;',
  '  flex-shrink: 0 !important;',
  '}',
  '.cian-geo-dot.cyan { background-color: var(--primary) !important; }',
  '.cian-address {',
  '  font-size: 12px !important;',
  '  font-weight: 500 !important;',
  '  color: var(--text-muted) !important;',
  '  white-space: nowrap !important;',
  '  overflow: hidden !important;',
  '  text-overflow: ellipsis !important;',
  '  line-height: 1.4 !important;',
  '}',
  '',
  '/* ВЫДВИЖНОЙ РАЗДЕЛ (ЛИЧНЫЙ КАБИНЕТ) */',
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
  '.fav-list {',
  '  display: flex !important;',
  '  flex-direction: column !important;',
  '  gap: 16px !important;',
  '}',
  '.drawer-empty-placeholder {',
  '  text-align: center !important;',
  '  padding: 40px 0 !important;',
  '  color: var(--text-muted) !important;',
  '}',
  '',
  '/* МОДАЛЬНОЕ ОКНО ПОДАЧИ ОБЪЯВЛЕНИЯ */',
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
  '',
  '/* ПОЛНОЭКРАННЫЙ LIGHTBOX СЧЕТЧИК */',
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
  '  user-select: none !important;',
  '}',
  '',
  '@media (max-width: 1024px) {',
  '  .hero-search-title { display: none !important; }',
  '  .mobile-only-title {',
  '    display: block !important;',
  '    font-size: 20px !important;',
  '    font-weight: 800 !important;',
  '    color: #ffffff !important;',
  '    text-align: center !important;',
  '    margin: 0 auto 20px auto !important;',
  '    line-height: 1.3 !important;',
  '  }',
  '  .hero-search-container {',
  '    padding: 110px 20px 24px 20px !important;',
  '    background: linear-gradient(180deg, #00A4A6 0%, #062228 100%) !important;',
  '  }',
  '  .search-tabs-header {',
  '    justify-content: center !important;',
  '    gap: 8px !important;',
  '    margin-bottom: 16px !important;',
  '    border-bottom: none !important;',
  '    padding-bottom: 0 !important;',
  '  }',
  '  .city-tab-item {',
  '    padding: 8px 16px !important;',
  '    border-radius: 20px !important;',
  '    background-color: rgba(255,255,255,0.12) !important;',
  '    color: #fff !important;',
  '    font-size: 14px !important;',
  '    font-weight: 800 !important;',
  '    margin-bottom: 0 !important;',
  '  }',
  '  .city-tab-item.active {',
  '    background-color: #fff !important;',
  '    color: var(--primary) !important;',
  '  }',
  '  .city-tab-item.active::after { display: none !important; }',
  '  .city-tab-item.disabled { display: none !important; }',
  '',
  '  .search-panel-card {',
  '    border: none !important;',
  '    box-shadow: none !important;',
  '    background: transparent !important;',
  '    padding: 0 !important;',
  '  }',
  '  .search-inputs-row-wrapper {',
  '    flex-direction: column !important;',
  '  }',
  '  .search-inputs-row {',
  '    display: grid !important;',
  '    grid-template-columns: repeat(2, 1fr) !important;',
  '    grid-template-rows: auto auto !important;',
  '    gap: 0 !important;',
  '    border: 1px solid var(--border-soft) !important;',
  '    border-radius: 16px !important;',
  '    overflow: visible !important;',
  '    background-color: #fff !important;',
  '    width: 368px !important;',
  '    max-width: 100% !important;',
  '    box-sizing: border-box !important;',
  '    margin: 0 auto !important;',
  '  }',
  '  .search-input-field {',
  '    background-color: #fff !important;',
  '    border: none !important;',
  '    border-radius: 0 !important;',
  '    height: 44px !important;',
  '    padding: 0 12px !important;',
  '    width: 100% !important;',
  '    box-shadow: none !important;',
  '  }',
  '  .field-trigger-location {',
  '    grid-column: span 2 !important;',
  '    border-bottom: 1px solid var(--border-soft) !important;',
  '  }',
  '  .field-trigger-room {',
  '    grid-column: span 1 !important;',
  '    border-right: 1px solid var(--border-soft) !important;',
  '  }',
  '  .field-trigger-durum {',
  '    grid-column: span 1 !important;',
  '  }',
  '',
  '  .input-double-label {',
  '    position: relative !important;',
  '    height: 100% !important;',
  '  }',
  '  .input-double-label .sub-label {',
  '    position: absolute !important;',
  '    top: 50% !important;',
  '    transform: translateY(-50%) !important;',
  '    font-size: 15px !important;',
  '    text-transform: none !important;',
  '    font-weight: 600 !important;',
  '    transition: opacity 0.25s ease !important;',
  '  }',
  '  .input-double-label .main-label {',
  '    position: absolute !important;',
  '    top: 50% !important;',
  '    transform: translateY(-50%) !important;',
  '    font-size: 15px !important;',
  '    font-weight: 700 !important;',
  '    opacity: 0 !important;',
  '    transition: opacity 0.25s ease !important;',
  '    width: 100% !important;',
  '    white-space: nowrap !important;',
  '    overflow: hidden !important;',
  '    text-overflow: ellipsis !important;',
  '  }',
  '  .search-input-field.has-value .input-double-label .sub-label {',
  '    opacity: 0 !important;',
  '  }',
  '  .search-input-field.has-value .input-double-label .main-label {',
  '    opacity: 1 !important;',
  '  }',
  '',
  '  .search-submit-btn {',
  '    width: 368px !important;',
  '    max-width: 100% !important;',
  '    height: 48px !important;',
  '    margin-top: 12px !important;',
  '    border-radius: 12px !important;',
  '  }',
  '',
  '  /* МОБИЛЬНЫЕ ШТОРКИ ВЫПАДАЮЩИХ СПИСКОВ */',
  '  .custom-dropdown {',
  '    position: fixed !important;',
  '    bottom: 0 !important;',
  '    top: 0 !important;',
  '    left: 0 !important;',
  '    right: 0 !important;',
  '    width: 100% !important;',
  '    max-width: 100% !important;',
  '    height: 100vh !important;',
  '    border-radius: 0 !important;',
  '    box-shadow: 0 -10px 40px rgba(15,23,42,0.15) !important;',
  '    z-index: 100000005 !important;',
  '    display: none !important;',
  '    flex-direction: column !important;',
  '    background-color: #fff !important;',
  '    border: none !important;',
  '    transform: translateY(100%);',
  '    transition: transform .3s cubic-bezier(.16,1,.3,1) !important;',
  '  }',
  '',
  '  .custom-dropdown.active-mobile-modal {',
  '    display: flex !important;',
  '    transform: translateY(0) !important;',
  '    z-index: 100000005 !important;',
  '  }',
  '',
  '  .custom-dropdown::before {',
  '    content: \'\' !important;',
  '    display: block !important;',
  '    width: 40px !important;',
  '    height: 4px !important;',
  '    background-color: #cbd5e1 !important;',
  '    border-radius: 2px !important;',
  '    margin: 12px auto 8px auto !important;',
  '    flex-shrink: 0 !important;',
  '  }',
  '',
  '  .dropdown-mobile-header {',
  '    display: flex !important;',
  '    justify-content: space-between !important;',
  '    align-items: center !important;',
  '    padding: 12px 20px !important;',
  '    border-bottom: 1px solid var(--border-soft) !important;',
  '    flex-shrink: 0 !important;',
  '  }',
  '  .dropdown-mobile-title {',
  '    font-size: 16px !important;',
  '    font-weight: 900 !important;',
  '    color: #3F536C !important;',
  '  }',
  '  .dropdown-mobile-close {',
  '    font-size: 24px !important;',
  '    color: var(--text-muted) !important;',
  '    cursor: pointer !important;',
  '  }',
  '',
  '  /* МОБИЛЬНЫЙ САЙДБАР */',
  '  .luxe-sidebar {',
  '    position: fixed !important;',
  '    top: 0 !important;',
  '    left: -320px !important;',
  '    width: 300px !important;',
  '    height: 100% !important;',
  '    border-radius: 0 24px 24px 0 !important;',
  '    z-index: 9999999 !important;',
  '    box-shadow: 10px 0 30px rgba(15, 23, 42, .15) !important;',
  '    display: flex !important;',
  '    flex-direction: column !important;',
  '    overflow: hidden !important;',
  '    padding: 0 !important;',
  '    transition: left .3s ease !important;',
  '    background: #fff !important;',
  '  }',
  '  .luxe-sidebar.sidebar-mobile-show {',
  '    left: 0 !important;',
  '  }',
  '  ',
  '  /* Мобильный футер */',
  '  .luxe-sidebar-mobile-footer {',
  '    display: flex !important;',
  '    position: absolute !important;',
  '    bottom: 0 !important;',
  '    left: 0 !important;',
  '    width: 100% !important;',
  '    background-color: #fff !important;',
  '    border-top: 1px solid var(--border-soft) !important;',
  '    padding: 12px 20px !important;',
  '    box-sizing: border-box !important;',
  '    z-index: 110 !important;',
  '    gap: 10px !important;',
  '  }',
  '  .luxe-sidebar-mobile-footer .c-button {',
  '    flex: 1 !important;',
  '    height: 42px !important;',
  '    border-radius: 8px !important;',
  '    display: inline-flex !important;',
  '    align-items: center !important;',
  '    justify-content: center !important;',
  '    font-size: 13px !important;',
  '    font-weight: 800 !important;',
  '    text-decoration: none !important;',
  '    box-sizing: border-box !important;',
  '    border: none !important;',
  '  }',
  '  .luxe-sidebar-mobile-footer .c-button--primary {',
  '    background-color: var(--primary) !important;',
  '    color: #fff !important;',
  '  }',
  '  .luxe-sidebar-mobile-footer .c-button--transparent {',
  '    background-color: transparent !important;',
  '    color: var(--text-muted) !important;',
  '    border: 1px solid var(--border-soft) !important;',
  '  }',
  '',
  '  .mobile-filter-floating-btn {',
  '    display: flex !important;',
  '    position: fixed !important;',
  '    bottom: 20px !important;',
  '    left: 50% !important;',
  '    transform: translateX(-50%) !important;',
  '    background-color: var(--primary) !important;',
  '    color: #ffffff !important;',
  '    font-weight: 800 !important;',
  '    padding: 14px 28px !important;',
  '    border-radius: 30px !important;',
  '    box-shadow: 0 10px 25px rgba(0, 164, 166, 0.3) !important;',
  '    z-index: 99999 !important;',
  '    text-transform: uppercase !important;',
  '    font-size: 13px !important;',
  '    letter-spacing: 0.5px !important;',
  '    align-items: center !important;',
  '    gap: 8px !important;',
  '    cursor: pointer !important;',
  '    border: none !important;',
  '    white-space: nowrap !important;',
  '  }',
  '  .sidebar-mobile-close-btn {',
  '    display: flex !important;',
  '    width: 36px !important;',
  '    height: 36px !important;',
  '    background-color: rgba(207,212,218,0.3) !important;',
  '    border-radius: 50% !important;',
  '    align-items: center !important;',
  '    justify-content: center !important;',
  '    position: absolute !important;',
  '    top: 15px !important;',
  '    right: 20px !important;',
  '    z-index: 101 !important;',
  '    cursor: pointer !important;',
  '    color: #3F536C !important;',
  '    font-size: 22px !important;',
  '  }',
  '  .luxe-sidebar-scrollable-body {',
  '    flex: 1 !important;',
  '    overflow-y: auto !important;',
  '    padding: 24px 20px 80px 20px !important;',
  '    width: 100% !important;',
  '  }',
  '  #catalog-content-wrapper {',
  '    margin-left: 0 !important;',
  '  }',
  '  ',
  '  .v1-grid {',
  '    grid-template-columns: 1fr !important;',
  '    gap: 20px !important;',
  '  }',
  '  .v1-card {',
  '    padding: 30px 20px !important;',
  '    border-radius: 24px !important;',
  '  }',
  '  .v1-footer-panel {',
  '    flex-direction: column !important;',
  '    padding: 24px 20px !important;',
  '  }',
  '',
  '  .grid-layout, .list-layout {',
  '    display: flex !important;',
  '    flex-direction: column !important;',
  '    gap: 24px !important;',
  '    width: 100% !important;',
  '  }',
  '  .list-layout .custom-card {',
  '    flex-direction: column !important;',
  '  }',
  '  .list-layout .custom-card .img-container {',
  '    width: 100% !important;',
  '    height: 200px !important;',
  '  }',
  '}'
].join('\n');

export default function Home({ properties = [], initialError }) {
  const router = useRouter()

  // Состояния для фильтров
  const [favorites, setFavorites] = useState([])
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false)
  const [isPostModalOpen, setIsPostModalOpen] = useState(false)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [activeStatusFilter, setActiveStatusFilter] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedRooms, setSelectedRooms] = useState('')
  
  // Состояния для просмотрщика изображений (Lightbox)
  const [lightboxProperty, setLightboxProperty] = useState(null)
  const [lightboxImageIdx, setLightboxImageIdx] = useState(0)

  // Загрузка избранного из localStorage на стороне клиента
  useEffect(() => {
    const stored = localStorage.getItem('lansmanbul_favorites')
    if (stored) {
      try {
        setFavorites(JSON.parse(stored))
      } catch (err) {
        console.error('Favorites parsing failed:', err)
      }
    }
  }, [])

  // Синхронизация статуса из URL (для фильтрации по кнопкам из Header/Footer)
  useEffect(() => {
    if (router.query.status) {
      setActiveStatusFilter(String(router.query.status))
    } else {
      setActiveStatusFilter('')
    }
  }, [router.query.status])

  // Переключение избранного
  const toggleLike = (e, id) => {
    if (e) e.stopPropagation()
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      localStorage.setItem('lansmanbul_favorites', JSON.stringify(next))
      return next
    })
  }

  // Списки для выпадающих фильтров, собираемые на основе полученных данных
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
      if (selectedRooms && p.rooms !== selectedRooms) {
        return false
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchTitle = p.title?.toLowerCase().includes(query)
        const matchDistrict = p.district?.toLowerCase().includes(query)
        if (!matchTitle && !matchDistrict) return false
      }
      return true
    })
  }, [properties, activeStatusFilter, selectedDistrict, selectedRooms, searchQuery])

  // Выборка избранных объектов для бокового ящика
  const favoriteProperties = useMemo(() => {
    return properties.filter((p) => favorites.includes(p.id))
  }, [properties, favorites])

  // Методы управления просмотрщиком картинок
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
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Mulish:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      <Header 
        favoritesCount={favorites.length}
        onOpenFavorites={() => setIsFavoritesOpen(true)}
        onOpenPostModal={() => setIsPostModalOpen(true)}
      />

      <main className="tilda-catalog-wrapper" style={{ marginTop: '90px', minHeight: '80vh', backgroundColor: '#f8fafc', paddingBottom: '60px' }}>
        
        {/* Секция Поиска / Hero-блок */}
        <div style={{ backgroundColor: '#00A4A6', padding: '40px 20px', color: '#fff', textAlign: 'center' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '20px' }}>Hayalinizdeki Evi Keşfedin</h1>
          
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {/* Текстовый поиск */}
            <input 
              type="text" 
              placeholder="Proje adı veya bölge ara..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', width: '100%', maxWidth: '300px', color: '#333' }}
            />

            {/* Фильтр по Районам */}
            <select 
              value={selectedDistrict} 
              onChange={(e) => setSelectedDistrict(e.target.value)}
              style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', color: '#333' }}
            >
              <option value="">Bölge Seçiniz</option>
              {districts.map((d) => (
                <option key={d} value={d.toLowerCase()}>{d}</option>
              ))}
            </select>

            {/* Фильтр по Комнатам */}
            <select 
              value={selectedRooms} 
              onChange={(e) => setSelectedRooms(e.target.value)}
              style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', color: '#333' }}
            >
              <option value="">Oda Sayısı</option>
              {roomsList.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            {/* Сброс фильтров */}
            {(searchQuery || selectedDistrict || selectedRooms || activeStatusFilter) && (
              <button 
                onClick={() => {
                  setSearchQuery('')
                  setSelectedDistrict('')
                  setSelectedRooms('')
                  router.push('/', undefined, { shallow: true })
                }}
                style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#e2e8f0', color: '#333', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Temizle
              </button>
            )}
          </div>
        </div>

        {/* Каталог объектов */}
        <div style={{ maxWidth: '1200px', margin: '40px auto 0 auto', padding: '0 20px' }}>
          {initialError && (
            <div style={{ padding: '20px', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '12px', marginBottom: '20px', fontWeight: 'bold' }}>
              Hata: {initialError}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b' }}>
              {activeStatusFilter ? `${activeStatusFilter} Projeleri` : 'Tüm Projeler'} ({filteredProperties.length})
            </h2>
          </div>

          {filteredProperties.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <p style={{ fontSize: '18px', fontWeight: '600' }}>Aradığınız kriterlere uygun ilan bulunamadı.</p>
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

      {/* Выдвижная панель "Избранное" / Личный кабинет */}
      <div className={`cabinet-drawer ${isFavoritesOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <span className="drawer-title">Favorilerim ({favorites.length})</span>
          <button className="drawer-close" onClick={() => setIsFavoritesOpen(false)}>&times;</button>
        </div>
        <div className="drawer-content">
          {favoriteProperties.length === 0 ? (
            <div className="drawer-empty-placeholder">
              <p>Favori ilanınız bulunmuyor.</p>
            </div>
          ) : (
            <div className="fav-list">
              {favoriteProperties.map((item) => (
                <div key={item.id} style={{ display: 'flex', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => { setIsFavoritesOpen(false); openLightbox(item); }}>
                  <img src={item.images?.[0] || 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=150&q=80'} style={{ width: '80px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} alt="" />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>{item.title}</h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#00A4A6', fontWeight: '800' }}>{item.price}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно подачи объявления (через WhatsApp) */}
      <div className={`modal-overlay ${isPostModalOpen ? 'open' : ''}`}>
        <div className="modal-card-box">
          <button className="modal-close-btn" onClick={() => setIsPostModalOpen(false)}>&times;</button>
          <h3 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '16px', color: '#1e293b' }}>Ücretsiz İlan Ver</h3>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', lineHeight: '1.5' }}>
            Projenizi veya mülkünüzü sitemizde ücretsiz yayınlamak için WhatsApp üzerinden müşteri temsilcimizle doğrudan iletişime geçebilirsiniz.
          </p>
          <div className="phone-highlight-block">+90 545 941 85 36</div>
          <a href="https://wa.me/905459418536" target="_blank" rel="noopener noreferrer" className="modal-green-btn">
            WhatsApp ile İletişime Geç
          </a>
        </div>
      </div>

      {/* Полноэкранный Lightbox (Детали Илана) */}
      {lightboxProperty && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.95)', zIndex: 100000000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#fff', fontSize: '36px', cursor: 'pointer' }} onClick={closeLightbox}>&times;</button>
          
          {/* Кнопки перелистывания в слайдере */}
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
            
            {/* Текстовые детали под слайдером */}
            <div style={{ marginTop: '20px', textAlign: 'center', color: '#fff', maxWidth: '600px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 8px 0' }}>{lightboxProperty.price}</h2>
              <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 8px 0' }}>{lightboxProperty.title}</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>{lightboxProperty.rooms} · {lightboxProperty.area} m² · {lightboxProperty.district}</p>
            </div>
          </div>

          <div className="lightbox-counter">
            {lightboxImageIdx + 1} / {lightboxProperty.images?.length || 1}
          </div>
        </div>
      )}

      <Footer />

      {/* Безопасное подключение глобальных стилей */}
      <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
    </>
  )
}

// Защищенный бэкенд-метод для безопасного получения и сортировки данных на стороне сервера
export async function getServerSideProps() {
  try {
    const { data: properties, error } = await supabase
      .from('properties')
      .select('*')

    if (error) throw error

    // Сортировка выполняется на сервере только если данные успешно получены и являются массивом
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
