"use client";

import StoreHeader from "@/components/StoreHeader";
import Link from "next/link";
import { products, formatPrice } from "@/lib/catalog";
import { getShippingQuote } from "@/lib/integrations/shipping";
import { useStore } from "@/components/StoreProvider";
import { useMemo, useState } from "react";

export default function CheckoutPage() {
  const { cart } = useStore();
  const [invoiceType, setInvoiceType] = useState<"individual" | "company">("individual");

  const lines = useMemo(
    () => cart.map(line => ({ line, product: products.find(p => p.slug === line.slug) })).filter(x => x.product),
    [cart]
  );

  const hasUnknownPrice = lines.some(x => x.product!.price === null);
  const subtotal = lines.reduce((sum, x) => sum + ((x.product!.price || 0) * x.line.qty), 0);
  const shipping = getShippingQuote(subtotal);
  const total = subtotal + shipping.fee;

  return <><StoreHeader/><main className="checkout-page">
    <section className="checkout-main">
      <Link href="/sepet" className="checkout-back">← Sepete dön</Link>
      <span className="checkout-kicker">GÜVENLİ ÖDEME</span>
      <h1>Sipariş bilgileri</h1>

      <div className="checkout-step">
        <span>01</span>
        <div>
          <h2>İletişim</h2>
          <div className="form-grid">
            <input placeholder="Ad"/>
            <input placeholder="Soyad"/>
            <input type="email" placeholder="E-posta"/>
            <input placeholder="Telefon"/>
          </div>
        </div>
      </div>

      <div className="checkout-step">
        <span>02</span>
        <div>
          <h2>Teslimat adresi</h2>
          <div className="form-grid">
            <input className="full" placeholder="Adres"/>
            <input placeholder="İl"/>
            <input placeholder="İlçe"/>
            <input placeholder="Posta kodu"/>
            <input placeholder="Adres başlığı"/>
          </div>
        </div>
      </div>

      <div className="checkout-step">
        <span>03</span>
        <div>
          <h2>Fatura</h2>
          <div className="invoice-type-switch">
            <button className={invoiceType === "individual" ? "selected" : ""} onClick={() => setInvoiceType("individual")}>Bireysel</button>
            <button className={invoiceType === "company" ? "selected" : ""} onClick={() => setInvoiceType("company")}>Kurumsal</button>
          </div>
          {invoiceType === "company" && <div className="form-grid invoice-company-fields">
            <input placeholder="Firma unvanı"/>
            <input placeholder="Vergi dairesi"/>
            <input placeholder="Vergi / T.C. no"/>
            <input placeholder="E-fatura e-posta"/>
          </div>}
          <label className="check-row"><input type="checkbox" defaultChecked/> Fatura adresi teslimat adresi ile aynı</label>
          <p className="checkout-note">Ödeme tamamlandıktan sonra fatura kaydı NES Portal entegrasyonuna aktarılacak.</p>
        </div>
      </div>

      <div className="checkout-step payment-step">
        <span>04</span>
        <div>
          <h2>Ödeme</h2>
          <div className="provider-waiting">
            <b>Ödeme altyapısı seçimi bekleniyor</b>
            <p>Bu bölüm sağlayıcı kararı verildiğinde kart ödeme formuna bağlanacak. Sipariş, stok, fatura ve kargo akışı sağlayıcıdan bağımsız hazırlandı.</p>
          </div>
        </div>
      </div>
    </section>

    <aside className="checkout-summary">
      <h3>Sipariş Özeti</h3>
      {lines.length === 0 ? <p>Sepetiniz boş.</p> : lines.map(({ line, product }) => <div className="mini-product" key={line.slug + line.size}>
        <img src={product!.image} alt={product!.name}/>
        <p>{product!.name}<br/><small>{line.qty} adet {line.size ? "· " + line.size : ""}</small></p>
      </div>)}
      <hr/>
      <p><span>Ara toplam</span><b>{hasUnknownPrice ? "Fiyat listesi bekleniyor" : formatPrice(subtotal)}</b></p>
      <p><span>Kargo</span><b>{shipping.free ? "Ücretsiz" : hasUnknownPrice ? "Hesaplanacak" : formatPrice(shipping.fee)}</b></p>
      <p><span>Toplam</span><b>{hasUnknownPrice ? "—" : formatPrice(total)}</b></p>
      <button disabled>Siparişi Tamamla</button>
      <small className="checkout-disabled-note">Ödeme sağlayıcısı bağlandığında bu buton aktif olacak.</small>
    </aside>
  </main></>;
}
