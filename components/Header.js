```jsx
import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Header({ favoritesCount, onOpenFavorites, onOpenPostModal }) {
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
            {/* Иконка сердечка с живым счетчиком */}
            <button className="header-fav-btn" onClick={onOpenFavorites} title="Favorilerim">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              {favoritesCount > 0 && <span className="header-fav-badge">{favoritesCount}</span>}
            </button>

            {/* Кнопка войти, открывает Избранное / Личный Кабинет */}
            <button className="btn-signin" onClick={onOpenFavorites}>Giriş Yap</button>

            {/* Кнопка подачи бесплатного объявления */}
            <button className="btn-post" onClick={onOpenPostModal}>+ İlan Ver (0 TL)</button>

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
                <button onClick={() => handleStatusSelect('Lansman')} className="mobile-dropdown-link text-left block w-full text-sm font-semibold text-slate-500 py-1.5">Lansman</button>
                <button onClick={() => handleStatusSelect('Devam ediyor')} className="mobile-dropdown-link text-left block w-full text-sm font-semibold text-slate-500 py-1.5">Devam ediyor</button>
                <button onClick={() => handleStatusSelect('Tamamlandı')} className="mobile-dropdown-link text-left block w-full text-sm font-semibold text-slate-500 py-1.5">Tamamlandı</button>
              </div>
            )}
          </div>
          <a href="#about-us-container" className="mobile-nav-item" onClick={() => setIsMobileNavOpen(false)}>Hakkımızda</a>
        </div>
      </div>

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

        .header-contact { display: flex !important; align-items: center !important; gap: 16px !important; }
        
        .header-fav-btn {
          background: none !important;
          border: none !important;
          color: var(--dark-slate) !important;
          cursor: pointer !important;
          position: relative !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 40px !important;
          height: 40px !important;
          border-radius: 50% !important;
          transition: background-color 0.2s !important;
        }
        .header-fav-btn:hover { background-color: var(--border-soft) !important; }
        .header-fav-badge {
          position: absolute !important;
          top: 2px !important;
          right: 2px !important;
          background: #ff3b30 !important;
          color: #ffffff !important;
          font-size: 10px !important;
          font-weight: 900 !important;
          width: 18px !important;
          height: 18px !important;
          border-radius: 50% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          box-shadow: 0 2px 6px rgba(255, 59, 48, 0.3) !important;
        }

        .btn-signin {
          color: var(--dark-slate) !important;
          background: none !important;
          border: 1.5px solid var(--border-soft) !important;
          padding: 10px 18px !important;
          border-radius: 10px !important;
          font-size: 14px !important;
          font-weight: 800 !important;
          cursor: pointer !important;
          transition: all 0.2s !important;
        }
        .btn-signin:hover { border-color: var(--primary) !important; color: var(--primary) !important; }

        .btn-post {
          background-color: var(--primary) !important;
          color: #ffffff !important;
          border: none !important;
          padding: 12px 20px !important;
          border-radius: 10px !important;
          font-size: 14px !important;
          font-weight: 800 !important;
          cursor: pointer !important;
          transition: background-color 0.2s !important;
        }
        .btn-post:hover { background-color: var(--primary-hover) !important; }

        @media (max-width: 768px) {
          .modern-header { height: 70px !important; }
          .header-container { padding: 0 16px !important; }
          .logo-text { font-size: 18px !important; }
          .logo-icon-box { width: 34px !important; height: 34px !important; border-radius: 8px !important; }
          .logo-icon-svg { width: 18px !important; height: 18px !important; }
          .modern-nav { display: none !important; }
          .header-contact { gap: 10px !important; }
          .btn-signin { display: none !important; }
          .btn-post { padding: 8px 14px !important; font-size: 12px !important; }
          .mobile-burger-btn { display: flex !important; }
          .burger-icon-svg { width: 22px !important; height: 22px !important; stroke: var(--dark-slate) !important; fill: none !important; }

          .mobile-nav-panel {
            display: flex !important; flex-direction: column !important; position: fixed !important;
            top: 0 !important; right: -280px !important; width: 260px !important; height: 100% !important;
            background-color: #ffffff !important; z-index: 10000000 !important;
            box-shadow: -10px 0 30px rgba(15, 23, 42, 0.1) !important; padding: 24px 20px !important;
            transition: right 0.3s ease !important;
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
