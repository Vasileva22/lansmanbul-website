import { requireDeveloper } from '../../../../lib/developerAuth';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { normalizeCabinetInput } from '../../../../lib/cabinetProject';

// Кабинет: создать черновик проекта (первый шаг формы)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  const ctx = await requireDeveloper(req, res, { activeOnly: true });
  if (!ctx) return;

  const { data, errors } = normalizeCabinetInput({ name: req.body?.name });
  if (Object.keys(errors).length) return res.status(400).json({ error: 'Alanları kontrol edin', fields: errors });

  const supabase = getSupabaseAdmin();

  // Защита от случайного спама: не больше 20 черновиков у одной компании
  const { count } = await supabase.from('properties').select('id', { count: 'exact', head: true })
    .eq('developer_id', ctx.developer.id).eq('listing_status', 'draft');
  if ((count || 0) >= 20) return res.status(429).json({ error: 'Çok fazla taslak var. Önce mevcut taslakları tamamlayın.' });

  const now = new Date().toISOString();
  const { data: row, error } = await supabase.from('properties').insert({
    name: data.name,
    developer_id: ctx.developer.id,
    listing_status: 'draft',
    listing_kind: 'project',
    is_project: true,
    city: 'Ankara',
    created_via: 'cabinet',
    publish_prices: true, // застройщик может снять галочку на последнем шаге
    created_at: now,
    updated_at: now,
  }).select('id').single();
  if (error) return res.status(500).json({ error: 'Proje oluşturulamadı' });

  await supabase.from('project_changes').insert({
    property_id: row.id, developer_id: ctx.developer.id, user_id: ctx.user.id,
    changes: { _event: 'created', name: [null, data.name] },
  });

  return res.status(200).json({ id: row.id });
}
