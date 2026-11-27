// Сервер: курс доллара для порогов ВНЖ/гражданства.
// Берём из таблицы currency_rates; если курс старше суток — обновляем с сайта ЦБ Турции (TCMB).
import { getSupabaseAdmin } from './supabaseAdmin';

const DAY = 24 * 3600 * 1000;
let memo = null; // кэш на время жизни функции

export const CITIZENSHIP_USD = 400000; // гражданство через покупку недвижимости
export const RESIDENCE_USD = 200000; // ВНЖ через недвижимость в мегаполисах (Ankara — büyükşehir)

async function fetchTcmbUsd() {
  const r = await fetch('https://www.tcmb.gov.tr/kurlar/today.xml', { headers: { 'User-Agent': 'LansmanBul/1.0' } });
  if (!r.ok) throw new Error(`TCMB ${r.status}`);
  const xml = await r.text();
  const block = xml.match(/<Currency[^>]*CurrencyCode="USD"[\s\S]*?<\/Currency>/);
  const sell = block?.[0].match(/<ForexSelling>([\d.]+)<\/ForexSelling>/);
  const rate = sell ? Number(sell[1]) : NaN;
  if (!Number.isFinite(rate) || rate < 10 || rate > 1000) throw new Error('TCMB: kur okunamadı');
  return rate;
}

export async function getUsdRate() {
  if (memo && Date.now() - memo.at < 3600 * 1000) return memo;
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from('currency_rates').select('rate, updated_at').eq('currency', 'USD').maybeSingle();
  let rate = Number(data?.rate) || null;
  let updatedAt = data?.updated_at || null;
  const stale = !updatedAt || Date.now() - new Date(updatedAt).getTime() > DAY;
  if (stale) {
    try {
      rate = await fetchTcmbUsd();
      updatedAt = new Date().toISOString();
      await supabase.from('currency_rates').update({ rate, updated_at: updatedAt }).eq('currency', 'USD');
    } catch {
      // ЦБ недоступен — работаем со старым курсом, но помечаем дату
    }
  }
  memo = { rate, updatedAt, at: Date.now() };
  return memo;
}

// Что можно честно сказать иностранцу о проекте. Считается по самой ДОРОГОЙ планировке:
// проект подходит, если в нём есть квартиры от порога. Для справочных карточек цен не раскрываем — только да/нет.
export function foreignInfo(row, rate) {
  const maxPrice = Number(row.price_max || row.price_min) || null;
  const closedArea = row.in_open_area === false || row.is_open_area === false ? true : null;
  if (!rate || !maxPrice) return { closedArea, citizenship: null, residence: null };
  return {
    closedArea,
    citizenship: maxPrice >= CITIZENSHIP_USD * rate,
    residence: maxPrice >= RESIDENCE_USD * rate,
  };
}
