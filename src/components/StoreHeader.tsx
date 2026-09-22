"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useState } from "react";
import { useStore } from "./StoreProvider";

export default function StoreHeader() {
  const [open, setOpen] = useState(false);
  const { cartCount, favorites } = useStore();
  return (
    <>
      <div className="store-topbar">
        <span>5.000 TL üzeri ücretsiz kargo</span>
        <span>Elmas Triko · Yeni Sezon</span>
        <span>Güvenli alışveriş</span>
      </div>
      <header className="store-header">
        <button className="store-menu-btn" onClick={() => setOpen(true)} aria-label="Menü"><Menu size={21}/></button>
        <nav className="store-nav">
          <Link href="/kadin">Kadın</Link>
          <Link href="/erkek">Erkek</Link>
          <Link href="/yeni-gelenler">Yeni Gelenler</Link>
        </nav>
        <Link href="/" className="store-logo"><Image src="/elmas-triko.png" alt="Elmas Triko" width={220} height={80}/></Link>
        <div className="store-actions">
          <Link href="/arama" aria-label="Ara"><Search size={19}/></Link>
          <Link href="/hesabim" aria-label="Hesabım"><UserRound size={19}/></Link>
          <Link className="store-icon-link" href="/favoriler" aria-label="Favoriler"><Heart size={19}/>{favorites.length > 0 && <span>{favorites.length}</span>}</Link>
          <Link className="store-icon-link" href="/sepet" aria-label="Sepet"><ShoppingBag size={19}/>{cartCount > 0 && <span>{cartCount}</span>}</Link>
        </div>
      </header>
      {open && <div className="drawer-backdrop" onClick={() => setOpen(false)}>
        <aside className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
          <button className="drawer-close" onClick={() => setOpen(false)}><X size={22}/></button>
          <span className="drawer-kicker">Koleksiyonlar</span>
          <Link href="/kadin" onClick={() => setOpen(false)}>Kadın</Link>
          <Link href="/erkek" onClick={() => setOpen(false)}>Erkek</Link>
          <Link href="/yeni-gelenler" onClick={() => setOpen(false)}>Yeni Gelenler</Link>
          <div className="drawer-sub">
            <Link href="/favoriler">Favoriler</Link>
            <Link href="/hesabim">Hesabım</Link>
            <Link href="/sepet">Sepet</Link>
          </div>
        </aside>
      </div>}
    </>
  );
}
