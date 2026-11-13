import { NextRequest, NextResponse } from "next/server";
import { findClosestSiteRecord } from "@/lib/search";
import { isValidDate } from "@/lib/date";
import { normalizeHost } from "@/lib/wayback";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const date = req.nextUrl.searchParams.get("date");

  if (!url || !date || !isValidDate(date)) {
    return NextResponse.json(
      { error: "url e date (YYYY-MM-DD) são obrigatórios" },
      { status: 400 }
    );
  }

  const host = normalizeHost(url);
  if (!host) {
    return NextResponse.json({ error: "site inválido" }, { status: 400 });
  }

  try {
    // Data + domínio → um único registro: a captura mais próxima da data.
    const record = await findClosestSiteRecord(host, date);
    return NextResponse.json({ date, site: host, sites: record ? [record] : [] });
  } catch (e) {
    console.error("/api/site error", e);
    return NextResponse.json({ error: "falha ao consultar o Wayback" }, { status: 502 });
  }
}
