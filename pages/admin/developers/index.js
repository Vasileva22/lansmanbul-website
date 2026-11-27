import Link from 'next/link';
import AdminLayout from '../../../components/admin/AdminLayout';
import { requireAdminPage } from '../../../lib/adminAuth';
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';

const cell = { padding: '12px 14px', borderBottom: '1px solid #e5e7eb', fontSize: 14 };

export default function Developers({ developers }) {
  return (
    <AdminLayout title="Застройщики">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, gap: 12 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Застройщики</h1>
        <Link href="/admin/developers/new" style={{ background: '#064e3b', color: '#fff', padding: '10px 16px', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
          + Добавить застройщика
        </Link>
      </div>
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
          <thead>
            <tr style={{ background: '#f8fafc', textAlign: 'left', color: '#475569', fontSize: 12, textTransform: 'uppercase' }}>
              <th style={cell}>Компания</th><th style={cell}>Кабинет</th><th style={cell}>Проверен</th><th style={cell}>Проектов на сайте</th><th style={cell}>Год основания</th>
            </tr>
          </thead>
          <tbody>
            {developers.length === 0 && (
              <tr><td colSpan={5} style={{ ...cell, textAlign: 'center', color: '#94a3b8', padding: 40 }}>Добавьте первого застройщика</td></tr>
            )}
            {developers.map((d) => (
              <tr key={d.id}>
                <td style={cell}><Link href={`/admin/developers/${d.id}`} style={{ color: '#064e3b', fontWeight: 700, textDecoration: 'none' }}>{d.name}</Link></td>
                <td style={cell}>{d.account_status === 'pending' ? <span style={{ color: '#b45309', fontWeight: 700 }}>⚑ ждёт проверки</span> : d.account_status === 'rejected' ? <span style={{ color: '#dc2626' }}>отклонён</span> : d.registered_via_cabinet ? 'активен' : '—'}</td>
                <td style={cell}>{d.is_verified ? <span style={{ color: '#059669', fontWeight: 700 }}>✓ да</span> : <span style={{ color: '#94a3b8' }}>нет</span>}</td>
                <td style={cell}>{d.projects}</td>
                <td style={cell}>{d.founded_year || '—'}</td>
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
  const { data } = await supabase.from('developers').select('id, name, is_verified, founded_year, account_status, registered_via_cabinet, created_at, properties(count)').order('name');
  const developers = (data || []).map((d) => ({ id: d.id, name: d.name, is_verified: d.is_verified, founded_year: d.founded_year, account_status: d.account_status, registered_via_cabinet: d.registered_via_cabinet, projects: d.properties?.[0]?.count || 0 }))
    .sort((a, b) => Number(b.account_status === 'pending') - Number(a.account_status === 'pending'));
  return { props: { developers } };
}
