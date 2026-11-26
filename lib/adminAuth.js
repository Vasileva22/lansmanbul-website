// Вход в админку LansmanBul.
// Пароль хранится в Vercel (ADMIN_PASSWORD). После входа ставится подписанная cookie
// на 7 дней. Подпись делается секретом ADMIN_API_SECRET, подделать её нельзя.
import crypto from 'crypto';

const COOKIE_NAME = 'lb_admin';
const SESSION_DAYS = 7;

function secret() {
  return String(process.env.ADMIN_API_SECRET || '').trim();
}

function sign(value) {
  return crypto.createHmac('sha256', secret()).update(value).digest('hex');
}

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function isAdminConfigured() {
  return Boolean(secret()) && Boolean(String(process.env.ADMIN_PASSWORD || '').trim());
}

export function checkPassword(password) {
  const expected = String(process.env.ADMIN_PASSWORD || '').trim();
  if (!expected) return false;
  return safeEqual(String(password || ''), expected);
}

export function makeSessionCookie() {
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const token = `${expires}.${sign(String(expires))}`;
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 24 * 60 * 60}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function readCookie(req, name) {
  const header = req?.headers?.cookie || '';
  const part = header.split(';').map((s) => s.trim()).find((s) => s.startsWith(name + '='));
  return part ? decodeURIComponent(part.slice(name.length + 1)) : '';
}

// true — запрос от вошедшего администратора
export function isAdminRequest(req) {
  if (!secret()) return false;
  const token = readCookie(req, COOKIE_NAME);
  const [expires, signature] = token.split('.');
  if (!expires || !signature) return false;
  if (!safeEqual(signature, sign(expires))) return false;
  return Number(expires) > Date.now();
}

// Для getServerSideProps админских страниц: не вошла — отправляем на страницу входа
export function requireAdminPage(context) {
  if (isAdminRequest(context.req)) return null;
  return { redirect: { destination: '/admin/login', permanent: false } };
}
