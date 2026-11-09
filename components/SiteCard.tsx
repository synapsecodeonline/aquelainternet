"use client";

import { useState } from "react";
import type { SnapshotRecord } from "@/types";
import { iframeUrl } from "@/lib/wayback";

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

export function SiteCard({ site }: { site: SnapshotRecord }) {
  const [iframeBlocked, setIframeBlocked] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const gapDays = snapshotGapDays(site.snapshotTimestamp, site.requestedDate);
  const offDate = gapDays !== null && gapDays > 0;
  const farOff = gapDays !== null && gapDays > 30;

  if (!site.available || !site.snapshotUrl) {
    return (
      <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-neutral-100 p-4 text-center text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
        <span className="text-sm font-medium text-neutral-400" style={{ color: site.siteColor }}>
          {site.siteName}
        </span>
        <span className="text-xs">sem registro neste dia</span>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex items-center justify-between gap-2 border-b border-neutral-100 px-3 py-2 dark:border-neutral-800">
        <div className="min-w-0">
          <span className="text-sm font-semibold">{site.siteName}</span>
          <span className="ml-2 text-xs text-neutral-500">{formatTs(site.snapshotTimestamp)}</span>
          {offDate && (
            <span
              title={`Captura a ${gapDays} dia(s) de distância da data pesquisada`}
              className={`ml-2 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
                farOff
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
              }`}
            >
              {farOff ? "⚠ " : ""}fora da data
            </span>
          )}
        </div>
        <a
          href={site.snapshotUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs text-blue-600 hover:underline dark:text-blue-400"
        >
          abrir no Wayback ↗
        </a>
      </div>

      <div className="relative h-[400px] w-full bg-white">
        {!loaded && !iframeBlocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600" />
            <span className="text-xs text-neutral-400">carregando…</span>
          </div>
        )}
        {iframeBlocked && (
          <div className="flex h-full items-center justify-center p-4 text-center text-xs text-neutral-400">
            não foi possível exibir este snapshot
          </div>
        )}
        {!iframeBlocked && (
          <iframe
            src={iframeUrl(site.snapshotUrl)}
            title={`${site.siteName} em ${site.requestedDate}`}
            className="h-full w-full bg-white"
            sandbox="allow-scripts allow-same-origin allow-popups"
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setIframeBlocked(true)}
          />
        )}
      </div>

      <div className="border-t border-neutral-100 px-3 py-2 dark:border-neutral-800">
        {site.headline ? (
          <p className="truncate text-xs text-neutral-600 dark:text-neutral-400" title={site.headline}>
            “{site.headline}”
          </p>
        ) : (
          <p className="text-xs text-neutral-400">manchete não extraída</p>
        )}
      </div>
    </div>
  );
}
