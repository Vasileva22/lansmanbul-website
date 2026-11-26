import { isAdminRequest } from '../../../../../lib/adminAuth';
import { getSupabaseAdmin } from '../../../../../lib/supabaseAdmin';

// POST — администратор проверил одобрение и публикует подтверждённую карточку
export default async function handler(req, res) {
  if (!isAdminRequest(req)) return res.status(401).json({ error: 'Нужно войти в админку' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const id = Number(req.query.id);
  const supabase = getSupabaseAdmin();

  const { data: approval } = await supabase.from('project_approvals').select('*').eq('id', id).single();
  if (!approval) return res.status(404).json({ error: 'Одобрение не найдено' });
  if (approval.status !== 'approved') return res.status(400).json({ error: 'Опубликовать можно только одобренное застройщиком' });

  const { data: project } = await supabase.from('properties').select('id, developer_id').eq('id', approval.property_id).single();
  if (!project) return res.status(404).json({ error: 'Проект не найден' });

  // Если у проекта ещё нет застройщика — создаём его из данных формы одобрения
  let developerId = project.developer_id;
  if (!developerId && approval.company_name) {
    const { data: existing } = approval.tax_number
      ? await supabase.from('developers').select('id').eq('tax_number', approval.tax_number).maybeSingle()
      : { data: null };
    if (existing) {
      developerId = existing.id;
    } else {
      const { data: created } = await supabase
        .from('developers')
        .insert({ name: approval.company_name, tax_number: approval.tax_number, phone: approval.approver_phone })
        .select('id')
        .single();
      developerId = created?.id || null;
    }
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from('properties')
    .update({
      listing_status: 'confirmed',
      publish_photos: approval.allow_photos,
      publish_prices: approval.allow_prices,
      developer_id: developerId,
      updated_at: now,
    })
    .eq('id', project.id);
  if (error) return res.status(400).json({ error: error.message });

  await supabase.from('project_approvals').update({ status: 'published' }).eq('id', id);
  return res.status(200).json({ ok: true });
}
