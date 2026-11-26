// Единая точка чтения проектов из базы.
// Берёт НОВЫЕ чистые поля (name, price_min, delivery_year ...) и отдаёт объект
// в том виде, к которому привыкли компоненты сайта (testproje, Fiyat, Teslim_Yili ...).
// Благодаря этому старые колонки в базе можно будет удалить, не ломая сайт.

// Пока работаем только по Анкаре
export const LAUNCH_CITY = 'Ankara';

// Какие карточки показываются на сайте. Архив не показываем никогда.
// После запуска админки здесь останутся только 'reference' и 'confirmed'.
export const PUBLIC_STATUS_FILTER = 'listing_status=neq.archived';

const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export function formatTL(value) {
  if (value === null || value === undefined || value === '') return '';
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return '';
  return n.toLocaleString('tr-TR') + ' TL';
}

export function formatDelivery(year, month) {
  if (!year) return '';
  return month ? `${MONTHS_TR[month - 1]} ${year}` : String(year);
}

// Подтверждена ли карточка застройщиком (только тогда показываем цены, фото и контакты)
export function isConfirmed(row) {
  return row?.listing_status === 'confirmed';
}

// Справочная карточка: убираем всё, что делает её объявлением о продаже.
// Данные вырезаются ещё на сервере — в браузер они вообще не попадают.
function stripCommercial(row) {
  const layouts = Array.isArray(row.layouts) ? row.layouts : [];
  return {
    ...row,
    property_images: [],
    price_min: null,
    price_max: null,
    price_numeric: null,
    down_payment_percent: null,
    installment_months: null,
    interest_free: null,
    contact_whatsapp: null,
    layouts: layouts.map((l) => ({ rooms: l?.rooms, area: l?.area, status: l?.status })),
  };
}

// Новые поля → привычный компонентам вид
export function toCardShape(rawRow) {
  if (!rawRow) return rawRow;
  const confirmed = isConfirmed(rawRow);
  const row = confirmed ? rawRow : stripCommercial(rawRow);

  const priceMin = row.price_min ? Number(row.price_min) : null;
  const priceMax = row.price_max ? Number(row.price_max) : null;
  const priceText = priceMin
    ? formatTL(priceMin) + (priceMax && priceMax > priceMin ? " 'den itibaren" : '')
    : '';

  const district = row.district || '';
  // если микрорайон совпадает с районом ("Polatlı Polatlı"), не повторяем
  const neighborhood = row.neighborhood && row.neighborhood !== district ? row.neighborhood : '';

  return {
    ...row,
    // название и адрес
    testproje: row.name || '',
    'İlçe/Semt': [district, neighborhood].filter(Boolean).join(' '),
    mahalle: neighborhood,
    adress: row.address || [district, row.city].filter(Boolean).join(', '),
    // описание и удобства
    Açıklama: row.description || '',
    Özellikler: row.features || '',
    // планировки, площадь, цена
    'card odalar': Array.isArray(row.room_types) ? row.room_types.join(', ') : '',
    'card-area': row.area_min || null,
    Fiyat: priceText,
    price_numeric: priceMin,
    // статус и сроки
    konutcesit: row.project_status || '',
    Teslim_Yili: formatDelivery(row.delivery_year, row.delivery_month),
    'Kat Sayısı': row.floor_count ? String(row.floor_count) : '',
    'Santiye Tarihi': null, // старое поле с выдуманной датой — больше не показываем
    // оплата
    Ilk_Pesinat: row.down_payment_percent ? `%${row.down_payment_percent}` : '',
    Vade_Secenegi: row.installment_months ? `${row.installment_months} Ay Vade` : '',
    Kredi_Durumu: row.interest_free ? '%0 Faiz' : '',
    // контакты и тип
    WhatsApp: row.contact_whatsapp || '',
    is_project: row.listing_kind === 'project',
    // для иностранцев: пусто = не проверено (фильтры скрывают только явное false)
    is_citizenship_eligible: row.citizenship_eligible,
    is_residence_eligible: row.residence_eligible,
    is_open_area: row.in_open_area,
    // режим карточки
    is_reference: !confirmed,
    // старые текстовые поля тоже не должны «протекать» в справочную карточку
    ...(confirmed ? {} : { Fiyat: '', WhatsApp: '', Ilk_Pesinat: '', Vade_Secenegi: '', Kredi_Durumu: '' }),
  };
}

function cleanEnv(val) {
  return String(val || '').replace(/^["']|["']$/g, '').trim();
}

// Список проектов для каталога (работает и на сервере, и в браузере)
export async function fetchCatalogProjects() {
  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!url || !key) return [];

  const query =
    '/rest/v1/properties?select=*,property_images(*),developer:developers(name,is_verified,founded_year,completed_projects_count,website)' +
    '&' + PUBLIC_STATUS_FILTER +
    '&city=eq.' + encodeURIComponent(LAUNCH_CITY) +
    '&order=id.desc';

  const res = await fetch(url + query, {
    headers: { apikey: key, Authorization: 'Bearer ' + key },
  });
  if (!res.ok) throw new Error('Supabase REST error: ' + res.status + ' ' + res.statusText);
  const rows = await res.json();
  // Подтверждённые проекты — первыми, остальной порядок сохраняется
  return (rows || [])
    .map(toCardShape)
    .sort((a, b) => Number(a.is_reference) - Number(b.is_reference));
}
