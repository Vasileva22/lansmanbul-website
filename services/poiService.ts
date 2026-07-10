import { createClient } from '@supabase/supabase-js';

const YANDEX_API_KEY = process.env.YANDEX_MAPS_API_KEY;

// Инициализируем административный клиент для обхода RLS (Row Level Security) на бэкенде Vercel.
// Если в переменных окружения прописан SUPABASE_SERVICE_ROLE_KEY, клиент получит права суперадмина.
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

interface PoiResult {
  name: string;
  distance_meters: number;
  travel_time_minutes: number;
  travel_mode: 'walking' | 'driving';
}

// 1. Преобразование текстового адреса в координаты [lat, lng] через Яндекс Геокодер
async function getCoordinatesFromAddress(addressText: string): Promise<{ lat: number; lng: number } | null> {
  if (!YANDEX_API_KEY) {
    console.error('YANDEX_MAPS_API_KEY отсутствует для геокодирования');
    return null;
  }

  const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${YANDEX_API_KEY}&geocode=${encodeURIComponent(addressText)}&format=json&results=1`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const foundPlaces = data?.response?.GeoObjectCollection?.featureMember;

    if (foundPlaces && foundPlaces.length > 0) {
      // Геокодер Яндекса возвращает координаты в формате "Долгота Широта"
      const pos = foundPlaces[0].GeoObject.Point.pos; 
      const [lngStr, latStr] = pos.split(' ');
      const lng = parseFloat(lngStr);
      const lat = parseFloat(latStr);

      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
  } catch (err) {
    console.error(`Ошибка геокодирования адреса "${addressText}":`, err);
  }
  return null;
}

// 2. Поиск ближайшей организации через Яндекс API Поиска по организациям
async function findNearestYandexPoi(lat: number, lng: number, searchText: string): Promise<any | null> {
  const url = `https://search-maps.yandex.ru/v1/?apikey=${YANDEX_API_KEY}&text=${encodeURIComponent(searchText)}&lang=tr_TR&ll=${lng},${lat}&spn=0.03,0.03&results=1`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.features && data.features.length > 0) {
      return data.features[0]; 
    }
  } catch (err) {
    console.error(`Ошибка геопоиска Яндекс по запросу "${searchText}":`, err);
  }
  return null;
}

// 3. Расчет расстояния и времени через Яндекс Матрицу Расстояний
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
    console.error('Ошибка расчета матрицы расстояний Яндекс:', err);
  }
  return null;
}

// 4. Основная бэкенд-функция обновления инфраструктуры
export async function updatePropertyPOIs(propertyId: string): Promise<void> {
  if (!YANDEX_API_KEY) {
    console.error('YANDEX_MAPS_API_KEY отсутствует в переменных окружения');
    return;
  }

  // Запрашиваем только те колонки, которые гарантированно есть в вашей базе (adress и city)
  const { data: property, error: fetchError } = await supabaseAdmin
    .from('properties')
    .select('adress, city')
    .eq('id', propertyId)
    .single();

  if (fetchError || !property) {
    console.error(`Не удалось получить объект ${propertyId} из базы данных:`, fetchError);
    return;
  }

  const rawAddress = property.adress; // Используем только существующую колонку adress
  if (!rawAddress) {
    console.warn(`У объекта ${propertyId} отсутствует текстовый адрес (колонка adress пуста)`);
    return;
  }

  // Конструируем полный адрес
  const cityPrefix = property.city ? `${property.city}, ` : '';
  const fullAddress = `${cityPrefix}${rawAddress}`;

  console.log(`Начало геокодирования адреса для объекта ${propertyId}: "${fullAddress}"`);
  
  // Получаем координаты из Геокодера
  const coordinates = await getCoordinatesFromAddress(fullAddress);
  if (!coordinates) {
    console.error(`Геокодер Яндекса не смог определить координаты для адреса "${fullAddress}"`);
    return;
  }

  const { lat, lng } = coordinates;
  console.log(`Координаты получены успешно: lat: ${lat}, lng: ${lng}`);

  // Определение поисковых фраз на турецком языке
  const poiSearchQueries = {
    transport: 'metro', 
    leisure: 'plaj', 
    infrastructure: 'Alışveriş Merkezi', 
    business: 'İş Merkezi' 
  };

  const finalPoiData: Record<string, PoiResult> = {};

  for (const [category, searchQuery] of Object.entries(poiSearchQueries)) {
    const nearestPlace = await findNearestYandexPoi(lat, lng, searchQuery);
    
    if (nearestPlace) {
      const destLng = nearestPlace.geometry.coordinates[0];
      const destLat = nearestPlace.geometry.coordinates[1];
      const placeName = nearestPlace.properties.CompanyMetaData.name;

      let travelMode: 'walking' | 'driving' = 'walking';
      let matrix = await calculateYandexMatrix(lat, lng, destLat, destLng, 'walking');

      if (matrix && matrix.duration > 20) {
        travelMode = 'driving';
        matrix = await calculateYandexMatrix(lat, lng, destLat, destLng, 'driving');
      }

      if (matrix) {
        finalPoiData[category] = {
          name: placeName,
          distance_meters: matrix.distance,
          travel_time_minutes: matrix.duration,
          travel_mode: travelMode
        };
      }
    }
  }

  // Обновляем данные строки через административный клиент (обходя RLS)
  const { error } = await supabaseAdmin
    .from('properties')
    .update({ 
      poi_data: finalPoiData,
      latitude: lat,
      longitude: lng
    })
    .eq('id', propertyId);

  if (error) {
    console.error(`Ошибка при сохранении POI и координат для объекта ${propertyId}:`, error);
  } else {
    console.log(`Объект ${propertyId} успешно обработан. Координаты и данные POI сохранены в базе данных.`);
  }
}
