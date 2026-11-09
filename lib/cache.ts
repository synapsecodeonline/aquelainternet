import { getSupabase } from "./supabase";
import { sitesForDate, type SiteEntry } from "./sites";
import { findSnapshot, fetchRawHtml, isJunkPage } from "./wayback";
import { extractHeadline } from "./parse-headline";
import type { DayResult, SnapshotRecord } from "@/types";

const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias
/** Resultados negativos (sem captura) expiram rápido: uma falha transitória
 *  do Wayback não pode envenenar a data por 30 dias. */
const NEGATIVE_TTL_MS = 10 * 60 * 1000; // 10 minutos

interface DbRow {
  site_slug: string;
  snapshot_timestamp: string;
  snapshot_url: string;
  status_code: number | null;
  headline: string | null;
  available: boolean;
  created_at: string;
}

function toRecord(site: SiteEntry, date: string, row: DbRow): SnapshotRecord {
  return {
    siteSlug: site.slug,
    siteName: site.name,
    siteColor: site.color,
    requestedDate: date,
    snapshotTimestamp: row.snapshot_timestamp,
    snapshotUrl: row.snapshot_url,
    statusCode: row.status_code,
    headline: row.headline,
    available: row.available,
  };
}

function isFresh(createdAt: string, hasSnapshot: boolean): boolean {
  const age = Date.now() - new Date(createdAt).getTime();
  return hasSnapshot ? age < TTL_MS : age < NEGATIVE_TTL_MS;
}

// Cache em memória como fallback quando Supabase não está configurado
const memCache = new Map<string, { records: SnapshotRecord[]; warnings: string[]; ts: number }>();

async function fetchFromWayback(site: SiteEntry, date: string): Promise<SnapshotRecord> {
  const base: SnapshotRecord = {
    siteSlug: site.slug,
    siteName: site.name,
    siteColor: site.color,
    requestedDate: date,
    snapshotTimestamp: "",
    snapshotUrl: "",
    statusCode: null,
    headline: null,
    available: false,
  };

  const snap = await findSnapshot(site.url, date);
  if (!snap) return base;

  // Baixa o HTML bruto uma vez: extrai manchete e rejeita páginas sem conteúdo real
  // (domínio estacionado, erro do Wayback, HTML vazio)
  const html = await fetchRawHtml(snap, `http://${site.url}/`).catch(() => null);
  const junk = html ? isJunkPage(html) : false;
  const headline = html && !junk ? extractHeadline(html) : null;

  return {
    ...base,
    snapshotTimestamp: snap.timestamp,
    snapshotUrl: snap.snapshotUrl,
    statusCode: Number(snap.status) || 200,
    headline,
    available: !junk,
  };
}

/** Tamanho da amostra de sites consultados por visita (sorteio por request). */
const SAMPLE_SIZE = 16;

function sampleSites(sites: SiteEntry[]): SiteEntry[] {
  if (sites.length <= SAMPLE_SIZE) return sites;
  return [...sites].sort(() => Math.random() - 0.5).slice(0, SAMPLE_SIZE);
}

/**
 * Retorna os snapshots dos sites da lista curada ativos na data.
 * A cada chamada sorteia uma amostra de até SAMPLE_SIZE sites — visitas
 * diferentes à mesma data trazem combinações diferentes de portais.
 * Cache: Supabase por (site_slug, requested_date); fallback em memória.
 */
export async function getDay(date: string): Promise<DayResult> {
  const warnings: string[] = [];
  if (Number(date.slice(0, 4)) < 1996) {
    warnings.push("A internet ainda engatinhava — pouco arquivado neste período.");
  }

  const supabase = getSupabase();

  const sites = sampleSites(sitesForDate(date));
  // Chave de memória inclui os slugs sorteados — amostras diferentes não se misturam
  const memKey = `${date}:${sites.map((s) => s.slug).sort().join(",")}`;

  // 0. Fallback: cache em memória quando Supabase não está configurado
  if (!supabase) {
    const mem = memCache.get(memKey);
    if (mem && Date.now() - mem.ts < TTL_MS) {
      return { date, sites: mem.records, warnings };
    }
  }

  // 1. Tenta ler do Supabase
  let dbRows: DbRow[] = [];
  if (supabase) {
    const { data, error } = await supabase
      .from("snapshots")
      .select("site_slug,snapshot_timestamp,snapshot_url,status_code,headline,available,created_at")
      .eq("requested_date", date);
    if (!error && data) dbRows = data as DbRow[];
  }

  const bySlug = new Map(dbRows.map((r) => [r.site_slug, r]));
  const currentYear = new Date().getFullYear();
  const requestYear = Number(date.slice(0, 4));

  const records: SnapshotRecord[] = [];
  const missing: SiteEntry[] = [];
  const stale: SiteEntry[] = [];

  for (const site of sites) {
    const row = bySlug.get(site.slug);
    const fresh = row && isFresh(row.created_at, Boolean(row.snapshot_timestamp));
    // TTL: revalida registros >30 dias APENAS se o snapshot for do ano corrente.
    // Registros negativos (sem snapshot) sempre revalidam após 10 min,
    // mesmo em anos passados — uma falha transitória não pode ficar presa.
    if (row && fresh) {
      records.push(toRecord(site, date, row));
    } else if (row && !fresh && requestYear < currentYear && row.snapshot_timestamp) {
      records.push(toRecord(site, date, row)); // snapshots de anos passados nunca mudam
    } else {
      missing.push(site);
      if (row) stale.push(site);
    }
  }

  // 2. Sites faltantes/stale → consulta Wayback com delay de 500ms
  for (const site of missing) {
    const rec = await fetchFromWayback(site, date);
    records.push(rec);

    if (supabase) {
      await supabase.from("snapshots").upsert(
        {
          site_slug: site.slug,
          requested_date: date,
          snapshot_timestamp: rec.snapshotTimestamp,
          snapshot_url: rec.snapshotUrl,
          status_code: rec.statusCode,
          headline: rec.headline,
          available: rec.available,
        },
        { onConflict: "site_slug,requested_date" }
      );
    }
    // O throttle em fetchWithTimeout já garante ≥500ms entre chamadas ao archive.org
  }

  // Ordena conforme a lista curada
  const order = new Map(sites.map((s, i) => [s.slug, i]));
  records.sort((a, b) => (order.get(a.siteSlug) ?? 0) - (order.get(b.siteSlug) ?? 0));

  // Só exibe capturas reais do dia — sem cards "sem registro"
  const visible = records.filter((r) => r.available);
  const result = { date, sites: visible, warnings };

  // Fallback: cache em memória (útil quando Supabase não está configurado)
  if (!supabase) {
    memCache.set(memKey, { records: result.sites, warnings: result.warnings, ts: Date.now() });
  }

  return result;
}
