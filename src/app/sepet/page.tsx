import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import Link from "next/link";
import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_FEE } from "@/lib/catalog";

export default function CartPage() {
  const sampleSubtotal = 4200;
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - sampleSubtotal);
  return <><StoreHeader/><main className="cart-page">
    <div className="simple-title"><span>ALIŞVERİŞ</span><h1>Sepet</h1></div>
    <div className="cart-layout">
      <section className="cart-items">
        <div className="shipping-progress"><div><span style={{width: (sampleSubtotal/FREE_SHIPPING_THRESHOLD*100)+"%"}}/></div><p>{remaining > 0 ? "Ücretsiz kargo için " + remaining.toLocaleString("tr-TR") + " TL daha ekleyin." : "Ücretsiz kargo kazandınız."}</p></div>
        <div className="cart-placeholder"><img src="/images/product-black-set.png" alt="Ürün"/><div><h3>Siyah Çizgili Triko Takım</h3><p>Beden: M · Renk: Siyah / Ekru</p><button>Kaldır</button></div><strong>Fiyat ürün listesiyle güncellenecek</strong></div>
      </section>
      <aside className="cart-summary"><h2>Sipariş Özeti</h2><div><span>Ara toplam</span><b>Ürün listesi bekleniyor</b></div><div><span>Kargo</span><b>{sampleSubtotal >= FREE_SHIPPING_THRESHOLD ? "Ücretsiz" : STANDARD_SHIPPING_FEE + " TL"}</b></div><div className="summary-total"><span>Toplam</span><b>—</b></div><Link href="/checkout">Alışverişi Tamamla</Link><small>Ödeme sağlayıcısı henüz seçilmedi. Checkout akışı hazır tutuluyor.</small></aside>
    </div>
  </main><StoreFooter/></>;
}
