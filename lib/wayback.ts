import { SITE_URL } from "@/lib/site";

const UA = `AquelaInternet/1.0 (+${SITE_URL}; contato@aquelainternet.com)`;
const TIMEOUT_MS = 8000;
const DELAY_MS = 500;

let lastCall = 0;

export interface WaybackSnapshot {
  snapshotUrl: string;
  timestamp: string; // YYYYMMDDHHMMSS
  status: string;
}

async function throttle() {
  const wait = DELAY_MS - (Date.now() - lastCall);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCall = Date.now();
}

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response | null> {
  // O archive.org responde 429/503 quando limita (IPs de saída serverless
  // são compartilhados e muito requisitados). Retry com backoff evita que
  // uma rajada de consultas vire "sem captura" em massa.
  for (let attempt = 0; attempt < 3; attempt++) {
    await throttle();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: {
          "User-Agent": UA,
          ...(init?.headers ?? {}),
        },
      });
      if (res.ok || (res.status !== 429 && res.status < 500)) return res;
      // 429/5xx → espera e tenta de novo
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    } catch {
      if (attempt === 2) return null;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

export function normalizeHost(input: string): string {
  try {
    const withProto = input.includes("://") ? input : `https://${input}`;
    const host = new URL(withProto).hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
    return /^[a-z0-9.-]+\.[a-z]{2,}$/.test(host) ? host : "";
  } catch {
    return "";
  }
}

export interface CdxHit {
  timestamp: string;
  original: string;
  status: string;
  digest: string;
  snapshotUrl: string;
}

function parseCdxRows(rows: unknown): CdxHit[] {
  if (!Array.isArray(rows) || rows.length < 2) return [];
  return (rows.slice(1) as string[][])
    .filter((r) => r[0] && r[1])
    .map(([ts, original, status, digest]) => ({
      timestamp: ts,
      original,
      status: String(status ?? "200"),
      digest: String(digest ?? ""),
      snapshotUrl: `https://web.archive.org/web/${ts}/${original}`,
    }));
}

/**
 * Capturas do host exato (o CDX canonicaliza www/apex) num range de ±30 dias
 * da data, só status 200. matchType=host/prefix é pesado demais (timeout),
 * então ficamos no exact — que já cobre a homepage e suas variantes.
 */
export async function cdxSearch(
  host: string,
  date: string,
  limit = 200
): Promise<CdxHit[]> {
  const from = new Date(date + "T00:00:00Z");
  const to = new Date(date + "T00:00:00Z");
  from.setUTCDate(from.getUTCDate() - 30);
  to.setUTCDate(to.getUTCDate() + 30);

  const api =
    `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(host)}` +
    `&output=json&fl=timestamp,original,statuscode,digest` +
    `&filter=statuscode:200` +
    `&from=${formatDate(from)}&to=${formatDate(to)}&limit=${limit}`;

  const res = await fetchWithTimeout(api);
  if (!res || !res.ok) return [];
  const rows: unknown = await res.json().catch(() => null);
  return parseCdxRows(rows);
}

/**
 * Capturas do host SOMENTE no dia exato `date` (YYYY-MM-DD), status 200.
 * Usado pela busca data+domínio: só exibe 1 card quando há registro
 * específico para aquele dia — senão cai na timeline do domínio.
 */
export async function cdxExactDay(
  host: string,
  date: string,
  limit = 30
): Promise<CdxHit[]> {
  const d = date.replace(/-/g, "");
  const api =
    `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(host)}` +
    `&output=json&fl=timestamp,original,statuscode,digest` +
    `&filter=statuscode:200&from=${d}&to=${d}&limit=${limit}`;

  const res = await fetchWithTimeout(api);
  if (!res || !res.ok) return [];
  const rows: unknown = await res.json().catch(() => null);
  return parseCdxRows(rows);
}

/**
 * Busca um snapshot para `url` SOMENTE no dia exato `date` (YYYY-MM-DD),
 * via CDX com from=to=data. Se não houver captura naquele dia,
 * retorna null → o card vira "sem registro neste dia".
 */
export async function findSnapshot(
  url: string,
  date: string
): Promise<WaybackSnapshot | null> {
  const d = date.replace(/-/g, "");
  const api =
    `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}` +
    `&output=json&fl=timestamp,original,statuscode` +
    `&filter=statuscode:200&from=${d}&to=${d}&limit=3`;

  const res = await fetchWithTimeout(api);
  if (!res || !res.ok) return null;
  const rows: unknown = await res.json().catch(() => null);
  if (!Array.isArray(rows) || rows.length < 2) return null;

  const [ts, original, statuscode] = rows[1] as string[];
  if (!ts || !original) return null;
  return {
    snapshotUrl: `https://web.archive.org/web/${ts}/${original}`,
    timestamp: ts,
    status: String(statuscode ?? "200"),
  };
}

/**
 * URL para embed em iframe: modificador `if_` remove a toolbar do Wayback
 * mas mantém os links/assets reescritos (diferente de `id_`, que devolve o HTML cru).
 */
export function iframeUrl(snapshotUrl: string): string {
  return snapshotUrl.replace(/\/web\/(\d+)\//, "/web/$1if_/");
}

/**
 * URL do HTML bruto original (sem toolbar do Wayback), para parsing.
 */
export function rawHtmlUrl(snapshot: WaybackSnapshot, originalUrl?: string): string {
  const target = originalUrl ?? snapshot.snapshotUrl.replace(/^https?:\/\/web\.archive\.org\/web\/\d+\/?/, "");
  return `https://web.archive.org/web/${snapshot.timestamp}id_/${target}`;
}

/** Quanto do HTML basta para manchetes + detecção de página parked/erro.
 *  Portais modernos têm a grade de notícias mais abaixo no documento. */
const HTML_HEAD_BYTES = 300_000;

function concatBytes(chunks: Uint8Array[], total: number): Uint8Array {
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.length;
  }
  return out;
}

/**
 * Decodifica o HTML respeitando o charset da página. Acervos antigos
 * (geoCities, UOL anos 2000) são majoritariamente windows-1252/latin1 —
 * decodificar como UTF-8 gera mojibake ("conte�do") nas manchetes.
 */
function decodeHtmlBytes(buf: Uint8Array): string {
  const head = new TextDecoder("latin1").decode(buf.subarray(0, Math.min(buf.length, 8192)));
  const declared = /charset\s*=\s*["']?\s*([a-zA-Z0-9._-]+)/i.exec(head)?.[1]?.toLowerCase() ?? "";

  let encoding = "utf-8";
  if (/utf-?8/.test(declared)) encoding = "utf-8";
  else if (/utf-?16/.test(declared)) encoding = declared.includes("be") ? "utf-16be" : "utf-16le";
  else if (declared) encoding = "windows-1252"; // iso-8859-1/latin1/windows-1252 → 1252 é superset
  else {
    // Sem declaração: UTF-8 estrito; se falhar, windows-1252 (padrão de sites BR antigos)
    try {
      new TextDecoder("utf-8", { fatal: true }).decode(buf);
    } catch {
      encoding = "windows-1252";
    }
  }
  try {
    return new TextDecoder(encoding).decode(buf);
  } catch {
    return new TextDecoder("windows-1252").decode(buf);
  }
}

export async function fetchRawHtml(
  snapshot: WaybackSnapshot,
  originalUrl?: string
): Promise<string | null> {
  const url = rawHtmlUrl(snapshot, originalUrl);
  const res = await fetchWithTimeout(url);
  if (!res || !res.ok) return null;
  // Lê só o início do documento — páginas arquivadas podem ter MBs e só
  // precisamos do <head>/início do <body> para validar e extrair manchete.
  if (!res.body) return res.text().catch(() => null);
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (total < HTML_HEAD_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      total += value.length;
    }
  } catch {
    // stream interrompido — usa o que já leu
  } finally {
    reader.cancel().catch(() => {});
  }
  if (total === 0) return null;
  return decodeHtmlBytes(concatBytes(chunks, total)) || null;
}

/**
 * Baixa o HTML bruto do snapshot e extrai a manchete (h1 → title → header link).
 */
export async function fetchHeadline(snapshot: WaybackSnapshot, originalUrl?: string): Promise<string | null> {
  const { extractHeadline } = await import("./parse-headline");
  const html = await fetchRawHtml(snapshot, originalUrl);
  if (!html) return null;
  return extractHeadline(html);
}

const PARKED_RE =
  /domainvalet|sedoparking|sedo\.com|parkingcrew|hugedomains|above\.com|bodis\.com|afternic|dan\.com|undeveloped\.com|estibot|domain\s+(is|may be)\s+for sale|buy\s+(this|the)\s+domain|this\s+domain\s+is\s+parked/i;
const WAYBACK_ERROR_RE =
  /wayback machine[^<]{0,120}(error|not archived|blocked|unavailable)|<title>[^<]*wayback machine[^<]*(error|blocked)/i;

/**
 * Detecta páginas que não são "conteúdo de verdade" daquele site:
 * domínio estacionado, página de erro do próprio Wayback ou HTML vazio.
 */
export function isJunkPage(html: string): boolean {
  if (!html || html.length < 500) return true;
  const head = html.slice(0, 60000);
  if (PARKED_RE.test(head)) return true;
  if (WAYBACK_ERROR_RE.test(head)) return true;
  return false;
}


