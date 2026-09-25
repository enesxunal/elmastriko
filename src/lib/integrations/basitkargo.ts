const DEFAULT_BASE_URL = "https://basitkargo.com/api";

export type BasitKargoPackage = {
  height: number;
  width: number;
  depth: number;
  weight: number;
};

export type BasitKargoOrderItem = {
  name: string;
  code?: string | null;
  quantity: number;
};

export type BasitKargoRecipient = {
  name: string;
  phone: string;
  email?: string | null;
  city: string;
  town: string;
  address: string;
};

export type BasitKargoShipmentInput = {
  orderNo: string;
  items: BasitKargoOrderItem[];
  packages: BasitKargoPackage[];
  recipient: BasitKargoRecipient;
  handlerCode?: string;
};

export type BasitKargoShipmentResponse = {
  id: string;
  barcode?: string | null;
  type?: string;
  status?: string;
  validationFailed?: boolean;
  createdTime?: string;
  handlerShipmentCode?: string | null;
  [key: string]: unknown;
};

function getConfig() {
  return {
    baseUrl: (process.env.BASITKARGO_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, ""),
    token: process.env.BASITKARGO_API_TOKEN || "",
    addressId: process.env.BASITKARGO_ADDRESS_ID || "",
    brandId: process.env.BASITKARGO_BRAND_ID || "",
    handlerCode: process.env.BASITKARGO_HANDLER_CODE || "ECONOMIC",
  };
}

export function isBasitKargoConfigured() {
  return Boolean(getConfig().token);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const config = getConfig();
  if (!config.token) {
    throw new Error("BASITKARGO_API_TOKEN is not configured.");
  }

  const response = await fetch(config.baseUrl + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  const body = await response.text();
  let payload: unknown = body;
  try {
    payload = body ? JSON.parse(body) : null;
  } catch {
    // Keep non-JSON body for diagnostics.
  }

  if (!response.ok) {
    const retryAfter = response.headers.get("retry-after");
    const suffix = retryAfter ? ` Retry-After: ${retryAfter}s.` : "";
    throw new Error(`BasitKargo API ${response.status}: ${typeof payload === "string" ? payload : JSON.stringify(payload)}.${suffix}`);
  }

  return payload as T;
}

export const basitKargo = {
  configured: isBasitKargoConfigured,

  async healthCheck() {
    const [handlers, balance, brands, addresses] = await Promise.all([
      this.listHandlers(),
      this.balance(),
      this.brands(),
      this.addresses(),
    ]);

    return { handlers, balance, brands, addresses };
  },

  async listHandlers() {
    return request<Array<{ name: string; code: string; logo?: string }>>("/handlers");
  },

  async quotePackages(packages: BasitKargoPackage[]) {
    return request<Array<{ desiKg: number; handlerCode: string; price: number }>>("/handlers/fee/packages", {
      method: "POST",
      body: JSON.stringify(packages),
    });
  },

  async balance() {
    return request<number>("/firm/balance");
  },

  async brands() {
    return request<Array<{ id: string; name: string; status?: string }>>("/firm/brand");
  },

  async addresses() {
    return request<Array<{ id: string; name: string; city?: string; town?: string }>>("/firm/address");
  },

  async createShipment(input: BasitKargoShipmentInput) {
    const config = getConfig();
    const payload = {
      handlerCode: input.handlerCode || config.handlerCode,
      type: "OUTGOING",
      content: {
        name: `Elmas Triko ${input.orderNo}`,
        code: input.orderNo,
        items: input.items.map(item => ({
          name: item.name,
          code: item.code || undefined,
          quantity: String(item.quantity),
        })),
        packages: input.packages,
      },
      client: {
        name: input.recipient.name,
        phone: input.recipient.phone,
        email: input.recipient.email || undefined,
        city: input.recipient.city,
        town: input.recipient.town,
        address: input.recipient.address,
      },
      addressId: config.addressId || undefined,
      brandId: config.brandId || undefined,
    };

    return request<BasitKargoShipmentResponse>("/v2/order/barcode", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getOrder(id: string) {
    return request<BasitKargoShipmentResponse>(`/v2/order/${encodeURIComponent(id)}`);
  },

  async getByBarcode(barcode: string) {
    return request<BasitKargoShipmentResponse>(`/v2/order/barcode/${encodeURIComponent(barcode)}`);
  },

  async getByTrackingCode(code: string) {
    return request<BasitKargoShipmentResponse>(`/v2/order/handler-shipment-code/${encodeURIComponent(code)}`);
  },

  async cancelBarcode(barcode: string) {
    return request<unknown>(`/order/barcode/${encodeURIComponent(barcode)}`, { method: "DELETE" });
  },

  async createReturn(barcode: string) {
    return request<unknown>(`/v2/order/return/barcode/${encodeURIComponent(barcode)}`);
  },

  labelUrl(id: string) {
    const config = getConfig();
    return `${config.baseUrl}/label/svg/${encodeURIComponent(id)}`;
  },
};
