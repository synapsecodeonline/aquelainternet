import type { SnapshotRecord } from "@/types";
import { SiteCard } from "./SiteCard";

export function SiteGrid({
  sites,
  compact = false,
}: {
  sites: SnapshotRecord[];
  compact?: boolean;
}) {
  // Ordem aleatória a cada render — a experiência muda a cada visita
  const shuffled = [...sites].sort(() => Math.random() - 0.5);
  return (
    <div className={`grid grid-cols-1 gap-4 ${compact ? "" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
      {shuffled.map((s) => (
        <SiteCard key={s.siteSlug} site={s} compact={compact} />
      ))}
    </div>
  );
}
