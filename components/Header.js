import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Header() {
  const router = useRouter()
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [isMobileProjectsOpen, setIsMobileProjectsOpen] = useState(false)

  const handleStatusSelect = (status) => {
    setIsMobileNavOpen(false)
    setIsMobileProjectsOpen(false)
    router.push(
      {
        pathname: '/',
        query: { status },
      },
      undefined,
      { shallow: true }
    )
  }

  return (
    <>
      <header className="modern-header">
        <div className="header-container">
          <Link href="/" className="modern-logo">
            <div className="logo-icon-box">
              <svg className="logo-icon-svg" viewBox="0 0 24 24">
                <path d="M19 2H9c-1.1 0-2 .9-2 2v3H3c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM5 20H3V9h2v11zm4 0H7v-3h2v3zm0-5H7v-3h2v3zm0-5H7V7h2v3zm10 10H11V4h8v16zm-2-12h-4v2h4V8zm0 4h-4v2h4v-2zm0 4h-4v2h4v-2z" />
              </svg>
            </div>
            <span className="logo-text">LANSMAN<span className="logo-text-accent">BUL</span></span>
          </Link>
          
          <nav className="modern-nav">
            <div 
              className={`nav-item new-ssapkaprojelerimiz ${isMobileProjectsOpen ? 'open' : ''}`}
              onClick={() => setIsMobileProjectsOpen(!isMobileProjectsOpen)}
            >
              <span className="txt-span">Projelerimiz</span>
              <svg className="nav-chevron-svg" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
            <a href="#about-us-container" className="nav-item new-sapkahakkmzda">Hakkımızda</a>
          </nav>

          <div className="header-contact">
            <a href="tel:+905459418536" className="contact-phone">
              <svg className="phone-icon-svg" viewBox="0 0 24 24"><path d="M6.62 10.79a15.15 15.15 0 0 0 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" /></svg>
              <span>+90 545 941 85 36</span>
            </a>
            <a href="https://wa.me/905459418536" target="_blank" rel="noopener noreferrer" className="contact-whatsapp">
              <svg className="wa-icon-svg" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.953-2.005-.001-3.973-.502-5.71-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.488 1.977 14.02 1.953 12.01 1.953c-5.439 0-9.865 4.371-9.87 9.8-.002 1.714.453 3.39 1.317 4.883l-.994 3.634 3.791-.983z" /></svg>
            </a>
            <button className="mobile-burger-btn" onClick={() => setIsMobileNavOpen(true)}>
              <svg className="burger-icon-svg" viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
          </div>
        </div>
      </header>

      {isMobileProjectsOpen && (
        <div className="absolute right-[35%] top-[85px] bg-white border border-gray-100 rounded-lg shadow-xl p-3 z-[100000] w-52 flex flex-col gap-2">
          <span className="text-xs text-gray-400 font-extrabold px-3 py-1 uppercase tracking-wider">Durum Seç</span>
          <button onClick={() => handleStatusSelect('Lansman')} className="text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded font-medium">Lansman</button>
          <button onClick={() => handleStatusSelect('Devam ediyor')} className="text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded font-medium">Devam Ediyor</button>
          <button onClick={() => handleStatusSelect('Tamamlandı')} className="text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded font-medium">Tamamlandı</button>
        </div>
      )}

      <div className={`header-mobile-overlay ${isMobileNavOpen ? 'show' : ''}`} onClick={() => setIsMobileNavOpen(false)} />
      <div className={`mobile-nav-panel ${isMobileNavOpen ? 'open' : ''}`}>
        <span className="mobile-nav-close" onClick={() => setIsMobileNavOpen(false)}>&times;</span>
        <div className="mobile-nav-links">
          <div>
            <div 
              className="mobile-nav-item mobile-projects-trigger cursor-pointer"
              onClick={() => setIsMobileProjectsOpen(!isMobileProjectsOpen)}
            >
              <span>Projelerimiz</span>
              <svg className={`nav-chevron-svg transition-transform ${isMobileProjectsOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" style={{ stroke: 'currentColor', strokeWidth: '2.5', fill: 'none' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
            
            {isMobileProjectsOpen && (
              <div className="mobile-dropdown-container block pl-4 mt-2.5 mb-1.5 border-l-2 border-[#00a4a6]/30">
                <button onClick={() => handleStatusSelect('Lansman')} className="mobile-dropdown-link text-left block w-full text-sm font-semibold text-slate-500 py-1.5 animate-fade-in">Lansman</button>
                <button onClick={() => handleStatusSelect('Devam ediyor')} className="mobile-dropdown-link text-left block w-full text-sm font-semibold text-slate-500 py-1.5 animate-fade-in">Devam ediyor</button>
                <button onClick={() => handleStatusSelect('Tamamlandı')} className="mobile-dropdown-link text-left block w-full text-sm font-semibold text-slate-500 py-1.5 animate-fade-in">Tamamlandı</button>
              </div>
            )}
          </div>
          <a href="#about-us-container" className="mobile-nav-item" onClick={() => setIsMobileNavOpen(false)}>Hakkımızda</a>
        </div>
      </div>

      {/* ОРИГИНАЛЬНЫЙ CSS С КОНТРОЛЕМ ВЫСОТЫ И ШИРИНЫ ИКОНОК */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --primary: #00A4A6;
          --primary-hover: #00898B;
          --dark-slate: #1E293B;   
          --border-soft: #E2E8F0;  
          --shadow-dropdown: 0 12px 30px rgba(15, 23, 42, 0.15); 
          --text-muted: #64748B;   
        }

        .modern-header {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 90px !important;
          background-color: #ffffff !important;
          border-bottom: 1px solid var(--border-soft) !important;
          z-index: 999999 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
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
        .modern-logo { display: inline-flex !important; align-items: center !important; text-decoration: none !important; gap: 10px !important; cursor: pointer !important; }
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
        
        .nav-chevron-svg { 
          width: 12px !important; 
          height: 12px !important; 
          stroke: currentColor !important; 
          stroke-width: 2.5 !important; 
          fill: none !important; 
          transition: transform 0.2s ease !important; 
          display: inline-block !important;
        }
        .nav-item:hover .nav-chevron-svg { transform: translateY(2px) !important; }
        .new-ssapkaprojelerimiz.open .nav-chevron-svg { transform: rotate(180deg) !important; stroke: var(--primary) !important; }
        .new-ssapkaprojelerimiz.open { color: var(--primary) !important; }

        .header-contact { display: flex !important; align-items: center !important; gap: 20px !important; }
        .contact-phone {
          display: flex !important; align-items: center !important; gap: 8px !important; text-decoration: none !important;
          color: var(--dark-slate) !important; font-size: 15px !important; font-weight: 700 !important; transition: color 0.2s ease !important;
        }
        .contact-phone:hover { color: var(--primary) !important; }
        
        .phone-icon-svg { 
          width: 16px !important; 
          height: 16px !important; 
          fill: currentColor !important; 
          color: var(--primary) !important; 
          display: inline-block !important;
        }
        .contact-whatsapp {
          width: 42px !important; height: 42px !important; background-color: #25D366 !important; border-radius: 50% !important;
          display: flex !important; align-items: center !important; justify-content: center !important; color: #ffffff !important;
          text-decoration: none !important; box-shadow: 0 4px 10px rgba(37, 211, 102, 0.3) !important; transition: transform 0.2s ease, box-shadow 0.2s ease !important;
        }
        .contact-whatsapp:hover { transform: translateY(-2px) !important; box-shadow: 0 6px 15px rgba(37, 211, 102, 0.4) !important; }
        
        .wa-icon-svg { 
          width: 22px !important; 
          height: 22px !important; 
          fill: currentColor !important; 
          display: inline-block !important;
        }

        @media (max-width: 768px) {
          .modern-header { height: 70px !important; }
          .header-container { padding: 0 16px !important; }
          .logo-text { font-size: 18px !important; }
          .logo-icon-box { width: 34px !important; height: 34px !important; border-radius: 8px !important; }
          .logo-icon-svg { width: 18px !important; height: 18px !important; }
          .modern-nav { display: none !important; }
          .header-contact { gap: 10px !important; }
          .contact-phone span { display: none !important; }
          .contact-phone {
            width: 36px !important; height: 36px !important; background-color: rgba(0, 164, 166, 0.05) !important;
            border-radius: 50% !important; justify-content: center !important; align-items: center !important; gap: 0 !important;
          }
          .phone-icon-svg { width: 15px !important; height: 15px !important; }
          .contact-whatsapp { width: 36px !important; height: 36px !important; }
          .wa-icon-svg { width: 18px !important; height: 18px !important; }
          .mobile-burger-btn { display: flex !important; }
          .burger-icon-svg { width: 22px !important; height: 22px !important; stroke: var(--dark-slate) !important; fill: none !important; }

          .mobile-nav-panel {
            display: flex !important; flex-direction: column !important; position: fixed !important;
            top: 0 !important; right: -280px !important; width: 260px !important; height: 100% !important;
            background-color: #ffffff !important; z-index: 10000000 !important;
            box-shadow: -10px 0 30px rgba(15, 23, 42, 0.1) !important; padding: 24px 20px !important;
            transition: right 0.3s ease-in-out !important; box-sizing: border-box !important;
          }
          .mobile-nav-panel.open { right: 0 !important; }
          .mobile-nav-close { font-size: 32px !important; color: var(--text-muted) !important; cursor: pointer !important; margin-bottom: 24px !important; line-height: 1 !important; }
          .mobile-nav-links { display: flex !important; flex-direction: column !important; gap: 20px !important; }
          .mobile-nav-item { font-size: 15px !important; font-weight: 700 !important; color: var(--dark-slate) !important; display: flex !important; justify-content: space-between !important; }
          .header-mobile-overlay {
            display: none !important; position: fixed !important; top: 0 !important; left: 0 !important;
            width: 100% !important; height: 100% !important; background: rgba(15, 23, 42, 0.6) !important;
            z-index: 9999999 !important; opacity: 0; transition: opacity 0.3s ease-in-out !important;
          }
          .header-mobile-overlay.show { display: block !important; opacity: 1 !important; }
        }
      ` }} />
    </>
  )
}
