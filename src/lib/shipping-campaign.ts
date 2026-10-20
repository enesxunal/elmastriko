export const SHIPPING_CAMPAIGN_START = "2026-10-21T00:00:00+03:00";
export const SHIPPING_CAMPAIGN_END = "2026-11-01T00:00:00+03:00";
export const SHIPPING_CAMPAIGN_LABEL = "31 Ekim sonuna kadar tüm siparişlerde ücretsiz kargo";
export const POPUP_COOLDOWN = 24 * 60 * 60 * 1000;
export const POPUP_STORAGE_KEY = "et_shipping_oct2026_seen";

export function isShippingCampaignActive(now = Date.now()) {
  return now >= Date.parse(SHIPPING_CAMPAIGN_START) && now < Date.parse(SHIPPING_CAMPAIGN_END);
}
export function canShowShippingPopup(lastSeen: number, now = Date.now()) {
  return isShippingCampaignActive(now) && (!Number.isFinite(lastSeen) || lastSeen <= 0 || now - lastSeen >= POPUP_COOLDOWN);
}
