import Link from "next/link";
import { notFound } from "next/navigation";
import { ShareCard } from "@/components/ShareCard";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function SharePage({ params }: { params: { date: string } }) {
  if (!DATE_RE.test(params.date)) notFound();
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href={`/${params.date}`} className="text-sm text-neutral-500 hover:underline">
        ← Voltar
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-bold">Seu card</h1>
      <ShareCard date={params.date} />
    </main>
  );
}
