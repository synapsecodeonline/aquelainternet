import type { Metadata } from "next";
import Link from "next/link";
import { findClosestSiteRecord } from "@/lib/search";
import { normalizeHost } from "@/lib/wayback";
import { isValidDate } from "@/lib/date";
import { eraForDate } from "@/lib/era";
import { SiteCard } from "@/components/SiteCard";
import { ErrorState } from "@/components/ErrorState";
import { CompareForm } from "@/components/CompareForm";
import type { SnapshotRecord } from "@/types";

export const metadata: Metadata = {
  title: "Compare um site em duas datas | Aquela Internet",
  description:
    "Veja lado a lado como um mesmo site era em duas datas diferentes — direto do acervo do Internet Archive.",
};

export const dynamic = "force-dynamic";

function formatDatePt(date: string): string {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

function DateColumn({
  record,
  requestedDate,
}: {
  record: SnapshotRecord | null;
  requestedDate: string;
}) {
  const era = eraForDate(requestedDate);
  return (
    <section className="min-w-0 flex-1">
      <header className="mb-4">
        <h2 className="text-2xl font-bold">{formatDatePt(requestedDate)}</h2>
        <span className="mt-2 inline-block rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
          {era.label}
        </span>
      </header>
      {record ? (
        <SiteCard site={record} />
      ) : (
        <div className="flex min-h-[280px] flex-col items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
          Nenhuma captura válida numa janela de ±30 dias desta data.
        </div>
      )}
    </section>
  );
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: { site?: string; a?: string; b?: string };
}) {
  const site = searchParams?.site ? normalizeHost(searchParams.site) : "";
  const a = searchParams?.a;
  const b = searchParams?.b;
  const datesOk =
    a && b && isValidDate(a) && isValidDate(b) && a !== b &&
    a <= new Date().toISOString().slice(0, 10) &&
    b <= new Date().toISOString().slice(0, 10);
  const ready = Boolean(site) && datesOk;

  if (!ready) {
    return (
      <main className="flex min-h-screen flex-col items-center px-6 py-16">
        <div className="flex w-full max-w-4xl flex-col items-center gap-8 text-center">
          <header className="space-y-4">
            <Link href="/" className="text-sm text-neutral-500 hover:underline">
              ← Aquela Internet
            </Link>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Como um site mudou com o tempo?
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              Digite um domínio e duas datas para ver as capturas lado a lado.
            </p>
          </header>
          <CompareForm site={searchParams?.site} a={a} b={b} />
          {a && b && !datesOk && (
            <p className="text-sm text-red-600">
              Escolha duas datas válidas e diferentes (não futuras).
            </p>
          )}
          {(a || b) && !site && (
            <p className="text-sm text-red-600">
              Digite o domínio do site que quer comparar.
            </p>
          )}
        </div>
      </main>
    );
  }

  let records: (SnapshotRecord | null)[];
  try {
    records = await Promise.all([
      findClosestSiteRecord(site, a!),
      findClosestSiteRecord(site, b!),
    ]);
  } catch {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <ErrorState
          message="Não conseguimos falar com o Internet Archive agora."
          retryHref={`/comparar?site=${site}&a=${a}&b=${b}`}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8">
        <Link href="/" className="text-sm text-neutral-500 hover:underline">
          ← Aquela Internet
        </Link>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          {site} — {formatDatePt(a!)} <span className="text-neutral-400">vs</span> {formatDatePt(b!)}
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Mostrando a captura válida mais próxima de cada data (janela de ±30 dias).
        </p>
        <div className="mt-4">
          <CompareForm site={site} a={a} b={b} />
        </div>
      </header>
      <div className="flex flex-col gap-10 lg:flex-row">
        <DateColumn record={records[0]} requestedDate={a!} />
        <div className="hidden w-px bg-neutral-200 dark:bg-neutral-800 lg:block" />
        <DateColumn record={records[1]} requestedDate={b!} />
      </div>
    </main>
  );
}
