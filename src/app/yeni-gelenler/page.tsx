import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import ProductCard from "@/components/ProductCard";
import CatalogFilters from "@/components/CatalogFilters";
import { getProducts, getProductTypes } from "@/lib/catalog-db";

export default async function NewPage({ searchParams }: { searchParams: Promise<{ type?: string; sort?: "newest" | "price-asc" | "price-desc" }> }) {
  const params = await searchParams;
  const [list, types] = await Promise.all([
    getProducts({ type: params.type, sort: params.sort }),
    getProductTypes(),
  ]);

  return <><StoreHeader/><main className="listing-page">
    <div className="simple-title"><span>ELMAS TRİKO / 2026</span><h1>Yeni Gelenler</h1></div>
    <CatalogFilters basePath="/yeni-gelenler" currentType={params.type} currentSort={params.sort} types={types}/>
    <section className="catalog-grid">{list.map(p => <ProductCard key={p.slug} product={p}/>)}</section>
  </main><StoreFooter/></>;
}
