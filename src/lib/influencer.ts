import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type Influencer = {
  id: string; full_name: string; email: string | null; instagram_handle: string | null;
  slug: string; code: string; status: "draft" | "active" | "paused"; user_id: string | null;
  discount_percent: number; commission_percent: number; vat_percent: number;
  gift_product: string | null; reels_url: string | null; story_url: string | null;
  reels_done: boolean; story_done: boolean; invite_sent_at: string | null;
};

export function money(value: number | string | null | undefined) {
  return Number(value || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
}

export async function requireInfluencer() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email || !user.email_confirmed_at) redirect("/influencer/giris");
  const claimed = await supabase.rpc("claim_influencer_access");
  if (claimed.error || !claimed.data) redirect("/influencer/giris?error=" + encodeURIComponent("Bu e-posta adresine tanımlı aktif davet bulunamadı."));
  const admin = createAdminClient();
  const { data: influencer, error } = await admin.from("influencers").select("*").eq("id", claimed.data).eq("status", "active").maybeSingle();
  if (error || !influencer || influencer.email?.toLowerCase() !== user.email.toLowerCase()) redirect("/influencer/giris");
  return { influencer: influencer as Influencer, user, admin, supabase };
}

export function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export function validCode(code: string) {
  return /^[A-Z0-9]{3,32}$/.test(code);
}

export function validSlug(slug: string) {
  return /^[a-z0-9-]{2,40}$/.test(slug);
}
