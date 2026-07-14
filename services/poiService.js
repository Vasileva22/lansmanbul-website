import { createClient } from '@supabase/supabase-js';
import { cityPoiPriorities } from '../config/poi-priorities';

// Инициализируем Supabase внутри сервиса
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const YANDEX_GEOCODER_KEY = process.env.YANDEX_GEOCODER_KEY;
const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY;

/**
 * Вспомогательная функция для надежной нормализации названий городов (с учетом турецкой специфики)
 */
function normalizeCity(city) {
  if (!city) return 'istanbul';
  return city
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Удаляет диакритические знаки (например, g вместо ğ)
    .replace(/ı/g, 'i');            // Корректно заменяет турецкую безточечную ı на i
}

/**
 * Детальная категоризация объектов под транспортную и социальную инфраструктуру Турции
 */
function categorizePoi(categories, name) {
  const catName = (categories?.[0]?.name || '').toLowerCase();
  const catId = categories?.[0]?.id;
  const lowerName = (name || '').toLowerCase();

  // ==================== ГРУППА А: ТРАНСПОРТ ====================
  
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

  // Автобусные остановки
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

  // Долмуши / Маршрутки
  if (
    lowerName.includes('minibüs') || 
    lowerName.includes('dolmuş') || 
    lowerName.includes('dolmus')
  ) {
    return { group: 'transport', type: 'dolmus' };
  }

  // ==================== ГРУППА А: ПЛЯЖИ И МОРЕ ====================
  if (
    lowerName.includes('beach') || 
    lowerName.includes('sea') || 
    lowerName.includes('plaj') || 
    lowerName.includes('sahil') ||
    catName.includes('beach') ||
    catId === 16003
  ) {
    return { group: 'leisure_primary', type: 'beach' };
  }

  // ==================== ГРУППА А: СОЦИАЛЬНАЯ СФЕРА ====================
  // Больницы
  if (
    lowerName.includes('hospital') || 
    lowerName.includes('clinic') || 
    lowerName.includes('doctor') || 
    lowerName.includes('medical') || 
    lowerName.includes('hastane') ||
    lowerName.includes('tıp merkezi') ||
    catName.includes('hospital') ||
    catId === 15014
  ) {
    return { group: 'social', type: 'hospital' };
  }

  // Университеты
  if (
    lowerName.includes('university') || 
    lowerName.includes('college') || 
    lowerName.includes('kampüs') ||
    lowerName.includes('üniversite') ||
    catName.includes('university') ||
    catId === 12013
  ) {
    return { group: 'social', type: 'university' };
  }

  // Школы
  if (
    lowerName.includes('school') || 
    lowerName.includes('high school') || 
    lowerName.includes('okul') ||
    lowerName.includes('lise') ||
    catName.includes('school') ||
    catId === 12009
  ) {
    return { group: 'social', type: 'school' };
  }

  // ==================== ГРУППА Б: ВТОРОСТЕПЕННЫЕ ОБЪЕКТЫ ====================
  // Парки
  if (
    lowerName.includes('park') || 
    lowerName.includes('garden') || 
    lowerName.includes('forest') || 
    lowerName.includes('lake') || 
    catName.includes('park') ||
    catId === 16032
  ) {
    return { group: 'secondary', type: 'park' };
  }

  // Торговые центры
  if (
    lowerName.includes('avm') || 
    lowerName.includes('mall') || 
    lowerName.includes('shopping center') || 
    catName.includes('shopping mall') ||
    catId === 17114
  ) {
    return { group: 'secondary', type: 'mall' };
  }

  // Кафе, кондитерские, продуктовые магазины, аптеки
  return { group: 'secondary', type: 'infrastructure' };
}

/**
 * 1. Запрос координат у Яндекса через официальный домен .ru
 */
async function getCoordinatesFromAddress(addressText) {
  console.log(`[Geocoder] Запрос координат для адреса: "${addressText}"`);

  const rawKey = YANDEX_GEOCODER_KEY ? YANDEX_GEOCODER_KEY.trim().replace(/["']/g, '') : '';

  if (!rawKey) {
    console.error('[Geocoder Error] Критическая ошибка: Переменная YANDEX_GEOCODER_KEY пустая в Vercel!');
    return null;
  }

  try {
    const cleanKey = encodeURIComponent(rawKey);
    const cleanGeocode = encodeURIComponent(addressText.trim());
    
    const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${cleanKey}&geocode=${cleanGeocode}&format=json&results=1`;

    console.log(`[Geocoder Link Check] Отправляем запрос на URL: ${url}`);
    
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    
    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Geocoder Error] Яндекс вернул ошибку HTTP ${res.status}. Ответ сервера: ${errText}`);
      return null;
    }

    const data = await res.json();
    const pos = data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject?.Point?.pos;
    
    if (!pos) {
      console.warn(`[Geocoder Warning] Яндекс ответил успешно (200), но не нашёл этот адрес на карте. Ответ: ${JSON.stringify(data)}`);
      return null;
    }

    const [lngStr, latStr] = pos.split(' ');
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    console.log(`[Geocoder Success] Координаты успешно найдены: lat=${lat}, lng=${lng}`);
    return { lat, lng };
  } catch (err) {
    console.error('[Geocoder Exception] Сетевая ошибка при запросе к Яндексу:', err.message || err);
    return null;
  }
}

