"use client";

import { useState } from "react";
import type { SnapshotRecord } from "@/types";

function formatTs(ts: string): string {
  if (!ts || ts.length < 8) return "";
  return `${ts.slice(6, 8)}/${ts.slice(4, 6)}/${ts.slice(0, 4)}`;
}

export function SiteCard({ site }: { site: SnapshotRecord }) {
  const [iframeBlocked, setIframeBlocked] = useState(false);

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

      {!iframeBlocked && (
        <iframe
          src={site.snapshotUrl}
          title={`${site.siteName} em ${site.requestedDate}`}
          className="h-[400px] w-full bg-white"
          sandbox="allow-scripts allow-same-origin allow-popups"
          loading="lazy"
          onError={() => setIframeBlocked(true)}
        />
      )}

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
