import { NextResponse } from "next/server";
import { invoiceIntegration } from "@/lib/integrations/invoice";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [health, company, einvoiceSeries, earchiveSeries] = await Promise.all([
      invoiceIntegration.healthCheck(),
      invoiceIntegration.getElmasCompanyInfo(),
      invoiceIntegration.getDefaultSeries("einvoice"),
      invoiceIntegration.getDefaultSeries("earchive"),
    ]);

    const apiKey = process.env.NES_API_KEY || "";
    const [testEInvoice, testEArchive] = await Promise.all([
      fetch("https://apitest.nes.com.tr/einvoice/v1/tags", {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: "no-store",
      }),
      fetch("https://apitest.nes.com.tr/earchive/v1/tags", {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: "no-store",
      }),
    ]);

    return NextResponse.json({
      ok: true,
      live: {
        einvoice: health.einvoice,
        earchive: health.earchive,
        companyIdentifier: company.identifier,
        senderAliases: company.aliases.map(alias => ({ type: alias.type, alias: alias.alias })),
        einvoiceSeries: einvoiceSeries.invoiceNumber,
        earchiveSeries: earchiveSeries.invoiceNumber,
      },
      testEnvironment: {
        einvoiceStatus: testEInvoice.status,
        earchiveStatus: testEArchive.status,
      },
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
