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

    // Обходим все блочные контейнеры на странице
    $('div, section').each((index, element) => {
      const cardText = $(element).text();

      // Отбираем только те карточки, которые содержат упоминание района SİNCAN
      if (cardText.includes('SİNCAN') || cardText.includes('Sincan')) {
        // Находим заголовок (обычно это h3, h2 или h4) внутри карточки
        const title = $(element).find('h3, h2, h4, [class*="title"]').first().text().trim();
        const description = $(element).find('.desc, [class*="desc"], p').first().text().trim();

        // Проверяем уникальность проекта, чтобы не добавлять одну карточку дважды
        if (title && !projects.some(p => p.testproje === title)) {
          const detectedStatus = detectStatus(title + " " + description);

          projects.push({
            testproje: title,
            konutcesit: detectedStatus,
            city: "Ankara",
            "İlçe/Semt": "Sincan",
            Açıklama: description || "Proje detayları yakında eklenecektir.",
            Fiyat: "Fiyat Belirtilmemiş", // Заглушка, цену добавит модератор
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

    // Сохраняем собранные ЖК в Supabase с обновлением по ключу testproje (upsert)
    let addedCount = 0;
    for (const proj of projects) {
      const { error } = await supabase
        .from('properties')
        .upsert(proj, { onConflict: 'testproje' });

      if (error) {
        console.error(`Supabase Hatası (${proj.testproje}):`, error.message);
      } else {
        addedCount++;
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Sincan projeleri başarıyla taranıp filtrelendi!', 
      found_sincan_projects_count: projects.length,
      saved_to_db_count: addedCount,
      projects: projects.map(p => ({ isim: p.testproje, durum: p.konutcesit }))
    });

  } catch (error) {
    console.error("Tarama hatası:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
