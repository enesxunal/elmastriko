"use client";
import type { Product } from "@/lib/catalog";
import type { CartLine } from "@/components/StoreProvider";

type Item = { item_id: string; item_name: string; price: number; quantity: number; item_category?: string; item_variant?: string };
type CartProduct = {line: CartLine; product: Product; unitPrice: number | null};
declare global { interface Window { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void } }
export function gaEvent(name: string, details: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") window.gtag("event", name, details);
  else if (window.dataLayer) window.dataLayer.push({event: name, ...details});
}
export function gaItem(product: Product, qty=1, price=product.price, color?: string, size?: string): Item | null {
  if (price === null || !Number.isFinite(price)) return null;
  return {item_id: product.slug, item_name: product.name, item_category: product.type, ...(color || size ? {item_variant:[color,size].filter(Boolean).join(" / ")}:{}), price, quantity:qty};
}
export function gaCart(lines: CartProduct[]) {
  const items=lines.map(({line,product,unitPrice})=>gaItem(product,line.qty,unitPrice,line.color,line.size)).filter((v):v is Item=>v!==null);
  return {currency:"TRY",value:items.reduce((s,i)=>s+i.price*i.quantity,0),items};
}
