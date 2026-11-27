import { useEffect } from 'react';
import '../styles/globals.css';
import { installWhatsAppTracking } from '../lib/track';
import CookieConsent from '../components/CookieConsent';

export default function App({ Component, pageProps }) {
  useEffect(() => { installWhatsAppTracking(); }, []);
  return (
    <>
      <Component {...pageProps} />
      <CookieConsent />
    </>
  );
}
