// Форма проекта в кабинете застройщика: поля, проверка, правила отправки.
// Используется и страницей формы, и API (сервер принимает только эти поля).

export const ANKARA_DISTRICTS = [
  'Akyurt', 'Altındağ', 'Ayaş', 'Bala', 'Beypazarı', 'Çamlıdere', 'Çankaya', 'Çubuk', 'Elmadağ',
  'Etimesgut', 'Evren', 'Gölbaşı', 'Güdül', 'Haymana', 'Kahramankazan', 'Kalecik', 'Keçiören',
  'Kızılcahamam', 'Mamak', 'Nallıhan', 'Polatlı', 'Pursaklar', 'Sincan', 'Şereflikoçhisar', 'Yenimahalle',
];

export const PROJECT_STATUSES = ['Lansman', 'Devam ediyor', 'Tamamlandı'];

export const STAGE_OPTIONS = [
  { value: 'lansman', label: 'Lansman (henüz başlamadı)' },
  { value: 'temel', label: 'Temel' },
  { value: 'kaba_insaat', label: 'Kaba inşaat' },
  { value: 'ince_isler', label: 'İnce işler' },
  { value: 'teslim', label: 'Teslim edildi' },
];

export const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export const ROOM_TYPES = ['1+0', '1+1', '2+1', '3+1', '3+2', '4+1', '4+2', '5+1', '5+2', '6+1'];

export const STEPS = [
  { key: 'genel', title: 'Genel bilgiler' },
  { key: 'konum', title: 'Konum' },
  { key: 'planlar', title: 'Planlar ve fiyatlar' },
  { key: 'foto', title: 'Fotoğraflar' },
  { key: 'insaat', title: 'İnşaat aşaması' },
  { key: 'odeme', title: 'Ödeme ve iletişim' },
];

export const MAX_PHOTOS = 20;
export const MAX_CONSTRUCTION_PHOTOS = 10;

// Поля, которые застройщик может менять сам
const TEXT = ['name', 'description', 'features', 'neighborhood', 'address', 'contact_whatsapp'];
const INT = ['floor_count', 'block_count', 'unit_count', 'delivery_year', 'delivery_month', 'down_payment_percent', 'installment_months'];
const BOOL = ['interest_free', 'credit_eligible', 'publish_prices'];

const toInt = (v) => {
  const d = String(v ?? '').replace(/[^\d]/g, '');
  return d ? Number(d) : null;
};
const toBool = (v) => (v === true || v === 'true' ? true : v === false || v === 'false' ? false : null);

// Номер WhatsApp → 905XXXXXXXXX
export function normalizePhone(v) {
  let d = String(v || '').replace(/[^\d]/g, '');
  if (!d) return '';
  if (d.startsWith('0')) d = '90' + d.slice(1);
  if (d.length === 10 && d.startsWith('5')) d = '90' + d;
  return d;
}

