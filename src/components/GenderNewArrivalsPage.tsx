import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import ProductCard from "@/components/ProductCard";
import CatalogFilters from "@/components/CatalogFilters";
import { getProducts, getProductTypes } from "@/lib/catalog-db";

type Gender = "kadin" | "erkek";
type Sort = "newest" | "price-asc" | "price-desc";
export default async function GenderNewArrivalsPage({
  gender,
  type,
  sort,
}: {
  gender: Gender;
  type?: string;
  sort?: Sort;
}) {
  const [products, types] = await Promise.all([
    getProducts({ gender, type, sort }),
    getProductTypes(gender),
  ]);
  const isWomen = gender === "kadin";
  const audience = isWomen ? "Kadın" : "Erkek";
  return <>
    <StoreHeader />
    <main className="listing-page">
      <div className="simple-title new-arrivals-title">
        <span>ELMAS TRİKO / {audience.toLocaleUpperCase("tr-TR")} / 2026</span>
        <h1>{audience} Yeni Gelenler</h1>
        <p>Yeni sezon {audience.toLocaleLowerCase("tr-TR")} triko, kazak ve hırka modelleri.</p>
      </div>
      <div className="listing-toolbar"><span>{products.length} ürün</span><span>{audience} koleksiyonu</span></div>
      {products.length ? <>
        <CatalogFilters basePath={`/${gender}/yeni-gelenler`} currentType={type} currentSort={sort} types={types}/>
        <section className="catalog-grid">
          {products.map(p => <ProductCard key={p.slug} product={p}/>)}
        </section>
      </> : <section className="empty-collection">
        <span>ELMAS TRİKO</span>
        <h2>Bu kategoride henüz ürün bulunmuyor.</h2>
        <p>Başka bir kategori seçebilir veya tüm {audience.toLocaleLowerCase("tr-TR")} koleksiyonunu inceleyebilirsiniz.</p>
      </section>}
    </main>
    <StoreFooter />
  </>;
}
