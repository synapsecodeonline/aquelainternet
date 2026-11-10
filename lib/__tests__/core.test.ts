import { describe, it, expect } from "vitest";
import { isValidDate } from "../date";
import { normalizeHost, iframeUrl, isJunkPage, rawHtmlUrl } from "../wayback";
import { extractHeadline, extractTopHeadlines, extractCardHeadline } from "../parse-headline";
import { eraForDate } from "../era";
import { sitesForDate } from "../sites";
import { normalizeTopic, topicMatch } from "../topic";
import type { SnapshotRecord } from "@/types";

describe("isValidDate", () => {
  it("aceita datas reais", () => {
    expect(isValidDate("2014-07-07")).toBe(true);
    expect(isValidDate("2000-02-29")).toBe(true); // bissexto
    expect(isValidDate("1994-01-01")).toBe(true);
  });

  it("rejeita formato inválido", () => {
    expect(isValidDate("07/07/2014")).toBe(false);
    expect(isValidDate("2014-7-7")).toBe(false);
    expect(isValidDate("")).toBe(false);
    expect(isValidDate("abc")).toBe(false);
  });

  it("rejeita datas inexistentes", () => {
    expect(isValidDate("2020-13-99")).toBe(false);
    expect(isValidDate("2019-02-29")).toBe(false); // não bissexto
    expect(isValidDate("2021-04-31")).toBe(false);
  });
});

describe("normalizeHost", () => {
  it("normaliza hosts", () => {
    expect(normalizeHost("uol.com.br")).toBe("uol.com.br");
    expect(normalizeHost("https://www.uol.com.br/")).toBe("uol.com.br");
    expect(normalizeHost("WWW.Globo.com")).toBe("globo.com");
    expect(normalizeHost("orkut.com.")).toBe("orkut.com");
  });

  it("rejeita entradas inválidas", () => {
    expect(normalizeHost("")).toBe("");
    expect(normalizeHost("not a host")).toBe("");
    expect(normalizeHost("localhost")).toBe("");
  });
});

describe("iframeUrl", () => {
  it("adiciona modificador if_", () => {
    expect(
      iframeUrl("https://web.archive.org/web/20140707002758/http://www.google.com/")
    ).toBe("https://web.archive.org/web/20140707002758if_/http://www.google.com/");
  });

  it("não altera URL sem /web/{ts}/", () => {
    expect(iframeUrl("https://example.com/foo")).toBe("https://example.com/foo");
  });
});

describe("rawHtmlUrl", () => {
  it("gera URL id_ a partir do snapshot", () => {
    expect(
      rawHtmlUrl({
        snapshotUrl: "https://web.archive.org/web/20140707/http://a.com/",
        timestamp: "20140707000000",
        status: "200",
      })
    ).toBe("https://web.archive.org/web/20140707000000id_/http://a.com/");
  });
});

describe("isJunkPage", () => {
  it("rejeita HTML vazio ou curto", () => {
    expect(isJunkPage("")).toBe(true);
    expect(isJunkPage("<html><body>oi</body></html>")).toBe(true);
  });

  it("rejeita domínio estacionado", () => {
    const html = `<html><head><title>Domain for sale</title></head><body>${"x".repeat(600)} DomainValet parking</body></html>`;
    expect(isJunkPage(html)).toBe(true);
  });

  it("rejeita erro do Wayback", () => {
    const html = `<html><body>Wayback Machine error: page not archived ${"x".repeat(600)}</body></html>`;
    expect(isJunkPage(html)).toBe(true);
  });

  it("aceita página com conteúdo", () => {
    const html = `<html><head><title>UOL - Notícias</title></head><body>${"<p>notícia real</p>".repeat(100)}</body></html>`;
    expect(isJunkPage(html)).toBe(false);
  });
});

describe("extractHeadline", () => {
  it("prefere h1", () => {
    const html = `<html><body><h1>Manchete Principal</h1><title>Outro</title></body></html>`;
    expect(extractHeadline(html)).toBe("Manchete Principal");
  });

  it("cai pro title sem h1", () => {
    const html = `<html><head><title>  Título da Página  </title></head><body></body></html>`;
    expect(extractHeadline(html)).toBe("Título da Página");
  });

  it("cai pro og:title/meta description", () => {
    const html = `<html><head><meta property="og:title" content="OG Title"><meta name="description" content="desc"></head><body></body></html>`;
    expect(extractHeadline(html)).toBe("OG Title");
  });

  it("retorna null sem nada", () => {
    expect(extractHeadline("<html><body></body></html>")).toBeNull();
  });
});

