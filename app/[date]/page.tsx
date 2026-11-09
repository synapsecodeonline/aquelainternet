import Link from "next/link";
import { notFound } from "next/navigation";
import { getDay } from "@/lib/cache";
import { SiteGrid } from "@/components/SiteGrid";
import { ErrorState } from "@/components/ErrorState";
import { RandomDateLink } from "@/components/RandomDateLink";
import { isValidDate } from "@/lib/date";
import { eraForDate } from "@/lib/era";
import { searchSiteRecords } from "@/lib/search";
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
      images: [`${SITE_URL}/${date}/card`],
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
      const sites = await searchSiteRecords(host, date);
      result = {
        date,
        sites,
        warnings: sites.length
          ? []
          : ["Nenhuma página com conteúdo real foi encontrada nesse período para esse site."],
      };
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

  // "Manchete do dia": escolha determinística por data entre os sites com headline
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
    <main className="mx-auto max-w-6xl px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/" className="text-sm text-neutral-500 hover:underline">
            ← Aquela Internet
          </Link>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            {isSearch
              ? `${normalizeHost(siteQuery!)} em ${formatDatePt(date)}`
              : `Aquela internet em ${formatDatePt(date)}`}
          </h1>
          {isSearch ? (
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              {result.sites.length} página(s) capturada(s) desse site num período de ±30 dias.
            </p>
          ) : (
            <>
              <span className="mt-3 inline-block rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
                {era.label}
              </span>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-500">{era.blurb}</p>
              <p className="mt-1 text-neutral-600 dark:text-neutral-400">
                {result.sites.length} de {sitesForDate(date).length} sites icônicos tinham
                captura neste dia.
              </p>
            </>
          )}
        </div>
        <div className="flex gap-2">
          {!isSearch && (
            <Link
              href={`/${date}/share`}
              target="_blank"
              className="inline-flex h-10 items-center rounded-md border border-neutral-300 px-4 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              📸 Gerar card pra compartilhar
            </Link>
          )}
          <RandomDateLink />
        </div>
      </header>

      {headlinePick?.headline && (
        <div className="mb-6 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            📰 Manchete do dia — {headlinePick.siteName}
          </span>
          <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
            “{headlinePick.headline}”
          </p>
        </div>
      )}

      {result.warnings.map((w) => (
        <div
          key={w}
          className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"
        >
          {w}
        </div>
      ))}

      {result.sites.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-6 py-12 text-center text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
          Nenhum site tem captura neste dia exato. Tente uma data próxima ou busque um site
          específico na página inicial.
        </div>
      ) : (
        <SiteGrid sites={result.sites} />
      )}
    </main>
  );
}
