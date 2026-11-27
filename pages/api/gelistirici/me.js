import { requireDeveloper } from '../../../lib/developerAuth';
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';

// Кабинет: данные компании и её проекты
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
  const ctx = await requireDeveloper(req, res);
  if (!ctx) return;

  const { data: projects } = await getSupabaseAdmin()
    .from('properties')
    .select('id, name, district, neighborhood, listing_status, construction_stage, project_status, delivery_year, delivery_month, updated_at')
    .eq('developer_id', ctx.developer.id)
    .neq('listing_status', 'archived')
    .order('updated_at', { ascending: false });

  return res.status(200).json({
    user: { email: ctx.user.email, emailConfirmed: Boolean(ctx.user.email_confirmed_at) },
    member: { contact_name: ctx.member.contact_name, contact_title: ctx.member.contact_title, phone: ctx.member.phone, role: ctx.member.role },
    developer: ctx.developer,
    projects: projects || [],
  });
}
