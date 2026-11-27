import { getCatalogProjects } from '../lib/projectsServer';

// Карта сайта для Google: главная, все видимые проекты и юридические страницы.
// Обновляется сама: берёт актуальный список проектов при каждом запросе (с кэшем на час).
function origin(req) {
  const env = String(process.env.SITE_URL || '').trim().replace(/\/$/, '');
  if (env) return env;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `https://${host}`;
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function getServerSideProps({ req, res }) {
  const base = origin(req);
  let projects = [];
  try { projects = await getCatalogProjects(); } catch { projects = []; }

  const urls = [
    { loc: `${base}/`, priority: '1.0', changefreq: 'daily' },
    ...projects.map((p) => ({
      loc: `${base}/properties/${p.id}`,
      lastmod: (p.updated_at || p.created_at || '').slice(0, 10),
      priority: p.listing_status === 'confirmed' ? '0.9' : '0.6',
      changefreq: 'weekly',
    })),
    ...['kullanim-kosullari', 'kisisel-verilerin-korunmasi', 'gizlilik-politikasi', 'cerez-politikasi']
      .map((s) => ({ loc: `${base}/${s}`, priority: '0.2', changefreq: 'yearly' })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.write(xml);
  res.end();
  return { props: {} };
}

export default function Sitemap() { return null; }
