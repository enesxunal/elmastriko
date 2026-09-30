"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/catalog";
import type { CartLine } from "@/components/StoreProvider";

function resolveUnitPrice(product: Product, line: CartLine) {
  const variant = product.variants?.find(item =>
    (item.size || "Standart") === (line.size || "Standart") &&
    (item.color || "Standart") === (line.color || "Standart")
  );

  return variant?.price ?? product.price;
}

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
      .map(line => {
        const product = products.find(item => item.slug === line.slug);
        if (!product) return null;
        return { line, product, unitPrice: resolveUnitPrice(product, line) };
      })
      .filter((row): row is { line: CartLine; product: Product; unitPrice: number | null } => Boolean(row)),
    [cart, products]
  );

  return { products, lines, loading };
}
