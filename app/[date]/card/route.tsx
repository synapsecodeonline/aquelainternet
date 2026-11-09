import { ImageResponse } from "next/og";
import { getDay } from "@/lib/cache";
import { isValidDate } from "@/lib/date";
import { iframeUrl } from "@/lib/wayback";

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

function formatTs(ts: string): string {
  if (!ts || ts.length < 8) return "";
  return `${ts.slice(6, 8)}/${ts.slice(4, 6)}/${ts.slice(0, 4)}`;
}

const THUMB_TIMEOUT_MS = 30000;
const THUMB_ROUNDS = 3;

/** Screenshot do snapshot via thum.io (renderiza a URL if_ sem toolbar). */
async function fetchThumb(snapshotUrl: string): Promise<string | null> {
  const target = `https://image.thum.io/get/width/400/${iframeUrl(snapshotUrl)}`;
  try {
    const res = await fetch(target, {
      headers: { Accept: "image/png" },
      signal: AbortSignal.timeout(THUMB_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.startsWith("image/")) return null;
    const buf = await res.arrayBuffer();
    return `data:${ct.split(";")[0]};base64,${Buffer.from(buf).toString("base64")}`;
  } catch {
    return null;
  }
}

/**
 * Busca screenshots de todos os sites. Repete até THUMB_ROUNDS rodadas
 * para os que faltarem. Retorna null se alguma imagem não carregar —
 * o card nunca sai com quadrados em branco.
 */
async function fetchAllThumbs(sites: { siteSlug: string; snapshotUrl: string }[]) {
  const thumbs: Record<string, string | null> = {};
  for (const s of sites) thumbs[s.siteSlug] = null;

  for (let round = 0; round < THUMB_ROUNDS; round++) {
    const pending = sites.filter((s) => !thumbs[s.siteSlug]);
    if (pending.length === 0) break;
    await Promise.all(
      pending.map(async (s) => {
        thumbs[s.siteSlug] = await fetchThumb(s.snapshotUrl);
      })
    );
    if (round < THUMB_ROUNDS - 1) await new Promise((r) => setTimeout(r, 1500));
  }

  return Object.values(thumbs).every(Boolean) ? thumbs : null;
}

export async function GET(
  _request: Request,
  { params }: { params: { date: string } }
) {
  const date = params.date;
  if (!isValidDate(date)) {
    return new Response("data inválida", { status: 400 });
  }

  let result;
  try {
    result = await getDay(date);
  } catch {
    return new Response("erro ao gerar card", { status: 500 });
  }

  const available = result.sites.filter((s) => s.available).slice(0, 6);
  const rows: (typeof available)[] = [available.slice(0, 3), available.slice(3, 6)];

  // Só gera o card quando TODAS as imagens carregaram — nunca sai com quadrado em branco
  const thumbs = await fetchAllThumbs(available);
  if (!thumbs) {
    return new Response("imagens indisponíveis, tente novamente", {
      status: 503,
      headers: { "Retry-After": "30", "Cache-Control": "no-store" },
    });
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0a0a0a",
          padding: "48px 56px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", marginBottom: 28 }}>
          <div style={{ fontSize: 22, color: "#a3a3a3", marginBottom: 8 }}>
            aquelainternet.com
          </div>
          <div style={{ fontSize: 52, fontWeight: 800, color: "white" }}>
            {`Aquela internet em ${formatDatePt(date)}`}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
          {rows.map((row, i) => (
            <div key={i} style={{ display: "flex", gap: 14, flex: 1 }}>
              {row.map((site) => {
                const thumb = thumbs[site.siteSlug];
                return (
                  <div
                    key={site.siteSlug}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      backgroundColor: "#171717",
                      border: `2px solid ${site.siteColor}`,
                      borderRadius: 12,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: `${site.siteColor}26`,
                        overflow: "hidden",
                      }}
                    >
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumb}
                          alt={site.siteName}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <div
                          style={{
                            fontSize: 44,
                            fontWeight: 800,
                            color: site.siteColor,
                          }}
                        >
                          {site.siteName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: site.siteColor,
                          }}
                        />
                        <div style={{ fontSize: 17, fontWeight: 700, color: "white" }}>
                          {site.siteName}
                        </div>
                      </div>
                      <div style={{ fontSize: 13, color: "#a3a3a3", marginTop: 5 }}>
                        {`${formatTs(site.snapshotTimestamp)}${site.headline ? ` · “${site.headline.slice(0, 36)}”` : ""}`}
                      </div>
                    </div>
                  </div>
                );
              })}
              {row.length === 0 && <div style={{ flex: 1 }} />}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
          <div style={{ fontSize: 18, color: "#737373" }}>
            Descubra como era a internet naquele dia — acervo do Internet Archive
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        // 1h: cards com screenshots podem mudar (thum.io gera sob demanda);
        // immutable de 1 ano deixava cards antigos sem imagem presos no navegador
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    }
  );
}
