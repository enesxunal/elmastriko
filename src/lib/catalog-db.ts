import { createClient } from "@/lib/supabase/server";
import { Product, products as fallbackProducts } from "@/lib/catalog";

type DbProduct = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  gender: "kadin" | "erkek" | "unisex" | null;
  product_type: string | null;
  base_price: number | string | null;
  compare_at_price: number | string | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  product_images?: { url: string; sort_order: number; alt_text: string | null }[];
  product_variants?: { color: string | null; size: string | null; price: number | string | null; is_active: boolean }[];
};

function unique(values: (string | null | undefined)[]) {
  return [...new Set(values.filter((v): v is string => Boolean(v)))];
}

function mapDbProduct(row: DbProduct): Product {
  const images = [...(row.product_images || [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(x => x.url);

  const variants = (row.product_variants || []).filter(v => v.is_active);
  const variantPrice = variants.map(v => v.price).find(v => v !== null && v !== undefined);
  const numericPrice = row.base_price ?? variantPrice ?? null;

  return {
    slug: row.slug,
    name: row.name,
    category: row.gender === "erkek" ? "erkek" : "kadin",
    type: row.product_type || "Triko",
    price: numericPrice === null ? null : Number(numericPrice),
    image: images[0] || "/images/product-cream-set.png",
    images: images.length ? images : ["/images/product-cream-set.png"],
    colors: unique(variants.map(v => v.color)).length ? unique(variants.map(v => v.color)) : ["Standart"],
    sizes: unique(variants.map(v => v.size)).length ? unique(variants.map(v => v.size)) : ["Standart"],
    badge: row.is_featured ? "Öne Çıkan" : undefined,
    description: row.description || "Elmas Triko yeni sezon koleksiyonundan seçili parça.",
  };
}

async function fetchDbProducts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(`
      id, slug, name, description, gender, product_type, base_price, compare_at_price,
      is_active, is_featured, created_at,
      product_images(url, sort_order, alt_text),
      product_variants(color, size, price, is_active)
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as unknown as DbProduct[]).map(mapDbProduct);
}

export async function getProducts(options?: {
  gender?: "kadin" | "erkek";
  query?: string;
  type?: string;
  sort?: "newest" | "price-asc" | "price-desc";
}) {
  const dbProducts = await fetchDbProducts();
  let list = dbProducts.length ? dbProducts : fallbackProducts;

  if (options?.gender) list = list.filter(p => p.category === options.gender);
  if (options?.query) {
    const q = options.query.toLocaleLowerCase("tr-TR");
    list = list.filter(p =>
      [p.name, p.description, p.type, ...p.colors]
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(q)
    );
  }
  if (options?.type) list = list.filter(p => p.type === options.type);

  if (options?.sort === "price-asc") {
    list = [...list].sort((a, b) => (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER));
  } else if (options?.sort === "price-desc") {
    list = [...list].sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
  }

  return list;
}

export async function getProductBySlug(slug: string) {
  const dbProducts = await fetchDbProducts();
  if (dbProducts.length) return dbProducts.find(p => p.slug === slug) || null;
  return fallbackProducts.find(p => p.slug === slug) || null;
}

export async function getProductTypes(gender?: "kadin" | "erkek") {
  const products = await getProducts({ gender });
  return [...new Set(products.map(p => p.type))].sort((a, b) => a.localeCompare(b, "tr"));
}
