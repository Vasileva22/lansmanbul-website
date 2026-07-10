import { cityPoiPriorities, CityPriorityConfig } from '../config/poi-priorities';

interface PropertyForPoi {
  city?: string;
  poi_data?: Record<string, {
    name: string;
    distance_meters: number;
    travel_time_minutes: number;
    travel_mode: 'walking' | 'driving';
  }>;
}

export function getBestPoiBadge(property: PropertyForPoi): { text: string; type: string } | null {
  const poiData = property?.poi_data;
  if (!poiData || Object.keys(poiData).length === 0) return null;

  // Очищаем название города для сверки с конфигом
  const cityKey = (property?.city || 'default').toLowerCase().trim();
  const config: CityPriorityConfig = cityPoiPriorities[cityKey] || cityPoiPriorities['default'];

  // Идем строго по приоритетам города
  for (const category of config.priorities) {
    const poi = poiData[category];
    if (poi) {
      const modeText = poi.travel_mode === 'walking' ? 'yürüme' : 'araçla';
      
      // Если объект находится в пределах разумной пешей доступности
      if (poi.travel_mode === 'walking' && poi.travel_time_minutes <= config.maxWalkingTimeMinutes) {
        return {
          text: `${poi.name}'na ${poi.travel_time_minutes} dk ${modeText}`,
          type: category // вернет 'transport' / 'leisure' и т.д., чтобы раскрасить иконку
        };
      }
      
      // Если объект дальше, но это все еще важный приоритет (например, пляж на машине)
      if (poi.travel_mode === 'driving' && poi.travel_time_minutes <= 15) {
        return {
          text: `${poi.name}'na ${poi.travel_time_minutes} dk ${modeText}`,
          type: category
        };
      }
    }
  }

  // Если ничего критически близкого не найдено, берем физически самый близкий объект из доступных
  const allPois = Object.entries(poiData);
  if (allPois.length > 0) {
    const closest = allPois.reduce((prev, curr) => 
      prev[1].distance_meters < curr[1].distance_meters ? prev : curr
    );
    const modeText = closest[1].travel_mode === 'walking' ? 'yürüme' : 'araçla';
    return {
      text: `${closest[1].name}'na ${closest[1].travel_time_minutes} dk ${modeText}`,
      type: closest[0]
    };
  }

  return null;
}
