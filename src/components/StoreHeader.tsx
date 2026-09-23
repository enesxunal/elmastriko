"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, Search, ShoppingBag, UserRound } from "lucide-react";
import { useStore } from "./StoreProvider";

export default function StoreHeader() {
  const { cartCount, favorites } = useStore();

  return (
    <>
      <div className="topbar">
        <span>5.000 TL üzeri ücretsiz kargo</span>
        <span className="topbar-center">Yeni sezon · 2026</span>
        <span>Güvenli ödeme</span>
      </div>

      <header className="site-header">
        <details className="mobile-menu">
          <summary aria-label="Menüyü aç"><span/><span/></summary>
          <div className="mobile-menu-panel">
            <div className="mobile-menu-title">Koleksiyonlar</div>

            <div className="mobile-menu-group">
              <Link className="mobile-menu-parent" href="/kadin">Kadın <ArrowRight size={16}/></Link>
              <div className="mobile-subgrid">
                <Link href="/yeni-gelenler">Yeni Gelenler</Link>
                <Link href="/arama?type=Hırka">Hırkalar</Link>
                <Link href="/arama?type=Kazak">Kazaklar</Link>
                <Link href="/arama?type=Ceket">Ceketler</Link>
                <Link href="/arama?q=fermuarlı">Fermuarlı Triko</Link>
                <Link href="/arama?q=desenli">Desenli Triko</Link>
              </div>
            </div>

            <div className="mobile-menu-group">
              <Link className="mobile-menu-parent" href="/erkek">Erkek <ArrowRight size={16}/></Link>
              <div className="mobile-subgrid">
                <Link href="/yeni-gelenler">Yeni Gelenler</Link>
                <Link href="/arama?type=Kazak">Kazaklar</Link>
                <Link href="/arama?type=Hırka">Hırkalar</Link>
                <Link href="/arama?q=fermuarlı">Fermuarlı Modeller</Link>
                <Link href="/arama?q=desenli">Desenli Modeller</Link>
                <Link href="/erkek">Tüm Erkek</Link>
              </div>
            </div>

            <div className="mobile-feature-links">
              <Link href="/yeni-gelenler">Yeni Gelenler <ArrowRight size={14}/></Link>
              <Link href="/arama">Elmas Seçkisi <ArrowRight size={14}/></Link>
            </div>

            <div className="mobile-menu-secondary">
              <Link href="/hesabim">Hesabım</Link>
              <Link href="/favoriler">Favoriler</Link>
              <Link href="/siparis-takip">Sipariş Takibi</Link>
            </div>
          </div>
        </details>

        <nav className="nav-left" aria-label="Ana menü">
          <div className="mega-trigger">
            <Link className="mega-link" href="/kadin">Kadın</Link>
            <div className="mega-menu">
              <div className="mega-menu-inner">
                <div className="mega-kicker">Kadın Koleksiyonu</div>
                <div className="mega-column">
                  <h4>Giyim</h4>
                  <Link href="/yeni-gelenler">Yeni Gelenler</Link>
                  <Link href="/arama?type=Hırka">Hırkalar</Link>
                  <Link href="/arama?type=Kazak">Kazaklar</Link>
                  <Link href="/arama?type=Ceket">Ceketler</Link>
                  <Link href="/arama?q=fermuarlı">Fermuarlı Triko</Link>
                </div>
                <div className="mega-column">
                  <h4>Keşfet</h4>
                  <Link href="/arama?q=desenli">Desenli Triko</Link>
                  <Link href="/arama?q=düz">Düz & Zamansız</Link>
                  <Link href="/yeni-gelenler">Çok Satanlar</Link>
                  <Link href="/kadin">Tüm Kadın</Link>
                </div>
                <Link className="mega-editorial" href="/kadin">
                  <img src="/images/category-women.webp" alt="Kadın koleksiyonu"/>
                  <div><span>Yeni sezon</span><strong>Kadın / 2026</strong><b>Keşfet <ArrowRight size={14}/></b></div>
                </Link>
              </div>
            </div>
          </div>

          <div className="mega-trigger">
            <Link className="mega-link" href="/erkek">Erkek</Link>
            <div className="mega-menu">
              <div className="mega-menu-inner">
                <div className="mega-kicker">Erkek Koleksiyonu</div>
                <div className="mega-column">
                  <h4>Giyim</h4>
                  <Link href="/yeni-gelenler">Yeni Gelenler</Link>
                  <Link href="/arama?type=Kazak">Kazaklar</Link>
                  <Link href="/arama?type=Hırka">Hırkalar</Link>
                  <Link href="/arama?q=fermuarlı">Fermuarlı Modeller</Link>
                  <Link href="/arama?q=desenli">Desenli Modeller</Link>
                </div>
                <div className="mega-column">
                  <h4>Keşfet</h4>
                  <Link href="/arama?q=günlük">Günlük Triko</Link>
                  <Link href="/arama?q=klasik">Klasik Seçki</Link>
                  <Link href="/yeni-gelenler">Çok Satanlar</Link>
                  <Link href="/erkek">Tüm Erkek</Link>
                </div>
                <Link className="mega-editorial" href="/erkek">
                  <img src="/images/category-men.webp" alt="Erkek koleksiyonu"/>
                  <div><span>Yeni sezon</span><strong>Erkek / 2026</strong><b>Keşfet <ArrowRight size={14}/></b></div>
                </Link>
              </div>
            </div>
          </div>

          <Link href="/yeni-gelenler">Yeni Gelenler</Link>
        </nav>

        <Link className="brand" href="/" aria-label="Elmas Triko ana sayfa">
          <Image src="/elmas-triko.png" alt="Elmas Triko" width={290} height={105} priority />
        </Link>

        <div className="header-right">
          <div className="mega-trigger collection-trigger">
            <Link className="collection-link mega-link" href="/arama">Koleksiyonlar</Link>
            <div className="mega-menu">
              <div className="mega-menu-inner collections-mega">
                <div className="mega-kicker">Elmas Edit</div>
                <Link className="collection-tile" href="/yeni-gelenler"><span>01</span><strong>Yeni Sezon</strong><small>Son eklenen parçalar</small></Link>
                <Link className="collection-tile" href="/arama?q=desenli"><span>02</span><strong>Signature Knit</strong><small>Desen ve jakar seçkisi</small></Link>
                <Link className="collection-tile" href="/arama?q=klasik"><span>03</span><strong>Modern Klasikler</strong><small>Zamansız triko parçalar</small></Link>
                <Link className="collection-tile dark" href="/arama"><span>04</span><strong>Tüm Koleksiyonlar</strong><small>Elmas dünyasını keşfet</small></Link>
              </div>
            </div>
          </div>

          <div className="header-actions">
            <Link aria-label="Ara" href="/arama"><Search size={19} strokeWidth={1.5}/></Link>
            <Link aria-label="Hesabım" href="/hesabim"><UserRound size={19} strokeWidth={1.5}/></Link>
            <Link aria-label="Favoriler" href="/favoriler"><Heart size={19} strokeWidth={1.5}/>{favorites.length > 0 && <span className="cart-dot">{favorites.length}</span>}</Link>
            <Link aria-label="Sepet" href="/sepet"><ShoppingBag size={19} strokeWidth={1.5}/>{cartCount > 0 && <span className="cart-dot">{cartCount}</span>}</Link>
          </div>
        </div>
      </header>
    </>
  );
}
