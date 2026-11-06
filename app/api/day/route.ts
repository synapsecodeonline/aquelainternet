import { NextRequest, NextResponse } from "next/server";
import { getDay } from "@/lib/cache";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  if (!date || !DATE_RE.test(date)) {
    return NextResponse.json({ error: "date inválida (use YYYY-MM-DD)" }, { status: 400 });
  }
  const today = new Date().toISOString().slice(0, 10);
  if (date > today) {
    return NextResponse.json({ error: "essa data ainda não aconteceu" }, { status: 400 });
  }

  try {
    const result = await getDay(date);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
    });
  } catch (e) {
    console.error("/api/day error", e);
    return NextResponse.json({ error: "falha ao consultar o Wayback" }, { status: 502 });
  }
}
