import { useState, useEffect, useMemo } from 'react';
import { DEFAULT_FILTERS, matchProject, sortProjects, SORTS, unknownPriceCount, deliveryYear, isReady } from '../lib/filters';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Head from 'next/head';

import Header from '../components/Header';
import Footer from '../components/Footer';
import HeroSearch from '../components/HeroSearch';
import PropertyCard from '../components/PropertyCard';
import CatalogMapView from '../components/CatalogMapView'; // <--- НОВЫЙ ИМПОРТ КАРТЫ
import SidebarFilters from '../components/SidebarFilters';
import { fetchCatalogProjects } from '../lib/projects';

// Компонент Лайтбокса встроен напрямую в файл, исключая внешние импорты
function Lightbox({ photos, activeIndex, onClose, onPrev, onRight }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onRight();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrev, onRight]);

  if (!photos || photos.length === 0) return null;

  return (
    <div className="custom-lightbox-overlay active" onClick={onClose}>
      <span className="custom-lightbox-close" onClick={onClose}>&times;</span>
      
      <div className="lightbox-slider-container" onClick={(e) => e.stopPropagation()}>
        <div className="lightbox-slide">
          <img src={photos[activeIndex]} alt="Büyük Görsel" />
        </div>

        {photos.length > 1 && (
          <>
            <div className="lightbox-arrow lightbox-arrow-left" onClick={onPrev}>❮</div>
            <div className="lightbox-arrow lightbox-arrow-right" onClick={onRight}>❯</div>
          </>
        )}
      </div>

      <div className="lightbox-counter">
        {(activeIndex + 1) + ' / ' + photos.length}
      </div>
    </div>
  );
}

export default function Home({ initialProperties, initialUsdRate }) {
  const router = useRouter();

  const [masterProperties, setMasterProperties] = useState(initialProperties || []);
  
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [layout, setLayout] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);

  // === НАЧАЛО ВСТАВКИ ===
  const usdRate = initialUsdRate || null; // курс ЦБ Турции, обновляется на сервере раз в сутки
  const [sort, setSort] = useState('recommended');
  // === КОНЕЦ ВСТАВКИ ===

  const [lightboxState, setLightboxState] = useState({
    isOpen: false,
    photos: [],
    activeIndex: 0,
  });

 const [filters, setFilters] = useState(DEFAULT_FILTERS);
  // «Режим иностранца» включается сам, когда выбран один из двух флажков в блоке «Yabancı alıcılar için»
  const isForeigner = filters.activeFeatureFilters.includes('Vatandaşlığa Uygun') || filters.activeFeatureFilters.includes('İkamete Uygun');
  const setIsForeigner = () => {};

  // Безопасный клиентский fetch
  useEffect(() => {
    async function loadClientData() {
      if (masterProperties.length === 0) {
        try {
          const data = await fetchCatalogProjects();
          setMasterProperties(data);
        } catch (err) {
          console.error("Client fetch error:", err);
        }
      }
    }
    loadClientData();
  }, []);

  // Единая функция синхронизации параметров фильтра из URL
  const syncFiltersFromUrl = (url) => {
    let searchString = '';
    if (typeof url === 'string') {
      searchString = url.includes('?') ? url.split('?')[1] : '';
    } else {
      searchString = typeof window !== 'undefined' ? window.location.search : '';
    }

    const params = new URLSearchParams(searchString);
    const status = params.get('status');
    const scrollto = params.get('scrollto');
    const ilce = params.get('ilce');
    setFilters((prev) => ({ ...prev, selectedLocations: ilce ? [ilce] : prev.selectedLocations }));

    if (status) {
      setFilters((prev) => ({
        ...prev,
        selectedStatuses: [status],
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        selectedStatuses: [],
      }));
    }

    if (scrollto) {
      setTimeout(() => {
        const element = document.querySelector('[data-id="' + scrollto + '"]');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.style.boxShadow = '0 0 25px rgba(0, 164, 166, 0.45)';
          setTimeout(() => {
            element.style.boxShadow = '';
          }, 2500);
        }
      }, 800);
    }
  };

  useEffect(() => {
    if (router.isReady) {
      syncFiltersFromUrl();
    }
  }, [router.isReady]);

  useEffect(() => {
    router.events.on('routeChangeComplete', syncFiltersFromUrl);
    return () => {
      router.events.off('routeChangeComplete', syncFiltersFromUrl);
    };
  }, [router]);

  // 3D скролл анимация
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          } else {
            entry.target.classList.remove('revealed');
          }
        });
      },
      { root: null, threshold: 0.15 }
    );

    const targets = document.querySelectorAll('.scroll-3d-target');
    targets.forEach((el) => observer.observe(el));

    return () => targets.forEach((el) => observer.unobserve(el));
  }, [masterProperties]);

  const uniqueLocations = useMemo(() => {
    const locs = masterProperties.map((p) => p['İlçe/Semt'] || p.address_district).filter(Boolean);
    return [...new Set(locs)].sort();
  }, [masterProperties]);

  const uniqueRooms = useMemo(() => {
    const rooms = masterProperties.map((p) => p['card odalar'] || p.rooms_text).filter(Boolean);
    return [...new Set(rooms)].sort();
  }, [masterProperties]);

  // === НОВОЕ: Автоматически собираем только существующие удобства из базы ===
  const uniqueFeatures = useMemo(() => {
    const allFeats = masterProperties.flatMap((p) => {
      if (!p.Özellikler) return [];
      if (Array.isArray(p.Özellikler)) return p.Özellikler;
      return String(p.Özellikler).split(/[\/,]/).map(s => s.trim()).filter(Boolean);
    });
    // Приводим к красивому регистру (первая буква заглавная) и убираем дубликаты
    const capitalized = allFeats.map(f => f.charAt(0).toUpperCase() + f.slice(1));
    return [...new Set(capitalized)].sort();
  }, [masterProperties]);

  const uniqueStatuses = useMemo(() => {
    return ["Lansman", "Devam ediyor", "Tamamlandı"];
  }, []);

  const uniqueYears = useMemo(() => {
    const rel = masterProperties.filter((p) => !filters.selectedStatuses.length || filters.selectedStatuses.includes(String(p.project_status || p.konutcesit || '').trim()));
    const years = Array.from(new Set(rel.map(deliveryYear).filter(Boolean))).sort();
    return rel.some(isReady) ? ['Hazır', ...years] : years;
  }, [masterProperties, filters.selectedStatuses]);
