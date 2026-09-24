import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { company } from "@/lib/company";

export default function PrivacyPage() {
  return <><StoreHeader/><main className="content-page legal-page">
    <section className="content-hero"><span>GİZLİLİK POLİTİKASI</span><h1>Gizlilik ve veri güvenliği.</h1><p>Elmas Triko, ziyaretçi ve müşteri bilgilerinin yalnızca hizmetin yürütülmesi ve yasal yükümlülüklerin yerine getirilmesi amacıyla işlenmesini esas alır.</p></section>
    <section className="legal-copy">
      <h2>Veri sorumlusu</h2><p>{company.legalName}<br/>{company.address}<br/>Vergi No: {company.taxNumber}<br/>MERSİS: {company.mersis}</p>
      <h2>Toplanan bilgiler</h2><p>Sipariş, üyelik, teslimat, faturalama ve müşteri hizmetleri süreçlerinde gerekli kimlik, iletişim, adres, sipariş ve işlem bilgileri işlenebilir.</p>
      <h2>Kullanım amacı</h2><p>Bilgiler siparişlerin oluşturulması, ödemenin yürütülmesi, teslimatın sağlanması, fatura süreçleri, müşteri taleplerinin yanıtlanması ve yasal yükümlülükler için kullanılır.</p>
      <h2>Paylaşım</h2><p>Gerekli olduğu ölçüde ödeme, kargo ve e-fatura hizmet sağlayıcıları ile yetkili kamu kurumlarıyla veri paylaşımı yapılabilir.</p>
      <h2>Güvenlik</h2><p>Kişisel verilerin yetkisiz erişim, kayıp ve kötüye kullanıma karşı korunması için uygun teknik ve idari tedbirler uygulanır.</p>
    </section>
  </main><StoreFooter/></>;
}
