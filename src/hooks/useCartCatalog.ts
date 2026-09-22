"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/catalog";
import type { CartLine } from "@/components/StoreProvider";

export function useCartCatalog(cart: CartLine[]) {
  const slugs = useMemo(() => [...new Set(cart.map(line => line.slug).filter(Boolean))], [cart]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!slugs.length) {
        setProducts([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch("/api/catalog?slugs=" + encodeURIComponent(slugs.join(",")), {
          cache: "no-store",
        });
        const body = await response.json();
        if (!cancelled) setProducts(Array.isArray(body.products) ? body.products : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [slugs]);

  const lines = useMemo(
    () => cart
      .map(line => ({ line, product: products.find(product => product.slug === line.slug) }))
      .filter((row): row is { line: CartLine; product: Product } => Boolean(row.product)),
    [cart, products]
  );

  return { products, lines, loading };
}
