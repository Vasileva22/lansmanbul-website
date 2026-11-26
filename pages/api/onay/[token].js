import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const clean = (v, max = 200) => String(v || '').trim().slice(0, max);

// POST — застройщик принимает решение по своей карточке
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const token = String(req.query.token || '');
  if (!/^[a-f0-9]{32,64}$/.test(token)) {
    await wait(800);
    return res.status(404).json({ error: 'Bağlantı geçersiz.' });
  }

  const supabase = getSupabaseAdmin();
  const { data: approval } = await supabase.from('project_approvals').select('id, property_id, status, expires_at').eq('token', token).single();
  if (!approval) return res.status(404).json({ error: 'Bağlantı geçersiz.' });
  if (!['sent', 'opened'].includes(approval.status)) return res.status(400).json({ error: 'Bu bağlantı daha önce kullanılmış.' });
  if (new Date(approval.expires_at) < new Date()) return res.status(400).json({ error: 'Bağlantının süresi dolmuş. Lütfen bizimle iletişime geçin.' });

  const b = req.body || {};
  const decision = b.decision;
  if (!['approve', 'changes', 'reject'].includes(decision)) return res.status(400).json({ error: 'Geçersiz işlem.' });

  const fields = {
    approver_name: clean(b.approver_name, 120),
    approver_title: clean(b.approver_title, 120),
    company_name: clean(b.company_name, 200),
    tax_number: clean(b.tax_number, 20).replace(/\D/g, ''),
    approver_phone: clean(b.approver_phone, 30),
  };

  const errors = {};
  if (!fields.approver_name) errors.approver_name = 'Zorunlu alan';
  if (!fields.company_name) errors.company_name = 'Zorunlu alan';
  if (!fields.approver_phone || fields.approver_phone.replace(/\D/g, '').length < 10) errors.approver_phone = 'Geçerli bir telefon girin';

  if (decision === 'approve') {
    if (!fields.approver_title) errors.approver_title = 'Zorunlu alan';
    if (!/^\d{10,11}$/.test(fields.tax_number)) errors.tax_number = 'Vergi / TC kimlik numarası 10 veya 11 haneli olmalı';
    if (b.consent_authority !== true) errors.consent_authority = 'Onay gerekli';
    if (b.consent_kvkk !== true) errors.consent_kvkk = 'Onay gerekli';
    if (b.allow_photos === true && b.consent_media_rights !== true) errors.consent_media_rights = 'Fotoğraflar için kullanım hakkı onayı gerekli';
  }
  if (decision === 'changes' && !clean(b.correction_note, 2000)) errors.correction_note = 'Neyin düzeltilmesini istediğinizi yazın';
  if (Object.keys(errors).length) return res.status(400).json({ error: 'Lütfen işaretli alanları kontrol edin.', fields: errors });

  const update = {
    ...fields,
    status: decision === 'approve' ? 'approved' : decision === 'changes' ? 'needs_changes' : 'rejected',
    decided_at: new Date().toISOString(),
    consent_authority: b.consent_authority === true,
    consent_media_rights: b.consent_media_rights === true,
    consent_kvkk: b.consent_kvkk === true,
    allow_photos: decision === 'approve' && b.allow_photos === true,
    allow_prices: decision === 'approve' && b.allow_prices === true,
    allow_layouts: decision === 'approve',
    correction_note: clean(b.correction_note, 2000) || null,
    ip_address: String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim().slice(0, 64),
    user_agent: String(req.headers['user-agent'] || '').slice(0, 300),
  };

  const { error } = await supabase.from('project_approvals').update(update).eq('id', approval.id).in('status', ['sent', 'opened']);
  if (error) return res.status(500).json({ error: 'Kaydedilemedi, lütfen tekrar deneyin.' });

  // Застройщик просит не публиковать — сразу убираем карточку с сайта (в архив)
  if (decision === 'reject') {
    await supabase.from('properties').update({ listing_status: 'archived', updated_at: new Date().toISOString() }).eq('id', approval.property_id);
  }

  return res.status(200).json({ ok: true, status: update.status });
}
