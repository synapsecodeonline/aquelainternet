import Link from "next/link";
import { notFound } from "next/navigation";
import { ShareCard } from "@/components/ShareCard";
import { isValidDate } from "@/lib/date";
import { getDay } from "@/lib/cache";

export const dynamic = "force-dynamic";

export default async function SharePage({ params }: { params: { date: string } }) {
  if (!isValidDate(params.date)) notFound();

  let siteNames: string[] = [];
  try {
    const result = await getDay(params.date);
    siteNames = result.sites.filter((s) => s.available).map((s) => s.siteName);
  } catch {
    // sem nomes — a legenda usa texto genérico
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href={`/${params.date}`} className="text-sm text-neutral-500 hover:underline">
        ← Voltar
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-bold">Seu card</h1>
      <ShareCard date={params.date} siteNames={siteNames} />
    </main>
  );
}
