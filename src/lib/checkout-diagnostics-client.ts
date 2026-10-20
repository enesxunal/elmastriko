"use client";
import { analyticsAllowed, currentAnalyticsSession } from "./analytics-identity";
import type { CheckoutStage, CheckoutError } from "./checkout-diagnostics";
let attempt: string | undefined;
export function checkoutAttemptId() { return attempt ||= crypto.randomUUID(); }
export function trackCheckoutProgress(stage: CheckoutStage, code?: CheckoutError, fieldGroup?: string) {
  try {
    if (!analyticsAllowed()) return;
    const body = JSON.stringify({ stage, code, fieldGroup, sessionId: currentAnalyticsSession().id, attemptId: checkoutAttemptId() });
    if (navigator.sendBeacon("/api/checkout/progress", new Blob([body], { type: "application/json" }))) return;
    void fetch("/api/checkout/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => undefined);
  } catch { /* Diagnostic collection must never stop checkout. */ }
}
