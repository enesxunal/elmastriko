import type { Metadata } from "next";
import Link from "next/link";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import ProductCard from "@/components/ProductCard";
import CatalogFilters from "@/components/CatalogFilters";
import { getProducts, getProductTypes } from "@/lib/catalog-db";

const siteUrl = "https://www.elmastriko.com";

export const metadata: Metadata = {
  title: "Kadın Triko Modelleri, Hırka ve Takımlar",
  description: "Elmas Triko kadın triko modellerini keşfedin. Yeni sezon kadın hırka, triko takım ve zamansız örgü modellerini renk, beden ve fiyat seçenekleriyle online inceleyin.",
  alternates: { canonical: "/kadin" },
  openGraph: {
    title: "Kadın Triko Modelleri | Elmas Triko",
    description: "Yeni sezon kadın triko, hırka ve takım modellerini Elmas Triko online mağazada keşfedin.",
    url: `${siteUrl}/kadin`,
    type: "website",
  },
};

export default async function WomenPage({ searchParams }: { searchParams: Promise<{ type?: string; sort?: "newest" | "price-asc" | "price-desc" }> }) {
  const params = await searchParams;
  const [list, types] = await Promise.all([
    getProducts({ gender: "kadin", type: params.type, sort: params.sort }),
    getProductTypes("kadin"),
  ]);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Kadın Triko", item: `${siteUrl}/kadin` },
    ],
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Elmas Triko Kadın Triko Koleksiyonu",
    url: `${siteUrl}/kadin`,
    description: "Kadın triko, hırka ve takım modellerinden oluşan Elmas Triko koleksiyonu.",
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
        <span>ELMAS TRİKO / WOMEN 2026</span>
        <h1>Kadın Triko Modelleri</h1>
        <p>Yeni sezon kadın hırka, triko takım ve zamansız örgü modellerini keşfedin.</p>
      </div>
      <div className="listing-toolbar"><span>{list.length} ürün</span><span>Elmas Triko</span></div>
      <CatalogFilters basePath="/kadin" currentType={params.type} currentSort={params.sort} types={types}/>
      <section className="catalog-grid">{list.map(p => <ProductCard key={p.slug} product={p}/>)}</section>

      <section className="seo-category-copy" aria-labelledby="kadin-triko-rehberi">
        <span>ELMAS TRİKO KADIN KOLEKSİYONU</span>
        <h2 id="kadin-triko-rehberi">Kadın triko seçiminde model, renk ve kullanım dengesi</h2>
        <p>Elmas Triko kadın koleksiyonunda hırka, takım ve farklı örgü yüzeylerine sahip triko modelleri bir arada sunulur. Ürün sayfalarında renk ve beden seçeneklerini, stok bilgisini ve ürün detaylarını karşılaştırarak günlük kullanıma veya daha şık kombinlere uygun parçayı seçebilirsiniz.</p>
        <div className="seo-category-links">
          <Link href="/yeni-gelenler">Yeni sezon triko modelleri</Link>
          <Link href="/arama?type=Hırka">Kadın triko hırkalar</Link>
          <Link href="/arama?type=Takım">Kadın triko takımlar</Link>
        </div>
      </section>
    </main>
    <StoreFooter/>
  </>;
}
