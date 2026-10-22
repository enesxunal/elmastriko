import type { Product } from "@/lib/catalog";
import originalCopy from "@/data/product-copy-baseline.json";
import editorialCopy from "@/data/product-editorial.json";

type Editorial = { name: string; description: string; details: Array<{ label: string; value: string }> };
type Baseline = { name: string; description: string };

/**
 * Customer-facing copy corrections for the existing catalogue.
 * Original values are pinned to the 2026-10-22 export. New edits made in the
 * admin panel win, instead of being silently overridden by this release.
 */
export function applyProductEditorial(product: Product): Product {
  const original = (originalCopy as Record<string, Baseline>)[product.slug];
  const editorial = (editorialCopy as Record<string, Editorial>)[product.slug];
  if (!original || !editorial) return product;

  const titleIsOriginal = product.name === original.name;
  const descriptionIsOriginal = product.description === original.description;
  const titleIsEditorial = product.name === editorial.name;

  return {
    ...product,
    name: titleIsOriginal ? editorial.name : product.name,
    description: descriptionIsOriginal ? editorial.description : product.description,
    // Do not attach obsolete attributes if the item was renamed independently.
    details: (titleIsOriginal || titleIsEditorial) ? editorial.details : undefined,
  };
}

/** Shows the same text as the storefront in the product editor. */
export function editedProductText(product: Pick<Product, "slug" | "name" | "description">) {
  const original = (originalCopy as Record<string, Baseline>)[product.slug];
  const editorial = (editorialCopy as Record<string, Editorial>)[product.slug];
  if (!original || !editorial) return { name: product.name, description: product.description };
  return {
    name: product.name === original.name ? editorial.name : product.name,
    description: product.description === original.description ? editorial.description : product.description,
  };
}
