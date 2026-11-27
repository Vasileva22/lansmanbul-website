// Единая логика фильтров каталога: используется и списком проектов, и счётчиками в боковой панели.
// Работает на «чистых» полях карточки (room_types, area_min/max, price_min/max, floor_count, credit_eligible…).

export const PRICE_MAX = 50000000; // ползунок до 50 млн = «50 млн и выше»
export const AREA_MAX = 500;
export const KAT_MAX = 40;

export const DEFAULT_FILTERS = {
  selectedCity: 'Tümü',
  selectedPropertyType: 'all',
  selectedLocations: [],
  selectedRooms: [],
  selectedStatuses: [],
  selectedYears: [],
  areaRange: [0, AREA_MAX],
  katRange: [0, KAT_MAX],
  priceRange: [0, PRICE_MAX],
  activeFeatureFilters: [],
  activePaymentFilters: [],
  listingType: 'all',
};

// Удобства: ищем по целым словам, чтобы «otopark» не считался «park», а месяц «Ocak» — «ocak» (плита)
export const FEATURE_RULES = {
  'Kapalı Otopark': /otopark/,
  '24 Saat Güvenlik': /güvenlik|7\/24|kamera sistemi/,
  'Yüzme Havuzu': /havuz/,
  'Çocuk Oyun Alanı': /çocuk (oyun|park)|oyun (alanı|parkı)/,
  'Spor Salonu': /fitness|spor salonu|\bgym\b|spor alanı/,
  'Sauna': /sauna|hamam|buhar odası|\bspa\b/,
  'Jeneratör': /jeneratör/,
  'Peyzaj': /peyzaj|yeşil alan|yürüyüş|\bpark/, // \bpark не ловит «otopark»
  'Deprem': /deprem|radye|zemin etüd/,
  'Şarj İstasyonu': /şarj|elektrikli araç/,
  'Yerden Isıtma': /yerden ısıtma|zeminden ısıtma|alttan ısıtma/,
  'Ankastre Mutfak': /ankastre|beyaz eşya|ankastre set/,
  'Manzara': /manzara/, // «göl» ловил район Gölbaşı
  'Akıllı Ev': /akıllı ev|smart home|ev otomasyon/,
};

const text = (p) => `${p.Özellikler || ''} ${p.Açıklama || ''}`.toLowerCase();

export function hasFeature(p, key) {
  const rule = FEATURE_RULES[key];
  return rule ? rule.test(text(p)) : text(p).includes(String(key).toLowerCase());
}

// Список планировок проекта: из room_types, а если нет — из таблицы layouts
export function roomsOf(p) {
  const fromTypes = Array.isArray(p.room_types) ? p.room_types : [];
  const fromLayouts = Array.isArray(p.layouts) ? p.layouts.map((l) => l?.rooms) : [];
  return Array.from(new Set([...fromTypes, ...fromLayouts].filter(Boolean).map((r) => String(r).trim())));
}

// «2+1» → {bed:2, salon:1}; «5+1 ve üzeri» → bed ≥ 5
function roomMatches(roomStr, wanted) {
  const w = String(wanted).replace(/ve üzeri/i, '').trim();
  const orMore = /ve üzeri/i.test(String(wanted));
  const m = String(roomStr).match(/^(\d+(?:[.,]5)?)\s*\+\s*(\d+)/);
  const wm = w.match(/^(\d+)\s*\+\s*(\d+)/);
  if (!m || !wm) return String(roomStr).toLowerCase() === w.toLowerCase();
  const bed = parseFloat(m[1].replace(',', '.'));
  if (orMore) return bed >= Number(wm[1]);
  return Math.floor(bed) === Number(wm[1]) && Number(m[2]) === Number(wm[2]);
}

const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v));

// Пересечение диапазонов с учётом «и выше» на верхней границе ползунка
function rangeHit(lo, hi, range, max) {
  const [rMin, rMax] = range;
  const unlimited = rMax >= max;
  if (lo === null && hi === null) return null; // неизвестно
  const a = lo ?? hi;
  const b = hi ?? lo;
  return b >= rMin && (unlimited || a <= rMax);
}

export const isDefaultRange = (range, max) => range[0] <= 0 && range[1] >= max;

export function deliveryYear(p) {
  if (p.delivery_year) return String(p.delivery_year);
  const m = String(p.Teslim_Yili || '').match(/20\d{2}/);
  return m ? m[0] : '';
}
export const isReady = (p) => p.project_status === 'Tamamlandı' || p.konutcesit === 'Tamamlandı' || p.construction_stage === 'teslim';

