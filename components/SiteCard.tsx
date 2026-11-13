"use client";

import { useEffect, useState } from "react";
import type { SnapshotRecord } from "@/types";
import { iframeUrl } from "@/lib/wayback";

/** URL same-origin que injeta viewport mobile no snapshot do Wayback. */
function frameUrl(snapshotUrl: string): string {
  return `/api/frame?u=${encodeURIComponent(iframeUrl(snapshotUrl))}`;
}

function formatTs(ts: string): string {
  if (!ts || ts.length < 8) return "";
  return `${ts.slice(6, 8)}/${ts.slice(4, 6)}/${ts.slice(0, 4)}`;
}

/** Diferença em dias entre a data do snapshot e a data pesquisada. */
function snapshotGapDays(snapshotTimestamp: string, requestedDate: string): number | null {
  const ts = snapshotTimestamp.slice(0, 8); // YYYYMMDD
  const req = requestedDate.replace(/-/g, "");
  if (ts.length < 8 || req.length < 8) return null;
  const a = Date.parse(`${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}T00:00:00Z`);
  const b = Date.parse(`${req.slice(0, 4)}-${req.slice(4, 6)}-${req.slice(6, 8)}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round(Math.abs(a - b) / 86400000);
}

export function SiteCard({ site, compact = false }: { site: SnapshotRecord; compact?: boolean }) {
  const [iframeBlocked, setIframeBlocked] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Páginas do Wayback podem demorar (ou nunca disparar onLoad por causa de
  // assets lentos). Após 12s assumimos que há conteúdo suficiente e
  // liberamos o card — o usuário já pode navegar/interagir com o iframe.
  useEffect(() => {
    if (!site.available || !site.snapshotUrl) return;
    const t = setTimeout(() => setLoaded(true), 12000);
    return () => clearTimeout(t);
  }, [site.available, site.snapshotUrl]);
  const gapDays = snapshotGapDays(site.snapshotTimestamp, site.requestedDate);
  const offDate = gapDays !== null && gapDays > 0;
  const farOff = gapDays !== null && gapDays > 30;

  if (!site.available || !site.snapshotUrl) {
    return (
      <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-2.5 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/60 p-6 text-center dark:border-neutral-700 dark:bg-neutral-900/50">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-black text-white"
          style={{ backgroundColor: site.siteColor || "#a1a1aa" }}
        >
          {site.siteName?.[0]?.toUpperCase() ?? "?"}
        </span>
        <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
          {site.siteName}
        </span>
        <span className="text-xs text-neutral-400">sem registro neste dia</span>
      </div>
    );
  }

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-pink-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-pink-800">
      <div className="flex items-center justify-between gap-2 border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: site.siteColor || "#a1a1aa" }}
          />
          <div className="min-w-0">
            <span className="block truncate text-sm font-bold">{site.siteName}</span>
            <span className="block text-[11px] text-neutral-400">
              {formatTs(site.snapshotTimestamp)}
              {offDate && (
                <span
                  title={`Captura a ${gapDays} dia(s) de distância da data pesquisada`}
                  className={`ml-1.5 inline-block rounded px-1.5 py-px text-[10px] font-semibold ${
                    farOff
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                  }`}
                >
                  {farOff ? "⚠ " : ""}Fora da data pesquisada
                </span>
              )}
            </span>
          </div>
        </div>
        <a
          href={site.snapshotUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-lg border border-neutral-200 px-2.5 py-1 text-[11px] font-semibold text-neutral-500 transition-colors hover:border-pink-300 hover:text-pink-600 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-pink-700 dark:hover:text-pink-400"
        >
          Wayback ↗
        </a>
      </div>

      <div className={`relative w-full bg-white ${compact ? "h-[220px]" : "h-[400px]"}`}>
        {!loaded && !iframeBlocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-pink-200 border-t-pink-500" />
            <span className="text-xs font-medium text-neutral-400">viajando no tempo…</span>
          </div>
        )}
        {iframeBlocked && (
          <div className="flex h-full items-center justify-center p-4 text-center text-xs text-neutral-400">
            não foi possível exibir este snapshot
          </div>
        )}
        {!iframeBlocked && (
          <iframe
            src={frameUrl(site.snapshotUrl)}
            title={`${site.siteName} em ${site.requestedDate}`}
            className="h-full w-full bg-white"
            // sem allow-same-origin: o frame é same-origin via /api/frame,
            // manter a origem opaca impede que scripts do snapshot acessen
            // o DOM ou cookies do site principal
            sandbox="allow-scripts allow-popups"
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setIframeBlocked(true)}
          />
        )}
      </div>

      <div className="border-t border-neutral-100 bg-neutral-50/50 px-4 py-2.5 dark:border-neutral-800 dark:bg-neutral-900/50">
        {site.headline ? (
          <p
            className="truncate text-xs font-medium italic text-neutral-600 dark:text-neutral-400"
            title={site.headline}
          >
            “{site.headline}”
          </p>
        ) : (
          <p className="text-xs text-neutral-400">manchete não extraída</p>
        )}
      </div>
    </div>
  );
}
