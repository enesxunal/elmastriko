type Event = { kind:string; campaign_key:string; session_id:string };
const campaigns = [
  {key:"gift_3plus1",label:"3 Al 1 Hediye banner"},
  {key:"women_boucle",label:"Kadın koleksiyonu banner"},
  {key:"men_polo",label:"Erkek koleksiyonu banner"},
];
const count = (n:number) => n.toLocaleString("tr-TR");
export default function CampaignPerformancePanel({events,error,truncated}:{events:Event[];error:boolean;truncated:boolean}){
  if(error) return <section className="admin-section campaign-performance"><div className="admin-section-head"><div><span>KAMPANYA PERFORMANSI</span><h2>Banner ve popup etkileşimleri</h2></div></div><p className="admin-alert error">Kampanya ölçümleri şu anda okunamıyor. Bu, sıfır etkileşim anlamına gelmez; ölçüm tablosunu kontrol edin.</p></section>;
  const sum = (kind:string,key:string) => events.filter(event=>event.kind===kind&&event.campaign_key===key).length;
  const impressions=sum("popup_view","joint_offers");
  const popupClicks=sum("popup_click","joint_offers");
  const popupCloses=sum("popup_close","joint_offers");
  const bannerClicks=campaigns.reduce((sumValue,c)=>sumValue+sum("banner_click",c.key),0);
  return <section className="admin-section campaign-performance">
    <div className="admin-section-head"><div><span>KAMPANYA PERFORMANSI</span><h2>Banner ve popup etkileşimleri</h2></div></div>
    <p className="analytics-helper">Seçili tarih aralığındaki gerçek tıklama ve gösterim olayları. Ölçüm yalnızca yeni kurulumdan itibaren birikir; geçmişte ölçülmeyen olaylar eklenmez.</p>
    {truncated&&<p className="admin-alert error">10.000 olay sınırına ulaşıldı. Bu aralıkta tüm olaylar görüntülenemiyor; daha kısa tarih seçin.</p>}
    <div className="campaign-performance-kpis">
      <article><span>Toplam banner tıklaması</span><strong>{count(bannerClicks)}</strong></article>
      <article><span>Popup gösterimi</span><strong>{count(impressions)}</strong></article>
      <article><span>Popup alışveriş tıklaması</span><strong>{count(popupClicks)}</strong><small>{impressions ? `%${(popupClicks/impressions*100).toLocaleString("tr-TR",{maximumFractionDigits:1})} gösterimden tıklama` : "Henüz ölçümlü gösterim yok"}</small></article>
      <article><span>Popup kapatma</span><strong>{count(popupCloses)}</strong></article>
    </div>
    <div className="behavior-table-scroll"><table><thead><tr><th>Banner</th><th>Tıklama</th><th>Tıklayan oturum</th></tr></thead><tbody>{campaigns.map(c=>{const rows=events.filter(e=>e.kind==="banner_click"&&e.campaign_key===c.key);return <tr key={c.key}><td>{c.label}</td><td>{count(rows.length)}</td><td>{count(new Set(rows.map(r=>r.session_id)).size)}</td></tr>;})}</tbody></table></div>
  </section>;
}
