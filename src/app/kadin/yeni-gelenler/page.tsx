import type { Metadata } from "next";
import GenderNewArrivalsPage from "@/components/GenderNewArrivalsPage";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Kadın Yeni Gelen Triko Modelleri | Elmas Triko",
  description: "Elmas Triko kadın yeni gelenler: yeni sezon kadın kazak, triko, hırka ve takım modelleri.",
  alternates: { canonical: "/kadin/yeni-gelenler" },
  openGraph: { title: "Kadın Yeni Gelenler | Elmas Triko", url: "https://www.elmastriko.com/kadin/yeni-gelenler" },
};
export default async function WomenNewPage({searchParams}:{searchParams:Promise<{type?:string;sort?:"newest"|"price-asc"|"price-desc"}>}) {
  const params = await searchParams;
  return <GenderNewArrivalsPage gender="kadin" type={params.type} sort={params.sort}/>;
}
