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
  return `<!doctype html><html lang="tr"><body style="margin:0;background:#f7f4ee;font-family:Arial,sans-serif;color:#173d31"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:30px 12px"><table role="presentation" width="100%" style="max-width:600px;background:white;border:1px solid #e7e1d8" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:30px"><img src="https://www.elmastriko.com/elmas-triko.png" width="160" alt="Elmas Triko" style="max-width:100%;height:auto" /></td></tr><tr><td style="padding:20px 32px 40px;color:#464a43"><h1 style="font-family:Georgia,serif;color:#173d31;font-weight:normal;font-size:29px">${escapeHtml(title)}</h1>${body}<p style="margin-top:26px;font-size:12px"><a href="https://www.elmastriko.com/siparis-takip" style="color:#173d31">Sipariş takibi</a></p></td></tr><tr><td align="center" style="background:#173d31;padding:28px"><img src="https://www.elmastriko.com/elmas-triko-w.png" width="120" alt="Elmas Triko" /><p style="color:#fff;font-size:12px">www.elmastriko.com</p></td></tr></table></td></tr></table></body></html>`;
}

export async function sendWelcomeEmail(email: string, fullName?: string) {
  await sendMail({
    account: "support",
    to: email,
    subject: "Elmas Triko hesabınız oluşturuldu",
    html: shell("Hoş geldiniz", `<p>Merhaba ${escapeHtml(fullName || "")},</p><p>Elmas Triko hesabınız oluşturuldu. Siparişlerinizi, adreslerinizi ve sipariş hareketlerinizi hesabınızdan takip edebilirsiniz.</p>`),
  });
}

export async function sendNewOrderEmails(orderId:string){await sendOrderNotice(orderId,"order_created");}

type OrderNoticeEvent = "order_created" | "payment_paid" | "payment_failed" | "preparing" | "invoice_sent" | "shipped" | "delivered" | "cancelled" | "refunded" | "status_updated";
const noticeTitles: Record<OrderNoticeEvent,string> = {
 order_created:"Siparişiniz alındı",payment_paid:"Ödemeniz onaylandı",payment_failed:"Ödeme tamamlanamadı",preparing:"Siparişiniz hazırlanıyor",invoice_sent:"Faturanız hazır",shipped:"Siparişiniz kargoya verildi",delivered:"Siparişiniz teslim edildi",cancelled:"Siparişiniz iptal edildi",refunded:"İade işleminiz tamamlandı",status_updated:"Sipariş durumunuz güncellendi"
};

/** Send one notification per order, event and recipient, even when a webhook retries. */
export async function sendOrderNotice(orderId:string, event:OrderNoticeEvent, context?:string) {
 const admin=createAdminClient();
 const [{data:order},{data:shipment},{data:invoice}]=await Promise.all([
   admin.from("orders").select("id,order_no,guest_email,user_id,status,payment_status,grand_total,currency").eq("id",orderId).maybeSingle(),
   admin.from("shipments").select("tracking_code,tracking_url").eq("order_id",orderId).order("created_at",{ascending:false}).limit(1).maybeSingle(),
   admin.from("invoices").select("id,invoice_no,status").eq("order_id",orderId).order("created_at",{ascending:false}).limit(1).maybeSingle(),
 ]);
 if(!order) return;
 let email=order.guest_email;
 if(!email && order.user_id){ const {data:user}=await admin.auth.admin.getUserById(order.user_id);email=user.user?.email || null; }
 const title=noticeTitles[event];
 const safeNo=escapeHtml(order.order_no);
 const details=`<p><b>Sipariş:</b> ${safeNo}</p><p><b>Toplam:</b> ${Number(order.grand_total).toLocaleString("tr-TR")} ${escapeHtml(order.currency)}</p>${context?`<p>${escapeHtml(context)}</p>`:""}${event==="shipped" && shipment?.tracking_code?`<p>Takip kodu: <b>${escapeHtml(shipment.tracking_code)}</b></p>`:""}${event==="shipped" && shipment?.tracking_url && /^https:\/\//i.test(shipment.tracking_url)?`<p><a href="${escapeHtml(shipment.tracking_url)}">Kargoyu takip et</a></p>`:""}${event==="invoice_sent" && invoice?.status==="sent"?`<p><a href="https://www.elmastriko.com/api/invoices/${encodeURIComponent(invoice.id)}/pdf">Faturayı görüntüle</a></p>`:""}`;
 const targets:["support"|"sales",string,string][] = [["sales","satis@elmastriko.com",`Satış bildirimi: ${title}`]];
 if(email)targets.unshift(["support",email,title]);
 for(const [account,to,subject] of targets){
   // Notification ledger is intentionally DB-backed to prevent duplicates across server instances.
   const {data:claim,error:claimError}=await admin.from("order_mail_deliveries").insert({order_id:orderId,event_key:event,recipient:to,status:"sending"}).select("id").single();
   if(claimError){if(claimError.code==="23505")continue;throw claimError;}
   try {await sendMail({account,to,subject:`Elmas Triko | ${subject} · ${order.order_no}`,html:shell(subject,details)});
     await admin.from("order_mail_deliveries").update({status:"sent",sent_at:new Date().toISOString()}).eq("id",claim.id);
   }catch(error){await admin.from("order_mail_deliveries").update({status:"failed",error_message:error instanceof Error?error.message.slice(0,300):"Bilinmeyen gönderim hatası"}).eq("id",claim.id);console.error("Order email delivery failed",{orderId,event,account});}
 }
}
export async function sendOrderStatusEmail(orderId:string, customLabel?:string){
 const admin=createAdminClient();const {data:order}=await admin.from("orders").select("status,payment_status").eq("id",orderId).maybeSingle();if(!order)return;
 const event:OrderNoticeEvent=customLabel?(/onaylandı/i.test(customLabel)?"payment_paid":/ödeme/i.test(customLabel)?"payment_failed":"status_updated"):
 order.status==="shipped"?"shipped":order.status==="delivered"?"delivered":order.status==="cancelled"?"cancelled":order.status==="refunded"?"refunded":order.status==="ready_to_ship"||order.status==="invoice_pending"?"preparing":order.payment_status==="paid"?"payment_paid":"status_updated";
 await sendOrderNotice(orderId,event,customLabel);
}
export async function sendShipmentEmail(orderId:string){await sendOrderNotice(orderId,"shipped");}
