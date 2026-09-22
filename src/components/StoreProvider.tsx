"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type CartLine = { slug: string; qty: number; size?: string; color?: string };

type StoreState = {
  cart: CartLine[];
  favorites: string[];
  addToCart: (line: CartLine) => void;
  removeFromCart: (slug: string) => void;
  setQty: (slug: string, qty: number) => void;
  toggleFavorite: (slug: string) => void;
  clearCart: () => void;
  cartCount: number;
};

const StoreContext = createContext<StoreState | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  if (!supabaseRef.current) supabaseRef.current = createClient();
  const supabase = supabaseRef.current;

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

  useEffect(() => {
    let cancelled = false;

    async function syncAndLoadFavorites() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      let localSlugs: string[] = [];
      try {
        localSlugs = JSON.parse(localStorage.getItem("elmas-favorites") || "[]");
      } catch {}

      if (localSlugs.length) {
        const { data: localProducts } = await supabase.from("products").select("id, slug").in("slug", localSlugs);
        if (localProducts?.length) {
          await supabase.from("favorites").upsert(
            localProducts.map(product => ({ user_id: user.id, product_id: product.id })),
            { onConflict: "user_id,product_id" }
          );
        }
      }

      const { data: favoriteRows } = await supabase.from("favorites").select("product_id").eq("user_id", user.id);
      const ids = (favoriteRows || []).map(row => row.product_id);
      if (!ids.length || cancelled) return;

      const { data: productRows } = await supabase.from("products").select("slug").in("id", ids);
      if (cancelled) return;

      const remoteSlugs = (productRows || []).map(row => row.slug);
      setFavorites(prev => [...new Set([...prev, ...remoteSlugs])]);
    }

    if (hydrated) void syncAndLoadFavorites();
    const { data: listener } = supabase.auth.onAuthStateChange(() => void syncAndLoadFavorites());

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [hydrated, supabase]);

  async function syncFavorite(slug: string, shouldExist: boolean) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: product } = await supabase.from("products").select("id").eq("slug", slug).maybeSingle();
    if (!product) return;

    if (shouldExist) {
      await supabase.from("favorites").upsert({ user_id: user.id, product_id: product.id }, { onConflict: "user_id,product_id" });
    } else {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", product.id);
    }
  }

  const value = useMemo<StoreState>(() => ({
    cart,
    favorites,
    addToCart(line) {
      if (!line.slug) return;
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
      setFavorites(prev => {
        const shouldExist = !prev.includes(slug);
        void syncFavorite(slug, shouldExist);
        return shouldExist ? [...prev, slug] : prev.filter(x => x !== slug);
      });
    },
    clearCart() { setCart([]); },
    cartCount: cart.reduce((sum, x) => sum + x.qty, 0),
  }), [cart, favorites]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
