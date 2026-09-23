import { isToslaConfigured, tosla } from "./tosla";

export type PaymentProvider = "tosla";

export type PaymentIntentInput = {
  orderId: string;
  orderNo: string;
  amount: number;
  currency: "TRY";
  email: string;
  callbackUrl: string;
  installmentCount?: number;
};

export const paymentIntegration = {
  provider: "tosla" as PaymentProvider,
  configured: isToslaConfigured,
  status: isToslaConfigured() ? "configured" as const : "waiting_credentials" as const,

  async createPayment(input: PaymentIntentInput) {
    if (input.currency !== "TRY") {
      throw new Error("Tosla only supports TRY in this integration.");
    }

    return tosla.startHostedThreeD({
      callbackUrl: input.callbackUrl,
      orderId: input.orderNo,
      amountTry: input.amount,
      installmentCount: input.installmentCount,
    });
  },
};
