"use client";

import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import Link from "next/link";
import { formatPrice } from "@/lib/catalog";
import { useStore } from "@/components/StoreProvider";
import { useCartCatalog } from "@/hooks/useCartCatalog";
import { useCommerceSettings } from "@/hooks/useCommerceSettings";
import { Minus, Plus, Trash2 } from "lucide-react";

export default function CartPage() {
  const { cart, removeFromCart, setQty } = useStore();
  const { lines, loading } = useCartCatalog(cart);
  const { freeShippingThreshold, shippingFee, loading: commerceLoading } = useCommerceSettings();
  const hasUnknownPrice = lines.some(x => x.unitPrice === null);
  const subtotal = lines.reduce((sum, x) => sum + ((x.unitPrice || 0) * x.line.qty), 0);
  const freeShipping = subtotal >= freeShippingThreshold;
  const effectiveShippingFee = freeShipping ? 0 : shippingFee;
  const remaining = Math.max(0, freeShippingThreshold - subtotal);
  const total = effectiveShippingFee === null ? null : subtotal + effectiveShippingFee;

  return <><StoreHeader/><main className="cart-page">
    <div className="simple-title"><span>ALIŞVERİŞ</span><h1>Sepet</h1></div>
    <div className="cart-layout">
      <section className="cart-items">
        <div className="shipping-progress">
          <div><span style={{width: Math.min(100, (subtotal / freeShippingThreshold) * 100) + "%"}}/></div>
          <p>{subtotal === 0 ? freeShippingThreshold.toLocaleString("tr-TR") + " TL ve üzeri siparişlerde kargo ücretsiz." : freeShipping ? "Ücretsiz kargo kazandınız." : "Ücretsiz kargo için " + remaining.toLocaleString("tr-TR") + " TL daha ekleyin."}</p>
        </div>
        {loading && cart.length > 0 ? <div className="cart-loading">Sepet güncelleniyor...</div> :
        lines.length === 0 ? <div className="empty-cart"><span>SEPETİNİZ BOŞ</span><h2>Henüz ürün eklemediniz.</h2><Link href="/kadin">Alışverişe başla →</Link></div> :
        lines.map(({ line, product, unitPrice }) => <div className="cart-line" key={line.slug + line.size + line.color}>
          <Link href={"/urun/" + product.slug}><img src={product.image} alt={product.name}/></Link>
          <div className="cart-line-main"><Link href={"/urun/" + product.slug}><h3>{product.name}</h3></Link><p>{line.size && "Beden: " + line.size}{line.color && " · Renk: " + line.color}</p><div className="cart-qty"><button onClick={() => setQty(line, line.qty - 1)}><Minus size={14}/></button><span>{line.qty}</span><button onClick={() => setQty(line, line.qty + 1)}><Plus size={14}/></button></div></div>
          <div className="cart-line-side"><strong>{formatPrice(unitPrice)}</strong><button onClick={() => removeFromCart(line)} aria-label="Kaldır"><Trash2 size={16}/></button></div>
        </div>)}
      </section>
      <aside className="cart-summary"><h2>Sipariş Özeti</h2><div><span>Ara toplam</span><b>{hasUnknownPrice ? "Fiyat listesi bekleniyor" : formatPrice(subtotal)}</b></div><div><span>Kargo</span><b>{commerceLoading ? "Hesaplanıyor" : freeShipping ? "Ücretsiz" : hasUnknownPrice ? "Hesaplanacak" : effectiveShippingFee === null ? "Kargo tutarı onayda" : formatPrice(effectiveShippingFee)}</b></div><div className="summary-total"><span>Toplam</span><b>{hasUnknownPrice || total === null ? "—" : formatPrice(total)}</b></div>{lines.length > 0 && total !== null ? <Link href="/checkout">Alışverişi Tamamla</Link> : <span className="disabled-checkout">Alışverişi Tamamla</span>}<small>Ödeme Tosla İşim Sanal POS üzerinden 3D Secure ile güvenli şekilde tamamlanır.</small></aside>
    </div>
  </main><StoreFooter/></>;
}
