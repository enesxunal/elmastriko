import { checkoutStageLabels, checkoutErrorLabels, type CheckoutReport, type CheckoutStage } from "@/lib/checkout-diagnostics";
import { formatAnalyticsTime } from "@/lib/analytics-range";
const mainStages: CheckoutStage[] = ["form_started", "form_submitted", "order_created", "card_page_viewed", "card_submitted", "payment_verified", "eft_started"];
const groups: Record<string, string> = { contact: "İletişim bilgileri", address: "Teslimat adresi", invoice: "Fatura bilgileri", card: "Kart bilgileri" };
export default function CheckoutDiagnosticsDashboard({ report }: { report: CheckoutReport | null }) {
  return <section className="admin-section checkout-diagnostics">
    <div className="admin-section-head"><div><span>ÖDEME ADIMLARI</span><h2>Müşteri nerede durdu?</h2></div></div>
    {!report ? <p role="alert">Ödeme adımı kayıtları okunamadı. Bu, sıfır müşteri anlamına gelmez.</p> : <>
      <p className="analytics-helper">Bu bölüm {formatAnalyticsTime(report.measurementStartedAt, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} itibarıyla kaydedilen adımları gösterir. Önceki ziyaretlerin form hataları geriye dönük bilinemez. Teknik testler hariçtir.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, margin: "22px 0" }}>{mainStages.map(stage => {
        const row = report.stages.find(r => r.stage === stage);
        return <div key={stage} style={{ flex: "1 1 130px", borderBottom: "1px solid #e2e6e1", paddingBottom: 14 }}><small style={{ display: "block", color: "#66726a" }}>{checkoutStageLabels[stage]}</small><b style={{ display: "block", fontSize: 24 }}>{row?.sessions || 0}</b><small>oturum / deneme · {row?.events || 0} olay</small></div>;
      })}</div>
      <p className="analytics-helper">Kart formunun gönderilmesi, bankanın ödemeyi kabul ettiği anlamına gelmez. “Ödeme doğrulandı” yalnızca sunucuda doğrulanan ödeme sonucudur. Havale ayrı bir akıştır. Sayılar bu dönemde her adımı gören oturumları gösterir; oturum kimliği ölçülemeyen işlemler tekil deneme olarak sayılır. Kapalı huni oranı değildir.</p>
      {report.issues.length > 0 && <div className="behavior-table-scroll"><h3>Kaydedilen engeller</h3><table><thead><tr><th>Adım</th><th>Neden</th><th>Alan grubu</th><th>Olay</th></tr></thead><tbody>{report.issues.map((row, i) => <tr key={i}><td>{checkoutStageLabels[row.stage]}</td><td>{checkoutErrorLabels[row.code] || "Bilinmeyen neden"}{row.provider_code ? ` · Sağlayıcı kodu ${row.provider_code}` : ""}</td><td>{groups[row.field_group || ""] || "—"}</td><td>{row.count}</td></tr>)}</tbody></table></div>}
      <div className="behavior-table-scroll"><h3>Son ödeme denemeleri</h3>{!report.recent.length ? <p>Henüz yeni ölçüme ait ödeme denemesi yok.</p> : <table><thead><tr><th>Son kayıt</th><th>Kaynak / cihaz</th><th>Son görülen adım</th><th>Durum</th><th>Sipariş</th></tr></thead><tbody>{report.recent.map(row => <tr key={row.attempt_id}><td>{formatAnalyticsTime(row.last_at, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</td><td>{row.source} · {row.device}</td><td>{checkoutStageLabels[row.stage]}</td><td>{row.payment_status === "paid" ? "Ödendi" : row.payment_status === "failed" ? "Ödeme başarısız" : row.inactive ? "30 dk yeni kayıt yok; tamamlanmadı" : "Devam ediyor / sonucu bekleniyor"}</td><td>{row.order_no || "Henüz oluşmadı"}</td></tr>)}</tbody></table>}</div>
      <p className="analytics-helper">Form alanlarının içeriği, kart numarası, güvenlik kodu ve adres kaydedilmez. 30 dakika yeni kayıt gelmemesi terk ihtimalidir; ziyaretçinin neden vazgeçtiğini tek başına kanıtlamaz.</p>
    </>}
  </section>;
}
