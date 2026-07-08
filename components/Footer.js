import Link from 'next/link'
import { useRouter } from 'next/router'

const cssFooterStyles = [
  '  .v3-footer {',
  '    font-family: "Mulish", sans-serif !important;',
  '    background-color: #f8fafc !important;',
  '    border-top: 1px solid #e2e8f0 !important;',
  '    padding: 60px 20px 30px 20px !important;',
  '    box-sizing: border-box !important;',
  '    width: 100% !important;',
  '    color: var(--text-secondary) !important;',
  '  }',
  '  .v3-container {',
  '    max-width: 1200px !important;',
  '    margin: 0 auto !important;',
  '    width: 100% !important;',
  '  }',
  '  .v3-grid {',
  '    display: grid !important;',
  '    grid-template-columns: 1.5fr 1fr 1fr 1.2fr !important;',
  '    gap: 30px !important;',
  '    margin-bottom: 40px !important;',
  '  }',
  '  .v3-col {',
  '    display: flex !important;',
  '    flex-direction: column !important;',
  '    align-items: flex-start !important;',
  '    padding-right: 20px !important;',
  '  }',
  '  .v3-col:not(:last-child) {',
  '    border-right: 1px solid #e2e8f0 !important;',
  '  }',
  '  .v3-logo {',
  '    display: inline-flex !important;',
  '    align-items: center !important;',
  '    text-decoration: none !important;',
  '    gap: 8px !important;',
  '    margin-bottom: 18px !important;',
  '  }',
  '  .v3-logo-icon {',
  '    width: 34px !important;',
  '    height: 34px !important;',
  '    background-color: #007a7c !important;',
  '    border-radius: 6px !important;',
  '    display: flex !important;',
  '    align-items: center !important;',
  '    justify-content: center !important;',
  '    color: #ffffff !important;',
  '  }',
  '  .v3-logo-svg {',
  '    width: 18px !important;',
  '    height: 18px !important;',
  '    fill: currentColor !important;',
  '    display: inline-block !important;',
  '  }',
  '  .v3-logo-text {',
  '    font-size: 17px !important;',
  '    font-weight: 500 !important;',
  '    color: var(--text-main) !important;',
  '    letter-spacing: -0.3px !important;',
  '  }',
  '  .v3-logo-accent {',
  '    color: #007a7c !important;',
  '    font-weight: 900 !important;',
  '  }',
  '  .v3-description {',
  '    font-size: 13px !important;',
  '    line-height: 1.6 !important;',
  '    color: var(--text-secondary) !important;',
  '    margin: 0 !important;',
  '  }',
  '  .v3-title {',
  '    font-size: 14px !important;',
  '    font-weight: 800 !important;',
  '    color: var(--text-main) !important;',
  '    margin-top: 0 !important;',
  '    margin-bottom: 18px !important;',
  '  }',
  '  .v3-links {',
  '    list-style: none !important;',
  '    padding: 0 !important;',
  '    margin: 0 !important;',
  '    display: flex !important;',
  '    flex-direction: column !important;',
  '    gap: 12px !important;',
  '  }',
  '  .v3-links a, .v3-links button {',
  '    font-size: 13px !important;',
  '    color: var(--text-secondary) !important;',
  '    text-decoration: none !important;',
  '    background: transparent;',
  '    border: none;',
  '    padding: 0;',
  '    cursor: pointer;',
  '  }',
  '  .v3-links a:hover, .v3-links button:hover {',
  '    color: var(--primary) !important;',
  '  }',
  '  .v3-contacts {',
  '    display: flex !important;',
  '    flex-direction: column !important;',
  '    gap: 12px !important;',
  '    width: 100% !important;',
  '  }',
  '  .v3-contact-item {',
  '    display: inline-flex !important;',
  '    align-items: center !important;',
  '    gap: 8px !important;',
  '    font-size: 13px !important;',
  '    color: var(--text-secondary) !important;',
  '    text-decoration: none !important;',
  '  }',
  '  .v3-contact-icon {',
  '    width: 15px !important;',
  '    height: 15px !important;',
  '    color: #007a7c !important;',
  '    display: inline-block !important;',
  '  }',
  '  .v3-wa-button {',
  '    display: inline-flex !important;',
  '    align-items: center !important;',
  '    justify-content: center !important;',
  '    gap: 8px !important;',
  '    background-color: #128c7e !important;',
  '    color: #ffffff !important;',
  '    text-decoration: none !important;',
  '    font-size: 12.5px !important;',
  '    font-weight: 700 !important;',
  '    padding: 8px 16px !important;',
  '    border-radius: 6px !important;',
  '  }',
  '  .v3-wa-icon {',
  '    width: 16px !important;',
  '    height: 16px !important;',
  '    fill: currentColor !important;',
  '    display: inline-block !important;',
  '  }',
  '  .v3-bottom {',
  '    border-top: 1px solid #e2e8f0 !important;',
  '    padding-top: 24px !important;',
  '    margin-top: 40px !important;',
  '  }',
  '  .v3-disclaimer {',
  '    font-size: 11px !important;',
  '    line-height: 1.6 !important;',
  '    color: var(--text-muted) !important;',
  '    text-align: center !important;',
  '    margin: 0 !important;',
  '  }',
  '  @media (max-width: 991px) {',
  '    .v3-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 30px !important; }',
  '    .v3-col { border-right: none !important; padding-right: 0 !important; }',
  '  }',
  '  @media (max-width: 576px) {',
  '    .v3-grid { grid-template-columns: 1fr !important; gap: 30px !important; }',
  '    .v3-footer { padding: 40px 15px 25px 15px !important; }',
  '    .v3-bottom { margin-top: 30px !important; }',
  '    .v3-disclaimer { text-align: left !important; }',
  '  }'
].join('\n');

