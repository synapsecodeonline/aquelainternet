"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function RandomDateLink() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      disabled={isPending}
      onClick={() => {
        const start = new Date("1996-01-01").getTime();
        const d = new Date(start + Math.random() * (Date.now() - start));
        startTransition(() => router.push(`/${d.toISOString().slice(0, 10)}`));
      }}
    >
      🎲 Outra data
    </Button>
  );
}
