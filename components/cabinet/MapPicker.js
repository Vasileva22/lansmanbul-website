import { useEffect, useRef, useState } from 'react';

// Карта для выбора точки проекта: OpenStreetMap + Leaflet (без ключей, координаты можно хранить).
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const ANKARA = [39.9334, 32.8597];

const DISTRICT_CENTERS = {
  Çankaya: [39.9035, 32.8597], Keçiören: [39.9800, 32.8650], Yenimahalle: [39.9700, 32.7800], Mamak: [39.9300, 32.9200],
  Etimesgut: [39.9500, 32.6700], Sincan: [39.9700, 32.5800], Altındağ: [39.9500, 32.8800], Pursaklar: [40.0400, 32.9000],
  Gölbaşı: [39.7900, 32.8100], Polatlı: [39.5800, 32.1400], Kahramankazan: [40.2000, 32.6800], Çubuk: [40.2400, 33.0300],
  Elmadağ: [39.9200, 33.2300], Akyurt: [40.1300, 33.0900], Beypazarı: [40.1700, 31.9200], Haymana: [39.4300, 32.5000],
};

function loadLeaflet() {
  if (typeof window === 'undefined') return Promise.reject();
  if (window.L) return Promise.resolve(window.L);
  if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = LEAFLET_CSS;
    document.head.appendChild(css);
  }
  return new Promise((resolve, reject) => {
    let s = document.querySelector(`script[src="${LEAFLET_JS}"]`);
    if (!s) {
      s = document.createElement('script');
      s.src = LEAFLET_JS;
      s.async = true;
      document.head.appendChild(s);
    }
    s.addEventListener('load', () => resolve(window.L));
    s.addEventListener('error', reject);
  });
}

export default function MapPicker({ lat, lng, district, onChange }) {
  const box = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    loadLeaflet().then((L) => {
      if (!alive || !box.current || map.current) return;
      const has = Number.isFinite(lat) && Number.isFinite(lng);
      const start = has ? [lat, lng] : DISTRICT_CENTERS[district] || ANKARA;
      const m = L.map(box.current, { scrollWheelZoom: false }).setView(start, has ? 16 : district ? 13 : 11);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap',
      }).addTo(m);
      const icon = L.divIcon({ className: '', html: '<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:#0F6E56;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);transform:rotate(-45deg)"></div>', iconSize: [26, 26], iconAnchor: [13, 26] });
      const place = (latlng) => {
        if (!marker.current) {
          marker.current = L.marker(latlng, { draggable: true, icon }).addTo(m);
          marker.current.on('dragend', () => {
            const p = marker.current.getLatLng();
            onChange(Number(p.lat.toFixed(6)), Number(p.lng.toFixed(6)));
          });
        } else marker.current.setLatLng(latlng);
        onChange(Number(latlng.lat.toFixed(6)), Number(latlng.lng.toFixed(6)));
      };
      if (has) marker.current = L.marker(start, { draggable: true, icon }).addTo(m).on('dragend', () => {
        const p = marker.current.getLatLng();
        onChange(Number(p.lat.toFixed(6)), Number(p.lng.toFixed(6)));
      });
      m.on('click', (e) => place(e.latlng));
      map.current = m;
    }).catch(() => alive && setFailed(true));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Сменили район, а точки ещё нет — перелетаем к району
  useEffect(() => {
    if (map.current && !marker.current && DISTRICT_CENTERS[district]) map.current.setView(DISTRICT_CENTERS[district], 13);
  }, [district]);

  if (failed) return <div style={{ padding: 16, background: '#fef2f2', borderRadius: 12, color: '#991b1b', fontSize: 14 }}>Harita yüklenemedi. Sayfayı yenileyin.</div>;
  return <div ref={box} style={{ height: 340, borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8e6', background: '#eef2f0' }} />;
}
