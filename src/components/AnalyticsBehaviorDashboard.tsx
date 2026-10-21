import InternalTrafficControl from "./InternalTrafficControl";
import PaymentActivityDashboard, { type PaymentActivityReport } from "./PaymentActivityDashboard";
import Link from "next/link";
import {Clock3,Eye,Globe2,UsersRound} from "lucide-react";
import {RANGE_OPTIONS,formatAnalyticsTime,type AnalyticsRange} from "@/lib/analytics-range";
import {analyticsDuration,analyticsPercent,type AnalyticsReport} from "@/lib/analytics-report";
import AnalyticsLineChart,{AnalyticsRefresh} from "./AnalyticsLineChart";

const count=(n:number)=>n.toLocaleString("tr-TR");
function Delta({current,previous}:{current:number;previous:number|undefined}){
  if(previous===undefined)return null;
  if(previous===0)return <span className="behavior-delta neutral">{current?"Önceki dönem: 0":"Değişim yok"}</span>;
  const change=(current-previous)/previous*100;
  return <span className={"behavior-delta "+(change>=0?"up":"down")}>{change>0?"+":""}{change.toLocaleString("tr-TR",{maximumFractionDigits:1})}%</span>;
}
export default function AnalyticsBehaviorDashboard({period,report,previous,error,paymentActivity}:{period:AnalyticsRange;report:AnalyticsReport|null;previous:AnalyticsReport|null;error?:boolean;paymentActivity:PaymentActivityReport|null}){
  const dateOptions:Intl.DateTimeFormatOptions={day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"};
  const s=report?.summary,p=previous?.summary;
  const average=s?.measuredSessions?s.activeMs/1000/s.measuredSessions:null;
  const oldAverage=p?.measuredSessions?p.activeMs/1000/p.measuredSessions:undefined;
  const kpis=[
    {label:"Benzersiz ziyaretçi",value:s?count(s.visitors):"—",current:s?.visitors||0,previous:p?.visitors,icon:UsersRound,note:"Aynı tarayıcı, seçili aralıkta bir kez."},
    {label:"Oturum",value:s?count(s.sessions):"—",current:s?.sessions||0,previous:p?.sessions,icon:Globe2,note:"30 dakika hareketsizlik sonrası yenilenir."},
    {label:"Ort. aktif site süresi",value:analyticsDuration(average),current:average||0,previous:oldAverage,icon:Clock3,note:s?`${count(s.measuredSessions)} süre ölçümlü oturum üzerinden.`:"Ölçüm bekleniyor."},
    {label:"Sayfa görüntüleme",value:s?count(s.pageviews):"—",current:s?.pageviews||0,previous:p?.pageviews,icon:Eye,note:s?.sessions?`${(s.pageviews/s.sessions).toLocaleString("tr-TR",{maximumFractionDigits:1})} sayfa / oturum`:"Seçili dönemde görüntülenen sayfalar."},
  ];
  const f=report?.funnel;
  const steps=f?[
    {label:"Siteye gelen",value:f.sessions,help:"Bu aralıkta başlayan, yeni ölçüme dahil oturumlar."},
    {label:"Ürünle etkileşim",value:f.product,help:"Ürün detayı veya karttan hızlı ekleme."},
    {label:"Sepete ekleyen",value:f.cart,help:"En az bir ürünü sepete ekleyen oturumlar."},
    {label:"Ödemeye geçen",value:f.checkout,help:"Dolu sepetle ödeme adımına geçen oturumlar."},
    {label:"Satın alan",value:f.purchase,help:"Sunucuda ödenmiş olarak doğrulanan siparişe sahip oturumlar."},
  ]:[];
  return <>
    <section className="admin-page-head behavior-head"><div><span>İSTATİSTİKLER</span><h1>Mağaza performansı</h1><p>Ziyaret, aktif süre ve alışverişin hangi adımında müşteri kaybettiğinizi izleyin.</p></div><AnalyticsRefresh/></section>
    <section className="behavior-period">
      <nav className="analytics-ranges" aria-label="İstatistik tarih aralığı">{RANGE_OPTIONS.map(([key,label])=><Link key={key} href={"/yonetim/istatistikler?range="+key} className={period.key===key?"active":""} aria-current={period.key===key?"page":undefined}>{label}</Link>)}</nav>
      <form className="behavior-date-form" action="/yonetim/istatistikler" method="get"><input type="hidden" name="range" value="custom"/><label>Başlangıç<input aria-label="Başlangıç tarihi" type="date" name="from" defaultValue={period.fromInput} required/></label><label>Bitiş<input aria-label="Bitiş tarihi" type="date" name="to" defaultValue={period.toInput} required/></label><button type="submit">Aralığı uygula</button></form>
      <div className="behavior-period-note"><b>{period.label}</b><span>{formatAnalyticsTime(period.from,dateOptions)} — {formatAnalyticsTime(period.to,dateOptions)} · Türkiye saati</span></div>
      <p className="analytics-helper">{period.key!=="all"?period.comparison:"Tüm ölçüm dönemi gösterilir."} Bitiş tarihi özel seçimde günün tamamını kapsar; bugünün verisi şu ana kadardır.</p>
      {period.error&&<p className="admin-alert error" role="alert">{period.error} Bugün gösteriliyor.</p>}
    </section>
    {error||!report?<div className="admin-alert error" role="alert">Ziyaret ölçümü şu anda okunamıyor. Bu bir sıfır trafik sonucu değildir. Veritabanı bağlantısı ve analitik kurulumu kontrol edilmeli.</div>:<>
      <div className="behavior-status"><span><i/> Ölçümün son kaydı: {report.lastEventAt?formatAnalyticsTime(report.lastEventAt,dateOptions):"Henüz kayıt yok"}</span><b>{count(report.summary.activeNow)} oturum · son 5 dakika</b></div>
      <section className="analytics-kpis traffic-kpis">{kpis.map(({label,value,current,previous:old,icon:Icon,note})=><article key={label}><div className="analytics-kpi-top"><span className="analytics-icon"><Icon size={18}/></span><Delta current={current} previous={old}/></div><small>{label}</small><strong>{value}</strong><p>{note}</p></article>)}</section>
      <div className="behavior-duration-note"><Clock3 size={18}/><div><b>Aktif süre nasıl ölçülüyor?</b><p>Yalnızca görünür ve odaktaki sayfa ölçülür. Sekme değişince, uygulama arka plana geçince veya 60 saniye etkileşim olmayınca sayaç durur. Toplam aktif süre: <strong>{analyticsDuration(s!.measuredSessions?s!.activeMs/1000:null)}</strong>. Ölçülmemiş geçmiş süreler tahmin edilmez.</p></div></div>
      <section className="admin-section behavior-event-totals">
        <div className="admin-section-head"><div><span>OLAY ÖLÇÜMÜ · META’DA TARAYICI KAYNAĞIYLA KARŞILAŞTIRIN</span><h2>Olay sayısı ve oturum sayısı</h2></div></div>
        <InternalTrafficControl/>
        <p className="analytics-helper">Aynı kişi birden fazla olay oluşturabilir. Bu tablo seçilen dönemde gerçekleşen tüm müşteri olaylarını sayar; aşağıdaki huni ise aynı oturumda adımları sırayla geçenleri gösterir.</p>
        {report.eventTotals ? <div className="behavior-table-scroll"><table><thead><tr><th>Olay</th><th>Meta olay adı</th><th>Toplam olay</th><th>Tekil oturum</th></tr></thead><tbody>{report.eventTotals.map(row => <tr key={row.kind}><td>{{page_view:"Sayfa görüntüleme",view_item:"Ürün görüntüleme",add_to_cart:"Sepete ekleme",begin_checkout:"Ödeme başlangıcı"}[row.kind] || row.kind}</td><td>{{page_view:"PageView",view_item:"ViewContent",add_to_cart:"AddToCart",begin_checkout:"InitiateCheckout"}[row.kind]}</td><td>{count(row.events)}</td><td>{count(row.sessions)}</td></tr>)}</tbody></table></div> : <p>Olay toplamları okunamıyor; bu bir sıfır olay sonucu değildir.</p>}
        <p className="analytics-helper">Meta karşılaştırmasında aynı tarihi, saat dilimini ve yalnızca tarayıcı kaynağını seçin. Meta’nın “toplam olaylar” alanı tarayıcı ve sunucu kopyalarını birlikte gösterebilir. Sonradan ayıklanan denemeler Meta’nın geçmiş toplamlarında kalır. Reklam engelleme, gizlilik tercihleri ve iletim kayıpları da fark oluşturabilir.</p>
        <p className="analytics-helper">Bilinen teknik testler hariç: {count(report.excludedTestSessions || 0)} oturum. Yönetim ve önizleme sayfaları müşteri trafiğine dahil edilmez.{report.eventAlignmentStartedAt && <> Ortak olay kimliğiyle ölçüm düzenlemesi: {formatAnalyticsTime(report.eventAlignmentStartedAt,dateOptions)}. Önceki Meta verileri geriye dönük değişmez.</>}</p>
      </section>
      <PaymentActivityDashboard report={paymentActivity}/>
      <section className="admin-section behavior-funnel"><div className="admin-section-head"><div><span>BU DÖNEMDE BAŞLAYAN MÜŞTERİ OTURUMLARI</span><h2>Ziyaretten satın almaya</h2></div><div className="analytics-chart-total"><small>Oturumdan satışa</small><b>{analyticsPercent(f!.purchase,f!.sessions)}</b></div></div>
        <p className="analytics-helper">Bilinen teknik testler hariçtir. Aynı oturumdaki adımlar sırayla ve yalnızca bir kez sayılır. Karttan hızlı ekleme, ürünle etkileşime dahildir. Ödeme sayfasını açmak satış sayılmaz.</p>
        <div className="behavior-funnel-steps">{steps.map((step,i)=>{const before=i?steps[i-1].value:step.value;return <article key={step.label}><span className="funnel-step-number">{i+1}</span><h3>{step.label}</h3><strong>{count(step.value)}</strong><div className="funnel-bar"><i style={{width:(f!.sessions?step.value/f!.sessions*100:0)+"%"}}/></div><b>{i?analyticsPercent(step.value,before)+" geçiş":"Başlangıç"}</b><small>{i?`${count(Math.max(0,before-step.value))} oturum bu adımda kaybedildi`:"Seçili aralıkta başlayan oturumlar"}</small><p>{step.help}</p></article>;})}</div>
        <div className="behavior-funnel-foot"><span><b>{count(f!.orders)}</b> ödenmiş sipariş · {f!.revenue.toLocaleString("tr-TR",{style:"currency",currency:"TRY",maximumFractionDigits:0})}</span><span>Ödeme durumu raporun açıldığı andaki durumdur; EFT onayı sonradan dönüşüme yansır.</span></div>
        {f!.unattributedPaidOrders>0&&<p className="behavior-warning">Bu dönemde {count(f!.unattributedPaidOrders)} ödenmiş siparişin ölçülmüş oturum bağlantısı yok. Satış raporunda görünür; huninin dönüşüm oranına eklenmez.</p>}
        <p className="analytics-helper">Huni ve yeni aktif süre ölçümü {report.measurementStartedAt?formatAnalyticsTime(report.measurementStartedAt,dateOptions):"kurulumdan"} itibarıyla birikir. Geçmişte toplanmayan adımlar geriye dönük oluşturulmaz.</p>
      </section>
      <AnalyticsLineChart rows={report.trend} bucket={report.bucket}/>
      <section className="analytics-grid-equal behavior-tables">
        <article className="admin-section"><div className="admin-section-head"><div><span>SAYFA PERFORMANSI</span><h2>Nerede vakit geçiriliyor?</h2></div></div><div className="behavior-table-scroll"><table><thead><tr><th>Sayfa</th><th>Görüntüleme</th><th>Oturum</th><th>Ort. aktif süre</th></tr></thead><tbody>{report.pages.map(row=><tr key={row.path}><td title={row.path}>{row.path}</td><td>{count(row.views)}</td><td>{count(row.sessions)}</td><td>{analyticsDuration(row.avgSeconds)}</td></tr>)}</tbody></table>{!report.pages.length&&<p className="behavior-empty">Bu aralıkta sayfa kaydı yok.</p>}</div></article>
        <article className="admin-section"><div className="admin-section-head"><div><span>TRAFİK KAYNAKLARI</span><h2>Nereden geliyorlar?</h2></div></div><div className="behavior-table-scroll"><table><thead><tr><th>Kaynak</th><th>Oturum</th><th>Ort. süre</th><th>Satın alan</th></tr></thead><tbody>{report.sources.map(row=><tr key={row.name}><td>{row.name}</td><td>{count(row.sessions)}</td><td>{analyticsDuration(row.avgSeconds)}</td><td>{count(row.purchases)}</td></tr>)}</tbody></table>{!report.sources.length&&<p className="behavior-empty">Bu aralıkta kaynak kaydı yok.</p>}</div></article>
      </section>
      <section className="admin-section"><div className="admin-section-head"><div><span>CİHAZ DAĞILIMI</span><h2>Mobil ve masaüstü</h2></div></div><div className="behavior-devices">{report.devices.map(row=><div key={row.name}><b>{row.name}</b><strong>{count(row.sessions)}</strong><span>{analyticsPercent(row.sessions,s!.sessions)} trafik · {count(row.purchases)} satın alan oturum</span></div>)}</div></section>
      <section className="admin-section"><div className="admin-section-head"><div><span>SON OTURUMLAR</span><h2>Ziyaret akışı</h2></div></div><div className="behavior-table-scroll"><table><thead><tr><th>Başlangıç</th><th>Kaynak</th><th>İlk sayfa</th><th>Son sayfa</th><th>Sayfa</th><th>Aktif süre</th><th>Cihaz</th></tr></thead><tbody>{report.recent.map(row=><tr key={row.id}><td>{formatAnalyticsTime(row.started_at,{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</td><td>{row.source}</td><td title={row.entry_path}>{row.entry_path}</td><td title={row.exit_path}>{row.exit_path}</td><td>{row.pageviews}</td><td>{analyticsDuration(row.seconds)}</td><td>{row.device_type}</td></tr>)}</tbody></table>{!report.recent.length&&<p className="behavior-empty">Bu aralıkta oturum kaydı yok.</p>}</div></section>
    </>}
  </>;
}
