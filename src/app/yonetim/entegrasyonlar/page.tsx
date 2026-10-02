import { requireAdmin } from "@/lib/admin";
import { basitKargo } from "@/lib/integrations/basitkargo";
import { invoiceIntegration, isNesConfigured } from "@/lib/integrations/invoice";
import { isToslaConfigured } from "@/lib/integrations/tosla";
import { testBasitKargoConnection } from "../actions";

type AutoStatus = {
  key: string;
  label: string;
  active: boolean;
  status: "configured" | "error" | "waiting_credentials";
  detail: string;
};

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

  const [{data:items}, basitResult, nesResult] = await Promise.all([
    supabase.from("integration_settings").select("provider,public_config,last_checked_at,updated_at").order("provider"),
    basitKargo.listHandlers().then(
      handlers => ({ ok: true as const, handlers }),
      error => ({ ok: false as const, error: error instanceof Error ? error.message : "Bağlantı hatası" }),
    ),
    isNesConfigured()
      ? invoiceIntegration.healthCheck().then(
          result => ({ ok: true as const, result }),
          error => ({ ok: false as const, error: error instanceof Error ? error.message : "Bağlantı hatası" }),
        )
      : Promise.resolve({ ok: false as const, error: "NES API anahtarı tanımlı değil." }),
  ]);

  const surat = basitResult.ok
    ? basitResult.handlers.find(item =>
        String(item.code || "").toUpperCase().includes("SURAT") ||
        String(item.name || "").toLocaleUpperCase("tr-TR").includes("SÜRAT")
      )
    : undefined;

  const paymentConfigured = isToslaConfigured();
  const paymentLive = (process.env.TOSLA_MODE || "test").toLowerCase() === "live";

  const statuses: AutoStatus[] = [
    {
      key: "BASITKARGO",
      label: "BasitKargo / Sürat Kargo",
      active: Boolean(basitResult.ok && surat),
      status: basitResult.ok && surat ? "configured" : basitResult.ok ? "error" : "error",
      detail: basitResult.ok
        ? surat
          ? `Bağlantı aktif · ${basitResult.handlers.length} taşıyıcı · Sürat Kargo kodu: ${surat.code}`
          : `Bağlantı aktif ancak Sürat Kargo bulunamadı · ${basitResult.handlers.length} taşıyıcı`
        : "BasitKargo API bağlantısı başarısız.",
    },
    {
      key: "NES_PORTAL",
      label: "NES Portal",
      active: Boolean(nesResult.ok),
      status: nesResult.ok ? "configured" : isNesConfigured() ? "error" : "waiting_credentials",
      detail: nesResult.ok
        ? "e-Fatura ve e-Arşiv API bağlantıları aktif."
        : isNesConfigured()
          ? "NES API anahtarı tanımlı ancak sağlık kontrolü başarısız."
          : "NES API anahtarı tanımlı değil.",
    },
    {
      key: "PAYMENT",
      label: "Tosla Sanal POS",
      active: Boolean(paymentConfigured && paymentLive),
      status: paymentConfigured && paymentLive ? "configured" : paymentConfigured ? "error" : "waiting_credentials",
      detail: paymentConfigured
        ? paymentLive
          ? "Production ödeme bilgileri tanımlı ve canlı mod aktif."
          : "Ödeme bilgileri tanımlı ancak TOSLA_MODE live değil."
        : "Tosla production bilgileri eksik.",
    },
  ];

  const notes = new Map(
    (items || []).map(item => [String(item.provider).toUpperCase(), (item.public_config as {note?:string})?.note || ""])
  );

  return <main className="admin-page">
    <div className="admin-page-head">
      <div><span>SİSTEM</span><h1>Entegrasyonlar</h1></div>
      <p>Durumlar production bağlantılarından otomatik okunur. Gizli anahtarlar panelde gösterilmez.</p>
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
      {statuses.map(item => <article key={item.key}>
        <div className="integration-status">
          <span>{item.label}</span>
          <b className={item.active ? "ok" : "wait"}>{item.status}</b>
        </div>
        <div className={"admin-alert " + (item.active ? "success" : item.status === "error" ? "error" : "")}>
          <strong>{item.active ? "Aktif" : item.status === "waiting_credentials" ? "Bilgi bekleniyor" : "Kontrol gerekli"}</strong>
          <span>{item.detail}</span>
        </div>
        {notes.get(item.key) && <div className="integration-note"><span>Operasyon notu</span><p>{notes.get(item.key)}</p></div>}
      </article>)}
    </section>
  </main>;
}
