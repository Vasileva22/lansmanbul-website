// Описание полей проекта для админки: подпись, тип, варианты.
// Используется и формой редактирования, и API сохранения (только эти поля можно менять).

export const LISTING_STATUSES = [
  { value: 'draft', label: 'Черновик', color: '#64748b' },
  { value: 'reference', label: 'Справочная', color: '#0ea5e9' },
  { value: 'pending_approval', label: 'Ждёт одобрения', color: '#f59e0b' },
  { value: 'confirmed', label: 'Подтверждена', color: '#059669' },
  { value: 'archived', label: 'Архив', color: '#94a3b8' },
];

export const STAGES = [
  { value: 'lansman', label: 'Lansman' },
  { value: 'temel', label: 'Temel' },
  { value: 'kaba_insaat', label: 'Kaba inşaat' },
  { value: 'ince_isler', label: 'İnce işler' },
  { value: 'teslim', label: 'Teslim' },
];

const YES_NO_UNKNOWN = [
  { value: '', label: 'Неизвестно' },
  { value: 'true', label: 'Да' },
  { value: 'false', label: 'Нет' },
];

export const MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
].map((label, i) => ({ value: String(i + 1), label }));

// type: text | textarea | int | money | select | bool3 | list
export const FIELD_GROUPS = [
  {
    title: 'Статус карточки',
    fields: [
      { key: 'listing_status', label: 'Статус', type: 'select', options: LISTING_STATUSES, required: true },
      { key: 'listing_kind', label: 'Тип', type: 'select', options: [{ value: 'project', label: 'Проект' }, { value: 'unit', label: 'Отдельная квартира' }] },
      { key: 'publish_photos', label: 'Показывать фото (если подтверждена)', type: 'bool3', options: [{ value: 'false', label: 'Нет' }, { value: 'true', label: 'Да — застройщик разрешил' }] },
      { key: 'publish_prices', label: 'Показывать цены и оплату (если подтверждена)', type: 'bool3', options: [{ value: 'false', label: 'Нет' }, { value: 'true', label: 'Да — застройщик разрешил' }] },
    ],
  },
  {
    title: 'Основное',
    fields: [
      { key: 'name', label: 'Название проекта', type: 'text', required: true },
      { key: 'developer_id', label: 'Застройщик', type: 'developer', hint: 'нет в списке? добавьте в разделе «Застройщики»' },
      { key: 'slug', label: 'Адрес страницы (латиницей)', type: 'text', hint: 'например fkn-park-etimesgut' },
      { key: 'city', label: 'Город', type: 'text' },
      { key: 'district', label: 'Район (ilçe)', type: 'text' },
      { key: 'neighborhood', label: 'Микрорайон (mahalle)', type: 'text' },
      { key: 'address', label: 'Адрес', type: 'text', hint: 'при изменении адреса инфраструктура рядом пересчитается автоматически' },
    ],
  },
  {
    title: 'Стройка и сроки',
    fields: [
      { key: 'project_status', label: 'Статус продаж', type: 'select', options: [{ value: '', label: '—' }, { value: 'Lansman', label: 'Lansman' }, { value: 'Devam ediyor', label: 'Devam ediyor' }, { value: 'Tamamlandı', label: 'Tamamlandı' }] },
      { key: 'construction_stage', label: 'Этап стройки', type: 'select', options: [{ value: '', label: '—' }, ...STAGES] },
      { key: 'delivery_year', label: 'Сдача: год', type: 'int' },
      { key: 'delivery_month', label: 'Сдача: месяц', type: 'select', options: [{ value: '', label: '—' }, ...MONTHS] },
      { key: 'block_count', label: 'Корпусов (blok)', type: 'int' },
      { key: 'floor_count', label: 'Этажей', type: 'int' },
      { key: 'unit_count', label: 'Квартир всего', type: 'int' },
    ],
  },
  {
    title: 'Планировки, площадь, цена',
    fields: [
      { key: 'room_types', label: 'Планировки', type: 'list', hint: 'через запятую: 1+1, 2+1, 3+1' },
      { key: 'area_min', label: 'Площадь от, м²', type: 'int' },
      { key: 'area_max', label: 'Площадь до, м²', type: 'int' },
      { key: 'price_min', label: 'Цена от, TL', type: 'money' },
      { key: 'price_max', label: 'Цена до, TL', type: 'money' },
    ],
  },
  {
    title: 'Оплата',
    fields: [
      { key: 'down_payment_percent', label: 'Первый взнос, %', type: 'int' },
      { key: 'installment_months', label: 'Рассрочка, месяцев', type: 'int' },
      { key: 'interest_free', label: 'Без процентов (%0 faiz)', type: 'bool3', options: YES_NO_UNKNOWN },
    ],
  },
  {
    title: 'Документы и иностранцы',
    fields: [
      { key: 'deed_type', label: 'Тип тапу', type: 'select', options: [{ value: '', label: 'Неизвестно' }, { value: 'kat_irtifaki', label: 'Kat irtifakı' }, { value: 'kat_mulkiyeti', label: 'Kat mülkiyeti' }] },
      { key: 'has_occupancy_permit', label: 'Есть iskan', type: 'bool3', options: YES_NO_UNKNOWN },
      { key: 'citizenship_eligible', label: 'Подходит для гражданства (проверено)', type: 'bool3', options: YES_NO_UNKNOWN },
      { key: 'residence_eligible', label: 'Подходит для ВНЖ (проверено)', type: 'bool3', options: YES_NO_UNKNOWN },
    ],
  },
  {
    title: 'Описание',
    fields: [
      { key: 'description', label: 'Описание', type: 'textarea' },
      { key: 'features', label: 'Удобства', type: 'textarea', hint: 'через запятую или с новой строки' },
    ],
  },
  {
    title: 'Контакты и источник',
    fields: [
      { key: 'contact_whatsapp', label: 'WhatsApp компании', type: 'text', hint: 'только общий номер компании, не личный номер менеджера' },
      { key: 'source_name', label: 'Источник данных', type: 'text', hint: 'sahibinden, emlakjet, сайт застройщика…' },
      { key: 'source_url', label: 'Ссылка на источник', type: 'text' },
    ],
  },
];

