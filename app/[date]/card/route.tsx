import { ImageResponse } from "next/og";
import { getDay } from "@/lib/cache";
import { findExactSiteRecord, searchSiteWindow, pickRecord } from "@/lib/search";
import { isValidDate } from "@/lib/date";
import { SITE_HOST } from "@/lib/site";
import { fetchThumb } from "@/lib/card-thumb";
import { normalizeHost } from "@/lib/wayback";
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

function formatTs(ts: string): string {
  if (!ts || ts.length < 8) return "";
  return `${ts.slice(6, 8)}/${ts.slice(4, 6)}/${ts.slice(0, 4)}`;
}

export async function GET(
  request: Request,
  { params }: { params: { date: string } }
) {
  const date = params.date;
  if (!isValidDate(date)) {
    return new Response("data inválida", { status: 400 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format");
  const siteParam = url.searchParams.get("site");
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
  // ?site=<domínio> força um portal específico: captura do dia exato ou,
  // sem ela, a mesma janela de ±30 dias exibida na página de busca.
  let pick: SnapshotRecord | null = null;
  if (siteParam) {
    const host = normalizeHost(siteParam);
    if (host) {
      try {
        pick =
          (await findExactSiteRecord(host, date)) ??
          pickRecord(await searchSiteWindow(host, date));
      } catch {
        pick = null;
      }
    }
  }
  if (!pick) {
    const available = result.sites.filter((s) => s.available);
    const withHeadline = available.filter((s) => s.headline);
    const pool = withHeadline.length ? withHeadline : available;
    pick = pool.length
      ? pool[
          date.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % pool.length
        ]
      : null;
  }

  // Screenshot do portal — sem imagem sai com fallback de letra,
  // o card nunca falha por screenshot indisponível
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
            {`Aquela internet em ${formatDatePt(date)}`}
          </div>
        </div>

        {pick ? (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            {/* Screenshot do portal primeiro: ocupa o máximo de espaço
                para exibir o início da página (masthead + manchetes) */}
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
                  Portal arquivado neste dia
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
