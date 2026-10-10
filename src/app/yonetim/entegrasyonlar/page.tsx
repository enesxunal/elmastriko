import PasswordInput from "@/components/PasswordInput";
import { saveMailSettings, testMailSettings } from "../actions";
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
    mail_error?: string; mail_saved?:string;mail_test?:string;
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

  const {data:mailRows}=await supabase.from("site_settings").select("key,value").in("key",["mail_sales","mail_support"]);
  const mailSettings=(key:string)=>(mailRows||[]).find(r=>r.key===`mail_${key}`)?.value as Record<string,unknown>|undefined;
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

    <section className="admin-section"><div className="admin-section-head"><h2>E-posta / SMTP Bildirimleri</h2></div>
      {params.mail_error && <p className="auth-message error">{params.mail_error}</p>}{params.mail_saved && <p className="auth-message">SMTP ayarları kaydedildi.</p>}{params.mail_test && <p className="auth-message">SMTP bağlantısı başarılı.</p>}
      <p>Destek hesabı müşterilere, satış hesabı satis@elmastriko.com adresine bildirim gönderir. Şifreler şifreli saklanır; kayıttan sonra tekrar görüntülenmez.</p>
      <div className="mail-settings-grid">{(["support","sales"] as const).map(key=>{const row=mailSettings(key);const email=key==="support"?"destek@elmastriko.com":"satis@elmastriko.com";const hasPassword=Boolean(row?.smtp_password_encrypted);return <details className="mail-settings-card mail-settings-disclosure" key={key}>
        <summary className="mail-settings-summary"><span className="mail-settings-summary-main"><small>E-POSTA / SMTP</small><strong>{key==="support"?"Müşteri Bildirimleri":"Satış Bildirimleri"}</strong><span>{email}</span></span><span className="mail-settings-summary-side"><b className={row?.last_test_status==="ok"?"active":row?.last_test_status==="error"?"error":"waiting"}>{row?.last_test_status==="ok"?"Bağlı":row?.last_test_status==="error"?"Bağlantı hatası":hasPassword?"Test bekliyor":"Kurulum gerekli"}</b><span className="mail-settings-chevron" aria-hidden="true">⌄</span></span></summary><div className="mail-settings-disclosure-body">
        <form action={saveMailSettings} className="mail-settings-form">
          <input type="hidden" name="account_key" value={key}/>
          <label>E-posta<input name="email" type="email" required defaultValue={String(row?.email||email)}/></label>
          <label>SMTP kullanıcı adı<input name="smtp_user" type="email" required defaultValue={String(row?.smtp_user||email)}/></label>
          <label>SMTP şifresi<PasswordInput name="smtp_password" autoComplete="new-password" placeholder={hasPassword?"Değiştirmek için yeni şifre girin":"SMTP şifresi"} required={!hasPassword}/></label>
          <label>Sunucu<input name="smtp_host" required defaultValue={String(row?.smtp_host||"mail.webaltyapi.com")}/></label>
          <label>Port<input name="smtp_port" type="number" required defaultValue={Number(row?.smtp_port||587)}/></label>
          <label>Güvenlik<select name="smtp_security" defaultValue={row?.smtp_secure?"ssl":"starttls"}><option value="starttls">STARTTLS (587)</option><option value="ssl">SSL/TLS (465)</option></select></label>
          <input type="hidden" name="imap_host" value={String(row?.imap_host||"mail.webaltyapi.com")}/><input type="hidden" name="imap_port" value={Number(row?.imap_port||993)}/>
          <label className="mail-toggle"><input name="is_enabled" type="checkbox" defaultChecked={row?.is_enabled!==false}/>Aktif</label><button type="submit">Ayarları kaydet</button>
        </form><form action={testMailSettings} className="mail-test-form"><input type="hidden" name="account_key" value={key}/><button disabled={!hasPassword}>SMTP bağlantısını test et</button><small>{row?.last_tested_at?`Son test: ${new Date(String(row.last_tested_at)).toLocaleString("tr-TR")}`:"Test yapılmadı"}</small></form>
      </div></details>})}</div>
    </section>
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
