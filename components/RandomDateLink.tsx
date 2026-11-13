"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function RandomDateLink({ site }: { site?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      className="h-11 rounded-xl border-neutral-200 bg-white/80 px-4 font-semibold text-neutral-600 backdrop-blur hover:border-pink-300 hover:text-pink-600 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-300 dark:hover:border-pink-700 dark:hover:text-pink-400"
      disabled={isPending}
      onClick={() => {
        const start = new Date("2003-01-01").getTime();
        const d = new Date(start + Math.random() * (Date.now() - start));
        const qs = site ? `?site=${encodeURIComponent(site)}` : "";
        startTransition(() => router.push(`/${d.toISOString().slice(0, 10)}${qs}`));
      }}
    >
      🎲 Outra data
    </Button>
  );
}
