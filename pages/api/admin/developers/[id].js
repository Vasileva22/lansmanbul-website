import { isAdminRequest } from '../../../../lib/adminAuth';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { normalizeDeveloper } from '../../../../lib/adminFields';

// POST /api/admin/developers/new — создать; PATCH /api/admin/developers/:id — изменить
export default async function handler(req, res) {
  if (!isAdminRequest(req)) return res.status(401).json({ error: 'Нужно войти в админку' });

  const isNew = req.query.id === 'new';
  if ((isNew && req.method !== 'POST') || (!isNew && req.method !== 'PATCH')) {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { data, errors } = normalizeDeveloper(req.body);
  if (Object.keys(errors).length) return res.status(400).json({ error: 'Проверьте поля', fields: errors });

  if ('is_verified' in data) data.verified_at = data.is_verified ? new Date().toISOString() : null;
  data.updated_at = new Date().toISOString();

  const supabase = getSupabaseAdmin();
  const query = isNew
    ? supabase.from('developers').insert(data)
    : supabase.from('developers').update(data).eq('id', Number(req.query.id));
  const { data: saved, error } = await query.select('id').single();

  if (error) {
    const msg = error.code === '23505' ? 'Такой адрес страницы уже занят' : error.message;
    return res.status(400).json({ error: msg });
  }
  return res.status(200).json({ ok: true, id: saved.id });
}
