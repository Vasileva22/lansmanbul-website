// Админка: проект, добавленный застройщиком через кабинет — что проверить и журнал изменений
const FIELD_RU = {
  name: 'Название', description: 'Описание', features: 'Удобства', district: 'Район', neighborhood: 'Микрорайон', address: 'Адрес',
  latitude: 'Точка на карте', longitude: 'Точка на карте', project_status: 'Статус продаж', construction_stage: 'Этап стройки',
  stage_updated_at: null, delivery_year: 'Год сдачи', delivery_month: 'Месяц сдачи', floor_count: 'Этажей', block_count: 'Корпусов',
  unit_count: 'Квартир', layouts: 'Планировки', room_types: null, area_min: null, area_max: null, price_min: 'Цена от', price_max: null,
  down_payment_percent: 'Первый взнос %', installment_months: 'Рассрочка, мес.', interest_free: 'Без процентов', credit_eligible: 'Ипотека',
  contact_whatsapp: 'WhatsApp', publish_prices: 'Показывать цены', publish_photos: null, listing_status: 'Статус', submitted_at: null,
  building_permit_path: 'Документ ruhsat', has_building_permit: null, photo_rights_confirmed_at: 'Подтверждение прав на фото',
  photos: 'Фото (кол-во)', construction_photos: 'Фото стройки (кол-во)',
};
const EVENTS = { created: 'Создан черновик', submitted: 'Отправлен на проверку', live_edit: 'Правка опубликованного проекта' };

const short = (v) => {
  if (v === null || v === undefined || v === '') return '—';
  if (Array.isArray(v)) return `${v.length} шт.`;
  if (typeof v === 'object') return '…';
  const s = String(v);
  return s.length > 40 ? s.slice(0, 40) + '…' : s;
};

export default function CabinetReviewPanel({ cabinet, status }) {
  const box = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 20, marginBottom: 16 };
  const check = (ok, text) => <li style={{ color: ok ? '#059669' : '#b45309' }}>{ok ? '✓' : '!'} {text}</li>;
  return (
    <section style={{ ...box, borderColor: status === 'in_review' ? '#f59e0b' : '#e5e7eb' }}>
      <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 6px', color: '#064e3b' }}>Проект из кабинета застройщика</h2>
      {status === 'in_review' && (
        <p style={{ background: '#FAEEDA', color: '#633806', borderRadius: 10, padding: '10px 12px', fontSize: 14, margin: '0 0 12px' }}>
          <b>Ждёт вашей проверки.</b> Посмотрите фото, описание и точку на карте. Если всё в порядке — поставьте статус «Подтверждена» и сохраните: проект появится на сайте.
          Если нет — напишите застройщику, что исправить.
        </p>
      )}
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px', fontSize: 14, lineHeight: 1.8 }}>
        {check(Boolean(cabinet.submitted_at), cabinet.submitted_at ? `Отправлен на проверку ${new Date(cabinet.submitted_at).toLocaleString('ru-RU')}` : 'Ещё не отправлен (черновик)')}
        {check(Boolean(cabinet.photo_rights_confirmed_at), 'Застройщик подтвердил права на фото')}
        {check(Number.isFinite(cabinet.latitude), Number.isFinite(cabinet.latitude)
          ? <a href={`https://www.openstreetmap.org/?mlat=${cabinet.latitude}&mlon=${cabinet.longitude}#map=17/${cabinet.latitude}/${cabinet.longitude}`} target="_blank" rel="noreferrer">Точка на карте ↗</a>
          : 'Нет точки на карте')}
        {cabinet.permitUrl
          ? <li>📄 <a href={cabinet.permitUrl} target="_blank" rel="noreferrer">Открыть документ ruhsat ↗</a> — если документ настоящий, поставьте ниже «Ruhsat проверен: Да»</li>
          : <li style={{ color: '#64748b' }}>Документ ruhsat не загружен (необязательно)</li>}
      </ul>

      {(cabinet.photos.length > 0 || cabinet.construction.length > 0) && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {[...cabinet.photos, ...cabinet.construction].map((u, i) => (
            <a key={u} href={u} target="_blank" rel="noreferrer">
              <img src={u} alt="" style={{ width: 96, height: 72, objectFit: 'cover', borderRadius: 8, border: i >= cabinet.photos.length ? '2px solid #f59e0b' : '1px solid #e5e7eb' }} />
            </a>
          ))}
        </div>
      )}

      <details>
        <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>Журнал изменений ({cabinet.log.length})</summary>
        <div style={{ fontSize: 13, marginTop: 8 }}>
          {cabinet.log.map((e) => {
            const { _event, ...rest } = e.changes || {};
            const rows = Object.entries(rest).filter(([k]) => FIELD_RU[k] !== null);
            return (
              <div key={e.id} style={{ borderTop: '1px solid #f1f5f9', padding: '6px 0' }}>
                <b>{new Date(e.created_at).toLocaleString('ru-RU')}</b>{_event ? ` · ${EVENTS[_event] || _event}` : ''}
                <div style={{ color: '#475569' }}>
                  {rows.map(([k, v]) => <div key={k}>{FIELD_RU[k] || k}: {short(v?.[0])} → {short(v?.[1])}</div>)}
                </div>
              </div>
            );
          })}
        </div>
      </details>
    </section>
  );
}
