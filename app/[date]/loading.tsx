export default function Loading() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-6xl flex-col items-center justify-center gap-4 px-6 py-10">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-neutral-100" />
      <p className="text-neutral-600 dark:text-neutral-400">
        Consultando o acervo do Internet Archive…
      </p>
      <p className="text-xs text-neutral-400">
        Isso pode levar até um minuto na primeira vez que uma data é acessada.
      </p>
    </main>
  );
}
