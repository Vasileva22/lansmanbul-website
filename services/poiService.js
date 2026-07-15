import { createClient } from '@supabase/supabase-js';

// Инициализация Supabase-клиента
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const YANDEX_GEOCODER_KEY = process.env.YANDEX_GEOCODER_KEY;
const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY;

function normalizeCity(city) {
  if (!city) return 'istanbul';
  return city
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i');
}

/**
 * Очищенная категоризация: СТРОГО только пляжи и транспортные узлы
 */
function categorizePoi(categories, name) {
  const catName = (categories?.[0]?.name || '').toLowerCase();
  const catId = categories?.[0]?.id;
  const lowerName = (name || '').toLowerCase();

  // Пляж / Береговая линия
  if (
    lowerName.includes('beach') || 
    lowerName.includes('plaj') || 
    lowerName.includes('sahil') ||
    catName.includes('beach') ||
    catId === 16003
  ) {
    return { group: 'leisure_primary', type: 'beach' };
  }

  // Метро и Метробус
  if (
    lowerName.includes('metro') || 
    catName.includes('subway') || 
    catName.includes('metro station') ||
    catId === 19014
  ) {
    if (lowerName.includes('metrobus') || lowerName.includes('metrobüs')) {
      return { group: 'transport', type: 'metrobus' };
    }
    return { group: 'transport', type: 'metro' };
  }

  if (lowerName.includes('metrobus') || lowerName.includes('metrobüs')) {
    return { group: 'transport', type: 'metrobus' };
  }

  // Мармарай
  if (lowerName.includes('marmaray')) {
    return { group: 'transport', type: 'marmaray' };
  }

  // Трамваи
  if (
    lowerName.includes('tramway') || 
    lowerName.includes('tramvay') || 
    catName.includes('tram') ||
    catId === 19016
  ) {
    return { group: 'transport', type: 'tram' };
  }

  // Паромы и причалы
  if (
    lowerName.includes('iskele') || 
    lowerName.includes('vapur') || 
    lowerName.includes('ferry') || 
    catName.includes('ferry') || 
    catName.includes('pier') ||
    catId === 19011 || catId === 19012
  ) {
    return { group: 'transport', type: 'ferry' };
  }

  // Автобусные остановки и маршрутки
  if (
    lowerName.includes('otobüs') || 
    lowerName.includes('durak') || 
    lowerName.includes('durağı') || 
    lowerName.includes('bus stop') ||
    catName.includes('bus stop') ||
    catId === 19005
  ) {
    if (lowerName.includes('minibüs') || lowerName.includes('dolmuş') || lowerName.includes('dolmus')) {
      return { group: 'transport', type: 'dolmus' };
    }
    return { group: 'transport', type: 'bus' };
  }

  if (
    lowerName.includes('minibüs') || 
    lowerName.includes('dolmuş') || 
    lowerName.includes('dolmus')
  ) {
    return { group: 'transport', type: 'dolmus' };
  }

  return { group: 'secondary', type: 'infrastructure' };
}

/**
 * 1. Получение координат в Яндексе
 */
async function getCoordinatesFromAddress(addressText) {
  const rawKey = YANDEX_GEOCODER_KEY ? YANDEX_GEOCODER_KEY.trim().replace(/["']/g, '') : '';
  if (!rawKey) {
    console.error('[Geocoder Error] API ключ Yandex Geocoder не задан в переменных окружения.');
    return null;
  }

  try {
    const cleanKey = encodeURIComponent(rawKey);
    const cleanGeocode = encodeURIComponent(addressText.trim());
    const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${cleanKey}&geocode=${cleanGeocode}&format=json&results=1`;
    
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) {
      console.error(`[Geocoder HTTP Error] Яндекс вернул статус: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const pos = data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject?.Point?.pos;
    if (!pos) {
      console.warn(`[Geocoder Warning] Адрес не найден на карте: "${addressText}"`);
      return null;
    }

    const [lngStr, latStr] = pos.split(' ');
    return { lat: parseFloat(latStr), lng: parseFloat(lngStr) };
  } catch (err) {
    console.error('[Geocoder Exception]:', err.message || err);
    return null;
  }
}

/**
 * 2. Очищенный Foursquare-запрос с поддержкой версионирования и рабочим доменом
 */
async function fetchFoursquarePOIs(lat, lng, isResort) {
  const rawFoursquareKey = FOURSQUARE_API_KEY ? FOURSQUARE_API_KEY.trim().replace(/["']/g, '') : '';
  if (!rawFoursquareKey) {
    console.error('[Foursquare Error] API ключ Foursquare не задан в переменных окружения.');
    return [];
  }

  const authHeaderValue = rawFoursquareKey.startsWith('fsq3_') ? rawFoursquareKey : `Bearer ${rawFoursquareKey}`;

  const categoriesList = isResort ? '19000,16003' : '19000';
  const radius = isResort ? 5000 : 10000;

  // ИСПРАВЛЕНО: Домен изменен на актуальный рабочий шлюз Foursquare
  const url = `https://places-api.foursquare.com/places/search?ll=${lat},${lng}&radius=${radius}&categories=${categoriesList}&limit=50`;

  console.log(`[Foursquare Request] URL: ${url}`);

  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': authHeaderValue,
        'accept': 'application/json',
        'X-Places-Api-Version': '2025-06-17' // Версионирование API
      }
    });
    if (!res.ok) {
      console.error(`[Foursquare HTTP Error] Статус: ${res.status}`);
      return [];
    }
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.error('[Foursquare Exception]:', err.message || err);
    return [];
  }
}

