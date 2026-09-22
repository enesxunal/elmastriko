import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import ProductPurchase from "@/components/ProductPurchase";
import ProductCard from "@/components/ProductCard";
import { getProductBySlug, getProducts } from "@/lib/catalog-db";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description || `${product.name} - Elmas Triko kadın ve erkek triko koleksiyonları.`,
    alternates: { canonical: `/urun/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.description || undefined,
      images: product.images?.[0] ? [product.images[0]] : undefined,
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = (await getProducts({ gender: product.category })).filter(p => p.slug !== product.slug).slice(0, 4);

  return <><StoreHeader/><main className="product-page">
    <section className="product-gallery">{product.images.map((src, i) => <img src={src} alt={product.name + " " + (i+1)} key={src + i}/>)}</section>
    <aside className="product-detail"><ProductPurchase product={product}/></aside>
  </main>
  {related.length > 0 && <section className="related-section"><div className="related-head"><span>TAMAMLAYAN PARÇALAR</span><h2>Bunları da sevebilirsiniz.</h2></div><div className="catalog-grid">{related.map(p => <ProductCard key={p.slug} product={p}/>)}</div></section>}
  <StoreFooter/></>;
}
