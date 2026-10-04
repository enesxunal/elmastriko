import type { Metadata } from "next";
import Link from "next/link";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import ProductCard from "@/components/ProductCard";
import CatalogFilters from "@/components/CatalogFilters";
import { getProducts, getProductTypes } from "@/lib/catalog-db";

const siteUrl = "https://www.elmastriko.com";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ type?: string; sort?: string }> }): Promise<Metadata> {
  const params = await searchParams;
  const filtered = Boolean(params.type || params.sort);
  return {
    title: "Yeni Gelen Triko Modelleri | Yeni Sezon",
    description: "Elmas Triko yeni gelen triko modellerini keşfedin. Yeni sezon kadın hırka, kazak ve triko takım ürünlerini güncel renk, beden, fiyat ve stok seçenekleriyle inceleyin.",
    alternates: { canonical: "/yeni-gelenler" },
    robots: filtered ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title: "Yeni Gelen Triko Modelleri | Elmas Triko",
      description: "Elmas Triko yeni sezon kadın triko, hırka, kazak ve takım modellerini online keşfedin.",
      url: `${siteUrl}/yeni-gelenler`,
      type: "website",
    },
  };
}

export default async function NewPage({ searchParams }: { searchParams: Promise<{ type?: string; sort?: "newest" | "price-asc" | "price-desc" }> }) {
  const params = await searchParams;
  const [list, types] = await Promise.all([
    getProducts({ type: params.type, sort: params.sort }),
    getProductTypes(),
  ]);

  const breadcrumbSchema = {
    "@context":"https://schema.org",
    "@type":"BreadcrumbList",
    itemListElement:[
      { "@type":"ListItem", position:1, name:"Ana Sayfa", item:siteUrl },
      { "@type":"ListItem", position:2, name:"Yeni Gelen Triko Modelleri", item:`${siteUrl}/yeni-gelenler` },
    ]
  };

  const collectionSchema = {
    "@context":"https://schema.org",
    "@type":"CollectionPage",
    name:"Elmas Triko Yeni Gelen Triko Modelleri",
    url:`${siteUrl}/yeni-gelenler`,
    description:"Elmas Triko yeni sezon kadın triko, hırka, kazak ve takım modelleri.",
    mainEntity:{
      "@type":"ItemList",
      numberOfItems:list.length,
      itemListElement:list.map((product,index)=>({
        "@type":"ListItem",
        position:index+1,
        url:`${siteUrl}/urun/${product.slug}`,
        name:product.name
      }))
    }
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(breadcrumbSchema)}}/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(collectionSchema)}}/>
    <StoreHeader/>
    <main className="listing-page">
      <div className="simple-title"><span>ELMAS TRİKO / 2026</span><h1>Yeni Gelen Triko Modelleri</h1><p>Yeni sezon kadın triko, hırka, kazak ve takım modellerini keşfedin.</p></div>
      <CatalogFilters basePath="/yeni-gelenler" currentType={params.type} currentSort={params.sort} types={types}/>
      <section className="catalog-grid">{list.map(p => <ProductCard key={p.slug} product={p}/>)}</section>
      <section className="seo-category-copy" aria-labelledby="yeni-sezon-triko-rehberi">
        <span>ELMAS TRİKO YENİ SEZON</span>
        <h2 id="yeni-sezon-triko-rehberi">Yeni sezon triko modellerini keşfedin</h2>
        <p>Elmas Triko yeni gelenler seçkisinde sezonun güncel kadın triko modellerini, hırka, kazak ve takım seçeneklerini bir arada inceleyebilirsiniz. Ürün sayfalarında renk, beden, stok ve güncel fiyat bilgisini karşılaştırarak size uygun modeli seçebilirsiniz.</p>
        <div className="seo-category-links">
          <Link href="/kadin">Kadın triko modelleri</Link>
          <Link href="/kadin/hirka">Kadın triko hırkalar</Link>
          <Link href="/kadin/kazak">Kadın triko kazaklar</Link>
          <Link href="/kadin/takim">Kadın triko takımlar</Link>
          <Link href="/blog">Triko bakım ve stil rehberleri</Link>
        </div>
      </section>
    </main>
    <StoreFooter/>
  </>;
}
