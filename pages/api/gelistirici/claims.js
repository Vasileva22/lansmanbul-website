import { requireDeveloper } from '../../../lib/developerAuth';
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';

// Кабинет: «Bu proje benim» — запрос на владение справочным проектом.
// Можно и до проверки компании: админ всё равно решает вручную.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  const ctx = await requireDeveloper(req, res);
  if (!ctx) return;

  const id = Number(req.body?.property_id);
  const note = String(req.body?.note || '').trim().slice(0, 1000) || null;
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Geçersiz proje' });

  const supabase = getSupabaseAdmin();
  const { data: p } = await supabase.from('properties').select('id, developer_id, listing_status, created_via').eq('id', id).single();
  if (!p || p.listing_status === 'archived' || p.created_via === 'cabinet') return res.status(404).json({ error: 'Proje bulunamadı' });
  if (p.developer_id === ctx.developer.id) return res.status(409).json({ error: 'Bu proje zaten hesabınızda.', already: true });
  if (p.developer_id) return res.status(409).json({ error: 'Bu proje başka bir firmaya bağlı. Hata olduğunu düşünüyorsanız bize yazın.' });

  const { error } = await supabase.from('project_claims').insert({ property_id: id, developer_id: ctx.developer.id, user_id: ctx.user.id, note });
  if (error) {
    if (error.code === '23505') return res.status(200).json({ ok: true, duplicate: true });
    return res.status(500).json({ error: 'Talep gönderilemedi, tekrar deneyin' });
  }
  return res.status(200).json({ ok: true });
}
