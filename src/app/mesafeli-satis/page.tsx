import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { company } from "@/lib/company";

export default function DistanceSalesPage() {
  return <><StoreHeader/><main className="content-page legal-page">
    <section className="content-hero"><span>MESAFELİ SATIŞ</span><h1>Mesafeli satış sözleşmesi.</h1><p>Sipariş öncesi bilgilendirme, ödeme, teslimat, cayma ve iade esasları aşağıda yer alır.</p></section>
    <section className="legal-copy">
      <h2>Satıcı</h2><p>{company.legalName}<br/>{company.address}<br/>Vergi Dairesi: {company.taxOffice}<br/>Vergi No: {company.taxNumber}<br/>MERSİS: {company.mersis}</p>
      <h2>Ürün ve bedel</h2><p>Ürünün temel nitelikleri, satış fiyatı, varsa indirim bilgisi ve kargo bedeli sipariş öncesinde ürün ve checkout ekranlarında gösterilir.</p>
      <h2>Ödeme</h2><p>Ödemeler Tosla İşim Sanal POS altyapısı üzerinden güvenli kart ödeme akışıyla alınacaktır. Desteklenen kart ve taksit seçenekleri ödeme ekranında gösterilir.</p>
      <h2>Teslimat</h2><p>Siparişler {company.shippingProvider} altyapısı üzerinden gönderilecektir. Gönderi ve takip bilgileri sipariş durumuna bağlanacaktır.</p>
      <h2>Cayma ve iade</h2><p>Cayma ve iade süreci yürürlükteki tüketici mevzuatı, ürünün niteliği ve yeniden satışa uygunluk koşulları dikkate alınarak uygulanır. Canlı satış öncesinde sözleşmenin nihai metni tamamlanacaktır.</p>
    </section>
  </main><StoreFooter/></>;
}
