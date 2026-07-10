import { NextResponse } from 'next/server';
import { updatePropertyPOIs } from '../../../services/poiService'; // Корректируйте путь в зависимости от расположения

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, table, record, old_record } = body;

    console.log(`[Webhook] Получено событие ${type} для таблицы "${table}"`);

    if (table !== 'properties') {
      return NextResponse.json({ error: 'Неверный триггер таблицы' }, { status: 400 });
    }

    const id = record?.id;
    if (!id) {
      return NextResponse.json({ error: 'ID объекта не найден' }, { status: 400 });
    }

    // Защита от бесконечного цикла (проверка изменения адреса или города)
    if (type === 'UPDATE' && old_record) {
      const newAddress = record?.address || record?.adress;
      const oldAddress = old_record?.address || old_record?.adress;
      const newCity = record?.city;
      const oldCity = old_record?.city;

      if (newAddress === oldAddress && newCity === oldCity) {
        console.log(`[Webhook] Адрес/город объекта ${id} не менялись. Пропускаем расчет POI.`);
        return NextResponse.json({ message: 'Адрес не изменен. Обновление пропущено.' });
      }
    }

    console.log(`[Webhook] Запуск глубокого скоринг-анализа для объекта ID: ${id}`);
    
    // Запуск обновленного интеллектуального анализа
    await updatePropertyPOIs(id);

    return NextResponse.json({ 
      success: true, 
      message: `Инфраструктура и Livability Score для ID ${id} успешно рассчитаны и сохранены.` 
    });

  } catch (err: any) {
    console.error('[Webhook API Route Error]:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
