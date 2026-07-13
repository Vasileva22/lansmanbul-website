import { createClient } from '@supabase/supabase-js';

// Получаем два разных ключа из настроек Vercel
const YANDEX_GEOCODER_KEY = process.env.YANDEX_MAPS_API_KEY;
const YANDEX_SEARCH_KEY = process.env.YANDEX_SEARCH_API_KEY;

// Инициализируем административный клиент для обхода RLS
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export interface CategoryConfig {
  searchQuery: string;
  weight: number;
  maxWalkingMinutes: number;
  maxDrivingMinutes: number;
  displayBadge: string;
}

export const INFRASTRUCTURE_CONFIG: Record<string, CategoryConfig> = {
  metro: { searchQuery: 'metro istasyonu', weight: 3.0, maxWalkingMinutes: 15, maxDrivingMinutes: 10, displayBadge: 'Metro' },
  metrobus: { searchQuery: 'metrobüs durağı', weight: 3.0, maxWalkingMinutes: 15, maxDrivingMinutes: 10, displayBadge: 'Metrobüs' },
  bus_tram_stop: { searchQuery: 'otobüs durağı', weight: 1.5, maxWalkingMinutes: 10, maxDrivingMinutes: 5, displayBadge: 'Toplu Taşıma' },
  ferry: { searchQuery: 'vapur iskelesi', weight: 2.5, maxWalkingMinutes: 15, maxDrivingMinutes: 15, displayBadge: 'Deniz Ulaşımı' },
  airport: { searchQuery: 'havalimanı', weight: 2.0, maxWalkingMinutes: 60, maxDrivingMinutes: 45, displayBadge: 'Havalimanı' },
  university: { searchQuery: 'üniversite', weight: 2.0, maxWalkingMinutes: 20, maxDrivingMinutes: 15, displayBadge: 'Üniversite' },
  school: { searchQuery: 'okul', weight: 2.0, maxWalkingMinutes: 15, maxDrivingMinutes: 10, displayBadge: 'Okul' },
  hospital: { searchQuery: 'hastane', weight: 2.5, maxWalkingMinutes: 15, maxDrivingMinutes: 10, displayBadge: 'Sağlık' },
  beach: { searchQuery: 'plaj', weight: 2.5, maxWalkingMinutes: 20, maxDrivingMinutes: 15, displayBadge: 'Deniz' },
  park: { searchQuery: 'park', weight: 1.5, maxWalkingMinutes: 15, maxDrivingMinutes: 10, displayBadge: 'Doğa' },
  mall: { searchQuery: 'Alışveriş Merkezi', weight: 1.8, maxWalkingMinutes: 20, maxDrivingMinutes: 15, displayBadge: 'Alışveriş' },
  supermarket: { searchQuery: 'süpermarket', weight: 1.2, maxWalkingMinutes: 10, maxDrivingMinutes: 5, displayBadge: 'Süpermarket' }
};

interface PoiDetail {
  name: string;
  distance_meters: number;
  travel_time_minutes: number;
  travel_mode: 'walking' | 'driving';
  raw_score: number;
  weighted_score: number;
}

// Скорректированная функция-обертка для HTTP-запросов к Яндексу
async function safeFetchJson(url: string): Promise<any | null> {
  const anonymizedUrl = url.replace(/apikey=[^&]+/, 'apikey=***');
  console.log(`[Yandex API Request] Отправка запроса к: ${anonymizedUrl}`);

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        // Передаем правильный домен проекта. Для бэкенд-запросов Поиска организаций это критично
        'Referer': 'https://lansmanbul.com'
      }
    });
    
    console.log(`[Yandex API Response] HTTP Status: ${res.status}`);

    // Получаем текст ответа заранее, чтобы использовать его в логах при ошибках
    const text = await res.text();

    if (!res.ok) {
      console.error(`[Yandex API Error] HTTP ${res.status} от Яндекса. Текст ошибки: ${text}`);
      return null;
    }

    const contentType = res.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      console.warn(`[Yandex API Non-JSON] Ожидался JSON, но получен Content-Type: "${contentType}". Ответ: ${text}`);
      return null;
    }

    return JSON.parse(text);
  } catch (err: any) {
    console.error(`[Yandex API Fetch Exception] Не удалось выполнить запрос к Яндексу:`, err.message || err);
    return null;
  }
}

