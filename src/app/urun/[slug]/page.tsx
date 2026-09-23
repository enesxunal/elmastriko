import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import ProductPurchase from "@/components/ProductPurchase";
import ProductCard from "@/components/ProductCard";
import { getProductBySlug, getProducts } from "@/lib/catalog-db";

const siteUrl = "https://www.elmastriko.com";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const title = product.name;
  const description = product.description || `${product.name} - Elmas Triko kadın ve erkek triko koleksiyonları.`;
  return {
    title,
    description,
    alternates: { canonical: `/urun/${product.slug}` },
    openGraph: {
      title,
      description,
      images: product.images?.[0] ? [product.images[0]] : undefined,
      type: "website",
      url: `${siteUrl}/urun/${product.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product.images?.[0] ? [product.images[0]] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = (await getProducts({ gender: product.category })).filter(p => p.slug !== product.slug).slice(0, 4);
  const inStock = product.variants?.length ? product.variants.some(variant => variant.available > 0) : undefined;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map(src => src.startsWith("http") ? src : siteUrl + src),
    category: product.type,
    brand: { "@type": "Brand", name: "Elmas Triko" },
    ...(product.price !== null ? {
      offers: {
        "@type": "Offer",
        url: `${siteUrl}/urun/${product.slug}`,
        priceCurrency: "TRY",
        price: product.price,
        ...(inStock !== undefined ? {
          availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        } : {}),
      },
    } : {}),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: siteUrl },
      { "@type": "ListItem", position: 2, name: product.category === "kadin" ? "Kadın" : "Erkek", item: `${siteUrl}/${product.category}` },
      { "@type": "ListItem", position: 3, name: product.name, item: `${siteUrl}/urun/${product.slug}` },
    ],
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}/>
    <StoreHeader/>
    <main className="product-page">
      <section className="product-gallery">{product.images.map((src, i) => <img src={src} alt={product.name + " " + (i + 1)} loading={i === 0 ? "eager" : "lazy"} key={src + i}/>)}</section>
      <aside className="product-detail"><ProductPurchase product={product}/></aside>
    </main>
    {related.length > 0 && <section className="related-section"><div className="related-head"><span>TAMAMLAYAN PARÇALAR</span><h2>Bunları da sevebilirsiniz.</h2></div><div className="catalog-grid">{related.map(p => <ProductCard key={p.slug} product={p}/>)}</div></section>}
    <StoreFooter/>
  </>;
}
