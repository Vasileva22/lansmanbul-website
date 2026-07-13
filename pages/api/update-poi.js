import { updatePropertyPOIs } from '../../services/poiService';

export default async function handler(req, res) {
  // Разрешаем только POST-запросы от вебхука Supabase
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const { type, table, record, old_record } = req.body;

    console.log(`[Webhook] Получено событие ${type} для таблицы "${table}"`);

    // Проверяем, что запрос пришел именно от таблицы properties
    if (table !== 'properties') {
      return res.status(400).json({ error: 'Invalid table trigger' });
    }

    const id = record?.id;
    if (!id) {
      return res.status(400).json({ error: 'No record ID found in payload' });
    }

    // УМНАЯ ЗАЩИТА ОТ БЕСКОНЕЧНОЙ РЕКУРСИИ:
    if (type === 'UPDATE' && old_record) {
      const newAddress = (record?.address || record?.adress || '').trim();
      const oldAddress = (old_record?.address || old_record?.adress || '').trim();
      const newCity = (record?.city || '').trim();
      const oldCity = (old_record?.city || '').trim();

      // Проверяем, пустые ли новые POI
      const hasPoiData = record?.poi_data && Object.keys(record.poi_data).length > 0;

      // Если адрес и город НЕ менялись, а в базе УЖЕ лежат готовые POI,
      // то это был триггер от нашей собственной записи, глушим его.
      if (newAddress === oldAddress && newCity === oldCity && hasPoiData) {
        // Дополнительно убедимся, что мы не зацикливаемся, если изменились только технические поля POI
        const oldPoi = JSON.stringify(old_record?.poi_data);
        const newPoi = JSON.stringify(record?.poi_data);
        
        if (oldPoi !== newPoi) {
          console.log(`[Webhook] Предотвращаем бесконечный цикл для ID: ${id} (POI уже сохранены, адрес не менялся).`);
          return res.status(200).json({ message: 'Prevented infinite loop. Skipped update.' });
        }
      }
    }

    console.log(`[Webhook] Запуск глубокого анализа инфраструктуры для ID: ${id}`);
    
    // Запускаем наш умный скоринг-сервис
    const success = await updatePropertyPOIs(id);

    if (success) {
      return res.status(200).json({ 
        success: true, 
        message: `Инфраструктура и Livability Score для ID ${id} успешно рассчитаны и сохранены.` 
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        error: `Не удалось рассчитать инфраструктуру для ID ${id}. Проверь логи геокодера.` 
      });
    }

  } catch (err) {
    console.error('[Webhook Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
