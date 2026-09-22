import Image from "next/image";
import Link from "next/link";

export default function StoreFooter() {
  return <footer className="store-footer">
    <div className="store-footer-top">
      <div><Image src="/elmas-triko-w.png" alt="Elmas Triko" width={230} height={90}/><p>Kadın ve erkek için modern triko koleksiyonları.</p></div>
      <div><h4>Alışveriş</h4><Link href="/kadin">Kadın</Link><Link href="/erkek">Erkek</Link><Link href="/yeni-gelenler">Yeni Gelenler</Link></div>
      <div><h4>Yardım</h4><Link href="/kargo-iade">Kargo & İade</Link><Link href="/siparis-takip">Sipariş Takibi</Link><Link href="/iletisim">İletişim</Link></div>
      <div><h4>Kurumsal</h4><Link href="/hakkimizda">Hakkımızda</Link><Link href="/kvkk">KVKK</Link><Link href="/mesafeli-satis">Mesafeli Satış</Link></div>
    </div>
    <div className="store-footer-bottom">© 2026 Elmas Triko</div>
  </footer>;
}
