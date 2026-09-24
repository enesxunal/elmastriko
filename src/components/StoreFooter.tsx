import Image from "next/image";
import Link from "next/link";

export default function StoreFooter() {
  return <footer className="store-footer">
    <div className="store-footer-top">
      <div><Image src="/elmas-triko-w.png" alt="Elmas Triko" width={230} height={90}/><p>Kadın ve erkek için modern triko koleksiyonları.</p></div>
      <div><h4>Alışveriş</h4><Link href="/kadin">Kadın</Link><Link href="/erkek">Erkek</Link><Link href="/yeni-gelenler">Yeni Gelenler</Link></div>
      <div><h4>Yardım</h4><Link href="/kargo-iade">Teslimat – İade – İptal</Link><Link href="/siparis-takip">Sipariş Takibi</Link><Link href="/iletisim">İletişim</Link></div>
      <div><h4>Kurumsal</h4><Link href="/hakkimizda">Hakkımızda</Link><Link href="/blog">Blog</Link><Link href="/kvkk">KVKK</Link><Link href="/gizlilik">Gizlilik Politikası</Link><Link href="/mesafeli-satis">Mesafeli Satış Sözleşmesi</Link></div>
    </div>
    <div className="store-footer-bottom"><span>© 2026 Elmas Triko</span><span className="payment-brands" aria-label="Desteklenen kartlar"><b>VISA</b><b>Mastercard</b><b>TROY</b></span></div>
  </footer>;
}
