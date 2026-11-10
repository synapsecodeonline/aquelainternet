export interface SiteEntry {
  slug: string;
  name: string;
  url: string;
  era: { start: number; end?: number };
  color: string;
  /** Redes sociais que exigem login — a captura sempre cai na tela de login.
   *  Excluídas da busca geral; ainda assim pesquisáveis via ?site=. */
  loginWall?: boolean;
  /** Não é portal de notícias (buscador, vídeo, referência, hosting).
   *  Excluído da busca geral; pesquisável via ?site=. */
  nonNews?: boolean;
}

export const SITES: SiteEntry[] = [
  // --- Portais de notícias brasileiros ---
  { slug: "uol",          name: "UOL",           url: "uol.com.br",          era: { start: 1996 },                    color: "#FFD200" },
  { slug: "globo",        name: "Globo",         url: "globo.com",           era: { start: 1996 },                    color: "#C8102E" },
  { slug: "bol",          name: "BOL",           url: "bol.com.br",          era: { start: 1996 },                    color: "#00A650" },
  { slug: "folha",        name: "Folha",         url: "folha.uol.com.br",    era: { start: 1996 },                    color: "#0B3D91" },
  { slug: "estadao",      name: "Estadão",       url: "estadao.com.br",      era: { start: 1996 },                    color: "#004B8D" },
  { slug: "abril",        name: "Abril",         url: "abril.com.br",        era: { start: 1996 },                    color: "#E4002B" },
  { slug: "terra",        name: "Terra",         url: "terra.com.br",        era: { start: 2000 },                    color: "#0093D0" },
  { slug: "ig",           name: "iG",            url: "ig.com.br",           era: { start: 2001 },                    color: "#FF6600" },
  { slug: "r7",           name: "R7",            url: "r7.com",              era: { start: 2001 },                    color: "#FFCC00" },
  { slug: "exame",        name: "Exame",         url: "exame.com",           era: { start: 2001 },                    color: "#003DA5" },
  { slug: "meiobit",      name: "Meio Bit",      url: "meiobit.com",         era: { start: 2000 },                    color: "#00B050" },
  { slug: "uai",          name: "UAI",           url: "uai.com.br",          era: { start: 2002 },                    color: "#0055A4" },
  { slug: "tecmundo",     name: "TecMundo",      url: "tecmundo.com.br",     era: { start: 2010 },                    color: "#FF6600" },
  { slug: "canaltech",    name: "Canaltech",     url: "canaltech.com.br",    era: { start: 2010 },                    color: "#1A1A2E" },
  { slug: "olhardigital", name: "Olhar Digital", url: "olhardigital.com.br", era: { start: 2010 },                    color: "#00C8FF" },
  { slug: "cnnbrasil",    name: "CNN Brasil",    url: "cnnbrasil.com.br",    era: { start: 2012 },                    color: "#CC0000" },
  { slug: "metropoles",   name: "Metrópoles",    url: "metropoles.com",      era: { start: 2015 },                    color: "#7B2D8E" },
  // --- Portais de notícias brasileiros (expansão) ---
  { slug: "g1",           name: "G1",            url: "g1.globo.com",         era: { start: 2006 },                    color: "#C4170C" },
  { slug: "extra",        name: "Extra",         url: "extra.globo.com",      era: { start: 1996 },                    color: "#0A7A0A" },
  { slug: "veja",         name: "VEJA",          url: "veja.abril.com.br",    era: { start: 1998 },                    color: "#E4002B" },
  { slug: "istoe",        name: "IstoÉ",         url: "istoe.com.br",         era: { start: 1998 },                    color: "#004B93" },
  { slug: "epoca",        name: "Época",         url: "epoca.globo.com",      era: { start: 1998, end: 2018 },         color: "#C8102E" },
  { slug: "cartacapital", name: "CartaCapital",  url: "cartacapital.com.br",  era: { start: 2000 },                    color: "#E30613" },
  { slug: "valor",        name: "Valor",         url: "valor.globo.com",      era: { start: 2000 },                    color: "#003B5C" },
  { slug: "tecnoblog",    name: "Tecnoblog",     url: "tecnoblog.net",        era: { start: 2005 },                    color: "#00AEEF" },
  { slug: "adrenaline",   name: "Adrenaline",    url: "adrenaline.com.br",    era: { start: 2000 },                    color: "#FF6600" },
  { slug: "techtudo",     name: "TechTudo",      url: "techtudo.com.br",      era: { start: 2010 },                    color: "#0072BC" },
  { slug: "nexo",         name: "Nexo",          url: "nexojornal.com.br",    era: { start: 2015 },                    color: "#2F5D50" },
  { slug: "intercept",    name: "The Intercept", url: "theintercept.com.br",  era: { start: 2016 },                    color: "#1B1B1B" },
  { slug: "brasil247",    name: "Brasil 247",    url: "brasil247.com",        era: { start: 2011 },                    color: "#E30613" },

  // --- Portais de notícias internacionais ---
  { slug: "bbc",          name: "BBC",           url: "bbc.com",              era: { start: 1997 },                    color: "#BB1919" },
  { slug: "cnn",          name: "CNN",           url: "cnn.com",              era: { start: 1996 },                    color: "#CC0000" },
  { slug: "nytimes",      name: "NY Times",      url: "nytimes.com",          era: { start: 1996 },                    color: "#111111" },
  { slug: "guardian",     name: "The Guardian",  url: "theguardian.com",      era: { start: 1999 },                    color: "#052962" },
  { slug: "wapo",         name: "Washington Post", url: "washingtonpost.com", era: { start: 1996 },                    color: "#1A1A1A" },
  { slug: "reuters",      name: "Reuters",       url: "reuters.com",          era: { start: 1996 },                    color: "#FF8000" },
  { slug: "bloomberg",    name: "Bloomberg",     url: "bloomberg.com",        era: { start: 1996 },                    color: "#2496ED" },
  { slug: "aljazeera",    name: "Al Jazeera",    url: "aljazeera.com",        era: { start: 1996 },                    color: "#BB0F0F" },
  { slug: "abcnews",      name: "ABC News",      url: "abcnews.go.com",       era: { start: 1996 },                    color: "#005EB8" },
  { slug: "foxnews",      name: "Fox News",      url: "foxnews.com",          era: { start: 1998 },                    color: "#003B71" },
  { slug: "msnbc",        name: "MSNBC",         url: "msnbc.com",            era: { start: 1996, end: 2012 },         color: "#0072BC" },
  { slug: "espn",         name: "ESPN",          url: "espn.com",             era: { start: 1995 },                    color: "#E21C24" },
  { slug: "drudge",       name: "Drudge Report", url: "drudgereport.com",     era: { start: 1995 },                    color: "#FF0000" },
  { slug: "huffpost",     name: "HuffPost",      url: "huffingtonpost.com",   era: { start: 2005 },                    color: "#D44500" },
  { slug: "buzzfeed",     name: "BuzzFeed",      url: "buzzfeed.com",         era: { start: 2006 },                    color: "#F7DC6F" },
  { slug: "mashable",     name: "Mashable",      url: "mashable.com",         era: { start: 2005 },                    color: "#85BF25" },
  { slug: "techcrunch",   name: "TechCrunch",    url: "techcrunch.com",       era: { start: 2005 },                    color: "#0F0F0F" },
  { slug: "engadget",     name: "Engadget",      url: "engadget.com",         era: { start: 2004 },                    color: "#FF9900" },
  { slug: "cnet",         name: "CNET",          url: "cnet.com",             era: { start: 1994 },                    color: "#1B4F9C" },
  { slug: "arstechnica",  name: "Ars Technica",  url: "arstechnica.com",      era: { start: 1998 },                    color: "#F26522" },
  { slug: "wired",        name: "Wired",         url: "wired.com",            era: { start: 1993 },                    color: "#111111" },
  { slug: "theverge",     name: "The Verge",     url: "theverge.com",         era: { start: 2011 },                    color: "#D93025" },
  { slug: "vox",          name: "Vox",           url: "vox.com",              era: { start: 2014 },                    color: "#4C9A2A" },

  // --- Não-notícias (fora da busca geral; ok via ?site=) ---
  { slug: "google",    name: "Google",    url: "google.com",    era: { start: 1998 },            color: "#4285F4", nonNews: true },
  { slug: "youtube",   name: "YouTube",   url: "youtube.com",   era: { start: 2005 },            color: "#FF0000", nonNews: true },
  { slug: "wikipedia", name: "Wikipedia", url: "wikipedia.org", era: { start: 2001 },            color: "#000000", nonNews: true },
  { slug: "yahoo",     name: "Yahoo",     url: "yahoo.com",     era: { start: 1994 },            color: "#6001D2", nonNews: true },
  { slug: "msn",       name: "MSN",       url: "msn.com",        era: { start: 1995 },            color: "#0078D4", nonNews: true },
  { slug: "geocities", name: "GeoCities", url: "geocities.com",  era: { start: 1994, end: 2009 }, color: "#00A650", nonNews: true },

  // --- Redes sociais (loginWall: fora da busca geral, ok via ?site=) ---
  { slug: "orkut",     name: "Orkut",     url: "orkut.com",      era: { start: 1998, end: 2014 }, color: "#ED2590", loginWall: true },
  { slug: "facebook",  name: "Facebook",  url: "facebook.com",   era: { start: 2004 },            color: "#1877F2", loginWall: true },
  { slug: "twitter",   name: "Twitter/X", url: "twitter.com",    era: { start: 2006 },            color: "#000000", loginWall: true },
  { slug: "instagram", name: "Instagram", url: "instagram.com",  era: { start: 2010 },            color: "#E4405F", loginWall: true },
];

/** Portais de notícias ativos na data (por ano).
 *  Regra: fora da era → não entra; loginWall ou nonNews → só via busca por URL. */
export function sitesForDate(date: string): SiteEntry[] {
  const year = Number(date.slice(0, 4));
  return SITES.filter(
    (s) =>
      !s.loginWall &&
      !s.nonNews &&
      year >= s.era.start &&
      (s.era.end === undefined || year <= s.era.end)
  );
}
