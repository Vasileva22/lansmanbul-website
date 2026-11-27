// ТОЛЬКО ДЛЯ СЕРВЕРА (getServerSideProps и pages/api).
// Читает проекты секретным ключом и сразу вырезает то, что нельзя показывать публично.
// Прямого доступа к таблицам проектов из браузера больше нет.
import { getSupabaseAdmin } from './supabaseAdmin';
import { toCardShape, LAUNCH_CITY } from './projects';

// Проекты из кабинета застройщика видны на сайте только после проверки (confirmed).
// Остальные карточки (собранные парсером) — как раньше, все кроме архива.
const PUBLIC_OR = 'created_via.is.null,listing_status.eq.confirmed';

const CARD_SELECT = '*, property_images(*), developer:developers(name, is_verified, founded_year, completed_projects_count, website)';

export async function getCatalogProjects() {
  const { data, error } = await getSupabaseAdmin()
    .from('properties')
    .select(CARD_SELECT)
    .neq('listing_status', 'archived')
    .or(PUBLIC_OR)
    .eq('city', LAUNCH_CITY)
    .order('id', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || [])
    .map((row) => toCardShape(row))
    .sort((a, b) => Number(a.is_reference) - Number(b.is_reference));
}

export async function getProjectsByIds(ids) {
  const clean = (ids || []).map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 100);
  if (!clean.length) return [];
  const { data, error } = await getSupabaseAdmin()
    .from('properties')
    .select(CARD_SELECT)
    .in('id', clean)
    .neq('listing_status', 'archived')
    .or(PUBLIC_OR);
  if (error) throw new Error(error.message);
  return (data || []).map((row) => toCardShape(row));
}

// includeHidden — для администратора: любые статусы, без вырезания
export async function getProjectRow(id, { includeHidden = false } = {}) {
  let q = getSupabaseAdmin().from('properties').select(CARD_SELECT).eq('id', id);
  if (!includeHidden) q = q.neq('listing_status', 'archived').or(PUBLIC_OR);
  const { data } = await q.single();
  return data || null;
}
