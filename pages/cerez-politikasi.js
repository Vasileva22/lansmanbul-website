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
                Günümüzde neredeyse her internet sitesinde çerez kullanılmaktadır. Aşağıda LANSMANBUL internet sitesinde hangi bilgilerin tarayıcınızda saklandığını açıkça belirtiyoruz.
              </p>
              <p>
                Çerezler, ziyaret ettiğiniz internet siteleri tarafından tarayıcılar aracılığıyla bilgisayarınıza (ya da akıllı telefon veya tablet gibi diğer cihazlarınıza) kaydedilen ve genelde harf ve rakamlardan oluşan çok küçük metin dosyalarıdır. Çerezler, ziyaretçilere ilişkin isim, cinsiyet veya adres gibi doğrudan kişisel verileri içermezler.
              </p>
              <p>
                Çerezler, ziyaret ettiğiniz internet sitesini yöneten sunucular tarafından oluşturulurlar. Böylelikle ziyaretçi aynı siteyi ziyaret ettiğinde sunucu bunu anlayabilir. Çerezler, internet sitesi sahiplerine aynı ziyaretçinin siteyi yeniden ziyaret ettiğini gösteren kimlik kartlarına benzetilebilir.
              </p>

              <h2 className="text-lg font-bold text-slate-900 pt-4">A. Hangi Çerezleri ve Tarayıcı Kayıtlarını Kullanıyoruz?</h2>
              <p>LANSMANBUL internet sitesinde <strong>reklam, hedefleme veya ziyaretçi takibi amaçlı çerez kullanılmamaktadır</strong>. Google Analytics, Yandex Metrica, Meta (Facebook) Pixel, Google Ads veya benzeri analiz ve reklam araçları sitemizde yer almamaktadır.</p>
              <ul className="space-y-4 pt-2">
                <li>
                  <strong className="text-slate-900">1. Zorunlu ve İşlevsel Kayıtlar</strong>
                  <p className="mt-1">Sitenin çalışması için gerekli bazı bilgiler yalnızca sizin tarayıcınızda (yerel depolama alanında) saklanır: favorilerinize eklediğiniz projeler, bu bilgilendirme mesajını gördüğünüz, arama ve filtre tercihleriniz. Geliştirici (müteahhit) paneline giriş yapan kullanıcılar için oturumun açık kalmasını sağlayan giriş bilgisi de tarayıcıda saklanır. Bu kayıtlar bizim sunucularımıza gönderilmez ve sizi tanımlamak için kullanılmaz.</p>
                </li>
                <li>
                  <strong className="text-slate-900">2. Anonim Proje İstatistikleri</strong>
                  <p className="mt-1">Projelerin ne kadar ilgi gördüğünü (sayfa görüntülenme, WhatsApp butonuna tıklama, favoriye ekleme) yalnızca sayı olarak tutarız. Bu sayım çerez kullanmadan yapılır; IP adresiniz, cihaz bilgileriniz veya sizi tanımlayabilecek herhangi bir bilgi kaydedilmez. Kaydedilen bilgi yalnızca “hangi proje, hangi işlem, ne zaman” bilgisidir.</p>
                </li>
                <li>
                  <strong className="text-slate-900">3. Üçüncü Taraf Harita Hizmeti</strong>
                  <p className="mt-1">Proje konumlarını göstermek için Yandex Haritalar hizmeti kullanılmaktadır. Harita görüntülendiğinde Yandex, kendi politikaları çerçevesinde cihazınıza çerez yerleştirebilir. Geliştirici panelindeki konum seçme haritası OpenStreetMap altyapısını kullanır. Bu hizmetlerin topladığı bilgiler ilgili sağlayıcıların gizlilik politikalarına tabidir.</p>
                </li>
              </ul>

              <h2 className="text-lg font-bold text-slate-900 pt-4">B. Hukuki Sebep</h2>
              <p>Zorunlu ve işlevsel kayıtlar, Kanun’un 5’inci maddesinin (2) numaralı fıkrasının (c) ve (f) bentleri kapsamında, sitenin sunulması ve meşru menfaatlerimiz için gerekli olduğundan işlenmektedir. Anonim proje istatistikleri kişisel veri niteliği taşımamaktadır.</p>
              <p>İleride analiz veya reklam amaçlı çerez kullanmaya karar vermemiz halinde, bu çerezler yalnızca açık rızanızı aldıktan sonra etkinleştirilecek ve bu metin güncellenecektir.</p>

              <h2 className="text-lg font-bold text-slate-900 pt-4">C. Toplama Yöntemi</h2>
              <p>Yukarıdaki bilgiler, sitemizi kullanırken tarayıcınız aracılığıyla otomatik olarak oluşturulur.</p>

              <h2 className="text-lg font-bold text-slate-900 pt-4">D. Aktarım</h2>
              <p>Tarayıcınızda saklanan kayıtlar üçüncü kişilere aktarılmaz. Anonim proje istatistikleri, ilgili projenin geliştiricisine toplam sayılar olarak gösterilebilir. Harita hizmetinin topladığı bilgiler doğrudan ilgili sağlayıcıya (Yandex) iletilir. Yasal yükümlülüklerin yerine getirilmesi amacıyla, hukuken yetkili kamu kurumlarına talep halinde bilgi verilebilir.</p>

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
