import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import ProductDetailClient from "@/components/ProductDetailClient";
import ProductCard from "@/components/ProductCard";
import { getProductBySlug, getProducts } from "@/lib/catalog-db";

const siteUrl = "https://www.elmastriko.com";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const title = product.name;
  const description = product.description ? `${product.description} Elmas Triko online mağazada renk, beden ve stok seçeneklerini inceleyin.` : `${product.name} - Elmas Triko ${product.type.toLocaleLowerCase("tr-TR")} modeli. Renk, beden, fiyat ve stok seçeneklerini online inceleyin.`;
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
  const absoluteImages = product.images.map(src => src.startsWith("http") ? src : siteUrl + src);
  const variantSchemas = (product.variants || []).map(variant => ({
    "@type": "Product",
    name: [product.name, variant.color, variant.size].filter(Boolean).join(" - "),
    sku: variant.sku || undefined,
    color: variant.color || undefined,
    size: variant.size || undefined,
    image: absoluteImages,
    brand: { "@type": "Brand", name: "Elmas Triko" },
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/urun/${product.slug}`,
      priceCurrency: "TRY",
      price: variant.price ?? product.price ?? undefined,
      availability: variant.available > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": `${siteUrl}/#organization` },
    },
  }));

  const productSchema = product.variants?.length ? {
    "@context": "https://schema.org",
    "@type": "ProductGroup",
    "@id": `${siteUrl}/urun/${product.slug}#product`,
    name: product.name,
    description: product.description,
    url: `${siteUrl}/urun/${product.slug}`,
    image: absoluteImages,
    category: product.type,
    brand: { "@type": "Brand", name: "Elmas Triko" },
    productGroupID: product.slug,
    variesBy: ["https://schema.org/color", "https://schema.org/size"],
    hasVariant: variantSchemas,
    additionalProperty: [
      { "@type": "PropertyValue", name: "Cinsiyet", value: product.category === "kadin" ? "Kadın" : "Erkek" },
      { "@type": "PropertyValue", name: "Ürün Tipi", value: product.type },
    ],
  } : {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${siteUrl}/urun/${product.slug}#product`,
    name: product.name,
    description: product.description,
    url: `${siteUrl}/urun/${product.slug}`,
    image: absoluteImages,
    category: product.type,
    brand: { "@type": "Brand", name: "Elmas Triko" },
    color: product.colors.join(", "),
    size: product.sizes.join(", "),
    additionalProperty: [
      { "@type": "PropertyValue", name: "Cinsiyet", value: product.category === "kadin" ? "Kadın" : "Erkek" },
      { "@type": "PropertyValue", name: "Ürün Tipi", value: product.type },
    ],
    ...(product.price !== null ? {
      offers: {
        "@type": "Offer",
        url: `${siteUrl}/urun/${product.slug}`,
        priceCurrency: "TRY",
        price: product.price,
        seller: { "@id": `${siteUrl}/#organization` },
        itemCondition: "https://schema.org/NewCondition",
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
      <ProductDetailClient product={product}/>
    </main>
    <section className="product-seo-copy" aria-labelledby="product-seo-heading">
      <span>ELMAS TRİKO ÜRÜN DETAYI</span>
      <h2 id="product-seo-heading">{product.name} hakkında</h2>
      <p>{product.description} Bu {product.category === "kadin" ? "kadın" : "erkek"} {product.type.toLocaleLowerCase("tr-TR")} modeli {product.colors.join(", ")} renk seçenekleri ve {product.sizes.join(", ")} beden seçenekleriyle sunulur. Güncel stok ve fiyat bilgisini ürün seçim alanından kontrol edebilirsiniz.</p>
    </section>
    {related.length > 0 && <section className="related-section"><div className="related-head"><span>TAMAMLAYAN PARÇALAR</span><h2>Bunları da sevebilirsiniz.</h2></div><div className="catalog-grid">{related.map(p => <ProductCard key={p.slug} product={p}/>)}</div></section>}
    <StoreFooter/>
  </>;
}
