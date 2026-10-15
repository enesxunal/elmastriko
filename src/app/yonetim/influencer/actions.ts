"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicClient } from "@/lib/supabase/public";
import { sendMail } from "@/lib/mail";
import { validEmail, validCode, validSlug } from "@/lib/influencer";

const text = (data: FormData, key: string) => String(data.get(key) || "").trim();
const back = (message: string, ok = false) =>
  redirect("/yonetim/influencer?" + (ok ? "message=" : "error=") + encodeURIComponent(message));
const percent = (data: FormData, key: string, fallback: number) => {
  const n = Number(text(data,key) || fallback);
  return Number.isFinite(n) && n >= 0 && n <= 30 ? n : fallback;
};

export async function saveInfluencer(fd: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  const id = text(fd, "id");
  const email = text(fd,"email").toLowerCase() || null;
  const code = text(fd,"code").toUpperCase();
  const slug = text(fd,"slug").toLowerCase();
  const status = text(fd,"status") || "draft";
  const fullName = text(fd,"full_name");
  if (!fullName || !validCode(code) || !validSlug(slug) || (email && !validEmail(email))) back("İsim, kod, bağlantı veya e-posta geçersiz.");
  if (!["draft","active","paused"].includes(status)) back("İş birliği durumu geçersiz.");
  if (status === "active" && !email) back("Influencer'ı aktif etmek için doğrulanmış davet e-postasını girin.");
  const payload = {
    full_name: fullName, email, code, slug, status,
    instagram_handle: text(fd,"instagram_handle") || null,
    discount_percent: percent(fd,"discount_percent",5),
    commission_percent: percent(fd,"commission_percent",5),
    vat_percent: percent(fd,"vat_percent",10),
    gift_product: text(fd,"gift_product") || null,
    reels_url: text(fd,"reels_url") || null,
    story_url: text(fd,"story_url") || null,
    reels_done: fd.get("reels_done") === "on",
    story_done: fd.get("story_done") === "on",
    updated_at: new Date().toISOString(),
  };
  const { data: oldPartner } = id
    ? await admin.from("influencers").select("email").eq("id",id).maybeSingle()
    : { data: null };
  // An email transfer must revoke the previous email owner's dashboard access.
  const updatePayload = oldPartner && oldPartner.email?.toLowerCase() !== email
    ? { ...payload, user_id: null, invite_sent_at: null }
    : payload;
  const { error } = id
    ? await admin.from("influencers").update(updatePayload).eq("id",id)
    : await admin.from("influencers").insert(payload);
  if (error) back("Kaydedilemedi: " + (error.code === "23505" ? "E-posta, kod veya bağlantı zaten kayıtlı." : error.message));
  revalidatePath("/yonetim/influencer");
  back("Influencer bilgileri kaydedildi.",true);
}

export async function inviteInfluencer(fd: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  const id = text(fd,"id");
  const { data: influencer } = await admin.from("influencers").select("id,email,status").eq("id",id).maybeSingle();
  if (!influencer || influencer.status !== "active" || !influencer.email || !validEmail(influencer.email))
    return back("Davet göndermeden önce influencer'ı e-posta adresiyle aktif edin.");
  const redirectTo = "https://www.elmastriko.com/auth/callback?next=/influencer";
  // Supabase Auth sends the invitation link; no plaintext password is generated.
  const invited = await admin.auth.admin.inviteUserByEmail(influencer.email,{ redirectTo });
  if (invited.error) {
    const err = invited.error.message.toLowerCase();
    if (!err.includes("already") && !err.includes("registered") && !err.includes("exists"))
      back("Davet gönderilemedi: " + invited.error.message);
    const existing = createPublicClient();
    const otp = await existing.auth.signInWithOtp({ email: influencer.email, options: { shouldCreateUser: false, emailRedirectTo: redirectTo } });
    if (otp.error) back("Giriş bağlantısı gönderilemedi: " + otp.error.message);
  }
  await admin.from("influencers").update({invite_sent_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",id);
  revalidatePath("/yonetim/influencer");
  back("Giriş daveti yalnızca kayıtlı e-posta adresine gönderildi.",true);
}

export async function decideInfluencerPayout(fd: FormData) {
  const { supabase } = await requireAdmin();
  const admin = createAdminClient();
  const requestId = text(fd,"request_id");
  const decision = text(fd,"decision");
  const reference = text(fd,"reference");
  if (!["paid","rejected"].includes(decision)) back("İşlem geçersiz.");
  if (decision === "paid" && !reference) back("Ödendi onayı için banka işlem referansını girin.");
  const { data: payout } = await admin.from("influencer_payout_requests").select("id,amount,influencer_id,status").eq("id",requestId).maybeSingle();
  if (!payout || payout.status !== "pending") return back("Talep bulunamadı veya daha önce işlendi.");
  const { error } = await supabase.rpc("influencer_admin_payout", { p_request: requestId, p_action: decision, p_reference: reference || null });
  if (error) back("Ödeme durumu güncellenemedi: " + error.message);
  const { data: influencer } = await admin.from("influencers").select("email,full_name").eq("id",payout.influencer_id).maybeSingle();
  if (influencer?.email) {
    try {
      await sendMail({
        account: "support", to: influencer.email,
        subject: decision === "paid" ? "Elmas Triko | Komisyon ödemeniz işlendi" : "Elmas Triko | Ödeme talebiniz güncellendi",
        html: `<div style="font-family:Arial,sans-serif;color:#173d31"><h2>Elmas Triko</h2><p>Merhaba ${influencer.full_name.replaceAll("<","&lt;")},</p><p><b>${Number(payout.amount).toLocaleString("tr-TR")} TL</b> tutarındaki komisyon talebinizin durumu: <b>${decision === "paid" ? "Ödendi" : "Reddedildi"}</b>.</p><p>Detaylar için <a href="https://www.elmastriko.com/influencer">influencer panelinize</a> giriş yapabilirsiniz.</p></div>`,
      });
    } catch (error) { console.error("Influencer payout notification could not be sent:", error); }
  }
  revalidatePath("/yonetim/influencer");
  back("Talep durumu güncellendi.",true);
}
