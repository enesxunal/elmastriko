import Image from "next/image";
import { ArrowRight, Heart, Search, ShoppingBag, UserRound, Camera, Plus } from "lucide-react";

const products = [
  { name: "Siyah Çizgili Triko Takım", price: "Fiyat yakında", image: "/images/product-black-set.png", tone: "Siyah / Ekru", badge: "Yeni" },
  { name: "Ekru Çizgili Triko Takım", price: "Fiyat yakında", image: "/images/product-cream-set.png", tone: "Ekru", badge: "Edit" },
  { name: "Diamond Desenli Triko Hırka", price: "Fiyat yakında", image: "/images/product-white-diamond.png", tone: "Ekru / Lacivert", badge: "Yeni" },
  { name: "Kapüşonlu Desenli Triko Hırka", price: "Fiyat yakında", image: "/images/product-pattern-cardigan.png", tone: "Ekru / Mürdüm", badge: "Çok Satan" },
];

const edits = [
  { title: "Modern Klasikler", eyebrow: "01 / KADIN", image: "/images/edit-modern-classics.png" },
  { title: "Yeni Erkek", eyebrow: "02 / ERKEK", image: "/images/edit-new-men.png" },
  { title: "Desen Seçkisi", eyebrow: "03 / JAKAR", image: "/images/edit-pattern-selection.png" },
];

const social = [
  "/images/category-women.png",
  "/images/signature-knit.png",
  "/images/edit-modern-classics.png",
  "/images/product-pattern-cardigan.png",
];

