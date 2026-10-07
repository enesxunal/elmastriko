import "server-only";
import nodemailer from "nodemailer";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptMailPassword } from "./crypto";

export type MailAccountKey = "sales" | "support";

type MailSettingsRow = {
  account_key: MailAccountKey;
  email: string;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_password_encrypted: string;
  is_enabled: boolean;
};

type OrderMailData = {
  id: string;
  order_no: string;
  guest_email: string | null;
  grand_total: number | string;
  currency: string;
  status: string;
  payment_status: string;
};

const statusLabels: Record<string,string> = {
  pending: "Sipariş alındı",
  awaiting_payment: "Ödeme bekleniyor",
  paid: "Ödeme onaylandı",
  processing: "Hazırlanıyor",
  preparing: "Hazırlanıyor",
  ready_to_ship: "Kargoya hazırlanıyor",
  shipped: "Kargoya verildi",
  delivered: "Teslim edildi",
  cancelled: "İptal edildi",
  refunded: "İade edildi",
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

async function getMailSettings(accountKey: MailAccountKey) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("site_settings")
    .select("value")
    .eq("key", `mail_${accountKey}`)
    .maybeSingle();
  if (error) throw error;
  const settings = (data?.value || {}) as MailSettingsRow;
  if (!settings.email || !settings.is_enabled || !settings.smtp_password_encrypted) {
    throw new Error(accountKey === "sales" ? "Satış mail hesabı yapılandırılmamış." : "Destek mail hesabı yapılandırılmamış.");
  }
  return settings;
}

async function transporterFor(accountKey: MailAccountKey) {
  const settings = await getMailSettings(accountKey);
  const transporter = nodemailer.createTransport({
    host: settings.smtp_host,
    port: Number(settings.smtp_port),
    secure: Boolean(settings.smtp_secure),
    requireTLS: !settings.smtp_secure,
    auth: {
      user: settings.smtp_user,
      pass: decryptMailPassword(settings.smtp_password_encrypted),
    },
  });
  return { transporter, settings };
}

export async function verifyMailAccount(accountKey: MailAccountKey) {
  const { transporter } = await transporterFor(accountKey);
  await transporter.verify();
}

export async function sendMail(params: {
  account: MailAccountKey;
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}) {
  const { transporter, settings } = await transporterFor(params.account);
  await transporter.sendMail({
    from: `Elmas Triko <${settings.email}>`,
    to: params.to,
    subject: params.subject,
    html: params.html,
    replyTo: params.replyTo || settings.email,
  });
}

function shell(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f6f7f4;font-family:Arial,sans-serif;color:#172018"><div style="max-width:620px;margin:0 auto;padding:36px 20px"><div style="background:#10241c;color:white;padding:18px 22px;border-radius:14px 14px 0 0"><b style="font-size:18px">ELMAS TRİKO</b></div><div style="background:white;border:1px solid #e2e6e1;border-top:0;padding:28px 22px;border-radius:0 0 14px 14px"><h1 style="font-size:24px;margin:0 0 18px">${escapeHtml(title)}</h1>${body}<p style="margin:28px 0 0;color:#7b857e;font-size:12px">Elmas Triko · elmastriko.com</p></div></div></body></html>`;
}

export async function sendWelcomeEmail(email: string, fullName?: string) {
  await sendMail({
    account: "support",
    to: email,
    subject: "Elmas Triko hesabınız oluşturuldu",
    html: shell("Hoş geldiniz", `<p>Merhaba ${escapeHtml(fullName || "")},</p><p>Elmas Triko hesabınız oluşturuldu. Siparişlerinizi, adreslerinizi ve sipariş hareketlerinizi hesabınızdan takip edebilirsiniz.</p>`),
  });
}

