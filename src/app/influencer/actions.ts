"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/mail";
import { requireInfluencer, validEmail, money, hasPasswordAuthentication } from "@/lib/influencer";
import { authErrorTR } from "@/lib/auth-error-tr";

const loginPath = "/influencer/giris";
const resetPath = "/influencer/sifremi-unuttum";
const successResetMessage = "E-posta adresiniz aktif iş birliği listemizdeyse şifre yenileme bağlantısı gönderildi. Gelen kutunuzu ve spam klasörünü kontrol edin.";
const loginError = (value: string) => loginPath + "?error=" + encodeURIComponent(value);

export async function signInInfluencer(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (!validEmail(email) || !password) redirect(loginError("E-posta ve şifre girin."));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user?.email || !data.user.email_confirmed_at) {
    await supabase.auth.signOut();
    redirect(loginError(error ? authErrorTR(error) : "E-posta adresinizi doğrulayın."));
  }
  if (!await hasPasswordAuthentication(supabase)) {
    await supabase.auth.signOut();
    redirect(loginError("Giriş için e-posta ve şifre kullanın."));
  }
  const { data: influencerId, error: accessError } = await supabase.rpc("claim_influencer_access");
  if (accessError || !influencerId) {
    await supabase.auth.signOut();
    redirect(loginError("Bu e-posta adresine tanımlı aktif influencer hesabı bulunamadı."));
  }
  redirect("/influencer");
}

/** Admin-invited and active addresses only. Never leak whether an email is registered. */
export async function requestInfluencerPasswordReset(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!validEmail(email)) redirect(resetPath + "?error=" + encodeURIComponent("Geçerli bir e-posta adresi girin."));
  const message = resetPath + "?message=" + encodeURIComponent(successResetMessage);
  const admin = createAdminClient();
  const { data: partner, error: lookupError } = await admin.from("influencers")
    .select("email,full_name").eq("email", email).eq("status", "active").maybeSingle();
  if (lookupError) {
    console.error("Influencer recovery lookup failed", lookupError.code);
    redirect(resetPath + "?error=" + encodeURIComponent("Şifre sıfırlama şu anda kullanılamıyor."));
  }
  if (!partner?.email) redirect(message);

  const { data, error } = await admin.auth.admin.generateLink({ type: "recovery", email: partner.email });
  if (error || !data?.properties.hashed_token) {
    console.error("Influencer recovery token unavailable", error?.code || "empty");
    redirect(message);
  }
  const url = new URL("/influencer/sifre-olustur", "https://www.elmastriko.com");
  url.searchParams.set("token_hash", data.properties.hashed_token);
  url.searchParams.set("type", "recovery");
  try {
    await sendMail({
      account: "support", to: partner.email,
      subject: "Elmas Triko | Influencer şifre yenileme",
      html: `<div style="font-family:Arial,sans-serif;color:#173d31;max-width:580px;margin:auto"><h2>Elmas Triko · Influencer</h2><p>Merhaba ${escapeHtml(partner.full_name)},</p><p>Şifrenizi yeniden belirlemek için aşağıdaki bağlantıyı açın. Talepte bulunmadıysanız bu e-postayı dikkate almayın.</p><p><a href="${escapeHtml(url.toString())}" style="display:inline-block;background:#173d31;color:white;padding:14px 22px;text-decoration:none;border-radius:8px">Yeni şifre belirle</a></p><p style="font-size:12px;color:#65766c">Bağlantı tek kullanımlıktır ve sınırlı süre geçerlidir. Şifrenizi kimseyle paylaşmayın.</p></div>`,
    });
  } catch (mailError) {
    console.error("Influencer password reset email not sent", mailError);
    redirect(message);
  }
  redirect(message);
}

function escapeHtml(value: string): string {
  return value.replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

export type PasswordFormState = { error: string };
export async function setInfluencerPassword(_state: PasswordFormState, formData: FormData): Promise<PasswordFormState> {
  const tokenHash = String(formData.get("token_hash") || "");
  const type = String(formData.get("type") || "");
  const password = String(formData.get("password") || "");
  const confirmation = String(formData.get("confirm_password") || "");

  if (!/^[a-zA-Z0-9_-]{15,300}$/.test(tokenHash) || !["invite", "recovery"].includes(type))
    return { error: "Bağlantı geçersiz. Yeni bir davet veya şifre sıfırlama bağlantısı isteyin." };
  if (password.length < 10 || password.length > 128)
    return { error: "Şifreniz 10-128 karakter uzunluğunda olmalı." };
  if (password !== confirmation) return { error: "Şifreler eşleşmiyor." };

  // The OTP is consumed only upon form submission (email scanners cannot consume the invitation by visiting the URL).
  const supabase = await createClient();
  const verified = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as "invite" | "recovery" });
  if (verified.error || !verified.data.user?.email || !verified.data.user.email_confirmed_at)
    return { error: "Bağlantı geçersiz veya süresi dolmuş. Yöneticiden yeni davet isteyin." };

  const email = verified.data.user.email.toLowerCase();
  const admin = createAdminClient();
  const { data: influencer } = await admin.from("influencers").select("id,user_id")
    .eq("email", email).eq("status", "active").maybeSingle();
  if (!influencer || (influencer.user_id && influencer.user_id !== verified.data.user.id)) {
    await supabase.auth.signOut();
    return { error: "Bu e-posta adresine tanımlı aktif davet bulunamadı." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    await supabase.auth.signOut();
    return { error: authErrorTR(error) + " Yeni bir şifre belirleme bağlantısı isteyin." };
  }
  // The invitation/recovery session must NOT access the dashboard. Sign in using the newly set password.
  await supabase.auth.signOut();
  redirect(loginPath + "?message=" + encodeURIComponent("Şifreniz oluşturuldu. Artık e-posta adresiniz ve şifrenizle giriş yapabilirsiniz."));
}

export async function signOutInfluencer() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(loginPath + "?message=" + encodeURIComponent("Çıkış yapıldı."));
}

export async function requestInfluencerPayout() {
  const { influencer, supabase } = await requireInfluencer();
  const { data, error } = await supabase.rpc("influencer_request_payout");
  if (error) {
    const reason = error.message.includes("minimum_payout_1000") ? "Ödeme talebi için en az 1.000 TL çekilebilir bakiyeniz olmalı." : "Talep oluşturulamadı. Lütfen tekrar deneyin.";
    redirect("/influencer?error=" + encodeURIComponent(reason));
  }
  if (!data?.id) redirect("/influencer?error="+encodeURIComponent("Talep kaydedilemedi."));
  try {
    await sendMail({
      account: "support", to: "satis@elmastriko.com",
      subject: "Elmas Triko | Yeni influencer ödeme talebi",
      html: `<div style="font-family:Arial,sans-serif;color:#173d31"><h2>Yeni ödeme talebi</h2><p><strong>${escapeHtml(influencer.full_name)}</strong> (${escapeHtml(influencer.code)}) için <strong>${money(data.amount)}</strong> komisyon ödeme talebi oluşturuldu.</p><p><a href="https://www.elmastriko.com/yonetim/influencer">Yönetim panelinde görüntüle</a></p></div>`,
    });
  } catch(error) {
    console.error("Influencer payout admin notification failed:",error);
  }
  revalidatePath("/influencer");
  redirect("/influencer?message=" + encodeURIComponent("Ödeme talebiniz alındı. Onaylandıktan sonra bilgilendirileceksiniz."));
}
