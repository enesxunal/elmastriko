import type { Metadata } from "next";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { company } from "@/lib/company";

export const metadata: Metadata = {
  title: "Mesafeli Satış Sözleşmesi",
  description: "Elmas Triko mesafeli satış ve teslimat koşulları.",
  alternates: { canonical: "/mesafeli-satis" },
};

export default function DistanceSalesPage() {
  return <><StoreHeader/><main className="content-page legal-page">
    <section className="content-hero"><span>MESAFELİ SATIŞ</span><h1>Mesafeli satış sözleşmesi.</h1><p>Sipariş öncesi bilgilendirme, ödeme, teslimat, cayma ve iade esasları aşağıda yer alır.</p></section>
    <section className="legal-copy">
      <h2>Satıcı</h2><p>{company.legalName}<br/>{company.address}<br/>Vergi Dairesi: {company.taxOffice}<br/>Vergi No: {company.taxNumber}<br/>MERSİS: {company.mersis}</p>
      <h2>Ürün ve bedel</h2><p>Ürünün temel nitelikleri, satış fiyatı, varsa indirim bilgisi ve kargo bedeli sipariş öncesinde ürün ve checkout ekranlarında gösterilir.</p>
      <h2>Ödeme</h2><p>Kart ödemeleri Tosla İşim altyapısı ve bankanızın 3D Secure doğrulamasıyla alınır. EFT / Havale seçeneğinde ödeme, banka hesabı kontrol edildikten sonra onaylanır.</p>
      <h2>Teslimat</h2><p>Ödemesi onaylanan siparişler {company.dispatchTime} içinde kargoya teslim edilir. Kargo firmasının adresinize ulaştırma süresi bölgeye göre değişir. Gönderi bilgilerini sipariş takip sayfasından kontrol edebilirsiniz.</p>
      <h2>Cayma ve iade</h2><p>Cayma ve iade talepleri yürürlükteki tüketici mevzuatı ve ürünün niteliği dikkate alınarak değerlendirilir. Talebinizi sipariş numaranızla birlikte destek@elmastriko.com adresine veya 0535 600 70 11 WhatsApp destek hattına iletebilirsiniz. Gönderim adımları için teslimat ve iade sayfasını inceleyin.</p>
    </section>
  </main><StoreFooter/></>;
}
