"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const SHORTCUTS = [
  { label: "7x1", date: "2014-07-07" },
  { label: "11/09", date: "2001-09-11" },
  { label: "Pandemia", date: "2020-03-15" },
  { label: "Bug do milênio", date: "2000-01-01" },
];

export function DatePicker() {
  const router = useRouter();
  const defaultDate = new Date(Date.now() - 10 * 365.25 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const [date, setDate] = useState(defaultDate);
  const [site, setSite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function path(d: string) {
    const s = site.trim();
    return s ? `/${d}?site=${encodeURIComponent(s)}` : `/${d}`;
  }

  function go(d: string) {
    if (!d) return;
    const today = new Date().toISOString().slice(0, 10);
    if (d > today) {
      setError("essa data ainda não aconteceu");
      return;
    }
    setError(null);
    startTransition(() => router.push(path(d)));
  }

  function surprise() {
    const start = new Date("1996-01-01").getTime();
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
          min="1994-01-01"
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
        placeholder="ou busque um site específico (ex.: uol.com.br)"
        className="h-11 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        aria-label="Buscar um site específico"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={surprise}>
          🎲 Me surpreenda
        </Button>
        {SHORTCUTS.map((s) => (
          <Button key={s.date} variant="ghost" size="sm" onClick={() => go(s.date)}>
            {s.label}
          </Button>
        ))}
      </div>
      <p className="text-sm text-neutral-500">
        🎂 <Link href="/aniversario" className="underline hover:text-neutral-800 dark:hover:text-neutral-300">
          Ver a internet no dia do seu nascimento
        </Link>
      </p>
    </div>
  );
}
