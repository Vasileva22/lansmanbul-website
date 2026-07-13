import { createClient } from '@supabase/supabase-js';
import { cityPoiPriorities } from '../config/poi-priorities';

// Инициализируем Supabase внутри сервиса
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const YANDEX_GEOCODER_KEY = process.env.YANDEX_GEOCODER_KEY;
const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY;

/**
 * Категоризация объектов под требования скоринга и интерфейса PropertyCard
 */
function categorizePoi(categories) {
  const name = (categories?.[0]?.name || '').toLowerCase();
  const id = categories?.[0]?.id;

  // 1. Транспорт (metro, metrobus, train, tram)
  if (
    name.includes('metro') || 
    name.includes('subway') || 
    name.includes('train') || 
    name.includes('tram') ||
    name.includes('transit') ||
    id === 19014 || id === 19013
  ) {
    return { group: 'transport', type: 'metro' };
  }

  // 2. Пляжи и досуг (beach, park)
  if (
    name.includes('beach') || 
    name.includes('sea') || 
    name.includes('plaj') || 
    id === 16003
  ) {
    return { group: 'leisure', type: 'beach' };
  }

  if (
    name.includes('park') || 
    name.includes('garden') || 
    name.includes('forest') || 
    name.includes('lake') || 
    name.includes('marina') || 
    name.includes('playground')
  ) {
    return { group: 'leisure', type: 'leisure' };
  }

  // 3. Медицина
  if (
    name.includes('hospital') || 
    name.includes('clinic') || 
    name.includes('doctor') || 
    name.includes('medical') || 
    name.includes('health') || 
    name.includes('hastane')
  ) {
    return { group: 'infrastructure', type: 'hospital' };
  }

  // 4. Образование
  if (
    name.includes('university') || 
    name.includes('college') || 
    name.includes('kampüs') ||
    name.includes('üniversite')
  ) {
    return { group: 'infrastructure', type: 'university' };
  }

  if (
    name.includes('school') || 
    name.includes('high school') || 
    name.includes('okul') ||
    name.includes('lise')
  ) {
    return { group: 'infrastructure', type: 'school' };
  }

  // 5. Покупки, аптеки, банки
  if (
    name.includes('market') || 
    name.includes('grocery') || 
    name.includes('supermarket') || 
    name.includes('mall') || 
    name.includes('pharmacy') || 
    name.includes('bank') ||
    name.includes('store') ||
    name.includes('shop')
  ) {
    return { group: 'infrastructure', type: 'infrastructure' };
  }

  // 6. Офисы
  if (name.includes('office') || name.includes('corporate') || name.includes('business')) {
    return { group: 'business', type: 'infrastructure' };
  }

  return { group: 'infrastructure', type: 'infrastructure' };
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
 * 2. Сбор инфраструктуры через новый эндпоинт Foursquare (с обязательным заголовоком версии)
 */
async function fetchFoursquarePOIs(lat, lng) {
  console.log(`[Foursquare] Ищем места вокруг точки: ${lat}, ${lng}`);

  const rawFoursquareKey = FOURSQUARE_API_KEY ? FOURSQUARE_API_KEY.trim().replace(/["']/g, '') : '';

  if (!rawFoursquareKey) {
    console.error('[Foursquare Error] Критическая ошибка: Переменная FOURSQUARE_API_KEY пустая в Vercel!');
    return [];
  }

  // Настройка авторизации: Service API Key типа 'TSX...' строго требует Bearer-формат
  const authHeaderValue = rawFoursquareKey.startsWith('fsq3_') 
    ? rawFoursquareKey 
    : `Bearer ${rawFoursquareKey}`;

  const categories = '13000,17000,19000,12000,16000'; 
  const url = `https://places-api.foursquare.com/places/search?ll=${lat},${lng}&radius=1500&categories=${categories}&limit=30`;

  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': authHeaderValue,
        'X-Places-Api-Version': '2025-06-17', // СТРОГО ОБЯЗАТЕЛЬНЫЙ ЗАГОЛОВОК ДЛЯ ВЕРСИИ API!
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

    // Записываем координаты в таблицу
    await supabase.from('properties').update({
      latitude: coordinates.lat,
      longitude: coordinates.lng
    }).eq('id', propertyId);

    const rawPois = await fetchFoursquarePOIs(coordinates.lat, coordinates.lng);

    const cityKey = (property.city || 'istanbul').toLowerCase().trim();
    const config = cityPoiPriorities[cityKey] || cityPoiPriorities['default'];

    const bestPoisByType = {};

    for (const item of rawPois) {
      const { group, type } = categorizePoi(item.categories);
      const distance = item.distance || 9999;

      if (!bestPoisByType[type] || distance < bestPoisByType[type].distance) {
        bestPoisByType[type] = { item, group, distance };
      }
    }

    const finalPoisMap = {};

    for (const [type, data] of Object.entries(bestPoisByType)) {
      const walkMinutes = Math.max(1, Math.round(data.distance / 80));
      
      let rawScore = 0;
      if (data.distance <= 200) rawScore = 10;
      else if (data.distance <= 500) rawScore = 8;
      else if (data.distance <= 1000) rawScore = 6;
      else if (data.distance <= 1500) rawScore = 4;
      else rawScore = 2;

      const priorityIndex = config.priorities.indexOf(data.group);
      let weight = 1.0;
      if (priorityIndex === 0) weight = 1.5;
      else if (priorityIndex === 1) weight = 1.2;
      else if (priorityIndex === 2) weight = 1.0;
      else if (priorityIndex === 3) weight = 0.8;

      const weightedScore = parseFloat((rawScore * weight).toFixed(2));

      finalPoisMap[type] = {
        name: data.item.name,
        distance: data.distance,
        travel_time_minutes: `${walkMinutes} мин`,
        travel_mode: 'walking',
        raw_score: rawScore,
        weighted_score: weightedScore
      };
    }

    const foundTypesCount = Object.keys(finalPoisMap).length;
    let score = Math.min(10, Math.floor(foundTypesCount * 1.5));
    if (score === 0 && foundTypesCount > 0) score = 1;

    const finalPoiData = {
      pois: finalPoisMap,
      calculated_at: new Date().toISOString(),
      livability_score: score,
      debug_info: {
        geocoder_status: "SUCCESS",
        foursquare_status: rawPois.length > 0 ? "SUCCESS" : "EMPTY_OR_FAILED",
        total_found: foundTypesCount
      }
    };

    console.log(`[DB Update] Записываем структурированный JSON poi_data в базу для ID: ${propertyId}`);
    const { error: updateError } = await supabase
      .from('properties')
      .update({ 
        poi_data: finalPoiData
      })
      .eq('id', propertyId);

    if (updateError) {
      console.error(`[DB Error] Не удалось сохранить poi_data для ID ${propertyId}:`, updateError.message);
      return false;
    }

    console.log(`--- [POI Service End] Объект ID ${propertyId} успешно обработан! ---\n`);
    return true;

  } catch (globalErr) {
    console.error(`[POI Service Fatal Error] Крах всей функции для ID ${propertyId}:`, globalErr.message || globalErr);
    return false;
  }
}
