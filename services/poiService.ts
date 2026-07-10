import { supabase } from '../supabase';

const YANDEX_API_KEY = process.env.YANDEX_MAPS_API_KEY;

interface PoiResult {
  name: string;
  distance_meters: number;
  travel_time_minutes: number;
  travel_mode: 'walking' | 'driving';
}

// 1. Геокодирование: преобразование текста адреса в [lat, lng] через Яндекс Геокодер
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
      // Геокодер Яндекса возвращает точку в формате "Долгота Широта" через пробел
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

// 4. Основная бэкенд-функция: теперь принимает ТОЛЬКО propertyId
export async function updatePropertyPOIs(propertyId: string): Promise<void> {
  if (!YANDEX_API_KEY) {
    console.error('YANDEX_MAPS_API_KEY отсутствует в переменных окружения');
    return;
  }

  // Шаг 4.1: Получаем текстовый адрес объекта из Supabase
  const { data: property, error: fetchError } = await supabase
    .from('properties')
    .select('address, adress, city')
    .eq('id', propertyId)
    .single();

  if (fetchError || !property) {
    console.error(`Не удалось найти объект ${propertyId} в базе данных:`, fetchError);
    return;
  }

  const rawAddress = property.address || property.adress;
  if (!rawAddress) {
    console.warn(`У объекта ${propertyId} нет текстового адреса (колонки address/adress пусты)`);
    return;
  }

  // Конструируем полный адрес (например: "Istanbul, Kadıköy, Cemil Topuzlu Cd.") для точности геокодирования
  const cityPrefix = property.city ? `${property.city}, ` : '';
  const fullAddress = `${cityPrefix}${rawAddress}`;

  console.log(`Начало геокодирования для объекта ${propertyId}: "${fullAddress}"`);

  // Шаг 4.2: Получаем географические координаты через Геокодер
  const coordinates = await getCoordinatesFromAddress(fullAddress);
  if (!coordinates) {
    console.error(`Геокодер не вернул координаты для адреса "${fullAddress}"`);
    return;
  }

  const { lat, lng } = coordinates;
  console.log(`Адрес успешно преобразован в координаты: Широта: ${lat}, Долгота: ${lng}`);

  // Шаг 4.3: Запросы инфраструктуры по полученным координатам
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

  // Шаг 4.4: Сохраняем и poi_data, и автоматически найденные координаты обратно в базу
  const { error } = await supabase
    .from('properties')
    .update({ 
      poi_data: finalPoiData,
      latitude: lat,
      longitude: lng
    })
    .eq('id', propertyId);

  if (error) {
    console.error(`Ошибка при сохранении POI для объекта ${propertyId}:`, error);
  } else {
    console.log(`Объект ${propertyId} успешно обработан. Координаты и инфраструктура сохранены.`);
  }
}
