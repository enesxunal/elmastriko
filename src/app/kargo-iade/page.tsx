import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/catalog";
import { company } from "@/lib/company";

export default function ShippingReturnsPage() {
  return <><StoreHeader/><main className="content-page">
    <section className="content-hero"><span>KARGO & İADE</span><h1>Teslimat süreci şeffaf ve sade.</h1><p>Siparişler {company.shippingProvider} altyapısı üzerinden sevk edilecek. {FREE_SHIPPING_THRESHOLD.toLocaleString("tr-TR")} TL ve üzeri alışverişlerde kargo ücretsizdir.</p></section>
    <section className="policy-list">
      <article><span>01</span><div><h2>Kargo</h2><p>Sipariş onaylandıktan sonra gönderi kaydı oluşturulur ve kargo takip bilgisi müşteri hesabına veya sipariş takip ekranına aktarılır. Canlı teslimat süreleri BasitKargo hesabı aktif edildiğinde netleştirilecektir.</p></div></article>
      <article><span>02</span><div><h2>Ücretsiz kargo</h2><p>{FREE_SHIPPING_THRESHOLD.toLocaleString("tr-TR")} TL ve üzeri siparişlerde kargo ücreti alınmaz. Altındaki siparişlerde uygulanacak standart kargo bedeli checkout ekranında gösterilir.</p></div></article>
      <article><span>03</span><div><h2>İade</h2><p>İade ve cayma talepleri yürürlükteki mesafeli satış mevzuatı ve ürünün yeniden satışa uygunluk koşulları çerçevesinde değerlendirilir. Nihai iade adresi ve operasyon adımları canlı satış öncesinde bu sayfada tamamlanacaktır.</p></div></article>
    </section>
  </main><StoreFooter/></>;
}
