import Link from "next/link";
import type { Metadata } from "next";
import { SiteGrid } from "@/components/SiteGrid";
import { ErrorState } from "@/components/ErrorState";
import { searchSiteTimeline } from "@/lib/search";
import { normalizeHost } from "@/lib/wayback";
import type { SnapshotRecord } from "@/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const metadata: Metadata = {
  title: "Buscar um site | Aquela Internet",
  description: "Veja como um site qualquer era em diferentes datas — direto do Internet Archive.",
};

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: { site?: string };
}) {
  const siteQuery = searchParams?.site?.trim();
  const host = siteQuery ? normalizeHost(siteQuery) : "";

  let records: SnapshotRecord[] = [];
  let error: string | null = null;

  if (siteQuery) {
    if (!host) {
      error = "Site inválido. Tente algo como uol.com.br";
    } else {
      try {
        records = await searchSiteTimeline(host);
      } catch {
        error = "Não conseguimos falar com o Internet Archive agora.";
      }
    }
  }

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
      <div className="relative mx-auto w-full max-w-5xl px-6 py-10">
        <header className="mb-8 space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm font-medium text-neutral-500 transition-colors hover:text-pink-600 dark:text-neutral-400 dark:hover:text-pink-400"
          >
            ← Voltar ao início
          </Link>
          <div className="space-y-2">
            <h1 className="text-balance text-3xl font-extrabold tracking-tight sm:text-5xl">
              {host ? (
                <>
                  <span className="text-pink-600 dark:text-pink-400">{host}</span>{" "}
                  através do tempo
                </>
              ) : (
                "Aquela internet de um site"
              )}
            </h1>
            <p className="max-w-xl text-neutral-600 dark:text-neutral-400">
              {host
                ? `${records.length} captura(s) desse site em datas diferentes, direto do acervo.`
                : "Busque um domínio para ver como ele era em diferentes momentos da internet."}
            </p>
          </div>
        </header>

        {error ? (
          <ErrorState message={error} retryHref="/" />
        ) : !siteQuery ? (
          <div className="rounded-3xl border border-neutral-200 bg-white/80 px-6 py-14 text-center dark:border-neutral-800 dark:bg-neutral-900/70">
            <span className="text-4xl">🔎</span>
            <p className="mt-3 font-semibold text-neutral-700 dark:text-neutral-300">
              Nenhum site informado
            </p>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Volte ao início e busque um domínio no campo &quot;ou busque um site específico&quot;.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex h-11 items-center rounded-xl bg-pink-600 px-5 text-sm font-bold text-white transition-colors hover:bg-pink-700"
            >
              Ir para o início →
            </Link>
          </div>
        ) : records.length === 0 ? (
          <div className="rounded-3xl border border-neutral-200 bg-white/80 px-6 py-14 text-center dark:border-neutral-800 dark:bg-neutral-900/70">
            <span className="text-4xl">🕳️</span>
            <p className="mt-3 font-semibold text-neutral-700 dark:text-neutral-300">
              Nenhuma captura com conteúdo real encontrada
            </p>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Esse site pode não ter páginas arquivadas ou estar indisponível no acervo.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex h-11 items-center rounded-xl bg-pink-600 px-5 text-sm font-bold text-white transition-colors hover:bg-pink-700"
            >
              Escolher outra data →
            </Link>
          </div>
        ) : (
          <SiteGrid sites={records} />
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
