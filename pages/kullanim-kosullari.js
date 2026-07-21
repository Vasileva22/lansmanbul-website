import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function KullanımKosullari() {
  return (
    <>
      <Head>
        <title>Kullanım Koşulları | lansmanbul.com</title>
        <meta name="description" content="lansmanbul.com Kullanım Koşulları" />
      </Head>

      <Header setFilters={() => {}} />

      <main className="bg-slate-50 min-h-screen pt-28 pb-16 text-slate-800 antialiased font-mulish">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:p-12">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 border-b border-slate-100 pb-4 mb-8 uppercase tracking-wide">
              Kullanım Koşulları
            </h1>
            
            <div className="space-y-6 text-sm md:text-base leading-relaxed text-slate-600">
              <p>
                www.lansmanbul.com alan adlı internet sitesini kullanmak için lütfen aşağıda yazılı koşulları okuyunuz. www.lansmanbul.com internet sitesini ziyaret ederek (bundan böyle “Portal” olarak anılacaktır) ve/veya “Kullanıcı” olarak, işbu “Kullanım Koşulları”nı okuduğunuzu, içeriğini tamamen anladığınızı, “Kullanım Koşulları”nda belirtilen ve “Portal”da bulunan ve zaman içinde yer alacak tüm hususları kayıtsız ve şartsız olarak kabul ettiğinizi, “Portal”da belirtilen tüm hususlarla ilgili olarak herhangi bir itiraz ve defi ileri sürmeyeceğinizi kabul, beyan ve taahhüt ediyorsunuz. Bu koşulları kabul etmediğiniz takdirde, lütfen "Portal"ı kullanmaktan vazgeçiniz.
              </p>

              <p>
                <strong>1.1.</strong> “Portal”da sunulan ve işbu “Kullanım Koşulları” Madde 3’te belirtilen hizmetler, www.lansmanbul.com (bundan böyle kısaca "LANSMANBUL" olarak anılacaktır) tarafından sağlanmaktadır. LANSMANBUL ile iletişim kurmak için info@lansmanbul.com adresi kullanılabilir.
              </p>

              <p>
                <strong>1.2.</strong> "LANSMANBUL" işbu “Kullanım Koşulları”nı, “Portal”da yer alan her tür bilgi ve “İçerik”leri, "KULLANICI"ya herhangi bir ihbarda veya bildirimde bulunmadan dilediği zaman değiştirebilir. Bu değişiklikler periyodik olarak “www.lansmanbul.com”da yayımlanacak ve yayımlandığı tarihte geçerli olacaktır. “Portal” hizmetlerinden yararlanan veya herhangi bir şekilde “Portal”a erişim sağlayanlar, “Kullanım Koşulları”nı ve "LANSMANBUL" tarafından yapılan her değişikliği kabul etmiş sayılmaktadır.
              </p>

              <h2 className="text-lg font-bold text-slate-900 pt-4">2. TANIMLAR</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>“İçerik”:</strong> “Portal”da yayınlanan ve erişimi mümkün olan her türlü bilgi, yazı, dosya, resim, video, rakam vb. görsel, yazımsal ve işitsel imgeleri ifade eder.</li>
                <li><strong>“Kullanıcı”:</strong> “Portal”a erişen her gerçek veya tüzel kişiyi ifade eder.</li>
                <li><strong>“Portal”:</strong> www.lansmanbul.com isimli alan adından ve bu alan adına bağlı alt alan adlarından oluşan “LANSMANBUL”un “Hizmet”lerini sunduğu internet sitesini ifade eder.</li>
                <li><strong>“Programatik Sistemler”:</strong> “Portal”a otomatik veya yarı otonom olarak erişim sağlayan tüm teknolojik sistemleri (botlar, crawler, scraper, yapay zekâ, makine öğrenmesi sistemleri vb.) ifade eder.</li>
                <li><strong>“LANSMANBUL Arayüzü”:</strong> LANSMANBUL tarafından oluşturulan içeriğin "Kullanıcı”lar tarafından görüntülenebilmesi ve "LANSMANBUL Veri Tabanı"ndan sorgulanabilmesi amacıyla kullanılan tasarımları ve internet sayfalarını ifade eder.</li>
                <li><strong>“LANSMANBUL Hizmetleri” ("Hizmet"):</strong> "Portal" içerisinde "Kullanıcı"ların konut projelerini incelemelerini, filtrelemelerini og inşaat firmalarıyla doğrudan/WhatsApp üzerinden iletişime geçmelerini sağlamak amacıyla “LANSMANBUL” tarafından sunulan uygulamaları ifade eder.</li>
                <li><strong>“LANSMANBUL Veri Tabanı”:</strong> “Portal” dahilinde erişilen içeriklerin depolandığı, tasnif edildiği, sorgulanabildiği ve erişilebildiği “LANSMANBUL”a ait veri tabanını ifade eder.</li>
              </ul>

              <h2 className="text-lg font-bold text-slate-900 pt-4">3. LANSMANBUL HİZMETLERİ</h2>
              <p>
                <strong>3.1.</strong> "LANSMANBUL", Türkiye'deki inşaat firmaları ve geliştiriciler tarafından sağlanan konut projelerine ait bilgilerin (ilan, fiyat, görsel, proje detayları vb.) "LANSMANBUL Veri Tabanı" üzerinde toplanarak, arayüzler kullanılmak suretiyle "Kullanıcı”lar tarafından görüntülenebilmesini temin etmektedir.
              </p>
              <p>
                <strong>3.2.</strong> "LANSMANBUL", “Portal” içerisinde "Kullanıcı”ların aradığı konut projelerine daha kolay ulaşabilmelerini sağlamak üzere çeşitli filtreleme, arama ve listeleme hizmetleri sunmaktadır.
              </p>
              <p>
                <strong>3.3.</strong> "LANSMANBUL", “Portal” dahilinde verdiği hizmetlere yenilerini ekleme, mevcut hizmetlerin kapsam ve sunulma koşullarını her zaman değiştirme, üçüncü kişilerin erişimine kapatabilme ve silme hakkını saklı tutmaktadır.
              </p>

              <h2 className="text-lg font-bold text-slate-900 pt-4">4. LANSMANBUL PORTALI KULLANIMINA İLİŞKİN KOШULLAR VE YÜKÜMLÜLÜKLER</h2>
              <p>
                <strong>4.1.</strong> “Kullanıcı”lar, "Portal" üzerinde gerçekleştirdiği tüm işlem ve eylemlerden doğan hukuki ve cezai sorumluluğun kendisine ait olduğunu kabul eder.
              </p>
              <p className="bg-red-50 text-red-900 border-l-4 border-red-500 p-4 rounded-r-xl">
                <strong>4.2. ÖNEMLİ SORUMLULUK REDDİ (DİSKLEYMER):</strong> “Portal”, inşaat firmaları ve üçüncü taraflar tarafından sağlanan ve/veya internet ortamında kamuya açık kaynaklardan derlenen "İçerik"lerin görüntülenmesi esasıyla çalışan bir emlak bilgi platformudur. "LANSMANBUL", "Kullanıcı"lar tarafından görüntülenen proje detaylarının, fiyatların, görsellerin, planların ve diğer "İçerik"lerin hiçbir koşulda doğruluğunu, güncelliğini, gerçekliğini, güvenliğini ve hukuka uygunluğunu garanti etmemektedir. Proje ve fiyat bilgileri temsilî nitelikte olup, inşaat firmalarının güncel kontenjan ve satış politikalarına göre değişebilir. “Kullanıcı”lar, bu "İçerik"ler dolayısıyla “LANSMANBUL”un herhangi bir sorumluluğu bulunmadığını, ortaya çıkabilecek zararlardan, fiyat farklılıklarından veya yanlış bilgilendirmelerden ötürü “LANSMANBUL”un hiçbir tazmin yükümlülüğü olmayacağını kabul ve beyan etmektedir.
              </p>
              <p>
                <strong>4.3.</strong> “LANSMANBUL’un Veri Tabanı”na üçüncü kişiler tarafından doğrudan erişim sağlanması, veri çekilmesi (scraping, crawling) yasaktır. “İçerik”; “Kullanıcılar” veya "Programatik Sistemler" tarafından kopyalanamaz, çoğaltılamaz, dağıtılamaz, işlenemez ve indekslenemez.
              </p>
              <p>
                <strong>4.4.</strong> "Kullanıcı"lar, “Portal” dâhilinde Türk Ticaret Kanunu hükümleri uyarınca haksız rekabete yol açacak faaliyetlerde bulunmayacağını, "LANSMANBUL"un ve üçüncü kişilerin şahsi ve ticari itibarı sarsacak fiilleri gerçekleştirmeyeceğini taahhüt eder. Cinsiyet, ırk, renk, dil, din, inanç, mezhep, etnik köken, servet, engellilik ve yaş temellerine dayalı ayrımcılık oluşturacak tutum ve davranışlarda bulunmayacağını kabul eder.
              </p>
              <p>
                <strong>4.5.</strong> "Kullanıcı"lar, “Portal” dahilinde eriştikleri bilgileri yalnızca ticari olmayan, kişisel bilgilendirme amacıyla görüntülemekle yükümlüdür. Proje detaylarında veya ilanlarda yer alan kişisel veriler başka mecralarda doğrudan veya dolaylı olarak yayınlanamaz, işlenemez ve dağıtılamaz.
              </p>
              <p>
                <strong>4.6.</strong> "LANSMANBUL", 5651 Sayılı Kanun kapsamında "Yer Sağlayıcı" konumundadır. İlgili mevzuat uyarınca "Yer Sağlayıcı"lara getirilen yükümlülüklere uymak amacıyla, "Kullanıcı"ların “Portal” üzerindeki erişim og işlem kayıtlarını yasal süresi içinde kayıt altına almakta ve saklamaktadır.
              </p>
              <p>
                <strong>4.7.</strong> "LANSMANBUL", "Kullanıcı" bilgilerini, IP adresini, “Portal”ın hangi bölümlerini ziyaret ettiğini istatistiki değerlendirme, pazar araştırması ve hizmet kalitesini iyileştirme amaçlarıyla kullanabilir veya işbirliği içinde olduğu iş ortaklarıyla paylaşabilir.
              </p>
              <p>
                <strong>4.8.</strong> “LANSMANBUL”, çevrimiçi davranışsal reklamcılık yapılabilmesi amacıyla tarayıcıda bulunan cookie'leri (çerezleri) kullanabilir. Google ve diğer analiz araçları bu kapsamda kullanıcının tarayıcısına çerez yerleştirebilir.
              </p>
              <p>
                <strong>4.9.</strong> “LANSMANBUL”un açık ve yazılı izni olmadan, "Portal" içeriği; yapay zekâ modellerini (büyük dil modelleri dahil) veya benzeri teknolojileri eğitmek, geliştirmek, iyileştirmek ya da test etmek amaçlarıyla herhangi bir şekilde kullanılamaz.
              </p>
              <p>
                <strong>4.10.</strong> “Portal”da verilen hizmetin kesintiye uğraması, bilgi iletiminde aksaklıklar, gecikmeler, veri kaybı halinde oluşabilecek her türlü doğrudan ve dolaylı zararlardan “LANSMANBUL” sorumlu tutulamaz.
              </p>

              <h2 className="text-lg font-bold text-slate-900 pt-4">5. FİKRİ MÜLKİYET HAKLARI</h2>
              <p>
                Bu “Portal” dahilinde erişilen bilgiler ve bu “Portal”ın tasarımı, metinleri, görselleri, kodları ve arayüzü "LANSMANBUL"un telif haklarına tabi çalışmalarıdır. "Kullanıcı"lar, "LANSMANBUL" hizmetlerini ve telif haklarına tabi çalışmalarını kopyalamak, paylaşmak, dağıtmak veya başkasının kullanımına açmak hakkına sahip değildirler.
              </p>

              <h2 className="text-lg font-bold text-slate-900 pt-4">6. KULLANIM KOŞULLARINDA DEĞİŞİKLİKLER</h2>
              <p>
                "LANSMANBUL", dilediğinde, tek taraflı olarak işbu "Kullanım Koşulları"nı herhangi bir zamanda “Portal”da ilan ederek değiştirebilir. İşbu "Kullanım Koşulları"nın değişen hükümleri, ilan edildikleri tarihte geçerlilik kazanarak, yürürlüğe gelecektir.
              </p>

              <h2 className="text-lg font-bold text-slate-900 pt-4">7. MÜCBİR SEBEPLER</h2>
              <p>
                Hukuken mücbir sebep sayılan tüm durumlarda (doğal afet, savaş, yangın, grev, kötü hava koşulları, altyapı ve internet arızaları vb.), geç ifa etme, eksik ifa etme veya ifa etmeme hallerinde "LANSMANBUL"un herhangi bir tazminat yükümlülüğü doğmayacaktır.
              </p>

              <h2 className="text-lg font-bold text-slate-900 pt-4">8. UYGULANACAK HUKUK VE YETKİ</h2>
              <p>
                İşbu "Kullanım Koşulları" uygulanmasında, yorumlanmasında Türk Hukuku uygulanacaktır. İşbu “Kullanım Koşulları”ndan dolayı doğan veya doğabilecek her türlü ihtilafın hallinde Ankara Mahkemeleri ve İcra Daireleri yetkilidir.
              </p>

              <h2 className="text-lg font-bold text-slate-900 pt-4">9. YÜRÜRLÜK ve KABUL</h2>
              <p>
                İşbu "Kullanım Koşulları" "LANSMANBUL" tarafından “Portal”da yayınlandığı tarihte yürürlüğe girer. "Kullanıcı"lar işbu ”Kullanım Koşulları”nı “Portal”ı kullanmakla kabul etmiş olmaktadır.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer setFilters={() => {}} />
    </>
  );
}
