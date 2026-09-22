import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { company } from "@/lib/company";

export default function KvkkPage() {
  return <><StoreHeader/><main className="content-page legal-page">
    <section className="content-hero"><span>KVKK</span><h1>Kişisel verilerin korunması.</h1><p>Bu sayfa, Elmas Triko e-ticaret hizmetleri kapsamında işlenen kişisel verilerin temel çerçevesini açıklar.</p></section>
    <section className="legal-copy">
      <h2>Veri sorumlusu</h2><p>{company.legalName}, {company.address}. MERSİS: {company.mersis}.</p>
      <h2>İşlenen veriler</h2><p>Üyelik, sipariş, teslimat, faturalama ve müşteri hizmetleri süreçlerinde ad-soyad, iletişim, teslimat/fatura adresi, sipariş bilgileri ve işlem kayıtları işlenebilir.</p>
      <h2>İşleme amaçları</h2><p>Siparişin oluşturulması ve teslim edilmesi, e-fatura süreçlerinin yürütülmesi, müşteri hesabının yönetilmesi, yasal yükümlülüklerin yerine getirilmesi ve talep/şikâyetlerin sonuçlandırılması.</p>
      <h2>Aktarım</h2><p>İşin gerektirdiği ölçüde kargo hizmet sağlayıcısı, e-fatura hizmet sağlayıcısı, ödeme hizmet sağlayıcısı ve yetkili kamu kurumlarıyla veri paylaşımı yapılabilir.</p>
      <h2>Başvuru</h2><p>KVKK başvuru kanalı olarak kullanılacak doğrulanmış e-posta ve diğer iletişim bilgileri canlı satış öncesinde bu sayfaya eklenecektir.</p>
    </section>
  </main><StoreFooter/></>;
}