export default function Footer() {
  const router = useRouter()

  const handleStatusSelect = (status) => {
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
      <footer className="v3-footer">
        <div className="v3-container">
          <div className="v3-grid">
            
            <div className="v3-col">
              <Link href="/" className="v3-logo">
                <div className="v3-logo-icon">
                  <svg className="v3-logo-svg" viewBox="0 0 24 24">
                    <path d="M19 2H9c-1.1 0-2 .9-2 2v3H3c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM5 20H3V9h2v11zm4 0H7v-3h2v3zm0-5H7v-3h2v3zm0-5H7V7h2v3zm10 10H11V4h8v16zm-2-12h-4v2h4V8zm0 4h-4v2h4v-2zm0 4h-4v2h4v-2z" />
                  </svg>
                </div>
                <span className="v3-logo-text">LANSMAN<span className="v3-logo-accent">BUL</span></span>
              </Link>
              <p className="v3-description">
                En yeni konut projelerini doğrudan geliştiriciden, komisyonsuz ve şeffaf fiyatlarla sunan dijital vitrindir.
              </p>
            </div>

            <div className="v3-col">
              <h4 className="v3-title">Projeler</h4>
              <ul className="v3-links">
                <li><button onClick={() => handleStatusSelect('Lansman')}>Lansman</button></li>
                <li><button onClick={() => handleStatusSelect('Devam ediyor')}>Devam ediyor</button></li>
                <li><button onClick={() => handleStatusSelect('Tamamlandı')}>Tamamlandı</button></li>
              </ul>
            </div>

            <div className="v3-col">
              <h4 className="v3-title">Gizlilik ve Kullanım</h4>
              <ul className="v3-links">
                <li><a href="/kullanim-kosullari" target="_blank">Kullanım koşulları</a></li>
                <li><a href="/kisisel-verilerin-korunmasi" target="_blank">Kişisel Verilerin Korunması</a></li>
                <li><a href="/cerez-politikasi" target="_blank">Çerez Yönetimi</a></li>
                <li><a href="/gizlilik-politikasi" target="_blank">Gizlilik politikası</a></li>
              </ul>
            </div>

            <div className="v3-col">
              <h4 className="v3-title">İletişim</h4>
              <div className="v3-contacts">
                <a href="tel:+905459418536" className="v3-contact-item">
                  <svg className="v3-contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.79 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  <span>+90 545 941 85 36</span>
                </a>
                <a href="mailto:olesyav03@mail.ru" className="v3-contact-item">
                  <svg className="v3-contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  <span>posta : olesyav03@mail.ru</span>
                </a>
                <a href="https://wa.me/905459418536" target="_blank" rel="noopener noreferrer" className="v3-wa-button">
                  <svg className="v3-wa-icon" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.156 5.156 0 11.487 0c3.067.001 5.95 1.196 8.114 3.363 2.164 2.167 3.357 5.053 3.355 8.12-.003 6.325-5.157 11.48-11.485 11.48-1.999-.001-3.968-.521-5.71-1.513L0 24zm6.59-4.846c1.642.975 3.251 1.489 4.84 1.49 4.996 0 9.06-4.061 9.062-9.058 0-2.42-1.014-4.701-2.731-6.418C16.035 3.45 13.84 2.502 11.487 2.502 6.49 2.502 2.428 6.564 2.426 11.56c-.001 1.638.484 3.235 1.401 4.7l-.955 3.486 3.575-.937z" /></svg>
                  <span>Bize Ulaşın</span>
                </a>
              </div>
            </div>

          </div>
          <div className="v3-bottom">
            <p className="v3-disclaimer">
              © 2026 lansmanbul.com | Tüm Hakları Saklıdır. lansmanbul bir emlak bilgi platformudur. Web sitemizde yer alan bilgiler bilgilendirme amaçlıdır; yatırım tavsiyesi veya resmi teklif niteliği taşımaz. Fiyat og proje bilgilerinde değişiklik yapma hakkı saklıdır.
            </p>
          </div>
        </div>
      </footer>
      <style dangerouslySetInnerHTML={{ __html: cssFooterStyles }} />
    </>
  )
}
