import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Footer() {
  const router = useRouter();

  // Функция для безопасного перенаправления на главную с фильтрацией по статусу
  const handleStatusRedirect = (status) => {
    router.push({
      pathname: '/',
      query: { status: status },
    });
  };

  return (
    <footer className="v3-footer">
      <div className="v3-container">
        <div className="v3-grid">
          
          {/* КОЛОНКА 1: ЛОГОТИП И ОПИСАНИЕ */}
          <div className="v3-col">
            <Link href="/" className="v3-logo">
              <div className="v3-logo-icon">
                <svg className="v3-logo-svg" viewBox="0 0 24 24">
                  <path d="M19 2H9c-1.1 0-2 .9-2 2v3H3c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM5 20H3V9h2v11zm4 0H7v-3h2v3zm0-5H7v-3h2v3zm0-5H7V7h2v3zm10 10H11V4h8v16zm-2-12h-4v2h4V8zm0 4h-4v2h4v-2zm0 4h-4v2h4v-2z"/>
                </svg>
              </div>
              <span className="v3-logo-text">
                LANSMAN<span className="v3-logo-accent">BUL</span>
              </span>
            </Link>
            <p className="v3-description">
              En yeni konut projelerini doğrudan geliştiriciden, komisyonsuz ve şeffaf fiyatlarla sunan dijital vitrindir.
            </p>
          </div>

          {/* КОЛОНКА 2: ПРОЕКТЫ */}
          <div className="v3-col">
            <h4 className="v3-title">Projeler</h4>
            <ul className="v3-links">
              <li>
                <button onClick={() => handleStatusRedirect('Lansman')} className="btn-reset">
                  Lansman
                </button>
              </li>
              <li>
                <button onClick={() => handleStatusRedirect('Devam ediyor')} className="btn-reset">
                  Devam ediyor
                </button>
              </li>
              <li>
                <button onClick={() => handleStatusRedirect('Tamamlandı')} className="btn-reset">
                  Tamamlandı
                </button>
              </li>
            </ul>
          </div>

          {/* КОЛОНКА 3: ССЫЛКИ НА ПОЛИТИКИ */}
          <div className="v3-col">
            <h4 className="v3-title">Gizlilik ve Kullanım</h4>
            <ul className="v3-links">
              <li>
                <a href="https://increase-fine-snappea.tilda.ws/kullanim-kosullari" target="_blank" rel="noopener noreferrer">
                  Kullanım koşulları
                </a>
              </li>
              <li>
                <a href="https://increase-fine-snappea.tilda.ws/kisisel-verilerin-korunmasi" target="_blank" rel="noopener noreferrer">
                  Kişisel Verilerin Korunması
                </a>
              </li>
              <li>
                <a href="https://increase-fine-snappea.tilda.ws/cerez-politikasi" target="_blank" rel="noopener noreferrer">
                  Çerez Yönetimi
                </a>
              </li>
              <li>
                <a href="https://increase-fine-snappea.tilda.ws/gizlilik-politikasi" target="_blank" rel="noopener noreferrer">
                  Gizlilik politikası
                </a>
              </li>
            </ul>
          </div>

          {/* КОЛОНКА 4: КОНТАКТЫ */}
          <div className="v3-col">
            <h4 className="v3-title">İletişim</h4>
            <div className="v3-contacts">
              <a href="tel:+905459418536" className="v3-contact-item">
                <svg className="v3-contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.79 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                <span>+90 545 941 85 36</span>
              </a>
              <a href="mailto:olesyav03@mail.ru" className="v3-contact-item">
                <svg className="v3-contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <span>posta : olesyav03@mail.ru</span>
              </a>
              <a href="https://wa.me/905459418536" target="_blank" rel="noopener noreferrer" className="v3-wa-button">
                <svg className="v3-wa-icon" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.156 5.156 0 11.487 0c3.067.001 5.95 1.196 8.114 3.363 2.164 2.167 3.357 5.053 3.355 8.12-.003 6.325-5.157 11.48-11.485 11.48-1.999-.001-3.968-.521-5.71-1.513L0 24zm6.59-4.846c1.642.975 3.251 1.489 4.84 1.49 4.996 0 9.06-4.061 9.062-9.058 0-2.42-1.014-4.701-2.731-6.418C16.035 3.45 13.84 2.502 11.487 2.502 6.49 2.502 2.428 6.564 2.426 11.56c-.001 1.638.484 3.235 1.401 4.7l-.955 3.486 3.575-.937z"/>
                </svg>
                <span>Bize Ulaşın</span>
              </a>
            </div>
          </div>

        </div>
        <div className="v3-bottom">
          <p className="v3-disclaimer">
            © 2026 lansmanbul.com | Tüm Hakları Saklıdır. lansmanbul bir emlak bilgi platformudur. Web sitemizde yer alan bilgiler bilgilendirme amaçlıdır; yatırım tavsiyesi veya resmi teklif niteliği taşımaz. Fiyat ve proje bilgilerinde değişiklik yapma hakkı saklıdır.
          </p>
        </div>
      </div>

      <style jsx>{`
        .btn-reset {
          background: none;
          border: none;
          padding: 0;
          font: inherit;
          cursor: pointer;
          text-align: left;
          transition: color 0.2s ease;
        }
      `}</style>
    </footer>
  );
}