export default function Home() {
  return (
    <main>
      <div className="topbar">
        <span>Ücretsiz kargo limiti yakında</span>
        <span className="topbar-center">Yeni sezon · 2026</span>
        <span>PayTR ile güvenli ödeme</span>
      </div>

      <header className="site-header">
        <details className="mobile-menu">
          <summary aria-label="Menüyü aç"><span/><span/></summary>
          <div className="mobile-menu-panel">
            <div className="mobile-menu-title">Koleksiyonlar</div>
            <div className="mobile-menu-group">
              <a className="mobile-menu-parent" href="#kadin">Kadın <ArrowRight size={16}/></a>
              <div className="mobile-subgrid">
                <a href="#">Yeni Gelenler</a><a href="#">Hırkalar</a><a href="#">Kazaklar</a>
                <a href="#">Ceketler</a><a href="#">Fermuarlı Triko</a><a href="#">Desenli Triko</a>
              </div>
            </div>
            <div className="mobile-menu-group">
              <a className="mobile-menu-parent" href="#erkek">Erkek <ArrowRight size={16}/></a>
              <div className="mobile-subgrid">
                <a href="#">Yeni Gelenler</a><a href="#">Kazaklar</a><a href="#">Hırkalar</a>
                <a href="#">Fermuarlı Modeller</a><a href="#">Desenli Modeller</a><a href="#">Tüm Erkek</a>
              </div>
            </div>
            <div className="mobile-feature-links">
              <a href="#yeni">Yeni Gelenler <ArrowRight size={14}/></a>
              <a href="#koleksiyon">Elmas Seçkisi <ArrowRight size={14}/></a>
            </div>
            <div className="mobile-menu-secondary">
              <a href="#">Hesabım</a><a href="#">Favoriler</a><a href="#">Sipariş Takibi</a>
            </div>
          </div>
        </details>

        <nav className="nav-left" aria-label="Ana menü">
          <div className="mega-trigger">
            <a className="mega-link" href="#kadin">Kadın</a>
            <div className="mega-menu">
              <div className="mega-menu-inner">
                <div className="mega-kicker">Kadın Koleksiyonu</div>
                <div className="mega-column">
                  <h4>Giyim</h4>
                  <a href="#">Yeni Gelenler</a><a href="#">Hırkalar</a><a href="#">Kazaklar</a><a href="#">Ceketler</a><a href="#">Fermuarlı Triko</a>
                </div>
                <div className="mega-column">
                  <h4>Keşfet</h4>
                  <a href="#">Desenli Triko</a><a href="#">Düz & Zamansız</a><a href="#">Çok Satanlar</a><a href="#">Tüm Kadın</a>
                </div>
                <a className="mega-editorial" href="#kadin">
                  <img src="/images/category-women.png" alt="Kadın koleksiyonu"/>
                  <div><span>Yeni sezon</span><strong>Kadın / 2026</strong><b>Keşfet <ArrowRight size={14}/></b></div>
                </a>
              </div>
            </div>
          </div>

          <div className="mega-trigger">
            <a className="mega-link" href="#erkek">Erkek</a>
            <div className="mega-menu">
              <div className="mega-menu-inner">
                <div className="mega-kicker">Erkek Koleksiyonu</div>
                <div className="mega-column">
                  <h4>Giyim</h4>
                  <a href="#">Yeni Gelenler</a><a href="#">Kazaklar</a><a href="#">Hırkalar</a><a href="#">Fermuarlı Modeller</a><a href="#">Desenli Modeller</a>
                </div>
                <div className="mega-column">
                  <h4>Keşfet</h4>
                  <a href="#">Günlük Triko</a><a href="#">Klasik Seçki</a><a href="#">Çok Satanlar</a><a href="#">Tüm Erkek</a>
                </div>
                <a className="mega-editorial" href="#erkek">
                  <img src="/images/category-men.png" alt="Erkek koleksiyonu"/>
                  <div><span>Yeni sezon</span><strong>Erkek / 2026</strong><b>Keşfet <ArrowRight size={14}/></b></div>
                </a>
              </div>
            </div>
          </div>

          <a href="#yeni">Yeni Gelenler</a>
        </nav>

        <a className="brand" href="#" aria-label="Elmas Triko ana sayfa">
          <Image src="/elmas-triko.png" alt="Elmas Triko" width={290} height={105} priority />
        </a>

        <div className="header-right">
          <div className="mega-trigger collection-trigger">
            <a className="collection-link mega-link" href="#koleksiyon">Koleksiyonlar</a>
            <div className="mega-menu">
              <div className="mega-menu-inner collections-mega">
                <div className="mega-kicker">Elmas Edit</div>
                <a className="collection-tile" href="#yeni"><span>01</span><strong>Yeni Sezon</strong><small>Son eklenen parçalar</small></a>
                <a className="collection-tile" href="#"><span>02</span><strong>Signature Knit</strong><small>Desen ve jakar seçkisi</small></a>
                <a className="collection-tile" href="#"><span>03</span><strong>Modern Klasikler</strong><small>Zamansız triko parçalar</small></a>
                <a className="collection-tile dark" href="#koleksiyon"><span>04</span><strong>Tüm Koleksiyonlar</strong><small>Elmas dünyasını keşfet</small></a>
              </div>
            </div>
          </div>
          <div className="header-actions">
            <button aria-label="Ara"><Search size={19} strokeWidth={1.5} /></button>
            <button aria-label="Hesabım"><UserRound size={19} strokeWidth={1.5} /></button>
            <button aria-label="Favoriler"><Heart size={19} strokeWidth={1.5} /></button>
            <button aria-label="Sepet"><ShoppingBag size={19} strokeWidth={1.5} /><span className="cart-dot">0</span></button>
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
            <a href="#kadin" className="btn btn-light">Kadın koleksiyonu <ArrowRight size={16} /></a>
            <a href="#erkek" className="btn btn-line">Erkek koleksiyonu <ArrowRight size={16} /></a>
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
          <a href="#">Elmas Triko’yu keşfet <ArrowRight size={15}/></a>
        </div>
      </section>

      <section className="gender-stage" id="koleksiyon">
        <a className="gender-card women" id="kadin" href="#">
          <img src="/images/category-women.png" alt="Kadın koleksiyonu" />
          <div className="gender-overlay" />
          <div className="gender-top"><span>01</span><span>WOMEN</span></div>
          <div className="gender-bottom"><h3>Kadın</h3><span>Koleksiyonu keşfet <ArrowRight size={16}/></span></div>
        </a>
        <a className="gender-card men" id="erkek" href="#">
          <img src="/images/category-men.png" alt="Erkek koleksiyonu" />
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
            <a href="#">Tümünü gör <ArrowRight size={15}/></a>
          </div>
        </div>

        <div className="product-grid">
          {products.map((product, i) => (
            <article className={"product-card product-" + (i + 1)} key={product.name}>
              <a href="#" className="product-image-wrap">
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
          <a href="#" className="text-link">Desenli trikoları keşfet <ArrowRight size={16}/></a>
        </div>
        <div className="signature-visual">
          <img src="/images/signature-knit.png" alt="Elmas Triko desen seçkisi"/>
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
            <a className={"edit-card edit-" + (i + 1)} href="#" key={edit.title}>
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
        <div><b>01</b><span>Güvenli Ödeme</span><small>PayTR altyapısı</small></div>
        <div><b>02</b><span>Hızlı Gönderim</span><small>BasitKargo entegrasyonu</small></div>
        <div><b>03</b><span>Kolay İade</span><small>Standart iade süreci</small></div>
        <div><b>04</b><span>Müşteri Desteği</span><small>Satış öncesi ve sonrası</small></div>
      </section>

      <section className="newsletter">
        <Image src="/favicon.png" alt="" width={120} height={120}/>
        <p className="eyebrow dark">ELMAS CLUB</p>
        <h2>Yeni koleksiyonlardan<br/>ilk senin haberin olsun.</h2>
        <form><input type="email" placeholder="E-posta adresiniz"/><button type="submit">Katıl <ArrowRight size={16}/></button></form>
        <small>Kaydolarak kampanya ve yenilik e-postalarını almayı kabul edersiniz.</small>
      </section>

      <footer>
        <div className="footer-brand">
          <Image src="/elmas-triko-w.png" alt="Elmas Triko" width={300} height={110}/>
          <p>Kadın ve erkek için modern triko koleksiyonları.</p>
        </div>
        <div className="footer-columns">
          <div><h4>Alışveriş</h4><a href="#kadin">Kadın</a><a href="#erkek">Erkek</a><a href="#yeni">Yeni Gelenler</a><a href="#">Çok Satanlar</a></div>
          <div><h4>Yardım</h4><a href="#">Sipariş Takibi</a><a href="#">Kargo & Teslimat</a><a href="#">İade & Değişim</a><a href="#">İletişim</a></div>
          <div><h4>Kurumsal</h4><a href="#">Hakkımızda</a><a href="#">KVKK</a><a href="#">Gizlilik</a><a href="#">Mesafeli Satış</a></div>
        </div>
        <div className="footer-bottom"><span>© 2026 ELMAS TRİKO</span><span>Türkiye · TRY ₺</span><a href="https://www.instagram.com/elmas_triko/" target="_blank" rel="noreferrer">Instagram</a></div>
      </footer>
    </main>
  );
}
