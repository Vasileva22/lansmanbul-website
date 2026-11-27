import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import CabinetLayout, { C, Field, inputStyle, primaryBtn } from '../../components/cabinet/CabinetLayout';
import { getBrowserSupabase } from '../../lib/supabaseBrowser';

// Новый пароль по ссылке из письма «Şifremi unuttum»
export default function NewPassword() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const sb = getBrowserSupabase();
    const { data } = sb.auth.onAuthStateChange((event) => { if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true); });
    sb.auth.getSession().then(({ data: s }) => { if (s?.session) setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (password.length < 8) { setMessage('En az 8 karakter'); return; }
    const { error } = await getBrowserSupabase().auth.updateUser({ password });
    if (error) setMessage(error.message);
    else router.push('/gelistirici');
  }

  return (
    <CabinetLayout title="Yeni şifre" narrow>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 16px' }}>Yeni şifre belirleyin</h1>
      {!ready ? (
        <p style={{ color: C.muted }}>Bağlantı kontrol ediliyor… Sayfa açılmazsa e-postadaki bağlantıyı tekrar açın.</p>
      ) : (
        <form onSubmit={submit} style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 16, padding: 20, display: 'grid', gap: 14 }}>
          <Field label="Yeni şifre" hint="En az 8 karakter"><input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} /></Field>
          {message && <div style={{ color: C.danger, fontSize: 14 }}>{message}</div>}
          <button type="submit" style={primaryBtn(false)}>Kaydet</button>
        </form>
      )}
    </CabinetLayout>
  );
}
