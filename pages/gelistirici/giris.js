import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import CabinetLayout, { C, Field, inputStyle, primaryBtn } from '../../components/cabinet/CabinetLayout';
import { getBrowserSupabase } from '../../lib/supabaseBrowser';

export default function DeveloperLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [info, setInfo] = useState('');
  const [sending, setSending] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMessage(''); setInfo('');
    setSending(true);
    try {
      const { error } = await getBrowserSupabase().auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        if (/confirm/i.test(error.message)) throw new Error('E-posta adresiniz henüz onaylanmadı. Gelen kutunuzdaki bağlantıya tıklayın.');
        throw new Error('E-posta veya şifre hatalı.');
      }
      router.push('/gelistirici');
    } catch (err) {
      setMessage(err.message);
      setSending(false);
    }
  }

  async function resetPassword() {
    setMessage(''); setInfo('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setMessage('Önce e-posta adresinizi yazın.'); return; }
    const { error } = await getBrowserSupabase().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/gelistirici/sifre` });
    if (error) setMessage(error.message);
    else setInfo('Şifre yenileme bağlantısı e-postanıza gönderildi.');
  }

  return (
    <CabinetLayout title="Giriş" narrow right={<Link href="/gelistirici/kayit" style={{ color: '#e7d3a7' }}>Kayıt ol</Link>}>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 18px' }}>Geliştirici girişi</h1>
      <form onSubmit={submit} style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 16, padding: 20, display: 'grid', gap: 14 }}>
        <Field label="E-posta"><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} /></Field>
        <Field label="Şifre"><input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} /></Field>
        {message && <div style={{ color: C.danger, fontSize: 14 }}>{message}</div>}
        {info && <div style={{ color: C.green, fontSize: 14 }}>{info}</div>}
        <button type="submit" disabled={sending || !email || !password} style={primaryBtn(sending || !email || !password)}>{sending ? 'Giriş yapılıyor…' : 'Giriş yap'}</button>
        <button type="button" onClick={resetPassword} style={{ background: 'none', border: 'none', color: C.green, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Şifremi unuttum</button>
        <div style={{ fontSize: 14, color: C.muted, textAlign: 'center' }}>
          Hesabınız yok mu? <Link href="/gelistirici/kayit" style={{ color: C.green, fontWeight: 700 }}>Ücretsiz kayıt olun</Link>
        </div>
      </form>
    </CabinetLayout>
  );
}
