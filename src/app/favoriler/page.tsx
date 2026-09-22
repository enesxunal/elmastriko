"use client";

import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import ProductCard from "@/components/ProductCard";
import { products } from "@/lib/catalog";
import { useStore } from "@/components/StoreProvider";
import Link from "next/link";

export default function FavoritesPage(){
  const { favorites } = useStore();
  const list = products.filter(p => favorites.includes(p.slug));
  return <><StoreHeader/><main className="listing-page">
    <div className="simple-title"><span>HESABIM</span><h1>Favoriler</h1><p>Beğendiğiniz ürünleri burada saklayabilirsiniz.</p></div>
    {list.length ? <section className="catalog-grid">{list.map(p=><ProductCard key={p.slug} product={p}/>)}</section> :
    <section className="empty-collection"><span>FAVORİLER</span><h2>Henüz favori ürününüz yok.</h2><p>Ürün kartlarındaki kalp ikonunu kullanarak ürünleri bu listeye ekleyebilirsiniz.</p><Link href="/kadin">Kadın koleksiyonunu keşfet →</Link></section>}
  </main><StoreFooter/></>;
}
