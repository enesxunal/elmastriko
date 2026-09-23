import type { Metadata } from "next";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import ProductCard from "@/components/ProductCard";
import CatalogFilters from "@/components/CatalogFilters";
import { getProducts, getProductTypes } from "@/lib/catalog-db";

export const metadata: Metadata = { title: "Kadın Triko Koleksiyonu", description: "Elmas Triko kadın koleksiyonu: yeni sezon triko, hırka, kazak ve zamansız parçalar.", alternates: { canonical: "/kadin" } };

export default async function WomenPage({ searchParams }: { searchParams: Promise<{ type?: string; sort?: "newest" | "price-asc" | "price-desc" }> }) {
  const params = await searchParams;
  const [list, types] = await Promise.all([
    getProducts({ gender: "kadin", type: params.type, sort: params.sort }),
    getProductTypes("kadin"),
  ]);

  return <><StoreHeader/><main className="listing-page">
    <div className="listing-hero women-listing"><span>WOMEN / 2026</span><h1>Kadın</h1><p>Yeni sezon triko, hırka ve zamansız parçalar.</p></div>
    <div className="listing-toolbar"><span>{list.length} ürün</span><span>Elmas Triko</span></div>
    <CatalogFilters basePath="/kadin" currentType={params.type} currentSort={params.sort} types={types}/>
    <section className="catalog-grid">{list.map(p => <ProductCard key={p.slug} product={p}/>)}</section>
  </main><StoreFooter/></>;
}
