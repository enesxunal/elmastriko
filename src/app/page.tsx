import Image from "next/image";
import { Heart, Search, ShoppingBag, UserRound, ArrowRight } from "lucide-react";

const products = [
  { name: "Dokulu Düğmeli Hırka", price: "1.490 TL", image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=900&q=85", tone: "Ekru" },
  { name: "Jakarlı Triko Ceket", price: "1.790 TL", image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=900&q=85", tone: "Antrasit" },
  { name: "Yumuşak Dokulu Kazak", price: "1.290 TL", image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=85", tone: "Taş" },
  { name: "Fermuarlı Triko Hırka", price: "1.590 TL", image: "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=900&q=85", tone: "Lacivert" },
];

const categories = [
  { title: "Kadın", subtitle: "Yeni sezon triko", image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=90" },
  { title: "Erkek", subtitle: "Günlük ve zamansız", image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1200&q=90" },
];

export default function Home() {
  return (
    <main>
      <div className="announcement">Yeni sezon ürünleri yayında · Güvenli ödeme · Türkiye geneli teslimat</div>

      <header className="site-header">
        <a className="brand" href="#" aria-label="Elmas Triko ana sayfa">
          <Image src="/elmas-triko.png" alt="Elmas Triko" width={290} height={105} priority />
        </a>
        <nav className="desktop-nav" aria-label="Ana menü">
          <a href="#kadin">Kadın</a>
          <a href="#erkek">Erkek</a>
          <a href="#yeni">Yeni Gelenler</a>
          <a href="#koleksiyon">Koleksiyonlar</a>
          <a href="#coksatan">Çok Satanlar</a>
        </nav>
        <div className="header-actions">
          <button aria-label="Ara"><Search size={20} strokeWidth={1.6} /></button>
          <button aria-label="Hesabım"><UserRound size={20} strokeWidth={1.6} /></button>
          <button aria-label="Favoriler"><Heart size={20} strokeWidth={1.6} /></button>
          <button aria-label="Sepet"><ShoppingBag size={20} strokeWidth={1.6} /></button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-media" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="eyebrow">ELMAS TRİKO · 2026</p>
          <h1>Yeni sezon.<br />Zamansız dokular.</h1>
          <p className="hero-copy">Kadın ve erkek koleksiyonlarında günlük şıklığı güçlü triko dokularıyla yeniden keşfedin.</p>
          <div className="hero-ctas">
            <a href="#kadin" className="btn btn-light">Kadın koleksiyonu <ArrowRight size={17} /></a>
            <a href="#erkek" className="btn btn-ghost">Erkek koleksiyonu</a>
          </div>
        </div>
      </section>

      <section className="intro-section">
        <p className="eyebrow dark">ELMAS TRİKO</p>
        <h2>Dokunun karaktere dönüştüğü parçalar.</h2>
        <p>Günlük kullanıma uygun, kaliteli ve zamansız triko ürünlerini modern bir bakışla bir araya getiriyoruz.</p>
      </section>

      <section className="category-grid" id="koleksiyon">
        {categories.map((category, index) => (
          <a className="category-card" href={index === 0 ? "#kadin" : "#erkek"} id={index === 0 ? "kadin" : "erkek"} key={category.title}>
            <img src={category.image} alt={category.title} />
            <div className="category-shade" />
            <div className="category-copy">
              <span>{category.subtitle}</span>
              <h3>{category.title}</h3>
              <b>Keşfet <ArrowRight size={16} /></b>
            </div>
          </a>
        ))}
      </section>

      <section className="products-section" id="yeni">
        <div className="section-heading">
          <div>
            <p className="eyebrow dark">YENİ GELENLER</p>
            <h2>Sezonun öne çıkanları</h2>
          </div>
          <a href="#">Tüm ürünleri gör <ArrowRight size={16} /></a>
        </div>
        <div className="product-grid">
          {products.map((product) => (
            <article className="product-card" key={product.name}>
              <div className="product-image-wrap">
                <img src={product.image} alt={product.name} />
                <button className="favorite" aria-label={product.name + " favorilere ekle"}><Heart size={18} strokeWidth={1.5} /></button>
                <span className="new-badge">Yeni</span>
              </div>
              <div className="product-info">
                <div>
                  <h3>{product.name}</h3>
                  <p>{product.tone}</p>
                </div>
                <strong>{product.price}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="editorial">
        <div className="editorial-image" />
        <div className="editorial-content">
          <p className="eyebrow">ELMAS SEÇKİSİ</p>
          <h2>Özgün desenler.<br />Güçlü dokular.</h2>
          <p>Her sezon gardıropta kalacak parçalar. Sade renklerden karakterli jakarlara uzanan seçkiyi keşfedin.</p>
          <a href="#" className="text-link">Koleksiyonu incele <ArrowRight size={17} /></a>
        </div>
      </section>

      <section className="values">
        <div><span>01</span><h3>Kaliteli Doku</h3><p>Özenle seçilen iplikler ve konforlu kalıplar.</p></div>
        <div><span>02</span><h3>Güvenli Ödeme</h3><p>PayTR altyapısı ile güvenli alışveriş.</p></div>
        <div><span>03</span><h3>Kolay Teslimat</h3><p>BasitKargo altyapısıyla hızlı gönderim.</p></div>
        <div><span>04</span><h3>Kolay İade</h3><p>Standart iade süreci ve hızlı destek.</p></div>
      </section>

      <footer>
        <div className="footer-top">
          <Image src="/elmas-triko-w.png" alt="Elmas Triko" width={250} height={90} />
          <div><h4>Alışveriş</h4><a href="#kadin">Kadın</a><a href="#erkek">Erkek</a><a href="#yeni">Yeni Gelenler</a></div>
          <div><h4>Destek</h4><a href="#">Sipariş Takibi</a><a href="#">Kargo & Teslimat</a><a href="#">İade & Değişim</a></div>
          <div><h4>Bizi Takip Edin</h4><a href="https://www.instagram.com/elmas_triko/" target="_blank" rel="noreferrer">@elmas_triko</a></div>
        </div>
        <div className="footer-bottom"><span>© 2026 Elmas Triko</span><span>Gizlilik · KVKK · Mesafeli Satış Sözleşmesi</span></div>
      </footer>
    </main>
  );
}
