import type { Metadata } from "next";
import Link from "next/link";
import { getDay } from "@/lib/cache";
import { isValidDate } from "@/lib/date";
import { eraForDate } from "@/lib/era";
import { SiteGrid } from "@/components/SiteGrid";
import { ErrorState } from "@/components/ErrorState";
import { CompareForm } from "@/components/CompareForm";
import type { DayResult } from "@/types";

export const metadata: Metadata = {
  title: "Compare duas datas | Aquela Internet",
  description:
    "Veja lado a lado como era a internet em duas datas diferentes — direto do acervo do Internet Archive.",
};

function formatDatePt(date: string): string {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

function DateColumn({ result }: { result: DayResult }) {
  const era = eraForDate(result.date);
  const available = result.sites.filter((s) => s.available);
  return (
    <section className="min-w-0 flex-1">
      <header className="mb-4">
        <h2 className="text-2xl font-bold">{formatDatePt(result.date)}</h2>
        <span className="mt-2 inline-block rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
          {era.label}
        </span>
        <p className="mt-2 text-sm text-neutral-500">
          {available.length} captura(s) de {result.sites.length} sites consultados
        </p>
      </header>
      {available.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
          Nenhuma captura neste dia.
        </div>
      ) : (
        <SiteGrid sites={available} compact />
      )}
    </section>
  );
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: { a?: string; b?: string };
}) {
  const a = searchParams?.a;
  const b = searchParams?.b;
  const ready =
    a && b && isValidDate(a) && isValidDate(b) && a !== b &&
    a <= new Date().toISOString().slice(0, 10) &&
    b <= new Date().toISOString().slice(0, 10);

  if (!ready) {
    return (
      <main className="flex min-h-screen flex-col items-center px-6 py-16">
        <div className="flex w-full max-w-4xl flex-col items-center gap-8 text-center">
          <header className="space-y-4">
            <Link href="/" className="text-sm text-neutral-500 hover:underline">
              ← Aquela Internet
            </Link>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Como a internet mudou entre duas datas?
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              Escolha duas datas e veja os portais lado a lado.
            </p>
          </header>
          <CompareForm a={a} b={b} />
          {a && b && !ready && (
            <p className="text-sm text-red-600">
              Escolha duas datas válidas e diferentes (não futuras).
            </p>
          )}
        </div>
      </main>
    );
  }

  let results: DayResult[];
  try {
    results = await Promise.all([getDay(a!), getDay(b!)]);
  } catch {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <ErrorState
          message="Não conseguimos falar com o Internet Archive agora."
          retryHref={`/comparar?a=${a}&b=${b}`}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-8">
        <Link href="/" className="text-sm text-neutral-500 hover:underline">
          ← Aquela Internet
        </Link>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          {formatDatePt(a!)} <span className="text-neutral-400">vs</span> {formatDatePt(b!)}
        </h1>
        <div className="mt-4">
          <CompareForm a={a} b={b} />
        </div>
      </header>
      <div className="flex flex-col gap-10 lg:flex-row">
        <DateColumn result={results[0]} />
        <div className="hidden w-px bg-neutral-200 dark:bg-neutral-800 lg:block" />
        <DateColumn result={results[1]} />
      </div>
    </main>
  );
}
