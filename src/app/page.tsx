"use client";

import Image from "next/image";
import Link from "next/link";
import NewsletterForm from "@/components/NewsletterForm";
import { useStore } from "@/components/StoreProvider";
import { ArrowRight, Heart, Search, ShoppingBag, UserRound, Camera, Plus } from "lucide-react";

const products = [
  { slug: "siyah-cizgili-triko-takim", name: "Siyah Çizgili Triko Takım", price: "Fiyat yakında", image: "/images/product-black-set.webp", tone: "Siyah / Ekru", badge: "Yeni" },
  { slug: "ekru-cizgili-triko-takim", name: "Ekru Çizgili Triko Takım", price: "Fiyat yakında", image: "/images/product-cream-set.webp", tone: "Ekru", badge: "Edit" },
  { slug: "diamond-desenli-triko-hirka", name: "Diamond Desenli Triko Hırka", price: "Fiyat yakında", image: "/images/product-white-diamond.webp", tone: "Ekru / Lacivert", badge: "Yeni" },
  { slug: "kapusonlu-desenli-triko-hirka", name: "Kapüşonlu Desenli Triko Hırka", price: "Fiyat yakında", image: "/images/product-pattern-cardigan.webp", tone: "Ekru / Mürdüm", badge: "Çok Satan" },
];

const edits = [
  { title: "Modern Klasikler", eyebrow: "01 / KADIN", image: "/images/edit-modern-classics.webp" },
  { title: "Yeni Erkek", eyebrow: "02 / ERKEK", image: "/images/edit-new-men.webp" },
  { title: "Desen Seçkisi", eyebrow: "03 / JAKAR", image: "/images/edit-pattern-selection.webp" },
];

const social = [
  "/images/category-women.webp",
  "/images/signature-knit.webp",
  "/images/edit-modern-classics.webp",
  "/images/product-pattern-cardigan.webp",
];