export const ALL_FIELDS = FIELD_GROUPS.flatMap((g) => g.fields);
const FIELD_BY_KEY = Object.fromEntries(ALL_FIELDS.map((f) => [f.key, f]));

// Приводит значения из формы к типам базы. Возвращает { data, errors }.
export function normalizeInput(input) {
  const data = {};
  const errors = {};

  for (const [key, raw] of Object.entries(input || {})) {
    const field = FIELD_BY_KEY[key];
    if (!field) continue; // всё, чего нет в списке, игнорируем

    const str = raw === null || raw === undefined ? '' : String(raw).trim();

    if (field.type === 'int' || field.type === 'money' || field.type === 'developer') {
      const digits = str.replace(/[^\d]/g, '');
      data[key] = digits ? Number(digits) : null;
    } else if (field.type === 'bool3') {
      data[key] = str === 'true' ? true : str === 'false' ? false : null;
    } else if (field.type === 'list') {
      const items = str.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
      data[key] = items.length ? Array.from(new Set(items)) : null;
    } else if (field.type === 'select' && key === 'delivery_month') {
      data[key] = str ? Number(str) : null;
    } else {
      data[key] = str || null;
    }

    if (field.required && (data[key] === null || data[key] === '')) {
      errors[key] = 'Обязательное поле';
    }
  }

  if (data.slug) {
    data.slug = data.slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
  }
  if (data.delivery_month && (data.delivery_month < 1 || data.delivery_month > 12)) {
    errors.delivery_month = 'Месяц от 1 до 12';
  }
  if (data.price_min && data.price_max && data.price_max < data.price_min) {
    errors.price_max = 'Цена «до» меньше цены «от»';
  }
  if (data.area_min && data.area_max && data.area_max < data.area_min) {
    errors.area_max = 'Площадь «до» меньше площади «от»';
  }

  return { data, errors };
}

// Значение из базы → строка для поля формы
export function toFormValue(field, value) {
  if (value === null || value === undefined) return '';
  if (field.type === 'list') return Array.isArray(value) ? value.join(', ') : String(value);
  if (field.type === 'bool3') return value === true ? 'true' : value === false ? 'false' : '';
  if (field.type === 'money') return Number(value).toLocaleString('tr-TR');
  return String(value);
}

// Поля застройщика для админки
export const DEVELOPER_FIELDS = [
  { key: 'name', label: 'Название компании', type: 'text', required: true },
  { key: 'slug', label: 'Адрес страницы (латиницей)', type: 'text', hint: 'например simge-yapi' },
  { key: 'founded_year', label: 'Год основания', type: 'int' },
  { key: 'completed_projects_count', label: 'Сдано проектов', type: 'int' },
  { key: 'website', label: 'Сайт', type: 'text' },
  { key: 'phone', label: 'Общий телефон компании', type: 'text', hint: 'не публикуется' },
  { key: 'email', label: 'Почта компании', type: 'text', hint: 'не публикуется' },
  { key: 'tax_number', label: 'Vergi numarası', type: 'text', hint: 'не публикуется, нужен для проверки' },
  { key: 'is_verified', label: 'Проверен LansmanBul (значок «Doğrulanmış firma»)', type: 'bool3', options: [{ value: 'false', label: 'Нет' }, { value: 'true', label: 'Да — документы проверены' }] },
  { key: 'internal_notes', label: 'Заметки (видите только вы)', type: 'textarea' },
];
const DEV_BY_KEY = Object.fromEntries(DEVELOPER_FIELDS.map((f) => [f.key, f]));

export function normalizeDeveloper(input) {
  const data = {};
  const errors = {};
  for (const [key, raw] of Object.entries(input || {})) {
    const field = DEV_BY_KEY[key];
    if (!field) continue;
    const str = raw === null || raw === undefined ? '' : String(raw).trim();
    if (field.type === 'int') {
      const digits = str.replace(/[^\d]/g, '');
      data[key] = digits ? Number(digits) : null;
    } else if (field.type === 'bool3') {
      data[key] = str === 'true';
    } else {
      data[key] = str || null;
    }
    if (field.required && !data[key]) errors[key] = 'Обязательное поле';
  }
  if (data.slug) data.slug = data.slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
  return { data, errors };
}
