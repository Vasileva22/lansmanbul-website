// Клиент Supabase для браузера — только для входа/регистрации застройщиков.
// Данные проектов браузер получает через наши API (/api/...), а не напрямую из таблиц.
import { createClient } from '@supabase/supabase-js';

const clean = (v) => String(v || '').replace(/^["']|["']$/g, '').trim();
let client = null;

export function getBrowserSupabase() {
  if (client) return client;
  client = createClient(clean(process.env.NEXT_PUBLIC_SUPABASE_URL), clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY), {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: 'lb-developer-auth' },
  });
  return client;
}

// Запрос к нашему API от имени вошедшего застройщика
export async function cabinetFetch(path, options = {}) {
  const { data } = await getBrowserSupabase().auth.getSession();
  const token = data?.session?.access_token;
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json.error || 'Bir hata oluştu');
    err.status = res.status;
    err.fields = json.fields;
    throw err;
  }
  return json;
}
