"use client";

import { useEffect, useState } from "react";
import type { SnapshotRecord } from "@/types";
import { topicMatch } from "@/lib/topic";
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
  const [query, setQuery] = useState("");
  const filtered = query.trim() ? sites.filter((s) => topicMatch(s, query)) : sites;
  const [order, setOrder] = useState(() => pickRandom(sites));

  // Filtro mudou → re-sorteia dentro do conjunto filtrado
  useEffect(() => {
    setOrder(pickRandom(filtered));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const filtering = query.trim().length > 0;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {filtering ? (
            <p className="text-xs text-neutral-500">
              {filtered.length} de {sites.length} cards com “{query.trim()}”
            </p>
          ) : sites.length > MAX_CARDS ? (
            <p className="text-xs text-neutral-500">
              Mostrando {MAX_CARDS} de {sites.length} sites com captura.
            </p>
          ) : (
            <span />
          )}
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrar por assunto… (ex.: política, tech, futebol)"
            className="h-8 w-56 rounded-md border border-neutral-300 bg-white px-3 text-xs text-neutral-700 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 sm:w-64"
            aria-label="Filtrar cards por assunto"
          />
        </div>
        <button
          type="button"
          onClick={() => setOrder(pickRandom(filtered))}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          🔀 {filtering || sites.length > MAX_CARDS ? "Novas sugestões" : "Embaralhar"}
        </button>
      </div>
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-6 py-10 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
          Nenhum card fala de “{query.trim()}” nesta seleção. Tente outro termo.
        </div>
      ) : (
        <div className={`grid grid-cols-1 gap-4 ${compact ? "" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
          {order.map((s) => (
            <SiteCard key={s.siteSlug} site={s} compact={compact} />
          ))}
        </div>
      )}
    </div>
  );
}
