import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Boxes,
  CircleDollarSign,
  Clock3,
  Eye,
  Globe2,
  MonitorSmartphone,
  MousePointerClick,
  PackageCheck,
  Radio,
  ShoppingBag,
  TrendingUp,
  UsersRound,
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

type AnalyticsSessionRow = {
  id: string;
  visitor_id: string;
  started_at: string;
  last_seen_at: string;
  duration_seconds: number;
  pageviews: number;
  entry_path: string;
  exit_path: string;
  referrer_host: string | null;
  source: string;
  medium: string | null;
  campaign: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
};

type AnalyticsPageviewRow = {
  id: string;
  session_id: string;
  visitor_id: string;
  path: string;
  page_title: string | null;
  entered_at: string;
  duration_seconds: number;
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

function duration(value: number) {
  const seconds = Math.max(0, Math.round(value || 0));
  if (seconds < 60) return seconds + " sn";
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes < 60) return minutes + " dk " + rest + " sn";
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return hours + " sa " + restMinutes + " dk";
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

  const [
    ordersResult,
    itemsResult,
    addressesResult,
    profilesResult,
    inventoryResult,
    productsResult,
    favoritesResult,
    analyticsSessionsResult,
    analyticsPageviewsResult,
    activeNowResult,
  ] = await Promise.all([
    orderQuery,
    supabase.from("order_items").select("order_id,product_id,product_name,sku,color,size,unit_price,quantity,line_total"),
    supabase.from("order_addresses").select("order_id,kind,city,district").eq("kind", "shipping"),
    supabase.from("profiles").select("id,created_at,role").eq("role", "customer"),
    supabase.from("inventory").select("stock,reserved,product_variants(id,sku,products(id,name,slug))"),
    supabase.from("products").select("id,name,slug,is_active,gender,created_at"),
    supabase.from("favorites").select("user_id,product_id"),
    supabase.from("analytics_sessions").select("id,visitor_id,started_at,last_seen_at,duration_seconds,pageviews,entry_path,exit_path,referrer_host,source,medium,campaign,device_type,browser,os").order("started_at",{ascending:false}).limit(5000),
    supabase.from("analytics_pageviews").select("id,session_id,visitor_id,path,page_title,entered_at,duration_seconds").order("entered_at",{ascending:false}).limit(10000),
    supabase.rpc("analytics_active_now"),
  ]);

  const allOrders = (ordersResult.data || []) as OrderRow[];
  const items = (itemsResult.data || []) as OrderItemRow[];
  const addresses = (addressesResult.data || []) as AddressRow[];
  const inventory = (inventoryResult.data || []) as InventoryRow[];
  const profiles = profilesResult.data || [];
  const products = productsResult.data || [];
  const favorites = favoritesResult.data || [];
  const allAnalyticsSessions = (analyticsSessionsResult.data || []) as AnalyticsSessionRow[];
  const allAnalyticsPageviews = (analyticsPageviewsResult.data || []) as AnalyticsPageviewRow[];
  const activeNow = Number(activeNowResult.data || 0);
  const analyticsReady = !analyticsSessionsResult.error && !analyticsPageviewsResult.error && !activeNowResult.error;

  const isCurrent = (date: string) => !currentStart || new Date(date) >= currentStart;
  const isPrevious = (date: string) =>
    Boolean(currentStart && prevStart && new Date(date) >= prevStart && new Date(date) < currentStart);

  const currentSessions = allAnalyticsSessions.filter((s) => isCurrent(s.started_at));
  const previousSessions = allAnalyticsSessions.filter((s) => isPrevious(s.started_at));
  const currentSessionIds = new Set(currentSessions.map((s) => s.id));
  const currentPageviews = allAnalyticsPageviews.filter((p) => currentSessionIds.has(p.session_id) && isCurrent(p.entered_at));
  const uniqueVisitors = new Set(currentSessions.map((s) => s.visitor_id)).size;
  const previousUniqueVisitors = new Set(previousSessions.map((s) => s.visitor_id)).size;
  const avgSessionDuration = currentSessions.length
    ? currentSessions.reduce((sum, s) => sum + Number(s.duration_seconds || 0), 0) / currentSessions.length
    : 0;
  const previousAvgSessionDuration = previousSessions.length
    ? previousSessions.reduce((sum, s) => sum + Number(s.duration_seconds || 0), 0) / previousSessions.length
    : 0;
  const avgPageDuration = currentPageviews.length
    ? currentPageviews.reduce((sum, p) => sum + Number(p.duration_seconds || 0), 0) / currentPageviews.length
    : 0;
  const pagesPerSession = currentSessions.length ? currentPageviews.length / currentSessions.length : 0;
  const previousSessionIds = new Set(previousSessions.map((s) => s.id));
  const previousPagesPerSession = previousSessions.length
    ? allAnalyticsPageviews.filter((p) => previousSessionIds.has(p.session_id)).length / previousSessions.length
    : 0;
  const singlePageSessions = currentSessions.filter((s) => Number(s.pageviews || 0) <= 1).length;
  const singlePageRate = currentSessions.length ? (singlePageSessions / currentSessions.length) * 100 : 0;

  const pageMap = new Map<string, { views: number; sessions: Set<string>; seconds: number }>();
  currentPageviews.forEach((p) => {
    const row = pageMap.get(p.path) || { views: 0, sessions: new Set<string>(), seconds: 0 };
    row.views += 1;
    row.sessions.add(p.session_id);
    row.seconds += Number(p.duration_seconds || 0);
    pageMap.set(p.path, row);
  });
  const topPages = [...pageMap.entries()]
    .map(([path, row]) => ({ path, views: row.views, sessions: row.sessions.size, avgSeconds: row.views ? row.seconds / row.views : 0 }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  const landingMap = new Map<string, { sessions: number; seconds: number }>();
  currentSessions.forEach((s) => {
    const row = landingMap.get(s.entry_path) || { sessions: 0, seconds: 0 };
    row.sessions += 1;
    row.seconds += Number(s.duration_seconds || 0);
    landingMap.set(s.entry_path, row);
  });
  const landingPages = [...landingMap.entries()]
    .map(([path, row]) => ({ path, sessions: row.sessions, avgSeconds: row.sessions ? row.seconds / row.sessions : 0 }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 8);

  const sourceMap = new Map<string, number>();
  const referrerMap = new Map<string, number>();
  const deviceMap = new Map<string, number>();
  const browserMap = new Map<string, number>();
  currentSessions.forEach((s) => {
    sourceMap.set(s.source || "Direct", (sourceMap.get(s.source || "Direct") || 0) + 1);
    const referrer = s.referrer_host || (s.source === "Direct" ? "Doğrudan" : s.source || "Bilinmiyor");
    referrerMap.set(referrer, (referrerMap.get(referrer) || 0) + 1);
    deviceMap.set(s.device_type || "Bilinmiyor", (deviceMap.get(s.device_type || "Bilinmiyor") || 0) + 1);
    browserMap.set(s.browser || "Bilinmiyor", (browserMap.get(s.browser || "Bilinmiyor") || 0) + 1);
  });
  const trafficSources = [...sourceMap.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8);
  const topReferrers = [...referrerMap.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8);
  const devices = [...deviceMap.entries()].sort((a,b)=>b[1]-a[1]);
  const browsers = [...browserMap.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6);
  const recentSessions = currentSessions.slice(0, 12);

  const trafficDailyMap = new Map<string, { date: string; sessions: number; visitors: Set<string>; views: number }>();
  currentSessions.forEach((s) => {
    const key = new Date(s.started_at).toISOString().slice(0,10);
    const row = trafficDailyMap.get(key) || { date: s.started_at, sessions: 0, visitors: new Set<string>(), views: 0 };
    row.sessions += 1;
    row.visitors.add(s.visitor_id);
    trafficDailyMap.set(key,row);
  });
  currentPageviews.forEach((p) => {
    const key = new Date(p.entered_at).toISOString().slice(0,10);
    const row = trafficDailyMap.get(key) || { date: p.entered_at, sessions: 0, visitors: new Set<string>(), views: 0 };
    row.views += 1;
    trafficDailyMap.set(key,row);
  });
  if (range !== "all" && currentStart) {
    for (let i=0;i<Number(range);i++) {
      const d = new Date(currentStart);
      d.setDate(d.getDate()+i);
      const key = d.toISOString().slice(0,10);
      if (!trafficDailyMap.has(key)) trafficDailyMap.set(key,{date:d.toISOString(),sessions:0,visitors:new Set<string>(),views:0});
    }
  }
  const trafficDaily = [...trafficDailyMap.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([,v])=>v);
  const chartTrafficDaily = trafficDaily.length > 31
    ? trafficDaily.filter((_,i)=>i % Math.ceil(trafficDaily.length/30) === 0 || i === trafficDaily.length-1)
    : trafficDaily;
  const maxTrafficViews = Math.max(1,...chartTrafficDaily.map((d)=>d.views));

  const visitorChange = change(uniqueVisitors, previousUniqueVisitors);
  const sessionDurationChange = change(avgSessionDuration, previousAvgSessionDuration);
  const pagesPerSessionChange = change(pagesPerSession, previousPagesPerSession);

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

  const trafficKpis = [
    { label: "Benzersiz Ziyaretçi", value: uniqueVisitors.toLocaleString("tr-TR"), change: visitorChange, icon: UsersRound, note: "Aynı cihaz tarayıcısı tek ziyaretçi sayılır" },
    { label: "Oturum", value: currentSessions.length.toLocaleString("tr-TR"), change: change(currentSessions.length, previousSessions.length), icon: Globe2, note: "30 dk hareketsizlik sonrası yeni oturum" },
    { label: "Ort. Site Süresi", value: duration(avgSessionDuration), change: sessionDurationChange, icon: Clock3, note: "Aktif geçirilen görünür süre" },
    { label: "Sayfa / Oturum", value: pagesPerSession.toLocaleString("tr-TR",{minimumFractionDigits:1,maximumFractionDigits:1}), change: pagesPerSessionChange, icon: MousePointerClick, note: currentPageviews.length.toLocaleString("tr-TR") + " toplam sayfa görüntüleme" },
  ];

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

      <section className="analytics-traffic-title">
        <div><span>ZİYARETÇİ ANALİTİĞİ</span><h2>Trafik ve davranış</h2><p>Ziyaretçinin nereden geldiğini, hangi sayfalara girdiğini ve aktif olarak ne kadar süre kaldığını gösterir.</p></div>
        <div className="analytics-live"><Radio size={14}/><b>{activeNow}</b><span>son 5 dk aktif</span></div>
      </section>

      {!analyticsReady && (
        <div className="admin-alert error">Ziyaretçi analitiği veritabanı henüz aktif değil. Analytics migration çalıştırıldıktan sonra bu alan otomatik veri toplamaya başlayacak.</div>
      )}

      <section className="analytics-kpis traffic-kpis">
        {trafficKpis.map(({ label, value, change: delta, icon: Icon, note }) => (
          <article key={label}>
            <div className="analytics-kpi-top">
              <span className="analytics-icon"><Icon size={18}/></span>
              {range !== "all" && (
                <span className={"analytics-delta " + (delta >= 0 ? "up" : "down")}>
                  {delta >= 0 ? <ArrowUpRight size={13}/> : <ArrowDownRight size={13}/>}
                  {pct(Math.abs(delta))}
                </span>
              )}
            </div>
            <small>{label}</small><strong>{value}</strong><p>{note}</p>
          </article>
        ))}
      </section>

      <section className="analytics-grid-main">
        <article className="admin-section analytics-chart-card">
          <div className="admin-section-head">
            <div><span>TRAFİK TRENDİ</span><h2>Ziyaret ve sayfa görüntüleme</h2></div>
            <div className="analytics-chart-total"><small>Ort. sayfa süresi</small><b>{duration(avgPageDuration)}</b></div>
          </div>
          {chartTrafficDaily.length ? (
            <>
              <div className="analytics-chart traffic-chart">
                {chartTrafficDaily.map((day,index)=>(
                  <div className="analytics-bar-cell" key={day.date+index}>
                    <div className="analytics-bar-track" title={dayKey(day.date)+" • "+day.views+" görüntüleme • "+day.sessions+" oturum"}>
                      <i style={{height:Math.max(day.views>0?8:2,(day.views/maxTrafficViews)*100)+"%"}}/>
                    </div>
                    <span>{index % Math.max(1,Math.ceil(chartTrafficDaily.length/7))===0 || index===chartTrafficDaily.length-1 ? dayKey(day.date):""}</span>
                  </div>
                ))}
              </div>
              <div className="analytics-chart-foot"><span><i className="legend-dot"/> Günlük sayfa görüntüleme</span><b>{currentSessions.length} oturum · {uniqueVisitors} ziyaretçi</b></div>
            </>
          ) : <div className="admin-empty-state"><Eye size={24}/><b>Henüz ziyaret verisi yok</b><span>Migration aktif olduğunda gerçek trafik burada birikmeye başlayacak.</span></div>}
        </article>
        <article className="admin-section analytics-summary-card">
          <div className="admin-section-head"><div><span>DAVRANIŞ ÖZETİ</span><h2>Oturum kalitesi</h2></div></div>
          <div className="analytics-summary-list">
            <div><span>Toplam sayfa görüntüleme</span><b>{currentPageviews.length}</b></div>
            <div><span>Ort. sayfa süresi</span><b>{duration(avgPageDuration)}</b></div>
            <div><span>Ort. site süresi</span><b>{duration(avgSessionDuration)}</b></div>
            <div><span>Sayfa / oturum</span><b>{pagesPerSession.toLocaleString("tr-TR",{minimumFractionDigits:1,maximumFractionDigits:1})}</b></div>
            <div><span>Tek sayfalı oturum</span><b>{pct(singlePageRate)}</b></div>
            <div><span>Şu an aktif</span><b>{activeNow}</b></div>
          </div>
        </article>
      </section>

      <section className="analytics-grid-equal">
        <article className="admin-section">
          <div className="admin-section-head"><div><span>EN ÇOK GÖRÜLEN</span><h2>Sayfa performansı</h2></div></div>
          <div className="analytics-table-wrap">
            <div className="analytics-data-head"><span>Sayfa</span><span>Görüntüleme</span><span>Oturum</span><span>Ort. süre</span></div>
            {topPages.length ? topPages.map((page)=><div className="analytics-data-row" key={page.path}><b title={page.path}>{page.path}</b><span>{page.views}</span><span>{page.sessions}</span><span>{duration(page.avgSeconds)}</span></div>) : <div className="admin-empty-state compact"><span>Henüz sayfa verisi yok.</span></div>}
          </div>
        </article>
        <article className="admin-section">
          <div className="admin-section-head"><div><span>İLK GİRİŞ</span><h2>Landing sayfaları</h2></div></div>
          <div className="analytics-table-wrap landing-table">
            <div className="analytics-data-head"><span>Giriş sayfası</span><span>Oturum</span><span>Ort. site süresi</span></div>
            {landingPages.length ? landingPages.map((page)=><div className="analytics-data-row" key={page.path}><b title={page.path}>{page.path}</b><span>{page.sessions}</span><span>{duration(page.avgSeconds)}</span></div>) : <div className="admin-empty-state compact"><span>Henüz landing verisi yok.</span></div>}
          </div>
        </article>
      </section>

      <section className="analytics-grid-thirds">
        <article className="admin-section">
          <div className="admin-section-head"><div><span>KAYNAK</span><h2>Nereden geliyorlar?</h2></div></div>
          <div className="analytics-status-list">
            {trafficSources.length ? trafficSources.map(([source,count])=><div key={source}><span>{source}</span><div><i style={{width:currentSessions.length?(count/currentSessions.length)*100+"%":"0%"}}/></div><b>{count}</b></div>) : <div className="admin-empty-state compact"><span>Kaynak verisi yok.</span></div>}
          </div>
        </article>
        <article className="admin-section">
          <div className="admin-section-head"><div><span>REFERANS</span><h2>Gelen site / platform</h2></div></div>
          <div className="analytics-city-list">
            {topReferrers.length ? topReferrers.map(([host,count],index)=><div key={host}><span>{index+1}</span><b title={host}>{host}</b><small>{count} oturum</small></div>) : <div className="admin-empty-state compact"><span>Referans verisi yok.</span></div>}
          </div>
        </article>
        <article className="admin-section">
          <div className="admin-section-head"><div><span>CİHAZ</span><h2>Teknoloji dağılımı</h2></div><MonitorSmartphone size={18}/></div>
          <div className="analytics-device-groups">
            <div>{devices.map(([name,count])=><span key={name}><b>{name}</b><small>{count} oturum</small></span>)}</div>
            <div>{browsers.map(([name,count])=><span key={name}><b>{name}</b><small>{count}</small></span>)}</div>
          </div>
        </article>
      </section>

      <section className="admin-section analytics-recent">
        <div className="admin-section-head"><div><span>SON OTURUMLAR</span><h2>Ziyaret akışı</h2></div><small>IP adresi veya kişisel parmak izi tutulmaz.</small></div>
        <div className="analytics-session-head"><span>Başlangıç</span><span>Kaynak</span><span>İlk sayfa</span><span>Son sayfa</span><span>Sayfa</span><span>Süre</span><span>Cihaz</span></div>
        {recentSessions.length ? recentSessions.map((session)=><div className="analytics-session-row" key={session.id}>
          <span>{new Date(session.started_at).toLocaleString("tr-TR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</span>
          <span><b>{session.source}</b><small>{session.referrer_host || "—"}</small></span>
          <span title={session.entry_path}>{session.entry_path}</span>
          <span title={session.exit_path}>{session.exit_path}</span>
          <span>{session.pageviews}</span>
          <span>{duration(session.duration_seconds)}</span>
          <span><b>{session.device_type || "—"}</b><small>{session.browser || "—"} · {session.os || "—"}</small></span>
        </div>) : <div className="admin-empty-state compact"><span>Henüz oturum kaydı yok.</span></div>}
      </section>

      <section className="analytics-traffic-title commerce-title"><div><span>TİCARET ANALİTİĞİ</span><h2>Satış ve ürün performansı</h2></div></section>

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
