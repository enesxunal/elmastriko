import { formatAnalyticsTime } from "@/lib/analytics-range";
export type PaymentActivityReport = {
  orders: number; revenue: number; fromEarlierOrders: number; excludedTests: number;
  recent: Array<{order_no:string;created_at:string;paid_at:string;grand_total:number;currency:string;payment_provider:string|null}>;
};
export default function PaymentActivityDashboard({report}:{report:PaymentActivityReport|null}) {
  const money=(n:number)=>n.toLocaleString("tr-TR",{style:"currency",currency:"TRY",maximumFractionDigits:0});
  const date=(v:string)=>formatAnalyticsTime(v,{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
  return <section className="admin-section behavior-payment-activity">
    <div className="admin-section-head"><div><span>GERÇEK ÖDEMELER · ONAY TARİHİNE GÖRE</span><h2>Bu dönemde alınan ödemeler</h2></div><div className="analytics-chart-total"><small>{report ? `${report.orders} gerçek sipariş` : "Kayıt okunamadı"}</small><b>{report ? money(report.revenue) : "—"}</b></div></div>
    {!report ? <p role="alert">Ödeme kayıtları okunamadı. Bu, sıfır ödeme anlamına gelmez.</p> : <>
      <p className="analytics-helper">Siparişin verildiği gün yerine ödemenin ilk onaylandığı gün sayılır. Kartta sunucu doğrulaması, havalede yönetici onayı esas alınır. Deneme, arşiv ve iptal/iade siparişleri hariçtir.</p>
      {report.fromEarlierOrders>0&&<p className="behavior-warning">{report.fromEarlierOrders} ödeme önceki günlerde verilen siparişlere aittir. Aşağıdaki ziyaret hunisine eklenmez.</p>}
      {report.recent.length>0 ? <div className="behavior-table-scroll"><table><thead><tr><th>Sipariş</th><th>Sipariş tarihi</th><th>İlk ödeme onayı</th><th>Ödeme yöntemi</th><th>Tutar</th></tr></thead><tbody>{report.recent.map(row=><tr key={row.order_no}><td>{row.order_no}</td><td>{date(row.created_at)}</td><td>{date(row.paid_at)}</td><td>{row.payment_provider==="bank_transfer"?"Yönetimden havale onayı":"Kart / ödeme kaydı"}</td><td>{money(Number(row.grand_total))}</td></tr>)}</tbody></table></div> : <p>Bu dönemde onaylanan gerçek ödeme yok.</p>}
      {report.excludedTests>0&&<p className="analytics-helper">Dışarıda bırakılan deneme ödemesi: {report.excludedTests}. Daha önce Meta’ya ulaşan deneme olayları Meta’nın geçmiş toplamlarında kalabilir.</p>}
    </>}
  </section>;
}
