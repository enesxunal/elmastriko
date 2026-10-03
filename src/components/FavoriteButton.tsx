"use client";

import { Heart } from "lucide-react";
import { useStore } from "./StoreProvider";

export default function FavoriteButton({ slug }: { slug: string }) {
  const { favorites, toggleFavorite } = useStore();
  const active = favorites.includes(slug);
  return <button type="button" className={active ? "favorite-button active" : "favorite-button"} onClick={() => toggleFavorite(slug)} aria-label={active ? "Favorilerden çıkar" : "Favorilere ekle"} aria-pressed={active}><Heart size={16} fill={active ? "currentColor" : "none"}/></button>;
}
