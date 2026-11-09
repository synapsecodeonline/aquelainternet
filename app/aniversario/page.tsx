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
    <main className="flex min-h-screen flex-col items-center px-6 py-16">
      <div className="flex w-full max-w-3xl flex-col items-center gap-8 text-center">
        <header className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Como era a internet no dia em que você nasceu?
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">
            Digite sua data de nascimento e viaja no tempo.
          </p>
        </header>

        <AnniversaryForm />

        <p className="text-sm text-neutral-500">
          Ou <Link href="/" className="underline hover:text-neutral-800 dark:hover:text-neutral-300">escolha qualquer outra data</Link>.
        </p>
      </div>
    </main>
  );
}
