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
      disabled={isPending}
      onClick={() => {
        const start = new Date("2000-01-01").getTime();
        const d = new Date(start + Math.random() * (Date.now() - start));
        const qs = site ? `?site=${encodeURIComponent(site)}` : "";
        startTransition(() => router.push(`/${d.toISOString().slice(0, 10)}${qs}`));
      }}
    >
      🎲 Outra data
    </Button>
  );
}
