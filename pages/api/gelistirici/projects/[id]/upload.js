import crypto from 'crypto';
import { requireDeveloper } from '../../../../../lib/developerAuth';
import { getSupabaseAdmin } from '../../../../../lib/supabaseAdmin';

// Кабинет: разовая ссылка для загрузки одного файла прямо в хранилище.
// Файл попадает только в папку своего проекта; ссылка действует 2 часа и только для этого пути.
const KINDS = {
  photo: { bucket: 'images', types: { 'image/jpeg': 'jpg', 'image/webp': 'webp' } },
  construction: { bucket: 'images', types: { 'image/jpeg': 'jpg', 'image/webp': 'webp' } },
  permit: { bucket: 'documents', types: { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' } },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  const ctx = await requireDeveloper(req, res, { activeOnly: true });
  if (!ctx) return;

  const id = Number(req.query.id);
  const kind = KINDS[req.body?.kind];
  const ext = kind?.types[req.body?.contentType];
  if (!Number.isInteger(id) || !kind || !ext) return res.status(400).json({ error: 'Bu dosya türü desteklenmiyor' });

  const supabase = getSupabaseAdmin();
  const { data: p } = await supabase.from('properties').select('developer_id, listing_status').eq('id', id).single();
  if (!p || p.developer_id !== ctx.developer.id || p.listing_status === 'archived') return res.status(404).json({ error: 'Proje bulunamadı' });

  const prefix = req.body.kind === 'permit' ? 'ruhsat' : req.body.kind === 'construction' ? 'insaat' : 'foto';
  const path = `projects/${id}/${prefix}-${crypto.randomUUID()}.${ext}`;
  const { data, error } = await supabase.storage.from(kind.bucket).createSignedUploadUrl(path);
  if (error) return res.status(500).json({ error: 'Yükleme başlatılamadı' });

  const publicUrl = kind.bucket === 'images' ? supabase.storage.from('images').getPublicUrl(path).data.publicUrl : null;
  return res.status(200).json({ bucket: kind.bucket, path, token: data.token, publicUrl });
}
