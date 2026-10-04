"use client";

import { useState } from "react";
import type { Product } from "@/lib/catalog";
import ProductGallery from "@/components/ProductGallery";
import ProductPurchase from "@/components/ProductPurchase";

export default function ProductDetailClient({ product }: { product: Product }) {
  const initialVariant = product.variants?.find(variant => variant.available > 0) || product.variants?.[0];
  const [selectedColor, setSelectedColor] = useState(initialVariant?.color || product.colors[0] || "");

  return <>
    <ProductGallery key={selectedColor || "all"} images={product.images} media={product.media} name={product.name} selectedColor={selectedColor}/>
    <aside className="product-detail">
      <ProductPurchase product={product} selectedColor={selectedColor} onColorChange={setSelectedColor}/>
    </aside>
  </>;
}
