// Google Analytics 4 — загружается ТОЛЬКО после согласия посетителя («Kabul Et»).
// До согласия на сайте нет ни скрипта Google, ни его cookie.
export const GA_ID = 'G-LSY3HDSBJY';
export const CONSENT_KEY = 'lb_consent_v2'; // 'accepted' | 'rejected'

export function getConsent() {
  try { return localStorage.getItem(CONSENT_KEY); } catch { return null; }
}

export function setConsent(value) {
  try { localStorage.setItem(CONSENT_KEY, value); } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent('lb-consent', { detail: value }));
}

export function loadAnalytics() {
  if (typeof window === 'undefined' || window.__lbGaLoaded) return;
  window.__lbGaLoaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  // Рекламные сигналы выключены: мы не используем рекламу и персонализацию
  window.gtag('config', GA_ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);
}

// Отказ после согласия: убираем cookie Google и больше ничего не отправляем
export function disableAnalytics() {
  if (typeof window === 'undefined') return;
  window[`ga-disable-${GA_ID}`] = true;
  const host = window.location.hostname;
  document.cookie.split(';').map((c) => c.split('=')[0].trim()).filter((n) => n === '_ga' || n.startsWith('_ga_'))
    .forEach((n) => {
      document.cookie = `${n}=; Max-Age=0; path=/`;
      document.cookie = `${n}=; Max-Age=0; path=/; domain=${host}`;
      document.cookie = `${n}=; Max-Age=0; path=/; domain=.${host.split('.').slice(-2).join('.')}`;
    });
}

export function gaPageView(url) {
  if (typeof window === 'undefined' || !window.__lbGaLoaded || window[`ga-disable-${GA_ID}`]) return;
  window.gtag('event', 'page_view', { page_location: window.location.origin + url });
}

export function gaEvent(name, params = {}) {
  if (typeof window === 'undefined' || !window.__lbGaLoaded || window[`ga-disable-${GA_ID}`]) return;
  window.gtag('event', name, params);
}
