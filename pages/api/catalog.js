import { getCatalogProjects, getProjectsByIds } from '../../lib/projectsServer';

// GET /api/catalog — каталог; GET /api/catalog?ids=1,2,3 — избранное.
// Отдаёт уже «очищенные» карточки: у справочных нет цен, фото и контактов.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
  try {
    const ids = String(req.query.ids || '').split(',').filter(Boolean);
    const data = ids.length ? await getProjectsByIds(ids) : await getCatalogProjects();
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(data);
  } catch (err) {
    console.error('[api/catalog]', err.message);
    return res.status(500).json({ error: 'Veriler yüklenemedi' });
  }
}
