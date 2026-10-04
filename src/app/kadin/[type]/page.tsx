import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import ProductCard from "@/components/ProductCard";
import { getProducts } from "@/lib/catalog-db";

const siteUrl = "https://www.elmastriko.com";

const categories = {
  hirka: {
    type: "Hırka",
    title: "Kadın Triko Hırka Modelleri",
    description: "Elmas Triko kadın triko hırka modellerini keşfedin. Yeni sezon kısa kollu, kapüşonlu, desenli ve farklı renk seçeneklerine sahip hırkaları online inceleyin.",
    heading: "Kadın Triko Hırka Modelleri",
    intro: "Yeni sezon kadın triko hırka modellerini renk, beden ve stok seçenekleriyle inceleyin.",
    copy: "Kadın triko hırkalar katmanlı giyimde ve günlük kombinlerde farklı kullanım seçenekleri sunar. Elmas Triko hırka koleksiyonunda mevcut ürünlerin renk, beden, fiyat ve stok bilgilerini karşılaştırabilir; ürün detay sayfalarından görselleri ve varyasyonları inceleyebilirsiniz.",
    guideHref: "/blog/kadin-triko-hirka-nasil-kombinlenir",
    guideLabel: "Triko hırka kombin rehberi",
  },
  kazak: {
    type: "Kazak",
    title: "Kadın Triko Kazak Modelleri",
    description: "Elmas Triko kadın triko kazak modellerini keşfedin. Yeni sezon örgü kazakları renk, beden, fiyat ve stok seçenekleriyle online inceleyin.",
    heading: "Kadın Triko Kazak Modelleri",
    intro: "Yeni sezon kadın triko kazak seçeneklerini Elmas Triko koleksiyonunda keşfedin.",
    copy: "Kadın triko kazak seçiminde model, renk ve beden seçeneklerini birlikte değerlendirmek günlük kullanım için doğru parçayı bulmayı kolaylaştırır. Elmas Triko ürün sayfalarında mevcut varyasyonları, güncel stok ve fiyat bilgisini görebilirsiniz.",
    guideHref: "/blog/kadin-triko-kazak-secimi",
    guideLabel: "Triko kazak seçim rehberi",
  },
  takim: {
    type: "Takım",
    title: "Kadın Triko Takım Modelleri",
    description: "Elmas Triko kadın triko takım modellerini keşfedin. Yeni sezon etekli ve örgü takım seçeneklerini renk, beden, fiyat ve stok bilgileriyle inceleyin.",
    heading: "Kadın Triko Takım Modelleri",
    intro: "Kadın triko takım modellerini renk, beden ve ürün detaylarıyla online inceleyin.",
    copy: "Triko takımlar üst ve alt parçayı aynı doku ve renk diliyle bir araya getirir. Elmas Triko kadın triko takım ürünlerinde mevcut renk ve beden seçeneklerini ürün sayfasından kontrol ederek güncel stok ve fiyat bilgisine ulaşabilirsiniz.",
    guideHref: "/blog/triko-takim-nasil-kombinlenir",
    guideLabel: "Triko takım kombin rehberi",
  },
  triko: {
    type: "Triko",
    title: "Kadın Triko Modelleri",
    description: "Elmas Triko kadın triko modellerini keşfedin. Yeni sezon örgü ürünleri renk, beden, fiyat ve stok seçenekleriyle online inceleyin.",
    heading: "Kadın Triko Modelleri",
    intro: "Elmas Triko kadın triko koleksiyonundaki güncel modelleri keşfedin.",
    copy: "Kadın triko modellerinde doku, renk ve kalıp seçimi kullanım alanını belirleyen temel unsurlardır. Elmas Triko ürün detaylarında mevcut görselleri, beden ve renk varyasyonlarını, fiyat ve stok bilgisini birlikte inceleyebilirsiniz.",
    guideHref: "/blog/triko-nasil-yikanir-bakim-rehberi",
    guideLabel: "Triko bakım rehberi",
  },
} as const;

type CategorySlug = keyof typeof categories;

export function generateStaticParams() {
  return Object.keys(categories).map(type => ({ type }));
}

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const { type } = await params;
  const category = categories[type as CategorySlug];
  if (!category) return {};
  return {
    title: category.title,
    description: category.description,
    alternates: { canonical: `/kadin/${type}` },
    openGraph: {
      title: `${category.title} | Elmas Triko`,
      description: category.description,
      url: `${siteUrl}/kadin/${type}`,
      type: "website",
    },
  };
}

export default async function WomenTypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const category = categories[type as CategorySlug];
  if (!category) notFound();

  const list = await getProducts({ gender: "kadin", type: category.type });
  if (!list.length) notFound();

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Kadın Triko", item: `${siteUrl}/kadin` },
      { "@type": "ListItem", position: 3, name: category.heading, item: `${siteUrl}/kadin/${type}` },
    ],
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Elmas Triko ${category.heading}`,
    url: `${siteUrl}/kadin/${type}`,
    description: category.description,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: list.length,
      itemListElement: list.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${siteUrl}/urun/${product.slug}`,
        name: product.name,
      })),
    },
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}/>
    <StoreHeader/>
    <main className="listing-page">
      <div className="listing-hero women-listing">
        <span>ELMAS TRİKO / KADIN</span>
        <h1>{category.heading}</h1>
        <p>{category.intro}</p>
      </div>
      <div className="listing-toolbar"><span>{list.length} ürün</span><Link href="/kadin">Tüm kadın koleksiyonu</Link></div>
      <section className="catalog-grid">{list.map(product => <ProductCard key={product.slug} product={product}/>)}</section>
      <section className="seo-category-copy" aria-labelledby="category-seo-heading">
        <span>ELMAS TRİKO KADIN KOLEKSİYONU</span>
        <h2 id="category-seo-heading">{category.heading} hakkında</h2>
        <p>{category.copy}</p>
        <div className="seo-category-links">
          <Link href="/kadin">Kadın triko modelleri</Link>
          <Link href="/kadin/hirka">Kadın triko hırkalar</Link>
          <Link href="/yeni-gelenler">Yeni gelenler</Link>
          <Link href={category.guideHref}>{category.guideLabel}</Link>
          <Link href="/blog">Tüm triko rehberleri</Link>
        </div>
      </section>
    </main>
    <StoreFooter/>
  </>;
}
