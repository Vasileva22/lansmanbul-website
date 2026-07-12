// Поиск лучшего POI на основе рассчитанных весов из нового скоринга бэкенда
function getBestPoiBadge(property) {
  let poiPayload = property?.poi_data;
  if (!poiPayload) return null;

  // Если колонка пришла в виде строки (текста), безопасно преобразуем её в объект
  if (typeof poiPayload === 'string') {
    try {
      poiPayload = JSON.parse(poiPayload);
    } catch (e) {
      console.error("Ошибка чтения poi_data:", e);
      return null;
    }
  }

  // В новой структуре все объекты лежат внутри вложенного объекта `pois`
  const pois = poiPayload.pois || {};
  const allPois = Object.entries(pois).filter(([_, poi]) => poi && poi.raw_score > 0);

  if (allPois.length === 0) return null;

  try {
    // Находим объект, который получил наивысшую взвешенную оценку (weighted_score)
    const best = allPois.reduce((prev, curr) => 
      prev[1].weighted_score > curr[1].weighted_score ? prev : curr
    );

    return {
      name: best[1].name,
      time: best[1].travel_time_minutes,
      mode: best[1].travel_mode,
      type: best[0] // Вернет 'metro', 'beach' и т.д.
    };
  } catch (e) {
    console.error(e);
  }
  return null;
}
