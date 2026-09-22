"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

export async function signIn(formData: FormData) {
  const email = value(formData, "email");
  const password = String(formData.get("password") || "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/hesabim?error=" + encodeURIComponent(error.message));
  redirect("/hesabim");
}

export async function signUp(formData: FormData) {
  const fullName = value(formData, "full_name");
  const email = value(formData, "email");
  const password = String(formData.get("password") || "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
  if (error) redirect("/hesabim?error=" + encodeURIComponent(error.message));
  redirect("/hesabim?message=" + encodeURIComponent("Kaydınız oluşturuldu. E-posta doğrulaması açıksa gelen kutunuzu kontrol edin."));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/hesabim");
}

export async function requestPasswordReset(formData: FormData) {
  const email = value(formData, "email");
  if (!email) redirect("/hesabim?error=" + encodeURIComponent("E-posta adresi gerekli."));

  const headerStore = await headers();
  const origin = headerStore.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "https://elmastriko.vercel.app";
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + "/hesabim" });
  if (error) redirect("/hesabim?error=" + encodeURIComponent(error.message));
  redirect("/hesabim?message=" + encodeURIComponent("Şifre yenileme bağlantısı e-posta adresinize gönderildi."));
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/hesabim");

  const { error } = await supabase.from("profiles").update({
    full_name: value(formData, "full_name"),
    phone: value(formData, "phone") || null,
    updated_at: new Date().toISOString(),
  }).eq("id", user.id);

  if (error) redirect("/hesabim?error=" + encodeURIComponent(error.message));
  revalidatePath("/hesabim");
  redirect("/hesabim?message=" + encodeURIComponent("Profil bilgileriniz güncellendi."));
}

export async function addAddress(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/hesabim");

  const row = {
    user_id: user.id,
    title: value(formData, "title"),
    full_name: value(formData, "full_name"),
    phone: value(formData, "phone") || null,
    city: value(formData, "city"),
    district: value(formData, "district"),
    postal_code: value(formData, "postal_code") || null,
    address_line: value(formData, "address_line"),
    is_default: formData.get("is_default") === "on",
  };

  if (!row.title || !row.full_name || !row.city || !row.district || !row.address_line) {
    redirect("/hesabim?error=" + encodeURIComponent("Adres alanlarını eksiksiz doldurun."));
  }

  if (row.is_default) await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
  const { error } = await supabase.from("addresses").insert(row);
  if (error) redirect("/hesabim?error=" + encodeURIComponent(error.message));
  revalidatePath("/hesabim");
}

export async function deleteAddress(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/hesabim");
  const id = value(formData, "id");
  if (id) await supabase.from("addresses").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/hesabim");
}
