import type { Metadata } from "next";
import GenderNewArrivalsPage from "@/components/GenderNewArrivalsPage";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Erkek Yeni Gelen Triko Modelleri | Elmas Triko",
  description: "Elmas Triko erkek yeni gelenler: yeni sezon erkek kazak, triko ve hırka modelleri.",
  alternates: { canonical: "/erkek/yeni-gelenler" },
  openGraph: { title: "Erkek Yeni Gelenler | Elmas Triko", url: "https://www.elmastriko.com/erkek/yeni-gelenler" },
};
export default async function MenNewPage({searchParams}:{searchParams:Promise<{type?:string;sort?:"newest"|"price-asc"|"price-desc"}>}) {
  const params = await searchParams;
  return <GenderNewArrivalsPage gender="erkek" type={params.type} sort={params.sort}/>;
}