// Главная функция: проходит ли проект фильтры. ctx.isForeigner — режим «Yabancılar için».
export function matchProject(p, f, ctx = {}) {
  if (f.listingType === 'project' && p.is_project !== true) return false;
  if (f.listingType === 'apartment' && p.is_project === true) return false;

  if (f.selectedLocations?.length) {
    const hay = [p.district, p.neighborhood, p['İlçe/Semt'], p.address].map((x) => String(x || '').toLocaleLowerCase('tr')).join(' | ');
    if (!f.selectedLocations.some((loc) => hay.includes(String(loc).toLocaleLowerCase('tr').trim()))) return false;
  }

  if (f.selectedPropertyType && f.selectedPropertyType !== 'all') {
    const t = `${p.property_type || ''} ${p.testproje || ''}`.toLowerCase();
    const real = t.includes('villa') ? 'villa' : t.includes('penthouse') ? 'penthouse' : 'daire';
    if (real !== f.selectedPropertyType.toLowerCase()) return false;
  }

  if (f.selectedRooms?.length) {
    const rooms = roomsOf(p);
    if (!f.selectedRooms.some((w) => rooms.some((r) => roomMatches(r, w)))) return false;
  }

  if (f.selectedYears?.length) {
    const y = deliveryYear(p);
    if (!f.selectedYears.some((s) => (s === 'Hazır' ? isReady(p) : y === s))) return false;
  }

  if (f.selectedStatuses?.length) {
    const st = String(p.project_status || p.konutcesit || '').trim();
    if (!f.selectedStatuses.includes(st)) return false;
  }

  // Площадь, этажность, цена: неизвестное значение исключаем только когда фильтр реально задан
  if (!isDefaultRange(f.areaRange, AREA_MAX)) {
    const hit = rangeHit(num(p.area_min), num(p.area_max), f.areaRange, AREA_MAX);
    if (hit !== true) return false;
  }
  if (!isDefaultRange(f.katRange, KAT_MAX)) {
    const k = num(p.floor_count);
    const hit = rangeHit(k, k, f.katRange, KAT_MAX);
    if (hit !== true) return false;
  }
  if (!isDefaultRange(f.priceRange, PRICE_MAX)) {
    const hit = rangeHit(num(p.price_min), num(p.price_max), f.priceRange, PRICE_MAX);
    if (hit !== true) return false;
  }

  const physical = (f.activeFeatureFilters || []).filter((x) => x !== 'Vatandaşlığa Uygun' && x !== 'İkamete Uygun');
  if (physical.length && !physical.every((k) => hasFeature(p, k))) return false;

  if (f.activePaymentFilters?.length) {
    const ok = f.activePaymentFilters.some((pay) => {
      if (pay === 'Krediye uygun') return p.credit_eligible === true;
      if (pay === 'Taksit imkanı') return Number(p.installment_months) > 0;
      if (pay === 'Faizsiz taksit') return p.interest_free === true;
      return false;
    });
    if (!ok) return false;
  }

  if (ctx.isForeigner) {
    const fr = p.foreign || {};
    if (fr.closedArea === true) return false;
    const wantCit = f.activeFeatureFilters.includes('Vatandaşlığa Uygun');
    const wantRes = f.activeFeatureFilters.includes('İkamete Uygun');
    if (wantCit && fr.citizenship !== true) return false;
    if (wantRes && fr.residence !== true) return false;
  }
  return true;
}

// Сколько проектов исключено только из-за того, что у них неизвестна цена/площадь
export function unknownPriceCount(list, f) {
  if (isDefaultRange(f.priceRange, PRICE_MAX)) return 0;
  return list.filter((p) => p.price_min == null && p.price_max == null).length;
}

export const SORTS = [
  { value: 'recommended', label: 'Önerilen' },
  { value: 'price_asc', label: 'Fiyat: düşükten yükseğe' },
  { value: 'price_desc', label: 'Fiyat: yüksekten düşüğe' },
  { value: 'delivery', label: 'Teslim tarihi: en yakın' },
  { value: 'newest', label: 'En yeni eklenen' },
];

export function sortProjects(list, sort) {
  const arr = [...list];
  const confirmedFirst = (a, b) => Number(b.listing_status === 'confirmed') - Number(a.listing_status === 'confirmed');
  const price = (p) => num(p.price_min);
  const deliv = (p) => (isReady(p) ? 0 : (Number(deliveryYear(p)) || 9999) * 12 + (Number(p.delivery_month) || 12));
  const nulls = (a, b, fn, dir = 1) => {
    const x = fn(a); const y = fn(b);
    if (x == null && y == null) return 0;
    if (x == null) return 1;
    if (y == null) return -1;
    return (x - y) * dir;
  };
  if (sort === 'price_asc') return arr.sort((a, b) => nulls(a, b, price, 1) || confirmedFirst(a, b));
  if (sort === 'price_desc') return arr.sort((a, b) => nulls(a, b, price, -1) || confirmedFirst(a, b));
  if (sort === 'delivery') return arr.sort((a, b) => deliv(a) - deliv(b) || confirmedFirst(a, b));
  if (sort === 'newest') return arr.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
  return arr.sort(confirmedFirst); // «Önerilen»: подтверждённые первыми, дальше как пришли с сервера
}
