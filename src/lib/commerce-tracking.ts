"use client";
import type { Product } from "./catalog";
import type { CartLine } from "@/components/StoreProvider";
import { analyticsAllowed, currentAnalyticsPage, trackStoreEvent } from "./analytics-client";
import { gaEvent, gaItem, gaCart } from "./ga4";
import { metaTrack } from "./meta-pixel";
const gaViews = new Set<string>();
export function trackProductView(product: Product) {
  try {
    if (!analyticsAllowed()) return;
    const page = currentAnalyticsPage();
    if (page.path !== "/urun/" + product.slug) return;
    const item = gaItem(product);
    const id = page.viewItemId!;
    if (!gaViews.has(id)) { gaViews.add(id); if (gaViews.size > 2000) gaViews.delete(gaViews.values().next().value!); if (item) gaEvent("view_item", { currency: "TRY", value: item.price, items: [item] }); }
    metaTrack("ViewContent", { content_ids: product.variants?.length ? product.variants.filter(v => v.available > 0).map(v => v.sku || v.id) : [product.slug], content_type: "product", currency: "TRY", ...(item ? { value: item.price } : {}) }, id);
  } catch {}
}
export function trackCartAddition(product: Product, line: CartLine, price: number | null) {
  try {
    const id = trackStoreEvent("add_to_cart", line.slug);
    if (!id) return;
    const item = gaItem(product, line.qty, price, line.color, line.size);
    const variant = product.variants?.find(v => v.color === line.color && v.size === line.size);
    if (item) gaEvent("add_to_cart", { currency: "TRY", value: item.price * line.qty, items: [item] });
    metaTrack("AddToCart", { currency: "TRY", ...(item ? { value: item.price * line.qty } : {}), content_ids: [variant?.sku || variant?.id || product.slug], content_type: "product", num_items: line.qty }, id);
  } catch {}
}
export function trackCheckoutStart(lines: Array<{ line: CartLine; product: Product; unitPrice: number | null }>) {
  try {
    if (!lines.length || !analyticsAllowed()) return;
    const page = currentAnalyticsPage();
    if (page.path !== "/checkout") return;
    const alreadySent = Boolean(page.checkoutId);
    const id = trackStoreEvent("begin_checkout");
    if (!id) return;
    if (!alreadySent) gaEvent("begin_checkout", gaCart(lines));
    metaTrack("InitiateCheckout", { currency: "TRY", value: gaCart(lines).value, content_type: "product", content_ids: lines.map(({ line, product }) => product.variants?.find(v => v.color === line.color && v.size === line.size)?.sku || product.variants?.find(v => v.color === line.color && v.size === line.size)?.id || product.slug), num_items: lines.reduce((n, x) => n + x.line.qty, 0) }, id);
  } catch {}
}
