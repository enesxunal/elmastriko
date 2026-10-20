import { createHmac, timingSafeEqual } from "node:crypto";
import { UUID, type CheckoutDiagnosticContext } from "@/lib/checkout-diagnostics";

export const CARD_COOKIE = "et_card_session";
export type CardSession = CheckoutDiagnosticContext & {
  orderId: string; orderNo: string; providerSession: string; amount: number; expires: number; isTest?: boolean;
};
function signature(body: string, secret: string) {
  return createHmac("sha256", secret).update("elmas-card-session-v1:" + body).digest("base64url");
}
export function signCardSession(session: CardSession, secret: string) {
  if (!secret) throw new Error("Card session signing unavailable");
  const body = Buffer.from(JSON.stringify(session)).toString("base64url");
  return body + "." + signature(body, secret);
}
export function readCardSession(token: string | undefined, secret: string): CardSession | null {
  try {
    if (!token || !secret || token.length > 4096) return null;
    const [body, sig, extra] = token.split(".");
    if (extra || !sig) return null;
    const expected = Buffer.from(signature(body, secret));
    const actual = Buffer.from(sig);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    const data = JSON.parse(Buffer.from(body, "base64url").toString()) as CardSession;
    if (!UUID.test(data.orderId) || !data.orderNo || data.orderNo.length > 80 || !data.providerSession || data.providerSession.length > 512 ||
      !Number.isFinite(data.amount) || data.amount <= 0 || !Number.isFinite(data.expires) || data.expires <= Date.now()) return null;
    return data;
  } catch { return null; }
}
export function cardFormAction() {
  const host = (process.env.TOSLA_MODE || "test").toLowerCase() === "live" ? "entegrasyon.tosla.com" : "prepentegrasyon.tosla.com";
  // Never allow a configurable origin to receive cardholder data.
  return `https://${host}/api/Payment/ProcessCardForm`;
}
