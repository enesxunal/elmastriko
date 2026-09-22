import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import ProductCard from "@/components/ProductCard";
import { products } from "@/lib/catalog";

export default function WomenPage() {
  const list = products.filter(p => p.category === "kadin");
  return <><StoreHeader/><main className="listing-page">
    <div className="listing-hero women-listing"><span>WOMEN / 2026</span><h1>Kadın</h1><p>Yeni sezon triko, hırka ve zamansız parçalar.</p></div>
    <div className="listing-toolbar"><span>{list.length} ürün</span><div><button>Filtrele</button><button>Sırala</button></div></div>
    <section className="catalog-grid">{list.map(p => <ProductCard key={p.slug} product={p}/>)}</section>
  </main><StoreFooter/></>;
}
