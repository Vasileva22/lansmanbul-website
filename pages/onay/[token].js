import { useState } from 'react';
import Head from 'next/head';
import PropertyCard from '../../components/PropertyCard';
import { getSupabaseAdmin } from '../../lib/supabaseAdmin';
import { toCardShape, formatTL, formatDelivery } from '../../lib/projects';

const C = { green: '#0F6E56', dark: '#064e3b', muted: '#5B6B68', line: '#e2e8e6', bg: '#f6f7f5', danger: '#dc2626' };
const input = { width: '100%', boxSizing: 'border-box', padding: '11px 12px', borderRadius: 10, border: `1.5px solid #cbd5e1`, fontSize: 15, fontFamily: 'inherit', background: '#fff' };

function Shell({ children }) {
  return (
    <>
      <Head>
        <title>Proje onayı · LansmanBul</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#0f172a' }}>
        <header style={{ background: C.dark, color: '#fff', padding: '16px 20px' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto', fontWeight: 800, fontSize: 18 }}>
            LANSMAN<span style={{ color: '#e7d3a7' }}>BUL</span>
            <span style={{ fontWeight: 500, fontSize: 13, opacity: 0.8, marginLeft: 10 }}>Proje onayı</span>
          </div>
        </header>
        <main style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px 60px' }}>{children}</main>
      </div>
    </>
  );
}

function Message({ title, text }) {
  return (
    <Shell>
      <div style={{ background: '#fff', borderRadius: 16, padding: 32, textAlign: 'center', border: `1px solid ${C.line}` }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 10px' }}>{title}</h1>
        <p style={{ color: C.muted, margin: 0, lineHeight: 1.6 }}>{text}</p>
      </div>
    </Shell>
  );
}

function Check({ checked, onChange, children, error }) {
  return (
    <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, lineHeight: 1.5, cursor: 'pointer', padding: '6px 0' }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ width: 18, height: 18, marginTop: 2, accentColor: C.green, flexShrink: 0 }} />
      <span>
        {children}
        {error && <span className="lb-err" style={{ display: 'block', color: C.danger, fontSize: 12 }}>{error}</span>}
      </span>
    </label>
  );
}

