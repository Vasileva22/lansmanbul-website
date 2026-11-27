import { isAdminRequest } from '../../../../lib/adminAuth';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';

// Админка: одобрить или отклонить запрос «Bu proje benim»
export default async function handler(req, res) {
  if (!isAdminRequest(req)) return res.status(401).json({ error: 'Нужно войти в админку' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const id = Number(req.query.id);
  const action = req.body?.action;
  const note = String(req.body?.note || '').trim().slice(0, 500) || null;
  if (!Number.isInteger(id) || !['approve', 'reject'].includes(action)) return res.status(400).json({ error: 'Неверный запрос' });

  const supabase = getSupabaseAdmin();
  const { data: claim } = await supabase.from('project_claims').select('id, property_id, developer_id, user_id, status').eq('id', id).single();
  if (!claim) return res.status(404).json({ error: 'Запрос не найден' });
  if (claim.status !== 'pending') return res.status(409).json({ error: 'Запрос уже обработан' });

  const now = new Date().toISOString();
  if (action === 'approve') {
    const { data: p } = await supabase.from('properties').select('developer_id').eq('id', claim.property_id).single();
    if (p?.developer_id && p.developer_id !== claim.developer_id) return res.status(409).json({ error: 'Проект уже привязан к другой компании' });
    const { error } = await supabase.from('properties').update({ developer_id: claim.developer_id, updated_at: now }).eq('id', claim.property_id);
    if (error) return res.status(500).json({ error: 'Не удалось привязать проект' });
    await supabase.from('project_changes').insert({
      property_id: claim.property_id, developer_id: claim.developer_id, user_id: claim.user_id,
      changes: { _event: 'claimed', developer_id: [null, claim.developer_id] },
    });
    // Остальные запросы на этот проект закрываем
    await supabase.from('project_claims').update({ status: 'rejected', admin_note: 'Proje başka bir firmaya bağlandı.', decided_at: now })
      .eq('property_id', claim.property_id).eq('status', 'pending').neq('id', id);
  }
  await supabase.from('project_claims').update({ status: action === 'approve' ? 'approved' : 'rejected', admin_note: note, decided_at: now }).eq('id', id);
  return res.status(200).json({ ok: true });
}
