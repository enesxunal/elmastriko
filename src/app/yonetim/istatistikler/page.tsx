import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Boxes,
  CircleDollarSign,
  PackageCheck,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { requireAdmin } from "@/lib/admin";

type RangeKey = "7" | "30" | "90" | "365" | "all";

type OrderRow = {
  id: string;
  order_no: string;
  user_id: string | null;
  guest_email: string | null;
  status: string;
  payment_status: string;
  subtotal: number;
  shipping_fee: number;
  discount_total: number;
  grand_total: number;
  currency: string;
  created_at: string;
};

type OrderItemRow = {
  order_id: string;
  product_id: string | null;
  product_name: string;
  sku: string | null;
  color: string | null;
  size: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
};

type AddressRow = {
  order_id: string;
  kind: string;
  city: string;
  district: string;
};

type InventoryRow = {
  stock: number;
  reserved: number;
  product_variants:
    | {
        id: string;
        sku: string | null;
        products: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[] | null;
      }
    | {
        id: string;
        sku: string | null;
        products: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[] | null;
      }[]
    | null;
};

const rangeLabels: Record<RangeKey, string> = {
  "7": "7 Gün",
  "30": "30 Gün",
  "90": "90 Gün",
  "365": "1 Yıl",
  all: "Tüm Zamanlar",
};

const orderStatusLabels: Record<string, string> = {
  draft: "Taslak",
  awaiting_payment: "Ödeme Bekliyor",
  paid: "Ödendi",
  processing: "Hazırlanıyor",
  ready_to_ship: "Kargoya Hazır",
  shipped: "Kargoda",
  delivered: "Teslim Edildi",
  cancelled: "İptal",
  refunded: "İade",
  returned: "Geri Döndü",
};

const paymentStatusLabels: Record<string, string> = {
  pending: "Bekliyor",
  paid: "Ödendi",
  failed: "Başarısız",
  refunded: "İade",
  cancelled: "İptal",
};

function money(value: number) {
  return value.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " TL";
}

function pct(value: number) {
  return value.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 1 }) + "%";
}

function dayKey(date: string) {
  return new Date(date).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
}

function startForRange(range: RangeKey) {
  if (range === "all") return null;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (Number(range) - 1));
  return d;
}

function previousStart(range: RangeKey, currentStart: Date | null) {
  if (range === "all" || !currentStart) return null;
  const d = new Date(currentStart);
  d.setDate(d.getDate() - Number(range));
  return d;
}

