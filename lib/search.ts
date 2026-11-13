import { cdxSearch, fetchRawHtml, isJunkPage, normalizeHost } from "./wayback";
import { extractCardHeadline } from "./parse-headline";
import type { SnapshotRecord } from "@/types";

const MAX_ATTEMPTS = 10; // candidatos validados por âncora/data

function displayName(original: string, host: string): string {
  try {
    const u = new URL(original);
    const h = u.hostname.replace(/^www\./, "");
    const path = u.pathname === "/" ? "" : u.pathname.replace(/\/+$/, "").slice(0, 40);
    const name = `${h}${path}`;
    return name.length > 48 ? name.slice(0, 45) + "…" : name;
  } catch {
    return host;
  }
}

function tsDate(ts: string): string {
  return `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}`;
}

function tsMillis(ts: string): number {
  return Date.parse(
    `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}T${ts.slice(8, 10)}:${ts.slice(10, 12)}:${ts.slice(12, 14)}Z`
  );
}

interface ClosestOpts {
  /** Data exibida no card/badge de distância. Default: a data do próprio snapshot. */
  requestedDate?: string;
  maxTries?: number;
}

/**
 * Melhor captura de UM host próximo de `anchorDate` (janela ±30 dias do CDX):
 * ordena os hits por proximidade do dia âncora e valida conteúdo real
 * (não estacionado / não erro), tentando os `maxTries` mais próximos.
 */
async function closestSnapshotRecord(
  host: string,
  anchorDate: string,
  slug: string,
  opts: ClosestOpts = {}
): Promise<SnapshotRecord | null> {
  const hits = await cdxSearch(host, anchorDate);
  if (hits.length === 0) return null;

  const target = Date.parse(`${anchorDate}T12:00:00Z`);
  const scored = hits
    .map((h) => ({ h, dist: Math.abs(tsMillis(h.timestamp) - target) }))
    .sort((a, b) => a.dist - b.dist);

  const byTs = new Map<string, (typeof scored)[number]>();
  for (const s of scored) if (!byTs.has(s.h.timestamp)) byTs.set(s.h.timestamp, s);
  const candidates = Array.from(byTs.values()).slice(0, opts.maxTries ?? MAX_ATTEMPTS);

  for (const { h } of candidates) {
    const snap = { snapshotUrl: h.snapshotUrl, timestamp: h.timestamp, status: h.status };
    const html = await fetchRawHtml(snap, h.original).catch(() => null);
    if (!html || isJunkPage(html)) continue;

    let path = "/";
    try {
      path = new URL(h.original).pathname || "/";
    } catch {
      // original malformado — segue com "/"
    }

    return {
      siteSlug: slug,
      siteName: displayName(h.original, host),
      siteColor: "#64748b",
      requestedDate: opts.requestedDate ?? tsDate(h.timestamp),
      snapshotTimestamp: h.timestamp,
      snapshotUrl: h.snapshotUrl,
      statusCode: Number(h.status) || 200,
      headline:
        extractCardHeadline(html, host) ??
        (path === "/" ? "página inicial" : path.slice(0, 60)),
      available: true,
    };
  }

  return null;
}

/**
 * UM card: a captura mais próxima da data pesquisada (janela ±30 dias).
 * Usado por `/{data}?site=…` e pela comparação lado a lado (`/comparar`).
 */
export async function findClosestSiteRecord(
  input: string,
  date: string
): Promise<SnapshotRecord | null> {
  const host = normalizeHost(input);
  if (!host) return null;
  return closestSnapshotRecord(host, date, `site-${host}-${date}`, {
    requestedDate: date,
  });
}

/** Âncoras espaçadas ~3 anos cobrindo a era do acervo (2002→hoje). */
const TIMELINE_ANCHORS = [
  "2002-06-15",
  "2005-06-15",
  "2008-06-15",
  "2011-06-15",
  "2014-06-15",
  "2017-06-15",
  "2020-06-15",
  "2023-06-15",
  "2026-06-15",
];

/**
 * Vários cards do MESMO domínio em datas diferentes: para cada âncora de
 * época, pega a captura mais próxima. `requestedDate` = data da própria
 * captura, então cada card exibe a sua data sem badge de "fora da data".
 */
export async function searchSiteTimeline(input: string): Promise<SnapshotRecord[]> {
  const host = normalizeHost(input);
  if (!host) return [];

  const today = new Date().toISOString().slice(0, 10);
  const anchors = TIMELINE_ANCHORS.filter((d) => d <= today);

  const results = await Promise.all(
    anchors.map((a) =>
      closestSnapshotRecord(host, a, `timeline-${host}-${a}`, { maxTries: 3 })
    )
  );
  return results.filter((r): r is SnapshotRecord => r !== null);
}
