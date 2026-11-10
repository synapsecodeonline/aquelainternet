import { cdxSearch, fetchRawHtml, isJunkPage, normalizeHost } from "./wayback";
import { extractCardHeadline } from "./parse-headline";
import type { SnapshotRecord } from "@/types";

const MAX_RESULTS = 10;
const MAX_ATTEMPTS = 18; // limita requisições ao Wayback em caso de muitas páginas junk

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

/**
 * Pesquisa um site arbitrário no Wayback: retorna até MAX_RESULTS páginas
 * distintas capturadas num range de ±30 dias da data, somente as que têm
 * conteúdo real (não estacionadas / não erro).
 */
export async function searchSiteRecords(input: string, date: string): Promise<SnapshotRecord[]> {
  const host = normalizeHost(input);
  if (!host) return [];

  const hits = await cdxSearch(host, date);
  if (hits.length === 0) return [];

  // Dedupe por timestamp e amostra ~12 capturas espalhadas uniformemente
  // pela janela de ±30 dias; valida até MAX_RESULTS com conteúdo real.
  const byTs = new Map<string, (typeof hits)[number]>();
  for (const h of hits) if (!byTs.has(h.timestamp)) byTs.set(h.timestamp, h);
  const sorted = Array.from(byTs.values()).sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp)
  );
  const stride = Math.max(1, Math.floor(sorted.length / 12));
  const candidates = sorted.filter((_, i) => i % stride === 0).slice(0, 16);

  const records: SnapshotRecord[] = [];
  let attempts = 0;

  for (const hit of candidates) {
    if (records.length >= MAX_RESULTS || attempts >= MAX_ATTEMPTS) break;
    attempts++;

    const snap = { snapshotUrl: hit.snapshotUrl, timestamp: hit.timestamp, status: hit.status };
    const html = await fetchRawHtml(snap, hit.original).catch(() => null);
    if (!html || isJunkPage(html)) continue;

    let path = "/";
    try {
      path = new URL(hit.original).pathname || "/";
    } catch {
      // original malformado — segue com "/"
    }

    records.push({
      siteSlug: `search-${host}-${records.length}`,
      siteName: displayName(hit.original, host),
      siteColor: "#64748b",
      requestedDate: date,
      snapshotTimestamp: hit.timestamp,
      snapshotUrl: hit.snapshotUrl,
      statusCode: Number(hit.status) || 200,
      // Capturas antigas costumam ser stubs de redirect sem h1/title —
      // o iframe resolve o redirect dentro do próprio Wayback.
      headline: extractCardHeadline(html, host) ?? (path === "/" ? "página inicial" : path.slice(0, 60)),
      available: true,
    });
  }

  return records;
}

/**
 * Melhor captura de UM site próximo de uma data (janela ±30 dias):
 * ordena por proximidade do dia exato e valida conteúdo real.
 * Usado pela comparação lado a lado (`/comparar?site=…`).
 */
export async function findClosestSiteRecord(
  input: string,
  date: string
): Promise<SnapshotRecord | null> {
  const host = normalizeHost(input);
  if (!host) return null;

  const hits = await cdxSearch(host, date);
  if (hits.length === 0) return null;

  const target = Date.parse(`${date}T12:00:00Z`);
  const scored = hits
    .map((h) => {
      const ts = h.timestamp; // YYYYMMDDHHMMSS
      const iso = `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}T${ts.slice(8, 10)}:${ts.slice(10, 12)}:${ts.slice(12, 14)}Z`;
      return { h, dist: Math.abs(Date.parse(iso) - target) };
    })
    .sort((a, b) => a.dist - b.dist);

  const byTs = new Map<string, (typeof scored)[number]>();
  for (const s of scored) if (!byTs.has(s.h.timestamp)) byTs.set(s.h.timestamp, s);
  const candidates = Array.from(byTs.values()).slice(0, 10);

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
      siteSlug: `compare-${host}-${date}`,
      siteName: host,
      siteColor: "#0ea5e9",
      requestedDate: date,
      snapshotTimestamp: h.timestamp,
      snapshotUrl: h.snapshotUrl,
      statusCode: Number(h.status) || 200,
      headline: extractCardHeadline(html, host) ?? (path === "/" ? "página inicial" : path.slice(0, 60)),
      available: true,
    };
  }

  return null;
}
