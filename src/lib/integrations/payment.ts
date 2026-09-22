export type PaymentProvider = "pending";

export type PaymentIntentInput = {
  orderId: string;
  amount: number;
  currency: "TRY";
  email: string;
};

export const paymentIntegration = {
  provider: "pending" as PaymentProvider,
  status: "waiting-provider-selection" as const,
  async createPayment(input: PaymentIntentInput) {
    void input;
    throw new Error("Payment provider has not been selected yet.");
  },
};
