import type { Metadata } from "next";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import ShippingPolicyNotice from "@/components/ShippingPolicyNotice";
import { company } from "@/lib/company";

export const metadata: Metadata = {
  title: "Kargo, Teslimat ve İade",
  description: "Elmas Triko kargo, teslimat ve iade süreçleri.",
  alternates: { canonical: "/kargo-iade" },
};

export default function ShippingReturnsPage() {
  return <><StoreHeader/><main className="content-page">
    <section className="content-hero"><span>TESLİMAT – İADE – İPTAL</span><h1>Teslimat ve iade süreci.</h1><p>Ödemesi onaylanan siparişler {company.dispatchTime} içinde kargoya teslim edilir. Gönderinizi sipariş takip sayfasından izleyebilirsiniz.</p></section>
    <section className="policy-list">
      <article><span>01</span><div><h2>Kargo</h2><p>Ödemesi onaylanan siparişler 1–2 iş günü içinde kargoya verilir. Bu süre kargoya teslim süresidir; adresinize ulaşma süresi kargo firmasına ve bulunduğunuz bölgeye göre değişir. Kargoya verildikten sonra gönderinizi <a href="/siparis-takip">sipariş takip sayfasından</a> izleyebilirsiniz.</p></div></article>
      <article><span>02</span><div><h2>Ücretsiz kargo</h2><ShippingPolicyNotice/></div></article>
      <article><span>03</span><div><h2>İade ve iptal</h2><p>İade, cayma ve sipariş iptal talepleri yürürlükteki mesafeli satış mevzuatı ve ürünün niteliği dikkate alınarak değerlendirilir. Sipariş kargoya verilmeden önce iptal talebi iletilebilir; kargoya verilen siparişlerde iade süreci uygulanır. İade veya değişim talebinizi sipariş numaranızla birlikte <a href="https://wa.me/905356007011" target="_blank" rel="noopener noreferrer">WhatsApp destek hattımıza</a> ya da <a href="mailto:destek@elmastriko.com">destek@elmastriko.com</a> adresine iletin. Ürünü göndermeden önce iade adresi ve gönderim adımlarını destek ekibimizden öğrenin.</p></div></article>
    </section>
  </main><StoreFooter/></>;
}
