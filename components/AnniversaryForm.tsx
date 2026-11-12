"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { isValidDate } from "@/lib/date";
import { eraForDate } from "@/lib/era";

export function AnniversaryForm() {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  const preview =
    isValidDate(date) && date <= new Date().toISOString().slice(0, 10)
      ? (() => {
          const birth = new Date(`${date}T00:00:00Z`);
          const now = new Date();
          let age = now.getUTCFullYear() - birth.getUTCFullYear();
          const m = now.getUTCMonth() - birth.getUTCMonth();
          if (m < 0 || (m === 0 && now.getUTCDate() < birth.getUTCDate())) age--;
          const era = eraForDate(date);
          return { age, era };
        })()
      : null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidDate(date)) {
      setError("Data inválida — confira dia, mês e ano.");
      return;
    }
    if (date > new Date().toISOString().slice(0, 10)) {
      setError("Essa data ainda não aconteceu — a máquina do tempo só vai pra trás. ⏪");
      return;
    }
    router.push(`/${date}`);
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-sm flex-col gap-3">
      <input
        type="date"
        value={date}
        min="2000-01-01"
        onChange={(e) => {
          setDate(e.target.value);
          setError(null);
        }}
        max={new Date().toISOString().slice(0, 10)}
        required
        className="w-full rounded-lg border border-neutral-300 bg-transparent px-4 py-3 text-lg dark:border-neutral-700"
      />
      {preview && (
        <p className="rounded-lg bg-pink-50 px-3 py-2 text-sm text-pink-800 dark:bg-pink-950/40 dark:text-pink-200">
          Você tinha <strong>{preview.age} anos</strong> — era a fase{" "}
          <strong>{preview.era.label}</strong>. ✨
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" size="lg">
        🕰️ Ver minha internet
      </Button>
    </form>
  );
}
