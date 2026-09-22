import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import ProductCard from "@/components/ProductCard";
import { products } from "@/lib/catalog";

export default function FavoritesPage(){return <><StoreHeader/><main className="listing-page"><div className="simple-title"><span>HESABIM</span><h1>Favoriler</h1><p>Favori ürünler bu alanda saklanacak.</p></div><section className="catalog-grid">{products.slice(0,2).map(p=><ProductCard key={p.slug} product={p}/>)}</section></main><StoreFooter/></>;}
