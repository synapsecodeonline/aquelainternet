import Link from "next/link";
import { notFound } from "next/navigation";
import { getDay } from "@/lib/cache";
import { SiteGrid } from "@/components/SiteGrid";
import { ErrorState } from "@/components/ErrorState";
import { RandomDateLink } from "@/components/RandomDateLink";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { isValidDate } from "@/lib/date";
import { eraForDate } from "@/lib/era";
import { findExactSiteRecord, searchSiteWindow } from "@/lib/search";
import { sitesForDate } from "@/lib/sites";
import { SITE_URL } from "@/lib/site";
import { normalizeHost } from "@/lib/wayback";
import type { DayResult } from "@/types";
import type { Metadata } from "next";

function formatDatePt(date: string): string {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

export async function generateMetadata({
  params,
}: {
  params: { date: string };
}): Promise<Metadata> {
  const date = params.date;
  return {
    title: `Aquela Internet em ${formatDatePt(date)} | Aquela Internet`,
    description: "Veja como estavam Google, Orkut, UOL e mais naquele dia.",
    openGraph: {
      title: `Aquela Internet em ${formatDatePt(date)}`,
      images: [`${SITE_URL}/${date}/card?format=feed`],
    },
    twitter: { card: "summary_large_image" },
    alternates: { canonical: `${SITE_URL}/${date}` },
  };
}

export default async function DatePage({
  params,
  searchParams,
}: {
  params: { date: string };
  searchParams: { site?: string };
}) {
  const date = params.date;
  if (!isValidDate(date)) notFound();

  const today = new Date().toISOString().slice(0, 10);
  if (date > today) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <ErrorState message="Essa data ainda não aconteceu." />
      </main>
    );
  }

  const siteQuery = searchParams?.site?.trim();
  const isSearch = Boolean(siteQuery);
  let fellBack = false;

  let result: DayResult;
  try {
    if (isSearch) {
      const host = normalizeHost(siteQuery!);
      if (!host) {
        return (
          <main className="flex min-h-screen items-center justify-center px-6">
            <ErrorState message="Site inválido. Tente algo como uol.com.br" />
          </main>
        );
      }
      // Data + domínio: UM card somente se houver captura NO DIA EXATO.
      // Sem registro naquele dia → vários cards do mesmo domínio em
      // outras datas dentro de ±30 dias.
      const exact = await findExactSiteRecord(host, date);
      if (exact) {
        result = { date, sites: [exact], warnings: [] };
      } else {
        fellBack = true;
        const window_ = await searchSiteWindow(host, date);
        result = {
          date,
          sites: window_,
          warnings: window_.length
            ? [
                `${host} não tem captura no dia ${formatDatePt(date)} — estas são capturas do site num período de ±30 dias.`,
              ]
            : [`${host} não tem nenhuma captura com conteúdo real no acervo.`],
        };
      }
    } else {
      result = await getDay(date);
    }
  } catch {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <ErrorState
          message="Não conseguimos falar com o Internet Archive agora."
          retryHref={`/${date}`}
        />
      </main>
    );
  }

  const era = eraForDate(date);

  // "Manchetes do dia": escolha determinística por data entre os sites com headline
  const withHeadline = result.sites.filter((s) => s.available && s.headline);
  const headlinePick =
    withHeadline.length > 0
      ? withHeadline[
          date.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % withHeadline.length
        ]
      : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Aquela Internet em ${formatDatePt(date)}`,
    datePublished: date,
    url: `${SITE_URL}/${date}`,
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* fundo decorativo: mesmo do início */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% -10%, rgba(236,72,153,0.10), transparent), radial-gradient(50% 40% at 80% 110%, rgba(56,189,248,0.08), transparent)",
        }}
      />
      <div className="relative mx-auto w-full max-w-5xl px-6 py-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <header className="mb-8 space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm font-medium text-neutral-500 transition-colors hover:text-pink-600 dark:text-neutral-400 dark:hover:text-pink-400"
          >
            ← Voltar ao início
          </Link>
          <div className="space-y-3">
            <h1 className="text-balance text-3xl font-extrabold tracking-tight sm:text-5xl">
              {isSearch ? (
                <>
                  <span className="text-pink-600 dark:text-pink-400">{normalizeHost(siteQuery!)}</span>{" "}
                  {fellBack ? "em datas próximas" : `em ${formatDatePt(date)}`}
                </>
              ) : (
                <>
                  Aquela internet em{" "}
                  <span className="bg-gradient-to-r from-pink-500 to-orange-400 bg-clip-text text-transparent">
                    {formatDatePt(date)}
                  </span>
                </>
              )}
            </h1>
            {isSearch ? (
              <p className="max-w-xl text-neutral-600 dark:text-neutral-400">
                {fellBack
                  ? `${result.sites.length} captura(s) do site num período de ±30 dias desta data.`
                  : `Captura de ${normalizeHost(siteQuery!)} no dia ${formatDatePt(date)}.`}
              </p>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-block rounded-full border border-pink-300/60 bg-pink-50 px-4 py-1.5 text-xs font-semibold text-pink-600 dark:border-pink-800 dark:bg-pink-950/40 dark:text-pink-300">
                    {era.label}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {result.sites.length} de {sitesForDate(date).length} portais com captura neste dia
                  </span>
                </div>
                <p className="max-w-xl text-neutral-600 dark:text-neutral-400">{era.blurb}</p>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              href={
                fellBack
                  ? `/buscar/share?site=${encodeURIComponent(normalizeHost(siteQuery!))}`
                  : `/${date}/share`
              }
              target="_blank"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-orange-400 px-5 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md hover:brightness-110"
            >
              📸 Gerar card pra compartilhar
            </Link>
            <RandomDateLink site={isSearch ? normalizeHost(siteQuery!) : undefined} />
            <CopyLinkButton url={`${SITE_URL}/${date}`} />
          </div>
        </header>

        {!fellBack && headlinePick?.headline && (
          <div className="mb-6 rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 dark:border-amber-900/60 dark:from-amber-950/40 dark:to-orange-950/30">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
              📰 Manchetes do dia — {headlinePick.siteName}
            </span>
            <p className="mt-1.5 text-base font-medium text-neutral-800 dark:text-neutral-200">
              “{headlinePick.headline}”
            </p>
          </div>
        )}

        {result.warnings.map((w) => (
          <div
            key={w}
            className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"
          >
            {w}
          </div>
        ))}

        {result.sites.length === 0 ? (
          <div className="rounded-3xl border border-neutral-200 bg-white/80 px-6 py-14 text-center dark:border-neutral-800 dark:bg-neutral-900/70">
            <span className="text-4xl">🕳️</span>
            <p className="mt-3 font-semibold text-neutral-700 dark:text-neutral-300">
              Nenhum site tem captura neste dia exato
            </p>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Tente uma data próxima ou busque um site específico na página inicial.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex h-11 items-center rounded-xl bg-pink-600 px-5 text-sm font-bold text-white transition-colors hover:bg-pink-700"
            >
              Escolher outra data →
            </Link>
          </div>
        ) : (
          <SiteGrid sites={result.sites} />
        )}

        <footer className="mt-14 flex flex-col items-center gap-2 pb-6 text-center text-xs text-neutral-500">
          <p>
            Dados históricos via{" "}
            <a
              href="https://archive.org/developers/wayback.html"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-pink-600 dark:hover:text-pink-400"
            >
              Internet Archive Wayback Machine
            </a>
            . Conteúdo arquivado pertence aos respectivos autores.
          </p>
        </footer>
      </div>
    </main>
  );
}