// Привести ввод к типам базы. Возвращает { data, errors }.
export function normalizeCabinetInput(input = {}) {
  const data = {};
  const errors = {};
  const has = (k) => Object.prototype.hasOwnProperty.call(input, k);

  for (const k of TEXT) if (has(k)) data[k] = String(input[k] ?? '').trim().slice(0, k === 'description' ? 4000 : 500) || null;
  for (const k of INT) if (has(k)) data[k] = toInt(input[k]);
  for (const k of BOOL) if (has(k)) data[k] = toBool(input[k]);

  if (has('district')) {
    const d = String(input.district || '').trim();
    data.district = ANKARA_DISTRICTS.includes(d) ? d : null;
  }
  if (has('project_status')) data.project_status = PROJECT_STATUSES.includes(input.project_status) ? input.project_status : null;
  if (has('construction_stage')) data.construction_stage = STAGE_OPTIONS.some((s) => s.value === input.construction_stage) ? input.construction_stage : null;

  if (has('latitude') || has('longitude')) {
    const lat = Number(input.latitude);
    const lng = Number(input.longitude);
    // Анкара и окрестности
    if (input.latitude === null || input.latitude === '') { data.latitude = null; data.longitude = null; }
    else if (lat > 38.5 && lat < 41 && lng > 30.5 && lng < 34.5) { data.latitude = lat; data.longitude = lng; }
    else errors.konum = 'Nokta Ankara sınırları içinde olmalı';
  }

  if (has('layouts')) {
    const rows = Array.isArray(input.layouts) ? input.layouts : [];
    const clean = [];
    rows.slice(0, 30).forEach((r, i) => {
      const rooms = ROOM_TYPES.includes(r?.rooms) ? r.rooms : null;
      const area = toInt(r?.area);
      const price = toInt(r?.price);
      if (!rooms && !area && !price) return; // пустая строка
      if (!rooms) errors[`layout_${i}`] = 'Oda tipini seçin';
      else if (!area || area < 15 || area > 2000) errors[`layout_${i}`] = 'Brüt alanı m² olarak yazın';
      else if (price !== null && price > 0 && price < 100000) errors[`layout_${i}`] = 'Fiyatı TL olarak tam yazın (ör. 3.250.000)';
      clean.push({ rooms, area, price: price || null, status: 'satista' });
    });
    data.layouts = clean;
    // карточка и фильтры читают сводные поля
    const areas = clean.map((l) => l.area).filter(Boolean);
    const prices = clean.map((l) => l.price).filter(Boolean);
    data.room_types = clean.length ? Array.from(new Set(clean.map((l) => l.rooms).filter(Boolean))) : null;
    data.area_min = areas.length ? Math.min(...areas) : null;
    data.area_max = areas.length ? Math.max(...areas) : null;
    data.price_min = prices.length ? Math.min(...prices) : null;
    data.price_max = prices.length ? Math.max(...prices) : null;
  }

  if (data.contact_whatsapp) {
    data.contact_whatsapp = normalizePhone(data.contact_whatsapp);
    if (!/^90\d{10}$/.test(data.contact_whatsapp)) errors.contact_whatsapp = 'Numarayı 05XX XXX XX XX şeklinde yazın';
  }
  const year = new Date().getFullYear();
  if (data.delivery_year && (data.delivery_year < 2000 || data.delivery_year > year + 10)) errors.delivery_year = 'Geçerli bir yıl yazın';
  if (data.delivery_month && (data.delivery_month < 1 || data.delivery_month > 12)) errors.delivery_month = 'Ay seçin';
  if (data.down_payment_percent && data.down_payment_percent > 100) errors.down_payment_percent = '0–100 arası';
  if (data.installment_months && data.installment_months > 240) errors.installment_months = 'En fazla 240 ay';
  if (data.floor_count && data.floor_count > 100) errors.floor_count = 'Kat sayısını kontrol edin';
  if (has('name') && (!data.name || data.name.length < 3)) errors.name = 'Proje adını yazın';

  return { data, errors };
}

// Что не заполнено для отправки на проверку: { step, field, message }[]
export function missingForSubmit(p, images) {
  const out = [];
  const add = (step, field, message) => out.push({ step, field, message });
  if (!p.name) add('genel', 'name', 'Proje adı');
  if (!p.project_status) add('genel', 'project_status', 'Satış durumu');
  if (!p.description || p.description.length < 40) add('genel', 'description', 'Proje açıklaması (en az 40 karakter)');
  if (!p.district) add('konum', 'district', 'İlçe');
  if (!Number.isFinite(p.latitude)) add('konum', 'konum', 'Haritada proje konumu');
  const layouts = Array.isArray(p.layouts) ? p.layouts : [];
  if (!layouts.length) add('planlar', 'layouts', 'En az bir daire tipi');
  if ((images?.image_url || []).length < 3) add('foto', 'photos', 'En az 3 fotoğraf');
  if (!p.photo_rights_confirmed_at) add('foto', 'photo_rights', 'Fotoğraf hakları onayı');
  if (!p.construction_stage) add('insaat', 'construction_stage', 'İnşaat aşaması');
  if (!p.delivery_year) add('insaat', 'delivery_year', 'Teslim yılı');
  if (!p.contact_whatsapp) add('odeme', 'contact_whatsapp', 'WhatsApp numarası');
  return out;
}

// Какие изменения записать в журнал: { поле: [было, стало] }
export function diffForLog(before, after) {
  const out = {};
  for (const [k, v] of Object.entries(after)) {
    if (k === 'updated_at') continue;
    const a = JSON.stringify(before?.[k] ?? null);
    const b = JSON.stringify(v ?? null);
    if (a !== b) out[k] = [before?.[k] ?? null, v ?? null];
  }
  return out;
}
