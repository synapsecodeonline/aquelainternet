export interface SiteEntry {
  slug: string;
  name: string;
  url: string;
  era: { start: number; end?: number };
  color: string;
  /** Redes sociais que exigem login — a captura sempre cai na tela de login.
   *  Excluídas da busca geral; ainda assim pesquisáveis via ?site=. */
  loginWall?: boolean;
}

export const SITES: SiteEntry[] = [
  // --- Portais brasileiros ---
  { slug: "uol",          name: "UOL",          url: "uol.com.br",          era: { start: 1996 },                    color: "#FFD200" },
  { slug: "globo",        name: "Globo",        url: "globo.com",           era: { start: 1996 },                    color: "#C8102E" },
  { slug: "bol",          name: "BOL",          url: "bol.com.br",          era: { start: 1996 },                    color: "#00A650" },
  { slug: "folha",        name: "Folha",        url: "folha.uol.com.br",    era: { start: 1996 },                    color: "#0B3D91" },
  { slug: "estadao",      name: "Estadão",      url: "estadao.com.br",      era: { start: 1996 },                    color: "#004B8D" },
  { slug: "abril",        name: "Abril",        url: "abril.com.br",        era: { start: 1996 },                    color: "#E4002B" },
  { slug: "terra",        name: "Terra",        url: "terra.com.br",        era: { start: 2000 },                    color: "#0093D0" },
  { slug: "ig",           name: "iG",           url: "ig.com.br",           era: { start: 2001 },                    color: "#FF6600" },
  { slug: "r7",           name: "R7",           url: "r7.com",              era: { start: 2001 },                    color: "#FFCC00" },
  { slug: "exame",        name: "Exame",        url: "exame.com",           era: { start: 2001 },                    color: "#003DA5" },
  { slug: "meiobit",      name: "Meio Bit",     url: "meiobit.com",         era: { start: 2000 },                    color: "#00B050" },
  { slug: "uai",          name: "UAI",          url: "uai.com.br",          era: { start: 2002 },                    color: "#0055A4" },
  { slug: "tecmundo",     name: "TecMundo",     url: "tecmundo.com.br",     era: { start: 2010 },                    color: "#FF6600" },
  { slug: "canaltech",    name: "Canaltech",    url: "canaltech.com.br",    era: { start: 2010 },                    color: "#1A1A2E" },
  { slug: "olhardigital", name: "Olhar Digital",url: "olhardigital.com.br", era: { start: 2010 },                    color: "#00C8FF" },
  { slug: "cnnbrasil",    name: "CNN Brasil",   url: "cnnbrasil.com.br",    era: { start: 2012 },                    color: "#CC0000" },
  { slug: "metropoles",   name: "Metrópoles",   url: "metropoles.com",      era: { start: 2015 },                    color: "#7B2D8E" },

  // --- Portais internacionais ---
  { slug: "google",    name: "Google",    url: "google.com",    era: { start: 1998 },            color: "#4285F4" },
  { slug: "youtube",   name: "YouTube",   url: "youtube.com",   era: { start: 2005 },            color: "#FF0000" },
  { slug: "wikipedia", name: "Wikipedia", url: "wikipedia.org", era: { start: 2001 },            color: "#000000" },
  { slug: "yahoo",     name: "Yahoo",     url: "yahoo.com",     era: { start: 1994 },            color: "#6001D2" },
  { slug: "msn",       name: "MSN",       url: "msn.com",       era: { start: 1995 },            color: "#0078D4" },
  { slug: "geocities", name: "GeoCities", url: "geocities.com", era: { start: 1994, end: 2009 }, color: "#00A650" },

  // --- Redes sociais (loginWall: fora da busca geral, ok via ?site=) ---
  { slug: "orkut",     name: "Orkut",     url: "orkut.com",      era: { start: 1998, end: 2014 }, color: "#ED2590", loginWall: true },
  { slug: "facebook",  name: "Facebook",  url: "facebook.com",   era: { start: 2004 },            color: "#1877F2", loginWall: true },
  { slug: "twitter",   name: "Twitter/X", url: "twitter.com",    era: { start: 2006 },            color: "#000000", loginWall: true },
  { slug: "instagram", name: "Instagram", url: "instagram.com",  era: { start: 2010 },            color: "#E4405F", loginWall: true },
];

/** Sites ativos na data (por ano), excluindo redes com login.
 *  Regra: fora da era → não entra; loginWall → só via busca por URL. */
export function sitesForDate(date: string): SiteEntry[] {
  const year = Number(date.slice(0, 4));
  return SITES.filter(
    (s) =>
      !s.loginWall &&
      year >= s.era.start &&
      (s.era.end === undefined || year <= s.era.end)
  );
}
