"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { products } from "@/lib/catalog";

export type CartLine = { slug: string; qty: number; size?: string; color?: string };

type StoreState = {
  cart: CartLine[];
  favorites: string[];
  addToCart: (line: CartLine) => void;
  removeFromCart: (slug: string) => void;
  setQty: (slug: string, qty: number) => void;
  toggleFavorite: (slug: string) => void;
  cartCount: number;
};

const StoreContext = createContext<StoreState | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      setCart(JSON.parse(localStorage.getItem("elmas-cart") || "[]"));
      setFavorites(JSON.parse(localStorage.getItem("elmas-favorites") || "[]"));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem("elmas-cart", JSON.stringify(cart));
  }, [cart, hydrated]);

  useEffect(() => {
    if (hydrated) localStorage.setItem("elmas-favorites", JSON.stringify(favorites));
  }, [favorites, hydrated]);

  const value = useMemo<StoreState>(() => ({
    cart,
    favorites,
    addToCart(line) {
      if (!products.some(p => p.slug === line.slug)) return;
      setCart(prev => {
        const found = prev.find(x => x.slug === line.slug && x.size === line.size && x.color === line.color);
        if (found) return prev.map(x => x === found ? { ...x, qty: x.qty + Math.max(1, line.qty) } : x);
        return [...prev, { ...line, qty: Math.max(1, line.qty) }];
      });
    },
    removeFromCart(slug) { setCart(prev => prev.filter(x => x.slug !== slug)); },
    setQty(slug, qty) {
      if (qty <= 0) setCart(prev => prev.filter(x => x.slug !== slug));
      else setCart(prev => prev.map(x => x.slug === slug ? { ...x, qty } : x));
    },
    toggleFavorite(slug) {
      setFavorites(prev => prev.includes(slug) ? prev.filter(x => x !== slug) : [...prev, slug]);
    },
    cartCount: cart.reduce((sum, x) => sum + x.qty, 0),
  }), [cart, favorites]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
