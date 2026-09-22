import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { company } from "@/lib/company";

export default function DistanceSalesPage() {
  return <><StoreHeader/><main className="content-page legal-page">
    <section className="content-hero"><span>MESAFELİ SATIŞ</span><h1>Ön bilgilendirme çerçevesi.</h1><p>Nihai mesafeli satış sözleşmesi, canlı ürün fiyatları ve ödeme sağlayıcısı netleştirildiğinde checkout verileriyle dinamik oluşturulacaktır.</p></section>
    <section className="legal-copy">
      <h2>Satıcı</h2><p>{company.legalName}<br/>{company.address}<br/>MERSİS: {company.mersis}</p>
      <h2>Ürün ve bedel</h2><p>Ürünün temel nitelikleri, satış fiyatı, varsa indirim bilgisi ve kargo bedeli sipariş öncesinde ürün ve checkout ekranlarında gösterilir.</p>
      <h2>Ödeme</h2><p>Ödeme altyapısı henüz seçilmemiştir. Canlı satış açıldığında desteklenen kart ve taksit seçenekleri seçilen ödeme hizmet sağlayıcısına göre gösterilecektir.</p>
      <h2>Teslimat</h2><p>Siparişler {company.shippingProvider} altyapısı üzerinden gönderilecektir. Gönderi ve takip bilgileri sipariş durumuna bağlanacaktır.</p>
      <h2>Cayma ve iade</h2><p>Cayma ve iade süreci yürürlükteki tüketici mevzuatı, ürünün niteliği ve yeniden satışa uygunluk koşulları dikkate alınarak uygulanır. Canlı satış öncesinde sözleşmenin nihai metni tamamlanacaktır.</p>
    </section>
  </main><StoreFooter/></>;
}
