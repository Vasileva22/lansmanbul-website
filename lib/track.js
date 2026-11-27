// Браузер: анонимный учёт интереса к проекту (просмотр, WhatsApp, избранное).
// Никаких cookie и личных данных: одно и то же действие с проектом засчитываем
// один раз за сеанс вкладки (проверка — прямо в браузере, в sessionStorage).
const TYPES = new Set(['view', 'whatsapp', 'favorite']);

export function track(type, projectId) {
  if (typeof window === 'undefined' || !TYPES.has(type)) return;
  const id = Number(projectId);
  if (!Number.isInteger(id) || id <= 0) return;

  const key = `lb-ev-${type}-${id}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch { /* приватный режим — просто считаем */ }

  const body = JSON.stringify({ id, type });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }));
      return;
    }
  } catch { /* упадём на fetch */ }
  fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
}

// Один общий обработчик кликов: любая ссылка WhatsApp застройщика с data-lb-project
export function installWhatsAppTracking() {
  if (typeof window === 'undefined' || window.__lbWaTracking) return;
  window.__lbWaTracking = true;
  document.addEventListener('click', (e) => {
    const a = e.target?.closest?.('a[data-lb-project]');
    if (a && /wa\.me\//.test(a.getAttribute('href') || '')) track('whatsapp', a.getAttribute('data-lb-project'));
  }, true);
}
