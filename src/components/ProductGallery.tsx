"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useRef, useState } from "react";

type MediaItem = { url: string; color?: string | null };

export default function ProductGallery({
  images,
  media,
  name,
  selectedColor,
}: {
  images: string[];
  media?: MediaItem[];
  name: string;
  selectedColor?: string;
}) {
  const allMedia = useMemo<MediaItem[]>(
    () => media?.length ? media : (images.length ? images : ["/images/product-placeholder.webp"]).map(url => ({ url, color: null })),
    [images, media],
  );

  const visibleMedia = useMemo(() => {
    if (!selectedColor) return allMedia;
    const matching = allMedia.filter(item => item.color === selectedColor);
    if (!matching.length) return allMedia;
    const shared = allMedia.filter(item => !item.color);
    return [...matching, ...shared];
  }, [allMedia, selectedColor]);

  const railRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);


  function goTo(index: number) {
    const next = Math.max(0, Math.min(index, visibleMedia.length - 1));
    setActive(next);
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollTo({ left: rail.clientWidth * next, behavior: "smooth" });
  }

  function handleScroll() {
    const rail = railRef.current;
    if (!rail || !rail.clientWidth) return;
    const next = Math.round(rail.scrollLeft / rail.clientWidth);
    if (next !== active && next >= 0 && next < visibleMedia.length) setActive(next);
  }

  return <section className="product-gallery" aria-label={name + " ürün görselleri"}>
    <div className="product-gallery-stage">
      <div className="product-gallery-rail" ref={railRef} onScroll={handleScroll}>
        {visibleMedia.map((item, index) => (
          <div className="product-gallery-slide" key={item.url + index}>
            <img src={item.url} alt={name + " " + (index + 1)} loading={index === 0 ? "eager" : "lazy"}/>
          </div>
        ))}
      </div>

      {visibleMedia.length > 1 && <>
        <button type="button" className="product-gallery-arrow prev" onClick={() => goTo(active - 1)} disabled={active === 0} aria-label="Önceki görsel">
          <ChevronLeft size={20}/>
        </button>
        <button type="button" className="product-gallery-arrow next" onClick={() => goTo(active + 1)} disabled={active === visibleMedia.length - 1} aria-label="Sonraki görsel">
          <ChevronRight size={20}/>
        </button>
        <div className="product-gallery-counter">{active + 1} / {visibleMedia.length}</div>
      </>}
    </div>

    {visibleMedia.length > 1 && <div className="product-gallery-thumbs" aria-label="Görsel seçimi">
      {visibleMedia.map((item, index) => (
        <button
          type="button"
          className={index === active ? "active" : ""}
          onClick={() => goTo(index)}
          aria-label={(index + 1) + ". görseli göster"}
          aria-current={index === active ? "true" : undefined}
          key={"thumb-" + item.url + index}
        >
          <img src={item.url} alt="" loading="lazy"/>
        </button>
      ))}
    </div>}
  </section>;
}
