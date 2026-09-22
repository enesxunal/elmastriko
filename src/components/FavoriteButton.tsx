"use client";

import { Heart } from "lucide-react";
import { useStore } from "./StoreProvider";

export default function FavoriteButton({ slug }: { slug: string }) {
  const { favorites, toggleFavorite } = useStore();
  const active = favorites.includes(slug);
  return <button onClick={() => toggleFavorite(slug)} aria-label="Favorilere ekle"><Heart size={16} fill={active ? "currentColor" : "none"}/></button>;
}
