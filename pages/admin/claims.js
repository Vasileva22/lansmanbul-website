import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/admin/AdminLayout';
import { requireAdminPage } from '../../lib/adminAuth';
import { getSupabaseAdmin } from '../../lib/supabaseAdmin';

const DEV_STATUS = { pending: '⚑ ждёт проверки', active: '✓ проверен', blocked: 'заблокирован' };

function ClaimRow({ c }) {
  const router = useRouter();
  const [mode, setMode] = useState(null); // 'approve' | 'reject' — второй шаг вместо системного окна
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function decide(action) {
    setBusy(true); setError('');
    const r = await fetch(`/api/admin/claims/${c.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, note }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setError(j.error || 'Ошибка'); setBusy(false); return; }
    router.replace(router.asPath);
  }

  const btn = (bg, fg) => ({ padding: '8px 12px', borderRadius: 8, border: 'none', background: bg, color: fg, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' });
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16, display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{new Date(c.created_at).toLocaleString('ru-RU')}</div>
          <div style={{ fontWeight: 800 }}>
            Проект: <Link href={`/admin/projects/${c.property?.id}`} style={{ color: '#064e3b' }}>{c.property?.name || `#${c.property_id}`}</Link>
            {c.property?.district ? ` · ${c.property.district}` : ''}
          </div>
          <div style={{ fontSize: 14 }}>
            Компания: <Link href={`/admin/developers/${c.developer?.id}`} style={{ color: '#064e3b', fontWeight: 700 }}>{c.developer?.name}</Link>
            {' · '}{DEV_STATUS[c.developer?.account_status] || c.developer?.account_status}
            {c.developer?.tax_number ? ` · VKN ${c.developer.tax_number}` : ''}
          </div>
          {c.note && <div style={{ fontSize: 14, color: '#475569', marginTop: 4 }}>Комментарий застройщика: «{c.note}»</div>}
        </div>
        {!mode && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <button type="button" onClick={() => setMode('approve')} style={btn('#064e3b', '#fff')}>Подтвердить</button>
            <button type="button" onClick={() => setMode('reject')} style={btn('#f1f5f9', '#334155')}>Отклонить</button>
          </div>
        )}
      </div>
      {mode && (
        <div style={{ background: mode === 'approve' ? '#ecfdf5' : '#fef2f2', borderRadius: 10, padding: 12, display: 'grid', gap: 8 }}>
          <div style={{ fontSize: 14 }}>
            {mode === 'approve'
              ? 'Проект появится в кабинете этой компании, она сможет добавить фото и цены. На сайте он станет «Onaylı» только после проверки их данных.'
              : 'Застройщик увидит в кабинете, что запрос не одобрен. Можно написать причину (по-турецки).'}
          </div>
          {mode === 'reject' && <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Neden (ör. Firma doğrulanamadı)" style={{ padding: 8, borderRadius: 8, border: '1px solid #cbd5e1', fontFamily: 'inherit' }} />}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" disabled={busy} onClick={() => decide(mode)} style={btn(mode === 'approve' ? '#064e3b' : '#b91c1c', '#fff')}>
              {busy ? '…' : mode === 'approve' ? 'Да, привязать проект' : 'Да, отклонить'}
            </button>
            <button type="button" disabled={busy} onClick={() => setMode(null)} style={btn('#fff', '#334155')}>Отмена</button>
          </div>
          {error && <div style={{ color: '#b91c1c', fontSize: 13 }}>{error}</div>}
        </div>
      )}
    </div>
  );
}

export default function Claims({ pending, recent }) {
  return (
    <AdminLayout title="Запросы на проекты">
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px' }}>Запросы «Bu proje benim»</h1>
      <p style={{ color: '#64748b', margin: '0 0 18px', fontSize: 14 }}>Застройщик нашёл свой проект среди справочных карточек и просит привязать его к своей компании. Сверьте компанию (VKN) и проект.</p>
      <div style={{ display: 'grid', gap: 12 }}>
        {pending.length === 0 && <div style={{ color: '#94a3b8', padding: 30, textAlign: 'center', background: '#fff', borderRadius: 14 }}>Новых запросов нет</div>}
        {pending.map((c) => <ClaimRow key={c.id} c={c} />)}
      </div>
      {recent.length > 0 && (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: '28px 0 10px' }}>Недавние решения</h2>
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb' }}>
            {recent.map((c) => (
              <div key={c.id} style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', fontSize: 14 }}>
                {c.status === 'approved' ? '✓' : '✗'} {c.property?.name} → {c.developer?.name}
                <span style={{ color: '#94a3b8' }}> · {c.decided_at ? new Date(c.decided_at).toLocaleDateString('ru-RU') : ''}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </AdminLayout>
  );
}

export async function getServerSideProps(context) {
  const deny = requireAdminPage(context);
  if (deny) return deny;
  const sel = 'id, property_id, status, note, admin_note, created_at, decided_at, property:properties(id, name, district), developer:developers(id, name, account_status, tax_number)';
  const supabase = getSupabaseAdmin();
  const { data: pending } = await supabase.from('project_claims').select(sel).eq('status', 'pending').order('created_at');
  const { data: recent } = await supabase.from('project_claims').select(sel).neq('status', 'pending').order('decided_at', { ascending: false }).limit(15);
  return { props: { pending: pending || [], recent: recent || [] } };
}
