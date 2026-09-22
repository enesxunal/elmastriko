"use client";

import Link from "next/link";
import { Heart, Minus, Plus } from "lucide-react";
import { Product, formatPrice } from "@/lib/catalog";
import { useStore } from "./StoreProvider";
import { useState } from "react";

export default function ProductPurchase({ product }: { product: Product }) {
  const { addToCart, favorites, toggleFavorite } = useStore();
  const [size, setSize] = useState(product.sizes[0] || "");
  const [color, setColor] = useState(product.colors[0] || "");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const isFavorite = favorites.includes(product.slug);

  return <>
    <span className="product-category">{product.category === "kadin" ? "Kadın" : "Erkek"} / {product.type}</span>
    <h1>{product.name}</h1>
    <div className="product-main-price">{formatPrice(product.price)}</div>
    <p className="product-desc">{product.description}</p>

    <div className="product-option">
      <label>Renk</label>
      <div className="option-pills">{product.colors.map(c => <button className={color === c ? "selected" : ""} onClick={() => setColor(c)} key={c}>{c}</button>)}</div>
    </div>

    <div className="product-option">
      <label>Beden</label>
      <div className="size-pills">{product.sizes.map(s => <button className={size === s ? "selected" : ""} onClick={() => setSize(s)} key={s}>{s}</button>)}</div>
    </div>

    <div className="product-buy-row">
      <div className="qty">
        <button onClick={() => setQty(Math.max(1, qty - 1))}><Minus size={15}/></button>
        <span>{qty}</span>
        <button onClick={() => setQty(qty + 1)}><Plus size={15}/></button>
      </div>
      <button className="add-cart" onClick={() => { addToCart({ slug: product.slug, qty, size, color }); setAdded(true); }}>
        {added ? "Sepete Eklendi" : "Sepete Ekle"}
      </button>
      <button className={"fav-btn " + (isFavorite ? "active" : "")} onClick={() => toggleFavorite(product.slug)} aria-label="Favorilere ekle"><Heart size={19} fill={isFavorite ? "currentColor" : "none"}/></button>
    </div>
    {added && <Link className="go-cart" href="/sepet">Sepete git →</Link>}

    <div className="product-assurances">
      <div><b>5.000 TL üzeri ücretsiz kargo</b><span>BasitKargo ile gönderim</span></div>
      <div><b>Kolay iade</b><span>Standart iade süreci</span></div>
    </div>
  </>;
}
