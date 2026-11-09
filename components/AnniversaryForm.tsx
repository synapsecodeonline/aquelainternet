"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { isValidDate } from "@/lib/date";

export function AnniversaryForm() {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [error, setError] = useState<string | null>(null);

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
        onChange={(e) => {
          setDate(e.target.value);
          setError(null);
        }}
        max={new Date().toISOString().slice(0, 10)}
        required
        className="w-full rounded-lg border border-neutral-300 bg-transparent px-4 py-3 text-lg dark:border-neutral-700"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" size="lg">
        🕰️ Ver minha internet
      </Button>
    </form>
  );
}
