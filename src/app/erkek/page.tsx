import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import ProductCard from "@/components/ProductCard";
import CatalogFilters from "@/components/CatalogFilters";
import { getProducts, getProductTypes } from "@/lib/catalog-db";

export default async function MenPage({ searchParams }: { searchParams: Promise<{ type?: string; sort?: "newest" | "price-asc" | "price-desc" }> }) {
  const params = await searchParams;
  const [list, types] = await Promise.all([
    getProducts({ gender: "erkek", type: params.type, sort: params.sort }),
    getProductTypes("erkek"),
  ]);

  return <><StoreHeader/><main className="listing-page">
    <div className="listing-hero men-listing"><span>MEN / 2026</span><h1>Erkek</h1><p>Yeni sezon erkek triko koleksiyonu.</p></div>
    <div className="listing-toolbar"><span>{list.length} ürün</span><span>Elmas Triko</span></div>
    {list.length ? <>
      <CatalogFilters basePath="/erkek" currentType={params.type} currentSort={params.sort} types={types}/>
      <section className="catalog-grid">{list.map(p => <ProductCard key={p.slug} product={p}/>)}</section>
    </> : <section className="empty-collection"><span>ELMAS TRİKO</span><h2>Erkek koleksiyonu hazırlanıyor.</h2><p>Ürünler Supabase'e eklendiğinde bu alan otomatik olarak yayına alınacak.</p></section>}
  </main><StoreFooter/></>;
}
