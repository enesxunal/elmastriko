import "server-only";
import { createAdminClient } from "./supabase/admin";
import { UUID, type CheckoutDiagnosticContext, type CheckoutStage, type CheckoutError, type CheckoutField } from "./checkout-diagnostics";

export async function recordCheckoutEvent(stage: CheckoutStage, context: CheckoutDiagnosticContext = {}, extra: {
  orderId?: string; code?: CheckoutError; fieldGroup?: "contact" | "address" | "invoice" | "card"; isTest?: boolean; providerCode?: string; fieldName?: CheckoutField; eventId?: string; occurredAt?: string;
} = {}) {
  try {
    const admin = createAdminClient();
    if (extra.orderId && !context.attemptId) {
      const { data: previous } = await admin.from("checkout_diagnostics").select("session_id,attempt_id,is_test").eq("order_id", extra.orderId).order("created_at", { ascending: true }).limit(1).abortSignal(AbortSignal.timeout(1500)).maybeSingle();
      if (previous) {
        context = { sessionId: previous.session_id || undefined, attemptId: previous.attempt_id || undefined };
        extra = { ...extra, isTest: extra.isTest ?? previous.is_test };
      }
    }
    const { error } = await admin.from("checkout_diagnostics").insert({
      client_event_id: extra.eventId, occurred_at: extra.occurredAt || new Date().toISOString(), field_name: extra.fieldName,
      session_id: context.sessionId && UUID.test(context.sessionId) ? context.sessionId : null,
      attempt_id: context.attemptId && UUID.test(context.attemptId) ? context.attemptId : null,
      order_id: extra.orderId, stage, error_code: extra.code, field_group: extra.fieldGroup, provider_code: extra.providerCode && /^[a-zA-Z0-9_-]{1,12}$/.test(extra.providerCode) ? extra.providerCode : null, is_test: extra.isTest || false,
    }).abortSignal(AbortSignal.timeout(1500));
    if (error && error.code !== "23505") { console.error("Checkout diagnostics unavailable", error.code); return false; }
    return true;
  } catch { console.error("Checkout diagnostics unavailable"); return false; }
}
