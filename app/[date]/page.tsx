import Link from "next/link";
import { notFound } from "next/navigation";
import { getDay } from "@/lib/cache";
import { SiteGrid } from "@/components/SiteGrid";
import { ErrorState } from "@/components/ErrorState";
import { RandomDateLink } from "@/components/RandomDateLink";
import type { Metadata } from "next";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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
      images: [`https://aquelainternet.com/${date}/card`],
    },
    twitter: { card: "summary_large_image" },
    alternates: { canonical: `https://aquelainternet.com/${date}` },
  };
}

export default async function DatePage({ params }: { params: { date: string } }) {
  const date = params.date;
  if (!DATE_RE.test(date)) notFound();

  const today = new Date().toISOString().slice(0, 10);
  if (date > today) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <ErrorState message="Essa data ainda não aconteceu." />
      </main>
    );
  }

  let result;
  try {
    result = await getDay(date);
  } catch {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <ErrorState message="Não conseguimos falar com o Internet Archive agora." />
      </main>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Aquela Internet em ${formatDatePt(date)}`,
    datePublished: date,
    url: `https://aquelainternet.com/${date}`,
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
            Aquela internet em {formatDatePt(date)}
          </h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            {result.sites.filter((s) => s.available).length} de {result.sites.length} sites
            disponíveis naquele dia.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/${date}/share`}
            target="_blank"
            className="inline-flex h-10 items-center rounded-md border border-neutral-300 px-4 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            📸 Gerar card pra compartilhar
          </Link>
          <RandomDateLink />
        </div>
      </header>

      {result.warnings.map((w) => (
        <div
          key={w}
          className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"
        >
          {w}
        </div>
      ))}

      <SiteGrid sites={result.sites} />
    </main>
  );
}
