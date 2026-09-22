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
    image: "/images/product-black-set.png",
    images: ["/images/product-black-set.png", "/images/category-women.png"],
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
    image: "/images/product-cream-set.png",
    images: ["/images/product-cream-set.png", "/images/category-women.png"],
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
    image: "/images/product-white-diamond.png",
    images: ["/images/product-white-diamond.png", "/images/signature-knit.png"],
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
    image: "/images/product-pattern-cardigan.png",
    images: ["/images/product-pattern-cardigan.png", "/images/edit-pattern-selection.png"],
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
