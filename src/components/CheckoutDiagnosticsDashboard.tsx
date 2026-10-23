import { checkoutStageLabels, checkoutErrorLabels, checkoutFieldLabels, type CheckoutReport, type JourneyStage } from "@/lib/checkout-diagnostics";
import { toCatalogProductSlug } from "@/lib/product-seo-slugs";
import { journeySummary, journeyPageLabel } from "@/lib/checkout-journey";
import CheckoutJourneyRefresh from "./CheckoutJourneyRefresh";
import { formatAnalyticsTime } from "@/lib/analytics-range";
const mainStages: JourneyStage[] = ["cart_added", "checkout_viewed", "form_started", "contact_completed", "address_completed", "form_submitted", "order_created", "card_page_viewed", "card_submitted", "payment_verified", "eft_started"];
const groups: Record<string, string> = { contact:"İletişim bilgileri", address:"Teslimat adresi", invoice:"Fatura bilgileri", card:"Kart bilgileri" };
const time = (at:string) => formatAnalyticsTime(at,{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit"});
export default function CheckoutDiagnosticsDashboard({ report, productNames = {} }: { report: CheckoutReport | null; productNames?: Record<string,string> }) {
  return <section className="admin-section checkout-diagnostics">
    <div className="admin-section-head"><div><span>MÜŞTERİ ADIMLARI</span><h2>Müşteri nerede durdu?</h2></div><CheckoutJourneyRefresh/></div>
    {!report ? <p role="alert">Müşteri adımları okunamadı. Bu, sıfır müşteri anlamına gelmez. Sayfayı yenileyin.</p> : <>
      <p className="analytics-helper">Sepete ekleyen ve ödemeye geçen ziyaretçilerin ürün, sepet, form ve ödeme kayıtları aynı ziyaret altında gösterilir. Teknik testler hariçtir.</p>
      <div className="journey-stage-grid">{mainStages.map(stage => {
        const row=report.stages.find(r=>r.stage===stage);
        return <div key={stage}><small>{checkoutStageLabels[stage]}</small><b>{row?.sessions||0}</b><small>{row?.events||0} olay · {row?.sessions||0} tekil ziyaret / deneme</small></div>;
      })}</div>
      <p className="analytics-helper">“Ödeme sayfası hazır”, üst tablodaki InitiateCheckout ile aynı kayıttır. Sayfayı açmak, forma başlamak veya ödeme yapmak anlamına gelmez. Havale ve kart ayrı adımlardır.</p>
      {report.issues.length>0&&<div className="behavior-table-scroll"><h3>Kaydedilen hatalar</h3><table><thead><tr><th>Adım</th><th>Hata</th><th>Alan</th><th>Olay</th></tr></thead><tbody>{report.issues.map((row,i)=><tr key={i}><td>{checkoutStageLabels[row.stage]}</td><td>{checkoutErrorLabels[row.code]||"Bilinmeyen neden"}{row.provider_code?` · Sağlayıcı kodu ${row.provider_code}`:""}</td><td>{checkoutFieldLabels[row.field_name||""]||groups[row.field_group||""]||"—"}</td><td>{row.count}</td></tr>)}</tbody></table></div>}
      <h3>Son müşteri ziyaretleri</h3>
      <p className="analytics-helper">Seçili dönemdeki son 30 ziyaret. Ayrıntıyı açarak sıralı adımları ve kaydedilen hataları görebilirsiniz.</p>
      {!report.recent.length?<p>Bu dönemde kaydedilen sepet veya ödeme adımı yok.</p>:<div className="customer-journeys">{report.recent.map(row=><details className="customer-journey" key={row.attempt_id}>
        <summary><span className="journey-identity"><b>Ziyaret {row.attempt_id.slice(0,6).toUpperCase()}</b><small>{row.source==="ig"?"Instagram":row.source} · {row.device} · {row.browser}</small><small>{time(row.first_at)} → {time(row.last_at)}</small></span><span className="journey-outcome"><b>{journeySummary(row)}</b><small>{row.payment_status==="paid"?"Ödendi":row.inactive?"30 dk yeni adım kaydı yok":"Son 30 dk içinde kayıt var"}{row.order_no?` · ${row.order_no}`:" · Sipariş kaydı yok"}</small></span><span className="journey-open">Adımları gör ↓</span></summary>
        <ol className="journey-timeline">{row.timeline.map(event=><li className={event.code?"has-issue":""} key={event.id+event.stage}>
          <time dateTime={event.at}>{time(event.at)}</time><div><b>{checkoutStageLabels[event.stage]||event.stage}</b>{(event.product_name||event.path)&&<span>{event.product_name||(event.path?.startsWith("/urun/")?productNames[toCatalogProductSlug(event.path.slice(6))]:null)||journeyPageLabel(event.path)}</span>}{event.code&&<span className="journey-error">{checkoutErrorLabels[event.code]||"Kaydedilen hata"}{event.field_name?` · ${checkoutFieldLabels[event.field_name]||"Alan"}`:event.field_group?` · ${groups[event.field_group]||"Alan grubu"}`:""}{event.provider_code?` · Sağlayıcı kodu ${event.provider_code}`:""}</span>}</div>
        </li>)}</ol>{row.event_count>row.timeline.length&&<p className="analytics-helper">Bu ziyaretin son {row.timeline.length} adımı gösteriliyor ({row.event_count} kayıt).</p>}
      </details>)}</div>}
      <p className="analytics-helper">Form ve kart bilgilerinin içeriği kaydedilmez. Hatalarda yalnızca alan adı tutulur. Yeni alan ayrıntıları {report.detailStartedAt?time(report.detailStartedAt):"bu güncelleme"} itibarıyla toplanır; geçmişte kaydedilmemiş etkileşim veya ayrılma nedeni üretilemez. 30 dk sessizlik, ziyaretçinin neden ayrıldığını kanıtlamaz.</p>
    </>}
  </section>;
}
