import Link from "next/link";
import { redirect } from "next/navigation";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import AccountShell from "@/components/AccountShell";
import { createClient } from "@/lib/supabase/server";

const orderStatusLabels: Record<string, string> = {
  draft: "Taslak",
  awaiting_payment: "Ödeme bekliyor",
  paid: "Ödeme alındı",
  invoice_pending: "Hazırlanıyor",
  ready_to_ship: "Kargoya hazır",
  shipped: "Kargoda",
  delivered: "Teslim edildi",
  cancelled: "İptal edildi",
  refunded: "İade edildi",
};

function orderStep(status: string) {
  if (status === "delivered") return 4;
  if (status === "shipped") return 3;
  if (status === "ready_to_ship") return 2;
  if (["paid", "invoice_pending"].includes(status)) return 1;
  return 0;
}

export default async function AccountOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/hesabim");

  const [{ data: profile }, { data: orders }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase.from("orders").select("id, order_no, status, grand_total, currency, created_at").order("created_at", { ascending: false }),
  ]);

  const orderIds = (orders || []).map(order => order.id);
  const { data: orderItems } = orderIds.length
    ? await supabase.from("order_items").select("order_id,product_id,product_name,color,size,quantity").in("order_id", orderIds)
    : { data: [] };
  const productIds = Array.from(new Set((orderItems || []).map(item => item.product_id).filter(Boolean))) as string[];
  const { data: productImages } = productIds.length
    ? await supabase.from("product_images").select("product_id,url,sort_order").in("product_id", productIds).order("sort_order", { ascending: true })
    : { data: [] };

  const imageByProduct = new Map<string,string>();
  for (const image of productImages || []) if (image.product_id && !imageByProduct.has(image.product_id)) imageByProduct.set(image.product_id, image.url);
  const itemsByOrder = new Map<string, typeof orderItems>();
  for (const item of orderItems || []) {
    const list = itemsByOrder.get(item.order_id) || [];
    list.push(item);
    itemsByOrder.set(item.order_id, list);
  }

  return <><StoreHeader/><AccountShell name={profile?.full_name || user.email || "Hesabım"} email={user.email || ""} current="/hesabim/siparisler">
    <div className="account-section-head"><span>SİPARİŞLER</span><h1>Siparişlerim</h1><p>Geçmiş ve aktif siparişlerinizi tek ekrandan takip edin.</p></div>
    <div className="account-panel account-orders account-page-card">
      {orders && orders.length > 0 ? orders.map(order => {
        const orderProducts = itemsByOrder.get(order.id) || [];
        const firstProduct = orderProducts[0];
        const thumb = firstProduct?.product_id ? imageByProduct.get(firstProduct.product_id) : null;
        const step = orderStep(order.status);
        const terminal = ["cancelled","refunded"].includes(order.status);
        return <Link className="order-row order-history-card" href={"/hesabim/siparis/" + order.id} key={order.id}>
          <div className="order-history-product">
            <div className="order-history-thumb">{thumb ? <img src={thumb} alt={firstProduct?.product_name || "Sipariş ürünü"}/> : <span>ET</span>}</div>
            <div><b>{firstProduct?.product_name || order.order_no}</b><small>{orderProducts.length > 1 ? "+" + (orderProducts.length - 1) + " ürün daha" : firstProduct ? firstProduct.quantity + " adet" + (firstProduct.size ? " · " + firstProduct.size : "") + (firstProduct.color ? " · " + firstProduct.color : "") : new Date(order.created_at).toLocaleDateString("tr-TR")}</small><small>{order.order_no} · {new Date(order.created_at).toLocaleDateString("tr-TR")}</small></div>
          </div>
          <div className="order-history-meta"><span className={terminal ? "order-status danger" : "order-status"}>{orderStatusLabels[order.status] || order.status}</span><b>{Number(order.grand_total).toLocaleString("tr-TR")} {order.currency}</b></div>
          {!terminal && <div className="order-mini-progress">{["Sipariş","Ödeme","Hazırlık","Kargo","Teslim"].map((label,index)=><span key={label} className={index <= step ? "active" : ""}><i/>{label}</span>)}</div>}
        </Link>;
      }) : <div className="account-empty-state"><b>Henüz siparişiniz yok.</b><Link href="/yeni-gelenler">Alışverişe başla →</Link></div>}
    </div>
  </AccountShell><StoreFooter/></>;
}
