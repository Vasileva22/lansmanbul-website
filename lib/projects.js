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
function stripCommercial(row, { keepPhotos = false, keepPrices = false } = {}) {
  const layouts = Array.isArray(row.layouts) ? row.layouts : [];
  return {
    ...row,
    property_images: keepPhotos ? row.property_images : [],
    price_min: keepPrices ? row.price_min : null,
    price_max: keepPrices ? row.price_max : null,
    price_numeric: keepPrices ? row.price_numeric : null,
    down_payment_percent: keepPrices ? row.down_payment_percent : null,
    installment_months: keepPrices ? row.installment_months : null,
    interest_free: keepPrices ? row.interest_free : null,
    contact_whatsapp: keepPrices ? row.contact_whatsapp : null,
    layouts: layouts.map((l) => ({
      rooms: l?.rooms,
      area: l?.area,
      status: l?.status,
      ...(keepPrices ? { price: l?.price, price_str: l?.price_str } : {}),
      ...(keepPhotos ? { plan_image: l?.plan_image } : {}),
    })),
  };
}

// Новые поля → привычный компонентам вид
// options.preview = true — закрытый предпросмотр для застройщика: показываем всё собранное
export function toCardShape(rawRow, options = {}) {
  if (!rawRow) return rawRow;
  const confirmed = options.preview || isConfirmed(rawRow);
  // У подтверждённой карточки показываем только то, что разрешил застройщик
  const row = options.preview
    ? rawRow
    : confirmed
      ? stripCommercial(rawRow, { keepPhotos: rawRow.publish_photos === true, keepPrices: rawRow.publish_prices === true })
      : stripCommercial(rawRow);

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
    ...(confirmed && (options.preview || rawRow.publish_prices) ? {} : { Fiyat: '', WhatsApp: '', Ilk_Pesinat: '', Vade_Secenegi: '', Kredi_Durumu: '' }),
  };
}

// Браузер получает проекты только через наш сервер (/api/catalog)
export async function fetchCatalogProjects() {
  const res = await fetch('/api/catalog');
  if (!res.ok) throw new Error('Catalog error: ' + res.status);
  return res.json();
}

export async function fetchProjectsByIds(ids) {
  const clean = (ids || []).map(Number).filter((n) => Number.isInteger(n) && n > 0);
  if (!clean.length) return [];
  const res = await fetch('/api/catalog?ids=' + clean.join(','));
  if (!res.ok) throw new Error('Catalog error: ' + res.status);
  return res.json();
}
