import Head from 'next/head';
import Link from 'next/link';

export const C = { green: '#0F6E56', dark: '#04342C', muted: '#5B6B68', line: '#e2e8e6', bg: '#f6f7f5', danger: '#dc2626', amberBg: '#FAEEDA', amberText: '#633806', mint: '#E1F5EE' };
export const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '11px 12px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 15, fontFamily: 'inherit', background: '#fff' };
export const primaryBtn = (disabled) => ({ padding: '12px 18px', borderRadius: 10, border: 'none', background: disabled ? '#94a3b8' : C.green, color: '#fff', fontWeight: 700, fontSize: 15, fontFamily: 'inherit', cursor: disabled ? 'default' : 'pointer', textDecoration: 'none', display: 'inline-block', textAlign: 'center' });

// Рамка кабинета застройщика
export default function CabinetLayout({ title, right, children, narrow = false }) {
  return (
    <>
      <Head>
        <title>{title ? `${title} · ` : ''}LansmanBul Geliştirici Paneli</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#0f172a' }}>
        <header style={{ background: C.dark, color: '#E1F5EE' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 800, fontSize: 17 }}>
              LANSMAN<span style={{ color: '#e7d3a7' }}>BUL</span>
              <span style={{ fontWeight: 500, fontSize: 13, opacity: 0.8, marginLeft: 10 }}>Geliştirici paneli</span>
            </Link>
            <div style={{ fontSize: 13 }}>{right}</div>
          </div>
        </header>
        <main style={{ maxWidth: narrow ? 520 : 1000, margin: '0 auto', padding: '24px 16px 60px' }}>{children}</main>
      </div>
    </>
  );
}

export function Field({ label, error, hint, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{label}</label>
      {children}
      {error ? <div className="lb-err" style={{ fontSize: 12, color: C.danger, marginTop: 4 }}>{error}</div>
        : hint ? <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{hint}</div> : null}
    </div>
  );
}
