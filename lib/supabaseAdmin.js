// Серверный клиент Supabase с секретным ключом (service_role).
// Использовать ТОЛЬКО в pages/api/* и services/* — никогда в компонентах и страницах,
// иначе ключ попадёт в браузер.
import { createClient } from '@supabase/supabase-js';

const clean = (val) => String(val || '').replace(/^["']|["']$/g, '').trim();

let adminClient = null;

export function getSupabaseAdmin() {
  if (adminClient) return adminClient;

  const url = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceKey = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!url || !serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY veya NEXT_PUBLIC_SUPABASE_URL tanımlı değil (Vercel ayarlarını kontrol edin).');
  }

  adminClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}
