import Link from "next/link";
import { ShareCard } from "@/components/ShareCard";
import { ErrorState } from "@/components/ErrorState";
import { normalizeHost } from "@/lib/wayback";
import { isValidDate } from "@/lib/date";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

function formatDatePt(date: string): string {
  const [y, m, d] = date.split("-");
  const meses = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  return `${Number(d)} de ${meses[Number(m) - 1]} de ${y}`;
}

export default function CompararSharePage({
  searchParams,
}: {
  searchParams: { site?: string; a?: string; b?: string };
}) {
  const host = normalizeHost(searchParams?.site ?? "");
  const a = searchParams?.a ?? "";
  const b = searchParams?.b ?? "";
  const today = new Date().toISOString().slice(0, 10);
  const ok =
    host && a !== b && isValidDate(a) && isValidDate(b) && a <= today && b <= today;

  if (!ok) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <ErrorState
          message="Parâmetros inválidos — escolha um site e duas datas."
          retryHref="/comparar"
        />
      </main>
    );
  }

  const qs = `site=${encodeURIComponent(host)}&a=${a}&b=${b}`;
  const link = `${SITE_URL}/comparar?${qs}&utm_source=instagram&utm_medium=social&utm_campaign=share-card`;
  const caption = `${host}: ${formatDatePt(a)} vs ${formatDatePt(b)} 🕰️\n\nO mesmo site em duas datas diferentes, lado a lado — direto do acervo do Internet Archive. Qual versão você prefere? 👇\n\n${link}`;

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
            href={`/comparar?${qs}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-neutral-500 transition-colors hover:text-pink-600 dark:text-neutral-400 dark:hover:text-pink-400"
          >
            ← Voltar para a comparação
          </Link>
          <h1 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
            📸 {host} — {formatDatePt(a)} <span className="text-neutral-400">vs</span> {formatDatePt(b)}
          </h1>
          <p className="max-w-xl text-neutral-600 dark:text-neutral-400">
            Baixe a imagem em formato de story, copie a legenda e poste nas suas redes.
          </p>
        </header>
        <ShareCard
          storyUrl={`/comparar/card?${qs}`}
          feedUrl={`/comparar/card?${qs}&format=feed`}
          fileBase={`aquela-internet-${host}-vs`}
          altText={`Card: ${host} em ${formatDatePt(a)} vs ${formatDatePt(b)}`}
          caption={caption}
        />
      </div>
    </main>
  );
}
