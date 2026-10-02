import { requireAdmin } from "@/lib/admin";
import { basitKargo } from "@/lib/integrations/basitkargo";
import { invoiceIntegration, isNesConfigured } from "@/lib/integrations/invoice";
import { isToslaConfigured } from "@/lib/integrations/tosla";
import { testBasitKargoConnection } from "../actions";

type AutoStatus = {
  key: string;
  label: string;
  eyebrow: string;
  active: boolean;
  status: "configured" | "error" | "waiting_credentials";
  detail: string;
};

function friendlyStatus(item: AutoStatus) {
  if (item.active) return "Aktif";
  if (item.status === "waiting_credentials") return "Bilgi Bekleniyor";
  return "Kontrol Gerekli";
}

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
      () => ({ ok: false as const }),
    ),
    isNesConfigured()
      ? invoiceIntegration.healthCheck().then(
          () => ({ ok: true as const }),
          () => ({ ok: false as const }),
        )
      : Promise.resolve({ ok: false as const }),
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
      label: "Sürat Kargo",
      eyebrow: "KARGO",
      active: Boolean(basitResult.ok && surat),
      status: basitResult.ok && surat ? "configured" : "error",
      detail: basitResult.ok
        ? surat
          ? `BasitKargo · ${basitResult.handlers.length} taşıyıcı · Kod: ${surat.code}`
          : `BasitKargo bağlı · ${basitResult.handlers.length} taşıyıcı · Sürat bulunamadı`
        : "BasitKargo API bağlantısı doğrulanamadı.",
    },
    {
      key: "NES_PORTAL",
      label: "NES e-Fatura",
      eyebrow: "FATURA",
      active: Boolean(nesResult.ok),
      status: nesResult.ok ? "configured" : isNesConfigured() ? "error" : "waiting_credentials",
      detail: nesResult.ok
        ? "e-Fatura + e-Arşiv API bağlantısı"
        : isNesConfigured()
          ? "API tanımlı · sağlık kontrolü başarısız"
          : "API anahtarı bekleniyor",
    },
    {
      key: "PAYMENT",
      label: "Tosla Sanal POS",
      eyebrow: "ÖDEME",
      active: Boolean(paymentConfigured && paymentLive),
      status: paymentConfigured && paymentLive ? "configured" : paymentConfigured ? "error" : "waiting_credentials",
      detail: paymentConfigured
        ? paymentLive
          ? "Production · canlı ödeme modu"
          : "Bilgiler tanımlı · canlı mod kapalı"
        : "Production bilgileri eksik",
    },
  ];

  const notes = new Map(
    (items || []).map(item => [String(item.provider).toUpperCase(), (item.public_config as {note?:string})?.note || ""])
  );

  return <main className="admin-page integration-admin-page">
    <div className="integration-page-head">
      <div>
        <span>SİSTEM</span>
        <h1>Entegrasyonlar</h1>
        <p>Ödeme, kargo ve e-fatura servislerinin canlı bağlantı durumları.</p>
      </div>
      <div className="integration-summary">
        <strong>{statuses.filter(item => item.active).length}/{statuses.length}</strong>
        <span>aktif bağlantı</span>
      </div>
    </div>

    {params.bk_status && <div className={"integration-feedback " + (params.bk_status === "error" ? "error" : "success")}>
      <strong>{params.bk_status === "error" ? "Bağlantı kontrolü başarısız" : "BasitKargo bağlantısı doğrulandı"}</strong>
      <span>{params.bk_status === "error"
        ? params.bk_message
        : [params.bk_name && `${params.bk_name} (${params.bk_code})`, params.bk_count && `${params.bk_count} taşıyıcı`].filter(Boolean).join(" · ")}</span>
    </div>}

    <section className="integration-cards">
      {statuses.map(item => <article className="integration-card" key={item.key}>
        <div className="integration-card-top">
          <div>
            <span>{item.eyebrow}</span>
            <h2>{item.label}</h2>
          </div>
          <b className={item.active ? "active" : item.status === "waiting_credentials" ? "waiting" : "error"}>
            {friendlyStatus(item)}
          </b>
        </div>

        <div className="integration-card-state">
          <i className={item.active ? "active" : ""}/>
          <span>{item.detail}</span>
        </div>

        {notes.get(item.key) && <div className="integration-note">
          <span>Operasyon notu</span>
          <p>{notes.get(item.key)}</p>
        </div>}

        {item.key === "BASITKARGO" && <form action={testBasitKargoConnection} className="integration-card-action">
          <button type="submit">Bağlantıyı tekrar test et</button>
          <small>Gönderi oluşturmaz, ücret çıkarmaz.</small>
        </form>}
      </article>)}
    </section>
  </main>;
}
