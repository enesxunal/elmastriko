import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/catalog";
import { company } from "@/lib/company";

export default function ShippingReturnsPage() {
  return <><StoreHeader/><main className="content-page">
    <section className="content-hero"><span>TESLİMAT – İADE – İPTAL</span><h1>Teslimat ve iade süreci.</h1><p>Siparişler {company.shippingProvider} altyapısı üzerinden sevk edilecek. {FREE_SHIPPING_THRESHOLD.toLocaleString("tr-TR")} TL ve üzeri alışverişlerde kargo ücretsizdir.</p></section>
    <section className="policy-list">
      <article><span>01</span><div><h2>Kargo</h2><p>Sipariş onaylandıktan sonra gönderi kaydı oluşturulur ve kargo takip bilgisi müşteri hesabına veya sipariş takip ekranına aktarılır. Canlı teslimat süreleri BasitKargo hesabı aktif edildiğinde netleştirilecektir.</p></div></article>
      <article><span>02</span><div><h2>Ücretsiz kargo</h2><p>{FREE_SHIPPING_THRESHOLD.toLocaleString("tr-TR")} TL ve üzeri siparişlerde kargo ücreti alınmaz. Altındaki siparişlerde uygulanacak standart kargo bedeli checkout ekranında gösterilir.</p></div></article>
      <article><span>03</span><div><h2>İade ve iptal</h2><p>İade, cayma ve sipariş iptal talepleri yürürlükteki mesafeli satış mevzuatı ve ürünün niteliği dikkate alınarak değerlendirilir. Sipariş kargoya verilmeden önce iptal talebi iletilebilir; kargoya verilen siparişlerde iade süreci uygulanır.</p></div></article>
    </section>
  </main><StoreFooter/></>;
}
