"use client";

import StoreHeader from "@/components/StoreHeader";
import Link from "next/link";
import { formatPrice } from "@/lib/catalog";
import { getShippingQuote } from "@/lib/integrations/shipping";
import { useStore } from "@/components/StoreProvider";
import { useCartCatalog } from "@/hooks/useCartCatalog";
import { FormEvent, useState } from "react";

type CreatedOrder = {
  orderId: string;
  orderNo: string;
};

type PaymentStart = {
  iframeUrl?: string | null;
  formUrl?: string | null;
  error?: string;
};

export default function CheckoutPage() {
  const { cart } = useStore();
  const { lines, loading } = useCartCatalog(cart);
  const [invoiceType, setInvoiceType] = useState<"individual" | "company">("individual");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const hasUnknownPrice = lines.some(x => x.product.price === null);
  const subtotal = lines.reduce((sum, x) => sum + ((x.product.price || 0) * x.line.qty), 0);
  const shipping = getShippingQuote(subtotal);
  const total = shipping.fee === null ? null : subtotal + shipping.fee;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || loading || !lines.length || hasUnknownPrice || total === null) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      const form = new FormData(event.currentTarget);
      const firstName = String(form.get("firstName") || "").trim();
      const lastName = String(form.get("lastName") || "").trim();
      const email = String(form.get("email") || "").trim();
      const phone = String(form.get("phone") || "").trim();
      const addressLine = String(form.get("addressLine") || "").trim();
      const city = String(form.get("city") || "").trim();
      const district = String(form.get("district") || "").trim();
      const postalCode = String(form.get("postalCode") || "").trim();
      const fullName = [firstName, lastName].filter(Boolean).join(" ");

      if (!firstName || !lastName || !email || !phone || !addressLine || !city || !district) {
        throw new Error("Lütfen zorunlu teslimat ve iletişim bilgilerini doldurun.");
      }

      const sameBilling = form.get("sameBilling") === "on";
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          phone,
          shipping: {
            fullName,
            city,
            district,
            postalCode,
            addressLine,
          },
          billing: sameBilling || invoiceType === "individual"
            ? {
                fullName,
                city,
                district,
                postalCode,
                addressLine,
              }
            : {
                fullName,
                companyName: String(form.get("companyName") || "").trim(),
                taxOffice: String(form.get("taxOffice") || "").trim(),
                taxNumber: String(form.get("taxNumber") || "").trim(),
                city,
                district,
                postalCode,
                addressLine,
              },
          items: cart.map(item => ({
            slug: item.slug,
            qty: item.qty,
            size: item.size,
            color: item.color,
          })),
        }),
      });

      const orderBody = await orderResponse.json() as CreatedOrder & { error?: string };
      if (!orderResponse.ok || !orderBody.orderId) {
        throw new Error(orderBody.error || "Sipariş oluşturulamadı.");
      }

      const paymentResponse = await fetch("/api/payments/tosla/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderBody.orderId,
          email,
        }),
      });

      const payment = await paymentResponse.json() as PaymentStart;
      if (!paymentResponse.ok) {
        throw new Error(payment.error || "Ödeme oturumu başlatılamadı.");
      }

      if (payment.iframeUrl) {
        window.location.assign(payment.iframeUrl);
        return;
      }

      if (payment.formUrl) {
        window.location.assign(payment.formUrl);
        return;
      }

      throw new Error("Tosla ödeme ekranı adresi alınamadı.");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Sipariş başlatılamadı.");
      setSubmitting(false);
    }
  }

  return <><StoreHeader/><main className="checkout-page">
    <form id="checkout-form" className="checkout-main" onSubmit={handleSubmit}>
      <Link href="/sepet" className="checkout-back">← Sepete dön</Link><span className="checkout-kicker">GÜVENLİ ÖDEME</span><h1>Sipariş bilgileri</h1>
      <div className="checkout-step"><span>01</span><div><h2>İletişim</h2><div className="form-grid"><input required name="firstName" placeholder="Ad"/><input required name="lastName" placeholder="Soyad"/><input required name="email" type="email" placeholder="E-posta"/><input required name="phone" placeholder="Telefon"/></div></div></div>
      <div className="checkout-step"><span>02</span><div><h2>Teslimat adresi</h2><div className="form-grid"><input required name="addressLine" className="full" placeholder="Adres"/><input required name="city" placeholder="İl"/><input required name="district" placeholder="İlçe"/><input name="postalCode" placeholder="Posta kodu"/><input name="addressTitle" placeholder="Adres başlığı"/></div></div></div>
      <div className="checkout-step"><span>03</span><div><h2>Fatura</h2><div className="invoice-type-switch"><button type="button" className={invoiceType === "individual" ? "selected" : ""} onClick={() => setInvoiceType("individual")}>Bireysel</button><button type="button" className={invoiceType === "company" ? "selected" : ""} onClick={() => setInvoiceType("company")}>Kurumsal</button></div>{invoiceType === "company" && <div className="form-grid invoice-company-fields"><input required name="companyName" placeholder="Firma unvanı"/><input required name="taxOffice" placeholder="Vergi dairesi"/><input required name="taxNumber" placeholder="Vergi / T.C. no"/><input name="invoiceEmail" type="email" placeholder="E-fatura e-posta"/></div>}<label className="check-row"><input name="sameBilling" type="checkbox" defaultChecked/> Fatura adresi teslimat adresi ile aynı</label><p className="checkout-note">Ödeme tamamlandıktan sonra fatura kaydı NES Portal entegrasyonuna aktarılacak.</p></div></div>
      <div className="checkout-step payment-step"><span>04</span><div><h2>Ödeme</h2><div className="provider-waiting"><b>Tosla İşim Sanal POS</b><p>Ödemeler 3D Secure destekli güvenli kart ödeme akışıyla alınır. Visa, Mastercard ve TROY kartları desteklenir.</p></div></div></div>
    </form>
    <aside className="checkout-summary"><h3>Sipariş Özeti</h3>{loading && cart.length > 0 ? <p>Sepet güncelleniyor...</p> : lines.length === 0 ? <p>Sepetiniz boş.</p> : lines.map(({ line, product }) => <div className="mini-product" key={line.slug + line.size + line.color}><img src={product.image} alt={product.name}/><p>{product.name}<br/><small>{line.qty} adet {line.size ? "· " + line.size : ""}{line.color ? " · " + line.color : ""}</small></p></div>)}<hr/><p><span>Ara toplam</span><b>{hasUnknownPrice ? "Fiyat listesi bekleniyor" : formatPrice(subtotal)}</b></p><p><span>Kargo</span><b>{shipping.free ? "Ücretsiz" : hasUnknownPrice ? "Hesaplanacak" : shipping.fee === null ? "Kargo tutarı onayda" : formatPrice(shipping.fee)}</b></p><p><span>Toplam</span><b>{hasUnknownPrice ? "—" : total === null ? "Kargo tutarı onayda" : formatPrice(total)}</b></p><button type="submit" form="checkout-form" disabled={submitting || loading || !lines.length || hasUnknownPrice || total === null}>{submitting ? "Ödeme hazırlanıyor..." : "Siparişi Tamamla"}</button>{submitError && <p className="checkout-disabled-note">{submitError}</p>}<small className="checkout-disabled-note">Devam ettiğinizde sipariş oluşturulur ve Tosla 3D Secure ödeme ekranına yönlendirilirsiniz.</small></aside>
  </main></>;
}
