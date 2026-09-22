import Link from "next/link";
import { Product, formatPrice } from "@/lib/catalog";
import FavoriteButton from "./FavoriteButton";

export default function ProductCard({ product }: { product: Product }) {
  return <article className="catalog-card">
    <Link href={"/urun/" + product.slug} className="catalog-card-image">
      <img src={product.image} alt={product.name}/>
      {product.badge && <span>{product.badge}</span>}
    </Link>
    <div className="catalog-card-info">
      <div><Link href={"/urun/" + product.slug}><h3>{product.name}</h3></Link><p>{product.colors[0]}</p></div>
      <div className="catalog-price"><strong>{formatPrice(product.price)}</strong><FavoriteButton slug={product.slug}/></div>
    </div>
  </article>;
}
