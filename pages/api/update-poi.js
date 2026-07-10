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

    // ЗАЩИТА ОТ БЕСКОНЕЧНОЙ РЕКУРСИИ:
    // Сравниваем старый адрес с новым. Если они совпадают, прерываем выполнение.
    if (type === 'UPDATE' && old_record) {
      const newAddress = record?.address || record?.adress;
      const oldAddress = old_record?.address || old_record?.adress;
      const newCity = record?.city;
      const oldCity = old_record?.city;

      if (newAddress === oldAddress && newCity === oldCity) {
        console.log(`[Webhook] Адрес не менялся (ID: ${id}). Пропускаем расчет.`);
        return res.status(200).json({ message: 'Address did not change. Skipped update.' });
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
