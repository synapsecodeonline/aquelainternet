import { ImageResponse } from "next/og";
import { getDay } from "@/lib/cache";
import { isValidDate } from "@/lib/date";
import { iframeUrl } from "@/lib/wayback";
import { SITE_HOST } from "@/lib/site";

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

const THUMB_TIMEOUT_MS = 12000;
const THUMB_ROUNDS = 2;
const THUMB_CACHE_TTL_MS = 50 * 60 * 1000;

// Cache em memória dos screenshots por snapshotUrl — instância serverless
// reaproveita entre gerações de card (o card em si já é cacheado por 1h).
const thumbCache = new Map<string, { data: string; ts: number }>();

/** Providers de screenshot, em ordem de tentativa. */
function thumbUrls(snapshotUrl: string, width: number): string[] {
  const target = iframeUrl(snapshotUrl);
  return [
    `https://image.thum.io/get/width/${width}/${target}`,
    // Microlink embed devolve o screenshot direto em PNG
    `https://api.microlink.io/?url=${encodeURIComponent(target)}&screenshot=true&meta=false&embed=screenshot.url`,
  ];
}

async function fetchOne(target: string): Promise<string | null> {
  try {
    const res = await fetch(target, {
      headers: { Accept: "image/png,image/jpeg" },
      signal: AbortSignal.timeout(THUMB_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    // GIF não é suportado pelo Satori — trata como falha
    if (!ct.startsWith("image/") || ct.includes("gif")) return null;
    const buf = await res.arrayBuffer();
    return `data:${ct.split(";")[0]};base64,${Buffer.from(buf).toString("base64")}`;
  } catch {
    return null;
  }
}

/** Screenshot do snapshot: dispara todos os providers em paralelo e
 *  fica com o primeiro que responder com imagem válida. */
async function fetchThumb(snapshotUrl: string, width = 800): Promise<string | null> {
  const targets = thumbUrls(snapshotUrl, width);
  return new Promise((resolve) => {
    let pending = targets.length;
    let done = false;
    for (const target of targets) {
      fetchOne(target).then((data) => {
        if (done) return;
        if (data) {
          done = true;
          resolve(data);
        } else if (--pending === 0) {
          done = true;
          resolve(null);
        }
      });
    }
  });
}

/**
 * Busca screenshots de todos os sites. Repete até THUMB_ROUNDS rodadas
 * para os que faltarem. Retorna null se alguma imagem não carregar —
 * o card nunca sai com quadrados em branco.
 */
async function fetchAllThumbs(
  sites: { siteSlug: string; snapshotUrl: string }[],
  width = 800
) {
  const thumbs: Record<string, string | null> = {};
  for (const s of sites) {
    const hit = thumbCache.get(s.snapshotUrl);
    thumbs[s.siteSlug] = hit && Date.now() - hit.ts < THUMB_CACHE_TTL_MS ? hit.data : null;
  }

  for (let round = 0; round < THUMB_ROUNDS; round++) {
    const pending = sites.filter((s) => !thumbs[s.siteSlug]);
    if (pending.length === 0) break;
    await Promise.all(
      pending.map(async (s) => {
        const data = await fetchThumb(s.snapshotUrl, width);
        if (data) thumbCache.set(s.snapshotUrl, { data, ts: Date.now() });
        thumbs[s.siteSlug] = data;
      })
    );
    if (round < THUMB_ROUNDS - 1) await new Promise((r) => setTimeout(r, 1000));
  }

  return Object.values(thumbs).every(Boolean) ? thumbs : null;
}

export async function GET(
  request: Request,
  { params }: { params: { date: string } }
) {
  const date = params.date;
  if (!isValidDate(date)) {
    return new Response("data inválida", { status: 400 });
  }

  const format = new URL(request.url).searchParams.get("format");
  const isStory = format === "story";
  const width = isStory ? 1080 : 1200;
  const height = isStory ? 1920 : 630;
  // Feed: 6 sites em 2 colunas x 3 linhas, thumbnails quadrados compactos
  // Story: 6 sites em 2 colunas x 3 linhas, tiles grandes
  const maxSites = 6;
  const thumbWidth = 800;

  let result;
  try {
    result = await getDay(date);
  } catch {
    return new Response("erro ao gerar card", { status: 500 });
  }

  const available = result.sites.filter((s) => s.available).slice(0, maxSites);

  // Só gera o card quando TODAS as imagens carregaram — nunca sai com quadrado em branco
  const thumbs = await fetchAllThumbs(available, thumbWidth);
  if (!thumbs) {
    return new Response("imagens indisponíveis, tente novamente", {
      status: 503,
      headers: { "Retry-After": "30", "Cache-Control": "no-store" },
    });
  }

  const cols = 2;
  const rows: (typeof available)[] = [];
  for (let i = 0; i < available.length; i += cols) {
    rows.push(available.slice(i, i + cols));
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
          padding: isStory ? "72px 64px" : "48px 56px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", marginBottom: isStory ? 48 : 28 }}>
          <div style={{ fontSize: isStory ? 30 : 22, color: "#a3a3a3", marginBottom: 10 }}>
            {SITE_HOST}
          </div>
          <div style={{ fontSize: isStory ? 76 : 52, fontWeight: 800, color: "white" }}>
            {`Aquela internet em ${formatDatePt(date)}`}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: isStory ? 20 : 12, flex: 1 }}>
          {rows.map((row, i) => (
            <div key={i} style={{ display: "flex", gap: isStory ? 20 : 16, flex: 1 }}>
              {row.map((site) => {
                const thumb = thumbs[site.siteSlug];
                const headline = `${formatTs(site.snapshotTimestamp)}${site.headline ? ` · “${site.headline.slice(0, isStory ? 60 : 44)}”` : ""}`;
                if (!isStory) {
                  // Feed: thumbnail quadrado + info ao lado (compacto, 6 sites)
                  return (
                    <div
                      key={site.siteSlug}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        backgroundColor: "#171717",
                        border: `2px solid ${site.siteColor}`,
                        borderRadius: 12,
                        padding: "12px 16px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: 104,
                          height: 104,
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: `${site.siteColor}26`,
                          borderRadius: 8,
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
                          <div style={{ fontSize: 44, fontWeight: 800, color: site.siteColor }}>
                            {site.siteName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 5,
                              backgroundColor: site.siteColor,
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ fontSize: 19, fontWeight: 700, color: "white" }}>
                            {site.siteName}
                          </div>
                        </div>
                        <div style={{ fontSize: 14, color: "#a3a3a3", marginTop: 5 }}>
                          {headline}
                        </div>
                      </div>
                    </div>
                  );
                }
                return (
                  <div
                    key={site.siteSlug}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      backgroundColor: "#171717",
                      border: `2px solid ${site.siteColor}`,
                      borderRadius: isStory ? 20 : 12,
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
                            fontSize: isStory ? 72 : 44,
                            fontWeight: 800,
                            color: site.siteColor,
                          }}
                        >
                          {site.siteName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div style={{ padding: isStory ? "16px 22px" : "10px 14px", display: "flex", flexDirection: "column" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: isStory ? 14 : 10,
                            height: isStory ? 14 : 10,
                            borderRadius: 7,
                            backgroundColor: site.siteColor,
                          }}
                        />
                        <div style={{ fontSize: isStory ? 26 : 17, fontWeight: 700, color: "white" }}>
                          {site.siteName}
                        </div>
                      </div>
                      <div style={{ fontSize: isStory ? 19 : 13, color: "#a3a3a3", marginTop: 6 }}>
                        {`${formatTs(site.snapshotTimestamp)}${site.headline ? ` · “${site.headline.slice(0, isStory ? 60 : 36)}”` : ""}`}
                      </div>
                    </div>
                  </div>
                );
              })}
              {row.length === 0 && <div style={{ flex: 1 }} />}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: isStory ? 40 : 20 }}>
          <div style={{ fontSize: isStory ? 26 : 18, color: "#737373" }}>
            Descubra como era a internet naquele dia — acervo do Internet Archive
          </div>
        </div>
      </div>
    ),
    {
      width,
      height,
      headers: {
        // 1h: cards com screenshots podem mudar (providers geram sob demanda);
        // immutable de 1 ano deixava cards antigos sem imagem presos no navegador
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    }
  );
}
