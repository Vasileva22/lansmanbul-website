import { checkPassword, isAdminConfigured, makeSessionCookie, clearSessionCookie } from '../../../lib/adminAuth';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export default async function handler(req, res) {
  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', clearSessionCookie());
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!isAdminConfigured()) {
    return res.status(500).json({ error: 'В Vercel не задан ADMIN_PASSWORD.' });
  }

  const password = req.body?.password;
  if (!checkPassword(password)) {
    await wait(1200); // замедляем подбор пароля
    return res.status(401).json({ error: 'Неверный пароль' });
  }

  res.setHeader('Set-Cookie', makeSessionCookie());
  return res.status(200).json({ ok: true });
}
