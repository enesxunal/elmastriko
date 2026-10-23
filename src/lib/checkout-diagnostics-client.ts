"use client";
import { analyticsAllowed, currentAnalyticsSession, readStorage, writeStorage } from "./analytics-identity";
import { UUID, type CheckoutStage, type CheckoutError, type CheckoutField } from "./checkout-diagnostics";
let attempt: { session: string; id: string } | undefined;
export function checkoutAttemptId() {
  if (!analyticsAllowed()) {
    if (attempt?.session !== "private") attempt = {session:"private",id:crypto.randomUUID()};
    return attempt.id;
  }
  const session = currentAnalyticsSession().id;
  if (attempt?.session !== session) {
    let saved: {session?:string;id?:string} = {};
    try { saved = JSON.parse(readStorage("sessionStorage", "et_checkout_attempt") || "{}"); } catch {}
    attempt = { session, id: saved.session === session && typeof saved.id === "string" && UUID.test(saved.id) ? saved.id : crypto.randomUUID() };
    writeStorage("sessionStorage", "et_checkout_attempt", JSON.stringify(attempt));
  }
  return attempt.id;
}
type Pending = { body: string; failures: number };
const queue: Pending[] = [];
let sending: Promise<void> | null = null;
let listening = false;
export function flushCheckoutProgress(beacon = false): Promise<void> {
  if (beacon) {
    // A replay uses the same event ID; the database accepts it only once.
    for (const item of queue) { try { navigator.sendBeacon("/api/checkout/progress", new Blob([item.body], { type: "application/json" })); } catch {} }
    return Promise.resolve();
  }
  if (sending) return sending;
  sending = (async () => {
    while (queue.length) {
      const item = queue[0];
      try {
        const response = await fetch("/api/checkout/progress", { method:"POST", headers:{"Content-Type":"application/json"}, body:item.body, keepalive:true, signal:AbortSignal.timeout(4000) });
        if (!response.ok) throw new Error("progress_unavailable");
        queue.shift();
      } catch {
        if (++item.failures >= 3) queue.shift();
        else { setTimeout(() => { void flushCheckoutProgress(); }, 1000 * item.failures); break; }
      }
    }
  })().finally(() => { sending = null; });
  return sending;
}
export function trackCheckoutProgress(stage: CheckoutStage, code?: CheckoutError, fieldGroup?: string, fieldName?: CheckoutField) {
  try {
    if (!analyticsAllowed()) return;
    const body = JSON.stringify({ stage, code, fieldGroup, fieldName, eventId:crypto.randomUUID(), at:new Date().toISOString(), sessionId:currentAnalyticsSession().id, attemptId:checkoutAttemptId() });
    if (queue.length >= 50) return;
    queue.push({body,failures:0});
    if (!listening) {
      listening = true;
      window.addEventListener("pagehide", () => { void flushCheckoutProgress(true); });
      document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") void flushCheckoutProgress(true); });
    }
    void flushCheckoutProgress();
  } catch { /* Diagnostic collection must never stop checkout. */ }
}
