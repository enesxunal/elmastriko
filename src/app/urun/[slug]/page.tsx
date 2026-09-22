import { notFound } from "next/navigation";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { formatPrice, products } from "@/lib/catalog";
import Link from "next/link";
import { Heart, Minus, Plus } from "lucide-react";

export function generateStaticParams() { return products.map(p => ({ slug: p.slug })); }

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = products.find(p => p.slug === slug);
  if (!product) notFound();
  return <><StoreHeader/><main className="product-page">
    <section className="product-gallery">{product.images.map((src, i) => <img src={src} alt={product.name + " " + (i+1)} key={src}/>)}</section>
    <aside className="product-detail">
      <span className="product-category">{product.category === "kadin" ? "Kadın" : "Erkek"} / {product.type}</span>
      <h1>{product.name}</h1>
      <div className="product-main-price">{formatPrice(product.price)}</div>
      <p className="product-desc">{product.description}</p>
      <div className="product-option"><label>Renk</label><div className="option-pills">{product.colors.map(c => <button key={c}>{c}</button>)}</div></div>
      <div className="product-option"><label>Beden</label><div className="size-pills">{product.sizes.map(s => <button key={s}>{s}</button>)}</div></div>
      <div className="product-buy-row"><div className="qty"><button><Minus size={15}/></button><span>1</span><button><Plus size={15}/></button></div><Link className="add-cart" href="/sepet">Sepete Ekle</Link><button className="fav-btn"><Heart size={19}/></button></div>
      <div className="product-assurances"><div><b>5.000 TL üzeri ücretsiz kargo</b><span>BasitKargo ile gönderim</span></div><div><b>Kolay iade</b><span>Standart iade süreci</span></div></div>
    </aside>
  </main><StoreFooter/></>;
}
