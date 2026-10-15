"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/mail";
import { requireInfluencer,validEmail,money } from "@/lib/influencer";

export async function sendInfluencerLogin(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  // Do not disclose whether an address belongs to an influencer.
  const message = "/influencer/giris?message=" + encodeURIComponent("E-posta adresiniz davet listesinde varsa giriş bağlantısı gönderildi. Gelen kutunuzu kontrol edin.");
  if (!validEmail(email)) redirect("/influencer/giris?error=" + encodeURIComponent("Geçerli e-posta adresi girin."));
  const admin = createAdminClient();
  const { data: partner } = await admin.from("influencers").select("id").eq("email",email).eq("status","active").maybeSingle();
  if (!partner) redirect(message);
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: "https://www.elmastriko.com/auth/callback?next=/influencer" },
  });
  if (error) console.error("Influencer sign-in link delivery failed:",error.code || "unknown");
  redirect(message);
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
      html: `<div style="font-family:Arial,sans-serif;color:#173d31"><h2>Yeni ödeme talebi</h2><p><strong>${influencer.full_name.replaceAll("<","&lt;")}</strong> (${influencer.code}) için <strong>${money(data.amount)}</strong> komisyon ödeme talebi oluşturuldu.</p><p><a href="https://www.elmastriko.com/yonetim/influencer">Yönetim panelinde görüntüle</a></p></div>`,
    });
  } catch(error) {
    console.error("Influencer payout admin notification failed:",error);
    // The durable database request remains pending and visible to admins.
  }
  revalidatePath("/influencer");
  redirect("/influencer?message=" + encodeURIComponent("Ödeme talebiniz alındı. Onaylandıktan sonra bilgilendirileceksiniz."));
}