describe("extractTopHeadlines / extractCardHeadline", () => {
  const portal = `<html><head><title>UOL - Notícias e informações</title></head><body>
    <header><nav>
      <a href="#">Esportes</a><a href="#">Entretenimento</a><a href="#">Política</a>
    </nav></header>
    <main>
      <h2 class="title">Mercado financeiro fecha em alta com fluxo estrangeiro recorde</h2>
      <h2>Seleção brasileira define lista final convocada para a Copa</h2>
      <a class="headline-link" href="#">Governo anuncia novo pacote de medidas econômicas para o país</a>
      <a class="headline-link" href="#">Prefeitura inaugura nova linha de metrô na capital hoje</a>
      <a href="#">Ler mais sobre o assunto</a>
    </main></body></html>`;

  it("extrai chamadas de matéria reais, ignorando nav e 'ler mais'", () => {
    const tops = extractTopHeadlines(portal);
    expect(tops.length).toBeGreaterThanOrEqual(4);
    expect(tops[0]).toContain("Mercado financeiro");
    expect(tops.join(" ")).not.toContain("Esportes");
    expect(tops.join(" ")).not.toContain("Ler mais");
  });

  it("deduplica textos repetidos", () => {
    const html = `<html><body>
      <h2>Governo anuncia pacote de medidas para a economia brasileira</h2>
      <h3>Governo anuncia pacote de medidas para a economia brasileira</h3>
    </body></html>`;
    expect(extractTopHeadlines(html).length).toBe(1);
  });

  it("extractCardHeadline une até 4 manchetes e remove nome do site", () => {
    const html = `<html><body>
      <h1>UOL - Portal de notícias e informações do Brasil</h1>
      <h2>Economia tem melhor semana do ano com queda do dólar</h2>
      <h2>Justiça determina investigação sobre contratos públicos</h2>
    </body></html>`;
    const h = extractCardHeadline(html, "UOL");
    expect(h).toContain("Economia tem melhor semana");
    expect(h).toContain("Justiça determina investigação");
    expect(h).not.toContain("UOL - Portal");
    expect(h?.split(" · ").length).toBeLessThanOrEqual(4);
  });

  it("cai no extrator antigo quando não há chamadas", () => {
    const html = `<html><head><title>Artigo específico</title></head><body><p>texto</p></body></html>`;
    expect(extractCardHeadline(html)).toBe("Artigo específico");
  });
});

describe("eraForDate", () => {
  it("classifica eras", () => {
    expect(eraForDate("1994-01-01").label).toBe("Pré-história");
    expect(eraForDate("2001-09-11").label).toBe("Primeiros passos do Google");
    expect(eraForDate("2005-06-15").label).toBe("Orkut, YouTube e Facebook chegam");
    expect(eraForDate("2010-01-01").label).toBe("A febre do Orkut");
    expect(eraForDate("2014-07-07").label).toBe("Facebook e Instagram explodem");
    expect(eraForDate("2018-05-10").label).toBe("A internet no bolso");
    expect(eraForDate("2020-03-15").label).toBe("Pandemia e home office");
  });
});

describe("sitesForDate", () => {
  it("exclui sites com loginWall", () => {
    const sites = sitesForDate("2014-07-07");
    expect(sites.length).toBeGreaterThan(0);
    expect(sites.every((s) => !s.loginWall)).toBe(true);
    expect(sites.map((s) => s.slug)).not.toContain("facebook");
  });

  it("busca geral só tem portais de notícias (exclui nonNews)", () => {
    const sites = sitesForDate("2014-07-07");
    expect(sites.every((s) => !s.nonNews)).toBe(true);
    expect(sites.map((s) => s.slug)).not.toContain("google");
    expect(sites.map((s) => s.slug)).not.toContain("wikipedia");
    expect(sites.map((s) => s.slug)).not.toContain("geocities");
  });

  it("respeita o fim de era dos sites", () => {
    // Época encerrou ~2018: presente em 2005, ausente em 2020
    expect(sitesForDate("2005-06-15").map((s) => s.slug)).toContain("epoca");
    expect(sitesForDate("2020-01-01").map((s) => s.slug)).not.toContain("epoca");
    // Orkut (loginWall) nunca aparece na busca geral
    expect(sitesForDate("2008-01-01").map((s) => s.slug)).not.toContain("orkut");
  });
});

describe("topicMatch", () => {
  const rec = (over: Partial<SnapshotRecord>): SnapshotRecord => ({
    siteSlug: "x",
    siteName: "UOL",
    siteColor: "#fff",
    requestedDate: "2014-07-07",
    snapshotTimestamp: "20140707120000",
    snapshotUrl: "https://web.archive.org/web/20140707120000/http://uol.com.br/",
    statusCode: 200,
    headline: "Eleições: candidatos participam de debate na TV",
    available: true,
    ...over,
  });

  it("casa por manchete ignorando acentos e caixa", () => {
    expect(topicMatch(rec({}), "eleicoes")).toBe(true);
    expect(topicMatch(rec({}), "ELEIÇÕES")).toBe(true);
    expect(topicMatch(rec({}), "debate")).toBe(true);
  });

  it("casa por nome do site e URL", () => {
    expect(topicMatch(rec({ headline: null }), "uol")).toBe(true);
    expect(topicMatch(rec({ headline: null, siteName: "Folha" }), "uol.com.br")).toBe(true);
  });

  it("rejeita termos ausentes e query vazia aceita tudo", () => {
    expect(topicMatch(rec({}), "futebol")).toBe(false);
    expect(topicMatch(rec({}), "   ")).toBe(true);
    expect(normalizeTopic("Ação!")).toBe("acao!");
  });
});
