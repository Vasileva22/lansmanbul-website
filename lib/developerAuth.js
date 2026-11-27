// Сервер: кто из застройщиков делает запрос (по токену входа из заголовка Authorization)
import { getSupabaseAdmin } from './supabaseAdmin';

export async function getDeveloperContext(req) {
  const header = String(req.headers.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return null;

  const supabase = getSupabaseAdmin();
  const { data: userData, error } = await supabase.auth.getUser(token);
  if (error || !userData?.user) return null;
  const user = userData.user;

  const { data: member } = await supabase
    .from('developer_members')
    .select('developer_id, contact_name, contact_title, phone, role, developer:developers(id, name, slug, tax_number, phone, email, website, founded_year, is_verified, account_status, logo_url)')
    .eq('user_id', user.id)
    .single();
  if (!member) return { user, member: null, developer: null };

  return { user, member, developer: member.developer };
}

// Для API: вернуть контекст или ответить 401/403
export async function requireDeveloper(req, res, { activeOnly = false } = {}) {
  const ctx = await getDeveloperContext(req);
  if (!ctx) { res.status(401).json({ error: 'Lütfen giriş yapın' }); return null; }
  if (!ctx.developer) { res.status(403).json({ error: 'Bu hesap bir geliştirici firmasına bağlı değil' }); return null; }
  if (ctx.developer.account_status === 'rejected') { res.status(403).json({ error: 'Firma hesabınız onaylanmadı. Bizimle iletişime geçin.' }); return null; }
  if (activeOnly && ctx.developer.account_status !== 'active') { res.status(403).json({ error: 'Firmanız henüz doğrulanmadı' }); return null; }
  return ctx;
}
