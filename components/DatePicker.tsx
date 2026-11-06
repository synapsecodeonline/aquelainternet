"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const [error, setError] = useState<string | null>(null);

  function go(d: string) {
    if (!d) return;
    const today = new Date().toISOString().slice(0, 10);
    if (d > today) {
      setError("essa data ainda não aconteceu");
      return;
    }
    setError(null);
    router.push(`/${d}`);
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
        <Button size="lg" onClick={() => go(date)}>
          Ver aquela internet
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
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
    </div>
  );
}