/**
 * 3. Главная бэкенд-функция
 */
export async function updatePropertyPOIs(propertyId) {
  console.log(`\n--- [POI Service Start] Начинаем анализ для ID: ${propertyId} ---`);

  try {
    const { data: property, error: fetchError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (fetchError || !property) return false;

    const actualAddress = property.address || property.adress || '';
    const fullAddress = `${property.city || 'Istanbul'}, ${actualAddress}`;
    
    const coordinates = await getCoordinatesFromAddress(fullAddress);
    if (!coordinates) return false;

    const cityKey = normalizeCity(property.city);
    const isResortCity = ['antalya', 'mugla', 'bodrum', 'fethiye', 'alanya', 'kas', 'kemer'].includes(cityKey);

    const rawPois = await fetchFoursquarePOIs(coordinates.lat, coordinates.lng, isResortCity);
    console.log(`[Foursquare Success] Найдено объектов рядом: ${rawPois.length}`);

    // Диагностический вывод всех найденных точек
    console.log(`\n[Diagnostic] ---- Список всех полученных точек от API ----`);
    rawPois.forEach((item, index) => {
      const { type } = categorizePoi(item.categories, item.name);
      const rawCategoriesJSON = JSON.stringify(item.categories || []);
      console.log(`  ${index + 1}. Имя: "${item.name}" | Дистанция: ${item.distance}м | Тип в коде: "${type}" | Сырые категории: ${rawCategoriesJSON}`);
    });
    console.log(`[Diagnostic] -------------------------------------------------\n`);

    const finalPoisMap = {};

    for (const item of rawPois) {
      const { type } = categorizePoi(item.categories, item.name);
      const D = item.distance || 9999;
      
      if (isResortCity && D > 5000) continue;
      if (!isResortCity && D > 10000) continue;

      let travel_mode = 'walking';
      let travel_time_minutes = '';
      let time_val = 0;

      if (D <= 2000) {
        travel_mode = 'walking';
        time_val = Math.max(1, Math.round(D / 80));
        travel_time_minutes = `${time_val} мин`;
      } else {
        travel_mode = 'driving';
        time_val = Math.max(1, Math.round(D / 330));
        travel_time_minutes = `${time_val} мин на авто`;
      }

      let priority_score = 0;

      if (type === 'beach' && isResortCity) {
        priority_score = travel_mode === 'walking' ? (1100 - time_val) : (650 - time_val);
      } else if (['metro', 'metrobus', 'marmaray'].includes(type)) {
        priority_score = travel_mode === 'walking' ? (1000 - time_val) : (600 - time_val);
      } else if (type === 'tram') {
        priority_score = travel_mode === 'walking' ? (900 - time_val) : (500 - time_val);
      } else if (type === 'ferry') {
        priority_score = travel_mode === 'walking' ? (800 - time_val) : (400 - time_val);
      } else if (['bus', 'dolmus'].includes(type)) {
        priority_score = travel_mode === 'walking' ? (700 - time_val) : (300 - time_val);
      }

      if (priority_score > 0) {
        if (!finalPoisMap[type] || priority_score > finalPoisMap[type].priority_score) {
          finalPoisMap[type] = {
            name: item.name,
            distance: D,
            travel_time_minutes,
            travel_mode,
            priority_score
          };
        }
      }
    }

    // Находим один лучший объект
    let featuredPoi = null;
    let maxScore = -1;

    for (const [type, poi] of Object.entries(finalPoisMap)) {
      if (poi.priority_score > maxScore) {
        maxScore = poi.priority_score;
        featuredPoi = {
          type,
          name: poi.name,
          distance: poi.distance,
          travel_time_minutes: poi.travel_time_minutes,
          travel_mode: poi.travel_mode
        };
      }
    }

    console.log(`[Diagnostic] ---- Расчет финального скоринга ----`);
    for (const [type, poi] of Object.entries(finalPoisMap)) {
      console.log(`  -> Тип: "${type}" | Имя: "${poi.name}" | Итоговый балл (Score): ${poi.priority_score} | Режим: ${poi.travel_mode}`);
    }
    console.log(`[Diagnostic] В ИТОГЕ ВЫБРАН FEATURED_POI:`, featuredPoi);
    console.log(`[Diagnostic] ------------------------------------\n`);

    const foundTypesCount = Object.keys(finalPoisMap).length;
    let score = Math.min(10, Math.floor(foundTypesCount * 1.5));
    if (score === 0 && foundTypesCount > 0) score = 1;

    const finalPoiData = {
      pois: finalPoisMap,
      featured_poi: featuredPoi,
      calculated_at: new Date().toISOString(),
      livability_score: score
    };

    const { error: updateError } = await supabase
      .from('properties')
      .update({ 
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        poi_data: finalPoiData
      })
      .eq('id', propertyId);

    if (updateError) return false;

    console.log(`[DB Update] Сохраняем координаты и poi_data в базу ОДНИМ запросом для ID: ${propertyId}`);
    console.log(`--- [POI Service End] Объект ID ${propertyId} успешно обработан! ---\n`);
    return true;

  } catch (globalErr) {
    console.error(`[POI Service Fatal Error]`, globalErr.message || globalErr);
    return false;
  }
}
