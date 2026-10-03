"use client";

import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/catalog";
import { useStore } from "@/components/StoreProvider";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function FavoritesPage(){
  const { favorites } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadFavorites() {
      if (!favorites.length) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch("/api/catalog?slugs=" + encodeURIComponent(favorites.join(",")), {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("favorites_catalog_fetch_failed");
        const body = await response.json() as { products?: Product[] };
        if (!cancelled) setProducts(Array.isArray(body.products) ? body.products : []);
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadFavorites();
    return () => { cancelled = true; };
  }, [favorites]);

  const list = useMemo(() => {
    const order = new Map(favorites.map((slug, index) => [slug, index]));
    return products
      .filter(product => favorites.includes(product.slug))
      .sort((a, b) => (order.get(a.slug) ?? 999) - (order.get(b.slug) ?? 999));
  }, [favorites, products]);

  return <><StoreHeader/><main className="listing-page">
    <div className="simple-title"><span>HESABIM</span><h1>Favoriler</h1><p>Beğendiğiniz ürünleri burada saklayabilirsiniz.</p></div>
    {loading ? <section className="favorites-loading" aria-live="polite">Favorileriniz yükleniyor…</section> :
    list.length ? <section className="catalog-grid">{list.map(p=><ProductCard key={p.slug} product={p}/>)}</section> :
    <section className="empty-collection"><span>FAVORİLER</span><h2>Henüz favori ürününüz yok.</h2><p>Ürün kartlarındaki kalp ikonunu kullanarak ürünleri bu listeye ekleyebilirsiniz.</p><Link href="/kadin">Kadın koleksiyonunu keşfet →</Link></section>}
  </main><StoreFooter/></>;
}
