import { useState } from 'react';
import Link from 'next/link';
import AdminLayout, { StatusBadge } from '../../../components/admin/AdminLayout';
import ApprovalPanel from '../../../components/admin/ApprovalPanel';
import { siteOrigin } from '../../../lib/approvals';
import { requireAdminPage } from '../../../lib/adminAuth';
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';
import { FIELD_GROUPS, ALL_FIELDS, LISTING_STATUSES, toFormValue } from '../../../lib/adminFields';

const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14, background: '#fff', fontFamily: 'inherit' };

function Field({ field, value, onChange, error, developers = [] }) {
  let control;
  if (field.type === 'textarea') {
    control = <textarea rows={field.key === 'description' ? 8 : 4} value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />;
  } else if (field.type === 'developer') {
    control = (
      <select value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
        <option value="">— не указан —</option>
        {developers.map((d) => <option key={d.id} value={String(d.id)}>{d.name}{d.is_verified ? ' ✓' : ''}</option>)}
      </select>
    );
  } else if (field.type === 'select' || field.type === 'bool3') {
    control = (
      <select value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
        {field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  } else {
    control = (
      <input
        type="text"
        inputMode={field.type === 'int' || field.type === 'money' ? 'numeric' : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, borderColor: error ? '#dc2626' : '#cbd5e1' }}
      />
    );
  }

  const wide = field.type === 'textarea';
  return (
    <div style={{ gridColumn: wide ? '1 / -1' : undefined }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
        {field.label}{field.required && <span style={{ color: '#dc2626' }}> *</span>}
      </label>
      {control}
      {field.hint && !error && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{field.hint}</div>}
      {error && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{error}</div>}
    </div>
  );
}

export default function EditProject({ project, developers, approvals, origin }) {
  const initial = Object.fromEntries(ALL_FIELDS.map((f) => [f.key, toFormValue(f, project[f.key])]));
  const [values, setValues] = useState(initial);
  const [savedValues, setSavedValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  const dirty = JSON.stringify(values) !== JSON.stringify(savedValues);

  function set(key, v) {
    setValues((prev) => ({ ...prev, [key]: v }));
    setMessage(null);
  }

  async function save(e) {
    e?.preventDefault();
    setSaving(true);
    setErrors({});
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) {
        setErrors(json.fields || {});
        throw new Error(json.error || 'Не удалось сохранить');
      }
      setSavedValues(values);
      setMessage({ ok: true, text: 'Сохранено' });
    } catch (err) {
      setMessage({ ok: false, text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout title={project.name || `#${project.id}`}>
      <form onSubmit={save}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
          <div>
            <Link href="/admin" style={{ color: '#64748b', fontSize: 13, textDecoration: 'none' }}>← Все проекты</Link>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: '6px 0 8px' }}>{values.name || 'Без названия'}</h1>
            <StatusBadge status={values.listing_status} statuses={LISTING_STATUSES} />
            <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 10 }}>#{project.id}</span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link href={`/properties/${project.id}`} target="_blank" style={{ color: '#064e3b', fontSize: 14, fontWeight: 700 }}>Как выглядит на сайте ↗</Link>
          </div>
        </div>

        <ApprovalPanel
          projectId={project.id}
          projectName={values.name}
          approvals={approvals}
          origin={origin}
          onLinkCreated={() => {
            // ссылка переводит проект в «Ждёт одобрения» — синхронизируем форму, чтобы не затереть статус
            if (values.listing_status !== 'confirmed') {
              setValues((v) => ({ ...v, listing_status: 'pending_approval' }));
              setSavedValues((v) => ({ ...v, listing_status: 'pending_approval' }));
            }
          }}
        />

        {FIELD_GROUPS.map((group) => (
          <section key={group.title} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 14px', color: '#064e3b' }}>{group.title}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              {group.fields.map((f) => (
                <Field key={f.key} field={f} value={values[f.key]} onChange={(v) => set(f.key, v)} error={errors[f.key]} developers={developers} />
              ))}
            </div>
          </section>
        ))}

        <div style={{ position: 'sticky', bottom: 0, background: 'rgba(246,247,245,.95)', backdropFilter: 'blur(6px)', padding: '14px 0', display: 'flex', alignItems: 'center', gap: 14, borderTop: '1px solid #e5e7eb' }}>
          <button
            type="submit"
            disabled={saving || !dirty}
            style={{ padding: '12px 26px', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: 15, color: '#fff', background: saving || !dirty ? '#94a3b8' : '#064e3b', cursor: saving || !dirty ? 'default' : 'pointer' }}
          >
            {saving ? 'Сохраняю…' : 'Сохранить'}
          </button>
          {dirty && !message && <span style={{ fontSize: 13, color: '#b45309' }}>Есть несохранённые изменения</span>}
          {message && <span style={{ fontSize: 14, fontWeight: 600, color: message.ok ? '#059669' : '#dc2626' }}>{message.text}</span>}
        </div>
      </form>
    </AdminLayout>
  );
}

export async function getServerSideProps(context) {
  const redirect = requireAdminPage(context);
  if (redirect) return redirect;

  const id = Number(context.params.id);
  if (!Number.isInteger(id)) return { notFound: true };

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('properties')
    .select(['id', ...ALL_FIELDS.map((f) => f.key)].join(','))
    .eq('id', id)
    .single();

  if (error || !data) return { notFound: true };
  const { data: developers } = await supabase.from('developers').select('id, name, is_verified').order('name');
  const { data: approvals } = await supabase
    .from('project_approvals')
    .select('id, token, status, sent_to_phone, sent_at, opened_at, decided_at, expires_at, approver_name, approver_title, company_name, tax_number, approver_phone, allow_photos, allow_prices, correction_note')
    .eq('property_id', id)
    .order('sent_at', { ascending: false })
    .limit(5);
  return { props: { project: data, developers: developers || [], approvals: approvals || [], origin: siteOrigin(context.req) } };
}
