"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SITE_URL } from "@/lib/site";

function formatDatePt(date: string): string {
  const [y, m, d] = date.split("-");
  const meses = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  return `${Number(d)} de ${meses[Number(m) - 1]} de ${y}`;
}

export function ShareCard({ date, siteNames }: { date: string; siteNames?: string[] }) {
  const [status, setStatus] = useState<string | null>(null);
  const [imgState, setImgState] = useState<"loading" | "loaded" | "error">("loading");
  const [nonce, setNonce] = useState(0);
  const bust = nonce ? `v=${nonce}` : "";
  const cardUrl = `/${date}/card${bust ? `?${bust}` : ""}`;
  const storyCardUrl = `/${date}/card?format=story${bust ? `&${bust}` : ""}`;

  async function copyCaption() {
    const sites = siteNames?.length ? siteNames.slice(0, 4).join(", ") : "Google, Orkut e cia";
    const link = `${SITE_URL}/${date}?utm_source=instagram&utm_medium=social&utm_campaign=share-card`;
    const caption = `Em ${formatDatePt(date)}, aquela internet era assim 🕰️\n\n${sites} renderizados direto do acervo do Internet Archive. Qual site te trouxe mais memória? 👇\n\n${link}`;
    try {
      await navigator.clipboard.writeText(caption);
      setStatus("Legenda copiada! Cola lá no Instagram ✨");
    } catch {
      setStatus("Não consegui copiar — selecione e copie manualmente");
    }
  }

  async function fetchCard(url: string): Promise<Blob> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`card ${res.status}`);
    return res.blob();
  }

  async function download(url: string, filename: string, okMsg: string) {
    setStatus("gerando PNG...");
    try {
      const blob = await fetchCard(url);
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(objUrl);
      setStatus(okMsg);
    } catch {
      setStatus("erro ao gerar PNG");
    }
  }

  async function share() {
    try {
      const blob = await fetchCard(cardUrl);
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
      <div className="relative w-full max-w-3xl">
        {imgState !== "loaded" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
            {imgState === "loading" ? (
              <>
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-neutral-100" />
                <p className="text-sm text-neutral-500">
                  Gerando o card… pode levar até 1 minuto na primeira vez.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-red-600">Não consegui gerar o card.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNonce((n) => n + 1);
                    setImgState("loading");
                  }}
                >
                  Tentar novamente
                </Button>
              </>
            )}
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cardUrl}
          alt={`Card: Aquela internet em ${date}`}
          onLoad={() => setImgState("loaded")}
          onError={() => setImgState("error")}
          className={`w-full rounded-lg border border-neutral-200 dark:border-neutral-800 ${
            imgState === "loaded" ? "" : "invisible"
          }`}
        />
      </div>
      {imgState === "loaded" && (
        <p className="rounded-md bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          ✅ Todos os cards foram carregados! Já pode baixar ou compartilhar.
        </p>
      )}
      <div className="flex flex-wrap justify-center gap-2">
        <Button
          onClick={() => download(cardUrl, `aquela-internet-${date}.png`, "PNG baixado!")}
          disabled={imgState !== "loaded"}
        >
          ⬇️ Baixar PNG (feed)
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            download(storyCardUrl, `aquela-internet-${date}-story.png`, "PNG do story baixado!")
          }
          disabled={imgState !== "loaded"}
        >
          📱 Baixar Stories
        </Button>
        <Button variant="outline" onClick={share} disabled={imgState !== "loaded"}>
          🔗 Compartilhar
        </Button>
        <Button variant="ghost" onClick={copyCaption}>
          📋 Copiar legenda
        </Button>
      </div>
      {status && <p className="text-sm text-neutral-500">{status}</p>}
    </div>
  );
}
