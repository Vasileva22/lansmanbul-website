import { createClient } from '@supabase/supabase-js';

// Инициализируем Supabase внутри сервиса (используем service_role ключ для обхода любых RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const YANDEX_GEOCODER_KEY = process.env.YANDEX_GEOCODER_KEY;
const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY;

/**
 * 1. УМНЫЙ ГЕОКОДЕР ЯНДЕКСА (С ИСПРАВЛЕННЫМ СБОРЩИКОМ URL)
 */
async function getCoordinatesFromAddress(addressText: string): Promise<{ lat: number; lng: number } | null> {
  console.log(`[Geocoder] Запрос координат для адреса: "${addressText}"`);

  // Очищаем ключ от возможных лишних пробелов или случайных кавычек из панели Vercel
  const rawKey = YANDEX_GEOCODER_KEY ? YANDEX_GEOCODER_KEY.trim().replace(/["']/g, '') : '';

  if (!rawKey) {
    console.error('[Geocoder Error] Критическая ошибка: Переменная YANDEX_GEOCODER_KEY пустая в Vercel!');
    return null;
  }

  try {
    // Используем встроенный конструктор URL — он гарантирует отсутствие двойных слэшей перед "1.x"
    const urlObj = new URL('https://geocode-maps.yandex.com/1.x/');
    urlObj.searchParams.set('apikey', rawKey);
    urlObj.searchParams.set('geocode', addressText);
    urlObj.searchParams.set('format', 'json');
    urlObj.searchParams.set('results', '1');

    const url = urlObj.toString();
    console.log(`[Geocoder Link Check] Отправляем запрос на URL: ${url}`);
    
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

  const rawFoursquareKey = FOURSQUARE_API_KEY ? FOURSQUARE_API_KEY.trim().replace(/["']/g, '') : '';

  if (!rawFoursquareKey) {
    console.error('[Foursquare Error] Критическая ошибка: Переменная FOURSQUARE_API_KEY пустая в Vercel!');
    return [];
  }

  // Основные категории: 13000 (Еда/Рестораны), 17000 (Магазины/Ритейл), 19000 (Транспорт/Метро)
  const categories = '13000,17000,19000'; 
  const url = `https://api.foursquare.com/v3/places/search?ll=${lat},${lng}&radius=1000&categories=${categories}&limit=20`;

  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': rawFoursquareKey,
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
    // 1. Достаем объект недвижимости из Supabase через '*' (чтобы избежать падений из-за названий колонок)
    const { data: property, error: fetchError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (fetchError || !property) {
      console.error(`[DB Error] Не удалось найти объект с ID ${propertyId}:`, fetchError?.message);
      return false;
    }

    // Умный поиск адреса (проверяем все возможные варианты написания колонки)
    const actualAddress = property.address || property.adress || '';
    const fullAddress = `${property.city || 'Istanbul'}, ${actualAddress}`;
    
    // 2. Запрашиваем координаты у Яндекса
    const coordinates = await getCoordinatesFromAddress(fullAddress);

    if (!coordinates) {
      console.error(`[POI Service Stop] Скрипт остановлен: Яндекс не вернул координаты.`);
      
      await supabase.from('properties').update({
        poi_data: {
          pois: [],
          calculated_at: new Date().toISOString(),
          livability_score: 0,
          debug_info: {
            geocoder_status: "FAILED_OR_EMPTY",
            foursquare_status: "NOT_STARTED",
            total_found: 0,
            error_message: "Яндекс Геокодер не вернул координаты. Проверь адрес или API-ключ."
          }
        }
      }).eq('id', propertyId);

      return false;
    }

    // 3. Сохраняем полученные координаты напрямую в отдельные колонки базы данных
    console.log(`[DB Update] Записываем координаты в базу для ID: ${propertyId}`);
    await supabase.from('properties').update({
      latitude: coordinates.lat,
      longitude: coordinates.lng
    }).eq('id', propertyId);

    // 4. Запрашиваем POI у Foursquare
    const rawPois = await fetchFoursquarePOIs(coordinates.lat, coordinates.lng);

    // Форматируем массив точек в понятный JSON-вид
    const formattedPois = rawPois.map((item: any) => ({
      name: item.name,
      distance: item.distance,
      category: item.categories?.[0]?.name || 'Other',
      address: item.location?.formatted_address || ''
    }));

    // 5. Рассчитываем рейтинг привлекательности района
    let score = Math.min(10, Math.floor(formattedPois.length / 2));
    if (score === 0 && formattedPois.length > 0) score = 1;

    // 6. Формируем финальный объект
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

    // 7. Обновляем JSON-колонку в Supabase
    console.log(`[DB Update] Записываем финальный JSON poi_data в базу для ID: ${propertyId}`);
    const { error: updateError } = await supabase
      .from('properties')
      .update({ 
        poi_data: finalPoiData
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
