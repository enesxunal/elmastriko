"use client";
import { checkoutAttemptId, trackCheckoutProgress } from "@/lib/checkout-diagnostics-client";
import { CHECKOUT_FIELDS, type CheckoutField } from "@/lib/checkout-diagnostics";
import { trackCheckoutStart } from "@/lib/commerce-tracking";
import { analyticsOrderContext, flushAnalytics } from "@/lib/analytics-client";

import StoreHeader from "@/components/StoreHeader";
import BankTransferPaymentCard from "@/components/BankTransferPaymentCard";
import Link from "next/link";
import { formatPrice } from "@/lib/catalog";
import { useStore } from "@/components/StoreProvider";
import { useCartCatalog } from "@/hooks/useCartCatalog";
import { useCommerceSettings } from "@/hooks/useCommerceSettings";
import { FormEvent, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { gaEvent, gaCart } from "@/lib/ga4";
import { normaliseCheckoutPhone, checkoutFieldMessages } from "@/lib/checkout-phone";

type CreatedOrder = {
  orderId: string;
  orderNo: string;
};

type PaymentStart = {
  paymentUrl?: string;
  iframeUrl?: string | null;
  formUrl?: string | null;
  error?: string;
};

type CheckoutContext = {
  user: { email?: string } | null;
  profile: { full_name?: string | null; phone?: string | null; role?: string } | null;
  address: {
    title?: string | null;
    full_name?: string | null;
    phone?: string | null;
    city?: string | null;
    district?: string | null;
    postal_code?: string | null;
    address_line?: string | null;
  } | null;
};

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] || "", lastName: "" };
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
}

async function readJsonResponse<T>(response: Response): Promise<T & { error?: string }> {
  const text = await response.text();
  if (!text) {
    return {
      error: response.ok
        ? "Sunucudan boş yanıt alındı."
        : `Sunucu hatası (${response.status}). Lütfen tekrar deneyin.`,
    } as T & { error?: string };
  }

  try {
    return JSON.parse(text) as T & { error?: string };
  } catch {
    return {
      error: response.ok
        ? "Sunucu yanıtı okunamadı."
        : `Sunucu hatası (${response.status}). Lütfen tekrar deneyin.`,
    } as T & { error?: string };
  }
}

function onPaymentLocationChange(callback: () => void) {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
}

