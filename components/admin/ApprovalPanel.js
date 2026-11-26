import { useState } from 'react';
import { APPROVAL_STATUS_LABELS, approvalMessage, whatsappLink } from '../../lib/approvals';

const box = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 20, marginBottom: 16 };
const btn = (bg) => ({ padding: '10px 16px', borderRadius: 10, border: 'none', background: bg, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', textDecoration: 'none', display: 'inline-block' });

function fmt(iso) {
  return iso ? new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
}

// Блок «Одобрение застройщика» на странице проекта в админке
export default function ApprovalPanel({ projectId, projectName, approvals: initial, origin, onLinkCreated }) {
  const [approvals, setApprovals] = useState(initial || []);
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false); // двухшаговое подтверждение вместо системного окна

  const latest = approvals[0];
  const latestUrl = latest ? `${origin}/onay/${latest.token}` : '';
  const text = latest ? approvalMessage(projectName, latestUrl) : '';
  const active = latest && ['sent', 'opened'].includes(latest.status);

  async function createLink() {
    setBusy(true); setError('');
    try {
      const res = await fetch(`/api/admin/projects/${projectId}/approvals`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Ошибка');
      onLinkCreated && onLinkCreated();
      setApprovals([json.approval, ...approvals.map((a) => (['sent', 'opened'].includes(a.status) ? { ...a, status: 'expired' } : a))]);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  async function publish(id) {
    if (!confirmPublish) { setConfirmPublish(true); return; }
    setBusy(true); setError('');
    try {
      const res = await fetch(`/api/admin/approvals/${id}/publish`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Ошибка');
      window.location.reload();
    } catch (e) { setError(e.message); setBusy(false); }
  }

  async function copy() {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* браузер не дал доступ к буферу */ }
  }

  return (
    <section style={box}>
      <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 6px', color: '#064e3b' }}>Одобрение застройщика</h2>
      <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 14px' }}>
        Застройщик получает закрытую ссылку, видит свою карточку с фото и ценами и подтверждает публикацию.
      </p>

      {latest && (
        <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 14 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
            <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, color: '#fff', background: (APPROVAL_STATUS_LABELS[latest.status] || {}).color }}>
              {(APPROVAL_STATUS_LABELS[latest.status] || {}).label || latest.status}
            </span>
            <span style={{ color: '#64748b', fontSize: 12 }}>создана {fmt(latest.sent_at)}{latest.opened_at ? ` · открыта ${fmt(latest.opened_at)}` : ''}</span>
          </div>

          {active && (
            <>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Ссылка (действует до {fmt(latest.expires_at)}):</div>
              <div style={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: 12, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 8, marginBottom: 10 }}>{latestUrl}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {latest.sent_to_phone && <a href={whatsappLink(latest.sent_to_phone, text)} target="_blank" rel="noopener noreferrer" style={btn('#16a34a')}>Открыть WhatsApp с сообщением</a>}
                <button type="button" onClick={copy} style={btn('#475569')}>{copied ? 'Скопировано ✓' : 'Скопировать сообщение'}</button>
                <a href={latestUrl} target="_blank" rel="noopener noreferrer" style={{ ...btn('#fff'), color: '#064e3b', border: '1px solid #064e3b' }}>Как увидит застройщик ↗</a>
              </div>
            </>
          )}

          {['approved', 'needs_changes', 'rejected', 'published'].includes(latest.status) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8, fontSize: 13 }}>
              <div><b>Кто:</b> {latest.approver_name || '—'}{latest.approver_title ? `, ${latest.approver_title}` : ''}</div>
              <div><b>Компания:</b> {latest.company_name || '—'}</div>
              <div><b>Vergi no:</b> {latest.tax_number || '—'}</div>
              <div><b>Телефон:</b> {latest.approver_phone || '—'}</div>
              <div><b>Решение:</b> {fmt(latest.decided_at)}</div>
              {latest.status !== 'rejected' && latest.status !== 'needs_changes' && (
                <div><b>Разрешил:</b> {[latest.allow_photos && 'фото', latest.allow_prices && 'цены', 'планировки'].filter(Boolean).join(', ')}</div>
              )}
              {latest.correction_note && <div style={{ gridColumn: '1 / -1' }}><b>Просит исправить:</b> {latest.correction_note}</div>}
            </div>
          )}

          {latest.status === 'approved' && (
            <div style={{ marginTop: 12, padding: 12, background: '#fffbeb', borderRadius: 8, fontSize: 13 }}>
              Перед публикацией проверьте vergi no на <a href="https://ivd.gib.gov.tr/" target="_blank" rel="noopener noreferrer">ivd.gib.gov.tr</a> (Vergi Kimlik Numarası Sorgulama) и что компания действительно строит этот проект.
              <div style={{ marginTop: 10 }}>
                <button type="button" disabled={busy} onClick={() => publish(latest.id)} style={btn(confirmPublish ? '#b45309' : '#059669')}>
                  {confirmPublish ? 'Точно опубликовать? Нажмите ещё раз' : 'Проверено — опубликовать'}
                </button>
                {confirmPublish && <button type="button" onClick={() => setConfirmPublish(false)} style={{ ...btn('#fff'), color: '#475569', border: '1px solid #cbd5e1', marginLeft: 8 }}>Отмена</button>}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 220px' }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>WhatsApp застройщика (официальный номер компании)</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0312 xxx xx xx или 05xx…" style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14 }} />
        </div>
        <button type="button" disabled={busy} onClick={createLink} style={btn(busy ? '#94a3b8' : '#064e3b')}>
          {latest ? 'Создать новую ссылку' : 'Создать ссылку для застройщика'}
        </button>
      </div>
      {latest && active && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>Новая ссылка отменит текущую.</div>}
      {error && <div style={{ color: '#dc2626', fontSize: 13, marginTop: 8 }}>{error}</div>}
    </section>
  );
}
