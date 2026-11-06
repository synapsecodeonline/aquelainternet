import type { SnapshotRecord } from "@/types";
import { SiteCard } from "./SiteCard";

export function SiteGrid({ sites }: { sites: SnapshotRecord[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sites.map((s) => (
        <SiteCard key={s.siteSlug} site={s} />
      ))}
    </div>
  );
}