export default function ApprovalPage({ state, token, project }) {
  const [form, setForm] = useState({
    approver_name: '', approver_title: '', company_name: project?.developer?.name || '', tax_number: '', approver_phone: '',
    allow_photos: true, allow_prices: true, consent_authority: false, consent_media_rights: false, consent_kvkk: false, correction_note: '',
  });
  const [mode, setMode] = useState('approve');
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(null);

  if (state === 'invalid') return <Message title="Bağlantı geçersiz" text="Bu onay bağlantısı bulunamadı. Lütfen size gönderilen bağlantıyı kontrol edin veya bizimle iletişime geçin." />;
  if (state === 'used') return <Message title="Bu bağlantı kullanıldı" text="Bu proje için yanıtınız daha önce kaydedildi. Değişiklik için bizimle WhatsApp üzerinden iletişime geçebilirsiniz." />;
  if (state === 'expired') return <Message title="Bağlantının süresi doldu" text="Yeni bir onay bağlantısı için bizimle iletişime geçin." />;
  if (done === 'approved') return <Message title="Teşekkürler, onayınız alındı" text="Sayfanız kısa bir kontrolden sonra 'Onaylı proje' rozetiyle yayınlanacak. Yayınlandığında size haber vereceğiz." />;
  if (done === 'needs_changes') return <Message title="Düzeltme talebiniz alındı" text="Belirttiğiniz değişiklikleri yapıp size yeni bir önizleme bağlantısı göndereceğiz." />;
  if (done === 'rejected') return <Message title="Talebiniz alındı" text="Projeniz LansmanBul'da yayından kaldırıldı. Fikrinizi değiştirirseniz bize her zaman yazabilirsiniz." />;

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); setMessage(''); };

  async function submit(e) {
    e.preventDefault();
    setSending(true); setMessage(''); setErrors({});
    try {
      const decision = mode;
      const res = await fetch(`/api/onay/${token}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, decision }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors(json.fields || {});
        // прокручиваем к первому полю с ошибкой, чтобы было видно, что исправить
        setTimeout(() => document.querySelector('.lb-err')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
        throw new Error(json.error || 'Bir hata oluştu.');
      }
      setDone(json.status);
      window.scrollTo(0, 0);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSending(false);
    }
  }

  const field = (key, label, props = {}) => (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{label}</label>
      <input value={form[key]} onChange={(e) => set(key, e.target.value)} style={{ ...input, borderColor: errors[key] ? C.danger : '#cbd5e1' }} {...props} />
      {errors[key] && <div className="lb-err" style={{ fontSize: 12, color: C.danger, marginTop: 4 }}>{errors[key]}</div>}
    </div>
  );

  const facts = [
    ['Konum', project['İlçe/Semt']],
    ['Durum', project.konutcesit],
    ['Teslim', formatDelivery(project.delivery_year, project.delivery_month)],
    ['Planlar', project['card odalar']],
    ['Alan', project.area_min ? `${project.area_min}${project.area_max && project.area_max !== project.area_min ? '–' + project.area_max : ''} m²` : ''],
    ['Fiyat', project.price_min ? formatTL(project.price_min) + (project.price_max > project.price_min ? "'den itibaren" : '') : ''],
  ].filter(([, v]) => v);

  return (
    <Shell>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>{project.testproje}</h1>
      <p style={{ color: C.muted, margin: '0 0 22px', lineHeight: 1.6, maxWidth: 720 }}>
        Projeniz LansmanBul'da şu an <b>bilgi kartı</b> olarak, fiyat ve fotoğraf olmadan yer alıyor. Onaylarsanız aşağıdaki gibi
        fotoğraf, fiyat ve planlarla <b>"Onaylı proje"</b> rozetiyle listenin üst sıralarında gösterilecek. Hizmet ücretsizdir.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, alignItems: 'start' }}>
        <section>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, marginBottom: 8 }}>Önizleme — sitede böyle görünecek</div>
          <div style={{ maxWidth: 380, pointerEvents: 'none' }}>
            <PropertyCard property={project} layout="grid" />
          </div>
          <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 14, padding: 16, marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Sayfadaki bilgiler</div>
            {facts.map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14, padding: '6px 0', borderTop: `1px solid ${C.line}` }}>
                <span style={{ color: C.muted }}>{k}</span><span style={{ fontWeight: 600, textAlign: 'right' }}>{v}</span>
              </div>
            ))}
            <p style={{ fontSize: 12, color: C.muted, margin: '10px 0 0' }}>Bilgiler kamuya açık kaynaklardan derlenmiştir. Hatalı bir bilgi varsa "Düzeltme istiyorum" seçeneğini kullanın.</p>
          </div>
        </section>

        <form onSubmit={submit} style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 16, padding: 20 }}>
          <div style={{ display: 'flex', gap: 6, background: C.bg, padding: 4, borderRadius: 12, marginBottom: 18 }}>
            {[['approve', 'Onaylıyorum'], ['changes', 'Düzeltme istiyorum'], ['reject', 'Yayınlanmasın']].map(([v, l]) => (
              <button key={v} type="button" onClick={() => { setMode(v); setErrors({}); setMessage(''); }}
                style={{ flex: 1, padding: '9px 6px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                  background: mode === v ? (v === 'reject' ? C.danger : C.green) : 'transparent', color: mode === v ? '#fff' : C.muted }}>
                {l}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            {field('approver_name', 'Adınız soyadınız *', { autoComplete: 'name' })}
            {mode === 'approve' && field('approver_title', 'Göreviniz *', { placeholder: 'Satış müdürü' })}
            {field('company_name', 'Firma adı *', { autoComplete: 'organization' })}
            {mode === 'approve' && field('tax_number', 'Vergi numarası *', { inputMode: 'numeric', placeholder: '10 haneli vergi numarası' })}
            {field('approver_phone', 'Telefon *', { inputMode: 'tel', autoComplete: 'tel', placeholder: '05xx xxx xx xx' })}

            {mode === 'approve' && (
              <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Yayınlanacak bilgiler</div>
                <Check checked={form.allow_photos} onChange={(v) => set('allow_photos', v)}>Fotoğraflar</Check>
                <Check checked={form.allow_prices} onChange={(v) => set('allow_prices', v)}>Fiyatlar ve ödeme koşulları</Check>
                <div style={{ fontSize: 13, fontWeight: 700, margin: '10px 0 4px' }}>Onaylar</div>
                <Check checked={form.consent_authority} onChange={(v) => set('consent_authority', v)} error={errors.consent_authority}>
                  Bu projenin geliştiricisi veya yetkilisiyim ve bilgilerin yayınlanmasına izin veriyorum.
                </Check>
                {form.allow_photos && (
                  <Check checked={form.consent_media_rights} onChange={(v) => set('consent_media_rights', v)} error={errors.consent_media_rights}>
                    Fotoğrafların kullanım hakkına sahibim; LansmanBul'da yayınlanmasına izin veriyorum.
                  </Check>
                )}
                <Check checked={form.consent_kvkk} onChange={(v) => set('consent_kvkk', v)} error={errors.consent_kvkk}>
                  <a href="/kisisel-verilerin-korunmasi" target="_blank" rel="noopener noreferrer" style={{ color: C.green }}>KVKK aydınlatma metnini</a> okudum; iletişim bilgilerimin bu onay sürecinde işlenmesini kabul ediyorum.
                </Check>
              </div>
            )}

            {mode === 'changes' && (
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Neyin düzeltilmesini istiyorsunuz? *</label>
                <textarea rows={5} value={form.correction_note} onChange={(e) => set('correction_note', e.target.value)} style={{ ...input, resize: 'vertical', borderColor: errors.correction_note ? C.danger : '#cbd5e1' }} />
                {errors.correction_note && <div className="lb-err" style={{ fontSize: 12, color: C.danger, marginTop: 4 }}>{errors.correction_note}</div>}
              </div>
            )}

            {mode === 'reject' && (
              <p style={{ fontSize: 14, color: C.muted, margin: 0, lineHeight: 1.5 }}>Projeniz LansmanBul'dan tamamen kaldırılacak.</p>
            )}

            {message && <div style={{ color: C.danger, fontSize: 14 }}>{message}</div>}

            <button type="submit" disabled={sending} style={{ padding: '14px 16px', borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 800, fontFamily: 'inherit', cursor: sending ? 'default' : 'pointer', color: '#fff',
              background: sending ? '#94a3b8' : mode === 'reject' ? C.danger : C.green }}>
              {sending ? 'Gönderiliyor…' : mode === 'approve' ? 'Onayla ve yayına gönder' : mode === 'changes' ? 'Düzeltme talebini gönder' : 'Yayından kaldır'}
            </button>
          </div>
        </form>
      </div>
    </Shell>
  );
}

export async function getServerSideProps(context) {
  const token = String(context.params.token || '');
  if (!/^[a-f0-9]{32,64}$/.test(token)) return { props: { state: 'invalid', token: '' } };

  const supabase = getSupabaseAdmin();
  const { data: approval } = await supabase.from('project_approvals').select('id, property_id, status, expires_at').eq('token', token).single();
  if (!approval) return { props: { state: 'invalid', token: '' } };
  if (!['sent', 'opened'].includes(approval.status)) return { props: { state: 'used', token: '' } };
  if (new Date(approval.expires_at) < new Date()) return { props: { state: 'expired', token: '' } };

  const { data: row } = await supabase
    .from('properties')
    .select('*, property_images(*), developer:developers(name, is_verified)')
    .eq('id', approval.property_id)
    .single();
  if (!row) return { props: { state: 'invalid', token: '' } };

  if (approval.status === 'sent') {
    await supabase.from('project_approvals').update({ status: 'opened', opened_at: new Date().toISOString() }).eq('id', approval.id);
  }

  // Предпросмотр «как будет после одобрения»: всё собранное + значок подтверждённой карточки
  const project = toCardShape({ ...row, listing_status: 'confirmed' }, { preview: true });
  return { props: { state: 'ok', token, project } };
}
