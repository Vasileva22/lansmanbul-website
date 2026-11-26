import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

// Общая рамка админки: шапка с логотипом и кнопкой выхода
export default function AdminLayout({ title, children }) {
  const router = useRouter();

  async function logout() {
    await fetch('/api/admin/login', { method: 'DELETE' });
    router.push('/admin/login');
  }

  return (
    <>
      <Head>
        <title>{title ? `${title} · ` : ''}LansmanBul Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div style={{ minHeight: '100vh', background: '#f6f7f5', fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#0f172a' }}>
        <header style={{ background: '#064e3b', color: '#fff' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontWeight: 800, fontSize: 18 }}>
              LANSMAN<span style={{ color: '#e7d3a7' }}>BUL</span>
              <span style={{ fontWeight: 500, fontSize: 13, opacity: 0.8, marginLeft: 10 }}>админка</span>
            </Link>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 14 }}>
              <Link href="/admin" style={{ color: '#fff', textDecoration: 'none' }}>Проекты</Link>
              <Link href="/admin/developers" style={{ color: '#fff', textDecoration: 'none' }}>Застройщики</Link>
              <Link href="/" target="_blank" style={{ color: '#e7d3a7', textDecoration: 'none' }}>Открыть сайт ↗</Link>
              <button onClick={logout} style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,.4)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>
                Выйти
              </button>
            </div>
          </div>
        </header>
        <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px 60px' }}>{children}</main>
      </div>
    </>
  );
}

export function StatusBadge({ status, statuses }) {
  const s = statuses.find((x) => x.value === status) || { label: status || '—', color: '#64748b' };
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, color: '#fff', background: s.color, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}
