"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ShareCard({ date }: { date: string }) {
  const [status, setStatus] = useState<string | null>(null);
  const cardUrl = `/${date}/card`;

  async function download() {
    setStatus("gerando PNG...");
    try {
      const res = await fetch(cardUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aquela-internet-${date}.png`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus("PNG baixado!");
    } catch {
      setStatus("erro ao gerar PNG");
    }
  }

  async function share() {
    try {
      const res = await fetch(cardUrl);
      const blob = await res.blob();
      const file = new File([blob], `aquela-internet-${date}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Aquela Internet" });
      } else {
        await navigator.share({ title: "Aquela Internet", url: window.location.href });
      }
    } catch {
      // usuário cancelou ou API indisponível
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cardUrl}
        alt={`Card: Aquela internet em ${date}`}
        className="w-full max-w-3xl rounded-lg border border-neutral-200 dark:border-neutral-800"
      />
      <div className="flex gap-2">
        <Button onClick={download}>⬇️ Baixar PNG</Button>
        <Button variant="outline" onClick={share}>
          🔗 Compartilhar
        </Button>
      </div>
      {status && <p className="text-sm text-neutral-500">{status}</p>}
    </div>
  );
}
