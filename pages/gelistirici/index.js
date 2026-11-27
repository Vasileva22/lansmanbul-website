import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import CabinetLayout, { C, primaryBtn } from '../../components/cabinet/CabinetLayout';
import { getBrowserSupabase, cabinetFetch } from '../../lib/supabaseBrowser';

const STATUS = {
  draft: { label: 'Taslak', bg: '#f1f5f4', fg: C.muted },
  reference: { label: 'Bilgi kartı', bg: '#f1f5f4', fg: C.muted },
  pending_approval: { label: 'Onayınız bekleniyor', bg: C.amberBg, fg: C.amberText },
  in_review: { label: 'İncelemede', bg: C.amberBg, fg: C.amberText },
  confirmed: { label: 'Yayında · Onaylı', bg: C.mint, fg: '#085041' },
};
const STAGES = { lansman: 'Lansman', temel: 'Temel', kaba_insaat: 'Kaba inşaat', ince_isler: 'İnce işler', teslim: 'Teslim' };

export default function Cabinet() {
  const router = useRouter();
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    let alive = true;
    (async () => {
      const sb = getBrowserSupabase();
      // Ссылка из письма подтверждения возвращает сюда — даём клиенту прочитать сессию из адреса
      await new Promise((r) => setTimeout(r, 50));
      const { data } = await sb.auth.getSession();
      if (!data?.session) { router.replace('/gelistirici/giris'); return; }
      try {
        const me = await cabinetFetch('/api/gelistirici/me');
        if (alive) setState({ loading: false, me });
      } catch (err) {
        if (err.status === 401) { router.replace('/gelistirici/giris'); return; }
        if (alive) setState({ loading: false, error: err.message });
      }
    })();
    return () => { alive = false; };
  }, [router]);

  async function logout() {
    await getBrowserSupabase().auth.signOut();
    router.push('/gelistirici/giris');
  }

  const right = <button onClick={logout} style={{ background: 'transparent', color: '#E1F5EE', border: '1px solid rgba(255,255,255,.35)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>Çıkış</button>;

  if (state.loading) return <CabinetLayout title="Panel" right={right}><p style={{ color: C.muted }}>Yükleniyor…</p></CabinetLayout>;
  if (state.error) return <CabinetLayout title="Panel" right={right}><p style={{ color: C.danger }}>{state.error}</p></CabinetLayout>;

  const { developer, member, projects } = state.me;
  const stats = state.me.stats || { days: 30, total: { view: 0, whatsapp: 0, favorite: 0 }, byProject: {} };
  // Справочная карточка (собрана парсером, created_via пусто) уже видна на сайте, даже в статусе draft
  const isLive = (p) => p.listing_status === 'confirmed' || !p.created_via;
  const hasLive = projects.some(isLive);
  const pending = developer.account_status === 'pending';

  return (
    <CabinetLayout title="Panel" right={right}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{developer.name}</h1>
          <div style={{ color: C.muted, fontSize: 14, marginTop: 4 }}>
            {member.contact_name}{member.contact_title ? ` · ${member.contact_title}` : ''}
            {developer.is_verified && <span style={{ marginLeft: 8, color: C.green, fontWeight: 700 }}>✓ Doğrulanmış firma</span>}
          </div>
        </div>
        <Link href="/gelistirici/proje/yeni" style={primaryBtn(pending)} aria-disabled={pending} onClick={(e) => { if (pending) e.preventDefault(); }}>
          + Yeni proje ekle
        </Link>
      </div>

      {pending && (
        <div style={{ background: C.amberBg, color: C.amberText, borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 14, lineHeight: 1.5 }}>
          <b>Firmanız doğrulanıyor.</b> Vergi bilgilerinizi kontrol ediyoruz, genellikle 1 iş günü sürer. Doğrulama tamamlanınca proje ekleyebileceksiniz.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 18 }}>
        {[['Görüntülenme', stats.total.view], ['WhatsApp tıklaması', stats.total.whatsapp], ['Favoriye ekleme', stats.total.favorite]].map(([k, v]) => (
          <div key={k} style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 12, color: C.muted }}>{k}</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{v}</div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: C.muted, margin: '-8px 0 18px' }}>
        Son {stats.days} gün · {hasLive ? 'Aynı kişinin aynı oturumdaki tekrarları tek sayılır.' : 'İstatistikler projeniz yayına girdikten sonra burada görünür.'}
      </p>

      {(state.me.claims || []).length > 0 && (
        <div style={{ marginBottom: 18, display: 'grid', gap: 8 }}>
          {state.me.claims.map((c) => (
            <div key={c.id} style={{ background: c.status === 'pending' ? C.amberBg : '#fef2f2', color: c.status === 'pending' ? C.amberText : '#991b1b', borderRadius: 12, padding: '10px 14px', fontSize: 14 }}>
              <b>{c.property?.name || 'Proje'}</b>{c.property?.district ? ` · ${c.property.district}` : ''} —{' '}
              {c.status === 'pending' ? 'sahiplenme talebiniz inceleniyor (genellikle 1 iş günü).' : `talep onaylanmadı${c.admin_note ? `: ${c.admin_note}` : '.'}`}
            </div>
          ))}
        </div>
      )}

      <h2 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 10px' }}>Projelerim</h2>
      <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 14 }}>
        {projects.length === 0 && (
          <div style={{ padding: 28, textAlign: 'center', color: C.muted, fontSize: 14 }}>
            Henüz projeniz yok. {pending ? 'Doğrulamadan sonra ilk projenizi ekleyebilirsiniz.' : 'İlk projenizi ekleyin — birkaç dakika sürer.'}
          </div>
        )}
        {projects.map((p, i) => {
          const st = p.listing_status !== 'confirmed' && !p.created_via ? STATUS.reference : (STATUS[p.listing_status] || STATUS.draft);
          return (
            <div key={p.id} style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', padding: '12px 14px', borderTop: i ? `1px solid ${C.line}` : 'none' }}>
              <div style={{ minWidth: 200 }}>
                <div style={{ fontWeight: 700 }}>{p.name || 'İsimsiz proje'}</div>
                <div style={{ fontSize: 13, color: C.muted }}>{[p.district, STAGES[p.construction_stage] || p.project_status].filter(Boolean).join(' · ')}</div>
                {stats.byProject[p.id] && (
                  <div style={{ fontSize: 12, color: C.dark, marginTop: 4 }}>
                    👁 {stats.byProject[p.id].view} görüntülenme · WhatsApp {stats.byProject[p.id].whatsapp} · ♥ {stats.byProject[p.id].favorite}
                  </div>
                )}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: st.bg, color: st.fg }}>{st.label}</span>
              <Link href={`/gelistirici/proje/${p.id}`} style={{ color: C.green, fontWeight: 700, fontSize: 14 }}>Düzenle</Link>
            </div>
          );
        })}
      </div>
    </CabinetLayout>
  );
}