export async function sendNewOrderEmails(orderId: string) {
  const admin = createAdminClient();
  const [{ data: order }, { data: items }, { data: shipping }] = await Promise.all([
    admin.from("orders").select("id,order_no,guest_email,grand_total,currency,status,payment_status").eq("id",orderId).maybeSingle(),
    admin.from("order_items").select("product_name,sku,quantity,unit_price,line_total").eq("order_id",orderId),
    admin.from("order_addresses").select("full_name,city,district,address_line").eq("order_id",orderId).eq("kind","shipping").maybeSingle(),
  ]);
  if (!order) return;
  const typed = order as OrderMailData;
  const itemRows = (items || []).map(item => `<tr><td style="padding:8px 0">${escapeHtml(item.product_name)}</td><td style="padding:8px;text-align:center">${Number(item.quantity)}</td><td style="padding:8px 0;text-align:right">${Number(item.line_total ?? item.unit_price).toLocaleString("tr-TR")} ${escapeHtml(typed.currency)}</td></tr>`).join("");
  const total = Number(typed.grand_total).toLocaleString("tr-TR");

  await Promise.allSettled([
    sendMail({
      account: "sales",
      to: "satis@elmastriko.com",
      subject: `Yeni sipariş · ${typed.order_no}`,
      html: shell("Yeni sipariş geldi", `<p><b>Sipariş:</b> ${escapeHtml(typed.order_no)}</p><p><b>Müşteri:</b> ${escapeHtml(shipping?.full_name || typed.guest_email || "")}</p><p><b>Teslimat:</b> ${escapeHtml([shipping?.district,shipping?.city].filter(Boolean).join(" / "))}</p><table style="width:100%;border-collapse:collapse;margin-top:18px">${itemRows}</table><p style="font-size:18px"><b>Toplam: ${total} ${escapeHtml(typed.currency)}</b></p>`),
    }),
    typed.guest_email ? sendMail({
      account: "support",
      to: typed.guest_email,
      subject: `Siparişiniz alındı · ${typed.order_no}`,
      html: shell("Siparişiniz alındı", `<p>Sipariş numaranız <b>${escapeHtml(typed.order_no)}</b>.</p><table style="width:100%;border-collapse:collapse;margin-top:18px">${itemRows}</table><p style="font-size:18px"><b>Toplam: ${total} ${escapeHtml(typed.currency)}</b></p><p>Sipariş hareketleri bu e-posta adresine gönderilecektir.</p>`),
    }) : Promise.resolve(),
  ]);
}

export async function sendOrderStatusEmail(orderId: string, customLabel?: string) {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id,order_no,guest_email,grand_total,currency,status,payment_status")
    .eq("id",orderId)
    .maybeSingle();
  if (!order?.guest_email) return;
  const label = customLabel || statusLabels[order.status] || order.status;
  await sendMail({
    account: "support",
    to: order.guest_email,
    subject: `${order.order_no} · ${label}`,
    html: shell(label, `<p><b>${escapeHtml(order.order_no)}</b> numaralı siparişinizin durumu güncellendi.</p><p>Yeni durum: <b>${escapeHtml(label)}</b></p><p>Sipariş detaylarını Elmas Triko hesabınızdan veya sipariş takip ekranından görüntüleyebilirsiniz.</p>`),
  });
}

export async function sendShipmentEmail(orderId: string) {
  const admin = createAdminClient();
  const [{ data: order }, { data: shipment }] = await Promise.all([
    admin.from("orders").select("order_no,guest_email").eq("id",orderId).maybeSingle(),
    admin.from("shipments").select("provider,tracking_code,tracking_url,status").eq("order_id",orderId).order("created_at",{ascending:false}).limit(1).maybeSingle(),
  ]);
  if (!order?.guest_email || !shipment) return;
  const tracking = shipment.tracking_code
    ? `<p>Takip kodu: <b>${escapeHtml(shipment.tracking_code)}</b></p>`
    : "";
  const link = shipment.tracking_url
    ? `<p><a href="${escapeHtml(shipment.tracking_url)}">Kargonuzu takip edin</a></p>`
    : "";
  await sendMail({
    account: "support",
    to: order.guest_email,
    subject: `${order.order_no} · Kargo güncellemesi`,
    html: shell("Kargo güncellemesi", `<p><b>${escapeHtml(order.order_no)}</b> numaralı siparişiniz için kargo hareketi oluştu.</p><p>Kargo: <b>${escapeHtml(shipment.provider)}</b></p>${tracking}${link}`),
  });
}
