"use client";

import Link from "next/link";
import { Check, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { Product, formatPrice } from "@/lib/catalog";
import FavoriteButton from "./FavoriteButton";
import { useStore } from "./StoreProvider";

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useStore();
  const [added, setAdded] = useState(false);

  const firstAvailable = product.variants?.find(v => v.available > 0);
  const hasInventory = Boolean(product.variants?.length);
  const outOfStock = hasInventory && !firstAvailable;
  const size = firstAvailable?.size || product.sizes[0] || "Standart";
  const color = firstAvailable?.color || product.colors[0] || "Standart";
  const canBuy = product.price !== null && !outOfStock;

  function quickAdd() {
    if (!canBuy) return;
    addToCart({ slug: product.slug, qty: 1, size, color });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return <article className="catalog-card">
    <Link href={"/urun/" + product.slug} className="catalog-card-image">
      <img src={product.image} alt={product.name}/>
      {product.badge && <span>{product.badge}</span>}
    </Link>
    <div className="catalog-card-info">
      <div><Link href={"/urun/" + product.slug}><h3>{product.name}</h3></Link><p>{product.colors[0]}</p></div>
      <div className="catalog-price"><strong>{formatPrice(product.price)}</strong><FavoriteButton slug={product.slug}/></div>
    </div>
    <button
      type="button"
      className={"catalog-quick-add " + (added ? "added" : "")}
      disabled={!canBuy}
      onClick={quickAdd}
    >
      {added ? <><Check size={14}/> Sepete eklendi</> : outOfStock ? "Stokta yok" : product.price === null ? "Fiyat bekleniyor" : <><ShoppingBag size={14}/> Sepete ekle</>}
    </button>
  </article>;
}
