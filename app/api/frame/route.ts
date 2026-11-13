import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const UA = "Mozilla/5.0 (compatible; AquelaInternet/1.0; +https://aquelainternet.vercel.app)";

/**
 * Proxy same-origin para snapshots do Wayback.
 * Injeta <meta name="viewport"> quando a página arquivada não tem uma,
 * fazendo o conteúdo se comportar como no mobile:
 * - páginas responsivas (com viewport próprio) -> layout mobile real
 * - páginas antigas sem viewport -> viewport 980 escalado, igual ao
 *   comportamento clássico dos navegadores mobile
 */
export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("u");
  if (!raw) return new Response("missing u", { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new Response("url inválida", { status: 400 });
  }
  if (
    target.protocol !== "https:" ||
    !/(^|\.)archive\.org$/.test(target.hostname) ||
    !target.pathname.startsWith("/web/")
  ) {
    return new Response("forbidden", { status: 403 });
  }

  let res: Response;
  try {
    res = await fetch(target.toString(), {
      headers: { "User-Agent": UA, Accept: "text/html,*/*" },
      signal: AbortSignal.timeout(20000),
      redirect: "follow",
    });
  } catch {
    return new Response("snapshot indisponível", { status: 502 });
  }
  if (!res.ok) {
    return new Response("snapshot indisponível", { status: 502 });
  }

  const html = await res.text().catch(() => "");
  if (!html) return new Response("snapshot vazio", { status: 502 });

  // Só injeta se a página não declarou viewport próprio
  const hasViewport = /<meta[^>]+name\s*=\s*["']?viewport["']?/i.test(html);
  let out = html;
  if (!hasViewport) {
    const meta = '<meta name="viewport" content="width=980, initial-scale=1">';
    out = /<head[^>]*>/i.test(html)
      ? html.replace(/<head[^>]*>/i, (m) => `${m}${meta}`)
      : meta + html;
  }

  return new NextResponse(out, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // snapshots são imutáveis — cache agressivo na borda
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