function change(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export default async function StatisticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const requested = params.range as RangeKey | undefined;
  const range: RangeKey = requested && ["7", "30", "90", "365", "all"].includes(requested) ? requested : "30";

  const { supabase } = await requireAdmin();
  const currentStart = startForRange(range);
  const prevStart = previousStart(range, currentStart);
  const prevStartIso = prevStart?.toISOString();

  let orderQuery = supabase
    .from("orders")
    .select("id,order_no,user_id,guest_email,status,payment_status,subtotal,shipping_fee,discount_total,grand_total,currency,created_at")
    .order("created_at", { ascending: true });
  if (prevStartIso) orderQuery = orderQuery.gte("created_at", prevStartIso);

  const [ordersResult, itemsResult, addressesResult, profilesResult, inventoryResult, productsResult, favoritesResult] =
    await Promise.all([
      orderQuery,
      supabase.from("order_items").select("order_id,product_id,product_name,sku,color,size,unit_price,quantity,line_total"),
      supabase.from("order_addresses").select("order_id,kind,city,district").eq("kind", "shipping"),
      supabase.from("profiles").select("id,created_at,role").eq("role", "customer"),
      supabase.from("inventory").select("stock,reserved,product_variants(id,sku,products(id,name,slug))"),
      supabase.from("products").select("id,name,slug,is_active,gender,created_at"),
      supabase.from("favorites").select("user_id,product_id"),
    ]);

  const allOrders = (ordersResult.data || []) as OrderRow[];
  const items = (itemsResult.data || []) as OrderItemRow[];
  const addresses = (addressesResult.data || []) as AddressRow[];
  const inventory = (inventoryResult.data || []) as InventoryRow[];
  const profiles = profilesResult.data || [];
  const products = productsResult.data || [];
  const favorites = favoritesResult.data || [];

  const isCurrent = (date: string) => !currentStart || new Date(date) >= currentStart;
  const isPrevious = (date: string) =>
    Boolean(currentStart && prevStart && new Date(date) >= prevStart && new Date(date) < currentStart);

  const currentOrders = allOrders.filter((o) => isCurrent(o.created_at));
  const previousOrders = allOrders.filter((o) => isPrevious(o.created_at));
  const validPaid = (o: OrderRow) => o.payment_status === "paid" && !["cancelled", "refunded"].includes(o.status);

  const paidOrders = currentOrders.filter(validPaid);
  const previousPaid = previousOrders.filter(validPaid);
  const revenue = paidOrders.reduce((sum, o) => sum + Number(o.grand_total || 0), 0);
  const previousRevenue = previousPaid.reduce((sum, o) => sum + Number(o.grand_total || 0), 0);
  const avgOrder = paidOrders.length ? revenue / paidOrders.length : 0;
  const previousAvg = previousPaid.length
    ? previousPaid.reduce((sum, o) => sum + Number(o.grand_total || 0), 0) / previousPaid.length
    : 0;
  const paidRate = currentOrders.length ? (paidOrders.length / currentOrders.length) * 100 : 0;
  const previousPaidRate = previousOrders.length ? (previousPaid.length / previousOrders.length) * 100 : 0;

  const currentOrderIds = new Set(currentOrders.map((o) => o.id));
  const paidOrderIds = new Set(paidOrders.map((o) => o.id));
  const paidItems = items.filter((i) => paidOrderIds.has(i.order_id));

  const unitsSold = paidItems.reduce((sum, i) => sum + Number(i.quantity || 0), 0);
  const discountTotal = paidOrders.reduce((sum, o) => sum + Number(o.discount_total || 0), 0);
  const shippingRevenue = paidOrders.reduce((sum, o) => sum + Number(o.shipping_fee || 0), 0);

  const statusCounts = new Map<string, number>();
  const paymentCounts = new Map<string, number>();
  currentOrders.forEach((o) => {
    statusCounts.set(o.status, (statusCounts.get(o.status) || 0) + 1);
    paymentCounts.set(o.payment_status, (paymentCounts.get(o.payment_status) || 0) + 1);
  });

  const productMap = new Map<string, { name: string; qty: number; revenue: number; orders: Set<string> }>();
  paidItems.forEach((item) => {
    const key = item.product_id || item.product_name;
    const row = productMap.get(key) || { name: item.product_name, qty: 0, revenue: 0, orders: new Set<string>() };
    row.qty += Number(item.quantity || 0);
    row.revenue += Number(item.line_total || 0);
    row.orders.add(item.order_id);
    productMap.set(key, row);
  });
  const topProducts = [...productMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8);

  const favoriteMap = new Map<string, number>();
  favorites.forEach((f) => favoriteMap.set(f.product_id, (favoriteMap.get(f.product_id) || 0) + 1));
  const mostFavorited = products
    .map((p) => ({ ...p, favorites: favoriteMap.get(p.id) || 0 }))
    .sort((a, b) => b.favorites - a.favorites)
    .slice(0, 6);

  const shippingAddresses = addresses.filter((a) => currentOrderIds.has(a.order_id));
  const cityMap = new Map<string, number>();
  shippingAddresses.forEach((a) => cityMap.set(a.city, (cityMap.get(a.city) || 0) + 1));
  const topCities = [...cityMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  const customerOrderMap = new Map<string, number>();
  currentOrders.forEach((o) => {
    const key = o.user_id || o.guest_email?.toLowerCase();
    if (key) customerOrderMap.set(key, (customerOrderMap.get(key) || 0) + 1);
  });
  const uniqueCustomers = customerOrderMap.size;
  const repeatCustomers = [...customerOrderMap.values()].filter((count) => count > 1).length;
  const repeatRate = uniqueCustomers ? (repeatCustomers / uniqueCustomers) * 100 : 0;
  const guestOrders = currentOrders.filter((o) => !o.user_id).length;
  const memberOrders = currentOrders.length - guestOrders;

  const newCustomers = profiles.filter((p) => isCurrent(p.created_at)).length;

  const stockStats = inventory.reduce(
    (acc, row) => {
      const available = Math.max(0, Number(row.stock || 0) - Number(row.reserved || 0));
      acc.units += available;
      if (available === 0) acc.out += 1;
      else if (available <= 5) acc.low += 1;
      return acc;
    },
    { units: 0, out: 0, low: 0 }
  );

  const dailyMap = new Map<string, { date: string; revenue: number; orders: number }>();
  currentOrders.forEach((o) => {
    const key = new Date(o.created_at).toISOString().slice(0, 10);
    const existing = dailyMap.get(key) || { date: o.created_at, revenue: 0, orders: 0 };
    existing.orders += 1;
    if (validPaid(o)) existing.revenue += Number(o.grand_total || 0);
    dailyMap.set(key, existing);
  });

  if (range !== "all" && currentStart) {
    const days = Number(range);
    for (let i = 0; i < days; i++) {
      const d = new Date(currentStart);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      if (!dailyMap.has(key)) dailyMap.set(key, { date: d.toISOString(), revenue: 0, orders: 0 });
    }
  }

  const daily = [...dailyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, value]) => value);
  const chartDaily = daily.length > 31 ? daily.filter((_, i) => i % Math.ceil(daily.length / 30) === 0 || i === daily.length - 1) : daily;
  const maxDailyRevenue = Math.max(1, ...chartDaily.map((d) => d.revenue));

  const revenueChange = change(revenue, previousRevenue);
  const orderChange = change(currentOrders.length, previousOrders.length);
  const avgChange = change(avgOrder, previousAvg);
  const paidRateChange = change(paidRate, previousPaidRate);

  const kpis = [
    { label: "Net Ciro", value: money(revenue), change: revenueChange, icon: CircleDollarSign, note: "Ödenmiş, iptal/iade hariç" },
    { label: "Sipariş", value: currentOrders.length.toLocaleString("tr-TR"), change: orderChange, icon: ShoppingBag, note: "Oluşturulan toplam sipariş" },
    { label: "Ort. Sepet", value: money(avgOrder), change: avgChange, icon: TrendingUp, note: "Ödenmiş sipariş ortalaması" },
    { label: "Ödeme Başarı", value: pct(paidRate), change: paidRateChange, icon: PackageCheck, note: "Siparişlerin ödeme oranı" },
  ];

  return (
    <main className="admin-page analytics-page">
      <section className="admin-page-head analytics-head">
        <div>
          <span>İSTATİSTİKLER</span>
          <h1>Mağaza performansı</h1>
          <p>Satış, müşteri, ürün, stok ve sipariş hareketlerini tek merkezden izleyin.</p>
        </div>
        <nav className="analytics-ranges" aria-label="İstatistik tarih aralığı">
          {(Object.keys(rangeLabels) as RangeKey[]).map((key) => (
            <Link key={key} href={"/yonetim/istatistikler?range=" + key} className={range === key ? "active" : ""}>
              {rangeLabels[key]}
            </Link>
          ))}
        </nav>
      </section>

      <section className="analytics-kpis">
        {kpis.map(({ label, value, change: delta, icon: Icon, note }) => (
          <article key={label}>
            <div className="analytics-kpi-top">
              <span className="analytics-icon"><Icon size={18} /></span>
              {range !== "all" && (
                <span className={"analytics-delta " + (delta >= 0 ? "up" : "down")}>
                  {delta >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  {pct(Math.abs(delta))}
                </span>
              )}
            </div>
            <small>{label}</small>
            <strong>{value}</strong>
            <p>{note}</p>
          </article>
        ))}
      </section>

      <section className="analytics-grid-main">
        <article className="admin-section analytics-chart-card">
          <div className="admin-section-head">
            <div><span>SATIŞ TRENDİ</span><h2>Ciro & sipariş hareketi</h2></div>
            <div className="analytics-chart-total"><small>Dönem cirosu</small><b>{money(revenue)}</b></div>
          </div>
          {chartDaily.length ? (
            <>
              <div className="analytics-chart">
                {chartDaily.map((day, index) => (
                  <div className="analytics-bar-cell" key={day.date + index}>
                    <div className="analytics-bar-track" title={dayKey(day.date) + " • " + money(day.revenue) + " • " + day.orders + " sipariş"}>
                      <i style={{ height: Math.max(day.revenue > 0 ? 8 : 2, (day.revenue / maxDailyRevenue) * 100) + "%" }} />
                    </div>
                    <span>{index % Math.max(1, Math.ceil(chartDaily.length / 7)) === 0 || index === chartDaily.length - 1 ? dayKey(day.date) : ""}</span>
                  </div>
                ))}
              </div>
              <div className="analytics-chart-foot">
                <span><i className="legend-dot" /> Günlük ödenmiş ciro</span>
                <b>{unitsSold} ürün adedi satıldı</b>
              </div>
            </>
          ) : (
            <div className="admin-empty-state"><BarChart3 size={24}/><b>Henüz veri yok</b><span>Siparişler geldikçe satış grafiği oluşacak.</span></div>
          )}
        </article>

        <article className="admin-section analytics-summary-card">
          <div className="admin-section-head"><div><span>DÖNEM ÖZETİ</span><h2>Satış bileşenleri</h2></div></div>
          <div className="analytics-summary-list">
            <div><span>Ödenmiş sipariş</span><b>{paidOrders.length}</b></div>
            <div><span>Satılan ürün</span><b>{unitsSold} adet</b></div>
            <div><span>Kargo geliri</span><b>{money(shippingRevenue)}</b></div>
            <div><span>İndirim toplamı</span><b>{money(discountTotal)}</b></div>
            <div><span>Kayıtlı müşteri siparişi</span><b>{memberOrders}</b></div>
            <div><span>Misafir siparişi</span><b>{guestOrders}</b></div>
          </div>
        </article>
      </section>

      <section className="analytics-grid-equal">
        <article className="admin-section">
          <div className="admin-section-head"><div><span>ÜRÜN PERFORMANSI</span><h2>En çok kazandıran ürünler</h2></div><Link href="/yonetim/urunler">Ürünler →</Link></div>
          <div className="analytics-ranking">
            {topProducts.length ? topProducts.map((product, index) => {
              const max = topProducts[0]?.revenue || 1;
              return <div className="analytics-rank-row" key={product.name}>
                <span className="rank-no">{String(index + 1).padStart(2, "0")}</span>
                <div className="rank-main">
                  <div><b>{product.name}</b><small>{product.qty} adet • {product.orders.size} sipariş</small></div>
                  <div className="rank-bar"><i style={{width: (product.revenue / max) * 100 + "%"}}/></div>
                </div>
                <strong>{money(product.revenue)}</strong>
              </div>;
            }) : <div className="admin-empty-state compact"><Boxes size={20}/><span>Henüz ürün satışı yok.</span></div>}
          </div>
        </article>

        <article className="admin-section">
          <div className="admin-section-head"><div><span>SİPARİŞ SAĞLIĞI</span><h2>Durum dağılımı</h2></div><Link href="/yonetim/siparisler">Siparişler →</Link></div>
          <div className="analytics-status-list">
            {[...statusCounts.entries()].sort((a,b)=>b[1]-a[1]).map(([status, count]) => (
              <div key={status}>
                <span>{orderStatusLabels[status] || status}</span>
                <div><i style={{width: currentOrders.length ? (count/currentOrders.length)*100+"%" : "0%"}}/></div>
                <b>{count}</b>
              </div>
            ))}
            {!statusCounts.size && <div className="admin-empty-state compact"><ShoppingBag size={20}/><span>Henüz sipariş yok.</span></div>}
          </div>
          <div className="analytics-payment-split">
            {[...paymentCounts.entries()].sort((a,b)=>b[1]-a[1]).map(([status,count])=><div key={status}><span>{paymentStatusLabels[status]||status}</span><b>{count}</b></div>)}
          </div>
        </article>
      </section>

      <section className="analytics-grid-thirds">
        <article className="admin-section">
          <div className="admin-section-head"><div><span>MÜŞTERİ</span><h2>Müşteri davranışı</h2></div><Link href="/yonetim/kullanicilar">Müşteriler →</Link></div>
          <div className="analytics-big-stat"><strong>{uniqueCustomers}</strong><span>benzersiz müşteri</span></div>
          <div className="analytics-summary-list compact-list">
            <div><span>Yeni kayıt</span><b>{newCustomers}</b></div>
            <div><span>Tekrar alışveriş</span><b>{repeatCustomers}</b></div>
            <div><span>Tekrar müşteri oranı</span><b>{pct(repeatRate)}</b></div>
            <div><span>Toplam kayıtlı hesap</span><b>{profiles.length}</b></div>
          </div>
        </article>

        <article className="admin-section">
          <div className="admin-section-head"><div><span>LOKASYON</span><h2>En çok sipariş veren şehirler</h2></div></div>
          <div className="analytics-city-list">
            {topCities.length ? topCities.map(([city,count],index)=><div key={city}><span>{index+1}</span><b>{city}</b><small>{count} sipariş</small></div>) : <div className="admin-empty-state compact"><span>Henüz adres verisi yok.</span></div>}
          </div>
        </article>

        <article className="admin-section">
          <div className="admin-section-head"><div><span>STOK</span><h2>Envanter sağlığı</h2></div><Link href="/yonetim/stok">Stok →</Link></div>
          <div className="analytics-stock-grid">
            <div><strong>{stockStats.units}</strong><span>Satılabilir adet</span></div>
            <div><strong>{stockStats.low}</strong><span>Düşük stok varyantı</span></div>
            <div><strong>{stockStats.out}</strong><span>Tükenen varyant</span></div>
            <div><strong>{products.filter(p=>p.is_active).length}</strong><span>Aktif ürün</span></div>
          </div>
        </article>
      </section>

      <section className="analytics-grid-equal">
        <article className="admin-section">
          <div className="admin-section-head"><div><span>İLGİ</span><h2>En çok favorilenen ürünler</h2></div></div>
          <div className="analytics-ranking compact-ranking">
            {mostFavorited.some(p=>p.favorites>0) ? mostFavorited.filter(p=>p.favorites>0).map((product,index)=><div className="analytics-rank-row" key={product.id}><span className="rank-no">{String(index+1).padStart(2,"0")}</span><div className="rank-main"><b>{product.name}</b></div><strong>{product.favorites} favori</strong></div>) : <div className="admin-empty-state compact"><span>Henüz favori verisi yok.</span></div>}
          </div>
        </article>

        <article className="admin-section">
          <div className="admin-section-head"><div><span>KATALOG</span><h2>Ürün dağılımı</h2></div></div>
          <div className="analytics-catalog-split">
            <div><span>Kadın</span><strong>{products.filter(p=>p.gender==="kadin").length}</strong></div>
            <div><span>Erkek</span><strong>{products.filter(p=>p.gender==="erkek").length}</strong></div>
            <div><span>Aktif</span><strong>{products.filter(p=>p.is_active).length}</strong></div>
            <div><span>Pasif</span><strong>{products.filter(p=>!p.is_active).length}</strong></div>
          </div>
        </article>
      </section>
    </main>
  );
}
