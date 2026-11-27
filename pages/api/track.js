import { getSupabaseAdmin } from '../../lib/supabaseAdmin';

// Приём анонимных событий: просмотр, WhatsApp, избранное. Личных данных не храним.
const TYPES = new Set(['view', 'whatsapp', 'favorite']);
const BOTS = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|whatsapp\/|telegram/i;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }

  const id = Number(body?.id);
  const type = String(body?.type || '');
  // Отвечаем одинаково быстро и без подробностей — это фоновый запрос
  if (!Number.isInteger(id) || id <= 0 || !TYPES.has(type) || BOTS.test(String(req.headers['user-agent'] || ''))) {
    return res.status(204).end();
  }

  const supabase = getSupabaseAdmin();
  const { data: p } = await supabase.from('properties').select('id, listing_status, created_via').eq('id', id).single();
  const visible = p && p.listing_status !== 'archived' && (!p.created_via || p.listing_status === 'confirmed');
  if (visible) await supabase.from('project_events').insert({ property_id: id, event_type: type });
  return res.status(204).end();
}
