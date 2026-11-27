import Link from 'next/link';
import LegalPage, { H2, UL } from '../components/LegalPage';

export default function GizlilikPolitikasi() {
  return (
    <LegalPage title="Gizlilik Politikası" description="lansmanbul.com Gizlilik Politikası" updated="27 Kasım 2026">
      <p>LANSMANBUL, alıcının yanında duran bir bilgi platformudur. Gizlilik yaklaşımımızı kısaca şöyle özetleyebiliriz:</p>

      <H2>Ziyaretçiler için</H2>
      <UL>
        <li>Projeleri incelemek için üye olmanız veya ad, telefon, e-posta vermeniz gerekmez.</li>
        <li>WhatsApp ile yazdığınızda mesajınız doğrudan firmaya gider; LANSMANBUL bu yazışmaları görmez.</li>
        <li>Reklam, yeniden hedefleme veya sizi başka sitelerde takip eden çerezler kullanmıyoruz.</li>
        <li>Ziyaret istatistikleri (Google Analytics) yalnızca izin vermeniz halinde çalışır; izninizi sayfanın altındaki “Çerez tercihleri” bağlantısından istediğiniz zaman geri alabilirsiniz.</li>
        <li>Projelerin ne kadar ilgi gördüğünü kimliğinizi belirlemeden, yalnızca sayı olarak tutarız.</li>
      </UL>

      <H2>Geliştirici firmalar için</H2>
      <UL>
        <li>Kayıt sırasında verdiğiniz vergi numarası ve yetkili kişinin kişisel iletişim bilgileri sitede yayınlanmaz.</li>
        <li>Yüklediğiniz yapı ruhsatı belgesi yalnızca doğrulama için ekibimiz tarafından görülür.</li>
        <li>Yayınlanan projelerde yapılan değişiklikler, bilgilerin doğruluğu için kayıt altına alınır.</li>
      </UL>

      <H2>Ayrıntılar</H2>
      <p>
        Hangi verilerin, hangi amaçla ve hangi hukuki sebeple işlendiği, kimlere aktarıldığı ve haklarınız{' '}
        <Link href="/kisisel-verilerin-korunmasi" className="text-emerald-700 underline">Kişisel Verilerin Korunması Aydınlatma Metni</Link>’nde;
        çerezler ve tarayıcı kayıtları <Link href="/cerez-politikasi" className="text-emerald-700 underline">Çerez Politikası</Link>’nda açıklanmıştır.
        Sorularınız için: <a href="mailto:info@lansmanbul.com" className="text-emerald-700 underline">info@lansmanbul.com</a>.
      </p>
    </LegalPage>
  );
}
