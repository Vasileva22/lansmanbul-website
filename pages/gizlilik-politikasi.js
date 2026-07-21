import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function GizlilikPolitikasi() {
  return (
    <>
      <Head>
        <title>Gizlilik Politikası | lansmanbul.com</title>
        <meta name="description" content="lansmanbul.com Gizlilik Politikası" />
      </Head>

      <Header setFilters={() => {}} />

      <main className="bg-slate-50 min-h-screen pt-28 pb-16 text-slate-800 antialiased font-mulish">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:p-12">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 border-b border-slate-100 pb-4 mb-8 uppercase tracking-wide">
              Gizlilik Politikası
            </h1>
            
            <div className="space-y-6 text-sm md:text-base leading-relaxed text-slate-600">
              <h2 className="text-lg font-bold text-slate-900 pt-2">1. GİRİŞ VE VERİ SORUMLUSU</h2>
              <p>
                www.lansmanbul.com (“LANSMANBUL”) olarak, internet sitemizi (“Portal”) ziyaret eden kullanıcılarımızın gizliliğini korumak ve kişisel verilerinin güvenliğini sağlamak en büyük önceliklerimizden biridir.
              </p>
              <p>
                İşbu Gizlilik Politikası, LANSMANBUL’un Portal üzerinden hangi kişisel verileri topladığını, bu verileri hangi amaçlarla işlediğini, kimlerle paylaşabileceğini ve kullanıcılarımızın kişisel verileri üzerindeki haklarını açıklamaktadır.
              </p>
              <p>
                Kişisel verileriniz, 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) ve ilgili mevzuata uygun olarak işlenmektedir. LANSMANBUL, veri sorumlusu sıfatıyla hareket etmekte olup her türlü soru için info@lansmanbul.com adresi üzerinden iletişim kurulabilir.
              </p>

              <h2 className="text-lg font-bold text-slate-900 pt-2">2. HANGİ KİŞİSEL VERİLERİ TOPLUYORUZ?</h2>
              <p>
                LANSMANBUL, bir emlak/konut projeleri bilgi platformudur. Portal’ı kullanımınız sırasında bizimle paylaştığınız veya otomatik olarak toplanan şu verileri işlemekteyiz:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>İletişim Formu Verileri:</strong> Portal’da yer alan bilgi talep formlarını doldurduğunuzda bizimle paylaştığınız; adınız, soyadınız, telefon numaranız ve e-posta adresiniz.</li>
                <li><strong>Teknik ve Analitik Veriler (Otomatik Toplanan Veriler):</strong> IP adresiniz, Portal’a giriş yaptığınız tarih ve saat, kullanılan tarayıcı (browser) tipi, işletim sistemi, yönlendirici siteler ve Portal’daki gezinme hareketleriniz.</li>
                <li><strong>Konum Verileri:</strong> Yakın projeleri haritada arama özelliğini kullanabilmeniz amacıyla (yalnızca tarayıcınız veya cihazınız üzerinden açıkça izin vermeniz durumunda) yaklaşık konum veriniz.</li>
              </ul>

              <h2 className="text-lg font-bold text-slate-900 pt-2">3. KİŞİSEL VERİLERİN İŞLENME AMAÇLARI</h2>
              <p>Kişisel verileriniz, LANSMANBUL tarafından aşağıdaki amaçlar doğrultusunda işlenmektedir:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>İlgilendiğiniz konut projeleriyle ilgili bilgi alma taleplerinizi karşılamak ve bu talepleri ilgili inşaat firmalarına (proje geliştiricilerine) güvenli bir şekilde iletmek.</li>
                <li>Portal üzerinden bizimle iletişime geçtiğinizde sorularınıza, şikayetlerinize veya önerilerinize yanıt vermek.</li>
                <li>Web sitemizin performansını analiz etmek, kullanıcı deneyimini iyileştirmek ve Portal’ı daha kullanışlı hale getirmek.</li>
                <li>Yasal mevzuattan (özellikle 5651 sayılı Kanun uyarınca trafik verilerinin saklanması yükümlülüğü) doğan yasal sorumluluklarımızı yerine getirmek.</li>
              </ul>

              <h2 className="text-lg font-bold text-slate-900 pt-2">4. KİŞİSEL VERİLERİN AKTARILMASI</h2>
              <p>LANSMANBUL, topladığı kişisel verileri gizli tutmayı taahhüt eder. Verileriniz, yasal mevzuata uygun olarak yalnızca aşağıdaki durumlarda aktarılabilir:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>İnşaat Firmaları (İş Ortaklarımız):</strong> Bilgi talep formunu doldurduğunuz konut projesinin yapımcısı olan inşaat firmasına, talebinize dönüş yapabilmesi ve size detaylı bilgi sunabilmesi amacıyla ad, soyad ve telefon bilgileriniz aktarılır.</li>
                <li><strong>Hizmet Sağlayıcılar:</strong> Veritabanlarımızın güvenli bir şekilde saklanması ve sunucu (hosting) hizmetlerinin yürütülmesi amacıyla yurt içinde bulunan teknik altyapı tedarikçilerimizle paylaşılır.</li>
                <li><strong>Yasal Yükümlülükler:</strong> Kanunlar çerçevesinde adli makamlar, mahkemeler veya emniyet güçleri tarafından usulüne uygun olarak talep edilmesi halinde resmi kurumlara aktarılabilecektir.</li>
              </ul>

              <h2 className="text-lg font-bold text-slate-900 pt-2">5. VERİ GÜVENLİĞİ</h2>
              <p>
                LANSMANBUL, kişisel verilerinin yetkisiz erişime, kayba, hırsızlığa veya ifşa edilmesine karşı korunması için gerekli tüm makul teknik ve idari güvenlik önlemlerini almaktadır. Sitemizde SSL sertifikası kullanılmakta ve veri transferleri güvenli protokoller üzerinden gerçekleştirilmektedir.
              </p>
              <p>
                Portal üzerinden WhatsApp gibi harici platformlara yönlendirme yapıldığında, yönlendirilen bu platformların kendi gizlilik politikaları geçerlidir & LANSMANBUL bu harici sitelerin veri işleme süreçlerinden sorumlu tutulamaz.
              </p>

              <h2 className="text-lg font-bold text-slate-900 pt-2">6. KULLANICI HAKLARI (KVKK Madde 11)</h2>
              <p>
                Kişisel veri sahibi olarak KVKK’nın 11. maddesi uyarınca; kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, verilerinizin eksik veya yanlış işlenmiş olması halinde düzeltilmesini isteme ve verilerinizin silinmesini talep etme haklarına sahipsiniz.
              </p>
              <p>
                Bu haklarınızı kullanmak için taleplerinizi Türkçe olarak info@lansmanbul.com e-posta adresimize yazılı olarak iletebilirsiniz.
              </p>

              <h2 className="text-lg font-bold text-slate-900 pt-2 border-t border-slate-100 pt-4">7. YÜRÜRLÜK VE GÜNCELLEMELER</h2>
              <p>
                İşbu Gizlilik Politikası, Portal’da yayınlandığı tarihte yürürlüğe girer. LANSMANBUL, hizmetlerindeki değişikliklere veya yasal düzenlemelere uyum sağlamak amacıyla bu politikayı dilediği zaman güncelleyebilir.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer setFilters={() => {}} />
    </>
  );
}
