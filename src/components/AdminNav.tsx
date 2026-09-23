"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, FileText, Gauge, History, Mail, Plug, SearchCheck, Settings, ShoppingCart, Users, ExternalLink } from "lucide-react";

const items = [
  ["/yonetim", "Genel Bakış", Gauge],
  ["/yonetim/urunler", "Ürünler", Boxes],
  ["/yonetim/siparisler", "Siparişler", ShoppingCart],
  ["/yonetim/kullanicilar", "Müşteriler", Users],
  ["/yonetim/mesajlar", "Mesajlar", Mail],
  ["/yonetim/blog", "Blog", FileText],
  ["/yonetim/seo", "SEO & Sistem", SearchCheck],
  ["/yonetim/entegrasyonlar", "Entegrasyonlar", Plug],
  ["/yonetim/ayarlar", "Ayarlar", Settings],
  ["/yonetim/loglar", "İşlem Geçmişi", History],
] as const;

export default function AdminNav() {
  const pathname = usePathname();
  return <aside className="admin-sidebar">
    <Link href="/yonetim" className="admin-brand">
      <span className="admin-brand-mark">ET</span>
      <span className="admin-brand-copy"><strong>Elmas Triko</strong><small>Commerce Admin</small></span>
    </Link>
    <div className="admin-nav-label">YÖNETİM</div>
    <nav>{items.map(([href,label,Icon]) => {
      const active = href === "/yonetim" ? pathname === href : pathname.startsWith(href);
      return <Link href={href} key={href} className={active ? "active" : ""}>
        <Icon size={17} strokeWidth={1.8}/><span>{label}</span>
      </Link>
    })}</nav>
    <div className="admin-sidebar-bottom">
      <div className="admin-status-card"><span className="admin-status-dot"/><div><b>Sistem aktif</b><small>Production bağlantısı açık</small></div></div>
      <Link href="/" className="admin-store-link">Mağazayı görüntüle <ExternalLink size={14}/></Link>
    </div>
  </aside>;
}
