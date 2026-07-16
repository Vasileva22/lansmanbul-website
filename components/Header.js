import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Header() {
  const router = useRouter();
  
  // Состояния для управления выпадающими списками и меню
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileProjectsOpen, setIsMobileProjectsOpen] = useState(false);
  const [isDesktopProjectsOpen, setIsDesktopProjectsOpen] = useState(false);
  
  // Ссылка на десктопный выпадающий список для отслеживания кликов вне его
  const desktopDropdownRef = useRef(null);

  // Блокируем скролл страницы на телефонах при открытом мобильном меню
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Закрываем десктопный выпадающий список при клике вне его области
  useEffect(() => {
    function handleClickOutside(event) {
      if (desktopDropdownRef.current && !desktopDropdownRef.current.contains(event.target)) {
        setIsDesktopProjectsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Вспомогательная функция для фильтрации / перехода по статусу
  const handleStatusRedirect = (status) => {
    setIsMobileMenuOpen(false);
    setIsDesktopProjectsOpen(false);
    
    // Перенаправляем на главную с параметром статуса
    router.push({
      pathname: '/',
      query: { status: status },
    });
  };

  return (
    <>
      <header className="modern-header">
        <div class="header-container">
          
          {/* ЛОГОТИП */}
          <Link href="/" class="modern-logo">
            <div class="logo-icon-box">
              <svg class="logo-icon-svg" viewBox="0 0 24 24">
                <path d="M19 2H9c-1.1 0-2 .9-2 2v3H3c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM5 20H3V9h2v11zm4 0H7v-3h2v3zm0-5H7v-3h2v3zm0-5H7V7h2v3zm10 10H11V4h8v16zm-2-12h-4v2h4V8zm0 4h-4v2h4v-2zm0 4h-4v2h4v-2z" />
              </svg>
            </div>
            <span class="logo-text">
              LANSMAN<span class="logo-text-accent">BUL</span>
            </span>
          </Link>

          {/* ДЕСКТОПНАЯ НАВИГАЦИЯ */}
          <nav class="modern-nav">
            <div 
              ref={desktopDropdownRef}
              className={`nav-item new-ssapkaprojelerimiz ${isDesktopProjectsOpen ? 'open' : ''}`}
              onClick={() => setIsDesktopProjectsOpen(!isDesktopProjectsOpen)}
            >
              <span class="txt-span">Projelerimiz</span>
              <svg class="nav-chevron-svg" viewBox="0 0 24 24">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>

              {/* Десктопный выпадающий список */}
              {isDesktopProjectsOpen && (
                <div className="header-desktop-dropdown" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => handleStatusRedirect('Lansman')} className="header-dropdown-item btn-reset">
                    Lansman
                  </button>
                  <button onClick={() => handleStatusRedirect('Devam ediyor')} className="header-dropdown-item btn-reset">
                    Devam ediyor
                  </button>
                  <button onClick={() => handleStatusRedirect('Tamamlandı')} className="header-dropdown-item btn-reset">
                    Tamamlandı
                  </button>
                </div>
              )}
            </div>
            <Link href="/#about-us-container" class="nav-item new-sapkahakkmzda">
              Hakkımızda
            </Link>
          </nav>

          {/* КОНТАКТЫ И КНОПКА МЕНЮ */}
          <div class="header-contact">
            <a href="tel:+905459418536" class="contact-phone">
              <svg class="phone-icon-svg" viewBox="0 0 24 24">
                <path d="M6.62 10.79a15.15 15.15 0 0 0 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
              </svg>
              <span>+90 545 941 85 36</span>
            </a>
            <a href="https://wa.me/905459418536" target="_blank" rel="noopener noreferrer" class="contact-whatsapp">
              <svg class="wa-icon-svg" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.488 1.977 14.02 1.953 12.01 1.953c-5.439 0-9.865 4.371-9.87 9.8-.002 1.714.453 3.39 1.317 4.883l-.994 3.634 3.791-.983z" />
              </svg>
            </a>
            <button className="mobile-burger-btn" onClick={() => setIsMobileMenuOpen(true)}>
              <svg class="burger-icon-svg" viewBox="0 0 24 24">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ФОН ДЛЯ МОБИЛЬНОГО МЕНЮ */}
      <div 
        className={`header-mobile-overlay ${isMobileMenuOpen ? 'show' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      {/* МОБИЛЬНОЕ МЕНЮ (БОКОВАЯ ПАНЕЛЬ) */}
      <div className={`mobile-nav-panel ${isMobileMenuOpen ? 'open' : ''}`}>
        <span className="mobile-nav-close" onClick={() => setIsMobileMenuOpen(false)}>
          &times;
        </span>
        <div class="mobile-nav-links">
          <div>
            <div 
              className="mobile-nav-item mobile-projects-trigger cursor-pointer"
              onClick={() => setIsMobileProjectsOpen(!isMobileProjectsOpen)}
            >
              <span>Projelerimiz</span>
              <svg 
                className={`nav-chevron-svg ${isMobileProjectsOpen ? 'rotate-180' : ''}`} 
                viewBox="0 0 24 24" 
                style={{ stroke: 'currentColor', strokeWidth: 2.5, fill: 'none' }}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            
            {/* Раскрывающийся список проектов в мобильном меню */}
            {isMobileProjectsOpen && (
              <div className="mobile-dropdown-container" style={{ display: 'block', paddingLeft: '16px', marginTop: '10px', marginBottom: '6px', borderLeft: '2px solid rgba(0, 164, 166, 0.3)' }}>
                <div>
                  <button onClick={() => handleStatusRedirect('Lansman')} className="mobile-dropdown-link btn-reset">
                    Lansman
                  </button>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <button onClick={() => handleStatusRedirect('Devam ediyor')} className="mobile-dropdown-link btn-reset">
                    Devam ediyor
                  </button>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <button onClick={() => handleStatusRedirect('Tamamlandı')} className="mobile-dropdown-link btn-reset">
                    Tamamlandı
                  </button>
                </div>
              </div>
            )}
          </div>
          <Link 
            href="/#about-us-container" 
            className="mobile-nav-item new-sapkahakkmzda"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Hakkımızda
          </Link>
        </div>
      </div>

      {/* Сброс стилей для кнопок, чтобы они выглядели как ссылки */}
      <style jsx>{`
        .btn-reset {
          background: none;
          border: none;
          padding: 0;
          font: inherit;
          cursor: pointer;
          text-align: left;
          width: 100%;
          display: block;
        }
      `}</style>
    </>
  );
}
