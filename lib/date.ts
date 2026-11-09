const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Valida formato YYYY-MM-DD e se é uma data real do calendário. */
export function isValidDate(date: string): boolean {
  if (!DATE_RE.test(date)) return false;
  const d = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === date;
}
