"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type CartLine = { slug: string; qty: number; size?: string; color?: string };
type CartIdentity = Pick<CartLine, "slug" | "size" | "color">;

type StoreState = {
  cart: CartLine[];
  favorites: string[];
  addToCart: (line: CartLine) => void;
  removeFromCart: (line: CartIdentity) => void;
  setQty: (line: CartIdentity, qty: number) => void;
  toggleFavorite: (slug: string) => void;
  clearCart: () => void;
  cartCount: number;
};

const StoreContext = createContext<StoreState | null>(null);
const GUEST_FAVORITES_KEY = "elmas-guest-favorites";
const CART_KEY = "elmas-cart";

function sameCartLine(a: CartIdentity, b: CartIdentity) {
  return a.slug === b.slug &&
    (a.size || "") === (b.size || "") &&
    (a.color || "") === (b.color || "");
}

function normalizeCart(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];

  const merged: CartLine[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Partial<CartLine>;
    const slug = typeof item.slug === "string" ? item.slug.trim() : "";
    const qty = Number(item.qty);
    if (!slug || !Number.isFinite(qty) || qty <= 0) continue;

    const line: CartLine = {
      slug,
      qty: Math.max(1, Math.floor(qty)),
      ...(typeof item.size === "string" && item.size ? { size: item.size } : {}),
      ...(typeof item.color === "string" && item.color ? { color: item.color } : {}),
    };

    const existing = merged.find(existingLine => sameCartLine(existingLine, line));
    if (existing) existing.qty += line.qty;
    else merged.push(line);
  }

  return merged;
}

function readGuestFavorites() {
  try {
    const value = JSON.parse(localStorage.getItem(GUEST_FAVORITES_KEY) || "[]");
    return Array.isArray(value) ? value.filter(item => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
        setCart(normalizeCart(stored));
      } catch {
        setCart([]);
      }
      setFavorites(readGuestFavorites());
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(CART_KEY, JSON.stringify(normalizeCart(cart)));
  }, [cart, hydrated]);

  useEffect(() => {
    if (hydrated && !authUserId) localStorage.setItem(GUEST_FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites, hydrated, authUserId]);

  useEffect(() => {
    let cancelled = false;

    async function syncIdentity() {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;

      if (!user) {
        setAuthUserId(null);
        setFavorites(readGuestFavorites());
        return;
      }

      setAuthUserId(user.id);
      const guestSlugs = readGuestFavorites();

      if (guestSlugs.length) {
        const { data: localProducts } = await supabase.from("products").select("id, slug").in("slug", guestSlugs);
        if (localProducts?.length) {
          await supabase.from("favorites").upsert(
            localProducts.map(product => ({ user_id: user.id, product_id: product.id })),
            { onConflict: "user_id,product_id" }
          );
        }
        localStorage.removeItem(GUEST_FAVORITES_KEY);
      }

      const { data: favoriteRows } = await supabase.from("favorites").select("product_id").eq("user_id", user.id);
      const ids = (favoriteRows || []).map(row => row.product_id);
      if (!ids.length || cancelled) {
        setFavorites([]);
        return;
      }

      const { data: productRows } = await supabase.from("products").select("slug").in("id", ids);
      if (cancelled) return;
      setFavorites((productRows || []).map(row => row.slug));
    }

    if (hydrated) void syncIdentity();
    const { data: listener } = supabase.auth.onAuthStateChange(() => void syncIdentity());
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

  const value: StoreState = {
    cart,
    favorites,
    addToCart(line) {
      if (!line.slug) return;
      setCart(prev => {
        const next = normalizeCart(prev);
        const found = next.find(item => sameCartLine(item, line));
        if (found) {
          return next.map(item => sameCartLine(item, line)
            ? { ...item, qty: item.qty + Math.max(1, Math.floor(line.qty || 1)) }
            : item);
        }
        return [...next, { ...line, qty: Math.max(1, Math.floor(line.qty || 1)) }];
      });
    },
    removeFromCart(line) {
      setCart(prev => prev.filter(item => !sameCartLine(item, line)));
    },
    setQty(line, qty) {
      if (qty <= 0) {
        setCart(prev => prev.filter(item => !sameCartLine(item, line)));
      } else {
        setCart(prev => prev.map(item => sameCartLine(item, line) ? { ...item, qty } : item));
      }
    },
    toggleFavorite(slug) {
      setFavorites(prev => {
        const shouldExist = !prev.includes(slug);
        if (authUserId) void syncFavorite(slug, shouldExist);
        return shouldExist ? [...prev, slug] : prev.filter(x => x !== slug);
      });
    },
    clearCart() { setCart([]); },
    cartCount: cart.reduce((sum, item) => sum + item.qty, 0),
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
