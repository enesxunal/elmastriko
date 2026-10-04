import type { Metadata } from "next";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import ProductCard from "@/components/ProductCard";
import CatalogFilters from "@/components/CatalogFilters";
import { getProducts, getProductTypes } from "@/lib/catalog-db";

export const metadata: Metadata = {
  title: "Yeni Gelen Triko Modelleri",
  description: "Elmas Triko yeni gelen kadın ve erkek triko modellerini keşfedin. Yeni sezon hırka, kazak ve takım ürünlerini renk, beden ve fiyat seçenekleriyle inceleyin.",
  alternates: { canonical: "/yeni-gelenler" },
};

export default async function NewPage({ searchParams }: { searchParams: Promise<{ type?: string; sort?: "newest" | "price-asc" | "price-desc" }> }) {
  const params = await searchParams;
  const [list, types] = await Promise.all([
    getProducts({ type: params.type, sort: params.sort }),
    getProductTypes(),
  ]);

  const schema = {
    "@context":"https://schema.org",
    "@type":"ItemList",
    name:"Elmas Triko Yeni Gelenler",
    numberOfItems:list.length,
    itemListElement:list.map((product,index)=>({
      "@type":"ListItem",
      position:index+1,
      url:`https://www.elmastriko.com/urun/${product.slug}`,
      name:product.name
    }))
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}}/>
    <StoreHeader/>
    <main className="listing-page">
      <div className="simple-title"><span>ELMAS TRİKO / 2026</span><h1>Yeni Gelen Triko Modelleri</h1><p>Yeni sezon kadın ve erkek triko, hırka ve takım modelleri.</p></div>
      <CatalogFilters basePath="/yeni-gelenler" currentType={params.type} currentSort={params.sort} types={types}/>
      <section className="catalog-grid">{list.map(p => <ProductCard key={p.slug} product={p}/>)}</section>
    </main>
    <StoreFooter/>
  </>;
}
