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

const THUMB_TIMEOUT_MS = 15000;
const THUMB_ROUNDS = 3;
const THUMB_CACHE_TTL_MS = 50 * 60 * 1000;

// Cache em memória dos screenshots por snapshotUrl — instância serverless
// reaproveita entre gerações de card (o card em si já é cacheado por 1h).
const thumbCache = new Map<string, { data: string; ts: number }>();

/** Viewport mobile (largura de iPhone) — o portal renderiza como no
 *  celular e o card mostra o conteúdo inteiro em vez de cortar. */
const MOBILE_W = 414;
const MOBILE_H = 1600;

/** Providers de screenshot, em ordem de tentativa. */
function thumbUrls(snapshotUrl: string): string[] {
  const target = iframeUrl(snapshotUrl);
  return [
    `https://image.thum.io/get/width/${MOBILE_W}/crop/${MOBILE_H}/${target}`,
    // Microlink embed devolve o screenshot direto em PNG
    `https://api.microlink.io/?url=${encodeURIComponent(target)}&screenshot=true&meta=false&embed=screenshot.url&screenshot.viewport.width=${MOBILE_W}&screenshot.viewport.height=${MOBILE_H}&screenshot.viewport.isMobile=true&screenshot.viewport.hasTouch=true`,
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
async function fetchThumb(snapshotUrl: string): Promise<string | null> {
  const targets = thumbUrls(snapshotUrl);
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

export async function GET(
  request: Request,
  { params }: { params: { date: string } }
) {
  const date = params.date;
  if (!isValidDate(date)) {
    return new Response("data inválida", { status: 400 });
  }

  const format = new URL(request.url).searchParams.get("format");
  // Padrão: story (1080x1920). Feed só com ?format=feed explícito.
  const isStory = format !== "feed";
  const width = isStory ? 1080 : 1200;
  const height = isStory ? 1920 : 630;

  let result;
  try {
    result = await getDay(date);
  } catch {
    return new Response("erro ao gerar card", { status: 500 });
  }

  // Um único portal: a "Manchete do dia" — mesma escolha determinística
  // da página da data (site com headline sorteado pelo hash da data).
  const available = result.sites.filter((s) => s.available);
  const withHeadline = available.filter((s) => s.headline);
  const pool = withHeadline.length ? withHeadline : available;
  const pick = pool.length
    ? pool[
        date.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % pool.length
      ]
    : null;

  // Screenshot do portal — sem imagem sai com fallback de letra,
  // o card nunca falha por screenshot indisponível
  let thumb: string | null = null;
  if (pick) {
    const hit = thumbCache.get(pick.snapshotUrl);
    thumb =
      hit && Date.now() - hit.ts < THUMB_CACHE_TTL_MS ? hit.data : null;
    for (let round = 0; !thumb && round < THUMB_ROUNDS; round++) {
      thumb = await fetchThumb(pick.snapshotUrl);
      if (thumb) thumbCache.set(pick.snapshotUrl, { data: thumb, ts: Date.now() });
      if (!thumb && round < THUMB_ROUNDS - 1) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
  }

  const headlineText = pick?.headline
    ? pick.headline.length > (isStory ? 180 : 110)
      ? `${pick.headline.slice(0, isStory ? 180 : 110)}…`
      : pick.headline
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
            {`Aquela internet em ${formatDatePt(date)}`}
          </div>
        </div>

        {pick ? (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            {/* Manchete principal em destaque */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                borderLeft: `6px solid ${pick.siteColor}`,
                paddingLeft: isStory ? 24 : 18,
                marginBottom: isStory ? 28 : 16,
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
                  Portal arquivado neste dia
                </div>
              )}
            </div>

            {/* Screenshot do portal ocupando o resto do card */}
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
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
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
            Nenhum portal arquivado nesta data
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "center", marginTop: isStory ? 32 : 18 }}>
          <div style={{ fontSize: isStory ? 24 : 16, color: "#737373" }}>
            {`Veja a página real de ${pick ? pick.siteName : "um portal"} em ${formatDatePt(date)} — acervo do Internet Archive`}
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
