// Одобрение карточки застройщиком: общие функции для админки и страницы /onay/[token]

export function siteOrigin(req) {
  const host = req?.headers?.['x-forwarded-host'] || req?.headers?.host || 'lansmanbul.com';
  const proto = req?.headers?.['x-forwarded-proto'] || 'https';
  return `${proto}://${host}`;
}

export function approvalUrl(req, token) {
  return `${siteOrigin(req)}/onay/${token}`;
}

// Готовое сообщение застройщику (турецкий)
export function approvalMessage(projectName, url) {
  return [
    'Merhaba,',
    `LansmanBul, Ankara'daki yeni konut projelerini alıcılar için tek yerde toplayan bir platformdur. "${projectName}" projeniz sitemizde bilgi kartı olarak yer alıyor.`,
    'Fotoğraf, fiyat ve planlarınızın da yayınlanması için sayfanızı ücretsiz olarak onaylayabilirsiniz. Önizleme ve onay linki:',
    url,
    'Onaylı projeler listede üstte ve "Onaylı proje" rozetiyle gösterilir. Herhangi bir düzeltme isterseniz aynı sayfadan iletebilirsiniz.',
    'Teşekkürler, LansmanBul',
  ].join('\n\n');
}

export function whatsappLink(phone, text) {
  const digits = String(phone || '').replace(/\D/g, '');
  const normalized = digits.startsWith('0') ? '9' + digits : digits.length === 10 ? '90' + digits : digits;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}

export const APPROVAL_STATUS_LABELS = {
  sent: { label: 'Ссылка отправлена', color: '#64748b' },
  opened: { label: 'Застройщик открыл', color: '#0ea5e9' },
  approved: { label: 'Одобрено — проверьте', color: '#f59e0b' },
  needs_changes: { label: 'Просит исправить', color: '#ea580c' },
  rejected: { label: 'Отказался', color: '#dc2626' },
  expired: { label: 'Истекла', color: '#94a3b8' },
  published: { label: 'Опубликовано', color: '#059669' },
};
