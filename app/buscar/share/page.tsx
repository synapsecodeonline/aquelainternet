import Link from "next/link";
import { ShareCard } from "@/components/ShareCard";
import { ErrorState } from "@/components/ErrorState";
import { normalizeHost } from "@/lib/wayback";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export default function BuscarSharePage({
  searchParams,
}: {
  searchParams: { site?: string };
}) {
  const host = normalizeHost(searchParams?.site ?? "");

  if (!host) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <ErrorState message="Site inválido. Tente algo como uol.com.br" retryHref="/" />
      </main>
    );
  }

  const qs = `site=${encodeURIComponent(host)}`;
  const link = `${SITE_URL}/buscar?${qs}&utm_source=instagram&utm_medium=social&utm_campaign=share-card`;
  const caption = `${host} através do tempo 🕰️\n\nCapturas desse site em diferentes datas, direto do acervo do Internet Archive. Como ele era antigamente? 👇\n\n${link}`;

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
            href={`/buscar?${qs}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-neutral-500 transition-colors hover:text-pink-600 dark:text-neutral-400 dark:hover:text-pink-400"
          >
            ← Voltar para {host}
          </Link>
          <h1 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
            📸 Card de <span className="text-pink-600 dark:text-pink-400">{host}</span>
          </h1>
          <p className="max-w-xl text-neutral-600 dark:text-neutral-400">
            Baixe a imagem em formato de story, copie a legenda e poste nas suas redes.
          </p>
        </header>
        <ShareCard
          storyUrl={`/buscar/card?${qs}`}
          feedUrl={`/buscar/card?${qs}&format=feed`}
          fileBase={`aquela-internet-${host}`}
          altText={`Card: ${host} através do tempo`}
          caption={caption}
        />
      </div>
    </main>
  );
}
