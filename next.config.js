/** @type {import('next').NextConfig} */

// До официального запуска сайт закрыт от поисковиков (Google, Yandex и др.).
// Чтобы открыть: в Vercel добавить переменную SITE_INDEXING=on и пересобрать сайт.
const indexingOn = String(process.env.SITE_INDEXING || '').trim() === 'on';

const nextConfig = {
  async headers() {
    if (indexingOn) return [];
    return [
      {
        source: '/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
};

module.exports = nextConfig;
