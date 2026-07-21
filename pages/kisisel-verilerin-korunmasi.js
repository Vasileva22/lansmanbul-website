import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function KisiselVeriler() {
  return (
    <>
      <Head>
        <title>Kişisel Verilerin Korunması | lansmanbul.com</title>
        <meta name="description" content="lansmanbul.com Kişisel Verilerin Korunması Aydınlatma Metni" />
      </Head>

      <Header setFilters={() => {}} />

      <main className="bg-slate-50 min-h-screen pt-28 pb-16 text-slate-800 antialiased font-mulish">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:p-12">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 border-b border-slate-100 pb-4 mb-8 uppercase tracking-wide">
              Kişisel Verilerin Korunması ve İşlenmesi Aydınlatma Metni
            </h1>
            
            <div className="space-y-6 text-sm md:text-base leading-relaxed text-slate-600">
              <p>
                İşbu Kişisel Verilerin Korunması ve İşlenmesi Hakkında Aydınlatma Metni’nin (“Aydınlatma Metni”) amacı, www.lansmanbul.com (“LANSMANBUL”) tarafından yönetilmekte olan internet sitesinin (“Portal”) kullanımı sırasında kullanıcılarından (“Kullanıcı” ve/veya “Kullanıcılar”) elde edilen kişisel verilerin kullanımına ilişkin olarak 6698 sayılı Kişisel Verilerin Korunması Hakkında Kanun’un (“Kişisel Verilerin Korunması Kanunu”) 10. maddesi ile getirilen aydınlatma yükümlülüğünün yerine getirilmesidir.
              </p>
              <p>
                LANSMANBUL, kişisel verilerin hukuka uygun olarak toplanması, saklanması ve paylaşılmasını sağlamak ve gizliliğini korumak amacıyla mümkün olan en üst seviyede güvenlik tedbirlerini almaktadır. Bu amacını gerçekleştirebilmek için Kullanıcılar’ın kişisel verileri aşağıda detayları açıklanan kapsam ve koşullarda işlenmektedir.
              </p>
              <p>
                LANSMANBUL, işbu Aydınlatma Metni hükümlerini dilediği zaman Portal üzerinden yayımlamak suretiyle güncelleyebilir ve değiştirebilir. LANSMANBUL’un yaptığı güncelleme ve değişiklikler Portal’da yayınlandığı tarihten itibaren geçerli olacaktır.
              </p>

              <h2 className="text-lg font-bold text-slate-900 pt-4">a) Veri Sorumlusu</h2>
              <p>
                Kişisel Verilerin Korunması Kanunu uyarınca, kişisel verileriniz; veri sorumlusu olarak LANSMANBUL tarafından aşağıda açıklanan kapsamda toplanacak ve işlenebilecektir. İletişim için info@lansmanbul.com e-posta adresi kullanılabilir.
              </p>

              <h2 className="text-lg font-bold text-slate-900 pt-4">b) Toplanan Kişisel Veriler</h2>
              <p>
                LANSMANBUL, Kullanıcılar’dan Portal’daki hizmetlerin ve özelliklerin kullanımına bağlı olarak çeşitli kişisel veriler toplamaktadır. İşbu başlık altında, işlenen kişisel veri kategorileri aşağıda sıralanmıştır:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Kimlik ve İletişim Bilgileri:</strong> Ad, soyadı, telefon numarası, e-posta adresi.</li>
                <li><strong>Müşteri İşlem ve Talep Verileri:</strong> Emlak projeleri kapsamında bilgi formunu dolduran Kullanıcı’nın adı, soyadı, cep telefonu, ilgilendiği konut projesi, bilgi talep tarihi, kapsamı ve durumu.</li>
                <li><strong>İşlem Güvenliği Bilgileri:</strong> IP adresi, port bilgileri, Portal’ı ziyaret ettiği tarih ve saat verileri, tarayıcı (browser) tipi, domain tipi ve sistem günlükleri (log verileri).</li>
                <li><strong>Konum Verileri:</strong> Kullanıcılar’ın Portal’da harita üzerinden yakın konut projelerini arama fonksiyonlarını kullanırken, kendi istek ve tercihleri doğrultusunda izin vermeleri halinde yaklaşık konum verileri (Kullanıcı izin vermediği takdirde bu veri işlenmez).</li>
                <li><strong>İletişim ve Geri Bildirim Verileri:</strong> Kullanıcılar’ın Portal üzerindeki formlar veya e-posta yoluyla ilettikleri sorular, şikayetler, görüş ve öneriler.</li>
              </ul>

              <h2 className="text-lg font-bold text-slate-900 pt-4">c) Kişisel Verilerin Hangi Amaçla İşleneceği</h2>
              <p>Kişisel Verileriniz Kişisel Verilerin Korunması Kanunu uyarınca, aşağıdaki süreç ve amaçlar kapsamında işlenmektedir:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Bilgi Talebi og Yönlendirme Süreçleri:</strong> Kullanıcıların ilgilendikleri emlak/konut projeleri hakkında bilgi alma taleplerinin planlanması, Portal üzerinden doğrudan ilgili inşaat projesinin yapımcısı olan firmalara güvenli şekilde iletilmesi ve bu kapsamda iletişim faaliyetlerinin yürütülmesi.</li>
                <li><strong>İletişim Faaliyetleri:</strong> Kullanıcılar’ın Portal üzerinden ilettiği her türlü talep, soru, şikayet ve görüşlerin karşılanması, değerlendirilmesi ve kullanıcılara sözlü veya yazılı geri dönüş yapılması.</li>
                <li><strong>Hizmet Kalitesinin İyileştirilmesi:</strong> Portal’ın teknik olarak güvenli bir şekilde çalışmasının sağlanması, kullanıcı deneyiminin analiz edilmesi, analiz ve istatistik çalışmalarının planlanması ve raporlanması.</li>
                <li><strong>Mevzuata Uyum Süreçleri:</strong> 5651 sayılı Kanun uyarınca erişim kayıtlarının (log verilerinin) yasal süresi içinde kayıt altına alınması, saklanması ve resmi makamların yasal taleplerine yanıt verilmesi.</li>
              </ul>

              <h2 className="text-lg font-bold text-slate-900 pt-4">ç) İşlenen Kişisel Verilerin Kimlere ve Hangi Amaçla Aktarılabileceği</h2>
              <p>LANSMANBUL, toplanan kişisel verileri, Kanun’un 8. ve 9. maddelerinde belirtilen kişisel veri işleme şartları çerçevesinde aşağıdaki kişi ve kuruluşlara aktarabilmektedir:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>İnşaat Firmaları ve Proje Geliştiricileri (İş Ortaklarımız):</strong> Kullanıcı’nın Portal üzerinde bilgi talep formu doldurduğu veya iletişime geçmek istediği ilgili konut projelerinin yapımcısı olan inşaat firmalarına, Kullanıcı’ya dönüş yapabilmeleri ve bilgi sunabilmeleri amacıyla aktarılır.</li>
                <li><strong>Hizmet Sağlayıcılar:</strong> Verilerin güvenli bir şekilde saklanması, sunucu (hosting) hizmetlerinin yürütülmesi ve bilgi güvenliği süreçlerinin planlanması amacıyla yurt içinde bulunan teknik altyapı tedarikçilerimize aktarılır.</li>
                <li><strong>Yetkili Kamu Kurum ve Kuruluşları:</strong> Yürürlükteki mevzuat gereği zorunlu olması durumunda, mahkemeler, emniyet güçleri ve hukuken yetkili kamu kurum ve kuruluşlarına yasal yükümlülüklerimizin yerine getirilmesi amacıyla aktarılabilecektir.</li>
              </ul>

              <h2 className="text-lg font-bold text-slate-900 pt-4">d) Kişisel Veri Toplamanın Yöntemi ve Hukuki Sebebi</h2>
              <p>Kişisel verileriniz, doğrudan sizden (Kullanıcıdan) Portal üzerindeki bilgi formlarının doldurulması, Portal üzerinden WhatsApp yönlendirmesinin kullanılması ve çerezler (cookies) aracılığıyla otomatik yöntemlerle toplanmaktadır.</p>
              <p>Bu kişisel veriler, Kanun’un 5. maddesi kapsamında aşağıdaki hukuki sebeplere dayalı olarak işlenmekte ve aktarılmaktadır:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>"Bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması kaydıyla, sözleşmenin taraflarına ait kişisel verilerin işlenmesinin gerekli olması" (Talep ettiğiniz konut projesi bilgisinin size ulaştırılması ve yönlendirme yapılması).</li>
                <li>"Veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi için zorunlu olması" (5651 sayılı Kanun uyarınca log verilerinin saklanması).</li>
                <li>"İlgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla, veri sorumlusunun meşru menfaatleri için veri işlenmesinin zorunlu olması" (Portal güvenliğinin sağlanması ve hizmet kalitesinin artırılması).</li>
              </ul>

              <h2 className="text-lg font-bold text-slate-900 pt-4">e) Veri Güvenliğine İlişkin Önlemlerimiz</h2>
              <p>LANSMANBUL, kişisel verileri güvenli bir şekilde korumayı taahhüt eder. Kişisel verilorin hukuka aykırı olarak işlenmesini ve erişilmesini engellemek amacıyla uygun idari ve teknik tedbirleri almakta, güvenli sunucular ve veri koruma teknolojileri kullanmaktadır.</p>
              <p>Portal üzerinden WhatsApp'a veya başka platformlara yönlendirme yapılması durumunda LANSMANBUL, bu harici platformların kendi gizlilik politikalarından sorumlu değildir.</p>

              <h2 className="text-lg font-bold text-slate-900 pt-4">f) Kişisel Veri Sahibi’nin Kanun’un 11. Maddesinde Sayılan Hakları</h2>
              <p>Kişisel veri sahipleri olarak, Kanun’un 11. maddesi kapsamındaki haklarınıza ilişkin taleplerinizi Türkçe olarak; info@lansmanbul.com e-posta adresimize, sistemimizde kayıtlı bulunan e-posta adresinizi kullanmak suretiyle iletebilirsiniz.</p>
              <p>Bu kapsamda kişisel veri sahipleri;</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Kişisel verilerinin işlenip işlenmediğini öğrenme,</li>
                <li>Kişisel verileri işlenmişse buna ilişkin bilgi talep etme,</li>
                <li>Kişisel verilerin işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
                <li>Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme,</li>
                <li>Kişisel verilerin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme,</li>
                <li>Kanun’a uygun olarak işlenmiş olmasına rağmen, işlenmesini gerektiren sebeplerin ortadan kalkması halinde kişisel verilerin silinmesini isteme,</li>
                <li>Kişisel verilerin kanuna aykırı olarak işlenmesi sebebiyle zarara uğraması halinde zararın giderilmesini talep etme haklarına sahiptir.</li>
              </ul>
              <p className="text-xs text-slate-400 pt-4 border-t border-slate-100">
                Başvurunuzda adınızın, soyadınızın, T.C. kimlik numaranızın (veya pasaport numaranızın), tebligata esas adresinizin ve talep konunuzun açıkça belirtilmesi yasal bir zorunluluktur. LANSMANBUL, güvenliğiniz amacıyla başvuruyu yanıtlamadan önce kimliğinizi doğrulama hakkını saklı tutar.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer setFilters={() => {}} />
    </>
  );
}
