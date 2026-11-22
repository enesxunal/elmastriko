// Türkiye saatiyle 22 Kasım - 30 Kasım 2026 (dahil).
export const BLACK_FRIDAY_START_MS = Date.parse("2026-11-22T00:00:00+03:00");
export const BLACK_FRIDAY_END_MS = Date.parse("2026-12-01T00:00:00+03:00");
export const BLACK_FRIDAY_RATE = 0.25;
export function isBlackFridayActive(now = Date.now()): boolean {
  return now >= BLACK_FRIDAY_START_MS && now < BLACK_FRIDAY_END_MS;
}
export function blackFridayDiscount(subtotal: number): number {
  return Math.round(subtotal * BLACK_FRIDAY_RATE * 100) / 100;
}
export function blackFridayPrice(price: number | null): number | null {
  return price === null ? null : Math.round(price * (1 - BLACK_FRIDAY_RATE) * 100) / 100;
}
