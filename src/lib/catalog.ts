export type Product = {
  slug: string;
  name: string;
  category: "kadin" | "erkek";
  type: string;
  price: number | null;
  image: string;
  images: string[];
  colors: string[];
  sizes: string[];
  badge?: string;
  description: string;
};

export const products: Product[] = [
  {
    slug: "siyah-cizgili-triko-takim",
    name: "Siyah Çizgili Triko Takım",
    category: "kadin",
    type: "Takım",
    price: null,
    image: "/images/product-black-set.webp",
    images: ["/images/product-black-set.webp", "/images/category-women.webp"],
    colors: ["Siyah / Ekru"],
    sizes: ["S", "M", "L"],
    badge: "Yeni",
    description: "Zamansız çizgiler ve yumuşak triko dokusuyla günlük kullanıma uygun takım.",
  },
  {
    slug: "ekru-cizgili-triko-takim",
    name: "Ekru Çizgili Triko Takım",
    category: "kadin",
    type: "Takım",
    price: null,
    image: "/images/product-cream-set.webp",
    images: ["/images/product-cream-set.webp", "/images/category-women.webp"],
    colors: ["Ekru"],
    sizes: ["S", "M", "L"],
    badge: "Edit",
    description: "Sade renk paleti ve modern triko formuyla günlük şıklığa uyum sağlayan takım.",
  },
  {
    slug: "diamond-desenli-triko-hirka",
    name: "Diamond Desenli Triko Hırka",
    category: "kadin",
    type: "Hırka",
    price: null,
    image: "/images/product-white-diamond.webp",
    images: ["/images/product-white-diamond.webp", "/images/signature-knit.webp"],
    colors: ["Ekru / Lacivert"],
    sizes: ["S", "M", "L"],
    badge: "Yeni",
    description: "Elmas desen diliyle hazırlanan düğmeli kadın triko hırka.",
  },
  {
    slug: "kapusonlu-desenli-triko-hirka",
    name: "Kapüşonlu Desenli Triko Hırka",
    category: "kadin",
    type: "Hırka",
    price: null,
    image: "/images/product-pattern-cardigan.webp",
    images: ["/images/product-pattern-cardigan.webp", "/images/edit-pattern-selection.webp"],
    colors: ["Ekru / Mürdüm"],
    sizes: ["S", "M", "L"],
    badge: "Çok Satan",
    description: "Kapüşon detayı ve güçlü geometrik deseniyle öne çıkan triko hırka.",
  },
];

export const FREE_SHIPPING_THRESHOLD = 5000;
export const STANDARD_SHIPPING_FEE = 149;

export function formatPrice(price: number | null) {
  if (price === null) return "Fiyat yakında";
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(price);
}
