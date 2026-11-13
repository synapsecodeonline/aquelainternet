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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/70">
        <div className="flex flex-wrap items-center gap-3">
          {filtering ? (
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              {filtered.length} de {sites.length} cards com “{query.trim()}”
            </p>
          ) : sites.length > MAX_CARDS ? (
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Mostrando {MAX_CARDS} de {sites.length} sites com captura
            </p>
          ) : (
            <span />
          )}
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrar por assunto… (ex.: política, tech, futebol)"
            className="h-10 w-56 rounded-xl border border-neutral-200 bg-white px-3.5 text-sm text-neutral-700 placeholder:text-neutral-400 transition-colors focus:border-pink-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200 sm:w-72"
            aria-label="Filtrar cards por assunto"
          />
        </div>
        <button
          type="button"
          onClick={() => setOrder(pickRandom(filtered))}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-neutral-600 backdrop-blur transition-all hover:border-pink-300 hover:text-pink-600 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-300 dark:hover:border-pink-700 dark:hover:text-pink-400"
        >
          🔀 {filtering || sites.length > MAX_CARDS ? "Novas sugestões" : "Embaralhar"}
        </button>
      </div>
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white/80 px-6 py-10 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/70">
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
