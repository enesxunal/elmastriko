/**
 * Public product URLs are independent of the stable catalog slugs.
 * Orders, favorites, historical carts and Merchant IDs keep their existing identifiers.
 */
export const productSeoAliases: Readonly<Record<string, string>> = {
  "elmas-urun-1": "zincir-detayli-triko-etek-takim",
  "elmas-urun-2": "bordo-lacivert-baklava-desenli-hirka",
  "elmas-urun-4": "gri-beyaz-dokulu-dugmeli-hirka",
  "elmas-urun-6": "ekru-vizon-cicek-desenli-kapusonlu-hirka",
  "elmas-urun-7": "vizon-geometrik-desenli-dokulu-hirka",
  "elmas-urun-8": "lacivert-ekru-cizgili-dugmeli-yun-hirka",
  "elmas-urun-9": "ekru-bej-cicek-desenli-yumusak-kazak",
};

const legacySlugBySeoSlug = new Map(
  Object.entries(productSeoAliases).map(([legacy, seo]) => [seo, legacy]),
);

/** Canonical user-facing slug used for links, schema, sitemap and metadata. */
export function toProductSeoSlug(slug: string): string {
  return productSeoAliases[slug] ?? slug;
}

/** Stable catalog slug used internally for carts, favorites, stock and orders. */
export function toCatalogProductSlug(slug: string): string {
  return legacySlugBySeoSlug.get(slug) ?? slug;
}
