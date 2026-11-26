import { useMemo, useState } from 'react';
import Link from 'next/link';
import AdminLayout, { StatusBadge } from '../../components/admin/AdminLayout';
import { requireAdminPage } from '../../lib/adminAuth';
import { getSupabaseAdmin } from '../../lib/supabaseAdmin';
import { LISTING_STATUSES } from '../../lib/adminFields';
import { formatTL, formatDelivery } from '../../lib/projects';

const cell = { padding: '12px 14px', borderBottom: '1px solid #e5e7eb', fontSize: 14, verticalAlign: 'middle' };

export default function AdminHome({ projects }) {
  const [tab, setTab] = useState('active');
  const [query, setQuery] = useState('');

  const counts = useMemo(() => {
    const c = { active: 0 };
    for (const p of projects) {
      c[p.listing_status] = (c[p.listing_status] || 0) + 1;
      if (p.listing_status !== 'archived') c.active += 1;
    }
    return c;
  }, [projects]);

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr');
    return projects.filter((p) => {
      if (tab === 'active' && p.listing_status === 'archived') return false;
      if (tab !== 'active' && p.listing_status !== tab) return false;
      if (!q) return true;
      return [p.name, p.district, p.neighborhood].filter(Boolean).join(' ').toLocaleLowerCase('tr').includes(q);
    });
  }, [projects, tab, query]);

  const tabs = [{ value: 'active', label: 'Все рабочие' }, ...LISTING_STATUSES];

  return (
    <AdminLayout title="Проекты">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Проекты</h1>
        <input
          placeholder="Поиск по названию или району"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid #cbd5e1', minWidth: 280, fontSize: 14 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            style={{
              padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              border: tab === t.value ? '1.5px solid #064e3b' : '1.5px solid #d1d5db',
              background: tab === t.value ? '#064e3b' : '#fff',
              color: tab === t.value ? '#fff' : '#334155',
            }}
          >
            {t.label} <span style={{ opacity: 0.7 }}>{counts[t.value] || 0}</span>
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
          <thead>
            <tr style={{ background: '#f8fafc', textAlign: 'left', color: '#475569', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              <th style={cell}>Проект</th>
              <th style={cell}>Район</th>
              <th style={cell}>Статус</th>
              <th style={cell}>Цена от</th>
              <th style={cell}>Сдача</th>
              <th style={cell}></th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr><td colSpan={6} style={{ ...cell, textAlign: 'center', color: '#94a3b8', padding: 40 }}>Здесь пока пусто</td></tr>
            )}
            {visible.map((p) => (
              <tr key={p.id}>
                <td style={cell}>
                  <Link href={`/admin/projects/${p.id}`} style={{ color: '#064e3b', fontWeight: 700, textDecoration: 'none' }}>
                    {p.name || <i style={{ color: '#94a3b8' }}>без названия</i>}
                  </Link>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>#{p.id}{p.source_name ? ` · ${p.source_name}` : ''}</div>
                </td>
                <td style={cell}>{[p.district, p.neighborhood].filter(Boolean).join(', ') || '—'}</td>
                <td style={cell}><StatusBadge status={p.listing_status} statuses={LISTING_STATUSES} /></td>
                <td style={cell}>{formatTL(p.price_min) || '—'}</td>
                <td style={cell}>{formatDelivery(p.delivery_year, p.delivery_month) || '—'}</td>
                <td style={{ ...cell, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <Link href={`/properties/${p.id}`} target="_blank" style={{ color: '#475569', fontSize: 13, marginRight: 14 }}>Просмотр ↗</Link>
                  <Link href={`/admin/projects/${p.id}`} style={{ color: '#064e3b', fontSize: 13, fontWeight: 700 }}>Изменить</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

export async function getServerSideProps(context) {
  const redirect = requireAdminPage(context);
  if (redirect) return redirect;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('properties')
    .select('id, name, district, neighborhood, listing_status, price_min, delivery_year, delivery_month, source_name, updated_at')
    .order('id', { ascending: false });

  if (error) console.error('[admin] list error', error.message);
  return { props: { projects: data || [] } };
}
