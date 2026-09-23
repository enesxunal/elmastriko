"use client";

import Link from "next/link";
import { Heart, Minus, Plus } from "lucide-react";
import { Product, formatPrice } from "@/lib/catalog";
import { useStore } from "./StoreProvider";
import { useEffect, useMemo, useState } from "react";

export default function ProductPurchase({ product }: { product: Product }) {
  const { addToCart, favorites, toggleFavorite } = useStore();
  const initialVariant = product.variants?.find(variant => variant.available > 0) || product.variants?.[0];
  const [size, setSize] = useState(initialVariant?.size || product.sizes[0] || "");
  const [color, setColor] = useState(initialVariant?.color || product.colors[0] || "");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const isFavorite = favorites.includes(product.slug);
  const hasInventoryData = Boolean(product.variants?.length);

  const selectedVariant = useMemo(() => {
    if (!product.variants?.length) return null;
    return product.variants.find(variant =>
      (variant.size || "Standart") === size &&
      (variant.color || "Standart") === color
    ) || null;
  }, [product.variants, size, color]);

  const available = hasInventoryData ? (selectedVariant?.available ?? 0) : null;
  const outOfStock = available !== null && available <= 0;
  const selectedPrice = selectedVariant?.price ?? product.price;

  useEffect(() => {
    setQty(current => available === null ? current : Math.max(1, Math.min(current, Math.max(1, available))));
    setAdded(false);
  }, [available, size, color]);

  const colorHasStock = (candidate: string) => {
    if (!product.variants?.length) return true;
    return product.variants.some(v =>
      (v.color || "Standart") === candidate &&
      v.available > 0
    );
  };

  const sizeHasStock = (candidate: string) => {
    if (!product.variants?.length) return true;
    return product.variants.some(v =>
      (v.size || "Standart") === candidate &&
      v.available > 0
    );
  };

  return <>
    <span className="product-category">{product.category === "kadin" ? "Kadın" : "Erkek"} / {product.type}</span>
    <h1>{product.name}</h1>
    <div className="product-main-price">{formatPrice(selectedPrice)}</div>
    <p className="product-desc">{product.description}</p>

    <div className="product-option">
      <label>Renk</label>
      <div className="option-pills">{product.colors.map(c => {
        const enabled = colorHasStock(c);
        return <button type="button" disabled={!enabled} aria-disabled={!enabled} className={color === c ? "selected" : ""} onClick={() => setColor(c)} key={c}>{c}{!enabled ? " · Tükendi" : ""}</button>;
      })}</div>
    </div>

    <div className="product-option">
      <label>Beden</label>
      <div className="size-pills">{product.sizes.map(s => {
        const enabled = sizeHasStock(s);
        return <button type="button" disabled={!enabled} aria-disabled={!enabled} className={size === s ? "selected" : ""} onClick={() => setSize(s)} key={s}>{s}</button>;
      })}</div>
    </div>

    {available !== null && <div className={"stock-message " + (outOfStock ? "out" : available <= 5 ? "low" : "ok")}>
      {outOfStock ? "Bu varyant şu anda stokta yok." : available <= 5 ? `Son ${available} adet` : "Stokta"}
    </div>}

    <div className="product-buy-row">
      <div className="qty">
        <button type="button" aria-label="Adedi azalt" onClick={() => setQty(Math.max(1, qty - 1))}><Minus size={15}/></button>
        <span>{qty}</span>
        <button type="button" aria-label="Adedi artır" disabled={available !== null && qty >= available} onClick={() => setQty(available === null ? qty + 1 : Math.min(available, qty + 1))}><Plus size={15}/></button>
      </div>
      <button
        className="add-cart"
        disabled={outOfStock || product.price === null}
        onClick={() => {
          if (outOfStock || product.price === null) return;
          addToCart({ slug: product.slug, qty, size, color });
          setAdded(true);
        }}
      >
        {product.price === null ? "Fiyat bekleniyor" : outOfStock ? "Stokta Yok" : added ? "Sepete Eklendi" : "Sepete Ekle"}
      </button>
      <button type="button" className={"fav-btn " + (isFavorite ? "active" : "")} onClick={() => toggleFavorite(product.slug)} aria-label="Favorilere ekle"><Heart size={19} fill={isFavorite ? "currentColor" : "none"}/></button>
    </div>
    {added && <Link className="go-cart" href="/sepet">Sepete git →</Link>}

    <div className="product-assurances">
      <div><b>5.000 TL üzeri ücretsiz kargo</b><span>BasitKargo ile gönderim</span></div>
      <div><b>Kolay iade</b><span>Standart iade süreci</span></div>
    </div>
  </>;
}
