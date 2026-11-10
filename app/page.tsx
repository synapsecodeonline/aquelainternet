import type { Metadata } from "next";
import Link from "next/link";
import { DatePicker } from "@/components/DatePicker";
import { SITES } from "@/lib/sites";

export const metadata: Metadata = {
  title: "Aquela Internet — A Internet No Dia Do Seu Aniversário",
  description:
    "Descubra como estavam o Google, o Orkut e o UOL naquele dia — direto do acervo do Internet Archive.",
};

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-16">
      <div className="w-full max-w-3xl space-y-10 text-center">
        <header className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Como era aquela internet no dia em que você nasceu?
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">
            Descubra como estavam o Google, o Orkut e o UOL naquele dia — direto do acervo do
            Internet Archive.
          </p>
        </header>

        <DatePicker />

        <p className="text-sm text-neutral-500">
          <Link href="/comparar" className="underline hover:text-neutral-800 dark:hover:text-neutral-300">
            ⚖️ Comparar um site em duas datas
          </Link>
        </p>

        <section className="grid gap-4 text-left sm:grid-cols-3">
          {[
            ["1. Escolha uma data", "Sua data de nascimento, um ano marcante, qualquer dia."],
            ["2. Veja os sites", `${SITES.filter((s) => !s.loginWall).length} portais icônicos renderizados como estavam naquele dia.`],
            ["3. Compartilhe", "Exporte um card pronto pras redes sociais."],
          ].map(([title, desc]) => (
            <div
              key={title}
              className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
            >
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{desc}</p>
            </div>
          ))}
        </section>
      </div>

      <footer className="mt-auto pt-16 text-center text-xs text-neutral-500">
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
      </footer>
    </main>
  );
}
