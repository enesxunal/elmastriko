import type { Metadata } from "next";
import HomePageClient from "@/components/HomePageClient";
import { getProducts } from "@/lib/catalog-db";

export const metadata: Metadata = {
  title: { absolute: "Elmas Triko | Resmi Online Mağaza ve Triko Modelleri" },
  description: "Elmas Triko resmi online mağazası. Kadın triko, hırka, kazak, takım ve yeni sezon koleksiyonlarını keşfedin; güncel renk, beden ve stok seçeneklerini inceleyin.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "Elmas Triko",
    title: "Elmas Triko | Resmi Online Mağaza ve Triko Modelleri",
    description: "Elmas Triko kadın ve erkek triko koleksiyonlarını, yeni sezon hırka ve kazak modellerini online keşfedin.",
    url: "https://www.elmastriko.com",
    images: [{ url: "/images/hero-banner.webp", alt: "Elmas Triko yeni sezon triko koleksiyonu" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Elmas Triko | Kadın ve Erkek Triko",
    description: "Elmas Triko resmi online mağazası. Yeni sezon kadın ve erkek triko koleksiyonları.",
    images: ["/images/hero-banner.webp"],
  },
};

export default async function HomePage() {
  const products = await getProducts();
  const initialProducts = products.slice(0, 4).map(product => ({
    slug: product.slug,
    name: product.name,
    price: product.price,
    image: product.image,
    colors: product.colors,
    badge: product.badge,
  }));

  const homeSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://www.elmastriko.com/#webpage",
    url: "https://www.elmastriko.com",
    name: "Elmas Triko | Resmi Online Mağaza ve Triko Modelleri",
    description: metadata.description,
    isPartOf: { "@id": "https://www.elmastriko.com/#website" },
    about: { "@id": "https://www.elmastriko.com/#organization" },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: "https://www.elmastriko.com/images/hero-banner.webp",
    },
    inLanguage: "tr-TR",
  };

  const featuredProductsSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Elmas Triko öne çıkan ürünler",
    numberOfItems: initialProducts.length,
    itemListElement: initialProducts.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `https://www.elmastriko.com/urun/${product.slug}`,
      name: product.name,
      image: product.image.startsWith("http") ? product.image : `https://www.elmastriko.com${product.image}`,
    })),
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeSchema) }}/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(featuredProductsSchema) }}/>
    <HomePageClient initialProducts={initialProducts}/>
  </>;
}
