import { updatePropertyPOIs } from '../../services/poiService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const { type, table, record, old_record } = req.body;

    console.log(`[Webhook] Получено событие ${type} для таблицы "${table}"`);

    if (table !== 'properties') {
      return res.status(400).json({ error: 'Invalid table trigger' });
    }

    const id = record?.id;
    if (!id) {
      return res.status(400).json({ error: 'No record ID found in payload' });
    }

    // ЖЕЛЕЗОБЕТОННАЯ ЗАЩИТА ОТ БЕСКОНЕЧНОЙ РЕКУРСИИ:
    if (type === 'UPDATE' && old_record) {
      const newAddress = (record?.address || record?.adress || '').trim();
      const oldAddress = (old_record?.address || old_record?.adress || '').trim();
      const newCity = (record?.city || '').trim();
      const oldCity = (old_record?.city || '').trim();

      // Если адрес и город НЕ менялись — это технический апдейт координат или POI.
      // Прерываем выполнение немедленно, не тратя лимиты API сторонних сервисов.
      if (newAddress === oldAddress && newCity === oldCity) {
        console.log(`[Webhook] Предотвращаем бесконечный цикл для ID: ${id} (адрес и город не менялись).`);
        return res.status(200).json({ message: 'Address and city did not change. Skipped calculation.' });
      }
    }

    console.log(`[Webhook] Запуск глубокого анализа инфраструктуры для ID: ${id}`);
    const success = await updatePropertyPOIs(id);

    if (success) {
      return res.status(200).json({ 
        success: true, 
        message: `Инфраструктура для ID ${id} успешно рассчитана.` 
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        error: `Не удалось рассчитать инфраструктуру для ID ${id}.` 
      });
    }

  } catch (err) {
    console.error('[Webhook Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
