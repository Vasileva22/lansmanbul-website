import axios from 'axios';
import * as cheerio from 'cheerio';
import { getSupabaseAdmin } from '../../lib/supabaseAdmin';
import { requireAdminSecret } from '../../lib/requireAdminSecret';

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

  // Запуск только с паролем: /api/scrape-sincan?secret=...
  if (!requireAdminSecret(req, res)) return;

  const supabase = getSupabaseAdmin();

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

        // Фильтруем системные ссылки, рекламу и другие районы (например, Чанкаю)
        const isSystemLink = 
          title.toLowerCase().includes('haberler') ||
          title.toLowerCase().includes('ara!') ||
          title.toLowerCase().includes('cankaya') || 
          title.toLowerCase().includes('konut projeleri') ||
          detailLink.includes('/haberler') ||
          detailLink.includes('/blog') ||
          detailLink.includes('/karsilastir');

        if (title && detailLink && !isSystemLink && !projectUrls.some(p => p.title === title)) {
          projectUrls.push({
            title,
            url: detailLink.startsWith('http') ? detailLink : `${baseUrl}${detailLink}`
          });
        }
      }
    });

    console.log(`[Parser] Найдено ${projectUrls.length} ссылок для глубокого парсинга.`);

    // ЭТАП 2: Заходим внутрь каждого проекта
    let savedCount = 0;
    const scrapedResult = [];

    for (let i = 0; i < projectUrls.length; i++) {
      const item = projectUrls[i];
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

        // Сбор планировок и площадей. Если на странице их нет — оставляем пустыми,
        // НИКАКИХ значений по умолчанию: на сайте не должно быть выдуманных данных.
        const roomsSet = new Set();
        const areas = [];
        $detail('td, span, div').each((i, el) => {
          const text = $detail(el).text().trim();
          if (/^\d\+\d$/.test(text)) roomsSet.add(text);
          const areaMatch = text.match(/^(\d{2,4})\s*m²/);
          if (areaMatch) areas.push(parseInt(areaMatch[1], 10));
        });
        const roomsText = roomsSet.size > 0 ? Array.from(roomsSet).sort().join(', ') : null;
        const areaText = areas.length > 0 ? Math.min(...areas) : null; // минимальная площадь «от»

        // Модель проекта: только то, что реально найдено на странице.
        // Цена, этажность и дата стройки сюда НЕ подставляются — их вносим вручную после проверки.
        const projectData = {
          testproje: title,
          konutcesit: status,
          city: "Ankara",
          "İlçe/Semt": "Sincan",
          Açıklama: description || null,
          "card odalar": roomsText,
          "card-area": areaText,
          Özellikler: features || null,
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
          // Обновляем только поля, у которых есть новое значение — не затираем данные пустотой
          const updateData = { last_seen_at: projectData.last_seen_at, is_active: true };
          if (projectData["card odalar"]) updateData["card odalar"] = projectData["card odalar"];
          if (projectData["card-area"]) updateData["card-area"] = projectData["card-area"];
          if (projectData.Özellikler) updateData.Özellikler = projectData.Özellikler;

          const { error: updErr } = await supabase
            .from('properties')
            .update(updateData)
            .eq('id', existing.id);
          if (updErr) throw updErr;
          savedCount++;
        } else {
          const { error: insErr } = await supabase
            .from('properties')
            .insert(projectData);
          if (insErr) throw insErr;
          savedCount++;
        }

        scrapedResult.push({ isim: title, durum: status, odalar: roomsText, alan: areaText });

      } catch (err) {
        console.error(`Detay sayfası hatası (${item.url}):`, err.message);
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Sincan projeleri derinlemesine taranıp kaydedildi!', 
      scraped_projects_count: scrapedResult.length,
      saved_to_db_count: savedCount,
      projects: scrapedResult
    });

  } catch (error) {
    console.error("Ana sayfa tarama hatası:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
