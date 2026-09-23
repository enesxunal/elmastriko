import { createHash, timingSafeEqual } from "crypto";

const TEST_BASE_URL = "https://ent.akodepos.com/api/Payment/";
const LIVE_BASE_URL = "https://api.akodepos.com/api/Payment/";

type ToslaBaseResponse = Record<string, unknown> & {
  ThreeDSessionId?: string;
  OrderId?: string;
  BankResponseCode?: string;
  BankResponseMessage?: string;
};

function config() {
  const mode = (process.env.TOSLA_MODE || "test").toLowerCase();
  const baseUrl = process.env.TOSLA_API_BASE_URL || (mode === "live" ? LIVE_BASE_URL : TEST_BASE_URL);
  return {
    mode,
    baseUrl: baseUrl.endsWith("/") ? baseUrl : baseUrl + "/",
    clientId: process.env.TOSLA_CLIENT_ID || "",
    apiUser: process.env.TOSLA_API_USER || "",
    apiPass: process.env.TOSLA_API_PASS || "",
  };
}

export function isToslaConfigured() {
  const c = config();
  return Boolean(c.clientId && c.apiUser && c.apiPass);
}

function authParams() {
  const c = config();
  if (!isToslaConfigured()) {
    throw new Error("Tosla credentials are not configured.");
  }

  const rnd = String(Math.floor(Math.random() * 10000) + 1);
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  const timeSpan =
    now.getFullYear() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds());

  const hashSource = c.apiPass + c.clientId + c.apiUser + rnd + timeSpan;
  const Hash = createHash("sha512").update(hashSource, "utf8").digest("base64");

  return {
    clientId: c.clientId,
    apiUser: c.apiUser,
    Rnd: rnd,
    timeSpan,
    Hash,
  };
}

async function post<T extends ToslaBaseResponse>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const c = config();
  const response = await fetch(c.baseUrl + endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...authParams(), ...body }),
    cache: "no-store",
  });

  const text = await response.text();
  let data: unknown = text;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    // Keep text for diagnostics.
  }

  if (!response.ok) {
    throw new Error(`Tosla API ${response.status}: ${typeof data === "string" ? data : JSON.stringify(data)}`);
  }

  return data as T;
}

export function validateToslaCallback(payload: Record<string, string>) {
  const c = config();
  if (!c.apiPass || !c.clientId || !c.apiUser) return false;

  const hashParameters = payload.HashParameters;
  const receivedHash = payload.Hash;
  if (!hashParameters || !receivedHash) return false;

  const extra: Record<string, string> = {
    ClientId: c.clientId,
    ApiUser: c.apiUser,
  };

  let source = c.apiPass;
  for (const key of hashParameters.split(",")) {
    source += extra[key] ?? payload[key] ?? "";
  }

  const expected = Buffer.from(createHash("sha512").update(source, "utf8").digest("base64"));
  const actual = Buffer.from(receivedHash);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export const tosla = {
  configured: isToslaConfigured,

  async startThreeD(input: {
    callbackUrl: string;
    orderId: string;
    amountTry: number;
    installmentCount?: number;
  }) {
    const amount = Math.round(input.amountTry * 100);
    return post<ToslaBaseResponse>("threeDPayment", {
      callbackUrl: input.callbackUrl,
      orderId: input.orderId,
      amount,
      currency: 949,
      installmentCount: input.installmentCount || 0,
    });
  },

  async startHostedThreeD(input: {
    callbackUrl: string;
    orderId: string;
    amountTry: number;
    installmentCount?: number;
  }) {
    const amount = Math.round(input.amountTry * 100);
    const response = await post<ToslaBaseResponse>("startPaymentThreeDSession", {
      callbackUrl: input.callbackUrl,
      orderId: input.orderId,
      amount,
      currency: 949,
      installmentCount: input.installmentCount || 0,
    });

    const sessionId = response.ThreeDSessionId;
    return {
      ...response,
      formUrl: config().baseUrl + "ProcessCardForm",
      iframeUrl: sessionId ? config().baseUrl + "threeDSecure/" + encodeURIComponent(sessionId) : null,
    };
  },

  async inquiry(orderId: string) {
    return post<ToslaBaseResponse>("inquiry", { orderId });
  },

  async threeDSessionResult(threeDSessionId: string) {
    return post<ToslaBaseResponse>("threeDSessionResult", { threeDSessionId });
  },

  async refund(orderId: string, amountTry: number) {
    return post<ToslaBaseResponse>("refund", {
      OrderId: orderId,
      Amount: Math.round(amountTry * 100),
    });
  },

  async void(orderId: string) {
    return post<ToslaBaseResponse>("void", { orderId });
  },
};
