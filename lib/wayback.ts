const UA = "AquelaInternet/1.0 (+https://aquelainternet.com; contato@aquelainternet.com)";
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
    return res;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
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
  if (!res) return [];
  const rows: unknown = await res.json().catch(() => null);
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
  if (!res) return null;
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

export async function fetchRawHtml(
  snapshot: WaybackSnapshot,
  originalUrl?: string
): Promise<string | null> {
  const url = rawHtmlUrl(snapshot, originalUrl);
  const res = await fetchWithTimeout(url);
  if (!res) return null;
  return res.text().catch(() => null);
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


