"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { isValidDate } from "@/lib/date";

function pastDate(yearsAgo: number): string {
  return new Date(Date.now() - yearsAgo * 365.25 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

export function CompareForm({ a, b }: { a?: string; b?: string }) {
  const router = useRouter();
  const [dateA, setDateA] = useState(a ?? pastDate(10));
  const [dateB, setDateB] = useState(b ?? pastDate(20));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const today = new Date().toISOString().slice(0, 10);
    if (!isValidDate(dateA) || !isValidDate(dateB)) {
      setError("Confira as duas datas.");
      return;
    }
    if (dateA > today || dateB > today) {
      setError("Datas no futuro não existem — ainda.");
      return;
    }
    if (dateA === dateB) {
      setError("Escolha duas datas diferentes pra comparar.");
      return;
    }
    setError(null);
    startTransition(() =>
      router.push(`/comparar?a=${dateA}&b=${dateB}`)
    );
  }

  const inputCls =
    "h-12 flex-1 rounded-md border border-neutral-300 bg-white px-3 text-base dark:border-neutral-700 dark:bg-neutral-900";

  return (
    <form onSubmit={submit} className="flex w-full max-w-2xl flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={dateA}
          min="1994-01-01"
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setDateA(e.target.value)}
          className={inputCls}
          aria-label="Primeira data"
        />
        <span className="text-neutral-400">vs</span>
        <input
          type="date"
          value={dateB}
          min="1994-01-01"
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setDateB(e.target.value)}
          className={inputCls}
          aria-label="Segunda data"
        />
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "Carregando…" : "Comparar"}
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
