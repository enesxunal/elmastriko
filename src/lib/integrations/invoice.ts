export type InvoicePayload = {
  orderId: string;
  customerType: "individual" | "company";
  customerName: string;
  taxNumber?: string;
  taxOffice?: string;
  email: string;
  address: string;
  total: number;
};

export const invoiceIntegration = {
  provider: "NES Portal",
  status: "adapter-ready" as const,
  async createInvoice(payload: InvoicePayload) {
    void payload;
    throw new Error("NES Portal credentials/API details are not configured yet.");
  },
};
