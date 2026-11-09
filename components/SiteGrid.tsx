"use client";

import { useState } from "react";
import type { SnapshotRecord } from "@/types";
import { SiteCard } from "./SiteCard";

const MAX_CARDS = 10;

function pickRandom(sites: SnapshotRecord[]): SnapshotRecord[] {
  const pool = [...sites].sort(() => Math.random() - 0.5);
  // Máximo de 10 cards; se houver mais sites, sorteia um subconjunto diferente
  // a cada clique — sites nunca se repetem dentro da grade.
  return pool.slice(0, MAX_CARDS);
}

export function SiteGrid({
  sites,
  compact = false,
}: {
  sites: SnapshotRecord[];
  compact?: boolean;
}) {
  // Estado no cliente: cada clique sorteia uma nova seleção/ordem de sites
  const [order, setOrder] = useState(() => pickRandom(sites));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        {sites.length > MAX_CARDS ? (
          <p className="text-xs text-neutral-500">
            Mostrando {MAX_CARDS} de {sites.length} sites com captura.
          </p>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => setOrder(pickRandom(sites))}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          🔀 {sites.length > MAX_CARDS ? "Novas sugestões" : "Embaralhar"}
        </button>
      </div>
      <div className={`grid grid-cols-1 gap-4 ${compact ? "" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
        {order.map((s) => (
          <SiteCard key={s.siteSlug} site={s} compact={compact} />
        ))}
      </div>
    </div>
  );
}
