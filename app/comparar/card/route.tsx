import { ImageResponse } from "next/og";
import { findClosestSiteRecord } from "@/lib/search";
import { normalizeHost } from "@/lib/wayback";
import { isValidDate } from "@/lib/date";
import { SITE_HOST } from "@/lib/site";
import { fetchThumb } from "@/lib/card-thumb";
import type { SnapshotRecord } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function formatDatePt(date: string): string {
  const [y, m, d] = date.split("-");
  const meses = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  return `${Number(d)} de ${meses[Number(m) - 1]} de ${y}`;
}

function Panel({
  record,
  date,
  thumb,
  isStory,
}: {
  record: SnapshotRecord | null;
  date: string;
  thumb: string | null;
  isStory: boolean;
}) {
  const color = record?.siteColor ?? "#64748b";
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#171717",
        border: `3px solid ${color}`,
        borderRadius: isStory ? 24 : 16,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: isStory ? "18px 22px" : "12px 16px",
          borderBottom: "2px solid #262626",
        }}
      >
        <div
          style={{
            width: isStory ? 14 : 10,
            height: isStory ? 14 : 10,
            borderRadius: 7,
            backgroundColor: color,
          }}
        />
        <div style={{ fontSize: isStory ? 30 : 22, fontWeight: 800, color }}>
          {formatDatePt(date)}
        </div>
        {record && (
          <div style={{ fontSize: isStory ? 20 : 15, color: "#737373" }}>
            {record.siteName}
          </div>
        )}
      </div>
      <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt={record?.siteName ?? date}
            style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "top" }}
          />
        ) : record ? (
          <div style={{ fontSize: isStory ? 120 : 72, fontWeight: 800, color }}>
            {(record.siteName || "?").charAt(0).toUpperCase()}
          </div>
        ) : (
          <div style={{ fontSize: isStory ? 26 : 18, color: "#737373" }}>
            Sem captura nesta data
          </div>
        )}
      </div>
    </div>
  );
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const host = normalizeHost(params.get("site") ?? "");
  const a = params.get("a") ?? "";
  const b = params.get("b") ?? "";

  if (!host || !isValidDate(a) || !isValidDate(b)) {
    return new Response("parâmetros inválidos", { status: 400 });
  }

  const format = params.get("format");
  const isStory = format !== "feed";
  const width = isStory ? 1080 : 1200;
  const height = isStory ? 1920 : 630;

  let records: (SnapshotRecord | null)[];
  try {
    records = await Promise.all([
      findClosestSiteRecord(host, a),
      findClosestSiteRecord(host, b),
    ]);
  } catch {
    return new Response("erro ao gerar card", { status: 500 });
  }

  const thumbs = await Promise.all(
    records.map((r) => (r ? fetchThumb(r.snapshotUrl, isStory) : Promise.resolve(null)))
  );

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0a0a0a",
          padding: isStory ? "56px 56px" : "32px 44px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", marginBottom: isStory ? 30 : 18 }}>
          <div style={{ fontSize: isStory ? 26 : 19, color: "#a3a3a3", marginBottom: 8 }}>
            {SITE_HOST}
          </div>
          <div style={{ fontSize: isStory ? 58 : 38, fontWeight: 800, color: "white" }}>
            {`${host} — ${formatDatePt(a)} vs ${formatDatePt(b)}`}
          </div>
        </div>

        {/* Story: painéis empilhados. Feed: lado a lado. */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: isStory ? "column" : "row",
            gap: isStory ? 28 : 24,
          }}
        >
          <Panel record={records[0]} date={a} thumb={thumbs[0]} isStory={isStory} />
          <Panel record={records[1]} date={b} thumb={thumbs[1]} isStory={isStory} />
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: isStory ? 28 : 16 }}>
          <div style={{ fontSize: isStory ? 22 : 15, color: "#737373" }}>
            {`Como ${host} mudou com o tempo — acervo do Internet Archive`}
          </div>
        </div>
      </div>
    ),
    {
      width,
      height,
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    }
  );
}
