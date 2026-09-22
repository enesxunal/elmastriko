import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import Link from "next/link";

export default function OrderTrackingPage() {
  return <><StoreHeader/><main className="content-page">
    <section className="content-hero"><span>SİPARİŞ TAKİBİ</span><h1>Siparişinizi takip edin.</h1><p>Üye kullanıcılar sipariş geçmişini doğrudan hesap alanından görüntüleyebilir. Üyeliksiz siparişler için sipariş no + e-posta doğrulamalı takip ekranı ödeme sistemiyle birlikte aktif edilecektir.</p></section>
    <section className="tracking-options">
      <Link href="/hesabim"><span>ÜYE SİPARİŞLERİ</span><h2>Hesabımdan görüntüle</h2><p>Sipariş geçmişi, ödeme ve teslimat durumu.</p></Link>
      <div><span>ÜYELİKSİZ SİPARİŞ</span><h2>Takip formu hazırlanıyor</h2><p>Ödeme sağlayıcısı ve canlı sipariş numarası akışı açıldığında burada sipariş no + e-posta ile takip yapılacak.</p></div>
    </section>
  </main><StoreFooter/></>;
}
