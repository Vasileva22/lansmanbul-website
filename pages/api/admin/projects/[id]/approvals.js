import { isAdminRequest } from '../../../../../lib/adminAuth';
import { getSupabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { approvalUrl } from '../../../../../lib/approvals';

// POST — создать новую ссылку на предпросмотр для застройщика
export default async function handler(req, res) {
  if (!isAdminRequest(req)) return res.status(401).json({ error: 'Нужно войти в админку' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const propertyId = Number(req.query.id);
  if (!Number.isInteger(propertyId)) return res.status(400).json({ error: 'Неверный id' });

  const phone = String(req.body?.phone || '').trim() || null;
  const supabase = getSupabaseAdmin();

  const { data: project } = await supabase.from('properties').select('id, listing_status').eq('id', propertyId).single();
  if (!project) return res.status(404).json({ error: 'Проект не найден' });

  // Старые неиспользованные ссылки этого проекта закрываем, чтобы действовала только одна
  await supabase.from('project_approvals').update({ status: 'expired' }).eq('property_id', propertyId).in('status', ['sent', 'opened']);

  const { data: approval, error } = await supabase
    .from('project_approvals')
    .insert({ property_id: propertyId, sent_to_phone: phone })
    .select('id, token, status, sent_at, expires_at, sent_to_phone')
    .single();
  if (error) return res.status(400).json({ error: error.message });

  if (project.listing_status !== 'confirmed') {
    await supabase.from('properties').update({ listing_status: 'pending_approval', updated_at: new Date().toISOString() }).eq('id', propertyId);
  }

  return res.status(200).json({ ok: true, approval: { ...approval, url: approvalUrl(req, approval.token) } });
}
