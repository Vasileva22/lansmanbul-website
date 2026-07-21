import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function CerezPolitikasi() {
  return (
    <>
      <Head>
        <title>Çerez Politikası | lansmanbul.com</title>
        <meta name="description" content="lansmanbul.com Çerez Aydınlatma Metni" />
      </Head>

      <Header setFilters={() => {}} />

      <main className="bg-slate-50 min-h-screen pt-28 pb-16 text-slate-800 antialiased font-mulish">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:p-12">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 border-b border-slate-100 pb-4 mb-8 uppercase tracking-wide">
              İnternet Sitesinde Kullanılan Çerezlere İlişkin Aydınlatma Metni
            </h1>
            
            <div className="space-y-6 text-sm md:text-base leading-relaxed text-slate-600">
              <p>
                İşbu çerez aydınlatma metni (“Çerez Aydınlatma Metni”) 6698 sayılı Kişisel Verilerin Korunması Kanunu (“Kanun”) kapsamında veri sorumlusu sıfatıyla www.lansmanbul.com (“LANSMANBUL”) tarafından hazırlanmıştır.
              </p>
              <p>
                Metnin amacı, internet sitemizde kullanılan çerezlerin (cookies) cihazınıza yerleştirilmesi aracılığıyla otomatik yolla elde edilen kişisel verilerin işlenmesine ilişkin olarak; hangi amaçlarla, hangi tür çerezleri kullandığımız, bu kapsamda kişisel verilerinizin hangi amaçlarla işlendiği, aktarıldığı, kişisel verilerinize ilişkin haklarınıza dair detaylı açıklamalar ve bu çerezleri nasıl yönetebileceğiniz hakkında sizlere bilgi vermektir.
              </p>
              <p>
                LANSMANBUL, kişisel verilerin hukuka uygun olarak toplanması, saklanması ve paylaşılmasını sağlamak ve gizliliğini korumak amacıyla mümkün olan en üst seviyede güvenlik tedbirlerini almaktadır.
              </p>
              <p>
                İşbu Çerez Aydınlatma Metni; LANSMANBUL kontrolü dışındaki harici uygulamalar, üçüncü taraf internet siteleri ve platformların topladığı bilgileri kapsamamaktadır. Üçüncü tarafların kendi internet siteleri yoluyla topladığı, sakladığı ve kullandığı kişisel verilere yönelik yapılan işlemlerden LANSMANBUL sorumlu değildir.
              </p>
              <p>
                LANSMANBUL, işbu Çerez Aydınlatma Metni hükümlerini dilediği zaman internet sitemiz üzerinden yayımlamak suretiyle güncelleyebilir ve değiştirebilir. Yapılan güncelleme ve değişiklikler internet sitemizde yayınlandığı tarihten itibaren geçerli olacaktır.
              </p>

              <h2 className="text-lg font-bold text-slate-900 pt-4">Çerez (“Cookie”) Nedir?</h2>
              <p>
                Günümüzde neredeyse her internet sitesinde çerez kullanılmaktadır. Size daha iyi, hızlı ve güvenli bir deneyim sağlamak için biz de LANSMANBUL olarak çerez kullanmaktayız.
              </p>
              <p>
                Çerezler, ziyaret ettiğiniz internet siteleri tarafından tarayıcılar aracılığıyla bilgisayarınıza (ya da akıllı telefon veya tablet gibi diğer cihazlarınıza) kaydedilen ve genelde harf ve rakamlardan oluşan çok küçük metin dosyalarıdır. Çerezler, ziyaretçilere ilişkin isim, cinsiyet veya adres gibi doğrudan kişisel verileri içermezler.
              </p>
              <p>
                Çerezler, ziyaret ettiğiniz internet sitesini yöneten sunucular tarafından oluşturulurlar. Böylelikle ziyaretçi aynı siteyi ziyaret ettiğinde sunucu bunu anlayabilir. Çerezler, internet sitesi sahiplerine aynı ziyaretçinin siteyi yeniden ziyaret ettiğini gösteren kimlik kartlarına benzetilebilir.
              </p>

              <h2 className="text-lg font-bold text-slate-900 pt-4">A. Kişisel Verilerin Hangi Amaçlarla İşleneceği</h2>
              <p>Çerezler; (i) tarafları, (ii) kullanım süreleri ve (iii) kullanım amaçları bakımından sınıflandırılabilir. Bu kapsamda, LANSMANBUL internet sitesinde kullanılan çerezlere dair detaylı açıklamalar aşağıda yer almaktadır:</p>
              
              <ul className="space-y-4 pt-2">
                <li>
                  <strong className="text-slate-900">1. Zorunlu Çerezler</strong>
                  <p className="mt-1">Zorunlu çerezler internet sitesinin çalışması, sitede gezinti yapmanız, arama/filtreleme yapmanız, form doldurmanız ve gizlilik tercihlorinin hatırlanması için zorunlu olarak kullanılmaktadırlar. Bu çerezler internet sitemizin çalışması için gerekli temel fonksiyonları gerçekleştirmek, kullanıcıların güvenliğini sağlamak ve yasal yükümlülüklerimizi yerine getirebilmek amacıyla kullanılmaktadır.</p>
                </li>
                <li>
                  <strong className="text-slate-900">2. Analitik Çerezler</strong>
                  <p className="mt-1">Analitik çerezler, internet sitemizdeki ziyaretçilerin sayılması ve trafiğin ölçülmesi, buna göre performans ayarlarının yapılması, sitemizin optimize edilmesi/geliştirilmesi ve ziyaretçilerin aradıklarını (örneğin aradıkları konut projelerini) bulmalarının kolaylaştırılması için kullanılan çerezlerdir. Bu amaçla Google Analytics, Yandex Metrica ve Yandex Harita çerezleri kullanılmaktadır.</p>
                </li>
                <li>
                  <strong className="text-slate-900">3. İşlevsellik Çerezleri</strong>
                  <p className="mt-1">İşlevsellik çerezleri internet sitemizde size bir kullanıcı olarak kolaylık sağlamak, seçimlerinizi hatırlayarak hizmetleri sizin için kişiselleştirmek (örneğin yaptığınız son aramaları, filtre ayarlarını veya tercih ettiğiniz dil seçeneğini hatırlamak) amacıyla kullanılmaktadır.</p>
                </li>
                <li>
                  <strong className="text-slate-900">4. Hedefleme/Reklam Çerezleri</strong>
                  <p className="mt-1">Hedefleme/reklam çerezleri internet sitemizde yer alan konut projelerinin tanıtım ve reklamlarını yapmak, size özel ve/veya ilgi alanlarınızla ilgili kişiselleştirilmiş reklamlar sunmak, reklam faaliyetlerimizi analiz etmek ve zaten görüntülenmiş reklamların tekrar gösterilmesini engellemek amacıyla kullanılan çerezlerdir (Örn: Facebook/Meta Pixel, Google Ads).</p>
                </li>
              </ul>

              <h2 className="text-lg font-bold text-slate-900 pt-4">B. Kişisel Verilerinizin Toplanmasının Hukuki Sebepleri</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Zorunlu Çerezler:</strong> Bu çerezler aracılığıyla toplanan kişisel verileriz, Kanun’un 5’inci maddesinin (2) numaralı fıkrasının (c) bendi “Bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması kaydıyla, sözleşmenin taraflarına ait kişisel verilerin işlenmesinin gerekli olması”, (ç) bendi “Veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi için zorunlu olması” ve (f) bendi “İlgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla, veri sorumlusunun meşru menfaatleri için veri işlenmesinin zorunlu olması” kapsamında işlenmektedir.</li>
                <li><strong>Analitik, İşlevsellik ve Hedefleme/Reklam Çerezleri:</strong> Bu çerezler aracılığıyla toplanan kişisel verileriniz, Kanun’un 5’inci maddesinin (1) numaralı fıkrası kapsamında açık rızanızın alınması (çerezlere izin vermeniz) suretiyle işlenmektedir.</li>
              </ul>

              <h2 className="text-lg font-bold text-slate-900 pt-4">C. Kişisel Verilerinizin Toplama Yöntemleri</h2>
              <p>Yukarıda belirtilen kişisel verileriniz, internet sitemizde bulunan çerezler (cookies) aracılığıyla otomatik araçlarla (tarayıcınız üzerinden) toplanmaktadır.</p>

              <h2 className="text-lg font-bold text-slate-900 pt-4">D. İşlenen Kişisel Verilerin Kimlere ve Hangi Amaçla Aktarılabileceği</h2>
              <p>Kişisel verileriniz açık rızanız olmaksızın veya mevzuatta öngörülmesi hali dışında işbu Çerez Aydınlatma Metni’nde belirtilenler haricinde üçüncü kişilerle paylaşılmayacaktır.</p>
              <p>Çerezler aracılığıyla toplanan ve analiz edilen anonim trafik verileriniz, analiz hizmetlerinin yürütülmesi amacıyla bu hizmetleri sağlayan analiz ortaklarımıza (Google, Yandex) ve reklam süreçlerinin planlanması amacıyla yurt dışında mukim reklam sağlayıcı (Meta/Facebook) firmalara aktarılmaktadır.</p>
              <p>Ayrıca kişisel verileriniz, yasal yükümlülüklerimizin yerine getirilmesi amacıyla hukuken yetkili kamu kurumlarına ve yargı mercilerine talep halinde aktarılabilecektir.</p>

              <h2 className="text-lg font-bold text-slate-900 pt-4">E. Çerez Tercihleri Nasıl Yönetilir?</h2>
              <p>Ziyaretçilerimizin kendilerine ait hangi kişisel verilerin toplanabildiği konusunda tercihlerini serbestçe kullanabilmesi LANSMANBUL için son derece önemlidir.</p>
              <p>Çerezleri engellemek veya sınırlandırmak için tarayıcınızın ayarlarını değiştirmeniz yeterlidir. Sık kullanılan tarayıcılarda çerezlerin yönetimine ilişkin bilgilere tarayıcı ayarlarından (Chrome, Safari, Firefox, Edge) doğrudan ulaşabilirsiniz. İnternet sitemizin çalışması için zorunlu olan teknik çerezler konusunda ise tercih yönetimi mümkün olamamaktadır.</p>

              <h2 className="text-lg font-bold text-slate-900 pt-4">F. Kişisel Veri Sahibi’nin Kanun’un 11. Maddesinde Sayılan Hakları</h2>
              <p>Kişisel veri sahipleri olarak, Kanun’un 11. maddesi kapsamındaki haklarınıza ilişkin taleplerinizi Türkçe olarak; veri sorumlusu sıfatıyla LANSMANBUL'un info@lansmanbul.com e-posta adresine sistemimizde kayıtlı bulunan e-posta adresinizi kullanmak suretiyle iletebilirsiniz.</p>
              <p>Bu kapsamda kişisel veri sahipleri; kişisel verilerinin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, verilerinizin eksik veya yanlış işlenmiş olması halinde düzeltilmesini isteme ve verilerinizin silinmesini talep etme haklarına sahiptir.</p>
              <p className="text-xs text-slate-400 pt-4 border-t border-slate-100">
                Başvurunuzda adınızın, soyadınızın, T.C. kimlik numaranızın, iletişim adresinizin ve talep konunuzun bulunması yasal zorunluluktur. LANSMANBUL'un kişisel verilerinizin hukuka aykırı paylaşımının önlenmesi amacıyla kimliğinizi doğrulama hakkı saklıdır.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer setFilters={() => {}} />
    </>
  );
}
