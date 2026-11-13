import Link from "next/link";
import { ShareCard } from "@/components/ShareCard";
import { ErrorState } from "@/components/ErrorState";
import { normalizeHost } from "@/lib/wayback";
import { isValidDate } from "@/lib/date";
import { searchSiteTimeline, searchSiteWindow, pickRecord } from "@/lib/search";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

function formatDatePt(date: string): string {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

export default async function BuscarSharePage({
  searchParams,
}: {
  searchParams: { site?: string; date?: string };
}) {
  const host = normalizeHost(searchParams?.site ?? "");
  const dateParam = searchParams?.date;
  const hasDate = Boolean(dateParam && isValidDate(dateParam));

  if (!host) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <ErrorState message="Site inválido. Tente algo como uol.com.br" retryHref="/" />
      </main>
    );
  }

  // Mesmo pick do card: fixa o timestamp da captura exibida para a URL
  // site+ts gerar exatamente esse card (e não "qualquer data").
  // Com ?date=, o pool são as capturas do domínio na janela de ±30 dias
  // (mesmo fallback da página de busca); sem ela, a timeline do site.
  let cardTs: string | null = null;
  try {
    const records = hasDate
      ? await searchSiteWindow(host, dateParam!)
      : await searchSiteTimeline(host);
    const pick = pickRecord(records);
    cardTs = pick?.snapshotTimestamp ?? null;
  } catch {
    // sem captura — card mostra estado vazio
  }

  const qs = `site=${encodeURIComponent(host)}`;
  const cardQs = cardTs ? `${qs}&ts=${cardTs}` : qs;
  const backHref = hasDate ? `/${dateParam}?site=${encodeURIComponent(host)}` : `/buscar?${qs}`;
  const link = hasDate
    ? `${SITE_URL}/${dateParam}?site=${encodeURIComponent(host)}&utm_source=instagram&utm_medium=social&utm_campaign=share-card`
    : `${SITE_URL}/buscar?${qs}&utm_source=instagram&utm_medium=social&utm_campaign=share-card`;
  const caption = hasDate
    ? `${host} em datas próximas de ${formatDatePt(dateParam!)} 🕰️\n\nCapturas desse site num período de ±30 dias, direto do acervo do Internet Archive. Como ele era? 👇\n\n${link}`
    : `${host} através do tempo 🕰️\n\nCapturas desse site em diferentes datas, direto do acervo do Internet Archive. Como ele era antigamente? 👇\n\n${link}`;

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% -10%, rgba(236,72,153,0.10), transparent), radial-gradient(50% 40% at 80% 110%, rgba(56,189,248,0.08), transparent)",
        }}
      />
      <div className="relative mx-auto w-full max-w-4xl px-6 py-10">
        <header className="mb-8 space-y-3">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-sm font-medium text-neutral-500 transition-colors hover:text-pink-600 dark:text-neutral-400 dark:hover:text-pink-400"
          >
            ← Voltar{hasDate ? ` para ${formatDatePt(dateParam!)}` : ` para ${host}`}
          </Link>
          <h1 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
            📸 Card de <span className="text-pink-600 dark:text-pink-400">{host}</span>
          </h1>
          <p className="max-w-xl text-neutral-600 dark:text-neutral-400">
            Baixe a imagem em formato de story, copie a legenda e poste nas suas redes.
          </p>
        </header>
        <ShareCard
          storyUrl={`/buscar/card?${cardQs}`}
          feedUrl={`/buscar/card?${cardQs}&format=feed`}
          fileBase={`aquela-internet-${host}`}
          altText={`Card: ${host}${hasDate ? ` em ${formatDatePt(dateParam!)}` : " através do tempo"}`}
          caption={caption}
        />
        {cardTs && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href={`/buscar/card?${cardQs}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-pink-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-pink-600/25 transition-transform hover:scale-105"
            >
              🖼️ Abrir card story ({host})
            </a>
            <a
              href={`/buscar/card?${cardQs}&format=feed`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-6 py-3 text-sm font-bold text-neutral-700 transition-colors hover:border-pink-500 hover:text-pink-600 dark:border-neutral-700 dark:text-neutral-300 dark:hover:text-pink-400"
            >
              🖼️ Abrir card feed ({host})
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
