import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import CabinetLayout, { C, inputStyle, primaryBtn, Field } from '../../../components/cabinet/CabinetLayout';
import { getBrowserSupabase, cabinetFetch } from '../../../lib/supabaseBrowser';
import { compressImage } from '../../../lib/imageCompress';
import {
  ANKARA_DISTRICTS, PROJECT_STATUSES, STAGE_OPTIONS, MONTHS_TR, ROOM_TYPES, STEPS, MAX_PHOTOS, MAX_CONSTRUCTION_PHOTOS,
} from '../../../lib/cabinetProject';

const MapPicker = dynamic(() => import('../../../components/cabinet/MapPicker'), { ssr: false });

const STEP_FIELDS = {
  genel: ['name', 'project_status', 'description', 'features', 'block_count', 'floor_count', 'unit_count'],
  konum: ['district', 'neighborhood', 'address', 'latitude', 'longitude'],
  planlar: ['layouts'],
  foto: [],
  insaat: ['construction_stage', 'delivery_year', 'delivery_month'],
  odeme: ['down_payment_percent', 'installment_months', 'interest_free', 'credit_eligible', 'contact_whatsapp', 'publish_prices'],
};

const fmtMoney = (v) => {
  const d = String(v ?? '').replace(/[^\d]/g, '');
  return d ? Number(d).toLocaleString('tr-TR') : '';
};
const fmtPhone = (v) => {
  let d = String(v || '').replace(/[^\d]/g, '');
  if (d.startsWith('90')) d = '0' + d.slice(2);
  return d;
};

function toForm(p) {
  const s = (v) => (v === null || v === undefined ? '' : String(v));
  return {
    name: s(p.name), project_status: s(p.project_status), description: s(p.description), features: s(p.features),
    block_count: s(p.block_count), floor_count: s(p.floor_count), unit_count: s(p.unit_count),
    district: s(p.district), neighborhood: s(p.neighborhood), address: s(p.address),
    latitude: Number.isFinite(p.latitude) ? p.latitude : null, longitude: Number.isFinite(p.longitude) ? p.longitude : null,
    layouts: (Array.isArray(p.layouts) && p.layouts.length ? p.layouts : [{}]).map((l) => ({ rooms: s(l.rooms), area: s(l.area), price: fmtMoney(l.price) })),
    construction_stage: s(p.construction_stage), delivery_year: s(p.delivery_year), delivery_month: s(p.delivery_month),
    down_payment_percent: s(p.down_payment_percent), installment_months: s(p.installment_months),
    interest_free: p.interest_free === true, credit_eligible: p.credit_eligible === true,
    contact_whatsapp: fmtPhone(p.contact_whatsapp), publish_prices: p.publish_prices !== false,
  };
}

const card = { background: '#fff', border: `1px solid ${C.line}`, borderRadius: 16, padding: 20 };
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 };
const ghostBtn = { padding: '12px 16px', borderRadius: 10, border: `1.5px solid ${C.line}`, background: '#fff', color: C.dark, fontWeight: 700, fontSize: 15, fontFamily: 'inherit', cursor: 'pointer' };

