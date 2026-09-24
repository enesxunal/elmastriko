"use client";

import StoreHeader from "@/components/StoreHeader";
import Link from "next/link";
import { formatPrice } from "@/lib/catalog";
import { getShippingQuote } from "@/lib/integrations/shipping";
import { useStore } from "@/components/StoreProvider";
import { useCartCatalog } from "@/hooks/useCartCatalog";
import { useState } from "react";

export default function CheckoutPage() {
  const { cart } = useStore();
  const { lines, loading } = useCartCatalog(cart);
  const [invoiceType, setInvoiceType] = useState<"individual" | "company">("individual");
  const hasUnknownPrice = lines.some(x => x.product.price === null);
  const subtotal = lines.reduce((sum, x) => sum + ((x.product.price || 0) * x.line.qty), 0);
  const shipping = getShippingQuote(subtotal);
  const total = shipping.fee === null ? null : subtotal + shipping.fee;

  return <><StoreHeader/><main className="checkout-page">
    <section className="checkout-main">
      <Link href="/sepet" className="checkout-back">← Sepete dön</Link><span className="checkout-kicker">GÜVENLİ ÖDEME</span><h1>Sipariş bilgileri</h1>
      <div className="checkout-step"><span>01</span><div><h2>İletişim</h2><div className="form-grid"><input name="firstName" placeholder="Ad"/><input name="lastName" placeholder="Soyad"/><input name="email" type="email" placeholder="E-posta"/><input name="phone" placeholder="Telefon"/></div></div></div>
      <div className="checkout-step"><span>02</span><div><h2>Teslimat adresi</h2><div className="form-grid"><input name="addressLine" className="full" placeholder="Adres"/><input name="city" placeholder="İl"/><input name="district" placeholder="İlçe"/><input name="postalCode" placeholder="Posta kodu"/><input name="addressTitle" placeholder="Adres başlığı"/></div></div></div>
      <div className="checkout-step"><span>03</span><div><h2>Fatura</h2><div className="invoice-type-switch"><button type="button" className={invoiceType === "individual" ? "selected" : ""} onClick={() => setInvoiceType("individual")}>Bireysel</button><button type="button" className={invoiceType === "company" ? "selected" : ""} onClick={() => setInvoiceType("company")}>Kurumsal</button></div>{invoiceType === "company" && <div className="form-grid invoice-company-fields"><input name="companyName" placeholder="Firma unvanı"/><input name="taxOffice" placeholder="Vergi dairesi"/><input name="taxNumber" placeholder="Vergi / T.C. no"/><input name="invoiceEmail" placeholder="E-fatura e-posta"/></div>}<label className="check-row"><input type="checkbox" defaultChecked/> Fatura adresi teslimat adresi ile aynı</label><p className="checkout-note">Ödeme tamamlandıktan sonra fatura kaydı NES Portal entegrasyonuna aktarılacak.</p></div></div>
      <div className="checkout-step payment-step"><span>04</span><div><h2>Ödeme</h2><div className="provider-waiting"><b>Tosla İşim Sanal POS</b><p>Ödemeler 3D Secure destekli güvenli kart ödeme akışıyla alınır. Visa, Mastercard ve TROY kartları desteklenir.</p></div></div></div>
    </section>
    <aside className="checkout-summary"><h3>Sipariş Özeti</h3>{loading && cart.length > 0 ? <p>Sepet güncelleniyor...</p> : lines.length === 0 ? <p>Sepetiniz boş.</p> : lines.map(({ line, product }) => <div className="mini-product" key={line.slug + line.size + line.color}><img src={product.image} alt={product.name}/><p>{product.name}<br/><small>{line.qty} adet {line.size ? "· " + line.size : ""}{line.color ? " · " + line.color : ""}</small></p></div>)}<hr/><p><span>Ara toplam</span><b>{hasUnknownPrice ? "Fiyat listesi bekleniyor" : formatPrice(subtotal)}</b></p><p><span>Kargo</span><b>{shipping.free ? "Ücretsiz" : hasUnknownPrice ? "Hesaplanacak" : shipping.fee === null ? "Kargo tutarı onayda" : formatPrice(shipping.fee)}</b></p><p><span>Toplam</span><b>{hasUnknownPrice ? "—" : total === null ? "Kargo tutarı onayda" : formatPrice(total)}</b></p><button disabled>Siparişi Tamamla</button><small className="checkout-disabled-note">Ödeme sağlayıcısı bağlandığında bu buton aktif olacak. Sipariş kayıt endpointi hazır.</small></aside>
  </main></>;
}