/**
 * 2. Сбор инфраструктуры через новый эндпоинт Foursquare
 * Изменено: добавлен ID категории 15000 (Медицина), радиус поиска уменьшен до 1000 метров.
 */
async function fetchFoursquarePOIs(lat, lng) {
  console.log(`[Foursquare] Ищем места вокруг точки: ${lat}, ${lng}`);

  const rawFoursquareKey = FOURSQUARE_API_KEY ? FOURSQUARE_API_KEY.trim().replace(/["']/g, '') : '';

  if (!rawFoursquareKey) {
    console.error('[Foursquare Error] Критическая ошибка: Переменная FOURSQUARE_API_KEY пустая в Vercel!');
    return [];
  }

  const authHeaderValue = rawFoursquareKey.startsWith('fsq3_') 
    ? rawFoursquareKey 
    : `Bearer ${rawFoursquareKey}`;

  // Добавлена категория 15000 (медицинские учреждения)
  const categories = '13000,15000,17000,19000,12000,16000'; 
  
  // Радиус уменьшен с 1500м до 1000м для точности пешеходной доступности
  const url = `https://places-api.foursquare.com/places/search?ll=${lat},${lng}&radius=1000&categories=${categories}&limit=50`;

  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': authHeaderValue,
        'X-Places-Api-Version': '2025-06-17',
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Foursquare Error] Сервер вернул ошибку HTTP ${res.status}. Ответ: ${errText}`);
      return [];
    }

    const data = await res.json();
    const results = data.results || [];
    console.log(`[Foursquare Success] Найдено объектов рядом: ${results.length}`);
    return results;
  } catch (err) {
    console.error('[Foursquare Exception] Ошибка сети при запросе к Foursquare:', err.message || err);
    return [];
  }
}

/**
 * 3. Главная функция обновления объекта в базе данных
 */
export async function updatePropertyPOIs(propertyId) {
  console.log(`\n--- [POI Service Start] Начинаем анализ для ID: ${propertyId} ---`);

  try {
    const { data: property, error: fetchError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (fetchError || !property) {
      console.error(`[DB Error] Не удалось найти объект с ID ${propertyId}:`, fetchError?.message);
      return false;
    }

    const actualAddress = property.address || property.adress || '';
    const fullAddress = `${property.city || 'Istanbul'}, ${actualAddress}`;
    
    const coordinates = await getCoordinatesFromAddress(fullAddress);

    if (!coordinates) {
      console.error(`[POI Service Stop] Скрипт остановлен: Яндекс не вернул координаты.`);
      
      await supabase.from('properties').update({
        poi_data: {
          pois: {},
          calculated_at: new Date().toISOString(),
          livability_score: 0,
          debug_info: {
            geocoder_status: "FAILED_OR_EMPTY",
            foursquare_status: "NOT_STARTED",
            total_found: 0,
            error_message: "Яндекс Геокодер не вернул координаты."
          }
        }
      }).eq('id', propertyId);

      return false;
    }

    const rawPois = await fetchFoursquarePOIs(coordinates.lat, coordinates.lng);

    const cityKey = normalizeCity(property.city);
    const config = cityPoiPriorities[cityKey] || cityPoiPriorities['default'];

    const bestPoisByType = {};

    for (const item of rawPois) {
      const { group, type } = categorizePoi(item.categories, item.name);
      const distance = item.distance || 9999;

      if (!bestPoisByType[type] || distance < bestPoisByType[type].distance) {
        bestPoisByType[type] = { item, group, distance };
      }
    }

    const finalPoisMap = {};

    for (const [type, data] of Object.entries(bestPoisByType)) {
      let travel_mode = 'walking';
      let travel_time_minutes = '';
      let rawScore = 0;

      const D = data.distance;

      // Правило 25 минут (2000 метров):
      if (D <= 2000) {
        // Пешком
        travel_mode = 'walking';
        const walkMinutes = Math.max(1, Math.round(D / 80));
        travel_time_minutes = `${walkMinutes} мин`;
        
        if (D <= 400) rawScore = 10;
        else if (D <= 800) rawScore = 8;
        else if (D <= 1200) rawScore = 6;
        else rawScore = 4;
      } else {
        // На машине (driving)
        travel_mode = 'driving';
        const driveMinutes = Math.max(1, Math.round(D / 330));
        travel_time_minutes = `${driveMinutes} мин на авто`;
        
        if (D <= 3300) rawScore = 5;
        else if (D <= 6600) rawScore = 3;
        else rawScore = 1;
      }

      // Вычисляем веса приоритетов на основе внешнего файла настроек или дефолтных значений
      let weight = 1.0;
      const isResort = (cityKey === 'antalya' || cityKey === 'mugla');

      if (data.group === 'transport') {
        weight = config?.transport ?? (isResort ? 1.2 : 2.5); // Для некурортных городов даем высокий приоритет
      } else if (data.group === 'leisure_primary') {
        weight = config?.leisure_primary ?? (isResort ? 2.5 : 1.0); // Для курортов в приоритете пляж
      } else if (data.group === 'social') {
        weight = config?.social ?? 1.3;
      } else if (data.group === 'secondary') {
        weight = config?.secondary ?? 0.1; // Существенное понижение веса для коммерческих объектов
      }

      const weightedScore = parseFloat((rawScore * weight).toFixed(2));

      finalPoisMap[type] = {
        name: data.item.name,
        distance: data.distance,
        travel_time_minutes,
        travel_mode,
        raw_score: rawScore,
        weighted_score: weightedScore
      };
    }

    // --- ОПРЕДЕЛЕНИЕ ХАРАКТЕРНОГО ОБЪЕКТА (FEATURED POI) ДЛЯ ОТОБРАЖЕНИЯ НА КАРТОЧКЕ ---
    const isResortCity = ['antalya', 'mugla', 'bodrum', 'fethiye', 'alanya', 'kas', 'kemer'].includes(cityKey);
    
    // Изменено: Для некурортных городов из списка исключены все категории, кроме транспортных
    const priorityOrder = isResortCity
      ? [
          'beach',
          'metro', 'metrobus', 'marmaray', 'tram', 'ferry',
          'bus', 'dolmus',
          'hospital', 'university', 'school',
          'park', 'mall', 'infrastructure'
        ]
      : [
          'metro', 'metrobus', 'marmaray', 'tram', 'ferry',
          'bus', 'dolmus'
        ];

    let featuredPoi = null;
    for (const type of priorityOrder) {
      if (finalPoisMap[type]) {
        featuredPoi = {
          type,
          name: finalPoisMap[type].name,
          distance: finalPoisMap[type].distance,
          travel_time_minutes: finalPoisMap[type].travel_time_minutes,
          travel_mode: finalPoisMap[type].travel_mode,
          group: bestPoisByType[type].group,
          weighted_score: finalPoisMap[type].weighted_score
        };
        break; // Прерываем цикл, как только нашли самый подходящий по иерархии объект
      }
    }

    const foundTypesCount = Object.keys(finalPoisMap).length;
    let score = Math.min(10, Math.floor(foundTypesCount * 1.5));
    if (score === 0 && foundTypesCount > 0) score = 1;

    const finalPoiData = {
      pois: finalPoisMap,
      featured_poi: featuredPoi, // Записываем выбранный приоритетный объект
      calculated_at: new Date().toISOString(),
      livability_score: score,
      debug_info: {
        geocoder_status: "SUCCESS",
        foursquare_status: rawPois.length > 0 ? "SUCCESS" : "EMPTY_OR_FAILED",
        total_found: foundTypesCount
      }
    };

    console.log(`[DB Update] Сохраняем координаты и poi_data в базу ОДНИМ запросом для ID: ${propertyId}`);
    const { error: updateError } = await supabase
      .from('properties')
      .update({ 
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        poi_data: finalPoiData
      })
      .eq('id', propertyId);

    if (updateError) {
      console.error(`[DB Error] Не удалось сохранить данные для ID ${propertyId}:`, updateError.message);
      return false;
    }

    console.log(`--- [POI Service End] Объект ID ${propertyId} успешно обработан! ---\n`);
    return true;

  } catch (globalErr) {
    console.error(`[POI Service Fatal Error] Крах всей функции для ID ${propertyId}:`, globalErr.message || globalErr);
    return false;
  }
}
