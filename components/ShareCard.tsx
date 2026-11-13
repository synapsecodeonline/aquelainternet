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

const btnSecondary =
  "h-11 rounded-xl border-neutral-200 bg-white/80 font-semibold text-neutral-600 backdrop-blur hover:border-pink-300 hover:text-pink-600 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-300 dark:hover:border-pink-700 dark:hover:text-pink-400";

export function ShareCard({ date, siteNames }: { date: string; siteNames?: string[] }) {
  const [status, setStatus] = useState<string | null>(null);
  const [imgState, setImgState] = useState<"loading" | "loaded" | "error">("loading");
  const [nonce, setNonce] = useState(0);
  const bust = nonce ? `v=${nonce}` : "";
  // Padrão: story (1080x1920). Feed é a opção secundária.
  const cardUrl = `/${date}/card${bust ? `?${bust}` : ""}`;
  const feedCardUrl = `/${date}/card?format=feed${bust ? `&${bust}` : ""}`;

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
      const file = new File([blob], `aquela-internet-${date}-story.png`, { type: "image/png" });
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
    <div className="flex flex-col items-center gap-5">
      <div className="w-full max-w-xl rounded-3xl border border-neutral-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/70">
        <div className="relative">
          {imgState !== "loaded" && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-neutral-50/95 dark:bg-neutral-950/95">
              {imgState === "loading" ? (
                <>
                  <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-pink-200 border-t-pink-500" />
                  <p className="px-6 text-center text-sm font-medium text-neutral-500 dark:text-neutral-400">
                    Gerando o card… pode levar até 1 minuto na primeira vez.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-red-600">Não consegui gerar o card.</p>
                  <Button
                    variant="outline"
                    className={btnSecondary}
                    onClick={() => {
                      setNonce((n) => n + 1);
                      setImgState("loading");
                    }}
                  >
                    🔄 Tentar novamente
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
            className={`w-full rounded-2xl border border-neutral-200 dark:border-neutral-800 ${
              imgState === "loaded" ? "" : "invisible"
            }`}
          />
        </div>
      </div>

      {imgState === "loaded" && (
        <p className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          ✅ Card pronto! Baixe ou compartilhe abaixo.
        </p>
      )}

      <div className="flex flex-wrap justify-center gap-2.5">
        <Button
          className="h-11 rounded-xl bg-gradient-to-r from-pink-500 to-orange-400 px-5 font-bold text-white hover:from-pink-600 hover:to-orange-500"
          onClick={() =>
            download(cardUrl, `aquela-internet-${date}-story.png`, "PNG do story baixado!")
          }
          disabled={imgState !== "loaded"}
        >
          📱 Baixar Stories
        </Button>
        <Button
          variant="outline"
          className={btnSecondary}
          onClick={() => download(feedCardUrl, `aquela-internet-${date}-feed.png`, "PNG do feed baixado!")}
          disabled={imgState !== "loaded"}
        >
          ⬇️ Baixar PNG (feed)
        </Button>
        <Button variant="outline" className={btnSecondary} onClick={share} disabled={imgState !== "loaded"}>
          🔗 Compartilhar
        </Button>
        <Button variant="ghost" className="h-11 rounded-xl px-4 font-semibold text-neutral-500 hover:text-pink-600 dark:text-neutral-400" onClick={copyCaption}>
          📋 Copiar legenda
        </Button>
      </div>
      {status && (
        <p className="rounded-full bg-neutral-100 px-4 py-1.5 text-sm font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
          {status}
        </p>
      )}
    </div>
  );
}
