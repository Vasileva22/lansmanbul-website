import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getConsent, setConsent, loadAnalytics, disableAnalytics } from '../lib/analytics';

// Баннер согласия на всех страницах. Аналитика — только после «Kabul Et».
// Открыть снова можно ссылкой «Çerez tercihleri» в подвале (событие lb-open-consent).
export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const c = getConsent();
    if (c === 'accepted') loadAnalytics();
    if (!c) {
      const t = setTimeout(() => setShow(true), 1200);
      return () => clearTimeout(t);
    }
    return undefined;
  }, []);

  useEffect(() => {
    const open = () => setShow(true);
    window.addEventListener('lb-open-consent', open);
    return () => window.removeEventListener('lb-open-consent', open);
  }, []);

  if (!show) return null;

  const accept = () => { setConsent('accepted'); loadAnalytics(); setShow(false); };
  const reject = () => { setConsent('rejected'); disableAnalytics(); setShow(false); };

  return (
    <div className="cookie-consent-banner show" id="cookie-banner" role="dialog" aria-label="Çerez tercihleri">
      <div className="cookie-consent-container">
        <p className="cookie-consent-text">
          Siteyi geliştirmek için ziyaret istatistiklerini (Google Analytics) yalnızca izninizle kullanırız. Reklam çerezi kullanmayız. Reddederseniz site aynı şekilde çalışır. Ayrıntılar: <Link href="/cerez-politikasi">Çerez Politikası</Link>
        </p>
        <div className="cookie-consent-buttons">
          <button type="button" className="cookie-btn cookie-btn-reject" onClick={reject}>Reddet</button>
          <button type="button" className="cookie-btn cookie-btn-accept" onClick={accept}>Kabul Et</button>
        </div>
      </div>
    </div>
  );
}
