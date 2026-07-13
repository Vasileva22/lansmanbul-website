import { createClient } from '@supabase/supabase-js';

// Инициализируем Supabase внутри сервиса (используем service_role ключ для обхода любых RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const YANDEX_GEOCODER_KEY = process.env.YANDEX_GEOCODER_KEY;
const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY;

/**
 * 1. УМНЫЙ ГЕОКОДЕР ЯНДЕКСА (С ПОЛНЫМ НАБОРОРМ ЛОГОВ)
 */
async function getCoordinatesFromAddress(addressText: string): Promise<{ lat: number; lng: number } | null> {
  console.log(`[Geocoder] Запрос координат для адреса: "${addressText}"`);

  if (!YANDEX_GEOCODER_KEY) {
    console.error('[Geocoder Error] Критическая ошибка: Переменная YANDEX_GEOCODER_KEY пустая в Vercel!');
    return null;
  }

  const url = `https://geocode-maps.yandex.com/1.x/?apikey=${YANDEX_GEOCODER_KEY}&geocode=${encodeURIComponent(addressText)}&format=json&results=1`;
  
  try {
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

  if (!FOURSQUARE_API_KEY) {
    console.error('[Foursquare Error] Критическая ошибка: Переменная FOURSQUARE_API_KEY пустая в Vercel!');
    return [];
  }

  // Основные категории: 13000 (Еда/Рестораны), 17000 (Магазины/Ритейл), 19000 (Транспорт/Метро)
  const categories = '13000,17000,19000'; 
  const url = `https://api.foursquare.com/v3/places/search?ll=${lat},${lng}&radius=1000&categories=${categories}&limit=20`;

  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': FOURSQUARE_API_KEY,
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
export interface POIData {
  pois: any[];
  calculated_at: string;
  livability_score: number;
  debug_info: {
    geocoder_status: string;
    foursquare_status: string;
    total_found: number;
    error_message?: string;
  };
}

export async function updatePropertyPOIs(propertyId: string | number): Promise<boolean> {
  console.log(`\n--- [POI Service Start] Начинаем анализ для ID: ${propertyId} ---`);

  try {
    // 1. Достаем объект недвижимости из Supabase
    const { data: property, error: fetchError } = await supabase
      .from('properties')
      .select('id, address, city, title')
      .eq('id', propertyId)
      .single();

    if (fetchError || !property) {
      console.error(`[DB Error] Не удалось найти объект с ID ${propertyId} в базе данных:`, fetchError?.message);
      return false;
    }

    // Собираем полный адрес для геокодера
    const fullAddress = `${property.city || 'Istanbul'}, ${property.address}`;
    
    // 2. Запрашиваем координаты у Яндекса
    const coordinates = await getCoordinatesFromAddress(fullAddress);

    if (!coordinates) {
      console.error(`[POI Service Stop] Скрипт остановлен: Яндекс не вернул координаты для ID ${propertyId}. Поля инфраструктуры не будут изменены.`);
      
      // Записываем ошибку геокодера прямо в базу, чтобы ты видела её в Supabase!
      await supabase.from('properties').update({
        poi_data: {
          pois: [],
          calculated_at: new Date().toISOString(),
          livability_score: 0,
          debug_info: {
            geocoder_status: "FAILED_OR_EMPTY",
            foursquare_status: "NOT_STARTED",
            total_found: 0,
            error_message: "Яндекс Геокодер не вернул координаты. Проверь синтаксис адреса или API ключ."
          }
        }
      }).eq('id', propertyId);

      return false;
    }

    // 3. СРАЗУ ЖЕ СОХРАНЯЕМ КООРДИНАТЫ В БАЗУ (чтобы они работали на сайте и не пропадали!)
    console.log(`[DB Update] Фиксируем координаты в колонки latitude/longitude для ID: ${propertyId}`);
    await supabase.from('properties').update({
      latitude: coordinates.lat,
      longitude: coordinates.lng
    }).eq('id', propertyId);

    // 4. Запрашиваем POI у Foursquare
    const rawPois = await fetchFoursquarePOIs(coordinates.lat, coordinates.lng);

    // Форматируем массив точек в красивый и понятный вид
    const formattedPois = rawPois.map((item: any) => ({
      name: item.name,
      distance: item.distance,
      category: item.categories?.[0]?.name || 'Other',
      address: item.location?.formatted_address || ''
    }));

    // 5. РАССЧИТЫВАЕМ LIVABILITY SCORE (Простой алгоритм: каждые 2 объекта дают 1 балл, максимум 10)
    let score = Math.min(10, Math.floor(formattedPois.length / 2));
    if (score === 0 && formattedPois.length > 0) score = 1; // Если хоть что-то нашли, даем минимум 1 балл

    // 6. УПАКОВЫВАЕМ ВСЁ В СТРУКТУРУ JSON
    const finalPoiData: POIData = {
      pois: formattedPois,
      calculated_at: new Date().toISOString(),
      livability_score: score,
      debug_info: {
        geocoder_status: "SUCCESS",
        foursquare_status: rawPois.length > 0 ? "SUCCESS" : "EMPTY_OR_FAILED",
        total_found: formattedPois.length
      }
    };

    // 7. СОХРАНЯЕМ ИТОГОВЫЙ РЕЗУЛЬТАТ В SUPABASE
    console.log(`[DB Update] Записываем финальный JSON poi_data и score=${score} в базу для ID: ${propertyId}`);
    const { error: updateError } = await supabase
      .from('properties')
      .update({ 
        poi_data: finalPoiData,
        livability_score: score // Если у тебя есть отдельная колонка под баллы — она тоже заполнится
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
