import Image from "next/image";
import { ArrowRight, Heart, Search, ShoppingBag, UserRound, Camera, Plus } from "lucide-react";

const products = [
  { name: "Dokulu Düğmeli Hırka", price: "1.490 TL", image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=900&q=88", tone: "Ekru", badge: "Yeni" },
  { name: "Jakarlı Triko Ceket", price: "1.790 TL", image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=900&q=88", tone: "Antrasit", badge: "Edit" },
  { name: "Yumuşak Dokulu Kazak", price: "1.290 TL", image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=88", tone: "Taş", badge: "Yeni" },
  { name: "Fermuarlı Triko Hırka", price: "1.590 TL", image: "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=900&q=88", tone: "Lacivert", badge: "Çok Satan" },
];

const edits = [
  { title: "Modern Klasikler", eyebrow: "01 / KADIN", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=90" },
  { title: "Yeni Erkek", eyebrow: "02 / ERKEK", image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1200&q=90" },
  { title: "Desen Seçkisi", eyebrow: "03 / JAKAR", image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1200&q=90" },
];

const social = [
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=700&q=86",
  "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=700&q=86",
  "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=700&q=86",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=700&q=86",
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
            <div className="mobile-menu-title">Menü</div>
            <a href="#kadin">Kadın <ArrowRight size={16}/></a>
            <a href="#erkek">Erkek <ArrowRight size={16}/></a>
            <a href="#yeni">Yeni Gelenler <ArrowRight size={16}/></a>
            <a href="#koleksiyon">Koleksiyonlar <ArrowRight size={16}/></a>
            <div className="mobile-menu-secondary">
              <a href="#">Hesabım</a>
              <a href="#">Favoriler</a>
              <a href="#">Sipariş Takibi</a>
            </div>
          </div>
        </details>

        <nav className="nav-left" aria-label="Ana menü">
          <a href="#kadin">Kadın</a>
          <a href="#erkek">Erkek</a>
          <a href="#yeni">Yeni Gelenler</a>
        </nav>

        <a className="brand" href="#" aria-label="Elmas Triko ana sayfa">
          <Image src="/elmas-triko.png" alt="Elmas Triko" width={290} height={105} priority />
        </a>

        <div className="header-right">
          <a className="collection-link" href="#koleksiyon">Koleksiyonlar</a>
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
          <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1500&q=92" alt="Kadın koleksiyonu" />
          <div className="gender-overlay" />
          <div className="gender-top"><span>01</span><span>WOMEN</span></div>
          <div className="gender-bottom"><h3>Kadın</h3><span>Koleksiyonu keşfet <ArrowRight size={16}/></span></div>
        </a>
        <a className="gender-card men" id="erkek" href="#">
          <img src="https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1500&q=92" alt="Erkek koleksiyonu" />
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
          <img src="https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1600&q=92" alt="Elmas Triko desen seçkisi"/>
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
