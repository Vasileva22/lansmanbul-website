// Защита служебных API-адресов паролем ADMIN_API_SECRET.
// Пароль передаётся заголовком "x-admin-secret" (так делает вебхук Supabase)
// или параметром ?secret=... (удобно, чтобы запустить парсер из браузера).
import crypto from 'crypto';

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Возвращает true, если доступ разрешён. Иначе сам отвечает 401/500 и возвращает false.
export function requireAdminSecret(req, res) {
  const expected = String(process.env.ADMIN_API_SECRET || '').trim();

  if (!expected) {
    res.status(500).json({ error: 'ADMIN_API_SECRET sunucuda tanımlı değil.' });
    return false;
  }

  const provided = req.headers['x-admin-secret'] || req.query?.secret || '';

  if (!provided || !safeEqual(provided, expected)) {
    res.status(401).json({ error: 'Yetkisiz erişim.' });
    return false;
  }

  return true;
}
