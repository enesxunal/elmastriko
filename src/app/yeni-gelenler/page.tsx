import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import ProductCard from "@/components/ProductCard";
import { products } from "@/lib/catalog";

export default function NewPage() {
  return <><StoreHeader/><main className="listing-page">
    <div className="simple-title"><span>ELMAS TRİKO / 2026</span><h1>Yeni Gelenler</h1></div>
    <section className="catalog-grid">{products.map(p => <ProductCard key={p.slug} product={p}/>)}</section>
  </main><StoreFooter/></>;
}
