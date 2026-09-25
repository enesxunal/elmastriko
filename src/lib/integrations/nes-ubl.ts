import { company } from "@/lib/company";

export type NesInvoiceLine = {
  name: string;
  sku?: string | null;
  quantity: number;
  grossUnitPrice: number;
};

export type NesInvoiceAddress = {
  fullName: string;
  companyName?: string | null;
  taxOffice?: string | null;
  taxNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  city: string;
  district: string;
  postalCode?: string | null;
  addressLine: string;
};

export type NesUblInput = {
  invoiceNumber: string;
  uuid: string;
  issueDate: string;
  issueTime: string;
  profileId: "TEMELFATURA" | "TICARIFATURA" | "EARSIVFATURA";
  currency?: string;
  orderNo: string;
  orderDate: string;
  billing: NesInvoiceAddress;
  lines: NesInvoiceLine[];
  shippingFee?: number;
  vatRate: number;
  shippingVatRate?: number;
  websiteUrl?: string;
  paymentMethod?: string;
};

function x(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
function money(value: number) { return value.toFixed(2); }
function netFromGross(gross: number, rate: number) { return gross / (1 + rate / 100); }

function identification(identifier?: string | null) {
  if (!identifier) return "";
  const scheme = identifier.length === 11 ? "TCKN" : "VKN";
  return '<cac:PartyIdentification><cbc:ID schemeID="' + scheme + '">' + x(identifier) + '</cbc:ID></cac:PartyIdentification>';
}

function supplierParty() {
  return [
    "<cac:AccountingSupplierParty><cac:Party>",
    "<cbc:WebsiteURI>https://www.elmastriko.com</cbc:WebsiteURI>",
    '<cac:PartyIdentification><cbc:ID schemeID="VKN">' + x(company.taxNumber) + "</cbc:ID></cac:PartyIdentification>",
    '<cac:PartyIdentification><cbc:ID schemeID="MERSISNO">' + x(company.mersis) + "</cbc:ID></cac:PartyIdentification>",
    "<cac:PartyName><cbc:Name>" + x(company.legalName) + "</cbc:Name></cac:PartyName>",
    "<cac:PostalAddress><cbc:StreetName>" + x(company.address) + "</cbc:StreetName><cbc:CitySubdivisionName>Bağcılar</cbc:CitySubdivisionName><cbc:CityName>İstanbul</cbc:CityName><cac:Country><cbc:Name>Türkiye</cbc:Name></cac:Country></cac:PostalAddress>",
    "<cac:PartyTaxScheme><cac:TaxScheme><cbc:Name>" + x(company.taxOffice) + "</cbc:Name></cac:TaxScheme></cac:PartyTaxScheme>",
    "</cac:Party></cac:AccountingSupplierParty>",
  ].join("");
}

function customerParty(a: NesInvoiceAddress) {
  const name = a.companyName || a.fullName;
  const parts = !a.companyName ? a.fullName.trim().split(/\s+/) : [];
  const firstName = parts.length > 1 ? parts.slice(0, -1).join(" ") : (parts[0] || "");
  const familyName = parts.length > 1 ? (parts.at(-1) || "") : "";
  const contact = a.phone || a.email
    ? "<cac:Contact>" + (a.phone ? "<cbc:Telephone>" + x(a.phone) + "</cbc:Telephone>" : "") + (a.email ? "<cbc:ElectronicMail>" + x(a.email) + "</cbc:ElectronicMail>" : "") + "</cac:Contact>"
    : "";
  const person = !a.companyName
    ? "<cac:Person><cbc:FirstName>" + x(firstName) + "</cbc:FirstName>" + (familyName ? "<cbc:FamilyName>" + x(familyName) + "</cbc:FamilyName>" : "") + "</cac:Person>"
    : "";
  return [
    "<cac:AccountingCustomerParty><cac:Party>",
    identification(a.taxNumber),
    "<cac:PartyName><cbc:Name>" + x(name) + "</cbc:Name></cac:PartyName>",
    "<cac:PostalAddress><cbc:StreetName>" + x(a.addressLine) + "</cbc:StreetName><cbc:CitySubdivisionName>" + x(a.district) + "</cbc:CitySubdivisionName><cbc:CityName>" + x(a.city) + "</cbc:CityName>" + (a.postalCode ? "<cbc:PostalZone>" + x(a.postalCode) + "</cbc:PostalZone>" : "") + "<cac:Country><cbc:Name>Türkiye</cbc:Name></cac:Country></cac:PostalAddress>",
    a.taxNumber ? "<cac:PartyTaxScheme><cac:TaxScheme><cbc:Name>" + x(a.taxOffice || "") + "</cbc:Name></cac:TaxScheme></cac:PartyTaxScheme>" : "",
    contact,
    person,
    "</cac:Party></cac:AccountingCustomerParty>",
  ].join("");
}

function taxSubtotal(currency: string, taxable: number, tax: number, rate: number) {
  return "<cac:TaxSubtotal><cbc:TaxableAmount currencyID=\"" + currency + "\">" + money(taxable) + "</cbc:TaxableAmount><cbc:TaxAmount currencyID=\"" + currency + "\">" + money(tax) + "</cbc:TaxAmount><cbc:Percent>" + rate + "</cbc:Percent><cac:TaxCategory><cac:TaxScheme><cbc:Name>KDV</cbc:Name><cbc:TaxTypeCode>0015</cbc:TaxTypeCode></cac:TaxScheme></cac:TaxCategory></cac:TaxSubtotal>";
}

export function buildNesUblInvoice(input: NesUblInput) {
  const currency = input.currency || "TRY";
  const vatRate = input.vatRate;
  const shippingVatRate = input.shippingVatRate ?? vatRate;
  const productGross = input.lines.reduce((sum, line) => sum + line.grossUnitPrice * line.quantity, 0);
  const shippingGross = Math.max(0, input.shippingFee || 0);
  const productNet = input.lines.reduce((sum, line) => sum + netFromGross(line.grossUnitPrice * line.quantity, vatRate), 0);
  const shippingNet = netFromGross(shippingGross, shippingVatRate);
  const productTax = productGross - productNet;
  const shippingTax = shippingGross - shippingNet;
  const totalGross = productGross + shippingGross;
  const totalNet = productNet + shippingNet;
  const totalTax = productTax + shippingTax;

  const grouped = new Map<number, { taxable: number; tax: number }>();
  const addGroup = (rate: number, taxable: number, tax: number) => {
    const prev = grouped.get(rate) || { taxable: 0, tax: 0 };
    grouped.set(rate, { taxable: prev.taxable + taxable, tax: prev.tax + tax });
  };
  addGroup(vatRate, productNet, productTax);
  if (shippingGross > 0) addGroup(shippingVatRate, shippingNet, shippingTax);
  const taxGroups = [...grouped.entries()].map(([rate, value]) => taxSubtotal(currency, value.taxable, value.tax, rate)).join("");

  const lines = input.lines.map((line, index) => {
    const gross = line.grossUnitPrice * line.quantity;
    const net = netFromGross(gross, vatRate);
    const tax = gross - net;
    const unitNet = netFromGross(line.grossUnitPrice, vatRate);
    return [
      "<cac:InvoiceLine><cbc:ID>" + (index + 1) + "</cbc:ID>",
      '<cbc:InvoicedQuantity unitCode="C62">' + line.quantity + "</cbc:InvoicedQuantity>",
      '<cbc:LineExtensionAmount currencyID="' + currency + '">' + money(net) + "</cbc:LineExtensionAmount>",
      '<cac:TaxTotal><cbc:TaxAmount currencyID="' + currency + '">' + money(tax) + "</cbc:TaxAmount>" + taxSubtotal(currency, net, tax, vatRate) + "</cac:TaxTotal>",
      "<cac:Item><cbc:Name>" + x(line.name) + "</cbc:Name>" + (line.sku ? "<cac:SellersItemIdentification><cbc:ID>" + x(line.sku) + "</cbc:ID></cac:SellersItemIdentification>" : "") + "</cac:Item>",
      '<cac:Price><cbc:PriceAmount currencyID="' + currency + '">' + money(unitNet) + "</cbc:PriceAmount></cac:Price>",
      "</cac:InvoiceLine>",
    ].join("");
  });

  if (shippingGross > 0) {
    lines.push([
      "<cac:InvoiceLine><cbc:ID>" + (input.lines.length + 1) + "</cbc:ID>",
      '<cbc:InvoicedQuantity unitCode="C62">1</cbc:InvoicedQuantity>',
      '<cbc:LineExtensionAmount currencyID="' + currency + '">' + money(shippingNet) + "</cbc:LineExtensionAmount>",
      '<cac:TaxTotal><cbc:TaxAmount currencyID="' + currency + '">' + money(shippingTax) + "</cbc:TaxAmount>" + taxSubtotal(currency, shippingNet, shippingTax, shippingVatRate) + "</cac:TaxTotal>",
      "<cac:Item><cbc:Name>Kargo</cbc:Name></cac:Item>",
      '<cac:Price><cbc:PriceAmount currencyID="' + currency + '">' + money(shippingNet) + "</cbc:PriceAmount></cac:Price>",
      "</cac:InvoiceLine>",
    ].join(""));
  }

  const note = input.profileId === "EARSIVFATURA"
    ? "<cbc:Note>İnternet üzerinden yapılan satış. Web sitesi: " + x(input.websiteUrl || "https://www.elmastriko.com") + ". Ödeme yöntemi: " + x(input.paymentMethod || "Kredi/Banka Kartı") + ".</cbc:Note>"
    : "";

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">',
    "<cbc:UBLVersionID>2.1</cbc:UBLVersionID><cbc:CustomizationID>TR1.2</cbc:CustomizationID>",
    "<cbc:ProfileID>" + input.profileId + "</cbc:ProfileID><cbc:ID>" + x(input.invoiceNumber) + "</cbc:ID><cbc:CopyIndicator>false</cbc:CopyIndicator><cbc:UUID>" + x(input.uuid) + "</cbc:UUID>",
    "<cbc:IssueDate>" + x(input.issueDate) + "</cbc:IssueDate><cbc:IssueTime>" + x(input.issueTime) + "</cbc:IssueTime><cbc:InvoiceTypeCode>SATIS</cbc:InvoiceTypeCode>",
    note,
    "<cbc:DocumentCurrencyCode>" + currency + "</cbc:DocumentCurrencyCode><cbc:LineCountNumeric>" + lines.length + "</cbc:LineCountNumeric>",
    "<cac:OrderReference><cbc:ID>" + x(input.orderNo) + "</cbc:ID><cbc:IssueDate>" + x(input.orderDate) + "</cbc:IssueDate></cac:OrderReference>",
    supplierParty(),
    customerParty(input.billing),
    '<cac:TaxTotal><cbc:TaxAmount currencyID="' + currency + '">' + money(totalTax) + "</cbc:TaxAmount>" + taxGroups + "</cac:TaxTotal>",
    '<cac:LegalMonetaryTotal><cbc:LineExtensionAmount currencyID="' + currency + '">' + money(totalNet) + '</cbc:LineExtensionAmount><cbc:TaxExclusiveAmount currencyID="' + currency + '">' + money(totalNet) + '</cbc:TaxExclusiveAmount><cbc:TaxInclusiveAmount currencyID="' + currency + '">' + money(totalGross) + '</cbc:TaxInclusiveAmount><cbc:AllowanceTotalAmount currencyID="' + currency + '">0.00</cbc:AllowanceTotalAmount><cbc:ChargeTotalAmount currencyID="' + currency + '">0.00</cbc:ChargeTotalAmount><cbc:PayableAmount currencyID="' + currency + '">' + money(totalGross) + "</cbc:PayableAmount></cac:LegalMonetaryTotal>",
    lines.join(""),
    "</Invoice>",
  ].join("");
}
