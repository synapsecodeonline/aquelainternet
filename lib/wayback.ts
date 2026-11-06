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

/**
 * Availability API — primeira tentativa.
 * Retorna o snapshot mais próximo do timestamp (YYYYMMDD) ou null.
 */
export async function availabilityLookup(
  url: string,
  date: string // YYYY-MM-DD
): Promise<WaybackSnapshot | null> {
  const ts = date.replace(/-/g, "");
  const api = `https://archive.org/wayback/available?url=${encodeURIComponent(url)}&timestamp=${ts}`;
  const res = await fetchWithTimeout(api);
  if (!res) return null;
  const data = await res.json().catch(() => null);
  const closest = data?.archived_snapshots?.closest;
  if (!closest?.available || !closest?.url) return null;
  return {
    snapshotUrl: closest.url,
    timestamp: String(closest.timestamp ?? ""),
    status: String(closest.status ?? "200"),
  };
}

/**
 * CDX API — fallback preciso. Busca um snapshot com statuscode 200
 * num range de datas (date ± 30 dias).
 */
export async function cdxLookup(
  url: string,
  date: string // YYYY-MM-DD
): Promise<WaybackSnapshot | null> {
  const from = new Date(date + "T00:00:00Z");
  const to = new Date(date + "T00:00:00Z");
  from.setUTCDate(from.getUTCDate() - 30);
  to.setUTCDate(to.getUTCDate() + 30);

  const api =
    `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}` +
    `&output=json&from=${formatDate(from)}&to=${formatDate(to)}` +
    `&limit=1&filter=statuscode:200`;

  const res = await fetchWithTimeout(api);
  if (!res) return null;
  const rows: unknown = await res.json().catch(() => null);
  if (!Array.isArray(rows) || rows.length < 2) return null;

  const [ts, original, statuscode] = rows[1] as string[];
  return {
    snapshotUrl: `https://web.archive.org/web/${ts}/${original}`,
    timestamp: ts,
    status: String(statuscode ?? "200"),
  };
}

/**
 * Busca um snapshot para `url` na data `date` (YYYY-MM-DD).
 * Tenta Availability API; se falhar, cai para CDX.
 * Retorna null se não houver snapshot ou em caso de erro/timeout.
 */
export async function findSnapshot(
  url: string,
  date: string
): Promise<WaybackSnapshot | null> {
  const first = await availabilityLookup(url, date);
  if (first) return first;
  return cdxLookup(url, date);
}

/**
 * URL do HTML bruto original (sem toolbar do Wayback), para parsing.
 */
export function rawHtmlUrl(snapshot: WaybackSnapshot, originalUrl?: string): string {
  const target = originalUrl ?? snapshot.snapshotUrl.replace(/^https?:\/\/web\.archive\.org\/web\/\d+\/?/, "");
  return `https://web.archive.org/web/${snapshot.timestamp}id_/${target}`;
}

/**
 * Baixa o HTML bruto do snapshot e extrai a manchete (h1 → title → header link).
 */
export async function fetchHeadline(snapshot: WaybackSnapshot, originalUrl?: string): Promise<string | null> {
  const { extractHeadline } = await import("./parse-headline");
  const url = rawHtmlUrl(snapshot, originalUrl);
  const res = await fetchWithTimeout(url);
  if (!res) return null;
  const html = await res.text().catch(() => "");
  if (!html) return null;
  return extractHeadline(html);
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
