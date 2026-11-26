import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { isAdminRequest } from '../../lib/adminAuth';

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Ошибка входа');
      router.push('/admin');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Вход · LansmanBul Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#064e3b', fontFamily: "'Plus Jakarta Sans', sans-serif", padding: 20 }}>
        <form onSubmit={submit} style={{ background: '#fff', borderRadius: 18, padding: 32, width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>
          <div style={{ fontWeight: 800, fontSize: 22, color: '#064e3b', marginBottom: 4 }}>
            LANSMAN<span style={{ color: '#b8964f' }}>BUL</span>
          </div>
          <div style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>Вход в админку</div>

          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#0f172a' }}>Пароль</label>
          <input
            type="password"
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 15, outline: 'none' }}
          />

          {error && <div style={{ color: '#dc2626', fontSize: 13, marginTop: 10 }}>{error}</div>}

          <button
            type="submit"
            disabled={loading || !password}
            style={{ marginTop: 20, width: '100%', padding: '12px 14px', borderRadius: 10, border: 'none', background: loading || !password ? '#94a3b8' : '#064e3b', color: '#fff', fontWeight: 700, fontSize: 15, cursor: loading || !password ? 'default' : 'pointer' }}
          >
            {loading ? 'Проверяю…' : 'Войти'}
          </button>
        </form>
      </div>
    </>
  );
}

export async function getServerSideProps(context) {
  if (isAdminRequest(context.req)) {
    return { redirect: { destination: '/admin', permanent: false } };
  }
  return { props: {} };
}
