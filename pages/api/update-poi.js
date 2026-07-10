import { updatePropertyPOIs } from '../../services/poiService';

export default async function handler(req, res) {
  // Вебхуки Supabase присылают данные методом POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Supabase отправляет данные о добавленной/измененной строке в объекте req.body.record
  const { record } = req.body;

  if (!record || !record.id || !record.latitude || !record.longitude) {
    return res.status(400).json({ message: 'Неполные данные объекта (отсутствуют координаты или ID)' });
  }

  try {
    // Запускаем фоновый расчет и запись POI в базу данных
    await updatePropertyPOIs(record.id, record.latitude, record.longitude);
    
    return res.status(200).json({ message: `POI для объекта ${record.id} успешно рассчитаны и обновлены` });
  } catch (error) {
    console.error('Ошибка автоматического расчета POI:', error);
    return res.status(500).json({ message: error.message || 'Внутренняя ошибка сервера' });
  }
}
