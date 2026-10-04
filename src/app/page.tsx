import type { Metadata } from "next";
import HomePageClient from "@/components/HomePageClient";

export const metadata: Metadata = {
  title: "Elmas Triko | Kadın ve Erkek Triko Online Mağaza",
  description: "Elmas Triko resmi online mağazası. Kadın ve erkek triko, hırka, kazak ve yeni sezon koleksiyonlarını keşfedin; güvenli ödeme ve hızlı gönderimle online sipariş verin.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "Elmas Triko",
    title: "Elmas Triko | Kadın ve Erkek Triko Online Mağaza",
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

export default function HomePage() {
  return <HomePageClient/>;
}
