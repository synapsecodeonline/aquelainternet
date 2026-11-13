import Link from "next/link";
import { notFound } from "next/navigation";
import { ShareCard } from "@/components/ShareCard";
import { isValidDate } from "@/lib/date";
import { getDay } from "@/lib/cache";
import { SITES } from "@/lib/sites";
import { SITE_URL } from "@/lib/site";
import { normalizeHost } from "@/lib/wayback";

export const dynamic = "force-dynamic";

function formatDatePt(date: string): string {
  const [y, m, d] = date.split("-");
  const meses = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  return `${Number(d)} de ${meses[Number(m) - 1]} de ${y}`;
}

export default async function SharePage({
  params,
  searchParams,
}: {
  params: { date: string };
  searchParams: { site?: string };
}) {
  if (!isValidDate(params.date)) notFound();

  const date = params.date;
  // ?site=<domínio> → card do portal pesquisado na data (captura exata
  // ou janela ±30d, resolvido pela rota do card). Sem ele, card da data.
  const siteParam = normalizeHost(searchParams?.site ?? "");

  let siteNames: string[] = [];
  let cardDomain: string | null = null;
  try {
    if (siteParam) {
      siteNames = [siteParam];
      cardDomain = siteParam;
    } else {
      const result = await getDay(date);
      const available = result.sites.filter((s) => s.available);
      siteNames = available.map((s) => s.siteName);
      // Mesmo pick determinístico da rota /[date]/card — o botão abre
      // exatamente o card que está sendo exibido (data + domínio).
      const withHeadline = available.filter((s) => s.headline);
      const pool = withHeadline.length ? withHeadline : available;
      const pick = pool.length
        ? pool[
            date.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % pool.length
          ]
        : null;
      cardDomain = pick ? SITES.find((s) => s.slug === pick.siteSlug)?.url ?? null : null;
    }
  } catch {
    // sem nomes — a legenda usa texto genérico
  }

  const sites = siteNames.length ? siteNames.slice(0, 4).join(", ") : "Google, Orkut e cia";
  const linkQs = [
    siteParam ? `site=${encodeURIComponent(siteParam)}` : null,
    "utm_source=instagram",
    "utm_medium=social",
    "utm_campaign=share-card",
  ]
    .filter(Boolean)
    .join("&");
  const link = `${SITE_URL}/${date}?${linkQs}`;
  const cardBase = siteParam ? `/${date}/card?site=${encodeURIComponent(siteParam)}` : `/${date}/card`;
  const caption = siteParam
    ? `${siteParam} em ${formatDatePt(date)} 🕰️\n\nCaptura desse site na data, direto do acervo do Internet Archive. Como ele era? 👇\n\n${link}`
    : `Em ${formatDatePt(date)}, aquela internet era assim 🕰️\n\n${sites} renderizados direto do acervo do Internet Archive. Qual site te trouxe mais memória? 👇\n\n${link}`;

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
            href={siteParam ? `/${date}?site=${encodeURIComponent(siteParam)}` : `/${date}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-neutral-500 transition-colors hover:text-pink-600 dark:text-neutral-400 dark:hover:text-pink-400"
          >
            ← Voltar{siteParam ? ` para ${siteParam}` : " para a data"}
          </Link>
          <h1 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
            📸 Seu card da{" "}
            <span className="bg-gradient-to-r from-pink-500 to-orange-400 bg-clip-text text-transparent">
              Aquela Internet
            </span>
          </h1>
          <p className="max-w-xl text-neutral-600 dark:text-neutral-400">
            Baixe a imagem em formato de story, copie a legenda e poste nas suas redes.
          </p>
        </header>
        <ShareCard
          storyUrl={cardBase}
          feedUrl={`${cardBase}${cardBase.includes("?") ? "&" : "?"}format=feed`}
          fileBase={`aquela-internet-${date}`}
          altText={`Card: Aquela internet em ${formatDatePt(date)}`}
          caption={caption}
        />
        {cardDomain && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href={cardBase}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-pink-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-pink-600/25 transition-transform hover:scale-105"
            >
              🖼️ Abrir card story ({cardDomain})
            </a>
            <a
              href={`${cardBase}${cardBase.includes("?") ? "&" : "?"}format=feed`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-6 py-3 text-sm font-bold text-neutral-700 transition-colors hover:border-pink-500 hover:text-pink-600 dark:border-neutral-700 dark:text-neutral-300 dark:hover:text-pink-400"
            >
              🖼️ Abrir card feed ({cardDomain})
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
