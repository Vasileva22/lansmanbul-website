import { createClient } from '@supabase/supabase-js';

// Нам нужен только один этот ключ в Vercel!
const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY;

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

// Шаг 1. Находим координаты объекта по его адресу ЧЕРЕЗ FOURSQUARE
async function getCoordinatesFromAddress(addressText: string): Promise<{ lat: number; lng: number } | null> {
  if (!FOURSQUARE_API_KEY) {
    console.error('[Geocoder] Ошибка: FOURSQUARE_API_KEY отсутствует в переменных окружения');
    return null;
  }

  console.log(`[Foursquare Geocoder] Ищем координаты для адреса: "${addressText}"`);

  const url = `https://api.foursquare.com/v3/places/search?query=${encodeURIComponent(addressText)}&limit=1`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': FOURSQUARE_API_KEY
      }
    });

    if (!res.ok) {
      console.error(`[Foursquare Geocoder Error] Status: ${res.status}`);
      return null;
    }

    const data = await res.json();
    if (data && data.results && data.results.length > 0) {
      const mainPlace = data.results[0];
      if (mainPlace.geocodes?.main) {
        return {
          lat: mainPlace.geocodes.main.latitude,
          lng: mainPlace.geocodes.main.longitude
        };
      }
    }
    console.warn(`[Foursquare Geocoder] Не удалось найти координаты для: "${addressText}"`);
    return null;
  } catch (err) {
    console.error('[Foursquare Geocoder Exception]:', err);
    return null;
  }
}

// Шаг 2. Поиск инфраструктуры вокруг координат ЧЕРЕЗ FOURSQUARE
async function findNearestFoursquarePoi(lat: number, lng: number, searchText: string): Promise<any | null> {
  if (!FOURSQUARE_API_KEY) {
    console.error('[POI Search] Ошибка: FOURSQUARE_API_KEY отсутствует в переменных окружения');
    return null;
  }

  const url = `https://api.foursquare.com/v3/places/search?ll=${lat},${lng}&query=${encodeURIComponent(searchText)}&radius=20000&limit=1`;
  
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': FOURSQUARE_API_KEY
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (data && data.results && data.results.length > 0) {
      return data.results[0];
    }
    return null;
  } catch (err) {
    console.error(`[Foursquare API Exception] Ошибка поиска для "${searchText}":`, err);
    return null;
  }
}

// Математический расчет расстояния (Формула Хаверсинуса)
function calculateMathDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 1.3); // коэффицент поправки на дороги
}

// Расчет времени пути
function estimateTravelTime(distanceMeters: number, mode: 'walking' | 'driving'): number {
  if (mode === 'walking') {
    return Math.ceil(distanceMeters / 80); // 80 метров в минуту пешком
  } else {
    return Math.ceil(distanceMeters / 400); // 400 метров в минуту на авто
  }
}

// Скоринг баллов
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

// Красивая очистка имен
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

// Главная функция, запускающая весь анализ инфраструктуры
export async function updatePropertyPOIs(propertyId: string): Promise<void> {
  console.log(`[POI Service] Запущен анализ инфраструктуры (Чистый Foursquare) для ID: ${propertyId}`);

  if (!FOURSQUARE_API_KEY) {
    console.error('[POI Service] Ошибка: FOURSQUARE_API_KEY отсутствует в Vercel.');
    return;
  }

  // Получаем адрес из базы данных
  const { data: property, error: fetchError } = await supabaseAdmin
    .from('properties')
    .select('adress, city')
    .eq('id', propertyId)
    .single();

  if (fetchError || !property) {
    console.error(`[POI Service] Не удалось получить объект ID: ${propertyId}`, fetchError);
    return;
  }

  const rawAddress = property.adress;
  if (!rawAddress) {
    console.warn(`[POI Service] У объекта ${propertyId} пустой адрес. Расчет остановлен.`);
    return;
  }

  const cityPrefix = property.city ? `${property.city}, ` : '';
  const fullAddress = `${cityPrefix}${rawAddress}`;

  // Ищем координаты только через Foursquare!
  const coordinates = await getCoordinatesFromAddress(fullAddress);
  if (!coordinates) {
    console.error(`[POI Service] Foursquare не смог определить координаты для "${fullAddress}". Анализ отменен.`);
    return;
  }

  const { lat, lng } = coordinates;
  console.log(`[POI Service] Координаты успешно определены Foursquare: lat: ${lat}, lng: ${lng}`);

  const finalPoiData: Record<string, PoiDetail> = {};
  let totalWeightedScoreSum = 0;
  let totalWeightsSum = 0;
  let bestCategoryKey: string | null = null;
  let highestWeightedScore = -1;

  for (const [categoryKey, config] of Object.entries(INFRASTRUCTURE_CONFIG)) {
    try {
      const nearestPlace = await findNearestFoursquarePoi(lat, lng, config.searchQuery);
      if (!nearestPlace || !nearestPlace.geocodes?.main) continue;

      const destLng = nearestPlace.geocodes.main.longitude;
      const destLat = nearestPlace.geocodes.main.latitude;
      const placeName = cleanPoiName(nearestPlace.name);

      const distance = calculateMathDistance(lat, lng, destLat, destLng);
      
      let travelMode: 'walking' | 'driving' = 'walking';
      let duration = estimateTravelTime(distance, 'walking');

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
      console.error(`[POI Service] Ошибка категории "${categoryKey}":`, catErr);
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

  // Записываем чистые данные обратно в Supabase
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
    console.error(`[POI Service] Ошибка сохранения в БД для объекта ${propertyId}:`, error);
  } else {
    console.log(`[POI Service] Объект ${propertyId} успешно проанализирован. Индекс: ${livabilityScore}/100.`);
  }
}
