import { supabase } from '../supabase';

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

interface PoiResult {
  name: string;
  distance_meters: number;
  travel_time_minutes: number;
  travel_mode: 'walking' | 'driving';
}

// Поиск ближайшего POI конкретного типа
async function findNearestPoi(lat: number, lng: number, type: string): Promise<any | null> {
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&rankby=distance&type=${type}&key=${GOOGLE_API_KEY}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return data.results[0]; // Возвращаем самый первый (ближайший по воздуху) объект
    }
  } catch (err) {
    console.error(`Ошибка при поиске POI типа ${type}:`, err);
  }
  return null;
}

// Расчет реального времени в пути
async function calculateDistanceMatrix(
  originLat: number, 
  originLng: number, 
  destLat: number, 
  destLng: number, 
  mode: 'walking' | 'driving'
): Promise<{ distance: number; duration: number } | null> {
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${destLat},${destLng}&mode=${mode}&key=${GOOGLE_API_KEY}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.rows && data.rows[0].elements && data.rows[0].elements[0].status === 'OK') {
      const element = data.rows[0].elements[0];
      return {
        distance: element.distance.value, // в метрах
        duration: Math.ceil(element.duration.value / 60), // переводим секунды в минуты
      };
    }
  } catch (err) {
    console.error('Ошибка расчета матрицы расстояний:', err);
  }
  return null;
}

// Основная функция: запускается при создании/обновлении объекта
export async function updatePropertyPOIs(propertyId: string, lat: number, lng: number): Promise<void> {
  if (!GOOGLE_API_KEY) {
    console.error('Google Maps API Key отсутствует в .env');
    return;
  }

  // Соответствие наших таксономий категориям Google Places
  const poiMappings = {
    transport: 'subway_station', // Для примера берем метро, можно расширить массивом
    leisure: 'park',
    infrastructure: 'shopping_mall',
    business: 'city_hall'
  };

  const finalPoiData: Record<string, PoiResult> = {};

  for (const [category, googleType] of Object.entries(poiMappings)) {
    const nearestPlace = await findNearestPoi(lat, lng, googleType);
    if (nearestPlace) {
      const destLat = nearestPlace.geometry.location.lat;
      const destLng = nearestPlace.geometry.location.lng;

      // По умолчанию рассчитываем пеший маршрут
      let travelMode: 'walking' | 'driving' = 'walking';
      let matrix = await calculateDistanceMatrix(lat, lng, destLat, destLng, 'walking');

      // Если пешком идти дольше 25 минут, рассчитываем поездку на машине
      if (matrix && matrix.duration > 25) {
        travelMode = 'driving';
        matrix = await calculateDistanceMatrix(lat, lng, destLat, destLng, 'driving');
      }

      if (matrix) {
        finalPoiData[category] = {
          name: nearestPlace.name,
          distance_meters: matrix.distance,
          travel_time_minutes: matrix.duration,
          travel_mode: travelMode
        };
      }
    }
  }

  // Сохраняем обновленные данные в Supabase
  const { error } = await supabase
    .from('properties')
    .update({ poi_data: finalPoiData })
    .eq('id', propertyId);

  if (error) {
    console.error(`Ошибка при сохранении POI для объекта ${propertyId}:`, error);
  }
}
