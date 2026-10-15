"use client";
import {useId,useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import {RefreshCw} from "lucide-react";
import {analyticsDuration,type AnalyticsReport} from "@/lib/analytics-report";
import {formatAnalyticsTime} from "@/lib/analytics-range";

type Metric="sessions"|"visitors"|"views"|"seconds";
const labels:Record<Metric,string>={sessions:"Oturum",visitors:"Ziyaretçi",views:"Sayfa görüntüleme",seconds:"Ort. aktif süre"};
export function AnalyticsRefresh(){const router=useRouter();const[busy,start]=useTransition();return <button className="analytics-refresh" onClick={()=>start(()=>router.refresh())} disabled={busy}><RefreshCw size={15}/>{busy?"Yenileniyor…":"Yenile"}</button>;}
export default function AnalyticsLineChart({rows,bucket}:{rows:AnalyticsReport["trend"];bucket:AnalyticsReport["bucket"]}){
  const[metric,setMetric]=useState<Metric>("sessions");const[selected,setSelected]=useState<number|null>(null);const id=useId();
  const data=rows.map(row=>metric==="seconds"?(row.measuredSessions?row.activeMs/1000/row.measuredSessions:null):row[metric]);
  const max=Math.max(1,...data.filter((n):n is number=>n!==null)),width=640,height=200,pad=12;
  const x=(i:number)=>rows.length===1?width/2:pad+i*(width-pad*2)/Math.max(1,rows.length-1);
  const y=(n:number)=>height-pad-n/max*(height-pad*2);
  const segments:string[][]=[[]];
  data.forEach((n,i)=>{if(n===null){if(segments[segments.length-1].length)segments.push([]);}else segments[segments.length-1].push(`${x(i)},${y(n)}`);});
  const format=(n:number|null)=>n===null?"—":metric==="seconds"?analyticsDuration(n):n.toLocaleString("tr-TR");
  const date=(at:string)=>formatAnalyticsTime(at,bucket==="hour"?{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}:{day:"2-digit",month:"short"});
  const selectedIndex=selected!==null&&selected<rows.length?selected:Math.max(0,rows.length-1);
  return <article className="admin-section behavior-chart">
    <div className="admin-section-head"><div><span>{bucket==="hour"?"SAATLİK":bucket==="week"?"HAFTALIK":"GÜNLÜK"} TREND</span><h2>Ziyaret ve aktif süre</h2></div></div>
    <div className="analytics-metric-tabs" role="group" aria-label="Grafik ölçümü">{(Object.keys(labels) as Metric[]).map(key=><button key={key} type="button" aria-pressed={metric===key} onClick={()=>setMetric(key)}>{labels[key]}</button>)}</div>
    <div className="analytics-chart-value" aria-live="polite"><span>{rows[selectedIndex]?date(rows[selectedIndex].at):"Veri yok"}</span><strong>{format(data[selectedIndex]??(metric==="seconds"?null:0))}</strong><small>{labels[metric]}</small></div>
    <div className="analytics-line-wrap"><div className="analytics-y-axis"><span>{format(max)}</span><span>{format(max/2)}</span><span>0</span></div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={id} onMouseLeave={()=>setSelected(null)}>
        <title id={id}>{labels[metric]+" zaman grafiği. Ayrıntılı değerler aşağıdaki veri tablosundadır."}</title>
        {[0,.5,1].map(n=><line key={n} x1={pad} x2={width-pad} y1={y(n*max)} y2={y(n*max)} className="analytics-gridline"/>)}
        {segments.filter(s=>s.length>1).map((points,i)=><polyline key={i} points={points.join(" ")} className="analytics-line" fill="none"/>)}
        {data.map((n,i)=>n===null?null:<circle key={rows[i].at} cx={x(i)} cy={y(n)} r={i===selectedIndex?5:3} className="analytics-point" tabIndex={0} onFocus={()=>setSelected(i)} onMouseEnter={()=>setSelected(i)} onClick={()=>setSelected(i)}><title>{date(rows[i].at)+": "+format(n)}</title></circle>)}
      </svg>
    </div>
    <div className="analytics-x-axis">{rows.filter((_,i)=>i===0||i===Math.floor((rows.length-1)/2)||i===rows.length-1).map(row=><span key={row.at}>{date(row.at)}</span>)}</div>
    <p className="analytics-helper">{metric==="seconds"?"Süre ölçümü olmayan dilimler boş bırakılır.":"Boş zaman dilimleri sıfırla gösterilir."} Uzun aralıklar toplanarak gruplanır; günler atlanmaz.</p>
    <details className="analytics-chart-table"><summary>Grafik verilerini göster</summary><div className="behavior-table-scroll"><table><thead><tr><th>Zaman</th><th>Oturum</th><th>Ziyaretçi</th><th>Görüntüleme</th><th>Ort. aktif süre</th></tr></thead><tbody>{rows.map(row=><tr key={row.at}><td>{date(row.at)}</td><td>{row.sessions}</td><td>{row.visitors}</td><td>{row.views}</td><td>{analyticsDuration(row.measuredSessions?row.activeMs/1000/row.measuredSessions:null)}</td></tr>)}</tbody></table></div></details>
  </article>;
}
