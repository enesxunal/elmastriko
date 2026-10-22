import "server-only";
import { createClient } from "@/lib/supabase/server";

type CheckoutCustomerDetails = {
  email: string;
  phone: string;
  shipping: { fullName: string; title?: string; city: string; district: string; postalCode?: string; addressLine: string };
  saveToProfile?: boolean;
};

/**
 * Only the authenticated shopper, after deliberately opting in, can save
 * checkout details to their own account. Guest emails are never used to link
 * orders to somebody else's account. Failure cannot block an existing order.
 */
export async function saveCheckoutProfile(supabase: Awaited<ReturnType<typeof createClient>>, payload: CheckoutCustomerDetails) {
  if (payload.saveToProfile !== true) return;
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.id || !user.email || user.email.toLowerCase() !== payload.email.trim().toLowerCase()) return;

  const { data: profile, error: profileReadError } = await supabase.from("profiles")
    .select("id,full_name,phone").eq("id", user.id).maybeSingle();
  if (profileReadError) { console.error("Checkout profile read unavailable", profileReadError.code); return; }
  if (profile) {
    const name = payload.shipping.fullName.trim();
    const phone = payload.phone.trim();
    const { error } = await supabase.from("profiles").update({
      full_name: name || profile.full_name,
      phone: phone || profile.phone,
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);
    if (error) console.error("Checkout profile update unavailable", error.code);
  }

  const { data: addresses, error: addressReadError } = await supabase.from("addresses")
    .select("id,city,district,address_line")
    .eq("user_id", user.id).limit(100);
  if (addressReadError) { console.error("Checkout addresses read unavailable", addressReadError.code); return; }
  const normalized = (text: string) => text.trim().toLocaleLowerCase("tr-TR").replace(/\s+/g, " ");
  const matched = (addresses || []).some(address =>
    normalized(address.city) === normalized(payload.shipping.city) &&
    normalized(address.district) === normalized(payload.shipping.district) &&
    normalized(address.address_line) === normalized(payload.shipping.addressLine));
  if (matched) return;

  const { error } = await supabase.from("addresses").insert({
    user_id: user.id,
    title: payload.shipping.title?.trim() || "Sipariş adresim",
    full_name: payload.shipping.fullName.trim(),
    phone: payload.phone.trim(),
    city: payload.shipping.city.trim(),
    district: payload.shipping.district.trim(),
    postal_code: payload.shipping.postalCode?.trim() || null,
    address_line: payload.shipping.addressLine.trim(),
    is_default: (addresses || []).length === 0,
  });
  if (error) console.error("Checkout address save unavailable", error.code);
}
