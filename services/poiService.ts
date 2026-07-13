import { createClient } from '@supabase/supabase-js';
import { cityPoiPriorities } from '../config/poi-priorities';

// Инициализируем Supabase внутри сервиса (используем service_role ключ для обхода любых RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const YANDEX_GEOCODER_KEY = process.env.YANDEX_GEOCODER_KEY;
const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY;

export interface POIData {
  pois: Record<string, {
    name: string;
    distance: number;
    travel_time_minutes: string;
    travel_mode: 'walking' | 'driving';
    raw_score: number;
    weighted_score: number;
  }>;
  calculated_at: string;
  livability_score: number;
  debug_info: {
    geocoder_status: string;
    foursquare_status: string;
    total_found: number;
    error_message?: string;
  };
}

interface CategorizedPoi {
  group: 'transport' | 'leisure' | 'infrastructure' | 'business';
  type: 'metro' | 'beach' | 'hospital' | 'school' | 'university' | 'infrastructure';
}

/**
 * Категоризация объектов Foursquare под требования приоритетов и рендеринга на клиенте
 */
function categorizePoi(categories: any[]): CategorizedPoi {
  const name = (categories?.[0]?.name || '').toLowerCase();
  const id = categories?.[0]?.id;

  // 1. Транспорт (metro, metrobus, train, etc.)
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

  // 2. Пляжи и досуг
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

  // 3. Больницы
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

  // 5. Общественная инфраструктура (магазины, аптеки, ТЦ)
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

  // 6. Офисы и бизнес
  if (name.includes('office') || name.includes('corporate') || name.includes('business')) {
    return { group: 'business', type: 'infrastructure' };
  }

  return { group: 'infrastructure', type: 'infrastructure' };
}

/**
 * 1. БЕЗОПАСНЫЙ ГЕОКОДЕР ЯНДЕКСА (БЕЗ ДВОЙНЫХ СЛЭШЕЙ)
 */
