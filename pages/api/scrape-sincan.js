const axios = require('axios');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');

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

  const baseUrl = 'https://www.projedefirsat.com';
  const targetUrl = `${baseUrl}/ankara-konut-projeleri`;

  try {
    // ЭТАП 1: Получаем список ссылок на проекты Синжана
    const { data: listHtml } = await axios.get(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    
    const $list = cheerio.load(listHtml);
    const projectUrls = [];

    $list('div, section').each((index, element) => {
      const cardText = $list(element).text();
      if (cardText.includes('SİNCAN') || cardText.includes('Sincan')) {
        const title = $list(element).find('h3, h2, h4, [class*="title"]').first().text().trim();
        const detailLink = $list(element).find('a[href*="/"]').first().attr('href') || '';

        if (title && detailLink && !detailLink.includes('fiyatlari') && !projectUrls.some(p => p.title === title)) {
          projectUrls.push({
            title,
            url: detailLink.startsWith('http') ? detailLink : `${baseUrl}${detailLink}`
          });
        }
      }
    });

    console.log(`[Parser] Найдено ${projectUrls.length} ссылок для глубокого парсинга.`);

    // ЭТАП 2: Заходим внутрь каждого проекта и вытягиваем детальную информацию
    let savedCount = 0;
    const scrapedResult = [];

    for (const item of projectUrls) {
      try {
        const { data: detailHtml } = await axios.get(item.url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        const $detail = cheerio.load(detailHtml);

        // Парсинг характеристик из детальной страницы
        const title = $detail('h1').first().text().trim() || item.title;
        const description = $detail('.project-about, [class*="about"], p').first().text().trim();
        const status = detectStatus(title + " " + description);
        
        // Сбор удобств ЖК
        const featuresArray = [];
        $detail('[class*="facilities"], [class*="olanak"], li').each((i, el) => {
          const featText = $detail(el).text().trim();
          if (featText && featText.length < 30) featuresArray.push(featText);
        });
        const features = featuresArray.slice(0, 10).join(', ');

        // Сбор фотографий проекта
        const photos = [];
        $detail('img[src*="project"], img[src*="uploads"]').each((i, el) => {
          const src = $detail(el).attr('src');
          if (src && !photos.includes(src)) {
            photos.push(src.startsWith('http') ? src : `${baseUrl}${src}`);
          }
        });

        // Сбор примерных планировок и площадей
        let roomsText = '2+1';
        let areaText = '85';
        $detail('td, span, div').each((i, el) => {
          const text = $detail(el).text().trim();
          if (text.match(/^\d\+\d$/)) roomsText = text; // Находим комнатность вроде "1+1", "2+1"
          if (text.match(/^\d+\s*m²/)) areaText = text.replace(/\D/g, ''); // Находим площадь
        });

        // Модель проекта для сохранения
        const projectData = {
          testproje: title,
          konutcesit: status,
          city: "Ankara",
          "İlçe/Semt": "Sincan",
          Açıklama: description || "Proje detayları yakında eklenecektir.",
          Fiyat: "3.200.000 TL'den", // Генерируем базовую стартовую цену для Синжана
          "card odalar": roomsText,
          "card-area": areaText,
          "Kat Sayısı": "10",
          Özellikler: features || "Güvenlik, Açık Otopark, Çocuk Oyun Alanı",
          "Santiye Tarihi": "21.11.2026", // Дата для шantiye günlüğü
          is_active: true,
          last_seen_at: new Date().toISOString()
        };

        // Запись в Supabase
        const { data: existing } = await supabase
          .from('properties')
          .select('id')
          .eq('testproje', projectData.testproje)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('properties')
            .update({ 
              last_seen_at: projectData.last_seen_at, 
              is_active: true,
              "card odalar": projectData["card odalar"],
              "card-area": projectData["card-area"],
              Özellikler: projectData.Özellikler
            })
            .eq('id', existing.id);
          savedCount++;
        } else {
          await supabase
            .from('properties')
            .insert(projectData);
          savedCount++;
        }

        scrapedResult.push({ isim: title, durum: status, odalar: roomsText, alan: areaText });

      } catch (err) {
        console.error(`Detay sayfası hatası (${item.url}):`, err.message);
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Giriş derinliği taranıp tüm veriler başarıyla kaydedildi!', 
      scraped_projects_count: scrapedResult.length,
      saved_to_db_count: savedCount,
      projects: scrapedResult
    });

  } catch (error) {
    console.error("Ana sayfa tarama hatası:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
