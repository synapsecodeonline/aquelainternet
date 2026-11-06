import { NextRequest, NextResponse } from "next/server";
import { findSnapshot, fetchHeadline } from "@/lib/wayback";
import { SITES } from "@/lib/sites";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const date = req.nextUrl.searchParams.get("date");

  if (!url || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "url e date (YYYY-MM-DD) são obrigatórios" }, { status: 400 });
  }

  const site = SITES.find((s) => s.url === url || s.slug === url);
  const target = site?.url ?? url;

  const snap = await findSnapshot(target, date);
  if (!snap) {
    return NextResponse.json({ available: false });
  }

  const headline = await fetchHeadline(snap, `http://${target}/`).catch(() => null);

  return NextResponse.json({
    available: true,
    snapshotUrl: snap.snapshotUrl,
    timestamp: snap.timestamp,
    status: snap.status,
    headline,
  });
}
