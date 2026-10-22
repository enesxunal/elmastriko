/** Normalise Turkish contact numbers for shipping SMS/calls (no user tracking). */
export function normaliseCheckoutPhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  const local = digits.startsWith("90") && digits.length === 12 ? digits.slice(2) :
    digits.startsWith("0") && digits.length === 11 ? digits.slice(1) : digits;
  if (!/^[2-5]\d{9}$/.test(local)) return null;
  return `0${local}`;
}

export const checkoutFieldMessages: Record<string, string> = {
  firstName: "Adınızı yazın.",
  lastName: "Soyadınızı yazın.",
  email: "Geçerli bir e-posta adresi girin.",
  phone: "Telefon numaranızı 05XX XXX XX XX biçiminde girin.",
  addressLine: "Sokak, bina ve daire bilgilerinizi yazın.",
  city: "İlinizi yazın.",
  district: "İlçenizi yazın.",
  companyName: "Firma unvanını yazın.",
  taxOffice: "Vergi dairesini yazın.",
  taxNumber: "Vergi veya T.C. kimlik numarasını yazın.",
  invoiceEmail: "Geçerli bir e-posta adresi girin.",
};
