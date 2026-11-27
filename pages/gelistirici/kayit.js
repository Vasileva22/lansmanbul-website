import { useState } from 'react';
import Link from 'next/link';
import CabinetLayout, { C, Field, inputStyle, primaryBtn } from '../../components/cabinet/CabinetLayout';
import { getBrowserSupabase } from '../../lib/supabaseBrowser';

export default function DeveloperSignup() {
  const [f, setF] = useState({ company_name: '', tax_number: '', contact_name: '', contact_title: '', phone: '', email: '', password: '', kvkk: false, terms: false });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k, v) => { setF((p) => ({ ...p, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); setMessage(''); };

  function validate() {
    const e = {};
    if (!f.company_name.trim()) e.company_name = 'Zorunlu alan';
    if (!/^\d{10,11}$/.test(f.tax_number.replace(/\D/g, ''))) e.tax_number = '10 haneli vergi no (şahıs firması için 11 haneli TC kimlik no)';
    if (!f.contact_name.trim()) e.contact_name = 'Zorunlu alan';
    if (f.phone.replace(/\D/g, '').length < 10) e.phone = 'Geçerli bir telefon girin';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = 'Geçerli bir e-posta girin';
    if (f.password.length < 8) e.password = 'En az 8 karakter';
    if (!f.kvkk) e.kvkk = 'Onay gerekli';
    if (!f.terms) e.terms = 'Onay gerekli';
    return e;
  }

  async function submit(ev) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      setTimeout(() => document.querySelector('.lb-err')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
      return;
    }
    setSending(true);
    try {
      const { error } = await getBrowserSupabase().auth.signUp({
        email: f.email.trim(),
        password: f.password,
        options: {
          emailRedirectTo: `${window.location.origin}/gelistirici`,
          data: {
            signup_type: 'developer',
            company_name: f.company_name.trim(),
            tax_number: f.tax_number.replace(/\D/g, ''),
            contact_name: f.contact_name.trim(),
            contact_title: f.contact_title.trim(),
            phone: f.phone.trim(),
            kvkk: f.kvkk ? 'true' : 'false',
          },
        },
      });
      if (error) {
        const text = /registered|exists/i.test(error.message) ? 'Bu e-posta ile zaten bir hesap var. Giriş yapın.' : error.message;
        throw new Error(text);
      }
      setDone(true);
      window.scrollTo(0, 0);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <CabinetLayout title="Kayıt" narrow>
        <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 16, padding: 28, textAlign: 'center' }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 10px' }}>E-postanızı kontrol edin</h1>
          <p style={{ color: C.muted, lineHeight: 1.6, margin: 0 }}>
            <b>{f.email}</b> adresine bir onay bağlantısı gönderdik. Bağlantıya tıkladıktan sonra paneliniz açılacak.
            Firmanızı kısa bir kontrolden sonra doğrulayacağız.
          </p>
        </div>
      </CabinetLayout>
    );
  }

  const input = (k, props = {}) => (
    <input value={f[k]} onChange={(e) => set(k, e.target.value)} style={{ ...inputStyle, borderColor: errors[k] ? C.danger : '#cbd5e1' }} {...props} />
  );
  const check = (k, children) => (
    <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, lineHeight: 1.5, cursor: 'pointer' }}>
      <input type="checkbox" checked={f[k]} onChange={(e) => set(k, e.target.checked)} style={{ width: 18, height: 18, marginTop: 2, accentColor: C.green, flexShrink: 0 }} />
      <span>{children}{errors[k] && <span className="lb-err" style={{ display: 'block', color: C.danger, fontSize: 12 }}>{errors[k]}</span>}</span>
    </label>
  );

  return (
    <CabinetLayout title="Kayıt" narrow right={<Link href="/gelistirici/giris" style={{ color: '#e7d3a7' }}>Giriş yap</Link>}>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px' }}>Projenizi ücretsiz ekleyin</h1>
      <p style={{ color: C.muted, margin: '0 0 20px', lineHeight: 1.6 }}>
        Geliştirici firmalar için ücretsiz panel: projelerinizi fotoğraf, fiyat ve planlarla yayınlayın, inşaat aşamasını güncelleyin, ilgiyi takip edin.
      </p>

      <form onSubmit={submit} noValidate style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 16, padding: 20, display: 'grid', gap: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: C.green }}>Firma bilgileri</div>
        <Field label="Firma adı *" error={errors.company_name}>{input('company_name', { autoComplete: 'organization' })}</Field>
        <Field label="Vergi numarası *" error={errors.tax_number} hint="Sitede gösterilmez; yalnızca firmanızı doğrulamak için kullanılır.">
          {input('tax_number', { inputMode: 'numeric', placeholder: '10 haneli vergi no' })}
        </Field>

        <div style={{ fontSize: 13, fontWeight: 800, color: C.green, marginTop: 6 }}>Yetkili kişi</div>
        <Field label="Adınız soyadınız *" error={errors.contact_name}>{input('contact_name', { autoComplete: 'name' })}</Field>
        <Field label="Göreviniz" error={errors.contact_title}>{input('contact_title', { placeholder: 'Satış müdürü' })}</Field>
        <Field label="Telefon *" error={errors.phone}>{input('phone', { inputMode: 'tel', autoComplete: 'tel', placeholder: '05xx xxx xx xx' })}</Field>

        <div style={{ fontSize: 13, fontWeight: 800, color: C.green, marginTop: 6 }}>Giriş bilgileri</div>
        <Field label="E-posta *" error={errors.email}>{input('email', { type: 'email', autoComplete: 'email' })}</Field>
        <Field label="Şifre *" error={errors.password} hint="En az 8 karakter">{input('password', { type: 'password', autoComplete: 'new-password' })}</Field>

        <div style={{ display: 'grid', gap: 8, marginTop: 4 }}>
          {check('kvkk', <><a href="/kisisel-verilerin-korunmasi" target="_blank" rel="noopener noreferrer" style={{ color: C.green }}>KVKK aydınlatma metnini</a> okudum, kabul ediyorum.</>)}
          {check('terms', <>Bu firmanın yetkilisiyim; eklediğim bilgi ve fotoğrafların yayın hakkına sahibim. <a href="/kullanim-kosullari" target="_blank" rel="noopener noreferrer" style={{ color: C.green }}>Kullanım koşulları</a></>)}
        </div>

        {message && <div style={{ color: C.danger, fontSize: 14 }}>{message}</div>}
        <button type="submit" disabled={sending} style={primaryBtn(sending)}>{sending ? 'Gönderiliyor…' : 'Ücretsiz kayıt ol'}</button>
        <div style={{ fontSize: 14, color: C.muted, textAlign: 'center' }}>
          Zaten hesabınız var mı? <Link href="/gelistirici/giris" style={{ color: C.green, fontWeight: 700 }}>Giriş yapın</Link>
        </div>
      </form>
    </CabinetLayout>
  );
}