// Логика фильтрации
  const filteredProperties = useMemo(
    () => sortProjects(masterProperties.filter((p) => matchProject(p, filters, { isForeigner })), sort),
    [masterProperties, filters, isForeigner, sort],
  );
  const activeFilterCount = useMemo(() => {
    const f = filters;
    return f.selectedLocations.length + f.selectedRooms.length + f.selectedStatuses.length + f.selectedYears.length
      + f.activeFeatureFilters.length + f.activePaymentFilters.length
      + (f.priceRange[0] > 0 || f.priceRange[1] < 50000000 ? 1 : 0)
      + (f.areaRange[0] > 0 || f.areaRange[1] < 500 ? 1 : 0)
      + (f.katRange[0] > 0 || f.katRange[1] < 40 ? 1 : 0);
  }, [filters]);
  const hiddenNoPrice = useMemo(() => unknownPriceCount(masterProperties, filters), [masterProperties, filters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sort, isForeigner]);

 const itemsPerPage = 12;
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);

  const paginatedProperties = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredProperties.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredProperties, currentPage, itemsPerPage]);

 const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSort('recommended');
    router.push('/', undefined, { shallow: true });
  };

  const handleOpenLightbox = (photos, index) => {
    setLightboxState({
      isOpen: true,
      photos: photos,
      activeIndex: index,
    });
  };

  // Сохраняем каталог на время визита — «Избранное» откроется мгновенно
  useEffect(() => {
    try {
      if (masterProperties.length) sessionStorage.setItem('lb-catalog', JSON.stringify(masterProperties));
    } catch (e) { /* хранилище недоступно — не страшно */ }
  }, [masterProperties]);

  return (
    <>
      <Head>
        <title>Ankara Yeni Konut Projeleri | LansmanBul</title>
        <meta name="description" content="Ankara'daki yeni konut projeleri tek yerde: inşaat aşaması, teslim tarihi, planlar ve onaylı projeler. Alıcıdan komisyon alınmaz." />
      </Head>
      <Header setFilters={setFilters} />

      <HeroSearch 
        filters={filters}
        setFilters={setFilters}
        uniqueLocations={uniqueLocations}
        uniqueRooms={uniqueRooms}
        uniqueStatuses={uniqueStatuses}
   properties={masterProperties}
        onSearch={() => {
          const target = document.getElementById('custom-catalog-search');
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
      />

     <section id="custom-catalog-search">
        
        {/* Мобильная плавающая кнопка */}
        <button 
          className="mobile-filter-floating-btn show-btn" 
          onClick={() => setIsMobileSidebarOpen(true)}
        >
          <svg style={{ width: 16, height: 16, fill: 'currentColor' }} viewBox="0 0 24 24">
            <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/>
          </svg>
          <span>Filtreleme</span>
        </button>

        {/* Колонка 1: Сайдбар */}
        <SidebarFilters 
          filteredProperties={filteredProperties}
          totalCount={filteredProperties.length}
          filters={filters}
          setFilters={setFilters}
          onClearFilters={handleClearFilters}
          isMobileSidebarOpen={isMobileSidebarOpen}
          setIsMobileSidebarOpen={setIsMobileSidebarOpen}
          isSidebarHidden={isSidebarHidden}
          isForeigner={isForeigner}
          setIsForeigner={setIsForeigner}
          usdRate={usdRate}
          uniqueYears={uniqueYears}
          uniqueFeatures={uniqueFeatures}
        />

        {/* Колонка 2: Каталог */}
        <div id="catalog-content-wrapper" className={isSidebarHidden ? 'full-width' : ''}>
          
          {/* СОВРЕМЕННЫЙ ТУЛБАР В СТИЛЕ КЛОДА */}
          <div className="catalog-toolbar-modern">
            <div className="tb-left">
              <button 
                className="fbtn-modern"
                onClick={() => setIsSidebarHidden(!isSidebarHidden)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 6h16M7 12h10M10 18h4"/>
                </svg>
                <span>Filtreler</span>
                {activeFilterCount > 0 && (
                  <span style={{ marginLeft: 6, minWidth: 20, height: 20, borderRadius: 999, background: '#0F6E56', color: '#fff', fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' }}>{activeFilterCount}</span>
                )}
              </button>

            </div>

            <div className="tb-right">

              {/* Переключатель вида: Galeri / Liste / Harita */}
              <div className="view-toggle-modern">
                <button 
                  className={layout === 'grid' ? 'active' : ''}
                  onClick={() => setLayout('grid')}
                  title="Galeri"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/>
                    <rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/>
                  </svg>
                  <span>Galeri</span>
                </button>
                <button 
                  className={layout === 'list' ? 'active' : ''}
                  onClick={() => setLayout('list')}
                  title="Liste"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3.5" y="4.5" width="17" height="6" rx="1.5"/><rect x="3.5" y="13.5" width="17" height="6" rx="1.5"/>
                  </svg>
                  <span>Liste</span>
                </button>
                <button 
                  className={layout === 'map' ? 'active' : ''}
                  onClick={() => setLayout('map')}
                  title="Harita"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 21s-6-5.2-6-10a6 6 0 0 1 12 0c0 4.8-6 10-6 10z"/><circle cx="12" cy="11" r="2.5"/>
                  </svg>
                  <span>Harita</span>
                </button>
              </div>
            </div>
          </div>

          {/* Строка количества и активные чипсы-фильтры */}
          <div className="catalog-meta-row">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', width: '100%' }}>
              <h2 className="catalog-count-text">
                {filteredProperties.length} proje listeleniyor
              </h2>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#475569' }}>
                Sırala:
                <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sıralama"
                  style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #d6dfdb', background: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, color: '#04342C', cursor: 'pointer' }}>
                  {SORTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
            </div>
            {hiddenNoPrice > 0 && (
              <p style={{ fontSize: 13, color: '#5B6B68', margin: '4px 0 0', width: '100%' }}>
                Fiyatı henüz onaylanmamış {hiddenNoPrice} proje fiyat filtresinde gösterilmiyor.
              </p>
            )}

            {/* Активные чипсы фильтров с возможностью удаления нажатием на × */}
            {(filters.selectedLocations.length > 0 || filters.selectedRooms.length > 0 || filters.selectedStatuses.length > 0 || filters.activeFeatureFilters.length > 0) && (
              <div className="active-chips-container">
                {filters.selectedLocations.map((loc) => (
                  <button 
                    key={loc} 
                    className="active-filter-chip"
                    onClick={() => setFilters(prev => ({ ...prev, selectedLocations: prev.selectedLocations.filter(x => x !== loc) }))}
                  >
                    <span>{loc}</span>
                    <i>×</i>
                  </button>
                ))}
                {filters.selectedRooms.map((room) => (
                  <button 
                    key={room} 
                    className="active-filter-chip"
                    onClick={() => setFilters(prev => ({ ...prev, selectedRooms: prev.selectedRooms.filter(x => x !== room) }))}
                  >
                    <span>{room}</span>
                    <i>×</i>
                  </button>
                ))}
                {filters.selectedStatuses.map((st) => (
                  <button 
                    key={st} 
                    className="active-filter-chip"
                    onClick={() => setFilters(prev => ({ ...prev, selectedStatuses: prev.selectedStatuses.filter(x => x !== st) }))}
                  >
                    <span>{st}</span>
                    <i>×</i>
                  </button>
                ))}
                {filters.activeFeatureFilters.map((feat) => (
                  <button 
                    key={feat} 
                    className="active-filter-chip"
                    onClick={() => setFilters(prev => ({ ...prev, activeFeatureFilters: prev.activeFeatureFilters.filter(x => x !== feat) }))}
                  >
                    <span>{feat}</span>
                    <i>×</i>
                  </button>
                ))}
                <button className="clear-all-chips-btn" onClick={handleClearFilters}>
                  Tümünü Temizle
                </button>
              </div>
            )}
          </div>

          {layout === 'map' ? (
            <CatalogMapView properties={filteredProperties} />
          ) : paginatedProperties.length > 0 ? (
           <div id="catalog-list" className={layout === 'grid' ? 'grid-layout' : 'list'}>
              {paginatedProperties.map((property) => (
                <PropertyCard 
                  key={property.id} 
                  property={property} 
                  onImageClick={handleOpenLightbox}
                  selectedRooms={filters.selectedRooms}
                  layout={layout}
                />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <h3>Aradığınız kriterlere uygun proje bulunamadı.</h3>
              <p>Lütfen filtreleri sıфırlayarak tekrar deneyin.</p>
              <button className="btn btn-primary" onClick={handleClearFilters} style={{ marginTop: 15 }}>
                Filtreleri Temizle
              </button>
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination-container">
              <button 
                className="pagination-item" 
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{ opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
              >
                ❮
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button 
                  key={page}
                  className={'pagination-item ' + (currentPage === page ? 'active' : '')}
                  onClick={() => {
                    setCurrentPage(page);
                    document.getElementById('custom-catalog-search').scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  {page}
                </button>
              ))}

              <button 
                className="pagination-item" 
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{ opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
              >
                ❯
              </button>
            </div>
          )}

          <div id="about-us-container">
            <section className="v1-section">
              <div className="v1-intro">
                <span className="v1-badge">Alıcıdan komisyon yok • Onaylı projeler • Şeffaf bilgi</span>
                <h2 className="v1-title">LansmanBul ile <span>güvenle</span> yeni konut keşfi</h2>
                <p className="v1-desc">Ankara'daki yeni konut projelerini tek yerde topluyoruz. Fiyat, fotoğraf ve ödeme koşullarını geliştirici firma onaylar; inşaat aşamasını ve teslim tarihini açıkça görürsünüz.</p>
              </div>

              <div className="v1-grid v-grid">
                <div className="v1-card scroll-3d-target">
                  <div className="v1-icon-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="5" x2="5" y2="19"></line><circle cx="6.5" cy="6.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle></svg>
                  </div>
                  <h3 className="v1-card-title">Alıcıdan %0 Komisyon</h3>
                  <p className="v1-card-desc">LansmanBul alıcıdan komisyon almaz. Satın alma bütçeniz tamamen kendi yatırımınızda kalır.</p>
                </div>

                <div className="v1-card scroll-3d-target">
                  <div className="v1-icon-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  </div>
                  <h3 className="v1-card-title">Firmayla Doğrudan İletişim</h3>
                  <p className="v1-card-desc">Onaylı projelerde WhatsApp butonu sizi doğrudan projenin satış ekibine bağlar. Arada aracı yoktur.</p>
                </div>

                <div className="v1-card scroll-3d-target">
                  <div className="v1-icon-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  </div>
                  <h3 className="v1-card-title">Doğrulanmış Firmalar</h3>
                  <p className="v1-card-desc">«✓ Onaylı proje» rozeti, bilgileri firmanın kendisi tarafından onaylanan projelerde görünür. Firmaları vergi kaydına göre doğruluyoruz.</p>
                </div>
              </div>

              <div className="v1-footer-panel">
                <div className="v1-footer-text">
                  <h4>Doğrudan rehberliğe mi ihtiyacınız var?</h4>
                  <p>Hangi projenin bütçenize en uygun olduğuna karar veremediyseniz, doğrudan bizimle iletişime geçebilirsiniz.</p>
                </div>
                <a href="https://wa.me/905459418536" target="_blank" rel="noopener noreferrer" className="kb-btn kb-btn-wa">
                  <svg className="kb-icon" viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: 'currentColor', marginRight: 8 }}><path d="M20.065 17.149c-.683-.344-4.04-1.995-4.666-2.224-.627-.229-1.083-.343-1.538.343-.456.687-1.768 2.224-2.166 2.68-.399.458-.799.515-1.482.172-3.197-1.6-4.57-2.224-6.398-5.362-.484-.834.484-.775 1.385-2.58.15-.3.075-.558-.037-.787-.114-.228-1.083-2.61-1.482-3.575-.388-.934-.781-.808-1.083-.823-.28-.014-.599-.016-.913-.016-.314 0-.827.118-1.254.582-.428.466-1.63 1.593-1.63 3.882 0 2.288 1.66 4.498 1.888 4.802.228.304 3.268 4.992 7.915 7.001 3.856 1.666 4.636 1.334 5.488 1.254.852-.08 2.743-1.122 3.125-2.203.383-1.082.383-2.01.269-2.204-.114-.19-.428-.305-1.111-.649z"/></svg>
                  Bize WhatsApp'tan Ulaşın
                </a>
              </div>
            </section>
          </div>

        </div>
      </section>

      {/* ПРЕДСТАВЛЕНИЕ ЛАЙТБОКСА ПО КЛИКУ НА ФОТО */}
      {lightboxState.isOpen && (
        <Lightbox 
          photos={lightboxState.photos}
          activeIndex={lightboxState.activeIndex}
          onClose={() => setLightboxState(prev => ({ ...prev, isOpen: false }))}
          onPrev={() => setLightboxState(prev => ({
            ...prev,
            activeIndex: (prev.activeIndex - 1 + prev.photos.length) % prev.photos.length
          }))}
          onRight={() => setLightboxState(prev => ({
            ...prev,
            activeIndex: (prev.activeIndex + 1) % prev.photos.length
          }))}
        />
      )}

      <Footer setFilters={setFilters} />
    </>
  );
}

export async function getServerSideProps() {
  try {
    const { getCatalogProjects } = await import('../lib/projectsServer');
    const { getUsdRate } = await import('../lib/fx');
    const [properties, fx] = await Promise.all([getCatalogProjects(), getUsdRate().catch(() => ({ rate: null }))]);
    return { props: { initialProperties: properties || [], initialUsdRate: fx.rate || null } };
  } catch (err) {
    console.error("Server-side properties fetch error:", err);
    return { props: { initialProperties: [] } };
  }
}
