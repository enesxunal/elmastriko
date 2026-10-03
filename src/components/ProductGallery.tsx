"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";

export default function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const safeImages = images.length ? images : ["/images/product-placeholder.webp"];
  const railRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function goTo(index: number) {
    const next = Math.max(0, Math.min(index, safeImages.length - 1));
    setActive(next);
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollTo({ left: rail.clientWidth * next, behavior: "smooth" });
  }

  function handleScroll() {
    const rail = railRef.current;
    if (!rail || !rail.clientWidth) return;
    const next = Math.round(rail.scrollLeft / rail.clientWidth);
    if (next !== active && next >= 0 && next < safeImages.length) setActive(next);
  }

  return <section className="product-gallery" aria-label={name + " ürün görselleri"}>
    <div className="product-gallery-stage">
      <div className="product-gallery-rail" ref={railRef} onScroll={handleScroll}>
        {safeImages.map((src, index) => (
          <div className="product-gallery-slide" key={src + index}>
            <img src={src} alt={name + " " + (index + 1)} loading={index === 0 ? "eager" : "lazy"}/>
          </div>
        ))}
      </div>

      {safeImages.length > 1 && <>
        <button type="button" className="product-gallery-arrow prev" onClick={() => goTo(active - 1)} disabled={active === 0} aria-label="Önceki görsel">
          <ChevronLeft size={20}/>
        </button>
        <button type="button" className="product-gallery-arrow next" onClick={() => goTo(active + 1)} disabled={active === safeImages.length - 1} aria-label="Sonraki görsel">
          <ChevronRight size={20}/>
        </button>
        <div className="product-gallery-counter">{active + 1} / {safeImages.length}</div>
      </>}
    </div>

    {safeImages.length > 1 && <div className="product-gallery-thumbs" aria-label="Görsel seçimi">
      {safeImages.map((src, index) => (
        <button
          type="button"
          className={index === active ? "active" : ""}
          onClick={() => goTo(index)}
          aria-label={(index + 1) + ". görseli göster"}
          aria-current={index === active ? "true" : undefined}
          key={"thumb-" + src + index}
        >
          <img src={src} alt="" loading="lazy"/>
        </button>
      ))}
    </div>}
  </section>;
}
