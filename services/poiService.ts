import { createClient } from '@supabase/supabase-js';

const YANDEX_API_KEY = process.env.YANDEX_MAPS_API_KEY;

// Инициализируем административный клиент для обхода RLS с помощью сохраненного ключа роли службы
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

// 1. Функция-обертка с подменой Referer для прохождения проверки авторизации Яндекса
async function safeFetchJson(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, {
      headers: {
        // Подменяем Referer на домен, указанный в ограничениях вашего API-ключа Яндекса
        'Referer': 'https://increase-fine-snappea.tilda.ws/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    
    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[Yandex API Error] HTTP ${res.status}: ${errText}`);
      return null;
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      console.warn(`[Yandex API Non-JSON] Ожидался JSON, но получен Content-Type: "${contentType}". Текст ответа: ${text}`);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error(`[Yandex API Fetch Exception] Не удалось выполнить запрос:`, err);
    return null;
  }
}

// Преобразование текстового адреса в координаты [lat, lng]
async function getCoordinatesFromAddress(addressText: string): Promise<{ lat: number; lng: number } | null> {
  if (!YANDEX_API_KEY) {
    console.error('YANDEX_MAPS_API_KEY отсутствует для геокодирования');
    return null;
  }

  // ПОПЫТКА 1: Через стандартный HTTP Геокодер
  const geocoderUrl = `https://geocode-maps.yandex.ru/1.x/?apikey=${YANDEX_API_KEY}&geocode=${encodeURIComponent(addressText)}&format=json&results=1`;
  const data = await safeFetchJson(geocoderUrl);

  if (data) {
    const foundPlaces = data?.response?.GeoObjectCollection?.featureMember;
    if (foundPlaces && foundPlaces.length > 0) {
      const pos = foundPlaces[0].GeoObject.Point.pos; 
      const [lngStr, latStr] = pos.split(' ');
      const lng = parseFloat(lngStr);
      const lat = parseFloat(latStr);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }
  }

  // ПОПЫТКА 2 (РЕЗЕРВНАЯ): Через API Поиска по организациям
  console.log('Запуск резервного геокодирования через Поиск по организациям...');
  const searchUrl = `https://search-maps.yandex.ru/v1/?apikey=${YANDEX_API_KEY}&text=${encodeURIComponent(addressText)}&lang=tr_TR&results=1`;
  const searchData = await safeFetchJson(searchUrl);

  if (searchData && searchData.features && searchData.features.length > 0) {
    const feature = searchData.features[0];
    const [lng, lat] = feature.geometry.coordinates;
    if (!isNaN(lat) && !isNaN(lng)) {
      console.log(`Резервное геокодирование успешно! Координаты: lat: ${lat}, lng: ${lng}`);
      return { lat, lng };
    }
  }

  return null;
}

// Поиск ближайшей организации
async function findNearestYandexPoi(lat: number, lng: number, searchText: string): Promise<any | null> {
  const url = `https://search-maps.yandex.ru/v1/?apikey=${YANDEX_API_KEY}&text=${encodeURIComponent(searchText)}&lang=tr_TR&ll=${lng},${lat}&spn=0.03,0.03&results=1`;
  const data = await safeFetchJson(url);
  if (data && data.features && data.features.length > 0) {
    return data.features[0];
  }
  return null;
}

// Расчет расстояния и времени через Яндекс Матрицу Расстояний
async function calculateYandexMatrix(
  originLat: number, 
  originLng: number, 
  destLat: number, 
  destLng: number, 
  mode: 'walking' | 'driving'
): Promise<{ distance: number; duration: number } | null> {
  const url = `https://api.routing.yandex.net/v2/distancematrix?origins=${originLat},${originLng}&destinations=${destLat},${destLng}&mode=${mode}&apikey=${YANDEX_API_KEY}`;
  const data = await safeFetchJson(url);
  
  if (data && data.rows && data.rows[0].elements && data.rows[0].elements[0].status === 'OK') {
    const element = data.rows[0].elements[0];
    return {
      distance: element.distance.value,
      duration: Math.ceil(element.duration.value / 60)
    };
  }
  return null;
}

// Расчет оценки на основе времени
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
  if (!YANDEX_API_KEY) {
    console.error('YANDEX_MAPS_API_KEY отсутствует в переменных окружения');
    return;
  }

  // Получаем адрес
  const { data: property, error: fetchError } = await supabaseAdmin
    .from('properties')
    .select('adress, city')
    .eq('id', propertyId)
    .single();

  if (fetchError || !property) {
    console.error(`Не удалось получить объект ${propertyId} из БД:`, fetchError);
    return;
  }

  const rawAddress = property.adress;
  if (!rawAddress) {
    console.warn(`У объекта ${propertyId} отсутствует текстовый адрес`);
    return;
  }

  const cityPrefix = property.city ? `${property.city}, ` : '';
  const fullAddress = `${cityPrefix}${rawAddress}`;

  // Получаем координаты (стандартным или резервным методом)
  const coordinates = await getCoordinatesFromAddress(fullAddress);
  if (!coordinates) {
    console.error(`Ни один из методов геокодирования не смог определить координаты для адреса "${fullAddress}"`);
    return;
  }

  const { lat, lng } = coordinates;

  const finalPoiData: Record<string, PoiDetail> = {};
  let totalWeightedScoreSum = 0;
  let totalWeightsSum = 0;

  let bestCategoryKey: string | null = null;
  let highestWeightedScore = -1;

  for (const [categoryKey, config] of Object.entries(INFRASTRUCTURE_CONFIG)) {
    try {
      const nearestPlace = await findNearestYandexPoi(lat, lng, config.searchQuery);
      if (!nearestPlace) continue;

      const destLng = nearestPlace.geometry.coordinates[0];
      const destLat = nearestPlace.geometry.coordinates[1];
      const placeName = cleanPoiName(nearestPlace.properties.CompanyMetaData.name);

      let travelMode: 'walking' | 'driving' = 'walking';
      let matrix = await calculateYandexMatrix(lat, lng, destLat, destLng, 'walking');

      if (!matrix || matrix.duration > 20) {
        const drivingMatrix = await calculateYandexMatrix(lat, lng, destLat, destLng, 'driving');
        if (drivingMatrix) {
          travelMode = 'driving';
          matrix = drivingMatrix;
        }
      }

      if (matrix) {
        const rawScore = calculatePoiScore(matrix.duration, travelMode, config);
        const weightedScore = parseFloat((rawScore * config.weight).toFixed(2));

        finalPoiData[categoryKey] = {
          name: placeName,
          distance_meters: matrix.distance,
          travel_time_minutes: matrix.duration,
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
      }
    } catch (catErr) {
      console.error(`[Resilience] Ошибка при обработке категории "${categoryKey}":`, catErr);
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
    console.error(`Ошибка сохранения результатов для объекта ${propertyId}:`, error);
  } else {
    console.log(`Объект ${propertyId} успешно проанализирован. Индекс привлекательности: ${livabilityScore}/100. Главное преимущество: "${chosenProximityType}".`);
  }
}
