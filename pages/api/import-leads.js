import { supabase } from '../../supabase'; // Путь к вашему supabase.js из корня

// Функция для очистки и приведения телефонных номеров к единому стандарту WhatsApp (+90...)
function sanitizePhoneNumber(phone) {
  if (!phone) return null;
  let cleaned = String(phone).replace(/\D/g, ''); // Удаляем все нечисловые символы
  
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }
  // Если турецкий номер начинается с 5 (например, 532...), добавляем код страны 90
  if (cleaned.length === 10 && cleaned.startsWith('5')) {
    cleaned = '90' + cleaned;
  }
  // Если начинается с 05 (например, 0532...), убираем 0 и добавляем 90
  if (cleaned.length === 11 && cleaned.startsWith('05')) {
    cleaned = '90' + cleaned.substring(1);
  }
  
  return cleaned ? `+${cleaned}` : null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sadece POST isteği destekleniyor' });
  }

  const { leads, district } = req.body;

  if (!Array.isArray(leads) || leads.length === 0) {
    return res.status(400).json({ error: 'Geçersiz veri. "leads" dizisi boş olamaz.' });
  }

  let importedCount = 0;
  let duplicateCount = 0;
  const errors = [];

  for (const lead of leads) {
    // Маппинг полей. Скрипт поддерживает разные варианты названий колонок из парсеров
    const companyName = lead.company_name || lead.title || lead.name || lead.Title || lead.Name;
    const rawPhone = lead.phone || lead.Phone || lead.formatted_phone_number || lead.telephone;
    const cleanPhone = sanitizePhoneNumber(rawPhone);

    if (!companyName) {
      continue; // Пропускаем записи без названия
    }

    const leadData = {
      company_name: companyName.trim(),
      phone: cleanPhone,
      raw_phone: rawPhone ? String(rawPhone).trim() : null,
      website: lead.website || lead.Website || null,
      address: lead.address || lead.Address || lead.formatted_address || null,
      google_maps_url: lead.google_maps_url || lead.url || lead.Url || null,
      rating: lead.rating || lead.Rating ? parseFloat(lead.rating || lead.Rating) : null,
      review_count: lead.review_count || lead.reviews || lead.ReviewCount ? parseInt(lead.review_count || lead.reviews || lead.ReviewCount, 10) : null,
      district: district || lead.district || 'Sincan',
      status: 'new'
    };

    try {
      const { error } = await supabase
        .from('lead_developers')
        .insert(leadData);

      if (error) {
        // Код ошибки PostgreSQL '23505' означает нарушение уникальности индекса (дубликат телефона)
        if (error.code === '23505') {
          duplicateCount++;
        } else {
          errors.push({ name: companyName, error: error.message });
        }
      } else {
        importedCount++;
      }
    } catch (err) {
      errors.push({ name: companyName, error: err.message });
    }
  }

  return res.status(200).json({
    success: true,
    message: 'İçe aktarma tamamlandı.',
    summary: {
      imported: importedCount,
      duplicates_skipped: duplicateCount,
      failed: errors.length
    },
    errors: errors.slice(0, 10) // Возвращаем первые 10 ошибок для диагностики, если они будут
  });
}
