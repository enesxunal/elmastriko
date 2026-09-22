"use client";

import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import Link from "next/link";
import { FREE_SHIPPING_THRESHOLD, formatPrice } from "@/lib/catalog";
import { getShippingQuote } from "@/lib/integrations/shipping";
import { useStore } from "@/components/StoreProvider";
import { useCartCatalog } from "@/hooks/useCartCatalog";
import { Minus, Plus, Trash2 } from "lucide-react";

export default function CartPage() {
  const { cart, removeFromCart, setQty } = useStore();
  const { lines, loading } = useCartCatalog(cart);
  const hasUnknownPrice = lines.some(x => x.product.price === null);
  const subtotal = lines.reduce((sum, x) => sum + ((x.product.price || 0) * x.line.qty), 0);
  const quote = getShippingQuote(subtotal);
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  return <><StoreHeader/><main className="cart-page">
    <div className="simple-title"><span>ALIŞVERİŞ</span><h1>Sepet</h1></div>
    <div className="cart-layout">
      <section className="cart-items">
        <div className="shipping-progress">
          <div><span style={{width: Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100) + "%"}}/></div>
          <p>{subtotal === 0 ? "5.000 TL ve üzeri siparişlerde kargo ücretsiz." : quote.free ? "Ücretsiz kargo kazandınız." : "Ücretsiz kargo için " + remaining.toLocaleString("tr-TR") + " TL daha ekleyin."}</p>
        </div>
        {loading && cart.length > 0 ? <div className="cart-loading">Sepet güncelleniyor...</div> :
        lines.length === 0 ? <div className="empty-cart"><span>SEPETİNİZ BOŞ</span><h2>Henüz ürün eklemediniz.</h2><Link href="/kadin">Alışverişe başla →</Link></div> :
        lines.map(({ line, product }) => <div className="cart-line" key={line.slug + line.size + line.color}>
          <Link href={"/urun/" + product.slug}><img src={product.image} alt={product.name}/></Link>
          <div className="cart-line-main"><Link href={"/urun/" + product.slug}><h3>{product.name}</h3></Link><p>{line.size && "Beden: " + line.size}{line.color && " · Renk: " + line.color}</p><div className="cart-qty"><button onClick={() => setQty(line.slug, line.qty - 1)}><Minus size={14}/></button><span>{line.qty}</span><button onClick={() => setQty(line.slug, line.qty + 1)}><Plus size={14}/></button></div></div>
          <div className="cart-line-side"><strong>{formatPrice(product.price)}</strong><button onClick={() => removeFromCart(line.slug)} aria-label="Kaldır"><Trash2 size={16}/></button></div>
        </div>)}
      </section>
      <aside className="cart-summary"><h2>Sipariş Özeti</h2><div><span>Ara toplam</span><b>{hasUnknownPrice ? "Fiyat listesi bekleniyor" : formatPrice(subtotal)}</b></div><div><span>Kargo</span><b>{quote.free ? "Ücretsiz" : hasUnknownPrice ? "Hesaplanacak" : formatPrice(quote.fee)}</b></div><div className="summary-total"><span>Toplam</span><b>{hasUnknownPrice ? "—" : formatPrice(subtotal + quote.fee)}</b></div>{lines.length > 0 ? <Link href="/checkout">Alışverişi Tamamla</Link> : <span className="disabled-checkout">Alışverişi Tamamla</span>}<small>Ödeme sağlayıcısı henüz seçilmedi. Checkout ve sipariş akışı sağlayıcıdan bağımsız hazır.</small></aside>
    </div>
  </main><StoreFooter/></>;
}
