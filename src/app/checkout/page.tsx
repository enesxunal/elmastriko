import StoreHeader from "@/components/StoreHeader";
import Link from "next/link";

export default function CheckoutPage() {
  return <><StoreHeader/><main className="checkout-page">
    <section className="checkout-main">
      <Link href="/sepet" className="checkout-back">← Sepete dön</Link>
      <span className="checkout-kicker">GÜVENLİ ÖDEME</span>
      <h1>Sipariş bilgileri</h1>
      <div className="checkout-step"><span>01</span><div><h2>İletişim</h2><div className="form-grid"><input placeholder="Ad"/><input placeholder="Soyad"/><input placeholder="E-posta"/><input placeholder="Telefon"/></div></div></div>
      <div className="checkout-step"><span>02</span><div><h2>Teslimat adresi</h2><div className="form-grid"><input className="full" placeholder="Adres"/><input placeholder="İl"/><input placeholder="İlçe"/><input placeholder="Posta kodu"/><input placeholder="Adres başlığı"/></div></div></div>
      <div className="checkout-step"><span>03</span><div><h2>Fatura</h2><label className="check-row"><input type="checkbox" defaultChecked/> Teslimat adresi ile aynı</label><p className="checkout-note">Sipariş tamamlandığında e-fatura NES Portal entegrasyonuna aktarılacak.</p></div></div>
      <div className="checkout-step payment-step"><span>04</span><div><h2>Ödeme</h2><div className="provider-waiting"><b>Ödeme altyapısı seçimi bekleniyor</b><p>Bu bölüm sağlayıcı kararı verildiğinde kart ödeme formuna bağlanacak. Sipariş, stok ve kargo akışı sağlayıcıdan bağımsız hazırlandı.</p></div></div></div>
    </section>
    <aside className="checkout-summary"><h3>Sipariş Özeti</h3><div className="mini-product"><img src="/images/product-black-set.png" alt="Ürün"/><p>Siyah Çizgili Triko Takım<br/><small>1 adet</small></p></div><hr/><p><span>Kargo</span><b>5.000 TL üzeri ücretsiz</b></p><button disabled>Siparişi Tamamla</button></aside>
  </main></>;
}
