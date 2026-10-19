"use client";
const PIXEL_ID = "1474952207810125";
declare global { interface Window { fbq?: (...args: unknown[]) => void } }
export function metaTrack(event: "ViewContent" | "AddToCart" | "InitiateCheckout", details: Record<string, unknown>) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", event, details, { eventID: crypto.randomUUID() });
}
export { PIXEL_ID };