export default function Home() {
  const { cartCount, favorites } = useStore();
  return (
    <main>
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
              <a className="mobile-menu-parent" href="/kadin">Kadın <ArrowRight size={16}/></a>
              <div className="mobile-subgrid">
                <a href="/yeni-gelenler">Yeni Gelenler</a><a href="/arama?type=Hırka">Hırkalar</a><a href="/arama?type=Kazak">Kazaklar</a>
                <a href="/arama?type=Ceket">Ceketler</a><a href="/arama?q=fermuarlı">Fermuarlı Triko</a><a href="/arama?q=desenli">Desenli Triko</a>
              </div>
            </div>
            <div className="mobile-menu-group">
              <a className="mobile-menu-parent" href="/erkek">Erkek <ArrowRight size={16}/></a>
              <div className="mobile-subgrid">
                <a href="/yeni-gelenler">Yeni Gelenler</a><a href="/arama?type=Kazak">Kazaklar</a><a href="/arama?type=Hırka">Hırkalar</a>
                <a href="/arama?q=fermuarlı">Fermuarlı Modeller</a><a href="/arama?q=desenli">Desenli Modeller</a><a href="/erkek">Tüm Erkek</a>
              </div>
            </div>
            <div className="mobile-feature-links">
              <a href="/yeni-gelenler">Yeni Gelenler <ArrowRight size={14}/></a>
              <a href="#koleksiyon">Elmas Seçkisi <ArrowRight size={14}/></a>
            </div>
            <div className="mobile-menu-secondary">
              <a href="/hesabim">Hesabım</a><a href="/favoriler">Favoriler</a><a href="/siparis-takip">Sipariş Takibi</a>
            </div>
          </div>
        </details>

        <nav className="nav-left" aria-label="Ana menü">
          <div className="mega-trigger">
            <a className="mega-link" href="/kadin">Kadın</a>
            <div className="mega-menu">
              <div className="mega-menu-inner">
                <div className="mega-kicker">Kadın Koleksiyonu</div>
                <div className="mega-column">
                  <h4>Giyim</h4>
                  <a href="/yeni-gelenler">Yeni Gelenler</a><a href="/arama?type=Hırka">Hırkalar</a><a href="/arama?type=Kazak">Kazaklar</a><a href="/arama?type=Ceket">Ceketler</a><a href="/arama?q=fermuarlı">Fermuarlı Triko</a>
                </div>
                <div className="mega-column">
                  <h4>Keşfet</h4>
                  <a href="/arama?q=desenli">Desenli Triko</a><a href="/arama?q=düz">Düz & Zamansız</a><a href="/yeni-gelenler">Çok Satanlar</a><a href="/kadin">Tüm Kadın</a>
                </div>
                <a className="mega-editorial" href="/kadin">
                  <img src="/images/category-women.webp" alt="Kadın koleksiyonu"/>
                  <div><span>Yeni sezon</span><strong>Kadın / 2026</strong><b>Keşfet <ArrowRight size={14}/></b></div>
                </a>
              </div>
            </div>
          </div>

          <div className="mega-trigger">
            <a className="mega-link" href="/erkek">Erkek</a>
            <div className="mega-menu">
              <div className="mega-menu-inner">
                <div className="mega-kicker">Erkek Koleksiyonu</div>
                <div className="mega-column">
                  <h4>Giyim</h4>
                  <a href="/yeni-gelenler">Yeni Gelenler</a><a href="/arama?type=Kazak">Kazaklar</a><a href="/arama?type=Hırka">Hırkalar</a><a href="/arama?q=fermuarlı">Fermuarlı Modeller</a><a href="/arama?q=desenli">Desenli Modeller</a>
                </div>
                <div className="mega-column">
                  <h4>Keşfet</h4>
                  <a href="/arama?q=günlük">Günlük Triko</a><a href="/arama?q=klasik">Klasik Seçki</a><a href="/yeni-gelenler">Çok Satanlar</a><a href="/erkek">Tüm Erkek</a>
                </div>
                <a className="mega-editorial" href="/erkek">
                  <img src="/images/category-men.webp" alt="Erkek koleksiyonu"/>
                  <div><span>Yeni sezon</span><strong>Erkek / 2026</strong><b>Keşfet <ArrowRight size={14}/></b></div>
                </a>
              </div>
            </div>
          </div>

          <a href="/yeni-gelenler">Yeni Gelenler</a>
        </nav>

        <Link className="brand" href="/" aria-label="Elmas Triko ana sayfa">
          <Image src="/elmas-triko.png" alt="Elmas Triko" width={290} height={105} priority />
        </Link>

        <div className="header-right">
          <div className="mega-trigger collection-trigger">
            <a className="collection-link mega-link" href="#koleksiyon">Koleksiyonlar</a>
            <div className="mega-menu">
              <div className="mega-menu-inner collections-mega">
                <div className="mega-kicker">Elmas Edit</div>
                <a className="collection-tile" href="/yeni-gelenler"><span>01</span><strong>Yeni Sezon</strong><small>Son eklenen parçalar</small></a>
                <a className="collection-tile" href="/arama?q=desenli"><span>02</span><strong>Signature Knit</strong><small>Desen ve jakar seçkisi</small></a>
                <a className="collection-tile" href="/arama?q=klasik"><span>03</span><strong>Modern Klasikler</strong><small>Zamansız triko parçalar</small></a>
                <a className="collection-tile dark" href="#koleksiyon"><span>04</span><strong>Tüm Koleksiyonlar</strong><small>Elmas dünyasını keşfet</small></a>
              </div>
            </div>
          </div>
          <div className="header-actions">
            <Link aria-label="Ara" href="/arama"><Search size={19} strokeWidth={1.5} /></Link>
            <Link aria-label="Hesabım" href="/hesabim"><UserRound size={19} strokeWidth={1.5} /></Link>
            <Link aria-label="Favoriler" href="/favoriler"><Heart size={19} strokeWidth={1.5} />{favorites.length > 0 && <span className="cart-dot">{favorites.length}</span>}</Link>
            <Link aria-label="Sepet" href="/sepet"><ShoppingBag size={19} strokeWidth={1.5} />{cartCount > 0 && <span className="cart-dot">{cartCount}</span>}</Link>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="hero-media" />
        <div className="hero-overlay" />
        <div className="hero-mark">ET</div>
        <div className="hero-index">01 — 04</div>
        <div className="hero-content">
          <p className="eyebrow light">ELMAS TRİKO / FALL WINTER 26</p>
          <h1>Dokuyu<br/><em>yeniden</em> yorumla.</h1>
          <p className="hero-copy">Kadın ve erkek koleksiyonlarında sakin renkler, güçlü desenler ve zamansız triko formlar.</p>
          <div className="hero-ctas">
            <a href="/kadin" className="btn btn-light">Kadın koleksiyonu <ArrowRight size={16} /></a>
            <a href="/erkek" className="btn btn-line">Erkek koleksiyonu <ArrowRight size={16} /></a>
          </div>
        </div>
        <a className="scroll-note" href="#manifesto"><span>Keşfet</span><i /></a>
      </section>

      <div className="marquee" aria-hidden="true">
        <div>ELMAS TRİKO — NEW KNITWEAR — WOMEN & MEN — ELMAS TRİKO — NEW KNITWEAR — WOMEN & MEN —</div>
      </div>

      <section className="manifesto" id="manifesto">
        <div className="manifesto-number">01</div>
        <div className="manifesto-copy">
          <p className="eyebrow dark">MARKA YAKLAŞIMI</p>
          <h2>Giyilen değil,<br/><em>hissedilen</em> triko.</h2>
        </div>
        <div className="manifesto-text">
          <p>Günlük konforu güçlü bir görsel dille buluşturan, uzun süre gardıropta kalacak parçalar tasarlıyoruz.</p>
          <a href="/hakkimizda">Elmas Triko’yu keşfet <ArrowRight size={15}/></a>
        </div>
      </section>

      <section className="gender-stage" id="koleksiyon">
        <a className="gender-card women" id="kadin" href="/kadin">
          <img src="/images/category-women.webp" alt="Kadın koleksiyonu" />
          <div className="gender-overlay" />
          <div className="gender-top"><span>01</span><span>WOMEN</span></div>
          <div className="gender-bottom"><h3>Kadın</h3><span>Koleksiyonu keşfet <ArrowRight size={16}/></span></div>
        </a>
        <a className="gender-card men" id="erkek" href="/erkek">
          <img src="/images/category-men.webp" alt="Erkek koleksiyonu" />
          <div className="gender-overlay" />
          <div className="gender-top"><span>02</span><span>MEN</span></div>
          <div className="gender-bottom"><h3>Erkek</h3><span>Koleksiyonu keşfet <ArrowRight size={16}/></span></div>
        </a>
      </section>

      <section className="products-section" id="yeni">
        <div className="section-heading">
          <div>
            <p className="eyebrow dark">NEW ARRIVALS / 2026</p>
            <h2>Yeni gelenler</h2>
          </div>
          <div className="section-side">
            <p>Sezonun ilk seçkisi. Kadın ve erkek koleksiyonlarından öne çıkan triko parçalar.</p>
            <a href="/yeni-gelenler">Tümünü gör <ArrowRight size={15}/></a>
          </div>
        </div>

        <div className="product-grid">
          {products.map((product, i) => (
            <article className={"product-card product-" + (i + 1)} key={product.name}>
              <a href={"/urun/" + product.slug} className="product-image-wrap">
                <img src={product.image} alt={product.name} />
                <span className="product-badge">{product.badge}</span>
                <span className="quick-add"><Plus size={16}/> Hızlı ekle</span>
              </a>
              <div className="product-info">
                <div>
                  <h3>{product.name}</h3>
                  <p>{product.tone}</p>
                </div>
                <div className="price-row">
                  <strong>{product.price}</strong>
                  <button aria-label={product.name + " favorilere ekle"}><Heart size={17} strokeWidth={1.4}/></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="signature">
        <div className="signature-copy">
          <div className="signature-no">02</div>
          <p className="eyebrow">SIGNATURE KNIT</p>
          <h2>Desen,<br/>Elmas’ın<br/><em>imzası.</em></h2>
          <p>Geometrik yüzeyler, klasik örgü teknikleri ve modern renk birliktelikleri. Markanın karakterini taşıyan güçlü parçalar.</p>
          <a href="/arama?q=desenli" className="text-link">Desenli trikoları keşfet <ArrowRight size={16}/></a>
        </div>
        <div className="signature-visual">
          <img src="/images/signature-knit.webp" alt="Elmas Triko desen seçkisi"/>
          <Image className="signature-emblem" src="/favicon.png" alt="" width={260} height={260}/>
          <span className="vertical-type">ELMAS TRİKO · ISTANBUL</span>
        </div>
      </section>

      <section className="edits-section">
        <div className="edits-header">
          <p className="eyebrow dark">SHOP THE EDIT</p>
          <h2>Tarzına göre keşfet.</h2>
        </div>
        <div className="edits-grid">
          {edits.map((edit, i) => (
            <a className={"edit-card edit-" + (i + 1)} href={"/arama?q=" + encodeURIComponent(edit.title)} key={edit.title}>
              <img src={edit.image} alt={edit.title}/>
              <div className="edit-shade"/>
              <span>{edit.eyebrow}</span>
              <h3>{edit.title}</h3>
              <b>İncele <ArrowRight size={15}/></b>
            </a>
          ))}
        </div>
      </section>

      <section className="story-strip">
        <div className="story-quote">“Triko, yalnızca sıcak tutan bir ürün değil; günlük stilin en güçlü katmanı.”</div>
        <div className="story-meta"><span>ELMAS TRİKO</span><span>EST. 2026</span></div>
      </section>

      <section className="social-section">
        <div className="social-head">
          <div><Camera size={18}/><span>@elmas_triko</span></div>
          <h2>Elmas dünyasından.</h2>
          <a href="https://www.instagram.com/elmas_triko/" target="_blank" rel="noreferrer">Instagram’da takip et <ArrowRight size={15}/></a>
        </div>
        <div className="social-grid">
          {social.map((src, i) => <a href="https://www.instagram.com/elmas_triko/" target="_blank" rel="noreferrer" key={src}><img src={src} alt={"Elmas Triko stil " + (i+1)}/><span><Camera size={18}/></span></a>)}
        </div>
      </section>

      <section className="service-row">
        <div><b>01</b><span>Güvenli Ödeme</span><small>Ödeme altyapısı canlı satış öncesi bağlanacak</small></div>
        <div><b>02</b><span>Hızlı Gönderim</span><small>BasitKargo entegrasyonu</small></div>
        <div><b>03</b><span>Kolay İade</span><small>Standart iade süreci</small></div>
        <div><b>04</b><span>Müşteri Desteği</span><small>Satış öncesi ve sonrası</small></div>
      </section>

      <section className="newsletter">
        <Image src="/favicon.png" alt="" width={120} height={120}/>
        <p className="eyebrow dark">ELMAS CLUB</p>
        <h2>Yeni koleksiyonlardan<br/>ilk senin haberin olsun.</h2>
        <NewsletterForm/>
        <small>Kaydolarak kampanya ve yenilik e-postalarını almayı kabul edersiniz.</small>
      </section>

      <footer>
        <div className="footer-brand">
          <Image src="/elmas-triko-w.png" alt="Elmas Triko" width={300} height={110}/>
          <p>Kadın ve erkek için modern triko koleksiyonları.</p>
        </div>
        <div className="footer-columns">
          <div><h4>Alışveriş</h4><a href="/kadin">Kadın</a><a href="/erkek">Erkek</a><a href="/yeni-gelenler">Yeni Gelenler</a><a href="/yeni-gelenler">Çok Satanlar</a></div>
          <div><h4>Yardım</h4><a href="/siparis-takip">Sipariş Takibi</a><a href="/kargo-iade">Kargo & Teslimat</a><a href="/kargo-iade">İade & Değişim</a><a href="/iletisim">İletişim</a></div>
          <div><h4>Kurumsal</h4><a href="/hakkimizda">Hakkımızda</a><a href="/kvkk">KVKK</a><a href="/kvkk">Gizlilik</a><a href="/mesafeli-satis">Mesafeli Satış</a></div>
        </div>
        <div className="footer-bottom"><span>© 2026 ELMAS TRİKO</span><span>Türkiye · TRY ₺</span><a href="https://www.instagram.com/elmas_triko/" target="_blank" rel="noreferrer">Instagram</a></div>
      </footer>
    </main>
  );
}
