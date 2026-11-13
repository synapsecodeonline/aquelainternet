import type { Metadata } from "next";
import Link from "next/link";
import { DatePicker } from "@/components/DatePicker";
import { AnniversaryForm } from "@/components/AnniversaryForm";

export const metadata: Metadata = {
  title: "Aquela Internet — Como era a internet no dia do seu nascimento",
  description:
    "Escolha uma data e veja a internet como ela era naquele dia — cada site renderizado como estava, direto do acervo do Internet Archive.",
};

const CURATED_DATES = [
  { date: "2004-06-15", emoji: "👾", label: "Orkut chega ao Brasil" },
  { date: "2006-09-26", emoji: "👤", label: "Facebook chega" },
  { date: "2008-07-11", emoji: "📱", label: "iPhone chega ao Brasil" },
  { date: "2014-07-07", emoji: "⚽", label: "7 a 1" },
  { date: "2020-03-15", emoji: "🏠", label: "Pandemia" },
];

const ERAS = [
  { years: "1996–1997", label: "Era dos portais" },
  { years: "1998–2003", label: "Google recém-nascido" },
  { years: "2004–2007", label: "Orkut, YouTube e Facebook" },
  { years: "2008–2011", label: "A febre do Orkut" },
  { years: "2012–2014", label: "Facebook e Instagram" },
  { years: "2015–2019", label: "A internet no bolso" },
  { years: "2020–hoje", label: "Pandemia e home office" },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* fundo decorativo: gradiente sutil + grid retrô */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% -10%, rgba(236,72,153,0.10), transparent), radial-gradient(50% 40% at 80% 110%, rgba(56,189,248,0.08), transparent)",
        }}
      />
      <div className="relative mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center px-6 py-14">
        <div className="w-full max-w-3xl space-y-10 text-center">
          <header className="space-y-4">
            <span className="inline-block rounded-full border border-pink-300/60 bg-pink-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-pink-600 dark:border-pink-800 dark:bg-pink-950/40 dark:text-pink-300">
              🕰️ Máquina do tempo da internet brasileira
            </span>
            <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-6xl">
              Como era a internet no dia em que você nasceu?
            </h1>
            <p className="mx-auto max-w-xl text-lg text-neutral-600 dark:text-neutral-400">
              Escolha uma data e mergulhe no passado: cada site renderizado
              exatamente como estava naquele dia — direto do acervo do
              Internet Archive.
            </p>
          </header>

          {/* CTA principal: aniversário */}
          <section className="rounded-3xl border-2 border-pink-300/70 bg-gradient-to-b from-pink-50/80 to-white p-6 shadow-sm dark:border-pink-800 dark:from-pink-950/30 dark:to-neutral-950 sm:p-8">
            <h2 className="text-xl font-bold sm:text-2xl">
              🎂 Digite sua data de nascimento
            </h2>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              A gente mostra a internet como ela era no seu primeiro dia de vida.
            </p>
            <div className="mt-5 flex justify-center">
              <AnniversaryForm />
            </div>
          </section>

          {/* CTA secundário: qualquer data */}
          <section className="rounded-3xl border border-neutral-200 bg-white/70 p-6 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/60">
            <h2 className="text-lg font-bold">📅 Ou explore qualquer data</h2>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Um dia marcante, um ano específico, o dia que você quiser relembrar.
            </p>
            <div className="mt-5">
              <DatePicker />
            </div>
          </section>

          {/* Destaque: comparar */}
          <section className="rounded-3xl border-2 border-sky-300/70 bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-6 text-left shadow-sm dark:border-sky-800 dark:from-sky-950/40 dark:via-neutral-950 dark:to-indigo-950/40 sm:p-8">
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:text-left">
              <span className="text-5xl" aria-hidden>🆚</span>
              <div className="flex-1 space-y-1.5">
                <h2 className="text-xl font-extrabold sm:text-2xl">
                  Compare um site em duas datas
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 sm:text-base">
                  Digite um domínio e veja lado a lado como ele era em dois momentos
                  diferentes — a evolução da internet brasileira em uma tela só.
                </p>
              </div>
              <Link
                href="/comparar"
                className="inline-flex h-12 shrink-0 items-center rounded-xl bg-sky-600 px-6 text-sm font-bold text-white shadow transition-all hover:bg-sky-700 hover:shadow-md"
              >
                Comparar agora →
              </Link>
            </div>
          </section>

          {/* Datas virais */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
              📣 As datas que todo mundo pesquisa
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {CURATED_DATES.map((d) => (
                <Link
                  key={d.date}
                  href={`/${d.date}`}
                  className="group rounded-2xl border border-neutral-200 bg-white/80 px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:border-pink-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900/70 dark:hover:border-pink-700"
                >
                  <span className="text-2xl">{d.emoji}</span>
                  <p className="mt-2 text-sm font-semibold leading-tight group-hover:text-pink-600 dark:group-hover:text-pink-400">
                    {d.label}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {d.date.split("-").reverse().join("/")}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          {/* Linha do tempo das eras */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
              🗺️ A internet brasileira em fases
            </h2>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {ERAS.map((e) => (
                <div
                  key={e.years}
                  className="min-w-[140px] flex-1 rounded-xl border border-neutral-200 bg-white/80 px-3 py-3 text-left dark:border-neutral-800 dark:bg-neutral-900/70"
                >
                  <p className="font-mono text-[11px] font-semibold text-pink-600 dark:text-pink-400">
                    {e.years}
                  </p>
                  <p className="mt-1 text-xs font-medium leading-snug text-neutral-700 dark:text-neutral-300">
                    {e.label}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <footer className="mt-auto flex flex-col items-center gap-3 pt-16 text-center text-xs text-neutral-500">
          <p>
            Dados históricos via{" "}
            <a
              href="https://archive.org/developers/wayback.html"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-neutral-800 dark:hover:text-neutral-300"
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
