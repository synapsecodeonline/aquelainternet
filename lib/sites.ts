export interface SiteEntry {
  slug: string;
  name: string;
  url: string;
  era: { start: number; end?: number };
  color: string;
}

export const SITES: SiteEntry[] = [
  { slug: "google",    name: "Google",    url: "google.com",     era: { start: 1998 },            color: "#4285F4" },
  { slug: "youtube",   name: "YouTube",   url: "youtube.com",    era: { start: 2005 },            color: "#FF0000" },
  { slug: "orkut",     name: "Orkut",     url: "orkut.com",      era: { start: 1998, end: 2014 }, color: "#ED2590" },
  { slug: "facebook",  name: "Facebook",  url: "facebook.com",   era: { start: 2004 },            color: "#1877F2" },
  { slug: "twitter",   name: "Twitter/X", url: "twitter.com",    era: { start: 2006 },            color: "#000000" },
  { slug: "instagram", name: "Instagram", url: "instagram.com",  era: { start: 2010 },            color: "#E4405F" },
  { slug: "uol",       name: "UOL",       url: "uol.com.br",     era: { start: 1996 },            color: "#FFD200" },
  { slug: "globo",     name: "Globo",     url: "globo.com",      era: { start: 1996 },            color: "#C8102E" },
  { slug: "wikipedia", name: "Wikipedia", url: "wikipedia.org",  era: { start: 2001 },            color: "#000000" },
  { slug: "yahoo",     name: "Yahoo",     url: "yahoo.com",      era: { start: 1994 },            color: "#6001D2" },
  { slug: "msn",       name: "MSN",       url: "msn.com",        era: { start: 1995 },            color: "#0078D4" },
  { slug: "geocities", name: "GeoCities", url: "geocities.com",  era: { start: 1994, end: 2009 }, color: "#00A650" },
];

/** Sites ativos na data (por ano). Regra: fora da era → não entra na grade. */
export function sitesForDate(date: string): SiteEntry[] {
  const year = Number(date.slice(0, 4));
  return SITES.filter((s) => year >= s.era.start && (s.era.end === undefined || year <= s.era.end));
}