export default function CheckoutPage() {
  const { cart, clearCart } = useStore();
  const { lines, loading } = useCartCatalog(cart);
  const { freeShippingThreshold, shippingFee, shippingCampaignActive, loading: commerceLoading } = useCommerceSettings();
  const formRef = useRef<HTMLFormElement>(null);
  const [internalTest, setInternalTest] = useState(false);
  const [invoiceType, setInvoiceType] = useState<"individual" | "company">("individual");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "eft">("card");
  const [eftOrder, setEftOrder] = useState<{ orderId: string; orderNo: string; status: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [invalidField, setInvalidField] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; percent: number } | null>(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const paymentReturn = useSyncExternalStore(
    onPaymentLocationChange,
    () => ["failed", "pending"].includes(new URLSearchParams(window.location.search).get("payment") || ""),
    () => false,
  );
  const paymentReview = useSyncExternalStore(onPaymentLocationChange,
    () => new URLSearchParams(window.location.search).get("payment") === "review", () => false);
  const [paymentSuccess] = useState<{ orderNo: string } | null>(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    return params.get("payment") === "success"
      ? { orderNo: params.get("order") || "" }
      : null;
  });
  const hasUnknownPrice = lines.some(x => x.unitPrice === null);
  const subtotal = lines.reduce((sum, x) => sum + ((x.unitPrice || 0) * x.line.qty), 0);
  const discount = coupon ? Math.round(subtotal * coupon.percent) / 100 : 0;
  const discountedSubtotal = subtotal - discount;
  const freeShipping = discountedSubtotal >= freeShippingThreshold;
  const effectiveShippingFee = lines.length === 0 ? 0 : freeShipping ? 0 : shippingFee;
  const total = effectiveShippingFee === null ? null : discountedSubtotal + effectiveShippingFee;
  const submitDisabled = submitting || loading || commerceLoading || !lines.length || hasUnknownPrice || total === null;
  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!/^[A-Z0-9]{3,32}$/.test(code)) { setCoupon(null); setCouponMessage("Geçerli bir indirim kodu girin."); return; }
    setCouponLoading(true);
    try {
      const response = await fetch("/api/influencer/validate?code=" + encodeURIComponent(code), { cache: "no-store" });
      const info = await response.json() as {valid:boolean;code?:string;percent?:number};
      if (!response.ok || !info.valid || !info.code || typeof info.percent !== "number") {
        setCoupon(null);setCouponMessage("Bu kod geçersiz veya süresi dolmuş.");
      } else {
        setCoupon({code:info.code,percent:info.percent});
        setCouponInput(info.code);
        setCouponMessage("%" + info.percent + " indirim uygulandı.");
      }
    } catch { setCoupon(null);setCouponMessage("Kod kontrol edilemedi. Tekrar deneyin."); }
    finally { setCouponLoading(false); }
  }
  useEffect(() => {
    let active = true;
    fetch("/api/influencer/validate", { cache: "no-store" }).then(r=>r.json()).then((info:{valid:boolean;code?:string;percent?:number})=>{
      if (active && info.valid && info.code && typeof info.percent === "number") {
        setCoupon({code:info.code,percent:info.percent});setCouponInput(info.code);setCouponMessage("Özel bağlantı indirimi otomatik uygulandı.");
      }
    }).catch(()=>undefined);
    return ()=>{active=false};
  }, []);
  const formStarted = useRef(false);
  const invalidAt = useRef(0);
  const completedGroups = useRef(new Set<string>());
  function trackCompletedGroups() {
    const form = formRef.current;
    if (!form) return;
    for (const [group, names] of [["contact", ["firstName", "lastName", "email", "phone"]], ["address", ["addressLine", "city", "district"]]] as const) {
      if (completedGroups.current.has(group)) continue;
      const valid = names.every(name => {
        const input = form.elements.namedItem(name);
        return input instanceof HTMLInputElement && input.value.trim() && input.validity.valid && (name !== "phone" || normaliseCheckoutPhone(input.value));
      });
      if (valid) { completedGroups.current.add(group); trackCheckoutProgress(group === "contact" ? "contact_completed" : "address_completed"); }
    }
  }

  const checkoutSent=useRef(false);
  useEffect(() => { if (!loading && !commerceLoading && lines.length && !checkoutSent.current) { checkoutSent.current = true; trackCheckoutStart(lines); } }, [loading, commerceLoading, lines]);

  useEffect(() => {
    if (!paymentSuccess) return;
    const timer = window.setTimeout(() => clearCart(), 0);
    return () => window.clearTimeout(timer);
  }, [paymentSuccess, clearCart]);

  useEffect(() => {
    let cancelled = false;

    async function prefillCheckout() {
      try {
        const response = await fetch("/api/checkout/context", { cache: "no-store" });
        if (!response.ok) return;
        const context = await response.json() as CheckoutContext;
        if (cancelled || !context.user) return;
        setSignedIn(true);
        setInternalTest(context.profile?.role === "admin");

        const form = formRef.current;
        if (!form) return;

        const fullName = context.address?.full_name || context.profile?.full_name || "";
        const { firstName, lastName } = splitFullName(fullName);
        const values: Record<string, string> = {
          firstName,
          lastName,
          email: context.user.email || "",
          phone: context.address?.phone || context.profile?.phone || "",
          addressLine: context.address?.address_line || "",
          city: context.address?.city || "",
          district: context.address?.district || "",
          postalCode: context.address?.postal_code || "",
          addressTitle: context.address?.title || "",
        };

        for (const [name, value] of Object.entries(values)) {
          if (!value) continue;
          const element = form.elements.namedItem(name);
          if (element instanceof HTMLInputElement && !element.value.trim()) {
            element.value = value;
          }
        }
      } catch {
        // Checkout remains usable for guest/manual entry if profile prefill is unavailable.
      }
    }

    void prefillCheckout();
    return () => { cancelled = true; };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || loading || commerceLoading || !lines.length || hasUnknownPrice || total === null) return;

    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const selectedPaymentMethod = submitter instanceof HTMLButtonElement && submitter.value === "eft" ? "eft" : "card";
    setPaymentMethod(selectedPaymentMethod);
    trackCheckoutProgress("form_submitted");
    let failureStage: "order_failed" | "payment_session_failed" = "order_failed";
    let failureCode: "network" | "server" = "network";
    setSubmitting(true);
    setSubmitError("");

    try {
      const form = new FormData(event.currentTarget);
      const firstName = String(form.get("firstName") || "").trim();
      const lastName = String(form.get("lastName") || "").trim();
      const email = String(form.get("email") || "").trim();
      const phoneInput = String(form.get("phone") || "").trim();
      const phone = normaliseCheckoutPhone(phoneInput);
      if (!phone) {
        failureCode = "server";
        setInvalidField("phone");
        formRef.current?.querySelector<HTMLInputElement>('[name="phone"]')?.focus();
        trackCheckoutProgress("form_invalid", "validation", "contact", "phone");
        throw new Error("Telefon numarasını 05XX XXX XX XX biçiminde girin.");
      }
      const addressLine = String(form.get("addressLine") || "").trim();
      const city = String(form.get("city") || "").trim();
      const district = String(form.get("district") || "").trim();
      const postalCode = String(form.get("postalCode") || "").trim();
      const fullName = [firstName, lastName].filter(Boolean).join(" ");

      if (!firstName || !lastName || !email || !phone || !addressLine || !city || !district) {
        failureCode = "server";
        trackCheckoutProgress("form_invalid", "validation");
        throw new Error("Lütfen zorunlu teslimat ve iletişim bilgilerini doldurun.");
      }

      const sameBilling = form.get("sameBilling") === "on";
      const eventCart=gaCart(lines);
      gaEvent("add_shipping_info",{...eventCart,shipping_tier:"standard"});
      gaEvent("add_payment_info",{...eventCart,payment_type:selectedPaymentMethod === "eft" ? "bank_transfer" : "card"});
      const analytics = analyticsOrderContext();
      await Promise.race([flushAnalytics(), new Promise<void>(resolve => setTimeout(resolve, 1500))]);
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analytics,
          diagnostics: { sessionId: analytics?.sessionId, attemptId: checkoutAttemptId() },
          email,
          phone,
          saveToProfile: signedIn && form.get("saveProfile") === "on",
          shipping: {
            fullName,
            title: String(form.get("addressTitle") || "").trim(),
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
          affiliateCode: coupon?.code || undefined,
          items: lines.map(({ line }) => ({
            slug: line.slug,
            qty: line.qty,
            size: line.size,
            color: line.color,
          })),
        }),
      });

      const orderBody = await readJsonResponse<CreatedOrder>(orderResponse);
      if (!orderResponse.ok || !orderBody.orderId) {
        failureCode = "server";
        throw new Error(orderBody.error || "Sipariş oluşturulamadı.");
      }

      failureStage = "payment_session_failed";
      if (selectedPaymentMethod === "card" && orderBody.orderNo) {
        try { sessionStorage.setItem("elmas_ga_purchase_"+orderBody.orderNo,JSON.stringify({...eventCart,transaction_id:orderBody.orderNo})); } catch { /* Storage restrictions must not block payment. */ }
      }

      if (selectedPaymentMethod === "eft") {
        const eftResponse = await fetch("/api/payments/eft/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: orderBody.orderId,
            orderNo: orderBody.orderNo,
          }),
        });
        const eft = await readJsonResponse<{ status?: string }>(eftResponse);
        if (!eftResponse.ok) {
          failureCode = "server";
          throw new Error(eft.error || "EFT/Havale ödeme kaydı oluşturulamadı.");
        }
        clearCart();
        setEftOrder({
          orderId: orderBody.orderId,
          orderNo: orderBody.orderNo,
          status: eft.status || "pending",
        });
        setSubmitting(false);
        return;
      }

      const paymentResponse = await fetch("/api/payments/tosla/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderBody.orderId,
          email,
          diagnostics: { sessionId: analytics?.sessionId, attemptId: checkoutAttemptId() },
        }),
      });

      const payment = await readJsonResponse<PaymentStart>(paymentResponse);
      if (!paymentResponse.ok) {
        failureCode = "server";
        throw new Error(payment.error || "Ödeme oturumu başlatılamadı.");
      }

      if (payment.paymentUrl) {
        window.location.assign(payment.paymentUrl);
        return;
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
      if (failureCode === "network") trackCheckoutProgress(failureStage, "network");
      setSubmitError(error instanceof Error ? error.message : "Sipariş başlatılamadı.");
      setSubmitting(false);
    }
  }

  if (paymentReview) {
    return <><StoreHeader/><main className="checkout-page"><section className="checkout-main">
      <span className="checkout-kicker">ÖDEME KONTROLÜ</span><h1>Ödemeniz kontrol ediliyor.</h1>
      <p>Ödeme alındı ancak siparişinizin stok onayı için destek ekibimizin kontrolü gerekiyor. Lütfen tekrar ödeme yapmayın.</p>
      <a href="https://wa.me/905356007011" target="_blank" rel="noopener noreferrer">WhatsApp’tan bize ulaşın →</a>
      <p><Link href="/siparis-takip">Siparişimi takip et →</Link></p>
    </section></main></>;
  }

  if (paymentSuccess) {
    return <><StoreHeader/><main className="checkout-page">
      <section className="checkout-main">
        <span className="checkout-kicker">ÖDEME BAŞARILI</span>
        <h1>Siparişiniz alındı.</h1>
        <p>{paymentSuccess.orderNo ? `Sipariş numaranız: ${paymentSuccess.orderNo}` : "Ödemeniz başarıyla tamamlandı."}</p>
        <p>Siparişiniz ödeme onayıyla birlikte işleme alındı.</p>
        <Link href="/hesabim">Siparişlerimi görüntüle →</Link>
      </section>
    </main></>;
  }

  if (eftOrder) {
    return <><StoreHeader/><main className="checkout-page eft-checkout-result">
      <section className="checkout-main">
        <span className="checkout-kicker">SİPARİŞ ALINDI</span>
        <h1>EFT / Havale bilgileri</h1>
        <p className="checkout-intro">Siparişiniz oluşturuldu. Ödemenizi aşağıdaki hesaba yaptıktan sonra “Ödemeyi yaptım” butonuna basın.</p>
        <BankTransferPaymentCard orderId={eftOrder.orderId} orderNo={eftOrder.orderNo} initialStatus={eftOrder.status}/>
        <Link href="/hesabim/siparisler">Siparişlerimi görüntüle →</Link>
      </section>
    </main></>;
  }

  return <><StoreHeader/><main className="checkout-page">
    <form ref={formRef} id="checkout-form" className="checkout-main" onSubmit={handleSubmit}
      onFocusCapture={() => { if (!formStarted.current) { formStarted.current = true; trackCheckoutProgress("form_started"); } }}
      onChange={() => { if (!formStarted.current) { formStarted.current = true; trackCheckoutProgress("form_started"); } trackCompletedGroups(); }}
      onInputCapture={event => {
        if ((event.target as HTMLInputElement).name === invalidField) setInvalidField("");
      }}
      onInvalidCapture={event => {
        const name = (event.target as HTMLInputElement).name;
        if (formRef.current?.querySelector(":invalid") === event.target) setInvalidField(name);
        if (Date.now() - invalidAt.current < 1000) return;
        invalidAt.current = Date.now();
        trackCheckoutProgress("form_invalid", "validation", ["firstName", "lastName", "email", "phone"].includes(name) ? "contact" : ["companyName", "taxOffice", "taxNumber", "invoiceEmail"].includes(name) ? "invoice" : "address", CHECKOUT_FIELDS.includes(name as CheckoutField) ? name as CheckoutField : undefined);
      }}>
      {internalTest && <p role="status" className="checkout-error-box">Yönetici hesabıyla oluşturulan sipariş deneme olarak kaydedilir; gerçek satış istatistiklerine ve Meta satın alma olaylarına dahil edilmez.</p>}
      <Link href="/sepet" className="checkout-back">← Sepete dön</Link>
      {paymentReturn && <p role="alert" className="checkout-error-box">Ödeme henüz tamamlanmadı. Bankanızdan ücret çekildiyse tekrar ödeme yapmadan bizimle iletişime geçin.</p>}
      <div className="checkout-progress"><span className="done">01 Sepet</span><span className="active">02 Bilgiler</span><span>03 Ödeme</span></div>
      <span className="checkout-kicker">GÜVENLİ ÖDEME</span><h1>Sipariş bilgileri</h1><p className="checkout-intro">Üye olmadan siparişinizi tamamlayabilirsiniz. Teslimat bilgilerinizi girdikten sonra ödeme yönteminizi seçin.</p>
      <div className="checkout-mobile-intro" aria-live="polite"><div><span>ÖDENECEK TOPLAM</span><strong>{hasUnknownPrice || commerceLoading || total === null ? "Hesaplanıyor" : formatPrice(total)}</strong></div><small>{shippingCampaignActive || freeShipping ? "Kargo ücretsiz" : "Kargo dahil toplam"} · 3D Secure kart veya havale</small><Link href="/kargo-iade">Teslimat ve iade koşulları →</Link></div>
      <div className="checkout-step"><span>01</span><div><h2>İletişim</h2><p className="checkout-field-intro">Sipariş bilgilendirmeleri ve teslimat için kullanılır.</p>
        <div className="form-grid checkout-field-grid">
          <label>Ad <input required name="firstName" autoComplete="given-name" placeholder="Adınız"/></label>
          <label>Soyad <input required name="lastName" autoComplete="family-name" placeholder="Soyadınız"/></label>
          <label>E-posta <input required name="email" type="email" autoComplete="email" inputMode="email" placeholder="ornek@eposta.com"/></label>
          <label>Telefon <input required name="phone" type="tel" autoComplete="tel" inputMode="tel" maxLength={22} placeholder="05XX XXX XX XX" onBlur={e => { const phone = normaliseCheckoutPhone(e.currentTarget.value); if (phone) e.currentTarget.value = phone; }} aria-describedby="checkout-phone-hint"/></label>
        </div>
        <p className="checkout-field-hint" id="checkout-phone-hint">Başına 0 veya +90 yazarak girebilirsiniz. Boşluklar otomatik düzeltilir.</p>
        {invalidField && ["firstName","lastName","email","phone"].includes(invalidField) && <p className="checkout-field-alert" role="alert">{checkoutFieldMessages[invalidField]}</p>}
      </div></div>
      <div className="checkout-step"><span>02</span><div><h2>Teslimat adresi</h2>
        <div className="form-grid checkout-field-grid">
          <label className="full">Açık adres <input required name="addressLine" autoComplete="street-address" placeholder="Mahalle, sokak, bina ve daire numarası"/></label>
          <label>İl <input required name="city" autoComplete="address-level1" placeholder="İl"/></label>
          <label>İlçe <input required name="district" autoComplete="address-level2" placeholder="İlçe"/></label>
          <label>Posta kodu <span className="checkout-optional">İsteğe bağlı</span><input name="postalCode" inputMode="numeric" autoComplete="postal-code" placeholder="Posta kodu"/></label>
          {signedIn && <label>Adres başlığı <span className="checkout-optional">İsteğe bağlı</span><input name="addressTitle" placeholder="Ev / İş"/></label>}
        </div>
        {signedIn && <label className="check-row checkout-save-details"><input name="saveProfile" type="checkbox" defaultChecked/> Telefonumu ve teslimat adresimi hesabıma kaydet</label>}
        {invalidField && ["addressLine","city","district"].includes(invalidField) && <p className="checkout-field-alert" role="alert">{checkoutFieldMessages[invalidField]}</p>}
      </div></div>
      <div className="checkout-step"><span>03</span><div><h2>Fatura</h2><div className="invoice-type-switch"><button type="button" className={invoiceType === "individual" ? "selected" : ""} onClick={() => setInvoiceType("individual")}>Bireysel</button><button type="button" className={invoiceType === "company" ? "selected" : ""} onClick={() => setInvoiceType("company")}>Kurumsal</button></div>{invoiceType === "company" && <div className="form-grid invoice-company-fields"><input required name="companyName" placeholder="Firma unvanı"/><input required name="taxOffice" placeholder="Vergi dairesi"/><input required name="taxNumber" placeholder="Vergi / T.C. no"/><input name="invoiceEmail" type="email" placeholder="E-fatura e-posta"/></div>}<label className="check-row"><input name="sameBilling" type="checkbox" defaultChecked/> Fatura adresi teslimat adresi ile aynı</label><p className="checkout-note">Fatura bilgileriniz siparişinizle birlikte kaydedilir.</p>{invalidField && ["companyName","taxOffice","taxNumber","invoiceEmail"].includes(invalidField) && <p className="checkout-field-alert" role="alert">{checkoutFieldMessages[invalidField]}</p>}</div></div>
      <div className="checkout-step payment-step"><span>04</span><div><h2>Ödeme yöntemi</h2>
        <p className="checkout-payment-help">Bilgilerinizi kontrol ettikten sonra ödeme yönteminize dokunun. Siparişiniz oluşturularak seçtiğiniz ödeme adımına geçilir.</p>
        <p className="checkout-payment-total"><span>Toplam</span><b>{hasUnknownPrice ? "—" : commerceLoading ? "Hesaplanıyor" : total === null ? "Kargo tutarı onayda" : formatPrice(total)}</b></p>
        <div className="payment-method-grid" aria-busy={submitting}>
          <button type="submit" name="paymentMethod" value="card" className="payment-method-card" disabled={submitDisabled}>
            <b>Kredi / Banka Kartı</b><small>{submitting && paymentMethod === "card" ? "Ödeme ekranı hazırlanıyor..." : "Güvenli kart ödemesine geç →"}</small>
          </button>
          <button type="submit" name="paymentMethod" value="eft" className="payment-method-card" disabled={submitDisabled}>
            <b>EFT / Havale</b><small>{submitting && paymentMethod === "eft" ? "Siparişiniz hazırlanıyor..." : "Sipariş oluştur, banka bilgilerini gör →"}</small>
          </button>
        </div>
        {submitError && <p className="checkout-error-box" role="alert">{submitError}</p>}
      </div></div>
    </form>
    <aside className="checkout-summary premium-checkout-summary">
      <div className="summary-kicker">SİPARİŞ ÖZETİ</div><h3>Ödemeniz</h3>
      {loading && cart.length > 0 ? <p>Sepet güncelleniyor...</p> : lines.length === 0 ? <p>Sepetiniz boş.</p> : lines.map(({ line, product }) => <div className="mini-product" key={line.slug + line.size + line.color}><img src={product.image} alt={product.name}/><p><b>{product.name}</b><br/><small>{line.qty} adet {line.size ? "· " + line.size : ""}{line.color ? " · " + line.color : ""}</small></p></div>)}
      <hr/>
      <p><span>Ara toplam</span><b>{hasUnknownPrice ? "Fiyat listesi bekleniyor" : formatPrice(subtotal)}</b></p>
      <div className="affiliate-checkout-promo"><label htmlFor="affiliate-promo-code">İndirim kodu</label><div><input id="affiliate-promo-code" type="text" autoComplete="off" placeholder="İndirim kodu" value={couponInput} onChange={e=>{setCouponInput(e.target.value.toUpperCase());if (coupon?.code!==e.target.value.toUpperCase()){setCoupon(null);setCouponMessage("");}}}/><button type="button" onClick={applyCoupon} disabled={couponLoading}>{couponLoading?"Kontrol ediliyor":"Uygula"}</button></div>{couponMessage&&<small role="status">{couponMessage}</small>}{coupon&&<button type="button" className="affiliate-promo-clear" onClick={()=>{setCoupon(null);setCouponInput("");setCouponMessage("İndirim kaldırıldı.");void fetch("/api/influencer/clear",{method:"POST"}).catch(()=>undefined)}}>Kodu kaldır</button>}</div>
      {coupon&&<p><span>{coupon.code} indirimi (%{coupon.percent})</span><b>-{formatPrice(discount)}</b></p>}
      <p><span>Kargo</span><b>{commerceLoading ? "Hesaplanıyor" : freeShipping ? "Ücretsiz" : hasUnknownPrice ? "Hesaplanacak" : effectiveShippingFee === null ? "Kargo tutarı onayda" : formatPrice(effectiveShippingFee)}</b></p>
      <p className="checkout-grand-total"><span>Toplam</span><b>{hasUnknownPrice ? "—" : commerceLoading ? "Hesaplanıyor" : total === null ? "Kargo tutarı onayda" : formatPrice(total)}</b></p>
      <div className="checkout-trust">
        {shippingCampaignActive && <span><b>Kargo bizden</b><small>31 Ekim sonuna kadar minimum tutar olmadan ücretsiz.</small></span>}
        {paymentMethod === "card"
          ? <span><b>3D Secure koruması</b><small>Kart bilgileriniz Elmas Triko sunucularında tutulmaz.</small></span>
          : <span><b>Manuel ödeme kontrolü</b><small>EFT/Havale ödemesi banka hesabı kontrol edildikten sonra onaylanır.</small></span>}
        <span><b>NES e-Arşiv</b><small>Ödeme onaylandıktan sonra faturanız oluşturulur.</small></span>
        <span><b>1–2 iş gününde kargoya teslim</b><small>Ödeme onayından sonra hazırlanır. Kargo firmasının teslim süresi bölgeye göre değişir.</small></span>
        <span><b>Yardıma mı ihtiyacınız var?</b><small><a href="https://wa.me/905356007011" target="_blank" rel="noopener noreferrer">WhatsApp desteği</a> · <Link href="/kargo-iade">Teslimat ve iade</Link> · <Link href="/siparis-takip">Sipariş takibi</Link></small></span>
      </div>
    </aside>
  </main></>;
}
