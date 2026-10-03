"use client";

import Link from "next/link";
import { Heart, Minus, Plus, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { Product, formatPrice } from "@/lib/catalog";
import { useStore } from "./StoreProvider";
import { useMemo, useState } from "react";

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
  const safeQty = available === null ? qty : Math.max(1, Math.min(qty, Math.max(1, available)));

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

    {product.colors.length > 0 && <div className="product-option">
      <div className="product-option-head"><label>Renk</label><span>{color}</span></div>
      <div className="option-pills">{product.colors.map(c => {
        const enabled = colorHasStock(c);
        return <button
          type="button"
          disabled={!enabled}
          aria-disabled={!enabled}
          aria-pressed={color === c}
          className={color === c ? "selected" : ""}
          onClick={() => { setColor(c); setQty(1); setAdded(false); }}
          key={c}
        ><span>{c}</span>{!enabled && <small>Tükendi</small>}</button>;
      })}</div>
    </div>}

    {product.sizes.length > 0 && <div className="product-option">
      <div className="product-option-head"><label>Beden</label><span>{size}</span></div>
      <div className="size-pills">{product.sizes.map(s => {
        const enabled = sizeHasStock(s);
        return <button
          type="button"
          disabled={!enabled}
          aria-disabled={!enabled}
          aria-pressed={size === s}
          className={size === s ? "selected" : ""}
          onClick={() => { setSize(s); setQty(1); setAdded(false); }}
          key={s}
        ><span>{s}</span>{!enabled && <small>Tükendi</small>}</button>;
      })}</div>
    </div>}

    {available !== null && <div className={"stock-message " + (outOfStock ? "out" : available <= 5 ? "low" : "ok")}>
      {outOfStock ? "Bu varyant şu anda stokta yok." : available <= 5 ? `Son ${available} adet` : "Stokta"}
    </div>}

    <div className="product-buy-row">
      <div className="qty">
        <button type="button" aria-label="Adedi azalt" onClick={() => setQty(Math.max(1, safeQty - 1))}><Minus size={15}/></button>
        <span>{safeQty}</span>
        <button type="button" aria-label="Adedi artır" disabled={available !== null && safeQty >= available} onClick={() => setQty(available === null ? safeQty + 1 : Math.min(available, safeQty + 1))}><Plus size={15}/></button>
      </div>
      <button
        className="add-cart"
        disabled={outOfStock || product.price === null}
        onClick={() => {
          if (outOfStock || product.price === null) return;
          addToCart({ slug: product.slug, qty: safeQty, size, color });
          setAdded(true);
        }}
      >
        {product.price === null ? "Fiyat bekleniyor" : outOfStock ? "Stokta Yok" : added ? "Sepete Eklendi" : "Sepete Ekle"}
      </button>
      <button type="button" className={"fav-btn " + (isFavorite ? "active" : "")} onClick={() => toggleFavorite(product.slug)} aria-label={isFavorite ? product.name + " favorilerden çıkar" : product.name + " favorilere ekle"} aria-pressed={isFavorite}><Heart size={19} fill={isFavorite ? "currentColor" : "none"}/></button>
    </div>
    {added && <Link className="go-cart" href="/sepet">Sepete git →</Link>}

    <div className="product-assurances">
      <div><Truck size={17}/><span><b>Ücretsiz kargo</b><small>5.000 TL üzeri siparişlerde</small></span></div>
      <div><RotateCcw size={17}/><span><b>Kolay iade</b><small>Standart iade süreci</small></span></div>
      <div><ShieldCheck size={17}/><span><b>Güvenli ödeme</b><small>3D Secure kart ve EFT</small></span></div>
    </div>
  </>;
}
