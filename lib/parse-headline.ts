import * as cheerio from "cheerio";

/**
 * Extrai a manchete/título do HTML arquivado.
 * Ordem: h1 → title → primeiro link dentro de <header>.
 */
export function extractHeadline(html: string): string | null {
  const $ = cheerio.load(html);

  const h1 = $("h1").first().text().trim();
  if (h1) return h1.slice(0, 120);

  const title = $("title").first().text().trim();
  if (title) return title.slice(0, 120);

  const headerLink = $("header a").first().text().trim();
  if (headerLink) return headerLink.slice(0, 120);

  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim();
  if (ogTitle) return ogTitle.slice(0, 120);

  const description = $('meta[name="description"]').attr("content")?.trim();
  if (description) return description.slice(0, 120);

  return null;
}
