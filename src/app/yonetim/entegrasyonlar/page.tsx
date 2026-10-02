import { requireAdmin } from "@/lib/admin";
import { saveIntegration, testBasitKargoConnection } from "../actions";

export default async function IntegrationsAdmin({
  searchParams,
}: {
  searchParams: Promise<{
    bk_status?: string;
    bk_message?: string;
    bk_count?: string;
    bk_code?: string;
    bk_name?: string;
  }>;
}) {
  const params = await searchParams;
  const {supabase}=await requireAdmin();
  const {data:items}=await supabase.from("integration_settings").select("provider,is_enabled,status,public_config,last_checked_at,updated_at").order("provider");

  return <main className="admin-page">
    <div className="admin-page-head">
      <div><span>SİSTEM</span><h1>Entegrasyonlar</h1></div>
      <p>Ödeme, kargo ve e-fatura bağlantılarının merkezi görünümü. Gizli anahtarlar panelde gösterilmez.</p>
    </div>

    <section className="integration-test-card">
      <div>
        <span>KARGO</span>
        <h2>BasitKargo bağlantı testi</h2>
        <p>Production tokenıyla yalnızca taşıyıcı listesini okur. Gönderi oluşturmaz ve ücret doğurmaz.</p>
      </div>
      <form action={testBasitKargoConnection}>
        <button type="submit">BasitKargo Bağlantısını Test Et</button>
      </form>
      {params.bk_status && <div className={"admin-alert " + (params.bk_status === "error" ? "error" : params.bk_status === "ok" ? "success" : "")}>
        <strong>{params.bk_message}</strong>
        {params.bk_count && <span>Handler sayısı: {params.bk_count}</span>}
        {params.bk_name && <span>Sürat Kargo: {params.bk_name} ({params.bk_code})</span>}
      </div>}
    </section>

    <section className="integration-grid">
      {items?.map(i=><article key={i.provider}>
        <div className="integration-status"><span>{i.provider}</span><b className={i.is_enabled?"ok":"wait"}>{i.status}</b></div>
        <form action={saveIntegration}>
          <input type="hidden" name="provider" value={i.provider}/>
          <select name="status" defaultValue={i.status}><option>not_configured</option><option>waiting_provider</option><option>waiting_credentials</option><option>configured</option><option>error</option></select>
          <textarea name="note" defaultValue={(i.public_config as {note?:string})?.note||""} placeholder="Operasyon notu"/>
          <label><input type="checkbox" name="is_enabled" defaultChecked={i.is_enabled}/> Aktif</label>
          <button>Kaydet</button>
        </form>
      </article>)}
    </section>
  </main>;
}
