import Link from 'next/link';
import LegalPage, { H2, UL } from '../components/LegalPage';

export default function KisiselVerilerinKorunmasi() {
  return (
    <LegalPage
      title="Kişisel Verilerin Korunması Aydınlatma Metni"
      description="lansmanbul.com KVKK Aydınlatma Metni"
      updated="27 Kasım 2026"
    >
      <p>
        Bu aydınlatma metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu’nun (“Kanun”) 10. maddesi uyarınca, www.lansmanbul.com
        internet sitesini (“Portal”) yöneten LANSMANBUL (“LANSMANBUL”, “biz”) tarafından; Portal’ı ziyaret eden kişilerin ve Portal’a
        proje ekleyen geliştirici firmaların (inşaat firmaları, müteahhitler) kişisel verilerinin nasıl işlendiğini açıklamak amacıyla hazırlanmıştır.
      </p>

      <H2>1. Veri Sorumlusu</H2>
      <p>Veri sorumlusu LANSMANBUL’dur. Başvuru ve sorularınız için: <a href="mailto:info@lansmanbul.com" className="text-emerald-700 underline">info@lansmanbul.com</a>.</p>

      <H2>2. Portal Ziyaretçileri</H2>
      <p>Portal’da proje incelemek için üyelik gerekmez ve sizden ad, telefon veya e-posta istenmez.</p>
      <UL>
        <li><strong>WhatsApp ile iletişim:</strong> “WhatsApp” butonuna tıkladığınızda doğrudan WhatsApp uygulamasına yönlendirilirsiniz. Mesajınız ve telefon numaranız LANSMANBUL’a değil, doğrudan mesaj gönderdiğiniz firmaya ulaşır; bu yazışmalardan ilgili firma ve WhatsApp sorumludur.</li>
        <li><strong>Favoriler ve tercihler:</strong> Favorilerinize eklediğiniz projeler ve çerez tercihiniz yalnızca kendi tarayıcınızda saklanır, bize gönderilmez.</li>
        <li><strong>Anonim proje istatistikleri:</strong> Bir projenin görüntülenme, WhatsApp tıklama ve favoriye eklenme sayıları kimliğinizi belirlemeden, yalnızca “hangi proje, hangi işlem, ne zaman” bilgisi olarak tutulur. IP adresi veya cihaz bilgisi kaydedilmez.</li>
        <li><strong>Google Analytics (yalnızca izninizle):</strong> Çerez bildiriminde “Kabul Et” seçeneğini işaretlerseniz ziyaret istatistikleri Google Analytics ile ölçülür. Ayrıntılar <Link href="/cerez-politikasi" className="text-emerald-700 underline">Çerez Politikası</Link>’ndadır.</li>
        <li><strong>Teknik kayıtlar:</strong> Portal’ı barındıran altyapı sağlayıcısı, güvenlik ve 5651 sayılı Kanun kapsamındaki yükümlülükler için erişim kayıtlarını (IP adresi, tarih-saat, istenen sayfa) tutabilir.</li>
      </UL>

      <H2>3. Geliştirici Firmalar (Geliştirici Paneli)</H2>
      <p>Portal’a firma olarak kaydolan ve proje ekleyen kullanıcılar için aşağıdaki veriler işlenir:</p>
      <UL>
        <li><strong>Kimlik ve iletişim:</strong> yetkili kişinin adı soyadı, unvanı, telefon numarası, e-posta adresi.</li>
        <li><strong>Firma bilgileri:</strong> firma adı, vergi numarası (şahıs firmalarında T.C. kimlik numarası olabilir), internet sitesi. Vergi numarası firmanın doğrulanması ve faturalandırma için kullanılır, Portal’da yayınlanmaz.</li>
        <li><strong>Hesap güvenliği:</strong> giriş e-postası ve şifre (şifre, kimlik doğrulama sağlayıcısı tarafından şifrelenmiş olarak saklanır; LANSMANBUL şifrenizi göremez).</li>
        <li><strong>Proje içerikleri:</strong> yüklenen proje bilgileri, fotoğraflar, şantiye fotoğrafları, isteğe bağlı yapı ruhsatı belgesi (ruhsat belgesi yayınlanmaz, yalnızca doğrulama için görülür) ve projede yapılan değişikliklerin kaydı (kim, ne zaman, neyi değiştirdi).</li>
        <li><strong>Onay kayıtları:</strong> KVKK ve kullanım koşullarının kabul tarihi; WhatsApp üzerinden gönderilen proje onay bağlantısı ile verilen kararlarda, onayın kanıtı olarak karar, tarih-saat, IP adresi ve tarayıcı bilgisi.</li>
        <li><strong>İstatistikler:</strong> firmanın projelerine ait anonim görüntülenme ve tıklama sayıları.</li>
      </UL>

      <H2>4. İşleme Amaçları</H2>
      <UL>
        <li>Konut projelerinin Portal’da yayınlanması ve ziyaretçilerin projeleri incelemesi,</li>
        <li>Geliştirici firmaların doğrulanması, hesaplarının yönetilmesi, proje bilgilerinin kontrol edilmesi ve yayınlanması,</li>
        <li>Proje bilgilerinin doğruluğunun ve fotoğraf haklarının takibi, yapılan değişikliklerin kayıt altına alınması,</li>
        <li>Firmalara proje istatistiklerinin sunulması ve ileride sunulacak ücretli hizmetlerin faturalandırılması,</li>
        <li>Portal güvenliğinin sağlanması, taleplerin yanıtlanması ve yasal yükümlülüklerin yerine getirilmesi.</li>
      </UL>

      <H2>5. Hukuki Sebepler</H2>
      <p>Kişisel verileriniz Kanun’un 5. maddesinin 2. fıkrası kapsamında; geliştirici hesabı ve proje yayını için sözleşmenin kurulması ve ifası (c), yasal yükümlülükler (ç), bir hakkın tesisi, kullanılması veya korunması (e) ve meşru menfaatlerimiz (f) hukuki sebeplerine dayanılarak işlenir. Google Analytics çerezleri ve bunlarla yapılan yurt dışı aktarım açık rızanıza dayanır.</p>

      <H2>6. Aktarım</H2>
      <UL>
        <li><strong>Altyapı hizmet sağlayıcıları:</strong> Portal; barındırma (Vercel Inc.), veritabanı, dosya depolama ve kimlik doğrulama (Supabase Inc.) hizmetleri ile çalışmaktadır. Bu sağlayıcıların sunucuları yurt dışında (ABD) bulunmaktadır; aktarım Kanun’un 9. maddesine uygun olarak gerçekleştirilir.</li>
        <li><strong>E-posta altyapısı:</strong> Hesap doğrulama ve şifre sıfırlama e-postaları bir e-posta gönderim hizmeti aracılığıyla iletilir.</li>
        <li><strong>Google:</strong> Yalnızca Google Analytics’e izin vermeniz halinde, ölçüm verileri Google’a aktarılır.</li>
        <li><strong>Ziyaretçiler:</strong> Geliştirici firmanın yayınlanmasını onayladığı proje bilgileri, fotoğraflar ve satış iletişim numarası herkese açık olarak Portal’da yayınlanır. Vergi numarası, yetkili kişinin kişisel iletişim bilgileri ve ruhsat belgesi yayınlanmaz.</li>
        <li><strong>Yetkili kurumlar:</strong> Mevzuat gereği talep edilmesi halinde yetkili kamu kurum ve kuruluşlarına ve yargı mercilerine.</li>
      </UL>

      <H2>7. Saklama Süresi</H2>
      <p>Geliştirici hesabına ait veriler hesap aktif olduğu sürece ve hesabın kapatılmasından sonra ilgili mevzuatta öngörülen süreler (vergi, ticaret ve zamanaşımı süreleri) boyunca saklanır. Onay kayıtları ve değişiklik geçmişi, olası uyuşmazlıklarda delil olarak zamanaşımı süresince saklanır. Süre sona erdiğinde veriler silinir, yok edilir veya anonim hale getirilir.</p>

      <H2>8. Haklarınız</H2>
      <p>Kanun’un 11. maddesi uyarınca; kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme, işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme, yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme, eksik veya yanlış işlenmişse düzeltilmesini isteme, Kanun’un 7. maddesi çerçevesinde silinmesini veya yok edilmesini isteme, bu işlemlerin aktarıldığı üçüncü kişilere bildirilmesini isteme, münhasıran otomatik sistemlerle analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme ve kanuna aykırı işleme nedeniyle zarara uğramanız halinde zararın giderilmesini talep etme haklarına sahipsiniz.</p>
      <p>Başvurularınızı <a href="mailto:info@lansmanbul.com" className="text-emerald-700 underline">info@lansmanbul.com</a> adresine iletebilirsiniz. Başvurular en geç 30 gün içinde ücretsiz olarak sonuçlandırılır.</p>
    </LegalPage>
  );
}
