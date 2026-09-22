import { requireAdmin } from "@/lib/admin";

export default async function AuditLogsPage(){
  const {supabase}=await requireAdmin();
  const {data:logs}=await supabase.from("audit_logs").select("id,action,entity_type,entity_id,metadata,created_at,actor_id").order("created_at",{ascending:false}).limit(250);
  return <main className="admin-page"><div className="admin-page-head"><div><span>GÜVENLİK & KAYIT</span><h1>İşlem Geçmişi</h1></div><p>Yönetim panelinde yapılan kritik değişikliklerin kayıtları.</p></div><div className="admin-table">{logs?.length?logs.map(l=><div className="admin-row" key={l.id}><div><b>{l.action}</b><small>{new Date(l.created_at).toLocaleString("tr-TR")}</small></div><span>{l.entity_type}</span><span>{l.entity_id||"—"}</span><code>{JSON.stringify(l.metadata)}</code></div>):<div className="admin-empty">Henüz kayıt yok.</div>}</div></main>;
}
