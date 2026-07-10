import { createClient } from '@supabase/supabase-js';

const YANDEX_API_KEY = process.env.YANDEX_MAPS_API_KEY;

// Инициализация административного клиента для беспрепятственного обхода RLS
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// Спецификация для конфигурации категорий
export interface CategoryConfig {
  searchQuery: string;        // Поисковый запрос на турецком для Яндекса
  weight: number;             // Вес/Важность категории (от 1.0 до 3.0)
  maxWalkingMinutes: number;  // Максимальный порог для пешего пути
  maxDrivingMinutes: number;  // Максимальный порог для автомобильного пути
  displayBadge: string;       // Значение, которое запишется в proximity_type
}

// 1. Модульная конфигурация весов инфраструктуры (Профессиональный справочник)
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
  raw_score: number;       // Оценка удаленности (0-100)
  weighted_score: number;  // Итоговая оценка с учетом веса категории
}

// Поиск координат адреса
async function getCoordinatesFromAddress(addressText: string): Promise<{ lat: number; lng: number } | null> {
  if (!YANDEX_API_KEY) return null;
  const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${YANDEX_API_KEY}&geocode=${encodeURIComponent(addressText)}&format=json&results=1`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const foundPlaces = data?.response?.GeoObjectCollection?.featureMember;

    if (foundPlaces && foundPlaces.length > 0) {
      const pos = foundPlaces[0].GeoObject.Point.pos; 
      const [lngStr, latStr] = pos.split(' ');
      const lng = parseFloat(lngStr);
      const lat = parseFloat(latStr);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }
  } catch (err) {
    console.warn(`[Geocoder fallback] Стандартный геокодер недоступен, пробуем Поиск по организациям...`);
  }

  // Резервный поиск координат через Поиск по организациям
  try {
    const searchUrl = `https://search-maps.yandex.ru/v1/?apikey=${YANDEX_API_KEY}&text=${encodeURIComponent(addressText)}&lang=tr_TR&results=1`;
    const res = await fetch(searchUrl);
    const data = await res.json();
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].geometry.coordinates;
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }
  } catch (err) {
    console.error('Ошибка резервного геокодирования:', err);
  }
  return null;
}

// Поиск ближайшей организации
async function findNearestYandexPoi(lat: number, lng: number, searchText: string): Promise<any | null> {
  const url = `https://search-maps.yandex.ru/v1/?apikey=${YANDEX_API_KEY}&text=${encodeURIComponent(searchText)}&lang=tr_TR&ll=${lng},${lat}&spn=0.03,0.03&results=1`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.features && data.features.length > 0) return data.features[0];
  } catch (err) {
    console.error(`Ошибка геопоиска по запросу "${searchText}":`, err);
  }
  return null;
}

// Расчет расстояния и времени через матрицу расстояний Яндекса
async function calculateYandexMatrix(
  originLat: number, 
  originLng: number, 
  destLat: number, 
  destLng: number, 
  mode: 'walking' | 'driving'
): Promise<{ distance: number; duration: number } | null> {
  const url = `https://api.routing.yandex.net/v2/distancematrix?origins=${originLat},${originLng}&destinations=${destLat},${destLng}&mode=${mode}&apikey=${YANDEX_API_KEY}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.rows && data.rows[0].elements && data.rows[0].elements[0].status === 'OK') {
      const element = data.rows[0].elements[0];
      return {
        distance: element.distance.value,
        duration: Math.ceil(element.duration.value / 60)
      };
    }
  } catch (err) {
    console.error(`Ошибка матрицы расстояний (${mode}):`, err);
  }
  return null;
}

// 2. Расчет базовой оценки (raw_score) на основе времени в пути
function calculatePoiScore(durationMinutes: number, mode: 'walking' | 'driving', config: CategoryConfig): number {
  if (mode === 'walking') {
    if (durationMinutes <= 5) return 100;
    if (durationMinutes <= 10) return 75;
    if (durationMinutes <= 15) return 50;
    if (durationMinutes <= config.maxWalkingMinutes) return 25;
    return 0;
  } else {
    // Автомобильная доступность ценится ниже пешей
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

// 3. Основная бэкенд-функция глубокого анализа
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

  // Получаем координаты
  const coordinates = await getCoordinatesFromAddress(fullAddress);
  if (!coordinates) {
    console.error(`Не удалось определить координаты для адреса "${fullAddress}"`);
    return;
  }

  const { lat, lng } = coordinates;

  const finalPoiData: Record<string, PoiDetail> = {};
  let totalWeightedScoreSum = 0;
  let totalWeightsSum = 0;

  let bestCategoryKey: string | null = null;
  let highestWeightedScore = -1;

  // Безопасный перебор всех 12 категорий (ошибки в одной категории не прервут цикл)
  for (const [categoryKey, config] of Object.entries(INFRASTRUCTURE_CONFIG)) {
    try {
      const nearestPlace = await findNearestYandexPoi(lat, lng, config.searchQuery);
      if (!nearestPlace) continue;

      const destLng = nearestPlace.geometry.coordinates[0];
      const destLat = nearestPlace.geometry.coordinates[1];
      const placeName = cleanPoiName(nearestPlace.properties.CompanyMetaData.name);

      let travelMode: 'walking' | 'driving' = 'walking';
      let matrix = await calculateYandexMatrix(lat, lng, destLat, destLng, 'walking');

      // Если пешком идти слишком далеко (больше лимита), пересчитываем на авто
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

        // Накопление скоринга
        totalWeightedScoreSum += weightedScore;
        totalWeightsSum += config.weight;

        // Выбор абсолютного «Главного преимущества»
        if (weightedScore > highestWeightedScore && rawScore > 0) {
          highestWeightedScore = weightedScore;
          bestCategoryKey = categoryKey;
        }
      }
    } catch (catErr) {
      console.error(`[Resilience] Ошибка при обработке категории "${categoryKey}":`, catErr);
    }
  }

  // Расчет математического взвешенного Livability Score (от 0 до 100)
  const livabilityScore = totalWeightsSum > 0 
    ? Math.min(Math.round((totalWeightedScoreSum / (totalWeightsSum * 100)) * 100), 100)
    : 0;

  // Определение значения для proximity_type на основе победителя
  const chosenProximityType = bestCategoryKey 
    ? INFRASTRUCTURE_CONFIG[bestCategoryKey].displayBadge 
    : null;

  // Структурированный JSON на сохранение
  const resultPayload = {
    pois: finalPoiData,
    livability_score: livabilityScore,
    calculated_at: new Date().toISOString()
  };

  // Сохранение результатов в Supabase
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
