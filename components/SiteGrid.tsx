"use client";

import { useState } from "react";
import type { SnapshotRecord } from "@/types";
import { SiteCard } from "./SiteCard";

function shuffled(sites: SnapshotRecord[]): SnapshotRecord[] {
  return [...sites].sort(() => Math.random() - 0.5);
}

export function SiteGrid({
  sites,
  compact = false,
}: {
  sites: SnapshotRecord[];
  compact?: boolean;
}) {
  // Estado no cliente: o shuffle roda no browser e pode ser refeito a cada clique
  const [order, setOrder] = useState(() => shuffled(sites));

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={() => setOrder(shuffled(sites))}
          className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          🔀 Embaralhar sugestões
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
