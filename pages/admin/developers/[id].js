import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import { requireAdminPage } from '../../../lib/adminAuth';
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';
import { DEVELOPER_FIELDS } from '../../../lib/adminFields';

const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14, background: '#fff', fontFamily: 'inherit' };

function toValue(field, v) {
  if (v === null || v === undefined) return field.type === 'bool3' ? 'false' : '';
  if (field.type === 'bool3') return v ? 'true' : 'false';
  return String(v);
}

export default function EditDeveloper({ developer, isNew, members = [] }) {
  const router = useRouter();
  const [values, setValues] = useState(Object.fromEntries(DEVELOPER_FIELDS.map((f) => [f.key, toValue(f, developer?.[f.key])])));
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  async function save(e) {
    e.preventDefault();
    setSaving(true); setErrors({}); setMessage(null);
    try {
      const res = await fetch(`/api/admin/developers/${isNew ? 'new' : developer.id}`, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) { setErrors(json.fields || {}); throw new Error(json.error || 'Не удалось сохранить'); }
      if (isNew) { router.replace(`/admin/developers/${json.id}`); return; }
      setMessage({ ok: true, text: 'Сохранено' });
    } catch (err) {
      setMessage({ ok: false, text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout title={isNew ? 'Новый застройщик' : developer.name}>
      <form onSubmit={save}>
        <Link href="/admin/developers" style={{ color: '#64748b', fontSize: 13, textDecoration: 'none' }}>← Все застройщики</Link>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '6px 0 18px' }}>{isNew ? 'Новый застройщик' : values.name}</h1>

        {members.length > 0 && (
          <section style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 14, padding: 16, marginBottom: 16, fontSize: 14 }}>
            <b>Зарегистрировался через кабинет.</b> Контакт: {members.map((m) => `${m.contact_name || '—'}${m.contact_title ? ', ' + m.contact_title : ''} · ${m.phone || '—'} · ${m.email || '—'}`).join('; ')}
            <div style={{ marginTop: 6, color: '#92400e' }}>Проверьте vergi no на ivd.gib.gov.tr (Vergi Kimlik Numarası Sorgulama), затем поставьте «Статус кабинета: Проверен» и, если всё в порядке, «Проверен LansmanBul: Да».</div>
          </section>
        )}

        <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {DEVELOPER_FIELDS.map((f) => (
              <div key={f.key} style={{ gridColumn: f.type === 'textarea' ? '1 / -1' : undefined }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                  {f.label}{f.required && <span style={{ color: '#dc2626' }}> *</span>}
                </label>
                {f.type === 'textarea' ? (
                  <textarea rows={4} value={values[f.key]} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} />
                ) : f.type === 'bool3' || f.type === 'select' ? (
                  <select value={values[f.key]} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} style={inputStyle}>
                    {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <input value={values[f.key]} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} style={{ ...inputStyle, borderColor: errors[f.key] ? '#dc2626' : '#cbd5e1' }} />
                )}
                {errors[f.key] ? <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{errors[f.key]}</div>
                  : f.hint && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{f.hint}</div>}
              </div>
            ))}
          </div>
        </section>

        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <button type="submit" disabled={saving} style={{ padding: '12px 26px', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: 15, color: '#fff', background: saving ? '#94a3b8' : '#064e3b', cursor: saving ? 'default' : 'pointer' }}>
            {saving ? 'Сохраняю…' : isNew ? 'Создать' : 'Сохранить'}
          </button>
          {message && <span style={{ fontSize: 14, fontWeight: 600, color: message.ok ? '#059669' : '#dc2626' }}>{message.text}</span>}
        </div>
        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 12 }}>
          Значок «Doğrulanmış firma» ставьте только после проверки документов (vergi levhası, ticaret sicil gazetesi).
        </p>
      </form>
    </AdminLayout>
  );
}

export async function getServerSideProps(context) {
  const redirect = requireAdminPage(context);
  if (redirect) return redirect;
  if (context.params.id === 'new') return { props: { developer: null, isNew: true } };

  const id = Number(context.params.id);
  if (!Number.isInteger(id)) return { notFound: true };
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from('developers').select('*').eq('id', id).single();
  if (!data) return { notFound: true };
  const { data: memberRows } = await supabase.from('developer_members').select('user_id, contact_name, contact_title, phone').eq('developer_id', id);
  const members = [];
  for (const m of memberRows || []) {
    const { data: u } = await supabase.auth.admin.getUserById(m.user_id);
    members.push({ contact_name: m.contact_name, contact_title: m.contact_title, phone: m.phone, email: u?.user?.email || null });
  }
  return { props: { developer: data, isNew: false, members } };
}
