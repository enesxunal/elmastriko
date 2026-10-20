"use client";

import { useCommerceSettings } from "@/hooks/useCommerceSettings";
import Link from "next/link";
import { createPortal } from "react-dom";
import { Heart, Minus, Plus, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { Product, formatPrice } from "@/lib/catalog";
import { useStore } from "./StoreProvider";
import { useMemo, useState, useEffect } from "react";
import { trackProductView, trackCartAddition } from "@/lib/commerce-tracking";

export default function ProductPurchase({ product, selectedColor, onColorChange }: { product: Product; selectedColor?: string; onColorChange?: (color: string) => void }) {
  const { shippingCampaignActive, shippingFee, freeShippingThreshold, loading: shippingLoading } = useCommerceSettings();
  const { addToCart, favorites, toggleFavorite } = useStore();
  const initialVariant = product.variants?.find(variant => variant.available > 0) || product.variants?.[0];
  const [size, setSize] = useState(initialVariant?.size || product.sizes[0] || "");
  const [internalColor, setInternalColor] = useState(initialVariant?.color || product.colors[0] || "");
  const color = selectedColor ?? internalColor;
  const setColor = (next: string) => { setInternalColor(next); onColorChange?.(next); };
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const sizeGuideImage = product.category === "kadin" ? "/beden-tablolari/kadin-beden-tablosu.png" : "/beden-tablolari/erkek-beden-tablosu.png";
  const sizeGuideLabel = product.category === "kadin" ? "Kadın" : "Erkek";
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

  useEffect(() => { trackProductView(product); }, [product]);

  return <>
    <span className="product-category">{product.category === "kadin" ? "Kadın" : "Erkek"} / {product.type}</span>
    <h1>{product.name}</h1>
    <div className="product-main-price">{formatPrice(selectedPrice)}</div>
    <p className="product-shipping-note">{shippingCampaignActive ? "31 Ekim sonuna kadar kargo ücretsiz. Minimum tutar yok." : shippingLoading ? "Kargo bilgisi yükleniyor…" : selectedPrice !== null && selectedPrice * safeQty >= freeShippingThreshold ? "Bu seçimde kargo ücretsiz." : shippingFee !== null ? `Kargo ${formatPrice(shippingFee)} · ${freeShippingThreshold.toLocaleString("tr-TR")} TL ve üzeri ücretsiz.` : "Kargo bedeli sepette gösterilir."}</p>
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
      <div className="product-option-head"><label>Beden</label><button type="button" onClick={() => setSizeGuideOpen(true)} aria-haspopup="dialog" style={{ background: "none", border: 0, color: "#23513f", textDecoration: "underline", cursor: "pointer", fontSize: 14 }}>Beden Tablosu ↗</button><span>{size}</span></div>
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
          trackCartAddition(product, { slug: product.slug, qty: safeQty, color, size }, selectedPrice);
          setAdded(true);
        }}
      >
        {product.price === null ? "Fiyat bekleniyor" : outOfStock ? "Stokta Yok" : added ? "Sepete Eklendi" : "Sepete Ekle"}
      </button>
      <button type="button" className={"fav-btn " + (isFavorite ? "active" : "")} onClick={() => toggleFavorite(product.slug)} aria-label={isFavorite ? product.name + " favorilerden çıkar" : product.name + " favorilere ekle"} aria-pressed={isFavorite}><Heart size={19} fill={isFavorite ? "currentColor" : "none"}/></button>
    </div>
    {added && <Link className="go-cart" href="/sepet">Sepete git →</Link>}

    {sizeGuideOpen && createPortal(<div role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setSizeGuideOpen(false); }} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.7)", display: "grid", placeItems: "center", padding: 12 }}>
      <div role="dialog" aria-modal="true" aria-label={`${sizeGuideLabel} beden tablosu`} onKeyDown={event => { if (event.key === "Escape") setSizeGuideOpen(false); }} style={{ background: "white", borderRadius: 14, width: "min(100%, 720px)", maxHeight: "95dvh", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px" }}><strong>{sizeGuideLabel} Beden Tablosu</strong><button type="button" autoFocus onClick={() => setSizeGuideOpen(false)} aria-label="Beden tablosunu kapat" style={{ cursor: "pointer", border: 0, background: "transparent", padding: 8, fontSize: 24 }}>×</button></div>
        <img src={sizeGuideImage} alt={`Elmas Triko ${sizeGuideLabel} beden tablosu`} style={{ display: "block", width: "100%", height: "auto" }}/>
      </div>
    </div>, document.body)}

    <div className="product-assurances">
      <div><Truck size={17}/><span><b>{shippingCampaignActive ? "Kargo bizden" : "Ücretsiz kargo"}</b><small>{shippingCampaignActive ? "31 Ekim’e kadar tüm siparişlerde" : "5.000 TL ve üzeri siparişlerde"}</small></span></div>
      <div><RotateCcw size={17}/><span><b>İade ve değişim desteği</b><small><Link href="/kargo-iade">Koşulları inceleyin →</Link></small></span></div>
      <div><ShieldCheck size={17}/><span><b>Güvenli ödeme</b><small>3D Secure kart ve EFT</small></span></div>
    </div>
    <p className="dispatch-note">Ödeme onayından sonra <strong>1–2 iş gününde kargoya teslim.</strong></p>
    <div className="purchase-help">
      <details><summary>Beden seçiminde yardım</summary><p>Satın almadan önce beden tablosunu inceleyin. Kalıp ve ölçü sorularınız için <a href="https://wa.me/905356007011" target="_blank" rel="noopener noreferrer">WhatsApp’tan bize yazın</a>.</p><button type="button" onClick={() => setSizeGuideOpen(true)}>Beden tablosunu aç →</button></details>
      <details><summary>Teslimat ve sipariş takibi</summary><p>Ödemesi onaylanan siparişler 1–2 iş günü içinde kargoya verilir. Teslim süresi kargo firmasına ve bölgeye göre değişir. Kargoya verildiğinde takip bilgisini <Link href="/siparis-takip">sipariş takip sayfasından</Link> kontrol edebilirsiniz.</p><Link href="/kargo-iade">Teslimat koşulları →</Link></details>
      <div className="purchase-contact"><b>Elmas Triko resmi online mağazası</b><span><a href="https://wa.me/905356007011" target="_blank" rel="noopener noreferrer">WhatsApp’tan soru sorun →</a> · <Link href="/mesafeli-satis">Satış koşulları</Link></span></div>
    </div>
  </>;
}
