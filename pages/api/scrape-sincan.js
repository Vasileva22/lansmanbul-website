import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

// Инициализация безопасного клиента Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Умная функция автоопределения статуса по тексту
function detectStatus(text) {
  const normText = text.toLowerCase();
  if (normText.includes('lansman') || normText.includes('on talep') || normText.includes('temel')) {
    return 'Lansman';
  }
  if (normText.includes('tamamlandi') || normText.includes('teslim edildi') || normText.includes('anahtar teslim') || normText.includes('oturuma hazir')) {
    return 'Tamamlandı';
  }
  return 'Devam ediyor'; // По умолчанию строится
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Sadece GET isteği destekleniyor' });
  }

  console.log("[Parser] Ankara projeleri taranıyor...");
  // Главная стабильная страница новостроек Анкары
  const targetUrl = 'https://www.projedefirsat.com/ankara-konut-projeleri';

  try {
    const { data: html } = await axios.get(targetUrl, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.8,en-US;q=0.5,en;q=0.3',
        'Referer': 'https://www.projedefirsat.com/'
      }
    });
    
    const $ = cheerio.load(html);
    const projects = [];

    // Обходим блочные контейнеры на странице
    $('div, section').each((index, element) => {
      const cardText = $(element).text();

      // Фильтруем только карточки SİNCAN
      if (cardText.includes('SİNCAN') || cardText.includes('Sincan')) {
        const title = $(element).find('h3, h2, h4, [class*="title"]').first().text().trim();
        const description = $(element).find('.desc, [class*="desc"], p').first().text().trim();

        // Отсеиваем системные SEO-заголовки сайта-источника
        if (
          title && 
          !title.includes('Fiyatları') && 
          !title.includes('Konut Projeleri') &&
          !projects.some(p => p.testproje === title)
        ) {
          const detectedStatus = detectStatus(title + " " + description);

          projects.push({
            testproje: title,
            konutcesit: detectedStatus,
            city: "Ankara",
            "İlçe/Semt": "Sincan",
            Açıklama: description || "Proje detayları yakında eklenecektir.",
            Fiyat: "Fiyat Belirtilmemiş",
            is_active: true,
            last_seen_at: new Date().toISOString()
          });
        }
      }
    });

    if (projects.length === 0) {
      return res.status(200).json({ 
        success: false, 
        message: 'Sincan ilçesine ait filtreyle eşleşen aktif proje kartı bulunamadı.' 
      });
    }

    // БЕЗОПАСНАЯ ПРОГРАММНАЯ ЗАПИСЬ (БЕЗ ТРЕБОВАНИЯ ИНДЕКСОВ В БД)
    let savedCount = 0;
    for (const proj of projects) {
      // 1. Проверяем, существует ли уже проект с таким именем
      const { data: existing, error: fetchError } = await supabase
        .from('properties')
        .select('id')
        .eq('testproje', proj.testproje)
        .maybeSingle();

      if (fetchError) {
        console.error("Hata проверяем:", fetchError.message);
        continue;
      }

      if (existing) {
        // 2. Если существует — просто обновляем дату проверки и статус активности
        const { error: updateError } = await supabase
          .from('properties')
          .update({ last_seen_at: proj.last_seen_at, is_active: true })
          .eq('id', existing.id);
          
        if (!updateError) savedCount++;
      } else {
        // 3. Если проекта нет в базе — вставляем новую запись
        const { error: insertError } = await supabase
          .from('properties')
          .insert(proj);
          
        if (!insertError) savedCount++;
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Sincan projeleri başarıyla kaydedildi!', 
      found_sincan_projects_count: projects.length,
      saved_to_db_count: savedCount,
      projects: projects.map(p => ({ isim: p.testproje, durum: p.konutcesit }))
    });

  } catch (error) {
    console.error("Tarama hatası:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
