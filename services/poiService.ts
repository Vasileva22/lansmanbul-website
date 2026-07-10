import { supabase } from '../supabase';

const YANDEX_API_KEY = process.env.YANDEX_MAPS_API_KEY;

interface PoiResult {
  name: string;
  distance_meters: number;
  travel_time_minutes: number;
  travel_mode: 'walking' | 'driving';
}

// 1. Поиск ближайшей организации через Яндекс API Поиска по организациям
async function findNearestYandexPoi(lat: number, lng: number, searchText: string): Promise<any | null> {
  // Важно: Яндекс Геопоиск ожидает координаты в порядке longitude,latitude (Долгота, Широта)
  const url = `https://search-maps.yandex.ru/v1/?apikey=${YANDEX_API_KEY}&text=${encodeURIComponent(searchText)}&lang=tr_TR&ll=${lng},${lat}&spn=0.03,0.03&results=1`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.features && data.features.length > 0) {
      return data.features[0]; // Возвращаем первую (ближайшую) найденную точку
    }
  } catch (err) {
    console.error(`Ошибка геопоиска Яндекс по запросу "${searchText}":`, err);
  }
  return null;
}

// 2. Расчет расстояния и времени через Яндекс Матрицу Расстояний
async function calculateYandexMatrix(
  originLat: number, 
  originLng: number, 
  destLat: number, 
  destLng: number, 
  mode: 'walking' | 'driving'
): Promise<{ distance: number; duration: number } | null> {
  // Важно: Матрица расстояний Яндекса ожидает координаты в порядке latitude,longitude
  const url = `https://api.routing.yandex.net/v2/distancematrix?origins=${originLat},${originLng}&destinations=${destLat},${destLng}&mode=${mode}&apikey=${YANDEX_API_KEY}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.rows && data.rows[0].elements && data.rows[0].elements[0].status === 'OK') {
      const element = data.rows[0].elements[0];
      return {
        distance: element.distance.value, // Расстояние в метрах
        duration: Math.ceil(element.duration.value / 60) // Переводим секунды в округленные минуты
      };
    }
  } catch (err) {
    console.error('Ошибка расчета матрицы расстояний Яндекс:', err);
  }
  return null;
}

// 3. Основная бэкенд-функция расчета инфраструктуры
export async function updatePropertyPOIs(propertyId: string, lat: number, lng: number): Promise<void> {
  if (!YANDEX_API_KEY) {
    console.error('YANDEX_MAPS_API_KEY отсутствует в переменных окружения');
    return;
  }

  // Поисковые фразы на турецком языке для высокой точности поиска в Турции
  const poiSearchQueries = {
    transport: 'metro', // Метро
    leisure: 'plaj', // Пляж (для курортов) или парк
    infrastructure: 'Alışveriş Merkezi', // ТЦ / Молл
    business: 'İş Merkezi' // Бизнес-центр
  };

  const finalPoiData: Record<string, PoiResult> = {};

  for (const [category, searchQuery] of Object.entries(poiSearchQueries)) {
    const nearestPlace = await findNearestYandexPoi(lat, lng, searchQuery);
    
    if (nearestPlace) {
      // Геометрия Яндекса возвращает координаты в формате [longitude, latitude]
      const destLng = nearestPlace.geometry.coordinates[0];
      const destLat = nearestPlace.geometry.coordinates[1];
      const placeName = nearestPlace.properties.CompanyMetaData.name;

      // По умолчанию рассчитываем пеший маршрут
      let travelMode: 'walking' | 'driving' = 'walking';
      let matrix = await calculateYandexMatrix(lat, lng, destLat, destLng, 'walking');

      // Если пешком добираться дольше 20 минут, пересчитываем поездку на авто
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

  // Обновляем данные в таблице properties в Supabase
  const { error } = await supabase
    .from('properties')
    .update({ poi_data: finalPoiData })
    .eq('id', propertyId);

  if (error) {
    console.error(`Ошибка при сохранении POI для объекта ${propertyId}:`, error);
  }
}
