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
    // Блокируем запуск только тогда, когда обновление в базе произошло ИЗ-ЗА записи новых POI.
    // Если ты вручную меняешь координаты, адрес или описание — скрипт сработает!
    if (type === 'UPDATE' && old_record) {
      const newAddress = record?.address || record?.adress;
      const oldAddress = old_record?.address || old_record?.adress;
      const newCity = record?.city;
      const oldCity = old_record?.city;

      // Сравниваем старый JSON POI с новым
      const oldPoi = JSON.stringify(old_record?.poi_data);
      const newPoi = JSON.stringify(record?.poi_data);
      const poiChanged = oldPoi !== newPoi;

      // Предотвращаем бесконечный цикл только если адрес тот же, но POI обновились
      if (newAddress === oldAddress && newCity === oldCity && poiChanged) {
        console.log(`[Webhook] Предотвращаем бесконечный цикл для ID: ${id} (POI уже сохранены).`);
        return res.status(200).json({ message: 'Prevented infinite loop. Skipped update.' });
      }
    }

    console.log(`[Webhook] Запуск глубокого анализа инфраструктуры для ID: ${id}`);
    
    // Запускаем наш умный скоринг-сервис
    await updatePropertyPOIs(id);

    return res.status(200).json({ 
      success: true, 
      message: `Инфраструктура и Livability Score для ID ${id} успешно рассчитаны и сохранены.` 
    });

  } catch (err) {
    console.error('[Webhook Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
