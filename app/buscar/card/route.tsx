import { ImageResponse } from "next/og";
import { searchSiteTimeline } from "@/lib/search";
import { normalizeHost } from "@/lib/wayback";
import { SITE_HOST } from "@/lib/site";
import { fetchThumb } from "@/lib/card-thumb";
import type { SnapshotRecord } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function formatTs(ts: string): string {
  if (!ts || ts.length < 8) return "";
  return `${ts.slice(6, 8)}/${ts.slice(4, 6)}/${ts.slice(0, 4)}`;
}

/** Captura representativa do site: a mais recente com manchete
 *  (fallback: a última captura válida da timeline). */
function pickRecord(records: SnapshotRecord[]): SnapshotRecord | null {
  const withHeadline = records.filter((r) => r.headline);
  return withHeadline[withHeadline.length - 1] ?? records[records.length - 1] ?? null;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const host = normalizeHost(params.get("site") ?? "");
  if (!host) return new Response("site inválido", { status: 400 });

  const format = params.get("format");
  const isStory = format !== "feed";
  const width = isStory ? 1080 : 1200;
  const height = isStory ? 1920 : 630;

  let records: SnapshotRecord[] = [];
  try {
    records = await searchSiteTimeline(host);
  } catch {
    return new Response("erro ao gerar card", { status: 500 });
  }

  const pick = pickRecord(records);
  const thumb = pick ? await fetchThumb(pick.snapshotUrl, isStory) : null;

  // Só a manchete principal do portal exibido (o campo pode trazer
  // várias chamadas unidas por " · " — no card vale apenas a primeira)
  const mainHeadline = pick?.headline?.split(" · ")[0] ?? null;
  const headlineText = mainHeadline
    ? mainHeadline.length > (isStory ? 180 : 110)
      ? `${mainHeadline.slice(0, isStory ? 180 : 110)}…`
      : mainHeadline
    : null;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0a0a0a",
          padding: isStory ? "64px 64px" : "36px 48px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", marginBottom: isStory ? 36 : 20 }}>
          <div style={{ fontSize: isStory ? 28 : 20, color: "#a3a3a3", marginBottom: 8 }}>
            {SITE_HOST}
          </div>
          <div style={{ fontSize: isStory ? 64 : 40, fontWeight: 800, color: "white" }}>
            {`${host} através do tempo`}
          </div>
        </div>

        {pick ? (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            <div
              style={{
                flex: 1,
                minHeight: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#171717",
                border: `3px solid ${pick.siteColor}`,
                borderRadius: isStory ? 24 : 16,
                overflow: "hidden",
              }}
            >
              {thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumb}
                  alt={pick.siteName}
                  style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "top" }}
                />
              ) : (
                <div
                  style={{
                    fontSize: isStory ? 140 : 90,
                    fontWeight: 800,
                    color: pick.siteColor,
                  }}
                >
                  {pick.siteName.charAt(0)}
                </div>
              )}
            </div>

            {/* Manchete embaixo do conteúdo */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                borderLeft: `6px solid ${pick.siteColor}`,
                paddingLeft: isStory ? 24 : 18,
                marginTop: isStory ? 28 : 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div
                  style={{
                    width: isStory ? 16 : 12,
                    height: isStory ? 16 : 12,
                    borderRadius: 8,
                    backgroundColor: pick.siteColor,
                  }}
                />
                <div style={{ fontSize: isStory ? 30 : 22, fontWeight: 800, color: pick.siteColor }}>
                  {pick.siteName}
                </div>
                <div style={{ fontSize: isStory ? 20 : 15, color: "#737373" }}>
                  {formatTs(pick.snapshotTimestamp)}
                </div>
              </div>
              {headlineText ? (
                <div
                  style={{
                    fontSize: isStory ? 46 : 30,
                    fontWeight: 800,
                    color: "white",
                    lineHeight: 1.15,
                  }}
                >
                  {`“${headlineText}”`}
                </div>
              ) : (
                <div style={{ fontSize: isStory ? 34 : 24, fontWeight: 700, color: "#a3a3a3" }}>
                  Site arquivado no acervo
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#737373",
              fontSize: isStory ? 32 : 22,
            }}
          >
            Nenhuma captura desse site no acervo
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "center", marginTop: isStory ? 32 : 18 }}>
          <div style={{ fontSize: isStory ? 24 : 16, color: "#737373" }}>
            {`Veja ${host} em diferentes datas — acervo do Internet Archive`}
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
