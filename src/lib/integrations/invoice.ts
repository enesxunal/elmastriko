const DEFAULT_EINVOICE_BASE_URL = "https://api.nes.com.tr/einvoice";
const DEFAULT_EARCHIVE_BASE_URL = "https://api.nes.com.tr/earchive";
const ELMAS_VKN = "3341342293";
const ELMAS_SENDER_ALIAS = "urn:mail:defaultgb@elmastriko.com.tr";

export type NesDocumentType = "einvoice" | "earchive";

export type NesAliasInfo = {
  alias: string;
  creationTime: string;
  type: "Gb" | "Pk" | string;
};

export type NesUserInfo = {
  identifier: string;
  title: string;
  type?: string;
  firstCreationTime?: string;
  aliases: NesAliasInfo[];
};

export type NesUploadResponse = {
  uuid?: string;
  id?: string | number;
  documentNumber?: string;
  [key: string]: unknown;
};

export type NesDocumentSerie = {
  id: string;
  serie: string;
  isDefault: boolean;
  isPortal: boolean;
  activeStatus: string;
  counters: Array<{
    id: string;
    year: number;
    nextNumber: string;
    lastIssueDate?: string | null;
  }>;
};

function config() {
  return {
    apiKey: process.env.NES_API_KEY || "",
    einvoiceBaseUrl: (process.env.NES_EINVOICE_BASE_URL || DEFAULT_EINVOICE_BASE_URL).replace(/\/$/, ""),
    earchiveBaseUrl: (process.env.NES_EARCHIVE_BASE_URL || DEFAULT_EARCHIVE_BASE_URL).replace(/\/$/, ""),
    senderAlias: process.env.NES_EINVOICE_SENDER_ALIAS || ELMAS_SENDER_ALIAS,
    sourceApp: process.env.NES_SOURCE_APP || "ELMAS_TRIKO_WEB",
  };
}

export function isNesConfigured() {
  return Boolean(config().apiKey);
}

function baseUrl(type: NesDocumentType) {
  const c = config();
  return type === "einvoice" ? c.einvoiceBaseUrl : c.earchiveBaseUrl;
}

async function request<T>(
  type: NesDocumentType,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const c = config();

  if (!c.apiKey) {
    throw new Error("NES_API_KEY is not configured.");
  }

  const response = await fetch(baseUrl(type) + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${c.apiKey}`,
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  const text = await response.text();
  let payload: unknown = text;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    // Keep text response for diagnostics.
  }

  if (!response.ok) {
    throw new Error(
      `NES ${type} API ${response.status}: ${typeof payload === "string" ? payload : JSON.stringify(payload)}`,
    );
  }

  return payload as T;
}

async function uploadUbl(
  type: NesDocumentType,
  input: {
    xml: string | Uint8Array;
    sourceRecordId: string;
    receiverAlias?: string;
    directSend?: boolean;
    previewType?: string;
  },
) {
  const c = config();
  const form = new FormData();
  const filePart: BlobPart =
    typeof input.xml === "string"
      ? input.xml
      : input.xml.buffer.slice(
          input.xml.byteOffset,
          input.xml.byteOffset + input.xml.byteLength,
        ) as ArrayBuffer;

  form.set("File", new Blob([filePart], { type: "application/xml" }), `${input.sourceRecordId}.xml`);
  form.set("IsDirectSend", String(input.directSend ?? true));
  form.set("PreviewType", input.previewType || "None");
  form.set("SourceApp", c.sourceApp);
  form.set("SourceAppRecordId", input.sourceRecordId);
  form.set("AutoSaveCompany", "true");

  if (type === "einvoice") {
    form.set("SenderAlias", c.senderAlias);
    if (input.receiverAlias) form.set("ReceiverAlias", input.receiverAlias);
  }

  return request<NesUploadResponse>(type, "/v1/uploads/document", {
    method: "POST",
    body: form,
  });
}

export const invoiceIntegration = {
  provider: "NES Portal",
  status: "configured-adapter" as const,
  configured: isNesConfigured,

  async healthCheck() {
    const [einvoiceTags, earchiveTags] = await Promise.all([
      request<unknown[]>("einvoice", "/v1/tags"),
      request<unknown[]>("earchive", "/v1/tags"),
    ]);

    return {
      einvoice: true,
      earchive: true,
      einvoiceTags,
      earchiveTags,
    };
  },

  async getElmasCompanyInfo() {
    return request<NesUserInfo>(
      "einvoice",
      `/v1/users/${encodeURIComponent(ELMAS_VKN)}/All`,
    );
  },

  async getDefaultSeries(type: NesDocumentType, year = new Date().getFullYear()) {
    const series = await request<NesDocumentSerie[]>(
      type,
      "/v1/definitions/series?status=Active&source=All",
    );
    const selected = series.find(item => item.isDefault) || series[0];
    if (!selected) throw new Error(`NES ${type}: aktif belge serisi bulunamadı.`);
    const counter = selected.counters.find(item => item.year === year);
    if (!counter) throw new Error(`NES ${type}: ${year} belge sayacı bulunamadı.`);
    const invoiceNumber = selected.serie + String(year) + String(counter.nextNumber).padStart(9, "0");
    return { series: selected, counter, invoiceNumber };
  },

  async lookupTaxpayer(identifier: string) {
    try {
      const user = await request<NesUserInfo>(
        "einvoice",
        `/v1/users/${encodeURIComponent(identifier)}/All`,
      );
      const receiverAlias =
        user.aliases.find(alias => alias.type === "Pk")?.alias ||
        user.aliases[0]?.alias ||
        null;

      return {
        isEInvoiceTaxpayer: true,
        receiverAlias,
        user,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes("API 404")) {
        return {
          isEInvoiceTaxpayer: false,
          receiverAlias: null,
          user: null,
        };
      }
      throw error;
    }
  },

  async uploadEInvoice(input: {
    xml: string | Uint8Array;
    orderId: string;
    receiverAlias?: string;
    directSend?: boolean;
  }) {
    return uploadUbl("einvoice", {
      xml: input.xml,
      sourceRecordId: input.orderId,
      receiverAlias: input.receiverAlias,
      directSend: input.directSend,
    });
  },

  async uploadEArchive(input: {
    xml: string | Uint8Array;
    orderId: string;
    directSend?: boolean;
  }) {
    return uploadUbl("earchive", {
      xml: input.xml,
      sourceRecordId: input.orderId,
      directSend: input.directSend,
    });
  },

  async getEInvoicePdf(uuid: string) {
    return request<ArrayBuffer>(
      "einvoice",
      `/v1/outgoing/invoices/${encodeURIComponent(uuid)}/pdf`,
      { headers: { Accept: "application/pdf" } },
    );
  },

  async getEArchivePdf(uuid: string) {
    return request<ArrayBuffer>(
      "earchive",
      `/v1/invoices/${encodeURIComponent(uuid)}/pdf`,
      { headers: { Accept: "application/pdf" } },
    );
  },
};
