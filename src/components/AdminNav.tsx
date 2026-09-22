import Link from "next/link";
import { BarChart3, Boxes, FileText, Gauge, History, Mail, Plug, SearchCheck, Settings, ShoppingCart, Users } from "lucide-react";

const items = [
  ["/yonetim", "Genel Bakış", Gauge],
  ["/yonetim/urunler", "Ürünler", Boxes],
  ["/yonetim/siparisler", "Siparişler", ShoppingCart],
  ["/yonetim/kullanicilar", "Kullanıcılar", Users],
  ["/yonetim/mesajlar", "Mesajlar & Bülten", Mail],
  ["/yonetim/blog", "Blog", FileText],
  ["/yonetim/seo", "SEO & Sistem", SearchCheck],
  ["/yonetim/entegrasyonlar", "Entegrasyonlar", Plug],
  ["/yonetim/ayarlar", "Ayarlar", Settings],
  ["/yonetim/loglar", "İşlem Geçmişi", History],
  ["/", "Siteyi Gör", BarChart3],
] as const;

export default function AdminNav() {
  return <aside className="admin-sidebar">
    <div className="admin-brand"><span>ELMAS TRİKO</span><strong>Yönetim</strong></div>
    <nav>{items.map(([href,label,Icon]) => <Link href={href} key={href}><Icon size={17}/><span>{label}</span></Link>)}</nav>
  </aside>;
}
