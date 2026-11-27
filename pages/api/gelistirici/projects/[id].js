import { requireDeveloper } from '../../../../lib/developerAuth';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { normalizeCabinetInput, missingForSubmit, diffForLog, MAX_PHOTOS, MAX_CONSTRUCTION_PHOTOS } from '../../../../lib/cabinetProject';

const FIELDS = 'id, name, description, features, district, neighborhood, address, latitude, longitude, project_status, construction_stage, stage_updated_at, delivery_year, delivery_month, floor_count, block_count, unit_count, layouts, room_types, area_min, area_max, price_min, price_max, down_payment_percent, installment_months, interest_free, credit_eligible, contact_whatsapp, publish_prices, publish_photos, listing_status, created_via, submitted_at, has_building_permit, building_permit_path, photo_rights_confirmed_at, developer_id, updated_at';

// Загрузить проект и убедиться, что он принадлежит этой компании
export async function loadOwnProject(supabase, id, developerId) {
  const { data } = await supabase.from('properties').select(FIELDS).eq('id', id).single();
  if (!data || data.developer_id !== developerId || data.listing_status === 'archived') return null;
  const { data: imgs } = await supabase.from('property_images').select('id, image_url, Construction').eq('property_id', id).order('id').limit(1);
  return { project: data, images: imgs?.[0] || null };
}

function publicPrefix(id) {
  const base = String(process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/^["']|["']$/g, '').trim().replace(/\/$/, '');
  return `${base}/storage/v1/object/public/images/projects/${id}/`;
}

function cleanUrls(list, id, max) {
  if (!Array.isArray(list)) return null;
  const prefix = publicPrefix(id);
  return Array.from(new Set(list.filter((u) => typeof u === 'string' && u.startsWith(prefix)))).slice(0, max);
}

export default async function handler(req, res) {
  const ctx = await requireDeveloper(req, res, { activeOnly: true });
  if (!ctx) return;
  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Geçersiz proje' });

  const supabase = getSupabaseAdmin();
  const own = await loadOwnProject(supabase, id, ctx.developer.id);
  if (!own) return res.status(404).json({ error: 'Proje bulunamadı' });
  const { project, images } = own;

  if (req.method === 'GET') {
    return res.status(200).json({ project, images: { image_url: images?.image_url || [], Construction: images?.Construction || [] }, missing: missingForSubmit(project, images) });
  }
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method Not Allowed' });

  const body = req.body || {};
  const { data, errors } = normalizeCabinetInput(body);
  if (Object.keys(errors).length) return res.status(400).json({ error: 'Alanları kontrol edin', fields: errors });

  // Документ о разрешении на строительство — только файл из папки этого проекта
  if ('building_permit_path' in body) {
    const p = body.building_permit_path;
    if (p === null) data.building_permit_path = null;
    else if (typeof p === 'string' && p.startsWith(`projects/${id}/`) && !p.includes('..')) {
      data.building_permit_path = p;
      data.has_building_permit = null; // снова ждёт проверки администратором
    }
  }
  if (body.photo_rights === true && !project.photo_rights_confirmed_at) data.photo_rights_confirmed_at = new Date().toISOString();
  if (body.photo_rights === false) data.photo_rights_confirmed_at = null;

  if ('construction_stage' in data && data.construction_stage !== project.construction_stage) {
    data.stage_updated_at = new Date().toISOString();
  }

  // Фото
  let newImages = null;
  if (body.photos && typeof body.photos === 'object') {
    const main = cleanUrls(body.photos.image_url, id, MAX_PHOTOS);
    const cons = cleanUrls(body.photos.Construction, id, MAX_CONSTRUCTION_PHOTOS);
    newImages = {
      image_url: main ?? (images?.image_url || []),
      Construction: cons ?? (images?.Construction || []),
    };
  }

  // Отправка на проверку
  let submitted = false;
  if (body.action === 'submit') {
    const merged = { ...project, ...data };
    const missing = missingForSubmit(merged, newImages || images);
    if (missing.length) return res.status(400).json({ error: 'Eksik bilgiler var', missing });
    if (['draft', 'reference', 'pending_approval'].includes(project.listing_status)) {
      data.listing_status = 'in_review';
      data.submitted_at = new Date().toISOString();
      data.publish_photos = true; // фото загрузил сам застройщик и подтвердил права
      if (merged.publish_prices === null || merged.publish_prices === undefined) data.publish_prices = true;
      submitted = true;
    }
  }

  const changes = diffForLog(project, data);
  if (newImages) {
    const before = { image_url: images?.image_url || [], Construction: images?.Construction || [] };
    if (JSON.stringify(before.image_url) !== JSON.stringify(newImages.image_url)) changes.photos = [before.image_url.length, newImages.image_url.length];
    if (JSON.stringify(before.Construction) !== JSON.stringify(newImages.Construction)) changes.construction_photos = [before.Construction.length, newImages.Construction.length];
  }

  if (Object.keys(data).length) {
    data.updated_at = new Date().toISOString();
    const { error } = await supabase.from('properties').update(data).eq('id', id);
    if (error) return res.status(500).json({ error: 'Kaydedilemedi, tekrar deneyin' });
  }
  if (newImages) {
    const { error } = images?.id
      ? await supabase.from('property_images').update(newImages).eq('id', images.id)
      : await supabase.from('property_images').insert({ property_id: id, ...newImages });
    if (error) return res.status(500).json({ error: 'Fotoğraflar kaydedilemedi' });
  }

  // Журнал: кто и что поменял (особенно важно для уже опубликованных проектов)
  if (Object.keys(changes).length) {
    if (submitted) changes._event = 'submitted';
    else if (project.listing_status === 'confirmed') changes._event = 'live_edit';
    await supabase.from('project_changes').insert({ property_id: id, developer_id: ctx.developer.id, user_id: ctx.user.id, changes });
  }

  const fresh = await loadOwnProject(supabase, id, ctx.developer.id);
  return res.status(200).json({
    ok: true,
    submitted,
    project: fresh.project,
    images: { image_url: fresh.images?.image_url || [], Construction: fresh.images?.Construction || [] },
    missing: missingForSubmit(fresh.project, fresh.images),
  });
}
