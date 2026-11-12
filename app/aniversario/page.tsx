import type { Metadata } from "next";
import Link from "next/link";
import { AnniversaryForm } from "@/components/AnniversaryForm";

export const metadata: Metadata = {
  title: "Sua internet no dia em que você nasceu | Aquela Internet",
  description:
    "Digite sua data de nascimento e veja como eram Google, UOL, Orkut e cia naquele dia — direto do acervo do Internet Archive.",
};

export default function AnniversaryPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% -10%, rgba(236,72,153,0.10), transparent), radial-gradient(50% 40% at 80% 110%, rgba(56,189,248,0.08), transparent)",
        }}
      />
      <div className="relative flex w-full max-w-3xl flex-col items-center gap-8 text-center">
        <header className="space-y-4">
          <span className="inline-block rounded-full border border-pink-300/60 bg-pink-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-pink-600 dark:border-pink-800 dark:bg-pink-950/40 dark:text-pink-300">
            🕰️ Máquina do tempo da internet brasileira
          </span>
          <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
            Como era a internet no dia em que você nasceu?
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">
            Digite sua data de nascimento e viaja no tempo — Google, UOL, Orkut e cia
            como eram naquele dia.
          </p>
        </header>

        <div className="w-full rounded-3xl border-2 border-pink-300/70 bg-gradient-to-b from-pink-50/80 to-white p-6 shadow-sm dark:border-pink-800 dark:from-pink-950/30 dark:to-neutral-950 sm:p-8">
          <AnniversaryForm />
        </div>

        <p className="text-sm text-neutral-500">
          Ou <Link href="/" className="underline hover:text-neutral-800 dark:hover:text-neutral-300">escolha qualquer outra data</Link>.
        </p>
      </div>
    </main>
  );
}
