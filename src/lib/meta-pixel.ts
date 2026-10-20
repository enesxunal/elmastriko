"use client";
import { analyticsAllowed } from "./analytics-identity";
const PIXEL_ID = "1474952207810125";
type Pixel = ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue?: unknown[][]; push?: Pixel; loaded?: boolean; version?: string };
declare global { interface Window { fbq?: Pixel; _fbq?: Pixel } }
const sent = new Set<string>();
function ensurePixel() {
  if (window.fbq) return window.fbq;
  const pixel: Pixel = function (...args) { if (pixel.callMethod) pixel.callMethod(...args); else pixel.queue!.push(args); };
  pixel.queue = []; pixel.push = pixel; pixel.loaded = true; pixel.version = "2.0";
  window.fbq = pixel; window._fbq ||= pixel;
  const script = document.createElement("script");
  script.async = true; script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
  pixel("init", PIXEL_ID);
  return pixel;
}
export function metaTrack(event: "PageView" | "ViewContent" | "AddToCart" | "InitiateCheckout", details: Record<string, unknown>, eventId: string) {
  try {
    if (!analyticsAllowed() || !eventId || sent.has(event + ":" + eventId)) return false;
    const pixel = ensurePixel();
    pixel("track", event, details, { eventID: eventId });
    sent.add(event + ":" + eventId);
    if (sent.size > 2000) sent.delete(sent.values().next().value!);
    return true;
  } catch { return false; }
}
export { PIXEL_ID };
