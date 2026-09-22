import { requireAdmin } from "@/lib/admin";
import { toggleSubscriber, updateContactStatus } from "../actions";

export default async function MessagesAdmin(){
  const {supabase}=await requireAdmin();
  const [{data:messages},{data:subscribers}] = await Promise.all([
    supabase.from("contact_messages").select("id,name,email,phone,subject,message,status,created_at").order("created_at",{ascending:false}).limit(200),
    supabase.from("newsletter_subscribers").select("id,email,is_active,source,created_at").order("created_at",{ascending:false}).limit(500),
  ]);
  return <main className="admin-page"><div className="admin-page-head"><div><span>İLETİŞİM</span><h1>Mesajlar & Bülten</h1></div><p>İletişim formu mesajları ve e-posta bülteni aboneleri.</p></div>
    <section className="admin-section"><div className="admin-section-head"><h2>İletişim Mesajları</h2><span>{messages?.length||0}</span></div><div className="message-list">{messages?.length?messages.map(m=><article key={m.id}><div className="message-head"><div><b>{m.name}</b><span>{m.email} {m.phone?`· ${m.phone}`:""}</span></div><small>{new Date(m.created_at).toLocaleString("tr-TR")}</small></div><h3>{m.subject||"Konu belirtilmedi"}</h3><p>{m.message}</p><form action={updateContactStatus}><input type="hidden" name="id" value={m.id}/><select name="status" defaultValue={m.status}><option>new</option><option>in_progress</option><option>resolved</option><option>spam</option></select><button>Durumu Kaydet</button></form></article>):<div className="admin-empty">Mesaj yok.</div>}</div></section>
    <section className="admin-section"><div className="admin-section-head"><h2>Bülten Aboneleri</h2><span>{subscribers?.filter(s=>s.is_active).length||0} aktif</span></div><div className="admin-table">{subscribers?.map(s=><div className="admin-row" key={s.id}><b>{s.email}</b><span>{s.source}</span><span>{new Date(s.created_at).toLocaleDateString("tr-TR")}</span><form action={toggleSubscriber}><input type="hidden" name="id" value={s.id}/><input type="hidden" name="active" value={s.is_active?"false":"true"}/><button>{s.is_active?"Pasif Yap":"Aktif Yap"}</button></form></div>)}</div></section>
  </main>;
}
