import { iframeUrl } from "./wayback";

export const THUMB_TIMEOUT_MS = 15000;
const THUMB_ROUNDS = 3;
const THUMB_CACHE_TTL_MS = 50 * 60 * 1000;

// Cache em memória dos screenshots por snapshotUrl — instância serverless
// reaproveita entre gerações de card (o card em si já é cacheado por 1h).
const thumbCache = new Map<string, { data: string; ts: number }>();

/** Viewport por formato: captura o INÍCIO da página (masthead + manchete
 *  principal), como os grandes portais renderizam no mobile. O painel do
 *  card é ~0.76 de proporção no story e ~3.3 no feed — o crop acompanha. */
export const VIEWPORTS = {
  story: { w: 414, h: 900 },
  feed: { w: 1024, h: 420 },
} as const;

/** Providers de screenshot, em ordem de tentativa. */
export function thumbUrls(snapshotUrl: string, isStory: boolean): string[] {
  const target = iframeUrl(snapshotUrl);
  const vp = isStory ? VIEWPORTS.story : VIEWPORTS.feed;
  const mobileParams = isStory
    ? "&screenshot.viewport.isMobile=true&screenshot.viewport.hasTouch=true"
    : "";
  return [
    `https://image.thum.io/get/width/${vp.w}/crop/${vp.h}/${target}`,
    // Microlink embed devolve o screenshot direto em PNG
    `https://api.microlink.io/?url=${encodeURIComponent(target)}&screenshot=true&meta=false&embed=screenshot.url&screenshot.viewport.width=${vp.w}&screenshot.viewport.height=${vp.h}${mobileParams}`,
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
async function fetchThumbOnce(snapshotUrl: string, isStory: boolean): Promise<string | null> {
  const targets = thumbUrls(snapshotUrl, isStory);
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

/** Screenshot com cache + retries: sem imagem sai com fallback de letra,
 *  o card nunca falha por screenshot indisponível. */
export async function fetchThumb(snapshotUrl: string, isStory: boolean): Promise<string | null> {
  const hit = thumbCache.get(snapshotUrl);
  if (hit && Date.now() - hit.ts < THUMB_CACHE_TTL_MS) return hit.data;

  let thumb: string | null = null;
  for (let round = 0; !thumb && round < THUMB_ROUNDS; round++) {
    thumb = await fetchThumbOnce(snapshotUrl, isStory);
    if (thumb) thumbCache.set(snapshotUrl, { data: thumb, ts: Date.now() });
    if (!thumb && round < THUMB_ROUNDS - 1) {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  return thumb;
}
