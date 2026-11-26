import { isAdminRequest } from '../../../../lib/adminAuth';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { normalizeInput } from '../../../../lib/adminFields';

export default async function handler(req, res) {
  if (!isAdminRequest(req)) {
    return res.status(401).json({ error: 'Нужно войти в админку' });
  }
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Неверный id' });
  }

  const { data, errors } = normalizeInput(req.body);
  if (Object.keys(errors).length) {
    return res.status(400).json({ error: 'Проверьте поля', fields: errors });
  }
  if (!Object.keys(data).length) {
    return res.status(400).json({ error: 'Нечего сохранять' });
  }

  // Этап стройки поменялся — запоминаем дату для «обновлено N дней назад»
  const supabase = getSupabaseAdmin();
  if ('construction_stage' in data) {
    const { data: current } = await supabase.from('properties').select('construction_stage').eq('id', id).single();
    if (current && current.construction_stage !== data.construction_stage) {
      data.stage_updated_at = new Date().toISOString();
    }
  }
  data.updated_at = new Date().toISOString();

  const { data: saved, error } = await supabase
    .from('properties')
    .update(data)
    .eq('id', id)
    .select('id, listing_status, updated_at')
    .single();

  if (error) {
    const msg = error.code === '23505' ? 'Такой адрес страницы уже занят другим проектом' : error.message;
    return res.status(400).json({ error: msg });
  }

  return res.status(200).json({ ok: true, project: saved });
}
