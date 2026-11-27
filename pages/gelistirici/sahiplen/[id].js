import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import CabinetLayout, { C, inputStyle, primaryBtn, Field } from '../../../components/cabinet/CabinetLayout';
import { getBrowserSupabase, cabinetFetch } from '../../../lib/supabaseBrowser';

const WA = '905459418536';

// «Bu proje benim»: застройщик забирает себе справочную карточку проекта
export default function ClaimProject() {
  const router = useRouter();
  const id = Number(router.query.id);
  const [project, setProject] = useState(null);
  const [session, setSession] = useState(undefined); // undefined = ещё проверяем
  const [note, setNote] = useState('');
  const [state, setState] = useState({ busy: false, done: false, error: '' });

  useEffect(() => {
    if (!router.isReady || !Number.isInteger(id)) return;
    fetch(`/api/catalog?ids=${id}`).then((r) => r.json()).then((rows) => setProject(rows?.[0] || false)).catch(() => setProject(false));
    getBrowserSupabase().auth.getSession().then(({ data }) => setSession(data?.session || null));
  }, [router.isReady, id]);

  async function send() {
    setState({ busy: true, done: false, error: '' });
    try {
      await cabinetFetch('/api/gelistirici/claims', { method: 'POST', body: JSON.stringify({ property_id: id, note }) });
      setState({ busy: false, done: true, error: '' });
    } catch (err) {
      if (err.status === 401) { router.replace(`/gelistirici/giris?proje=${id}`); return; }
      setState({ busy: false, done: false, error: err.message });
    }
  }

  const name = project?.testproje || 'Proje';
  const place = project?.['İlçe/Semt'] || '';
  const wa = `https://wa.me/${WA}?text=${encodeURIComponent(`Merhaba, lansmanbul.com'daki "${name}" projesinin yetkilisiyim.`)}`;
  const card = { background: '#fff', border: `1px solid ${C.line}`, borderRadius: 16, padding: 24, display: 'grid', gap: 16 };

  if (project === false) {
    return <CabinetLayout title="Proje" narrow><div style={card}><p>Proje bulunamadı.</p><Link href="/">← Siteye dön</Link></div></CabinetLayout>;
  }

  return (
    <CabinetLayout title="Projeyi sahiplen" narrow>
      <div style={card}>
        <div>
          <div style={{ fontSize: 13, color: C.muted }}>Projenin sahibi misiniz?</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '4px 0 2px' }}>{project ? name : '…'}</h1>
          {place && <div style={{ fontSize: 14, color: C.muted }}>{place}</div>}
        </div>

        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.7, color: '#334155' }}>
          <li>Fiyat, fotoğraf ve ödeme koşullarını kendiniz ekleyin</li>
          <li>Proje sayfası «✓ Onaylı proje» olarak öne çıksın</li>
          <li>Görüntülenme ve WhatsApp tıklamalarını panelinizde görün</li>
          <li>Ücretsiz — alıcıdan veya sizden komisyon alınmaz</li>
        </ul>

        {state.done ? (
          <div style={{ background: C.mint, color: '#085041', borderRadius: 12, padding: 14, fontSize: 14, lineHeight: 1.5 }}>
            <b>Talebiniz alındı.</b> Firmanızı ve projeyi kontrol edip genellikle 1 iş günü içinde projeyi panelinize ekliyoruz.
            <div style={{ marginTop: 10 }}><Link href="/gelistirici" style={{ color: '#085041', fontWeight: 700 }}>Panele git →</Link></div>
          </div>
        ) : session === undefined ? (
          <p style={{ color: C.muted, margin: 0 }}>Yükleniyor…</p>
        ) : session ? (
          <>
            <Field label="Not (isteğe bağlı)" hint="Ör. projedeki göreviniz veya doğrulama için bir bilgi">
              <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />
            </Field>
            {state.error && <div className="lb-err" style={{ color: C.danger, fontSize: 14 }}>{state.error}</div>}
            <button type="button" disabled={state.busy || !project} onClick={send} style={primaryBtn(state.busy || !project)}>
              {state.busy ? 'Gönderiliyor…' : 'Bu proje benim — talep gönder'}
            </button>
          </>
        ) : (
          <>
            <Link href={`/gelistirici/kayit?proje=${id}`} style={{ ...primaryBtn(false), textAlign: 'center', textDecoration: 'none' }}>Ücretsiz kayıt ol</Link>
            <div style={{ textAlign: 'center', fontSize: 14 }}>
              Hesabınız var mı? <Link href={`/gelistirici/giris?proje=${id}`} style={{ color: C.green, fontWeight: 700 }}>Giriş yapın</Link>
            </div>
          </>
        )}

        <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 12, fontSize: 13, color: C.muted, textAlign: 'center' }}>
          Kayıt olmak istemiyor musunuz? <a href={wa} target="_blank" rel="noopener noreferrer" style={{ color: C.green, fontWeight: 700 }}>WhatsApp ile yazın</a>
        </div>
      </div>
    </CabinetLayout>
  );
}