// Перевод адреса в координаты [lat, lng] (Используем КЛЮЧ ГЕОКОДЕРА)
async function getCoordinatesFromAddress(addressText: string): Promise<{ lat: number; lng: number } | null> {
  if (!YANDEX_GEOCODER_KEY) {
    console.error('[Geocoder] Ошибка: YANDEX_MAPS_API_KEY отсутствует в переменных окружения');
    return null;
  }

  console.log(`[Geocoder] Запуск поиска координат для адреса: "${addressText}"`);

  const geocoderUrl = `https://geocode-maps.yandex.ru/1.x/?apikey=${YANDEX_GEOCODER_KEY}&geocode=${encodeURIComponent(addressText)}&format=json&results=1`;
  const data = await safeFetchJson(geocoderUrl);

  if (data) {
    const foundPlaces = data?.response?.GeoObjectCollection?.featureMember;
    if (foundPlaces && foundPlaces.length > 0) {
      const pos = foundPlaces[0].GeoObject.Point.pos; 
      const [lngStr, latStr] = pos.split(' ');
      const lng = parseFloat(lngStr);
      const lat = parseFloat(latStr);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
  }
  return null;
}

// Поиск ближайшей организации (Используем КЛЮЧ ПОИСКА ОРГАНИЗАЦИЙ)
async function findNearestYandexPoi(lat: number, lng: number, searchText: string): Promise<any | null> {
  if (!YANDEX_SEARCH_KEY) {
    console.error('[POI Search] Ошибка: YANDEX_SEARCH_API_KEY отсутствует в переменных окружения');
    return null;
  }
  const url = `https://search-maps.yandex.ru/v1/?apikey=${YANDEX_SEARCH_KEY}&text=${encodeURIComponent(searchText)}&lang=tr_TR&ll=${lng},${lat}&spn=0.03,0.03&results=1`;
  const data = await safeFetchJson(url);
  if (data && data.features && data.features.length > 0) {
    return data.features[0];
  }
  return null;
}

// Бесплатный математический расчет расстояния (Формула Хаверсинуса с учетом дорог)
function calculateMathDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 1.3);
}

// Расчет времени пути на основе расстояния
function estimateTravelTime(distanceMeters: number, mode: 'walking' | 'driving'): number {
  if (mode === 'walking') {
    return Math.ceil(distanceMeters / 80);
  } else {
    return Math.ceil(distanceMeters / 400);
  }
}

// Оценка влияния времени пути на скоринг
function calculatePoiScore(durationMinutes: number, mode: 'walking' | 'driving', config: CategoryConfig): number {
  if (mode === 'walking') {
    if (durationMinutes <= 5) return 100;
    if (durationMinutes <= 10) return 75;
    if (durationMinutes <= 15) return 50;
    if (durationMinutes <= config.maxWalkingMinutes) return 25;
    return 0;
  } else {
    if (durationMinutes <= 5) return 50;
    if (durationMinutes <= 10) return 35;
    if (durationMinutes <= 15) return 20;
    if (durationMinutes <= config.maxDrivingMinutes) return 10;
    return 0;
  }
}

