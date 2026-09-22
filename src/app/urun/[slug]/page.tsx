import { notFound } from "next/navigation";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { products } from "@/lib/catalog";
import ProductPurchase from "@/components/ProductPurchase";

export function generateStaticParams() { return products.map(p => ({ slug: p.slug })); }

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = products.find(p => p.slug === slug);
  if (!product) notFound();
  return <><StoreHeader/><main className="product-page">
    <section className="product-gallery">{product.images.map((src, i) => <img src={src} alt={product.name + " " + (i+1)} key={src}/>)}</section>
    <aside className="product-detail"><ProductPurchase product={product}/></aside>
  </main><StoreFooter/></>;
}
