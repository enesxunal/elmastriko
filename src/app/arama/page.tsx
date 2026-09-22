import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import ProductCard from "@/components/ProductCard";
import CatalogFilters from "@/components/CatalogFilters";
import { getProducts, getProductTypes } from "@/lib/catalog-db";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; sort?: "newest" | "price-asc" | "price-desc" }>;
}) {
  const params = await searchParams;
  const query = (params.q || "").trim();
  const [list, types] = await Promise.all([
    getProducts({ query, type: params.type, sort: params.sort }),
    getProductTypes(),
  ]);

  return <><StoreHeader/><main className="listing-page">
    <div className="simple-title search-title">
      <span>ARAMA</span>
      <h1>{query ? "“" + query + "”" : "Ürün Ara"}</h1>
      <form className="search-form" action="/arama">
        <input name="q" defaultValue={query} placeholder="Ürün, kategori veya renk ara..." autoFocus={!query}/>
        <button type="submit">Ara</button>
      </form>
      {query && <p>{list.length} sonuç bulundu.</p>}
    </div>

    {query && <>
      <CatalogFilters basePath="/arama" query={query} currentType={params.type} currentSort={params.sort} types={types}/>
      {list.length ? <section className="catalog-grid">{list.map(p => <ProductCard key={p.slug} product={p}/>)}</section> :
      <section className="empty-collection"><span>SONUÇ YOK</span><h2>Aradığınız ürün bulunamadı.</h2><p>Farklı bir ürün adı, renk veya kategori deneyebilirsiniz.</p></section>}
    </>}
  </main><StoreFooter/></>;
}