function Pill({ active, children, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{ padding: '9px 14px', borderRadius: 999, fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${active ? C.green : '#cbd5e1'}`, background: active ? C.mint : '#fff', color: active ? '#085041' : '#334155' }}>
      {children}
    </button>
  );
}

function Check({ checked, onChange, children }) {
  return (
    <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, lineHeight: 1.45, cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ width: 18, height: 18, marginTop: 1, accentColor: C.green }} />
      <span>{children}</span>
    </label>
  );
}

// ——— Страница «Новый проект»: только название, дальше — полная форма ———
function NewProject() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getBrowserSupabase().auth.getSession().then(({ data }) => { if (!data?.session) router.replace('/gelistirici/giris'); });
  }, [router]);

  async function create(e) {
    e.preventDefault();
    if (name.trim().length < 3) { setError('Proje adını yazın'); return; }
    setBusy(true);
    try {
      const { id } = await cabinetFetch('/api/gelistirici/projects', { method: 'POST', body: JSON.stringify({ name }) });
      router.replace(`/gelistirici/proje/${id}`);
    } catch (err) {
      if (err.status === 401) { router.replace('/gelistirici/giris'); return; }
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <CabinetLayout title="Yeni proje" narrow>
      <Link href="/gelistirici" style={{ color: C.muted, fontSize: 14, textDecoration: 'none' }}>← Panele dön</Link>
      <form onSubmit={create} style={{ ...card, marginTop: 12, display: 'grid', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>Yeni proje ekleyin</h1>
          <p style={{ color: C.muted, margin: 0, fontSize: 14, lineHeight: 1.5 }}>6 kısa adım, yaklaşık 10 dakika. Her adım otomatik kaydedilir — istediğiniz zaman ara verip devam edebilirsiniz.</p>
        </div>
        <Field label="Proje adı" error={error}>
          <input autoFocus value={name} onChange={(e) => { setName(e.target.value); setError(''); }} placeholder="ör. Park Vadi Evleri" style={{ ...inputStyle, borderColor: error ? C.danger : '#cbd5e1' }} />
        </Field>
        <button type="submit" disabled={busy} style={primaryBtn(busy)}>{busy ? 'Oluşturuluyor…' : 'Devam et →'}</button>
      </form>
    </CabinetLayout>
  );
}

// ——— Загрузка фото ———
function PhotoUploader({ projectId, urls, max, onUrls, label, hint }) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const input = useRef(null);

  async function addFiles(files) {
    setError('');
    const list = Array.from(files || []).slice(0, Math.max(0, max - urls.length));
    if (!list.length) { setError(`En fazla ${max} fotoğraf`); return; }
    const added = [];
    for (let i = 0; i < list.length; i++) {
      setBusy(`Yükleniyor ${i + 1}/${list.length}…`);
      try {
        const blob = await compressImage(list[i]);
        const up = await cabinetFetch(`/api/gelistirici/projects/${projectId}/upload`, { method: 'POST', body: JSON.stringify({ kind: label === 'construction' ? 'construction' : 'photo', contentType: 'image/jpeg' }) });
        const { error: upErr } = await getBrowserSupabase().storage.from(up.bucket).uploadToSignedUrl(up.path, up.token, blob, { contentType: 'image/jpeg' });
        if (upErr) throw new Error('Yükleme başarısız, tekrar deneyin');
        added.push(up.publicUrl);
      } catch (err) {
        setError(err.message);
      }
    }
    setBusy('');
    if (added.length) await onUrls([...urls, ...added]);
    if (input.current) input.current.value = '';
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10, marginBottom: 10 }}>
        {urls.map((u, i) => (
          <div key={u} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: i === 0 && label !== 'construction' ? `2px solid ${C.green}` : `1px solid ${C.line}`, aspectRatio: '4 / 3', background: '#f1f5f4' }}>
            <img src={u} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            {i === 0 && label !== 'construction' && <span style={{ position: 'absolute', left: 6, top: 6, background: C.green, color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>Kapak</span>}
            <div style={{ position: 'absolute', right: 6, top: 6, display: 'flex', gap: 4 }}>
              {i > 0 && label !== 'construction' && (
                <button type="button" title="Kapak yap" onClick={() => onUrls([u, ...urls.filter((x) => x !== u)])} style={{ border: 'none', borderRadius: 6, background: 'rgba(255,255,255,.92)', fontSize: 11, fontWeight: 700, padding: '3px 6px', cursor: 'pointer', fontFamily: 'inherit' }}>Kapak yap</button>
              )}
              <button type="button" aria-label="Sil" onClick={() => onUrls(urls.filter((x) => x !== u))} style={{ border: 'none', borderRadius: 6, background: 'rgba(255,255,255,.92)', color: C.danger, fontWeight: 800, width: 24, height: 22, cursor: 'pointer' }}>×</button>
            </div>
          </div>
        ))}
        {urls.length < max && (
          <button type="button" disabled={Boolean(busy)} onClick={() => input.current?.click()} style={{ aspectRatio: '4 / 3', borderRadius: 10, border: `2px dashed ${C.line}`, background: '#fafbfa', color: C.green, fontWeight: 700, fontFamily: 'inherit', fontSize: 14, cursor: busy ? 'default' : 'pointer' }}>
            {busy || '+ Fotoğraf ekle'}
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple hidden onChange={(e) => addFiles(e.target.files)} />
      <div style={{ fontSize: 12, color: error ? C.danger : C.muted }}>{error || hint}</div>
    </div>
  );
}

// ——— Пошаговая форма проекта ———
function ProjectForm({ id }) {
  const router = useRouter();
  const [loaded, setLoaded] = useState(null); // { project, images, missing }
  const [form, setForm] = useState(null);
  const [savedForm, setSavedForm] = useState(null);
  const [step, setStep] = useState('genel');
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');

  const apply = useCallback((json) => {
    const f = toForm(json.project);
    setLoaded(json);
    setForm(f);
    setSavedForm(f);
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await getBrowserSupabase().auth.getSession();
      if (!data?.session) { router.replace('/gelistirici/giris'); return; }
      try {
        apply(await cabinetFetch(`/api/gelistirici/projects/${id}`));
      } catch (err) {
        if (err.status === 401) { router.replace('/gelistirici/giris'); return; }
        setLoadError(err.message);
      }
    })();
  }, [id, router, apply]);

  useEffect(() => {
    const q = String(router.query.adim || '');
    if (STEPS.some((s) => s.key === q)) setStep(q);
  }, [router.query.adim]);

  const dirtyKeys = useMemo(() => {
    if (!form || !savedForm) return [];
    return Object.keys(form).filter((k) => JSON.stringify(form[k]) !== JSON.stringify(savedForm[k]));
  }, [form, savedForm]);

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); setMsg(null); };

  async function save(extra = {}, keys = dirtyKeys) {
    const body = { ...extra };
    keys.forEach((k) => { body[k] = form[k]; });
    if (!Object.keys(body).length) return true;
    setSaving(true);
    setMsg(null);
    try {
      const json = await cabinetFetch(`/api/gelistirici/projects/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
      apply(json);
      setErrors({});
      setMsg({ ok: true, text: json.submitted ? 'İncelemeye gönderildi' : 'Kaydedildi' });
      return json;
    } catch (err) {
      if (err.status === 401) { router.replace('/gelistirici/giris'); return false; }
      setErrors(err.fields || {});
      setMsg({ ok: false, text: err.message, missing: err.missing });
      setTimeout(() => document.querySelector('.lb-err')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function goTo(key) {
    const ok = await save();
    if (ok === false) return;
    setStep(key);
    router.replace({ query: { id, adim: key } }, undefined, { shallow: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (loadError) return <CabinetLayout title="Proje"><p style={{ color: C.danger }}>{loadError}</p><Link href="/gelistirici">← Panele dön</Link></CabinetLayout>;
  if (!form) return <CabinetLayout title="Proje"><p style={{ color: C.muted }}>Yükleniyor…</p></CabinetLayout>;

  const { project, images, missing } = loaded;
  const status = project.listing_status;
  const idx = STEPS.findIndex((s) => s.key === step);
  const missingByStep = (k) => missing.filter((m) => m.step === k);
  const isLast = idx === STEPS.length - 1;
  const canSubmit = ['draft', 'reference', 'pending_approval'].includes(status);

  const banner = {
    draft: { bg: '#f1f5f4', fg: C.muted, text: 'Taslak. Tüm adımları tamamlayıp incelemeye gönderin — onaydan sonra sitede yayınlanır.' },
    in_review: { bg: C.amberBg, fg: C.amberText, text: 'İncelemede. Genellikle 1 iş günü sürer. Bu sırada değişiklik yapabilirsiniz.' },
    confirmed: { bg: C.mint, fg: '#085041', text: 'Yayında. Fiyat, aşama ve diğer değişiklikler hemen sitede güncellenir ve kayıt altına alınır.' },
  }[status] || { bg: '#f1f5f4', fg: C.muted, text: 'Bilgileri tamamlayıp incelemeye gönderin.' };

  const err = (k) => errors[k];

  return (
    <CabinetLayout title={form.name || 'Proje'}>
      <Link href="/gelistirici" style={{ color: C.muted, fontSize: 14, textDecoration: 'none' }}>← Panele dön</Link>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: '8px 0 10px' }}>{savedForm.name || 'İsimsiz proje'}</h1>
      <div style={{ background: banner.bg, color: banner.fg, borderRadius: 12, padding: '10px 14px', fontSize: 14, marginBottom: 16 }}>{banner.text}</div>

      {/* шаги */}
      <nav style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 14 }}>
        {STEPS.map((s, i) => {
          const done = missingByStep(s.key).length === 0;
          const active = s.key === step;
          return (
            <button key={s.key} type="button" onClick={() => goTo(s.key)} style={{ flex: '1 0 auto', minWidth: 120, textAlign: 'left', padding: '8px 10px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', border: `1.5px solid ${active ? C.green : C.line}`, background: active ? '#fff' : '#fafbfa' }}>
              <div style={{ height: 4, borderRadius: 4, background: done ? C.green : active ? '#9FE1CB' : '#e2e8e6', marginBottom: 6 }} />
              <div style={{ fontSize: 11, color: C.muted }}>Adım {i + 1}{done ? ' ✓' : ''}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: active ? C.dark : '#334155' }}>{s.title}</div>
            </button>
          );
        })}
      </nav>

      <div style={{ ...card, display: 'grid', gap: 18 }}>
        {step === 'genel' && (
          <>
            <Field label="Proje adı *" error={err('name')}>
              <input value={form.name} onChange={(e) => set('name', e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Satış durumu *" error={err('project_status')}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {PROJECT_STATUSES.map((s) => <Pill key={s} active={form.project_status === s} onClick={() => set('project_status', s)}>{s}</Pill>)}
              </div>
            </Field>
            <Field label="Proje açıklaması *" error={err('description')} hint={`${form.description.length} karakter · en az 40. Projenin öne çıkan yönlerini, sosyal alanları ve çevreyi anlatın.`}>
              <textarea rows={6} value={form.description} onChange={(e) => set('description', e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />
            </Field>
            <Field label="Özellikler" hint="Virgülle ayırın: havuz, kapalı otopark, 7/24 güvenlik, spor salonu">
              <textarea rows={3} value={form.features} onChange={(e) => set('features', e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />
            </Field>
            <div style={grid}>
              <Field label="Blok sayısı" error={err('block_count')}><input inputMode="numeric" value={form.block_count} onChange={(e) => set('block_count', e.target.value.replace(/\D/g, ''))} style={inputStyle} /></Field>
              <Field label="Kat sayısı" error={err('floor_count')}><input inputMode="numeric" value={form.floor_count} onChange={(e) => set('floor_count', e.target.value.replace(/\D/g, ''))} style={inputStyle} /></Field>
              <Field label="Toplam daire" error={err('unit_count')}><input inputMode="numeric" value={form.unit_count} onChange={(e) => set('unit_count', e.target.value.replace(/\D/g, ''))} style={inputStyle} /></Field>
            </div>
          </>
        )}

        {step === 'konum' && (
          <>
            <div style={grid}>
              <Field label="İlçe *" error={err('district')}>
                <select value={form.district} onChange={(e) => set('district', e.target.value)} style={inputStyle}>
                  <option value="">Seçin</option>
                  {ANKARA_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="Mahalle"><input value={form.neighborhood} onChange={(e) => set('neighborhood', e.target.value)} placeholder="ör. Eryaman" style={inputStyle} /></Field>
            </div>
            <Field label="Açık adres" hint="Satış ofisinin veya şantiyenin adresi"><input value={form.address} onChange={(e) => set('address', e.target.value)} style={inputStyle} /></Field>
            <Field label="Haritada konum *" error={err('konum')} hint={form.latitude ? 'İşaret konuldu. Düzeltmek için sürükleyin veya haritada başka bir yere tıklayın.' : 'Projenin yerine haritada tıklayın, sonra işareti sürükleyerek düzeltebilirsiniz.'}>
              <MapPicker lat={form.latitude} lng={form.longitude} district={form.district} onChange={(lat, lng) => setForm((f) => ({ ...f, latitude: lat, longitude: lng }))} />
            </Field>
          </>
        )}

        {step === 'planlar' && (
          <>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px' }}>Daire tipleri</h2>
              <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>Her tip için brüt alanı ve başlangıç fiyatını yazın. Fiyatı boş bırakırsanız sitede «Fiyat için iletişime geçin» görünür.</p>
            </div>
            {form.layouts.map((l, i) => {
              const upd = (k, v) => set('layouts', form.layouts.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
              return (
                <div key={i}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(90px,1fr) minmax(90px,1fr) minmax(140px,1.4fr) 36px', gap: 8, alignItems: 'end' }}>
                    <Field label={i === 0 ? 'Oda' : ''}>
                      <select value={l.rooms} onChange={(e) => upd('rooms', e.target.value)} style={inputStyle}>
                        <option value="">Seçin</option>
                        {ROOM_TYPES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </Field>
                    <Field label={i === 0 ? 'Brüt m²' : ''}><input inputMode="numeric" value={l.area} onChange={(e) => upd('area', e.target.value.replace(/\D/g, ''))} placeholder="110" style={inputStyle} /></Field>
                    <Field label={i === 0 ? 'Fiyat (TL, başlangıç)' : ''}><input inputMode="numeric" value={l.price} onChange={(e) => upd('price', fmtMoney(e.target.value))} placeholder="3.250.000" style={inputStyle} /></Field>
                    <button type="button" aria-label="Satırı sil" onClick={() => set('layouts', form.layouts.length > 1 ? form.layouts.filter((_, j) => j !== i) : [{ rooms: '', area: '', price: '' }])} style={{ height: 44, border: `1px solid ${C.line}`, borderRadius: 10, background: '#fff', color: C.danger, fontSize: 18, cursor: 'pointer' }}>×</button>
                  </div>
                  {err(`layout_${i}`) && <div className="lb-err" style={{ fontSize: 12, color: C.danger, marginTop: 4 }}>{err(`layout_${i}`)}</div>}
                </div>
              );
            })}
            <button type="button" onClick={() => set('layouts', [...form.layouts, { rooms: '', area: '', price: '' }])} style={{ ...ghostBtn, justifySelf: 'start', color: C.green }}>+ Daire tipi ekle</button>
            {!form.layouts.some((l) => l.rooms || l.area || l.price) && <div className="lb-err" style={{ fontSize: 13, color: C.amberText }}>En az bir daire tipi ekleyin.</div>}
          </>
        )}

        {step === 'foto' && (
          <>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px' }}>Proje fotoğrafları</h2>
              <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>En az 3, en fazla {MAX_PHOTOS} fotoğraf. İlk fotoğraf kapak olur. Fotoğraflar otomatik küçültülür; konum bilgisi (GPS) silinir.</p>
            </div>
            <PhotoUploader projectId={id} urls={images.image_url} max={MAX_PHOTOS} label="photo" hint="Görsel, render veya şantiye fotoğrafı — filigransız ve size ait olmalı."
              onUrls={(urls) => save({ photos: { image_url: urls } })} />
            <div style={{ background: '#fafbfa', border: `1px solid ${C.line}`, borderRadius: 12, padding: 14 }}>
              <Check checked={Boolean(project.photo_rights_confirmed_at)} onChange={(v) => save({ photo_rights: v })}>
                Bu fotoğrafların kullanım hakkı firmamıza aittir; LansmanBul'da yayınlanmasına izin veriyorum. Başka sitelerden alınmış veya filigranlı fotoğraf yüklemiyorum.
              </Check>
            </div>
          </>
        )}

        {step === 'insaat' && (
          <>
            <Field label="İnşaat aşaması *" error={err('construction_stage')}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {STAGE_OPTIONS.map((s) => <Pill key={s.value} active={form.construction_stage === s.value} onClick={() => set('construction_stage', s.value)}>{s.label}</Pill>)}
              </div>
            </Field>
            <div style={grid}>
              <Field label="Teslim ayı" error={err('delivery_month')}>
                <select value={form.delivery_month} onChange={(e) => set('delivery_month', e.target.value)} style={inputStyle}>
                  <option value="">Belirtilmemiş</option>
                  {MONTHS_TR.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
                </select>
              </Field>
              <Field label="Teslim yılı *" error={err('delivery_year')}>
                <select value={form.delivery_year} onChange={(e) => set('delivery_year', e.target.value)} style={inputStyle}>
                  <option value="">Seçin</option>
                  {Array.from({ length: 12 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => <option key={y} value={String(y)}>{y}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Şantiye fotoğrafları" hint={`İsteğe bağlı, en fazla ${MAX_CONSTRUCTION_PHOTOS}. Güncel şantiye fotoğrafı alıcıların güvenini artırır.`}>
              <PhotoUploader projectId={id} urls={images.Construction} max={MAX_CONSTRUCTION_PHOTOS} label="construction" hint=""
                onUrls={(urls) => save({ photos: { Construction: urls } })} />
            </Field>
            <PermitUpload projectId={id} project={project} onSaved={(path) => save({ building_permit_path: path })} />
          </>
        )}

        {step === 'odeme' && (
          <>
            <div style={grid}>
              <Field label="Peşinat (%)" error={err('down_payment_percent')}><input inputMode="numeric" value={form.down_payment_percent} onChange={(e) => set('down_payment_percent', e.target.value.replace(/\D/g, ''))} placeholder="30" style={inputStyle} /></Field>
              <Field label="Vade (ay)" error={err('installment_months')}><input inputMode="numeric" value={form.installment_months} onChange={(e) => set('installment_months', e.target.value.replace(/\D/g, ''))} placeholder="24" style={inputStyle} /></Field>
            </div>
            <Check checked={form.interest_free} onChange={(v) => set('interest_free', v)}>Vade farksız / %0 faiz</Check>
            <Check checked={form.credit_eligible} onChange={(v) => set('credit_eligible', v)}>Banka kredisine uygun</Check>
            <Field label="WhatsApp numarası *" error={err('contact_whatsapp')} hint="Alıcılar bu numaraya yazacak. Firmanın satış numarasını kullanın.">
              <input inputMode="tel" value={form.contact_whatsapp} onChange={(e) => set('contact_whatsapp', e.target.value)} placeholder="05XX XXX XX XX" style={inputStyle} />
            </Field>
            <Check checked={form.publish_prices} onChange={(v) => set('publish_prices', v)}>Fiyatları ve ödeme koşullarını sitede göster</Check>

            {canSubmit && (
              <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 16 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 8px' }}>İncelemeye gönder</h2>
                {missing.length > 0 ? (
                  <div style={{ fontSize: 14, color: C.amberText, background: C.amberBg, borderRadius: 10, padding: 12 }}>
                    Göndermeden önce şunları tamamlayın:
                    <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                      {missing.map((m) => (
                        <li key={m.field}><button type="button" onClick={() => goTo(m.step)} style={{ background: 'none', border: 'none', padding: 0, color: C.amberText, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>{m.message}</button></li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>Her şey hazır. Ekibimiz bilgileri kontrol edip projeyi yayına alacak (genellikle 1 iş günü).</p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* нижняя панель */}
      <div style={{ position: 'sticky', bottom: 0, background: 'rgba(246,247,245,.96)', backdropFilter: 'blur(6px)', padding: '12px 0', marginTop: 12, zIndex: 1100, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        {idx > 0 && <button type="button" onClick={() => goTo(STEPS[idx - 1].key)} style={ghostBtn}>← Geri</button>}
        {!isLast && <button type="button" disabled={saving} onClick={() => goTo(STEPS[idx + 1].key)} style={primaryBtn(saving)}>{saving ? 'Kaydediliyor…' : 'Kaydet ve devam →'}</button>}
        {isLast && canSubmit && (
          <button type="button" disabled={saving || missing.length > 0 && dirtyKeys.length === 0} onClick={() => save({ action: 'submit' })} style={primaryBtn(saving || (missing.length > 0 && dirtyKeys.length === 0))}>
            {saving ? 'Gönderiliyor…' : 'İncelemeye gönder'}
          </button>
        )}
        {isLast && !canSubmit && <button type="button" disabled={saving || !dirtyKeys.length} onClick={() => save()} style={primaryBtn(saving || !dirtyKeys.length)}>{saving ? 'Kaydediliyor…' : 'Kaydet'}</button>}
        {dirtyKeys.length > 0 && !msg && <span style={{ fontSize: 13, color: '#b45309' }}>Kaydedilmemiş değişiklik var</span>}
        {msg && <span style={{ fontSize: 14, fontWeight: 600, color: msg.ok ? C.green : C.danger }}>{msg.text}</span>}
      </div>
    </CabinetLayout>
  );
}

function PermitUpload({ projectId, project, onSaved }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const input = useRef(null);

  async function upload(file) {
    if (!file) return;
    setError('');
    if (file.size > 10 * 1024 * 1024) { setError('Dosya 10 MB\'tan büyük olamaz'); return; }
    const type = file.type === 'image/jpg' ? 'image/jpeg' : file.type;
    setBusy(true);
    try {
      const up = await cabinetFetch(`/api/gelistirici/projects/${projectId}/upload`, { method: 'POST', body: JSON.stringify({ kind: 'permit', contentType: type }) });
      const { error: e } = await getBrowserSupabase().storage.from(up.bucket).uploadToSignedUrl(up.path, up.token, file, { contentType: type });
      if (e) throw new Error('Yükleme başarısız, tekrar deneyin');
      await onSaved(up.path);
    } catch (err) {
      setError(err.message === 'Bu dosya türü desteklenmiyor' ? 'PDF, JPG veya PNG yükleyin' : err.message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  const state = project.has_building_permit === true ? { t: '✓ Ruhsat doğrulandı — projede «Ruhsatlı» rozeti görünür.', c: C.green }
    : project.building_permit_path ? { t: 'Belge yüklendi, ekibimiz kontrol ediyor.', c: C.amberText }
      : null;

  return (
    <div style={{ background: '#fafbfa', border: `1px solid ${C.line}`, borderRadius: 12, padding: 14 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Yapı ruhsatı <span style={{ fontWeight: 500, color: C.muted }}>(isteğe bağlı)</span></div>
      <p style={{ fontSize: 13, color: C.muted, margin: '0 0 10px', lineHeight: 1.5 }}>Ruhsatı yüklerseniz kontrolden sonra projenizde «Ruhsatlı» rozeti görünür. Belge sitede yayınlanmaz, yalnızca ekibimiz görür.</p>
      {state && <div style={{ fontSize: 13, fontWeight: 600, color: state.c, marginBottom: 8 }}>{state.t}</div>}
      <button type="button" disabled={busy} onClick={() => input.current?.click()} style={{ ...ghostBtn, padding: '9px 14px', fontSize: 14 }}>{busy ? 'Yükleniyor…' : project.building_permit_path ? 'Yeni belge yükle' : 'Belge yükle (PDF, JPG)'}</button>
      <input ref={input} type="file" accept="application/pdf,image/jpeg,image/png" hidden onChange={(e) => upload(e.target.files?.[0])} />
      {error && <div className="lb-err" style={{ fontSize: 12, color: C.danger, marginTop: 6 }}>{error}</div>}
    </div>
  );
}

export default function ProjectPage() {
  const router = useRouter();
  if (!router.isReady) return null;
  const { id } = router.query;
  if (id === 'yeni') return <NewProject />;
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) return <CabinetLayout title="Proje"><p>Proje bulunamadı.</p></CabinetLayout>;
  return <ProjectForm id={n} />;
}
