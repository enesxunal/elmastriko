/** A created order is not a sale until payment is confirmed. */
export const NON_SALE_ORDER_STATUSES = ["cancelled", "refunded", "returned"];
export const NON_SALE_ORDER_STATUS_FILTER = `(${NON_SALE_ORDER_STATUSES.join(",")})`;

type ReportableOrder = {
  status: string;
  payment_status: string;
  is_test?: boolean;
  archived_at?: string | null;
};

export function isPaidSale(order: ReportableOrder): boolean {
  return !order.is_test && !order.archived_at && order.payment_status === "paid"
    && !NON_SALE_ORDER_STATUSES.includes(order.status);
}