// Очистка названий станций/объектов
function cleanPoiName(name: string): string {
  if (!name) return '';
  let cleaned = name;
  cleaned = cleaned.replace(/\b[m|M]\d{1,2}\b/g, '');
  cleaned = cleaned.replace(/\b(metro|istasyonu|istasyon|durağı|durak)\b/gi, '');
  cleaned = cleaned.replace(/[-–—/]/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return cleaned;
}

// Основная бэкенд-функция скоринг-анализа
export async function updatePropertyPOIs(propertyId: string): Promise<void> {
  console.log(`[POI Service] Запущен анализ инфраструктуры для объявления ID: ${propertyId}`);

  if (!YANDEX_GEOCODER_KEY || !YANDEX_SEARCH_KEY) {
    console.error('[POI Service] Ошибка: Не все API-ключи Яндекса (YANDEX_MAPS_API_KEY или YANDEX_SEARCH_API_KEY) заданы в переменных окружения.');
    return;
  }

  // Получаем адрес
  const { data: property, error: fetchError } = await supabaseAdmin
    .from('properties')
    .select('adress, city')
    .eq('id', propertyId)
    .single();

  if (fetchError || !property) {
    console.error(`[POI Service] Не удалось получить объявление ID: ${propertyId} из БД:`, fetchError);
    return;
  }

  const rawAddress = property.adress;
  if (!rawAddress) {
    console.warn(`[POI Service] Предупреждение: у объекта ${propertyId} пустой адрес. Расчет остановлен.`);
    return;
  }

  const cityPrefix = property.city ? `${property.city}, ` : '';
  const fullAddress = `${cityPrefix}${rawAddress}`;

  // Получаем координаты (Используем КЛЮЧ ГЕОКОДЕРА)
  const coordinates = await getCoordinatesFromAddress(fullAddress);
  if (!coordinates) {
    console.error(`[POI Service] Не удалось определить координаты для адреса "${fullAddress}". Анализ отменен.`);
    return;
  }

  const { lat, lng } = coordinates;
  console.log(`[POI Service] Успешно найдены координаты: lat: ${lat}, lng: ${lng}`);

  const finalPoiData: Record<string, PoiDetail> = {};
  let totalWeightedScoreSum = 0;
  let totalWeightsSum = 0;

  let bestCategoryKey: string | null = null;
  let highestWeightedScore = -1;

  for (const [categoryKey, config] of Object.entries(INFRASTRUCTURE_CONFIG)) {
    try {
      // Ищем объекты (Используем КЛЮЧ ПОИСКА ОРГАНИЗАЦИЙ)
      const nearestPlace = await findNearestYandexPoi(lat, lng, config.searchQuery);
      if (!nearestPlace) continue;

      const destLng = nearestPlace.geometry.coordinates[0];
      const destLat = nearestPlace.geometry.coordinates[1];
      const placeName = cleanPoiName(nearestPlace.properties.CompanyMetaData.name);

      // Рассчитываем расстояние математически
      const distance = calculateMathDistance(lat, lng, destLat, destLng);
      
      let travelMode: 'walking' | 'driving' = 'walking';
      let duration = estimateTravelTime(distance, 'walking');

      // Если пешком идти слишком далеко (дольше 20 минут), переключаемся на авто
      if (duration > 20) {
        duration = estimateTravelTime(distance, 'driving');
        travelMode = 'driving';
      }

      const rawScore = calculatePoiScore(duration, travelMode, config);
      const weightedScore = parseFloat((rawScore * config.weight).toFixed(2));

      finalPoiData[categoryKey] = {
        name: placeName,
        distance_meters: distance,
        travel_time_minutes: duration,
        travel_mode: travelMode,
        raw_score: rawScore,
        weighted_score: weightedScore
      };

      totalWeightedScoreSum += weightedScore;
      totalWeightsSum += config.weight;

      if (weightedScore > highestWeightedScore && rawScore > 0) {
        highestWeightedScore = weightedScore;
        bestCategoryKey = categoryKey;
      }
    } catch (catErr) {
      console.error(`[POI Service] Ошибка при обработке категории "${categoryKey}":`, catErr);
    }
  }

  const livabilityScore = totalWeightsSum > 0 
    ? Math.min(Math.round((totalWeightedScoreSum / (totalWeightsSum * 100)) * 100), 100)
    : 0;

  const chosenProximityType = bestCategoryKey 
    ? INFRASTRUCTURE_CONFIG[bestCategoryKey].displayBadge 
    : null;

  const resultPayload = {
    pois: finalPoiData,
    livability_score: livabilityScore,
    calculated_at: new Date().toISOString()
  };

  const { error } = await supabaseAdmin
    .from('properties')
    .update({ 
      poi_data: resultPayload,
      latitude: lat,
      longitude: lng,
      proximity_type: chosenProximityType
    })
    .eq('id', propertyId);

  if (error) {
    console.error(`[POI Service] Ошибка сохранения результатов в БД для объекта ${propertyId}:`, error);
  } else {
    console.log(`[POI Service] Объект ${propertyId} успешно проанализирован. Индекс: ${livabilityScore}/100. Преимущество: "${chosenProximityType}".`);
  }
}
