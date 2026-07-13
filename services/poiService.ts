import { createClient } from '@supabase/supabase-js';

// Код берет именно те имена переменных, которые у тебя в Vercel!
const YANDEX_GEOCODER_KEY = process.env.YANDEX_GEOCODER_KEY;
const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY;

const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export interface CategoryConfig {
  categoryId: string; // Используем официальные ID категорий Foursquare вместо текста
  weight: number;
  maxWalkingMinutes: number;
  maxDrivingMinutes: number;
  displayBadge: string;
}

// Заменяем текстовые запросы на международные коды Foursquare ID
export const INFRASTRUCTURE_CONFIG: Record<string, CategoryConfig> = {
  metro: { categoryId: '19046', weight: 3.0, maxWalkingMinutes: 15, maxDrivingMinutes: 10, displayBadge: 'Metro' },
  metrobus: { categoryId: '19032,19043', weight: 3.0, maxWalkingMinutes: 15, maxDrivingMinutes: 10, displayBadge: 'Metrobüs' },
  bus_tram_stop: { categoryId: '19047,19043', weight: 1.5, maxWalkingMinutes: 10, maxDrivingMinutes: 5, displayBadge: 'Toplu Taşıma' },
  ferry: { categoryId: '19044', weight: 2.5, maxWalkingMinutes: 15, maxDrivingMinutes: 15, displayBadge: 'Deniz Ulaşımı' },
  airport: { categoryId: '19010', weight: 2.0, maxWalkingMinutes: 60, maxDrivingMinutes: 45, displayBadge: 'Havalimanı' },
  university: { categoryId: '12013', weight: 2.0, maxWalkingMinutes: 20, maxDrivingMinutes: 15, displayBadge: 'Üniversite' },
  school: { categoryId: '12009', weight: 2.0, maxWalkingMinutes: 15, maxDrivingMinutes: 10, displayBadge: 'Okul' },
  hospital: { categoryId: '15014', weight: 2.5, maxWalkingMinutes: 15, maxDrivingMinutes: 10, displayBadge: 'Sağlık' },
  beach: { categoryId: '16003', weight: 2.5, maxWalkingMinutes: 20, maxDrivingMinutes: 15, displayBadge: 'Deniz' },
  park: { categoryId: '16032', weight: 1.5, maxWalkingMinutes: 15, maxDrivingMinutes: 10, displayBadge: 'Doğa' },
  mall: { categoryId: '17114', weight: 1.8, maxWalkingMinutes: 20, maxDrivingMinutes: 15, displayBadge: 'Alışveriş' },
  supermarket: { categoryId: '17069', weight: 1.2, maxWalkingMinutes: 10, maxDrivingMinutes: 5, displayBadge: 'Süpermarket' }
};

interface PoiDetail {
  name: string;
  distance_meters: number;
  travel_time_minutes: number;
  travel_mode: 'walking' | 'driving';
  raw_score: number;
  weighted_score: number;
}

async function safeFetchJson(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://lansmanbul.com'
      }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

// Шаг 1: Определение координат через Яндекс
async function getCoordinatesFromAddress(addressText: string): Promise<{ lat: number; lng: number } | null> {
  if (!YANDEX_GEOCODER_KEY) {
    console.error('[Geocoder] Ключ YANDEX_GEOCODER_KEY не найден в переменных Vercel!');
    return null;
  }

  const url = `https://geocode-maps.yandex.com/1.x/?apikey=${YANDEX_GEOCODER_KEY}&geocode=${encodeURIComponent(addressText)}&format=json&results=1`;
  const data = await safeFetchJson(url);

  if (data) {
    const foundPlaces = data?.response?.GeoObjectCollection?.featureMember;
    if (foundPlaces && foundPlaces.length > 0) {
      const pos = foundPlaces[0].GeoObject.Point.pos; 
      const [lngStr, latStr] = pos.split(' ');
      return { lat: parseFloat(latStr), lng: parseFloat(lngStr) };
    }
  }
  return null;
}

// Шаг 2: Поиск объектов через Foursquare по ID категории
async function findNearestFoursquarePoi(lat: number, lng: number, categoryId: string): Promise<any | null> {
  if (!FOURSQUARE_API_KEY) {
    console.error('[Foursquare] Ошибка: Переменная FOURSQUARE_API_KEY пустая в Vercel!');
    return null;
  }

  // Запрос по категориям (categories) вместо текстового query
  const url = `https://api.foursquare.com/v3/places/search?ll=${lat},${lng}&categories=${categoryId}&radius=20000&limit=1`;
  
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
      const errText = await res.text();
      console.error(`[Foursquare API Error] Код ${res.status}: ${errText}`);
      return null;
    }

    const data = await res.json();
    if (data && data.results && data.results.length > 0) {
      return data.results[0];
    }
    return null;
  } catch (err) {
    console.error(`[Foursquare Exception] Ошибка сети для категории ${categoryId}:`, err);
    return null;
  }
}

function calculateMathDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return Math.round(R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))) * 1.3);
}

function estimateTravelTime(distanceMeters: number, mode: 'walking' | 'driving'): number {
  return mode === 'walking' ? Math.ceil(distanceMeters / 80) : Math.ceil(distanceMeters / 400);
}

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

function cleanPoiName(name: string): string {
  if (!name) return '';
  let cleaned = name.replace(/\b[m|M]\d{1,2}\b/g, '').replace(/\b(metro|istasyonu|istasyon|durağı|durak)\b/gi, '').replace(/[-–—/]/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned.length > 0 ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : name;
}

export async function updatePropertyPOIs(propertyId: string): Promise<void> {
  console.log(`[POI Service] Анализ для ID: ${propertyId}`);

  const { data: property, error: fetchError } = await supabaseAdmin
    .from('properties')
    .select('adress, city')
    .eq('id', propertyId)
    .single();

  if (fetchError || !property || !property.adress) {
    console.error(`[POI Service] Объект ${propertyId} не найден или пустой адрес.`);
    return;
  }

  const fullAddress = property.city ? `${property.city}, ${property.adress}` : property.adress;
  
  const coordinates = await getCoordinatesFromAddress(fullAddress);
  if (!coordinates) {
    console.error(`[POI Service] Геокодер не вернул координаты для: "${fullAddress}"`);
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
      const nearestPlace = await findNearestFoursquarePoi(lat, lng, config.categoryId);
      if (!nearestPlace || !nearestPlace.geocodes?.main) {
        console.warn(`[POI Service] Ничего не найдено для категории: ${categoryKey}`);
        continue;
      }

      const destLng = nearestPlace.geocodes.main.longitude;
      const destLat = nearestPlace.geocodes.main.latitude;
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
        name: cleanPoiName(nearestPlace.name),
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
      console.error(`[POI Service] Ошибка в категории ${categoryKey}:`, catErr);
    }
  }

  const livabilityScore = totalWeightsSum > 0 
    ? Math.min(Math.round((totalWeightedScoreSum / (totalWeightsSum * 100)) * 100), 100)
    : 0;

  const resultPayload = {
    pois: finalPoiData,
    livability_score: livabilityScore,
    calculated_at: new Date().toISOString()
  };

  await supabaseAdmin
    .from('properties')
    .update({ 
      poi_data: resultPayload,
      latitude: lat,
      longitude: lng,
      proximity_type: bestCategoryKey ? INFRASTRUCTURE_CONFIG[bestCategoryKey].displayBadge : null
    })
    .eq('id', propertyId);

  console.log(`[POI Service] Успешно завершено! Скоринг: ${livabilityScore}`);
}
