"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function RandomDateLink() {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      onClick={() => {
        const start = new Date("1996-01-01").getTime();
        const d = new Date(start + Math.random() * (Date.now() - start));
        router.push(`/${d.toISOString().slice(0, 10)}`);
      }}
    >
      🎲 Outra data
    </Button>
  );
}
