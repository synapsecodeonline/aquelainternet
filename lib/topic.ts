import type { SnapshotRecord } from "@/types";

/** Minúsculas e sem acento — "política" casa com "politica". */
export function normalizeTopic(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Casa o filtro de assunto contra manchete, nome do site e URL do snapshot. */
export function topicMatch(site: SnapshotRecord, query: string): boolean {
  const q = normalizeTopic(query.trim());
  if (!q) return true;
  return [site.headline ?? "", site.siteName, site.snapshotUrl].some((f) =>
    normalizeTopic(f).includes(q)
  );
}
