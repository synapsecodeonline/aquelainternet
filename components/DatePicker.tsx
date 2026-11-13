"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// Internet brasileira já "cheia de sites" a partir de ~2003 — antes disso
// o acervo é ralo. Por isso o mínimo e o "surpreenda-me" começam em 2003.
const MIN_DATE = "2003-01-01";

export function DatePicker() {
  const router = useRouter();
  // Data começa vazia: o usuário pode buscar só pelo domínio (vai para
  // /buscar, que mostra capturas em datas diferentes) ou combinar os dois.
  const [date, setDate] = useState("");
  const [site, setSite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function go(d: string) {
    const s = site.trim();
    const today = new Date().toISOString().slice(0, 10);
    if (d && d > today) {
      setError("essa data ainda não aconteceu");
      return;
    }
    if (!d && !s) {
      setError("escolha uma data ou busque um site");
      return;
    }
    setError(null);
    const qs = s ? `?site=${encodeURIComponent(s)}` : "";
    const target = d ? `/${d}${qs}` : `/buscar${qs}`;
    startTransition(() => router.push(target));
  }

  function surprise() {
    const start = new Date(MIN_DATE).getTime();
    const end = Date.now();
    const d = new Date(start + Math.random() * (end - start));
    go(d.toISOString().slice(0, 10));
  }

  return (
    <div className="w-full max-w-md space-y-4">
      <div className="flex gap-2">
        <input
          type="date"
          value={date}
          min={MIN_DATE}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setDate(e.target.value)}
          className="h-12 flex-1 rounded-md border border-neutral-300 bg-white px-3 text-base dark:border-neutral-700 dark:bg-neutral-900"
          aria-label="Escolha uma data"
        />
        <Button size="lg" onClick={() => go(date)} disabled={isPending}>
          {isPending ? "Carregando…" : "Ver aquela internet"}
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <input
        type="text"
        value={site}
        onChange={(e) => setSite(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            go(date);
          }
        }}
        placeholder="ou busque um site específico (ex.: uol.com.br)"
        className="h-11 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        aria-label="Buscar um site específico"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={surprise}>
          🎲 Me surpreenda
        </Button>
      </div>
    </div>
  );
}
