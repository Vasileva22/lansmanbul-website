// robots.txt: пока индексация выключена (SITE_INDEXING не 'on') — закрываем всё.
// Когда включим — открываем сайт, но закрываем служебные разделы.
export async function getServerSideProps({ req, res }) {
  const on = String(process.env.SITE_INDEXING || '').trim() === 'on';
  const env = String(process.env.SITE_URL || '').trim().replace(/\/$/, '');
  const base = env || `https://${req.headers['x-forwarded-host'] || req.headers.host}`;
  const body = on
    ? `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /gelistirici\nDisallow: /onay\nDisallow: /api/\nDisallow: /favorites\n\nSitemap: ${base}/sitemap.xml\n`
    : 'User-agent: *\nDisallow: /\n';
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600');
  res.write(body);
  res.end();
  return { props: {} };
}

export default function Robots() { return null; }
