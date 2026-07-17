import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

import Header from '../components/Header';
import Footer from '../components/Footer';
import HeroSearch from '../components/HeroSearch';
import PropertyCard from '../components/PropertyCard';

// Безопасный динамический импорт боковой панели без SSR
const SidebarFilters = dynamic(() => import('../components/SidebarFilters'), {
  ssr: false,
});

// ПУНКТ 7: Компонент Лайтбокса встроен напрямую в файл, исключая внешние импорты
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

export default function Home({ initialProperties }) {
  const router = useRouter();

  const [masterProperties, setMasterProperties] = useState(initialProperties || []);
  
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [layout, setLayout] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCookieBanner, setShowCookieBanner] = useState(false);

  const [lightboxState, setLightboxState] = useState({
    isOpen: false,
    photos: [],
    activeIndex: 0,
  });

  const [filters, setFilters] = useState({
    selectedLocations: [],
    selectedRooms: [],
    selectedStatuses: [],
    areaRange: [0, 500],
    katRange: [0, 40],
    priceRange: [0, 50000000],
    activeFeatureFilters: [],
    activePaymentFilters: [],
  });

  // Безопасный клиентский fetch
  useEffect(() => {
    async function loadClientData() {
      if (masterProperties.length === 0) {
        const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/^["']|["']$/g, '').trim();
        const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').replace(/^["']|["']$/g, '').trim();

        if (!supabaseUrl || !supabaseAnonKey) return;

        try {
          const res = await fetch(
            supabaseUrl + '/rest/v1/properties?select=*,property_images(*)',
            {
              headers: {
                'apikey': supabaseAnonKey,
                'Authorization': 'Bearer ' + supabaseAnonKey,
              },
            }
          );
          if (res.ok) {
            const data = await res.json();
            setMasterProperties(data);
          }
        } catch (err) {
          console.error("Client fetch error:", err);
        }
      }
    }
    loadClientData();
  }, []);

  // Синхронизация поиска из шапки
  useEffect(() => {
    if (!router.isReady) return;

    const { status, scrollto } = router.query;

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
  }, [router.isReady, router.query.status, router.query.scrollto]);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setTimeout(() => setShowCookieBanner(true), 1500);
    }
  }, []);

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

 const uniqueStatuses = useMemo(() => {
    // Возвращаем всегда три наших базовых статуса, чтобы не зависеть от загрузки базы данных
    return ["Lansman", "Devam ediyor", "Tamamlandı"];
  }, []);

  // Логика фильтрации
  const filteredProperties = useMemo(() => {
    return masterProperties.filter((property) => {
      if (
        filters.selectedLocations.length > 0 &&
        !filters.selectedLocations.includes(property['İlçe/Semt'])
      ) {
        return false;
      }

      if (
        filters.selectedRooms.length > 0 &&
        !filters.selectedRooms.includes(property['card odalar'])
      ) {
        return false;
      }

     if (filters.selectedStatuses.length > 0) {
        const propStatus = property.konutcesit ? String(property.konutcesit).trim().toLowerCase() : "";
        const isMatched = filters.selectedStatuses.some((status) => {
          const cleanStatus = String(status).trim().toLowerCase();
          return propStatus === cleanStatus;
        });
        if (!isMatched) return false;
      }

      const area = parseInt(property['card-area']) || 0;
      if (area < filters.areaRange[0] || area > filters.areaRange[1]) {
        return false;
      }

      const katRaw = property['Kat Sayısı'] || property.Kat_Sayisi || property.katsayisi || 0;
      const kat = parseInt(String(katRaw).replace(/\D/g, '')) || 0;
      if (kat < filters.katRange[0] || kat > filters.katRange[1]) {
        return false;
      }

      const priceRaw = String(property.Fiyat || "").replace(/\./g, '');
      const price = parseInt(priceRaw.replace(/\D/g, '')) || 0;
      if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
        return false;
      }

      if (filters.activeFeatureFilters.length > 0) {
        const propFeatures = property.Özellikler
          ? String(property.Özellikler).toLowerCase().replace(/ı/g, 'i').replace(/ş/g, 's')
          : '';
        const allMatched = filters.activeFeatureFilters.every((feat) => {
          const normFeat = feat.toLowerCase().replace(/ı/g, 'i').replace(/ş/g, 's');
          return propFeatures.includes(normFeat);
        });
        if (!allMatched) return false;
      }

      if (filters.activePaymentFilters.length > 0) {
        const matchesAny = filters.activePaymentFilters.some((pay) => {
          const normPay = pay.toLowerCase().replace(/ı/g, 'i').replace(/ş/g, 's');
          const krediDurumu = String(property.Kredi_Durumu || "").trim();
          const vadeSecenegi = String(property.Vade_Secenegi || "").trim();
          const ilkPesinat = String(property.Ilk_Pesinat || "").trim();

          if (normPay.includes("kredi")) return krediDurumu !== "";
          if (normPay.includes("taksit")) return vadeSecenegi !== "" || ilkPesinat !== "";
          if (normPay.includes("pesin")) return vadeSecenegi === "" && ilkPesinat === "";
          return false;
        });
        if (!matchesAny) return false;
      }

      return true;
    });
  }, [masterProperties, filters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const itemsPerPage = isSidebarHidden ? 12 : 8;
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);

  const paginatedProperties = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredProperties.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredProperties, currentPage, itemsPerPage]);

  const handleClearFilters = () => {
    setFilters({
      selectedLocations: [],
      selectedRooms: [],
      selectedStatuses: [],
      areaRange: [0, 500],
      katRange: [0, 40],
      priceRange: [0, 50000000],
      activeFeatureFilters: [],
      activePaymentFilters: [],
    });
    router.push('/', undefined, { shallow: true });
  };

  const handleCookieAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setShowCookieBanner(false);
  };

  const handleCookieReject = () => {
    localStorage.setItem('cookie_consent', 'rejected');
    setShowCookieBanner(false);
  };

  const handleOpenLightbox = (photos, index) => {
    setLightboxState({
      isOpen: true,
      photos: photos,
      activeIndex: index,
    });
  };

  return (
    <>
      <Header />

      <HeroSearch 
        filters={filters}
        setFilters={setFilters}
        uniqueLocations={uniqueLocations}
        uniqueRooms={uniqueRooms}
        uniqueStatuses={uniqueStatuses}
        onSearch={() => {
          const target = document.getElementById('custom-catalog-search');
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
      />

      <section id="custom-catalog-search">
        <SidebarFilters 
          filteredProperties={filteredProperties}
          totalCount={filteredProperties.length}
          filters={filters}
          setFilters={setFilters}
          onClearFilters={handleClearFilters}
          isMobileSidebarOpen={isMobileSidebarOpen}
          setIsMobileSidebarOpen={setIsMobileSidebarOpen}
          isSidebarHidden={isSidebarHidden}
        />

        <button 
          className="mobile-filter-floating-btn show-btn" 
          onClick={() => setIsMobileSidebarOpen(true)}
        >
          <svg style={{ width: 16, height: 16, fill: 'currentColor' }} viewBox="0 0 24 24">
            <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/>
          </svg>
          <span>Filtreleme</span>
        </button>

        <div 
          id="sidebar-toggle-btn"
          onClick={() => setIsSidebarHidden(!isSidebarHidden)}
          style={{ left: isSidebarHidden ? '0px' : '310px', transition: 'left 0.3s ease' }}
        >
          {isSidebarHidden ? '❯' : '❮'}
        </div>

        <div id="catalog-content-wrapper" className={isSidebarHidden ? 'full-width' : ''}>
          
          <div className="catalog-control-bar">
            <div className="layout-toggle">
              <button 
                className={'toggle-btn ' + (layout === 'grid' ? 'active' : '')}
                onClick={() => setLayout('grid')}
                title="Izgara Görünümü"
              >
                <svg className="toggle-icon" viewBox="0 0 24 24"><path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"/></svg>
              </button>
              <button 
                className={'toggle-btn ' + (layout === 'list' ? 'active' : '')}
                onClick={() => setLayout('list')}
                title="Liste Görünümü"
              >
                <svg className="toggle-icon" viewBox="0 0 24 24"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5s1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5S5.5 6.83 5.5 6S4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5s1.5-.68 1.5-1.5s-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-7v2h14V6H7z"/></svg>
              </button>
            </div>
          </div>

          {paginatedProperties.length > 0 ? (
            <div id="catalog-list" className={layout === 'grid' ? 'grid-layout' : 'list-layout'}>
              {paginatedProperties.map((property) => (
                <PropertyCard 
                  key={property.id} 
                  property={property} 
                  onImageClick={handleOpenLightbox}
                />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <h3>Aradığınız kriterlere uygun proje bulunamadı.</h3>
              <p>Lütfen filtreleri sıfırlayarak tekrar deneyin.</p>
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
                <span className="v1-badge">Aracısız • Komisyonsuz • Doğrudan</span>
                <h2 className="v1-title">Konutbudur ile <span>Yeni Nesil</span> Konut Keşfi</h2>
                <p className="v1-desc">Türkiye'nin önde gelen inşaat firmalarını tek platformda topladık. Klasik emlakçı süreçlerini tamamen devre dışı bırakarak hayalinizdeki eve doğrudan, güvenle ulaşmanızı sağlıyoruz.</p>
              </div>

              <div className="v1-grid v-grid">
                <div className="v1-card scroll-3d-target">
                  <div className="v1-icon-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="5" x2="5" y2="19"></line><circle cx="6.5" cy="6.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle></svg>
                  </div>
                  <h3 className="v1-card-title">%0 Emlakçı Komisyonu</h3>
                  <p className="v1-card-desc">Sıfır aracı, sıфır komisyon. Satın alım bütçenizin tek bir курушу bile emlakçı komisyonuna gitmez, doğrudan kendi yatırımınızda kalır.</p>
                </div>

                <div className="v1-card scroll-3d-target">
                  <div className="v1-icon-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  </div>
                  <h3 className="v1-card-title">Müteahhitle Birebir İletişim</h3>
                  <p className="v1-card-desc">Hiçbir engel yok. Tek tıkla doğrudan inşaat projesinin resmi temsilcisine bağlanır, tüm teknik и mali detayları birinci елден öğrenirsiniz.</p>
                </div>

                <div className="v1-card scroll-3d-target">
                  <div className="v1-icon-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  </div>
                  <h3 className="v1-card-title">Referanslı İnşaat Firmaları</h3>
                  <p className="v1-card-desc">Güvenliğiniz önceliğimizdir. Platformumuzda sadece rüştünü ispatlamış, geçmişte başarılı projeler tamamlamış и güçlü referanslara sahip olan güvenilir inşaat firmalarının projelerine yer veriyoruz.</p>
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

      {showCookieBanner && (
        <div className="cookie-consent-banner show" id="cookie-banner">
          <div className="cookie-consent-container">
            <p className="cookie-consent-text">
              Size daha iyi bir deneyim sunabilmek için web sitemizde çerezler kullanıyoruz. Sitemizi kullanmaya devam ederek çerez kullanımını kabul etmiş sayılırsınız. Detaylı bilgi için <a href="https://increase-fine-snappea.tilda.ws/gizlilik-politikasi" target="_blank" rel="noopener noreferrer">Gizlilik Politikamızı</a> inceleyebilirsiniz.
            </p>
            <div className="cookie-consent-buttons">
              <button className="cookie-btn cookie-btn-reject" onClick={handleCookieReject}>Reddet</button>
              <button className="cookie-btn cookie-btn-accept" onClick={handleCookieAccept}>Kabul Et</button>
            </div>
            <span className="cookie-consent-close" onClick={() => setShowCookieBanner(false)}>&times;</span>
          </div>
        </div>
      )}

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

      <Footer />
    </>
  );
}

export async function getServerSideProps() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/^["']|["']$/g, '').trim();
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').replace(/^["']|["']$/g, '').trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      props: {
        initialProperties: [],
      },
    };
  }

  try {
    const res = await fetch(
      supabaseUrl + '/rest/v1/properties?select=*,property_images(*)',
      {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': 'Bearer ' + supabaseAnonKey,
        },
      }
    );

    if (!res.ok) {
      throw new Error('Supabase REST error: ' + res.statusText);
    }

    const properties = await res.json();

    return {
      props: {
        initialProperties: properties || [],
      },
    };
  } catch (err) {
    console.error("Server-side properties fetch error:", err);
    return {
      props: {
        initialProperties: [],
      },
    };
  }
}