async function getCoordinatesFromAddress(addressText: string): Promise<{ lat: number; lng: number } | null> {
  console.log(`[Geocoder] Запрос координат для адреса: "${addressText}"`);

  const rawKey = YANDEX_GEOCODER_KEY ? YANDEX_GEOCODER_KEY.trim().replace(/["']/g, '') : '';

  if (!rawKey) {
    console.error('[Geocoder Error] Критическая ошибка: Переменная YANDEX_GEOCODER_KEY пустая в Vercel!');
    return null;
  }

  try {
    const cleanKey = encodeURIComponent(rawKey);
    const cleanGeocode = encodeURIComponent(addressText.trim());
    
    // Прямая сборка строки URL гарантирует отсутствие двойных слэшей
    const url = `https://geocode-maps.yandex.com/1.x/?apikey=${cleanKey}&geocode=${cleanGeocode}&format=json&results=1`;

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
  } catch (err: any) {
    console.error('[Geocoder Exception] Сетевая ошибка при запросе к Яндексу:', err.message || err);
    return null;
  }
}

/**
 * 2. СБОР ИНФРАСТРУКТУРЫ ЧЕРЕЗ FOURSQUARE API
 */
async function fetchFoursquarePOIs(lat: number, lng: number): Promise<any[]> {
  console.log(`[Foursquare] Ищем места вокруг точки: ${lat}, ${lng}`);

  const rawFoursquareKey = FOURSQUARE_API_KEY ? FOURSQUARE_API_KEY.trim().replace(/["']/g, '') : '';

  if (!rawFoursquareKey) {
    console.error('[Foursquare Error] Критическая ошибка: Переменная FOURSQUARE_API_KEY пустая в Vercel!');
    return [];
  }

  const categories = '13000,17000,19000,12000,16000'; 
  const url = `https://api.foursquare.com/v3/places/search?ll=${lat},${lng}&radius=1500&categories=${categories}&limit=30`;

  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': rawFoursquareKey,
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
  } catch (err: any) {
    console.error('[Foursquare Exception] Ошибка сети при запросе к Foursquare:', err.message || err);
    return [];
  }
}

/**
 * 3. ГЛАВНАЯ ФУНКЦИЯ ОБНОВЛЕНИЯ ОБЪЕКТА В БАЗЕ
 */
export async function updatePropertyPOIs(propertyId: string | number): Promise<boolean> {
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
    
    // 1. Получаем координаты
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

    // 2. Записываем полученные координаты напрямую в таблицу
    await supabase.from('properties').update({
      latitude: coordinates.lat,
      longitude: coordinates.lng
    }).eq('id', propertyId);

    // 3. Запрашиваем сырые точки инфраструктуры у Foursquare
    const rawPois = await fetchFoursquarePOIs(coordinates.lat, coordinates.lng);

    // 4. Загружаем конфиг приоритетов для текущего города
    const cityKey = (property.city || 'istanbul').toLowerCase().trim();
    const config = cityPoiPriorities[cityKey] || cityPoiPriorities['default'];

    // 5. Группируем объекты по типам, оставляя только самый близкий объект для каждого типа
    const bestPoisByType: Record<string, { item: any; group: string; distance: number }> = {};

    for (const item of rawPois) {
      const { group, type } = categorizePoi(item.categories);
      const distance = item.distance || 9999;

      // Если для данного типа инфраструктуры объект еще не выбран или текущий ближе
      if (!bestPoisByType[type] || distance < bestPoisByType[type].distance) {
        bestPoisByType[type] = { item, group, distance };
      }
    }

    // 6. Формируем финальный объект POI со скорингом и весами
    const finalPoisMap: Record<string, any> = {};

    for (const [type, data] of Object.entries(bestPoisByType)) {
      // Рассчитываем время пешком (~80 метров в минуту)
      const walkMinutes = Math.max(1, Math.round(data.distance / 80));
      
      // Базовая оценка (raw_score) на основе расстояния
      let rawScore = 0;
      if (data.distance <= 200) rawScore = 10;
      else if (data.distance <= 500) rawScore = 8;
      else if (data.distance <= 1000) rawScore = 6;
      else if (data.distance <= 1500) rawScore = 4;
      else rawScore = 2;

      // Коэффициент веса в зависимости от приоритетов города
      const priorityIndex = config.priorities.indexOf(data.group as any);
      let weight = 1.0;
      if (priorityIndex === 0) weight = 1.5;      // Максимальный приоритет
      else if (priorityIndex === 1) weight = 1.2;
      else if (priorityIndex === 2) weight = 1.0;
      else if (priorityIndex === 3) weight = 0.8;      // Минимальный приоритет

      const weightedScore = parseFloat((rawScore * weight).toFixed(2));

      finalPoisMap[type] = {
        name: data.item.name,
        distance: data.distance,
        travel_time_minutes: `${walkMinutes} мин`, // Будет выведено во встроенный span на клиенте
        travel_mode: 'walking',
        raw_score: rawScore,
        weighted_score: weightedScore
      };
    }

    // Рассчитываем общий livability score на основе найденного разнообразия (от 1 до 10)
    const foundTypesCount = Object.keys(finalPoisMap).length;
    let score = Math.min(10, Math.floor(foundTypesCount * 1.5));
    if (score === 0 && foundTypesCount > 0) score = 1;

    const finalPoiData: POIData = {
      pois: finalPoisMap,
      calculated_at: new Date().toISOString(),
      livability_score: score,
      debug_info: {
        geocoder_status: "SUCCESS",
        foursquare_status: rawPois.length > 0 ? "SUCCESS" : "EMPTY_OR_FAILED",
        total_found: foundTypesCount
      }
    };

    // 7. Обновляем JSON-колонку в Supabase
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

  } catch (globalErr: any) {
    console.error(`[POI Service Fatal Error] Крах всей функции для ID ${propertyId}:`, globalErr.message || globalErr);
    return false;
  }
}
