import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { setUserRole } from "../actions";

export default async function UsersAdmin(){
  const {supabase}=await requireAdmin();
  const {data:users}=await supabase.from("profiles").select("id,full_name,email,phone,role,created_at").order("created_at",{ascending:false}).limit(200);
  return <main className="admin-page">
    <div className="admin-page-head"><div><span>MÜŞTERİLER</span><h1>Kullanıcılar</h1></div><p>Üye profilleri, sipariş geçmişi, adresler, favoriler ve yönetim yetkileri.</p></div>
    <div className="admin-table">{users?.map(u=><div className="admin-row" key={u.id}>
      <div><Link href={"/yonetim/kullanicilar/"+u.id}><b>{u.full_name||"İsimsiz kullanıcı"}</b></Link><small>{u.email||u.id.slice(0,8)}</small></div>
      <span>{u.phone||"Telefon yok"}</span><span>{u.role}</span>
      <form action={setUserRole}><input type="hidden" name="id" value={u.id}/><select name="role" defaultValue={u.role}><option value="customer">customer</option><option value="admin">admin</option></select><button>Yetkiyi Kaydet</button></form>
    </div>)}</div>
  </main>;
}
