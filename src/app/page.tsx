import type { Metadata } from "next";
import HomePageClient from "@/components/HomePageClient";
import { getProducts } from "@/lib/catalog-db";

export const metadata: Metadata = {
  title: "Elmas Triko | Resmi Online Mağaza ve Triko Modelleri",
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
  const initialProducts = (await getProducts()).slice(0, 4).map(product => ({
    slug: product.slug,
    name: product.name,
    price: product.price,
    image: product.image,
    colors: product.colors,
    badge: product.badge,
  }));
  return <HomePageClient initialProducts={initialProducts}/>;
}
