export const PRODUCT_TAXONOMY = {
  kadin: ["Kazak","Hırka","Takım","Bluz","Tunik","Elbise","Pantolon","Etek","Yelek"],
  erkek: ["Kazak","Hırka","Sweatshirt","Yelek","Pantolon"],
  unisex: ["Kazak","Hırka","Sweatshirt","Yelek"],
} as const;

export type ProductGender = keyof typeof PRODUCT_TAXONOMY;

export function productSubcategories(gender: string) {
  return PRODUCT_TAXONOMY[(gender as ProductGender) in PRODUCT_TAXONOMY ? gender as ProductGender : "kadin"] as readonly string[];
}
