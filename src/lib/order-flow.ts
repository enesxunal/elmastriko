export type OrderStatus =
  | "draft"
  | "awaiting_payment"
  | "paid"
  | "invoice_pending"
  | "ready_to_ship"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export const ORDER_FLOW: OrderStatus[] = [
  "draft",
  "awaiting_payment",
  "paid",
  "invoice_pending",
  "ready_to_ship",
  "shipped",
  "delivered",
];
